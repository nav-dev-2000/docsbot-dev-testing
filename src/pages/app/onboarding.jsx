import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import Alert from '@/components/Alert'
import PresetPromptSelect from '@/components/PresetPromptSelect'
import classNames from '@/utils/classNames'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import { i18n } from '@/constants/strings.constants'
import useCreateBot from '@/hooks/useCreateBot'
import {
  analyzeSiteForBot,
  getBotRequest,
  updateBotRequest,
} from '@/services/bots'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import { checkPlanPermission, stripePlan } from '@/utils/helpers'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import SourceForm from '@/components/SourceForm'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeStatusSource from '@/components/BadgeStatusSource'
import ModalCheckout from '@/components/ModalCheckout'
import {
  ChevronRightIcon,
  XMarkIcon,
  PhotoIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import docsbotLogo from '@/images/docsbot-logo.png'
import {
  RobotAnimation,
  RobotAnimationThinking,
  RobotAnimationCongrats,
  RobotAnimationTraining,
} from '@/components/RobotAnimation'
import WidgetPreview from '@/components/WidgetPreview'
import Tooltip from '@/components/Tooltip'
import IntegrationsGrid from '@/components/IntegrationsGrid'
import Confetti from 'react-confetti'
import circuitBg from '@/images/circuit.png'
import robotPointRight from '@/images/robot-point-right.webp'
import { ref, uploadBytes } from 'firebase/storage'
import { storage, auth } from '@/config/firebase-ui.config'
import { v4 as uuidv4 } from 'uuid'
import { usePostHog } from 'posthog-js/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import clsx from 'clsx'
import { SketchPicker } from 'react-color'
import { SIGNUP_ONBOARDING_CACHE_KEY } from '@/constants/storageKeys.constants'
import {
  validateWebsiteInput,
  usageTypeToPromptKey,
  WEBSITE_PATH_WARNING_COPY,
} from '@/utils/websiteValidation'

const DEFAULT_PROMPT_KEY = 'CUSTOMER_SUPPORT'
const ONBOARDING_SESSION_KEY = 'docsbot-onboarding-state'

const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#FFEB3B',
  '#FF9800',
  '#FF5722',
  '#607D8B',
  '#FFFFFF',
  '#000000',
]

const ANALYZING_STEPS = [
  "I'm crawling your website...",
  'Retrieving your brand assets & colors...',
  'Reading through your content...',
  'Understanding your business...',
  'Generating your custom configuration...',
]

const isColorLight = (hexColor) => {
  if (!hexColor) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

const getInitialColor = (color) => {
  // If no color or default color, randomly select from presets
  if (!color || color === '#0ea5e9') {
    const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length)
    return PRESET_COLORS[randomIndex]
  }
  return color
}

const selectBestLogo = (logos, selectedColor) => {
  if (!logos || logos.length === 0) return ''

  const isLight = isColorLight(selectedColor)
  const targetMode = isLight ? 'light' : 'dark'

  // Separate logos by type
  const fullLogos = logos.filter((logo) => logo.type === 'logo')
  const iconLogos = logos.filter((logo) => logo.type === 'icon')

  // Priority 1: Logo with matching color mode
  const matchingLogo = fullLogos.find((logo) => logo.mode === targetMode)
  if (matchingLogo) return matchingLogo.url

  // Priority 2: Icon with matching color mode
  const matchingIcon = iconLogos.find((logo) => logo.mode === targetMode)
  if (matchingIcon) return matchingIcon.url

  // Priority 3: Logo with opaque background
  const opaqueLogo = fullLogos.find(
    (logo) => logo.mode === 'has_opaque_background',
  )
  if (opaqueLogo) return opaqueLogo.url

  // Priority 4: Icon with opaque background
  const opaqueIcon = iconLogos.find(
    (logo) => logo.mode === 'has_opaque_background',
  )
  if (opaqueIcon) return opaqueIcon.url

  // Final fallback: any logo or icon
  return fullLogos[0]?.url || iconLogos[0]?.url || logos[0]?.url || ''
}

const buildPrompt = (key, name, description) => {
  const template =
    PRESET_PROMPTS[key] || PRESET_PROMPTS[DEFAULT_PROMPT_KEY] || {}
  return (template.prompt || PRESET_PROMPTS[DEFAULT_PROMPT_KEY]?.prompt || '')
    .replace(/{company_name}/g, name || 'your company')
    .replace(/{product_info}/g, description || '')
    .replace(/{old_prompt}\\n/g, '')
    .replace(/{old_prompt}/g, '')
}

const getTemplateTemperature = (key) => {
  const template = PRESET_PROMPTS[key]
  return template?.temperature !== undefined ? template.temperature : 0
}

const getDefaultFirstMessage = (language) => {
  if (language && i18n[language]?.labels?.firstMessage) {
    return i18n[language].labels.firstMessage
  }
  return i18n.en.labels.firstMessage
}

const normalizeLanguageCode = (language) => {
  const normalized = language?.toLowerCase?.()
  const mapped = normalized === 'ja' ? 'jp' : normalized
  return i18n[mapped] ? mapped : 'en'
}

const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const browserLanguage = window.navigator?.language?.split('-')[0]?.toLowerCase()
    if (browserLanguage) {
      return normalizeLanguageCode(browserLanguage)
    }
  }

  return 'en'
}

const getDynamicBotNamePlaceholder = (promptKey, websiteUrl) => {
  // Extract company name from website URL if available
  let companyName = 'Acme'
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`)
      const hostname = url.hostname.replace('www.', '')
      // Extract domain name (e.g., "acme.com" -> "Acme")
      const domainParts = hostname.split('.')
      if (domainParts.length > 0) {
        const domainName = domainParts[0]
        companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1)
      }
    } catch (e) {
      // Keep default if URL parsing fails
    }
  }
  const promptLabel = PRESET_PROMPTS[promptKey]?.label || 'Support Agent'
  return `${companyName} ${promptLabel}`
}

const languageOptions = Object.keys(i18n)

const FOOTER_STEPS = [
  { key: 'start', name: 'Start' },
  { key: 'knowledge', name: 'Knowledge sources' },
  { key: 'branding', name: 'Widget design' },
  { key: 'testing', name: 'Test & Adjust' },
  { key: 'deploy', name: 'Deploy' },
  { key: 'congratulations', name: 'Congratulations' },
]

const buildFooterSteps = (currentStep) => {
  let activeIndex = 0
  if (currentStep <= 0) {
    activeIndex = 0
  } else if (currentStep === 1) {
    activeIndex = 1
  } else if (currentStep === 2) {
    activeIndex = 2
  } else if (currentStep === 3) {
    activeIndex = 3
  } else if (currentStep === 4) {
    activeIndex = 4
  } else if (currentStep >= 5) {
    activeIndex = 5
  }

  const isComplete = currentStep >= 6

  return FOOTER_STEPS.map((step, index) => {
    let status = 'upcoming'
    if (isComplete) {
      status = 'complete'
    } else if (index < activeIndex) {
      status = 'complete'
    } else if (index === activeIndex) {
      status = 'current'
    }
    return { ...step, status }
  })
}

const OnboardingProgress = ({ currentStep }) => {
  const steps = buildFooterSteps(currentStep)
  const currentIndex = steps.findIndex((step) => step.status === 'current')
  const displayIndex = currentIndex === -1 ? steps.length : currentIndex + 1

  return (
    <nav aria-label="Progress" className="flex items-center justify-center">
      <p className="text-sm font-medium text-gray-900">
        Step {displayIndex} of {steps.length}
      </p>
      <ol role="list" className="ml-6 hidden items-center space-x-5 sm:ml-8 sm:flex">
        {steps.map((step) => (
          <li key={step.key}>
            {step.status === 'complete' ? (
              <span className="block size-2.5 rounded-full bg-cyan-600" />
            ) : step.status === 'current' ? (
              <span className="relative flex items-center justify-center">
                <span aria-hidden="true" className="absolute flex size-5 p-px">
                  <span className="size-full rounded-full bg-cyan-50" />
                </span>
                <span
                  aria-hidden="true"
                  className="relative block size-2.5 rounded-full bg-cyan-600"
                />
              </span>
            ) : (
              <span className="block size-2.5 rounded-full bg-gray-200" />
            )}
            <span className="sr-only">{step.name}</span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Onboarding({ team }) {
  const router = useRouter()
  const posthog = usePostHog()
  const [user] = useAuthState(auth)

  const [currentStep, setCurrentStep] = useState(0)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState('')
  const [useManualEntry, setUseManualEntry] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [botName, setBotName] = useState('')
  const [botDescription, setBotDescription] = useState('')
  const [botLanguage, setBotLanguage] = useState(getInitialLanguage)
  const [firstMessage, setFirstMessage] = useState(() =>
    getDefaultFirstMessage(getInitialLanguage()),
  )
  const [firstMessageEdited, setFirstMessageEdited] = useState(false)
  const [promptKey, setPromptKey] = useState(DEFAULT_PROMPT_KEY)
  const [agentPrompt, setAgentPrompt] = useState(
    buildPrompt(DEFAULT_PROMPT_KEY, '', ''),
  )
  const [promptEdited, setPromptEdited] = useState(false)
  const [temperature, setTemperature] = useState(
    getTemplateTemperature(DEFAULT_PROMPT_KEY),
  )
  const [supportLink, setSupportLink] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('#0ea5e9')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [widgetType, setWidgetType] = useState('other')
  const [stepError, setStepError] = useState(null)
  const [urlError, setUrlError] = useState('')
  const [createdBot, setCreatedBot] = useState(null)
  const [hasHydratedSession, setHasHydratedSession] = useState(false)
  const [botSources, setBotSources] = useState([])
  const [isFetchingSources, setIsFetchingSources] = useState(false)
  const [hasLoadedInitialSources, setHasLoadedInitialSources] = useState(false)
  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const [sourceModalType, setSourceModalType] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isBrandingSaving, setIsBrandingSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const [hasUnsavedPromptChanges, setHasUnsavedPromptChanges] = useState(false)
  const [savedAgentPrompt, setSavedAgentPrompt] = useState('')
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const [hasPrefilledWebsiteSource, setHasPrefilledWebsiteSource] =
    useState(false)
  const [prefillWebsiteSourceData, setPrefillWebsiteSourceData] = useState(null)
  const [prefillUrl, setPrefillUrl] = useState(null)
  const [agentInstructionsModalOpen, setAgentInstructionsModalOpen] =
    useState(false)
  const [hasInteractedWithBot, setHasInteractedWithBot] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showRobotPointer, setShowRobotPointer] = useState(false)
  const [selectedModalPreset, setSelectedModalPreset] = useState('')
  const [copiedLink, setCopiedLink] = useState(null)
  const logoRef = useRef(null)
  const colorPickerRef = useRef(null)
  const savePromptButtonRef = useRef(null)
  const analyzingIntervalRef = useRef(null)
  const botSourcesRef = useRef([])
  const signupSeedAppliedRef = useRef(false)
  const autoAnalysisTriggeredRef = useRef(false)
  const trimmedWebsiteUrl = websiteUrl.trim()
  const websiteValidationResult = useMemo(() => {
    if (!trimmedWebsiteUrl) {
      return {
        valid: false,
        error: '',
        hasPathWarning: false,
        normalizedUrl: '',
      }
    }
    const result = validateWebsiteInput(trimmedWebsiteUrl)
    if (!result.valid) {
      return {
        valid: false,
        error: result.error || '',
        hasPathWarning: false,
        normalizedUrl: '',
      }
    }
    return {
      valid: true,
      error: '',
      hasPathWarning: Boolean(result.hasPathWarning),
      normalizedUrl: result.normalizedUrl,
    }
  }, [trimmedWebsiteUrl])
  const isUrlValid = websiteValidationResult.valid
  const hasUrlPathWarning = websiteValidationResult.hasPathWarning
  const {
    createBot,
    isCreating,
    error: createError,
    resetError,
  } = useCreateBot(team)

  useEffect(() => {
    if (useManualEntry) {
      setUrlError('')
      setAnalysisData(null)
    }
  }, [useManualEntry])

  useEffect(() => {
    // Close color picker when clicking outside
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (analyzingIntervalRef.current) {
        clearInterval(analyzingIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!promptEdited) {
      // Use businessDescription from brandAnalysis if available
      const productInfo =
        createdBot?.brandAnalysis?.businessDescription || botDescription
      const nextPrompt = buildPrompt(promptKey, botName, productInfo)
      setAgentPrompt((prev) => (prev === nextPrompt ? prev : nextPrompt))
      setSavedAgentPrompt((prev) => (prev === nextPrompt ? prev : nextPrompt))
    }
  }, [
    promptKey,
    botName,
    botDescription,
    promptEdited,
    createdBot?.brandAnalysis?.businessDescription,
  ])

  // Show robot pointer with 500ms delay after iframe loads
  useEffect(() => {
    if (iframeLoaded) {
      const timer = setTimeout(() => {
        setShowRobotPointer(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowRobotPointer(false)
    }
  }, [iframeLoaded])

  useEffect(() => {
    if (!firstMessageEdited) {
      const message = getDefaultFirstMessage(botLanguage)
      setFirstMessage((prev) => (prev === message ? prev : message))
    }
  }, [botLanguage, firstMessageEdited])

  useEffect(() => {
    if (!websiteUrl || !lastAnalyzedUrl) return

    const normalizedCurrent = websiteValidationResult.valid
      ? websiteValidationResult.normalizedUrl
      : websiteUrl.trim()

    if (normalizedCurrent && normalizedCurrent !== lastAnalyzedUrl) {
      setAnalysisData(null)
      setUrlError('')
    }
  }, [
    websiteUrl,
    lastAnalyzedUrl,
    websiteValidationResult.valid,
    websiteValidationResult.normalizedUrl,
  ])

  const refreshBotData = useCallback(
    async (botIdParam) => {
      const targetBotId = botIdParam || createdBot?.id
      if (!team?.id || !targetBotId) return
      try {
        const botData = await getBotRequest(team.id, targetBotId)
        if (botData) {
          setCreatedBot((prev) => ({
            ...prev,
            ...botData,
            sourceCount: prev?.sourceCount ?? botData.sourceCount,
          }))
        }
      } catch (error) {
        console.error('Failed to refresh bot data', error)
      }
    },
    [team?.id, createdBot?.id],
  )

  const loadSources = useCallback(
    async (botIdParam, silent = false) => {
      const targetBotId = botIdParam || createdBot?.id
      if (!team?.id || !targetBotId) return
      if (!silent) {
        setIsFetchingSources(true)
      }
      try {
        const response = await fetch(
          `/api/teams/${team.id}/bots/${targetBotId}/sources`,
        )
        if (!response.ok) {
          throw new Error('Failed to load sources')
        }
        const data = await response.json()
        const previousSources = botSourcesRef.current
        const newSources = data?.sources || []
        
        setBotSources(newSources)
        botSourcesRef.current = newSources
        setHasLoadedInitialSources(true)
        if (typeof data?.pagination?.totalCount === 'number') {
          setCreatedBot((prev) =>
            prev ? { ...prev, sourceCount: data.pagination.totalCount } : prev,
          )
        }

        // If sources just finished training (went from pending to ready), refresh bot data
        const hadPendingSources = previousSources.some(
          (source) =>
            !source.status ||
            !['ready', 'failed', 'warning'].includes(source.status) ||
            source.refreshing,
        )
        const hasPendingSources = newSources.some(
          (source) =>
            !source.status ||
            !['ready', 'failed', 'warning'].includes(source.status) ||
            source.refreshing,
        )
        
        if (hadPendingSources && !hasPendingSources) {
          // Sources just finished, refresh bot data to get updated status
          await refreshBotData(targetBotId)
        }
      } catch (error) {
        console.error('Failed to load sources', error)
      } finally {
        if (!silent) {
          setIsFetchingSources(false)
        }
      }
    },
    [team?.id, createdBot?.id, refreshBotData],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!team?.id || hasHydratedSession) return

    const storedValue = window.sessionStorage.getItem(ONBOARDING_SESSION_KEY)
    if (!storedValue) {
      setHasHydratedSession(true)
      return
    }

    let parsed
    try {
      parsed = JSON.parse(storedValue)
    } catch (error) {
      console.error('Failed to parse onboarding session', error)
      window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY)
      setHasHydratedSession(true)
      return
    }

    const savedStep =
      typeof parsed.currentStep === 'number' ? parsed.currentStep : null
    if (savedStep !== null && !Number.isNaN(savedStep)) {
      const normalizedStep = Math.min(5, Math.max(0, savedStep))
      setCurrentStep((prev) =>
        prev === normalizedStep ? prev : normalizedStep,
      )
    }

    if (!parsed.botId) {
      setHasHydratedSession(true)
      return
    }

    let cancelled = false

    const hydrateBot = async () => {
      try {
        const botData = await getBotRequest(team.id, parsed.botId)
        if (cancelled || !botData) return

        setCreatedBot(botData)
        setBotName(botData.name || '')
        setBotDescription(botData.description || '')
        const hydratedLanguage = normalizeLanguageCode(botData.language)
        setBotLanguage(hydratedLanguage)
        setAgentPrompt(botData.agentPrompt || '')
        setSavedAgentPrompt(botData.agentPrompt || '')
        if (typeof botData.temperature === 'number') {
          setTemperature(botData.temperature)
        }
        setSupportLink(botData.supportLink || '')
        setLogoUrl(botData.logo || '')
        setBrandColor(getInitialColor(botData.color))
        setWidgetType(botData.widgetType || 'other')

        // Restore cached analysis data if available
        if (botData.brandAnalysis) {
          setAnalysisData(botData.brandAnalysis)
        }

        const labels = botData.labels || {}
        const restoredMessage =
          typeof labels.firstMessage === 'string'
            ? labels.firstMessage
            : getDefaultFirstMessage(hydratedLanguage)
        setFirstMessage(restoredMessage)
        setFirstMessageEdited(true)
        setPromptEdited(true)

        loadSources(botData.id)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to hydrate onboarding session', error)
          window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY)
          setCurrentStep((step) => (step === 0 ? step : 0))
        }
      } finally {
        if (!cancelled) {
          setHasHydratedSession(true)
        }
      }
    }

    hydrateBot()

    return () => {
      cancelled = true
    }
  }, [team?.id, hasHydratedSession, loadSources])

  // Check bot limit after session hydration - only redirect if no bot in progress
  useEffect(() => {
    if (!hasHydratedSession || !team?.id) return

    // If there's a bot being managed, allow access
    if (createdBot) return

    // Check if bot limit is reached
    if (stripePlan(team).bots <= team.botCount) {
      router.push('/app/bots')
    }
  }, [hasHydratedSession, team, createdBot, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasHydratedSession) return
    if (signupSeedAppliedRef.current) return

    const teamBotCount =
      typeof team?.botCount === 'number' ? team.botCount : 0

    if (createdBot || teamBotCount > 0) {
      window.localStorage.removeItem(SIGNUP_ONBOARDING_CACHE_KEY)
      signupSeedAppliedRef.current = true
      return
    }

    const stored = window.localStorage.getItem(
      SIGNUP_ONBOARDING_CACHE_KEY,
    )
    if (!stored) {
      signupSeedAppliedRef.current = true
      return
    }

    let parsed = null
    try {
      parsed = JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse signup onboarding cache', error)
      window.localStorage.removeItem(SIGNUP_ONBOARDING_CACHE_KEY)
      signupSeedAppliedRef.current = true
      return
    }

    const { usageType: cachedUsageType, site: cachedSite, timestamp } =
      parsed || {}

    if (typeof timestamp === 'number') {
      const oneDayMs = 24 * 60 * 60 * 1000
      if (Date.now() - timestamp > oneDayMs) {
        window.localStorage.removeItem(SIGNUP_ONBOARDING_CACHE_KEY)
        signupSeedAppliedRef.current = true
        return
      }
    }

    if (typeof cachedUsageType === 'string' && !promptEdited) {
      const presetKey = usageTypeToPromptKey(cachedUsageType)
      if (
        presetKey &&
        PRESET_PROMPTS[presetKey] &&
        presetKey !== promptKey
      ) {
        setPromptKey(presetKey)
        setPromptEdited(false)
        setTemperature(getTemplateTemperature(presetKey))
      }
    }

    if (
      typeof cachedSite === 'string' &&
      cachedSite.trim() &&
      !websiteUrl.trim()
    ) {
      const validation = validateWebsiteInput(cachedSite.trim())
      if (validation.valid && !validation.hasPathWarning) {
        setWebsiteUrl(validation.normalizedUrl)
        setUseManualEntry(false)
      }
    }

    signupSeedAppliedRef.current = true
  }, [
    hasHydratedSession,
    createdBot,
    team,
    promptEdited,
    promptKey,
    websiteUrl,
    setPromptKey,
    setPromptEdited,
    setTemperature,
    setWebsiteUrl,
    setUseManualEntry,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const teamBotCount =
      typeof team?.botCount === 'number' ? team.botCount : 0
    if (createdBot || teamBotCount > 0) {
      window.localStorage.removeItem(SIGNUP_ONBOARDING_CACHE_KEY)
    }
  }, [createdBot, team])


  const localizedLabels = useMemo(
    () => ({
      ...(i18n[botLanguage]?.labels || i18n.en.labels),
      firstMessage: firstMessage || getDefaultFirstMessage(botLanguage),
    }),
    [botLanguage, firstMessage],
  )

  // Helper to track onboarding errors
  const trackOnboardingError = useCallback((errorMessage, step = currentStep) => {
    if (!posthog) return

    const stepNames = {
      0: 'Website URL Entry',
      1: 'Add Sources',
      2: 'Customize Branding',
      3: 'Test Bot',
      4: 'Complete',
      5: 'Deploy',
    }

    posthog.capture('Onboarding Error', {
      message: errorMessage,
      step,
      step_name: stepNames[step] || 'Unknown',
      bot_id: createdBot?.id || null,
      team_id: team?.id || null,
    })
  }, [posthog, currentStep, createdBot?.id, team?.id])

  const ensureBotCreated = useCallback(
    async (overrides = {}) => {
      if (createdBot || isCreating) {
        return createdBot
      }

      const name = (overrides.name ?? botName)?.trim()
      if (!name) {
        return null
      }

      const descriptionValue = overrides.description ?? botDescription
      const languageValue = normalizeLanguageCode(
        overrides.language ?? botLanguage,
      )
      const supportLinkValue = overrides.supportLink ?? supportLink
      const logoValue = overrides.logo ?? logoUrl
      const colorValue = overrides.color ?? brandColor
      const widgetValue = overrides.widgetType ?? widgetType
      const promptValue = overrides.agentPrompt ?? agentPrompt
      const temperatureValue = overrides.temperature ?? temperature
      const brandAnalysisValue = overrides.brandAnalysis ?? null
      const labelsValue = overrides.labels ?? {
        ...(i18n[languageValue]?.labels || i18n.en.labels),
        firstMessage:
          overrides.firstMessage ??
          (firstMessage || getDefaultFirstMessage(languageValue)),
      }

      resetError()
      try {
        const botPayload = {
          name,
          description: descriptionValue || '',
          privacy: 'public',
          model: 'gpt-4.1-mini',
          language: languageValue,
          labels: labelsValue,
          temperature: temperatureValue,
          agentPrompt: promptValue,
          color: colorValue || '',
          supportLink: supportLinkValue,
          logo: logoValue,
          widgetType: widgetValue,
        }

        // Add brand analysis data if available
        if (brandAnalysisValue) {
          botPayload.brandAnalysis = brandAnalysisValue
        }

        const bot = await createBot(botPayload)
        setCreatedBot(bot)

        // Sync all local state with the returned bot object for safety
        setBotName(bot.name || '')
        setBotDescription(bot.description || '')
        setBotLanguage(normalizeLanguageCode(bot.language))
        setSupportLink(bot.supportLink || '')
        setLogoUrl(bot.logo || '')
        setBrandColor(getInitialColor(bot.color))
        setWidgetType(bot.widgetType || 'other')
        setAgentPrompt(bot.agentPrompt || '')
        setSavedAgentPrompt(bot.agentPrompt || '')
        if (typeof bot.temperature === 'number') {
          setTemperature(bot.temperature)
        }
        if (bot.labels?.firstMessage) {
          setFirstMessage(bot.labels.firstMessage)
        }

        // Restore cached analysis data if it was saved
        if (bot.brandAnalysis) {
          setAnalysisData(bot.brandAnalysis)
        }

      await loadSources(bot.id)
      return bot
    } catch (error) {
      const errorMsg = error.message || 'Unable to create your bot. Please try again.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 0)
      throw error
    }
  },
  [
    createdBot,
    isCreating,
    botName,
    botDescription,
    botLanguage,
    supportLink,
    logoUrl,
    brandColor,
    widgetType,
    agentPrompt,
    temperature,
    firstMessage,
    createBot,
    resetError,
    loadSources,
    trackOnboardingError,
    ],
  )

  const handleSourceModalState = useCallback(
    (open) => {
      setSourceModalOpen(open)
      if (!open) {
        setSourceModalType(null)
        setPrefillUrl(null)
        setPrefillWebsiteSourceData(null)
        if (createdBot?.id) {
          loadSources(createdBot.id)
        }
      }
    },
    [createdBot?.id, loadSources],
  )

  const sourceTypeLookup = useMemo(() => {
    const map = new Map()
    sourceTypes.forEach((type) => {
      map.set(type.id, type)
    })
    return map
  }, [])

  const onboardingWebsiteUrl = useMemo(() => {
    if (useManualEntry) return ''
    if (analysisData?.url) return analysisData.url
    if (lastAnalyzedUrl) return lastAnalyzedUrl
    return ''
  }, [analysisData?.url, lastAnalyzedUrl, useManualEntry])

  const availableSourceTypes = useMemo(() => {
    if (!team) return []
    const filtered = sourceTypes.filter(
      (type) =>
        !type.hide &&
        !type.coming &&
        type.id !== 'url' &&
        type.id !== 'urls' &&
        (type.minPlan === 'free' ||
          (type.id === 'sitemap' &&
            checkPlanPermission(team, type.minPlan, 'source').allowed)),
    )

    // Add detected support widget source even if not in plan
    const detectedWidgetSourceMap = {
      helpscout: 'helpscout',
      zendesk: 'zendesk',
      freshdesk: 'freshdesk',
      intercom: 'intercom',
    }

    const detectedSourceId = detectedWidgetSourceMap[widgetType]
    let detectedSource = null

    if (detectedSourceId) {
      detectedSource = sourceTypes.find((type) => type.id === detectedSourceId)
      // Add detected source at the bottom if not already in filtered list
      if (
        detectedSource &&
        !filtered.find((type) => type.id === detectedSourceId)
      ) {
        filtered.push(detectedSource)
      }
    }

    return filtered
  }, [team, widgetType])

  const totalSourceTypes = useMemo(() => {
    return sourceTypes.filter((type) => !type.hide && !type.coming).length
  }, [])

  const additionalSourceTypesCount = useMemo(() => {
    return Math.max(0, totalSourceTypes - availableSourceTypes.length)
  }, [totalSourceTypes, availableSourceTypes.length])

  const pendingSources = useMemo(
    () =>
      botSources.filter(
        (source) =>
          !source.status ||
          !['ready', 'failed', 'warning'].includes(source.status) ||
          source.refreshing,
      ),
    [botSources],
  )

  const failedSources = useMemo(
    () =>
      botSources.filter((source) =>
        source.status ? ['failed', 'warning'].includes(source.status) : false,
      ),
    [botSources],
  )

  const hasSources = botSources.length > 0
  const isTrainingComplete = pendingSources.length === 0
  const hasReadySources = useMemo(
    () =>
      botSources.some((source) => {
        if (!source || source.refreshing) return false
        return ['ready', 'warning'].includes(source.status)
      }),
    [botSources],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!createdBot?.id) return

    window.sessionStorage.setItem(
      ONBOARDING_SESSION_KEY,
      JSON.stringify({
        botId: createdBot.id,
        currentStep,
      }),
    )
  }, [createdBot?.id, currentStep])

  // Track onboarding step progression in PostHog
  useEffect(() => {
    if (!posthog) return

    const stepNames = {
      0: 'Website URL Entry',
      1: 'Add Sources',
      2: 'Customize Branding',
      3: 'Test Bot',
      4: 'Deploy',
      5: 'Complete',
    }

    const stepName = stepNames[currentStep]
    if (stepName) {
      posthog.capture('Onboarding Step Viewed', {
        step: currentStep,
        step_name: stepName,
        bot_id: createdBot?.id || null,
        team_id: team?.id || null,
        use_manual_entry: useManualEntry,
      })
    }
  }, [currentStep, posthog, createdBot?.id, team?.id, useManualEntry])

  // Reset interaction state when leaving step 3 or when prompt changes
  useEffect(() => {
    if (currentStep !== 3) {
      setHasInteractedWithBot(false)
    }
  }, [currentStep])

  useEffect(() => {
    setHasInteractedWithBot(false)
  }, [savedAgentPrompt])

  // Check if current agentPrompt matches any preset
  useEffect(() => {
    if (!agentPrompt) {
      setSelectedModalPreset('')
      return
    }

    // Get product info from brandAnalysis if available
    const productInfo =
      createdBot?.brandAnalysis?.businessDescription || botDescription || ''

    // Check if agentPrompt matches any preset after variable replacement
    let matchedPreset = ''
    for (const [presetKey, presetData] of Object.entries(PRESET_PROMPTS)) {
      const replacedPrompt = presetData.prompt
        .replace(/{company_name}/g, botName)
        .replace(/{product_info}/g, productInfo)
        .replace(/{old_prompt}\n/g, '')
        .replace(/{old_prompt}/g, '')

      if (agentPrompt.trim() === replacedPrompt.trim()) {
        matchedPreset = presetKey
        break
      }
    }

    if (matchedPreset) {
      setSelectedModalPreset(matchedPreset)
    } else {
      // If agentPrompt exists but doesn't match any preset, set to "custom"
      setSelectedModalPreset('custom')
    }
  }, [
    agentPrompt,
    botName,
    botDescription,
    createdBot?.brandAnalysis?.businessDescription,
  ])

  // Reset botSourcesRef when bot changes to prevent stale data
  useEffect(() => {
    botSourcesRef.current = []
  }, [createdBot?.id])

  useEffect(() => {
    if (createdBot?.id) {
      loadSources(createdBot.id)
    }
  }, [createdBot?.id, loadSources])

  useEffect(() => {
    if (!createdBot?.id) return
    if (pendingSources.length === 0) return
    const interval = setInterval(() => {
      loadSources(createdBot.id, true) // Silent refresh to avoid UI flicker
    }, 5000)
    return () => clearInterval(interval)
  }, [createdBot?.id, pendingSources.length, loadSources])

  const primaryActionLabel = () => {
    if (currentStep === 0) {
      if (useManualEntry) {
        return 'Continue'
      }
      if (isAnalyzing) {
        return 'Scanning site...'
      }
      return analysisData ? 'Continue' : 'Scan & continue'
    }
    if (currentStep === 1) {
      return 'Continue'
    }
    if (currentStep === 2) {
      if (isBrandingSaving) {
        return 'Saving...'
      }
      // Show training status if sources are still being processed
      if (pendingSources.length > 0 && !hasReadySources) {
        return `Indexing source${pendingSources.length > 1 ? 's' : ''}...`
      }
      return 'Save & continue'
    }
    if (currentStep === 3) {
      return isCreating ? 'Saving...' : 'Continue'
    }
    if (currentStep === 4) {
      return 'Deploy'
    }
    if (currentStep === 5) {
      return 'Go to dashboard'
    }
    return createdBot ? 'Go to bot' : 'Finish'
  }

  const isPrimaryDisabled = () => {
    if (currentStep === 0) {
      if (useManualEntry) {
        return !botName.trim()
      }
      return (
        isAnalyzing || !websiteUrl.trim() || !isUrlValid || Boolean(urlError) || hasUrlPathWarning
      )
    }
    if (currentStep === 1) {
      return !hasSources
    }
    if (currentStep === 2) {
      return isBrandingSaving || !hasReadySources
    }
    if (currentStep === 3) {
      if (isCreating) return true
      if (!botName.trim()) return true
      if (!agentPrompt || !agentPrompt.includes('search_documentation'))
        return true
      if (!hasReadySources) return true
      return false
    }
    if (currentStep === 4) {
      return false
    }
    if (currentStep === 5) {
      return false
    }
    return false
  }

  const showBackButton = currentStep > 1 && currentStep <= 5

  // Removed automatic URL source creation and modal opening
  // The URL will be prefilled when user manually clicks on a source type
  // (see handleSourceTypeClick function)

  const handleAutoMapComplete = useCallback(() => {
    setPrefillWebsiteSourceData((prev) =>
      prev ? { ...prev, autoMap: false } : prev,
    )
  }, [])

  // Handle source type selection with URL prefilling
  const handleSourceTypeClick = useCallback(
    (sourceTypeId) => {
      // Source types that should have URL prefilled
      const urlBasedTypes = ['website', 'sitemap', 'url', 'urls']
      
      // Clear any previous prefill data first
      setPrefillWebsiteSourceData(null)
      setPrefillUrl(null)
      
      if (onboardingWebsiteUrl && urlBasedTypes.includes(sourceTypeId)) {
        // Normalize URL by adding https:// if no protocol is present
        let normalizedUrl = onboardingWebsiteUrl.trim()
        if (!normalizedUrl.match(/^https?:\/\//i)) {
          normalizedUrl = `https://${normalizedUrl}`
        }

        // Set prefill data for website source type (but don't auto-map)
        if (sourceTypeId === 'website') {
          setPrefillWebsiteSourceData({
            url: normalizedUrl,
            autoMap: false, // Don't start scanning automatically
          })
        } else {
          // For other URL-based types, use the general prefillUrl
          setPrefillUrl(normalizedUrl)
        }
      }

      setSourceModalType(sourceTypeId)
      setSourceModalOpen(true)
    },
    [onboardingWebsiteUrl],
  )

  const handleAnalyze = async () => {
    setStepError(null)
    if (useManualEntry) {
      return true
    }
    const trimmed = websiteUrl.trim()
    if (!trimmed) {
      const errorMsg = 'Please enter a website URL to analyze.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 0)
      return false
    }

    const validation = validateWebsiteInput(trimmed)
    if (!validation.valid) {
      setUrlError(
        validation.error || 'Enter a valid URL, e.g. https://example.com',
      )
      return false
    }

    if (validation.hasPathWarning) {
      setUrlError('')
      return false
    }
    setUrlError('')

    setIsAnalyzing(true)
    setAnalyzingStep(0)

    const normalizedInput = validation.normalizedUrl
    if (normalizedInput && normalizedInput !== websiteUrl) {
      setWebsiteUrl(normalizedInput)
    }

    // Start cycling through analyzing steps quickly (1 second each)
    let messageIndex = 0
    analyzingIntervalRef.current = setInterval(() => {
      messageIndex++
      if (messageIndex >= ANALYZING_STEPS.length) {
        // Done with messages, clear interval but keep showing last message
        if (analyzingIntervalRef.current) {
          clearInterval(analyzingIntervalRef.current)
          analyzingIntervalRef.current = null
        }
        // Keep showing the last analyzing step until we move to step 1
        setAnalyzingStep(ANALYZING_STEPS.length - 1)
      } else {
        setAnalyzingStep(messageIndex)
      }
    }, 1000) // Change message every 1 second

    // Create placeholder bot immediately (in parallel with messages)
    const placeholderName = PRESET_PROMPTS[promptKey]?.label || 'Assistant'
    const placeholderPrompt = buildPrompt(promptKey, placeholderName, '')
    
    let newBot = null
    
    // Create the bot immediately
    const botCreationPromise = ensureBotCreated({
      name: placeholderName,
      description: '',
      language: 'en',
      supportLink: '',
      logo: '',
      color: getInitialColor('#0ea5e9'),
      widgetType: 'other',
      agentPrompt: placeholderPrompt,
      firstMessage: getDefaultFirstMessage('en'),
    }).then((bot) => {
      newBot = bot
      return bot
    }).catch((error) => {
      const errorMsg = error.message || 'Unable to create your bot. Please try again.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 0)
      throw error
    })

    // Run the analysis in the background
    const analysisPromise = (async () => {
      try {
        const metadata = {
          usageType: promptKey,
          promptLabel: PRESET_PROMPTS[promptKey]?.label || promptKey,
        }
        const data = await analyzeSiteForBot(team.id, normalizedInput, metadata)
        setLastAnalyzedUrl(normalizedInput)
        const resolvedLanguage = normalizeLanguageCode(data.language)
        setAnalysisData(data)

        // Use new field names from API
        if (data.botName) {
          setBotName(data.botName)
        }
        if (data.botDescription) {
          setBotDescription(data.botDescription)
        }

        setBotLanguage(resolvedLanguage)
        setSupportLink(data.supportUrl || '')
        setWidgetType(data.widgetType || 'other')

        // Select initial color - prioritize brand data, fall back to API/random preset
        let initialColor = null
        if (data.colors && data.colors.length > 0) {
          // Use the first primary brand color from brand.dev
          initialColor = data.colors[0].hex
        } else if (data.buttonColor && data.buttonColor !== '#0ea5e9') {
          // Fall back to AI-detected color if brand data not available and not default
          initialColor = data.buttonColor
        }
        
        // If no color was detected, randomly select from preset colors
        if (!initialColor) {
          const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length)
          initialColor = PRESET_COLORS[randomIndex]
        }

        // Select initial logo based on the chosen color
        let initialLogo = ''
        if (data.logos && data.logos.length > 0) {
          // Select best logo from brand data based on the color
          initialLogo = selectBestLogo(data.logos, initialColor)
        } else if (data.logoUrl) {
          // Fall back to AI-detected logo if brand data not available
          initialLogo = data.logoUrl
        }

        setBrandColor(initialColor)
        setLogoUrl(initialLogo)

        const generatedPrompt = buildPrompt(
          promptKey,
          data.businessName || data.botName || placeholderName,
          data.businessDescription || '',
        )
        setAgentPrompt(generatedPrompt)
        setSavedAgentPrompt(generatedPrompt)
        setPromptEdited(false)

        const initialFirstMessage =
          data.firstMessage || getDefaultFirstMessage(resolvedLanguage)

        setFirstMessage(initialFirstMessage)
        setFirstMessageEdited(true)

        // Extract domain from the normalized URL
        let scannedDomain = ''
        try {
          scannedDomain = new URL(normalizedInput).hostname
        } catch (_) {
          const match = normalizedInput.match(/:\/\/([^/]+)/)
          if (match) scannedDomain = match[1]
        }

        // Wait for bot creation to complete, then update with analyzed data
        await botCreationPromise
        
        if (newBot?.id) {
          const botPayload = {
            name: data.botName || placeholderName,
            description: data.botDescription || '',
            language: resolvedLanguage,
            labels: {
              ...(i18n[resolvedLanguage]?.labels || i18n.en.labels),
              firstMessage: initialFirstMessage,
            },
            temperature: getTemplateTemperature(promptKey),
            agentPrompt: generatedPrompt,
            color: initialColor || '',
            supportLink: data.supportUrl || '',
            logo: initialLogo,
            widgetType: data.widgetType || 'other',
            brandAnalysis: {
              domain: scannedDomain,
              url: normalizedInput,
              ...data, // Include all analysis data
            },
          }

          const updated = await updateBotRequest(team.id, newBot.id, botPayload)
          setCreatedBot(updated)

          // Sync all local state with the returned bot object
          setBotName(updated.name || '')
          setBotDescription(updated.description || '')
          setBotLanguage(normalizeLanguageCode(updated.language))
          setAgentPrompt(updated.agentPrompt || '')
          setSavedAgentPrompt(updated.agentPrompt || '')
          if (typeof updated.temperature === 'number') {
            setTemperature(updated.temperature)
          }
          if (updated.labels?.firstMessage !== undefined) {
            setFirstMessage(updated.labels.firstMessage)
          }
          setSupportLink(updated.supportLink || '')
          setLogoUrl(updated.logo || '')
          setBrandColor(getInitialColor(updated.color))
          setWidgetType(updated.widgetType || 'other')
          
          // Restore cached analysis data if it was saved
          if (updated.brandAnalysis) {
            setAnalysisData(updated.brandAnalysis)
          }
        }
      } catch (error) {
        // Analysis failed, but we already created the bot with placeholder data
        console.error('Site analysis failed:', error)
        // Optionally show a non-blocking notification to the user
      }
    })()

    // After messages finish cycling, move to step 1
    setTimeout(async () => {
      try {
        // Wait for bot creation to complete
        await botCreationPromise
        setCurrentStep(1)
        // Now reset the analyzing state
        setIsAnalyzing(false)
        setAnalyzingStep(0)
      } catch (error) {
        // Error already handled in botCreationPromise catch
        // Reset analyzing state even on error
        setIsAnalyzing(false)
        setAnalyzingStep(0)
      }
    }, ANALYZING_STEPS.length * 1500)

    return true
  }

  // Auto-trigger analysis immediately after signup seed is applied
  useEffect(() => {
    if (!signupSeedAppliedRef.current) return

    // Small delay to ensure state updates have been applied
    const timer = setTimeout(() => {
      // Check if we have both URL and usage type from signup cache
      const stored = window.localStorage.getItem(SIGNUP_ONBOARDING_CACHE_KEY)
      if (!stored) return

      let parsed = null
      try {
        parsed = JSON.parse(stored)
      } catch (error) {
        return
      }

      const { usageType: cachedUsageType, site: cachedSite } = parsed || {}
      
      // Only auto-trigger if we have both URL and usage type from signup
      if (
        cachedSite &&
        cachedSite.trim() &&
        cachedUsageType &&
        !autoAnalysisTriggeredRef.current &&
        !isAnalyzing &&
        !useManualEntry &&
        currentStep === 0
      ) {
        autoAnalysisTriggeredRef.current = true
        
        // Trigger analysis (it will handle moving to step 1 internally)
        handleAnalyze()
      }
    }, 100) // Small delay to ensure state is updated

    return () => clearTimeout(timer)
  }, [signupSeedAppliedRef.current, isAnalyzing, useManualEntry, currentStep, handleAnalyze])


  const handleCreateFlow = async () => {
    setStepError(null)
    resetError()

    if (!botName.trim()) {
      const errorMsg = 'Please provide a name for your bot before continuing.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 1)
      return
    }

    if (!agentPrompt || !agentPrompt.includes('search_documentation')) {
      const errorMsg = 'Your instructions must include guidance for the `search_documentation` tool.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 1)
      return
    }

    try {
      const bot = createdBot || (await ensureBotCreated())
      if (!bot) {
        return
      }

      const botPayload = {
        name: botName.trim(),
        description: botDescription.trim(),
        language: botLanguage,
        labels: localizedLabels,
        temperature,
        agentPrompt,
        supportLink,
        logo: logoUrl,
        color: brandColor || '',
        widgetType,
      }

      const updated = await updateBotRequest(team.id, bot.id, botPayload)
      setCreatedBot(updated)

      // Sync all local state with the returned bot object for safety
      setBotName(updated.name || '')
      setBotDescription(updated.description || '')
      setBotLanguage(normalizeLanguageCode(updated.language))
      setAgentPrompt(updated.agentPrompt || '')
      setSavedAgentPrompt(updated.agentPrompt || '')
      setHasUnsavedPromptChanges(false)
      if (typeof updated.temperature === 'number') {
        setTemperature(updated.temperature)
      }
      if (updated.labels?.firstMessage !== undefined) {
        setFirstMessage(updated.labels.firstMessage)
      }
      setSupportLink(updated.supportLink || '')
      setLogoUrl(updated.logo || '')
      setBrandColor(getInitialColor(updated.color))
      setWidgetType(updated.widgetType || 'other')

      setCurrentStep(4)
      loadSources(updated.id)
    } catch (error) {
      const errorMsg = error.message || 'Unable to update your bot. Please try again.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 1)
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!createdBot) {
      const errorMsg = 'Please create a bot first'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 2)
      return
    }

    setIsUploadingLogo(true)
    const uuid = uuidv4()
    const extension = file.name.split('.').pop()
    const filepath = `teams/${team.id}/bots/${createdBot.id}/images/${uuid}.${extension}`
    const storageRef = ref(storage, filepath)

    uploadBytes(storageRef, file)
      .then((snapshot) => {
        const url =
          process.env.NODE_ENV === 'development'
            ? 'https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/' +
              encodeURIComponent(filepath) +
              '?alt=media'
            : 'https://cdn.docsbot.ai/' +
              encodeURIComponent(filepath) +
              '?alt=media'
        setLogoUrl(url)
        setIsUploadingLogo(false)
      })
      .catch((error) => {
        console.warn(error)
        const errorMsg = 'Error uploading file, please try again. If the problem persists, try logging out then back in again.'
        setStepError(errorMsg)
        trackOnboardingError(errorMsg, 2)
        setIsUploadingLogo(false)
      })
  }

  const handleSavePrompt = async () => {
    if (!createdBot) {
      return
    }

    setIsSavingPrompt(true)
    setStepError(null)

    try {
      const updated = await updateBotRequest(team.id, createdBot.id, {
        agentPrompt,
      })
      setCreatedBot(updated)
      setSavedAgentPrompt(agentPrompt)
      setHasUnsavedPromptChanges(false)
      setIframeLoaded(false) // Reset iframe loaded state when prompt changes
      setHasInteractedWithBot(false) // Reset interaction state to show robot again
    } catch (error) {
      const errorMsg = error.message || 'Unable to save changes.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 3)
    } finally {
      setIsSavingPrompt(false)
    }
  }

  const handleModalPresetChange = (value) => {
    setSelectedModalPreset(value)

    // Don't modify agentPrompt if "custom" is selected
    if (value && value !== 'custom') {
      const presetPrompt = PRESET_PROMPTS[value]?.prompt || ''

      // Get product info from brandAnalysis if available
      const productInfo =
        createdBot?.brandAnalysis?.businessDescription || botDescription || ''

      setAgentPrompt(
        presetPrompt
          .replace(/{company_name}/g, botName)
          .replace(/{product_info}/g, productInfo)
          .replace(/{old_prompt}\n/g, '')
          .replace(/{old_prompt}/g, ''),
      )
    }
  }

  const handleBrandingContinue = async () => {
    if (!createdBot) {
      setCurrentStep(3)
      return
    }

    const payload = {}
    if (brandColor !== (createdBot.color || '')) {
      payload.color = brandColor
    }
    if ((supportLink || '') !== (createdBot.supportLink || '')) {
      payload.supportLink = supportLink
    }
    if ((logoUrl || '') !== (createdBot.logo || '')) {
      payload.logo = logoUrl
    }

    // Update first message if it changed
    const currentFirstMessage = createdBot.labels?.firstMessage || ''
    if (firstMessage !== currentFirstMessage) {
      payload.labels = {
        ...(createdBot.labels || i18n[botLanguage]?.labels || i18n.en.labels),
        firstMessage,
      }
    }

    if (Object.keys(payload).length === 0) {
      setCurrentStep(3)
      return
    }

    setIsBrandingSaving(true)
    try {
      const updated = await updateBotRequest(team.id, createdBot.id, payload)
      setCreatedBot(updated)

      // Sync all local state with the returned bot object for safety
      setBrandColor(getInitialColor(updated.color))
      setSupportLink(updated.supportLink || '')
      setLogoUrl(updated.logo || '')
      if (updated.labels?.firstMessage !== undefined) {
        setFirstMessage(updated.labels.firstMessage)
      }
      // Update any other fields that might have changed
      setBotName(updated.name || '')
      setBotDescription(updated.description || '')
      setBotLanguage(normalizeLanguageCode(updated.language))
      setWidgetType(updated.widgetType || 'other')
      setAgentPrompt(updated.agentPrompt || '')
      if (typeof updated.temperature === 'number') {
        setTemperature(updated.temperature)
      }

      setCurrentStep(3)
    } catch (error) {
      const errorMsg = error.message || 'Unable to save branding changes.'
      setStepError(errorMsg)
      trackOnboardingError(errorMsg, 2)
    } finally {
      setIsBrandingSaving(false)
    }
  }

  const handleContinue = async () => {
    if (currentStep === 0) {
      if (!useManualEntry) {
        // handleAnalyze now handles moving to step 1 internally
        await handleAnalyze()
        return
      }
      if (!botName.trim()) {
        const errorMsg = 'Please provide a name for your bot before continuing.'
        setStepError(errorMsg)
        trackOnboardingError(errorMsg, 0)
        return
      }
      setStepError(null)
      setCurrentStep(1)
      ensureBotCreated({
        name: botName.trim(),
        description: botDescription.trim(),
        language: botLanguage,
        supportLink,
        logo: logoUrl,
        color: brandColor,
        widgetType,
        agentPrompt,
        firstMessage,
      }).catch((error) => {
        const errorMsg = error.message || 'Unable to create your bot. Please try again.'
        setStepError(errorMsg)
        trackOnboardingError(errorMsg, 0)
      })
      return
    }

    if (currentStep === 1) {
      if (hasSources) {
        setCurrentStep(2)
      }
      return
    }

    if (currentStep === 2) {
      await handleBrandingContinue()
      return
    }

    if (currentStep === 3) {
      // Move to congratulations step
      setCurrentStep(4)
      return
    }

    if (currentStep === 4) {
      // Move to deploy step
      setCurrentStep(5)
      return
    }

    if (currentStep === 5 && createdBot) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY)
      }
      router.push(`/app/bots/${createdBot.id}`)
    }
  }

  const handleBack = () => {
    if (currentStep === 0) return
    if (currentStep > 0 && currentStep <= 5) {
      const minStep = createdBot ? 1 : 0
      setCurrentStep((step) => Math.max(minStep, step - 1))
    }
  }

  const handleManualSetupLink = () => {
    // Track premature exit from onboarding
    if (posthog) {
      posthog.capture('Onboarding Exited', {
        step: currentStep,
        bot_id: createdBot?.id || null,
        team_id: team?.id || null,
        completed: currentStep >= 5,
      })
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY)
    }
    if (createdBot?.id) {
      router.push(`/app/bots/${createdBot.id}`)
    } else {
      router.push('/app/bots')
    }
  }

  const handleSkipToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ONBOARDING_SESSION_KEY)
    }
    if (createdBot?.id) {
      router.push(`/app/bots/${createdBot.id}`)
    }
  }

  const handleCopyLink = async (url, linkType) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(linkType)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleGetHelp = () => {
    if (typeof window === 'undefined') return

    // Track help button click
    if (posthog) {
      posthog.capture('Onboarding Help Clicked', {
        step: currentStep,
        bot_id: createdBot?.id || null,
        team_id: team?.id || null,
      })
    }

    // If already initialized and mounted, just open it
    if (
      window.DocsBotAI &&
      window.DocsBotAI.open &&
      document.querySelector('#docsbotai-root')
    ) {
      window.DocsBotAI.open()
      return
    }

    // Initialize the widget
    if (window.DocsBotAI && typeof window.DocsBotAI.init === 'function') {
      window.DocsBotAI.init({
        id: 'ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW',
        options: {
          useImageUpload: true,
          contextItems: 12,
        },
        supportCallback: function (event, history, metadata, ticket) {
          event.preventDefault()
          window.DocsBotAI.unmount()
          if (window.Beacon) {
            window.Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2')
            window.Beacon('open')
            if (ticket) {
              window.Beacon('prefill', {
                subject: ticket.subject,
                text: ticket.message,
              })
            }
          }
        },
      })
        .then(() => {
          // Widget is now initialized and mounted, open it
          setTimeout(() => {
            if (window.DocsBotAI && window.DocsBotAI.open) {
              window.DocsBotAI.open()
            }
          }, 100)
        })
        .catch((error) => {
          console.error('Failed to initialize DocsBot widget:', error)
        })
    } else {
      // Script not loaded yet, retry
      console.warn('DocsBotAI not ready yet, retrying...')
      setTimeout(handleGetHelp, 200)
    }
  }

  const StepHeader = ({ title, description }) => (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-base text-gray-600">{description}</p>
    </div>
  )

  const renderStepContent = () => {
    if (currentStep === 0) {
      const stepTitle = useManualEntry
        ? 'Set up without a website'
        : 'Let’s start with your website'
      const stepDescription = useManualEntry
        ? 'Provide a name for your bot to continue.'
        : 'Share your site and we’ll use it to automatically set up your bot’s settings and branding.'

      return (
        <div className="space-y-8">
          <StepHeader title={stepTitle} description={stepDescription} />
          {!useManualEntry && (
            <div>
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="website-url"
              >
                Your website URL
              </label>
              <input
                id="website-url"
                type="url"
                disabled={isAnalyzing}
                className={classNames(
                  'mt-2 block w-full rounded-md px-3 py-2 text-base text-gray-900 shadow-sm focus:outline-none',
                  isAnalyzing && 'cursor-not-allowed opacity-60',
                  urlError || (websiteUrl && !isUrlValid)
                    ? 'border border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border border-gray-300 focus:border-cyan-500 focus:ring-cyan-500',
                )}
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(event) => {
                  setWebsiteUrl(event.target.value)
                  if (urlError) {
                    setUrlError('')
                  }
                }}
                onBlur={(event) => {
                  const value = event.target.value || ''
                  if (!value.trim()) {
                    setUrlError('')
                    return
                  }
                  const validation = validateWebsiteInput(value.trim())
                  if (!validation.valid) {
                    setUrlError(
                      validation.error ||
                        'Enter a valid URL, e.g. https://example.com',
                    )
                    return
                  }
                  setUrlError('')
                  if (
                    validation.normalizedUrl &&
                    !validation.hasPathWarning &&
                    validation.normalizedUrl !== value.trim()
                  ) {
                    setWebsiteUrl(validation.normalizedUrl)
                  }
                }}
                aria-invalid={
                  Boolean(urlError) || (websiteUrl ? !isUrlValid : false)
                }
              />
              {urlError && (
                <p className="mt-2 text-sm text-red-600">{urlError}</p>
              )}
              {hasUrlPathWarning && !urlError && (
                <div className="mt-2 rounded-md bg-yellow-50 p-3 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        {WEBSITE_PATH_WARNING_COPY}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!isAnalyzing && (
                <p className="mt-2 text-sm text-gray-500">
                  Don't have a website?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualEntry(true)
                      setUrlError('')
                    }}
                    className="font-medium text-cyan-600 hover:text-cyan-500"
                  >
                    I don't have a website
                  </button>
                </p>
              )}
            </div>
          )}
          {useManualEntry && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
              <p className="text-sm text-gray-600">
                No problem! Give your bot a name to get started. Or switch back
                to using a website (recommended).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor="bot-name"
                  >
                    Bot name
                  </label>
                  <input
                    id="bot-name"
                    type="text"
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                    placeholder={getDynamicBotNamePlaceholder(promptKey, websiteUrl)}
                    value={botName}
                    onChange={(event) => setBotName(event.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-language"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-900"
                  >
                    Language
                    <Tooltip content="Sets the default language for prompts and widget labels. The bot will still detect and respond in the language used in messages.">
                      <InformationCircleIcon className="h-4 w-4 text-gray-500" />
                    </Tooltip>
                  </label>
                  <select
                    id="manual-language"
                    name="manual-language"
                    className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm py-2.5 pl-3 pr-10 text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-md sm:leading-6"
                    value={botLanguage}
                    onChange={(event) => setBotLanguage(event.target.value)}
                  >
                    {languageOptions.map((key) => (
                      <option key={key} value={key}>
                        {i18n[key].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseManualEntry(false)
                  setWebsiteUrl('')
                  setUrlError('')
                }}
                className="mt-4 text-sm font-medium text-cyan-600 hover:text-cyan-500"
              >
                Use a website instead
              </button>
            </div>
          )}
          <div
            className={classNames(
              isAnalyzing && 'pointer-events-none opacity-60',
            )}
          >
            <PresetPromptSelect
              value={promptKey}
              onChange={(value) => {
                setPromptKey(value)
                setPromptEdited(false)
                setTemperature(getTemplateTemperature(value))
              }}
              label="How will you use this bot?"
            />
          </div>
        </div>
      )
    }

    if (currentStep === 1) {
      const sourcesDisabled = !createdBot || isCreating
      return (
        <div className="space-y-8">
          <StepHeader
            title="Choose your starting sources"
            description="Connect the knowledge you want DocsBot to learn. You can add more at any time."
          />
          <div className="">
            <p className="text-sm text-gray-600">
              Pick a source type to configure it. We'll start indexing as soon
              as you finish each setup.
            </p>
            {sourcesDisabled && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <LoadingSpinner className="h-4 w-4 text-cyan-600" />
                <span>
                  {isAnalyzing ? 'Scanning your site...' : 'Creating your bot…'}{' '}
                  Feel free to browse while we finish.
                </span>
              </div>
            )}
            {availableSourceTypes.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">
                No source types are available on your current plan. You can
                continue to the next step.
              </p>
            ) : (
              <ul className="mt-6 max-h-[500px] divide-y divide-gray-200 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                {availableSourceTypes.map((type) => {
                  const Icon = type.icon
                  const permission = checkPlanPermission(
                    team,
                    type.minPlan,
                    'source',
                  )
                  const hasAccess = permission.allowed

                  return (
                    <li key={type.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (sourcesDisabled) return
                          // Check if user has permission for this source type
                          if (!hasAccess) {
                            setShowCheckout(true)
                            return
                          }
                          handleSourceTypeClick(type.id)
                        }}
                        disabled={sourcesDisabled}
                        className={classNames(
                          'flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition',
                          'hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                          sourcesDisabled
                            ? 'cursor-not-allowed opacity-60'
                            : '',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 min-w-9 max-w-9 items-center justify-center rounded-full bg-cyan-50">
                            {Icon && (
                              <Icon
                                className="h-5 w-5 text-cyan-600"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {type.title}
                              {!hasAccess && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-cyan-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-cyan-600">
                                  {permission.requiredPlanLabel}
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {type.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRightIcon
                          className="h-4 w-4 flex-shrink-0 self-center text-gray-400"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSourceModalType(null)
                  setSourceModalOpen(true)
                }}
                className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
              >
                View {additionalSourceTypesCount} more source types →
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-8">
          <StepHeader
            title="Match your brand"
            description="We pre-filled details from your site. Adjust anything before launching."
          />

          <div>
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="bot-name-branding"
            >
              Bot Name
            </label>
            <input
              id="bot-name-branding"
              type="text"
              value={botName}
              onChange={(event) => setBotName(event.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              placeholder="My Assistant"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Accent color
              </label>
              {analysisData?.colors && analysisData.colors.length > 0 && (
                <div className="mb-3 mt-2">
                  <p className="mb-2 text-xs text-gray-500">
                    Detected brand colors:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.colors.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setBrandColor(color.hex)
                          // Auto-select best logo for this color
                          const bestLogo = selectBestLogo(
                            analysisData.logos,
                            color.hex,
                          )
                          if (bestLogo) {
                            setLogoUrl(bestLogo)
                          }
                        }}
                        className={classNames(
                          'group relative flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all',
                          brandColor.toLowerCase() === color.hex.toLowerCase()
                            ? 'border-cyan-600 ring-2 ring-cyan-600 ring-offset-2'
                            : 'border-gray-300 hover:border-gray-400',
                        )}
                        title={color.name || color.hex}
                      >
                        <span
                          className="h-8 w-8 rounded"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center gap-3 rounded-md border border-gray-300 px-3 py-2 shadow-sm hover:border-gray-400"
                >
                  <span
                    className="h-8 w-8 rounded border border-gray-200"
                    style={{ backgroundColor: brandColor }}
                  />
                  <span className="text-sm text-gray-700">{brandColor}</span>
                </button>
                {showColorPicker && (
                  <div
                    ref={colorPickerRef}
                    className="absolute left-0 top-full z-10 mt-2"
                  >
                    <SketchPicker
                      color={brandColor}
                      onChange={(color) => setBrandColor(color.hex)}
                      disableAlpha={true}
                      presetColors={PRESET_COLORS}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="logo"
              >
                Header Logo (optional)
              </label>
              {analysisData?.logos && analysisData.logos.length > 0 && (
                <div className="mb-3 mt-2">
                  <p className="mb-2 text-xs text-gray-500">
                    Detected brand logos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.logos.map((logo, index) => (
                      <Tooltip
                        key={index}
                        content={`${logo.type.charAt(0).toUpperCase() + logo.type.slice(1)}${
                          logo.mode === 'has_opaque_background'
                            ? ' • solid background'
                            : logo.mode === 'light'
                              ? ' • transparent background (light)'
                              : logo.mode === 'dark'
                                ? ' • transparent background (dark)'
                                : logo.mode
                                  ? ` • Mode: ${logo.mode}`
                                  : ''
                        }`}
                        side="top"
                      >
                        <button
                          key={index}
                          type="button"
                          onClick={() => setLogoUrl(logo.url)}
                          className={classNames(
                            'relative flex h-16 w-20 items-center justify-center rounded-md border-2 p-2 transition-all',
                            logoUrl === logo.url
                              ? 'border-cyan-600 ring-2 ring-cyan-600 ring-offset-2'
                              : 'border-gray-300 hover:border-gray-400',
                          )}
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition:
                              '0 0, 0 4px, 4px -4px, -4px 0px',
                          }}
                        >
                          <img
                            src={logo.url}
                            alt={`${logo.type} logo`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
              <input
                ref={logoRef}
                type="file"
                id="logo"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleLogoUpload}
                className="sr-only"
                disabled={isUploadingLogo}
              />
              <div className="relative mt-2 flex items-center gap-x-3">
                {logoUrl ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="relative flex h-12 min-w-32 items-center justify-center rounded border border-gray-200 px-3 py-1"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                      }}
                    >
                      <img
                        src={logoUrl}
                        alt="logo"
                        className="max-h-10 w-auto max-w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        title="Remove logo"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="h-12 rounded-md bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                ) : (
                  <>
                    <PhotoIcon
                      className="h-12 w-12 text-gray-300"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="h-12 rounded-md bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div>
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="first-message"
            >
              First Message
            </label>
            <p className="mt-1 text-sm text-gray-500">
              This text will appear as the first message from the bot displayed
              to the user.
            </p>
            <textarea
              id="first-message"
              rows={2}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
              value={firstMessage}
              onChange={(event) => {
                setFirstMessage(event.target.value)
                setFirstMessageEdited(true)
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="support-link"
              >
                Escalation link (optional)
              </label>
              <Tooltip content="Accepts URLs (https://example.com), email (mailto:help@example.com), or phone (tel:+1234567890)">
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
              </Tooltip>
            </div>
            <input
              id="support-link"
              type="text"
              value={supportLink}
              onChange={(event) => setSupportLink(event.target.value)}
              placeholder="https://example.com/support"
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
            />
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                You can customize additional branding
                settings like chat bubble icon, alignment, and more from the bot
                dashboard after setup.
              </p>
            </div>
          </div>
          {failedSources.length > 0 && (
            <Alert title="Training completed with warnings" type="warning">
              <p className="text-sm">
                A few sources need attention. You can retry them from the bot
                dashboard after finishing onboarding.
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                {failedSources.map((source) => (
                  <li key={source.id}>
                    {(source.title ||
                      source.url ||
                      (source.type
                        ? sourceTypes.find((t) => t.id === source.type)
                            ?.title || source.type
                        : '')) + (source.error ? ` — ${source.error}` : '')}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          <StepHeader
            title="Test your bot"
            description="Try asking questions to see how your bot responds. Use the example questions or ask your own."
          />

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-6">
            <div className="flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-cyan-600" />
              <div className="flex-1">
                <h4 className="text-base font-semibold text-cyan-900">
                  How to test your bot
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-cyan-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Click the example questions on the right to get started
                      quickly
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Try asking questions about your content to verify accuracy
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Test edge cases to see how your bot handles unexpected
                      queries
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Check that the bot's tone and style match your brand
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cyan-600 p-6">
            <div className="flex items-start gap-3">
              <Cog6ToothIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-cyan-600" />
              <div className="flex-1">
                <h4 className="text-base font-semibold text-cyan-900">
                  Need to adjust the behavior?
                </h4>
                <p className="mt-2 text-sm text-cyan-800">
                  You can customize how your bot behaves and responds by editing
                  the agent instructions. This controls the personality, tone,
                  and response style of your bot.
                </p>
                <button
                  type="button"
                  onClick={() => setAgentInstructionsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Edit agent instructions
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5 flex-shrink-0 text-gray-600" />
              <p className="text-sm text-gray-700">
                After testing, you can continue to add more sources and refine
                responses from the bot dashboard.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">
              🎉 Congratulations!
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Your DocsBot is ready to go! Here's what you can do next:
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-green-900">
                Next Steps
              </h3>
              <ul className="space-y-3 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>
                    Your bot is trained and ready to answer questions from your
                    knowledge base
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>
                    Continue training by adding more sources in your bot
                    dashboard
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-600">✓</span>
                  <span>
                    Deploy your bot using the widget, API, or integrations
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-cyan-900">
                Share Your Bot
              </h3>
              <p className="mb-4 text-sm text-cyan-800">
                Try out your bot or share it with others using these links:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat/${team.id}/${createdBot?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-between rounded-md bg-white px-4 py-3 text-sm font-medium text-cyan-700 shadow-sm transition-colors hover:bg-cyan-100"
                  >
                    <span>Chat with your bot</span>
                    <ChevronRightIcon className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyLink(
                        `${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${team.id}/${createdBot?.id}`,
                        'chat',
                      )
                    }
                    className="flex h-full items-center rounded-md bg-white px-3 py-3 text-cyan-700 shadow-sm transition-colors hover:bg-cyan-100"
                    title="Copy link"
                  >
                    {copiedLink === 'chat' ? (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {createdBot?.brandAnalysis?.screenshotUrl && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/demo/${team.id}/${createdBot?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-between rounded-md bg-white px-4 py-3 text-sm font-medium text-cyan-700 shadow-sm transition-colors hover:bg-cyan-100"
                    >
                      <span>See how it looks on your website</span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyLink(
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/demo/${team.id}/${createdBot?.id}`,
                          'deploy',
                        )
                      }
                      className="flex h-full items-center rounded-md bg-white px-3 py-3 text-cyan-700 shadow-sm transition-colors hover:bg-cyan-100"
                      title="Copy link"
                    >
                      {copiedLink === 'deploy' ? (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (currentStep === 5) {
      return (
        <div className="space-y-8">
          <StepHeader
            title="Deploy your chatbot"
            description="Choose how you want to share your bot with the world. You can always add more integrations later."
          />

          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-6">
            <div className="flex items-start gap-3">
              <LightBulbIcon className="h-6 w-6 flex-shrink-0 text-cyan-600" />
              <div className="flex-1">
                <h4 className="text-base font-semibold text-cyan-900">
                  Getting started
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-cyan-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Chat Widget:</strong> Add a chat widget to your
                      website for instant customer support
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Share Links:</strong> Share a direct link for
                      people to chat with your bot
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      <strong>Integrations:</strong> Connect with Slack, Help
                      Scout, APIs, and more
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-600" />
              <p className="text-sm text-gray-700">
                You can configure all deployment options from your bot dashboard
                at any time.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <>
      {/* Confetti for congratulations step */}
      {currentStep === 4 && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 800}
          height={typeof window !== 'undefined' ? window.innerHeight : 600}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          initialVelocityY={20}
        />
      )}
      <style jsx>{`
        @keyframes subtle-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-subtle-bounce {
          animation: subtle-bounce 2s ease-in-out infinite;
        }
      `}</style>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center px-6 py-4">
            <Image
              src={docsbotLogo}
              alt="DocsBot"
              className="h-7 w-auto"
              priority
            />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-10">
          <div className="w-full max-w-7xl">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Column - Form Content */}
                <div className="p-8 sm:p-12">
                  <div className="space-y-6">
                    {stepError && (
                      <Alert title={stepError} type="error">
                        {currentStep === 0 && !useManualEntry && (
                          <div className="mt-2">Or{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setUseManualEntry(true)
                                setStepError(null)
                                setUrlError('')
                              }}
                              className="font-medium text-red-700 underline hover:text-red-600"
                            >
                              set up your bot without a website
                            </button>
                          </div>
                        )}
                      </Alert>
                    )}
                    {createError && currentStep === 3 && (
                      <Alert title={createError} type="error" />
                    )}
                    <div>
                      {renderStepContent()}
                      <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
                        {showBackButton ? (
                          <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                          >
                            <ArrowLeftIcon className="h-4 w-4" />
                            <span>Back</span>
                          </button>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-3">
                          {/* Secondary "Go to dashboard" button for congrats step */}
                          {currentStep === 4 && (
                            <button
                              type="button"
                              onClick={handleSkipToDashboard}
                              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-800 focus:ring-offset-2"
                            >
                              Go to dashboard
                            </button>
                          )}
                          {currentStep === 2 &&
                          pendingSources.length > 0 &&
                          !hasReadySources ? (
                            <Tooltip content="Waiting for at least one source to finish indexing. This usually only takes a minute.">
                              <div className="inline-flex cursor-not-allowed">
                                <button
                                  type="button"
                                  onClick={handleContinue}
                                  disabled={isPrimaryDisabled()}
                                  className={classNames(
                                    'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-800 focus:ring-offset-2',
                                    isPrimaryDisabled()
                                      ? 'bg-gray-200 text-gray-500'
                                      : 'bg-animation bg-cyan-600 text-white hover:bg-cyan-700',
                                  )}
                                >
                                  <LoadingSpinner className="h-4 w-4 text-gray-400" />
                                  {primaryActionLabel()}
                                </button>
                              </div>
                            </Tooltip>
                          ) : currentStep === 2 && !hasReadySources ? (
                            <Tooltip content="You need to add at least one source to proceed. Click the back button to add more sources.">
                              <div className="inline-flex cursor-not-allowed">
                                <button
                                  type="button"
                                  onClick={handleContinue}
                                  disabled={isPrimaryDisabled()}
                                  className={classNames(
                                    'inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-800 focus:ring-offset-2',
                                    isPrimaryDisabled()
                                      ? 'bg-gray-200 text-gray-500'
                                      : 'bg-animation bg-cyan-600 text-white hover:bg-cyan-700',
                                  )}
                                >
                                  {primaryActionLabel()}
                                </button>
                              </div>
                            </Tooltip>
                          ) : (
                            <button
                              type="button"
                              onClick={handleContinue}
                              disabled={isPrimaryDisabled()}
                              className={classNames(
                                'inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-800 focus:ring-offset-2',
                                isPrimaryDisabled()
                                  ? 'bg-gray-200 text-gray-500'
                                  : 'bg-animation bg-cyan-600 text-white hover:bg-cyan-700',
                              )}
                            >
                              {primaryActionLabel()}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Preview/Sources */}
                <div
                  className="relative rounded-b-2xl border-t border-gray-200 bg-gray-50 p-8 sm:p-12 lg:rounded-b-none lg:rounded-r-2xl lg:border-l lg:border-t-0 min-h-[500px]"
                  style={{
                    backgroundImage: `url(${circuitBg.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <div className="relative z-10">
                    {currentStep === 1 ? (
                      <div>
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Training progress
                        </h3>
                        {isFetchingSources && !hasSources ? (
                          <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
                            <LoadingSpinner className="h-4 w-4 text-cyan-600" />
                            <span>Loading sources…</span>
                          </div>
                        ) : !hasSources ? (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-6 text-center">
                            <p className="text-sm text-gray-500">
                              You haven't added any sources yet. Choose a source
                              type to get started.
                              {onboardingWebsiteUrl && (
                                <>
                                  {' '}
                                  I recommend{' '}
                                  <button
                                    type="button"
                                    onClick={() => handleSourceTypeClick('website')}
                                    className="font-medium text-cyan-600 hover:text-cyan-500 focus:outline-none focus:underline"
                                  >
                                    training from your website
                                  </button>{' '}
                                  first.
                                </>
                              )}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                              <div className="flex items-start gap-4">
                                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                                  {pendingSources.length > 0 ? (
                                    <svg
                                      className="h-6 w-5 animate-spin"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-5 w-5 text-cyan-600"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <div className="flex-1">
                                  <p className="text-base font-medium text-gray-900">
                                    {pendingSources.length > 0
                                      ? `Processing ${pendingSources.length} source${pendingSources.length > 1 ? 's' : ''}…`
                                      : failedSources.length > 0
                                        ? 'Some sources need attention.'
                                        : 'All sources processed!'}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {pendingSources.length > 0 ? (
                                      <>
                                        Your bot is training in the background. If you're done adding sources,{' '}
                                        <button
                                          type="button"
                                          onClick={handleContinue}
                                          className="font-medium text-cyan-600 hover:text-cyan-700 underline"
                                        >
                                          continue to the next step
                                        </button>{' '}
                                        — no need to wait.
                                      </>
                                    ) : (
                                      'Ready to continue to the next step.'
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <ul className="space-y-3">
                              {botSources.map((source) => {
                                const meta = sourceTypeLookup.get(source.type)
                                const Icon = meta?.icon
                                return (
                                  <li
                                    key={source.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                      {Icon && (
                                        <span className="flex h-8 w-8 min-w-8 max-w-8 items-center justify-center overflow-hidden rounded-full bg-cyan-50">
                                          <span className="inline-flex h-4 max-h-4 min-h-4 w-4 min-w-4 max-w-4 items-center justify-center">
                                            <Icon
                                              className="block h-full w-full text-cyan-600"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        </span>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                          {meta?.title || source.type}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                          {source.title || source.url || ''}
                                        </p>
                                      </div>
                                    </div>
                                    <BadgeStatusSource source={source} small />
                                  </li>
                                )
                              })}
                            </ul>
                          </>
                        )}
                      </div>
                    ) : currentStep === 2 && createdBot ? (
                      <div className="mx-auto flex max-w-md items-start justify-center">
                        <WidgetPreview
                          bot={{
                            ...createdBot,
                            name: botName || createdBot.name,
                            description:
                              botDescription || createdBot.description,
                          }}
                          color={brandColor || createdBot.color || '#0ea5e9'}
                          logo={logoUrl}
                          headerAlignment={
                            createdBot.headerAlignment || 'center'
                          }
                          alignment={createdBot.alignment || 'right'}
                          branding={
                            createdBot.branding !== undefined
                              ? createdBot.branding
                              : true
                          }
                          icon={createdBot.icon || 'default'}
                          botIcon={createdBot.botIcon || 'none'}
                          showButtonLabel={createdBot.showButtonLabel || false}
                          showCopyButton={createdBot.showCopyButton || false}
                          labels={localizedLabels}
                          hideSources={createdBot.hideSources || false}
                          supportLink={supportLink}
                          isAgent={createdBot.isAgent || true}
                          tools={
                            createdBot.tools || {
                              followup_rating: { enabled: true },
                              human_escalation: { enabled: true },
                            }
                          }
                          imageUploads={
                            createdBot.imageUploads !== undefined
                              ? createdBot.imageUploads
                              : false
                          }
                        />
                      </div>
                    ) : currentStep === 3 && createdBot ? (
                      <div className="mx-auto flex h-full max-w-md flex-col">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Try it out
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Ask questions or choose some example questions below
                          </p>
                        </div>

                        <div
                          className="relative"
                          onMouseEnter={() => setHasInteractedWithBot(true)}
                        >
                          {!iframeLoaded && (
                            <div className="flex min-h-[700px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                              <div className="text-center">
                                <LoadingSpinner className="mx-auto h-8 w-8 text-cyan-600" />
                                <p className="mt-3 text-sm text-gray-600">
                                  Loading chat...
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <iframe
                            key={savedAgentPrompt}
                            src={`${
                              process.env.NODE_ENV === 'development'
                                ? `http://localhost:3000/iframe/${team.id}/${createdBot.id}`
                                : `https://docsbot.ai/iframe/${team.id}/${createdBot.id}`
                            }?agent=true&testing=true&signature=${createdBot.signature}`}
                            className="mx-auto min-h-[700px] w-full"
                            onLoad={() => setIframeLoaded(true)}
                          ></iframe>

                          {/* Robot pointing to example questions */}
                          {!hasInteractedWithBot && showRobotPointer && (
                            <div
                              className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 lg:block"
                              style={{ top: '40%' }}
                            >
                              <div className="relative">
                                <div className="absolute -left-[25rem] -top-20">
                                  <div className="animate-subtle-bounce">
                                    <Image
                                      src={robotPointRight}
                                      alt="Try the example questions"
                                      width={200}
                                      height={200}
                                      className="drop-shadow-2xl"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {hasUnsavedPromptChanges && (
                            <div
                              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-gray-900/50 backdrop-blur-sm"
                              onClick={() => {
                                setAgentInstructionsModalOpen(true)
                              }}
                            >
                              <div className="max-w-xs rounded-lg bg-white px-6 py-4 shadow-xl">
                                <p className="text-center text-sm font-medium text-gray-900">
                                  Save your changes to preview them
                                </p>
                                <p className="mt-2 text-center text-xs text-gray-500">
                                  Click here to open agent instructions and save
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : currentStep === 4 ? (
                      <div className="relative mb-8 lg:mt-16 inline-block max-w-xs">
                        <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
                          <h3 className="text-md text-center font-semibold text-gray-900">
                            Congratulations! {botName || createdBot?.name || 'Your bot'} is ready!
                          </h3>
                        </div>
                        {/* Arrow pointing down-right */}
                        <svg
                          className="absolute -bottom-5 right-32"
                          width="40"
                          height="40"
                          viewBox="0 0 40 40"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 0 L40 40 L0 20 Z" fill="white" />
                        </svg>
                      </div>
                    ) : currentStep === 5 && createdBot ? (
                      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Deployment options
                        </h3>
                        <IntegrationsGrid
                          team={team}
                          bot={createdBot}
                          integrations={[]}
                          compact={true}
                          openLinksInNewTab={true}
                        />
                        
                      </div>
                    ) : (
                      <>
                        {currentStep === 0 && !isAnalyzing && (
                          <div className="relative mb-8 inline-block max-w-xs">
                            <div className="rounded-2xl bg-white px-6 py-4 shadow-lg">
                              <h3 className="text-md text-center font-semibold text-gray-900">
                                Welcome! I'll help you create a chatbot.
                              </h3>
                            </div>
                            {/* Arrow pointing down-right */}
                            <svg
                              className="absolute -bottom-5 right-32"
                              width="40"
                              height="40"
                              viewBox="0 0 40 40"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M0 0 L40 40 L0 20 Z" fill="white" />
                            </svg>
                          </div>
                        )}
                        <div className="flex h-full flex-col items-center justify-center gap-8">
                          {isAnalyzing && currentStep === 0 && (
                            <div className="w-full max-w-md rounded-xl border border-cyan-500 bg-cyan-50 p-6 shadow-lg">
                              <div className="flex items-center gap-4">
                                <svg
                                  className="h-5 w-5 animate-spin text-cyan-500"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                  ></path>
                                </svg>
                                <p className="text-base font-semibold text-cyan-800">
                                  {ANALYZING_STEPS[analyzingStep]}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {isAnalyzing && currentStep === 0 && (
                    <div className="pointer-events-none absolute -bottom-6 left-0 z-0 flex w-full justify-center pb-8">
                      <RobotAnimationThinking className="h-auto w-full max-w-xs" />
                    </div>
                  )}
                  {!isAnalyzing && currentStep === 0 && (
                    <div className="pointer-events-none absolute -bottom-4 left-0 z-0 flex w-full justify-center pb-8">
                      <RobotAnimation className="h-auto w-full max-w-xs" />
                    </div>
                  )}

                  {/* Robot Training Animation - positioned at bottom of right column */}
                  {currentStep === 1 && (
                    <div className="pointer-events-none absolute -bottom-4 left-0 z-0 flex w-full justify-center pb-8">
                      <RobotAnimationTraining
                        className={clsx(
                          'h-auto w-full',
                          hasSources ? 'max-w-xs' : 'max-w-md',
                        )}
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="pointer-events-none absolute bottom-0 left-0 z-0 flex w-full justify-center pb-8">
                      <RobotAnimationCongrats className="h-auto w-full max-w-xs lg:max-w-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <ModalCheckout
          team={team}
          open={showCheckout}
          setOpen={setShowCheckout}
        />
        <Transition.Root
          show={sourceModalOpen && Boolean(createdBot)}
          as={Fragment}
        >
          <Dialog
            as="div"
            className="relative z-10"
            onClose={handleSourceModalState}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/60" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="max-h-[90vh] w-full max-w-5xl transform overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl transition-all">
                    {createdBot && (
                      <SourceForm
                        key={sourceModalType || 'all'}
                        team={team}
                        bot={createdBot}
                        sources={botSources}
                        setSources={setBotSources}
                        setOpenSourceID={() => {}}
                        prefillWebsiteData={prefillWebsiteSourceData}
                        onWebsitePrefillComplete={handleAutoMapComplete}
                        prefillUrl={prefillUrl}
                        initialTypeId={sourceModalType}
                        onClose={() => handleSourceModalState(false)}
                        minimal
                        autoShowForm
                      />
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Agent Instructions Modal */}
        <Transition.Root show={agentInstructionsModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={setAgentInstructionsModalOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/60" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="max-h-[90vh] w-full max-w-3xl transform overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl transition-all">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                          Agent Instructions
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-gray-600">
                          Customize how your bot behaves and responds
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgentInstructionsModalOpen(false)}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                      >
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        <span className="sr-only">Close</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <PresetPromptSelect
                          value={selectedModalPreset}
                          onChange={handleModalPresetChange}
                          disabled={isSavingPrompt}
                          label="Choose a preset template"
                          defaultOptionLabel="Select a preset"
                          defaultOptionDescription="Choose a default role for your bot to customize"
                        />
                        {selectedModalPreset &&
                          selectedModalPreset !== 'custom' && (
                            <p className="mt-2 text-sm text-gray-500">
                              Customize the template below and replace any
                              variables in {'{curly_braces}'} with your specific
                              information.
                            </p>
                          )}
                      </div>

                      <div>
                        <label
                          className="text-sm font-medium text-gray-700"
                          htmlFor="agent-prompt-modal"
                        >
                          Instructions
                        </label>
                        <textarea
                          id="agent-prompt-modal"
                          rows={20}
                          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-cyan-500"
                          value={agentPrompt}
                          onChange={(event) => {
                            setAgentPrompt(event.target.value)
                            setPromptEdited(true)
                            if (event.target.value !== savedAgentPrompt) {
                              setHasUnsavedPromptChanges(true)
                            } else {
                              setHasUnsavedPromptChanges(false)
                            }
                          }}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Keep the instructions for the{' '}
                          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                            search_documentation
                          </code>{' '}
                          tool so your bot can know when to reference knowledge
                          sources.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => setAgentInstructionsModalOpen(false)}
                          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          ref={savePromptButtonRef}
                          type="button"
                          onClick={async () => {
                            await handleSavePrompt()
                            setAgentInstructionsModalOpen(false)
                          }}
                          disabled={isSavingPrompt}
                          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isSavingPrompt ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6">
            {(currentStep > 0 || team?.botCount > 0) && (
              <button
                type="button"
                onClick={handleManualSetupLink}
                className="text-sm font-medium text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700"
              >
                I prefer to setup manually
              </button>
            )}
            <div className="flex flex-1 justify-center">
              <button
                type="button"
                onClick={handleGetHelp}
                className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
              >
                <QuestionMarkCircleIcon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                Get Help
              </button>
            </div>
            <OnboardingProgress currentStep={currentStep} />
          </div>
        </footer>
      </div>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (!data?.props?.team) {
    return data
  }

  if (!canUserCreateDeleteBot(data.props.team, data.props.userId)) {
    return {
      redirect: {
        destination: '/app/bots',
        permanent: false,
      },
    }
  }

  // Note: Bot limit check is done client-side to allow resuming onboarding sessions

  return data
}

export default Onboarding
