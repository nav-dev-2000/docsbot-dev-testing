import { useMemo, useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import { i18n } from '@/constants/strings.constants'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserEditBot } from '@/utils/function.utils'

import {
    checkPlanPermission,
    getCustomButtonsSlotLimit,
    isSuperAdmin,
} from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalOpenAI from '@/components/ModalOpenAI'
import ModalPrompt from '@/components/ModalPrompt'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/config/firebase-ui.config'
import { v4 as uuidv4 } from 'uuid'
import AppearancePreview from './Appearance.Preview'
import AppearanceUsage from './Appearance.Usage'
import AppearanceDesign from './Appearance.Design'
import AppearanceContent from './Appearance.Content'
import Workspace from '@new-dashboard/Workspace'
import { decideTextColor, getColorForLightBackground } from '@/utils/colors'
import IconButton from '@new-dashboard/IconButton'
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SaveDiskIcon from '@new-dashboard/SaveDiskIcon'
import Tooltip from '@/components/Tooltip'
import AppearanceActions from './Appearance.Actions'
import {
    isLeadCollectEnabled,
    sanitizeLeadCollectOptions,
} from '@/lib/leadCollect'
import { STRIPE_OAUTH_POSTMESSAGE_TYPE } from '@/lib/stripeConnect'
import {
    BOOKING_ACTION_KEYS,
    buildDisplayBotTools,
    createDefaultBookingTool,
    getCustomButtonsFormValidationErrors,
    hasCustomButtonsFormValidationErrors,
    sanitizeBotTools,
} from '@/lib/botActions'
import { formatDomainListInputText } from '@/lib/webSearch'

/** After OAuth or GET /bot, merge server stripe (incl. stripeUserId) into local form state. */
const mergeServerStripeIntoLocalTools = (setTools, nextBot) => {
    const serverStripe = nextBot?.tools?.stripe
    if (!serverStripe || typeof serverStripe !== 'object') return
    setTools((prev) => ({
        ...prev,
        stripe: { ...(prev.stripe || {}), ...serverStripe },
    }))
}

const toWidgetLeadCollectState = (leadCollect) => {
    if (!leadCollect || typeof leadCollect !== 'object') {
        return false
    }

    try {
        const sanitized = sanitizeLeadCollectOptions(leadCollect)
        if (!isLeadCollectEnabled(sanitized)) {
            return false
        }
        const { enabled, ...persistedLeadCollect } = sanitized
        return persistedLeadCollect
    } catch (error) {
        return leadCollect
    }
}


const normalizeHexColor = (value) => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        return null
    }
    return normalized
}

/** Stable stringify for debugging JSON.stringify false positives (key order). */
const stableStringify = (value) => {
    const seen = new WeakSet()
    const walk = (v) => {
        if (v === null || typeof v !== 'object') {
            return v
        }
        if (seen.has(v)) {
            return '[Circular]'
        }
        seen.add(v)
        if (Array.isArray(v)) {
            return v.map(walk)
        }
        const out = {}
        for (const key of Object.keys(v).sort()) {
            out[key] = walk(v[key])
        }
        return out
    }
    try {
        return JSON.stringify(walk(value))
    } catch {
        return JSON.stringify(value)
    }
}

/** Clone tools for dirty-checks; OAuth tokens are not returned from the API. Legacy per-bot Stripe secret key fields are stripped if present. */
const stripStripeSensitiveFromTools = (tools) => {
    if (!tools || typeof tools !== 'object') {
        return tools
    }
    const next = { ...tools }
    if (next.stripe && typeof next.stripe === 'object') {
        const stripe = { ...next.stripe }
        delete stripe.accessToken
        delete stripe.refreshToken
        delete stripe.oauthStateHash
        delete stripe.oauthStateExpiresAt
        delete stripe.clearOAuthConnection
        delete stripe.secretKey
        delete stripe.secretKeyObfuscated
        next.stripe = stripe
    }
    return next
}

const getInitialDisplayTools = (tools) =>
    buildDisplayBotTools(
        tools || {
            human_escalation: { enabled: true },
            followup_rating: { enabled: true },
        },
    )

/**
 * Explains why the widget appearance form considers itself dirty (for debugging
 * e.g. Stripe tools staying "unsaved" after save due to JSON shape/order).
 */
const computeAppearanceDirtySnapshot = (
    bot,
    team,
    {
        color,
        icon,
        alignment,
        botIcon,
        branding,
        supportLink,
        showButtonLabel,
        headerAlignment,
        hideSources,
        showCopyButton,
        isAgent,
        imageUploads,
        logo,
        linkSafetyEnabled,
        keepFooterVisible,
        allowedDomains,
        labels,
        tools,
        leadCollect,
        mcpServers,
    },
) => {
    const reasons = []

    const initialBotIcon = bot.botIcon || 'none'
    const initialBranding = bot.branding === undefined ? true : bot.branding
    const initialIsAgent = bot.isAgent === undefined ? false : bot.isAgent
    const initialImageUploads =
        ((bot.imageUploads === undefined || bot.imageUploads) &&
            checkPlanPermission(team, 'standard', 'imageUploads').allowed) ||
        false
    const initialLabels =
        bot.labels || i18n[bot.language]?.labels || i18n.en.labels
    const initialTools = getInitialDisplayTools(bot.tools)
    const initialLeadCollect = (() => {
        if (!bot?.leadCollect) return false
        try {
            return toWidgetLeadCollectState(bot.leadCollect)
        } catch {
            return false
        }
    })()
    const initialMcpServers = bot?.mcpServers || []

    const push = (field, extra = {}) => reasons.push({ field, ...extra })

    if (color !== (bot.color || '#1292EE')) {
        push('color', { current: color, saved: bot.color || '#1292EE' })
    }
    if (icon !== (bot.icon || 'default')) {
        push('icon', { current: icon, saved: bot.icon || 'default' })
    }
    if (alignment !== (bot.alignment || 'right')) {
        push('alignment', { current: alignment, saved: bot.alignment || 'right' })
    }
    if (botIcon !== initialBotIcon) {
        push('botIcon', { current: botIcon, saved: initialBotIcon })
    }
    if (branding !== initialBranding) {
        push('branding', { current: branding, saved: initialBranding })
    }
    if (supportLink !== (bot.supportLink || '')) {
        push('supportLink', { current: supportLink, saved: bot.supportLink || '' })
    }
    if (showButtonLabel !== (bot.showButtonLabel || false)) {
        push('showButtonLabel', {
            current: showButtonLabel,
            saved: bot.showButtonLabel || false,
        })
    }
    if (headerAlignment !== (bot.headerAlignment || 'center')) {
        push('headerAlignment', {
            current: headerAlignment,
            saved: bot.headerAlignment || 'center',
        })
    }
    if (hideSources !== bot.hideSources) {
        push('hideSources', { current: hideSources, saved: bot.hideSources })
    }
    if (showCopyButton !== (bot.showCopyButton || false)) {
        push('showCopyButton', {
            current: showCopyButton,
            saved: bot.showCopyButton || false,
        })
    }
    if (isAgent !== initialIsAgent) {
        push('isAgent', { current: isAgent, saved: initialIsAgent })
    }
    if (imageUploads !== initialImageUploads) {
        push('imageUploads', {
            current: imageUploads,
            saved: initialImageUploads,
        })
    }
    if (logo !== (bot.logo || null)) {
        push('logo', { current: logo, saved: bot.logo || null })
    }
    if (linkSafetyEnabled !== (bot.linkSafetyEnabled === true)) {
        push('linkSafetyEnabled', {
            current: linkSafetyEnabled,
            saved: bot.linkSafetyEnabled === true,
        })
    }
    if (keepFooterVisible !== (bot.keepFooterVisible === true)) {
        push('keepFooterVisible', {
            current: keepFooterVisible,
            saved: bot.keepFooterVisible === true,
        })
    }

    if (
        JSON.stringify(allowedDomains) !==
        JSON.stringify(bot.allowedDomains || [])
    ) {
        push('allowedDomains', {
            current: allowedDomains,
            saved: bot.allowedDomains || [],
            stableEqual:
                stableStringify(allowedDomains) ===
                stableStringify(bot.allowedDomains || []),
        })
    }
    if (JSON.stringify(labels) !== JSON.stringify(initialLabels)) {
        push('labels', {
            stableEqual: stableStringify(labels) === stableStringify(initialLabels),
        })
    }
    const toolsSansSensitive = stripStripeSensitiveFromTools(tools)
    const initialToolsSansSensitive = stripStripeSensitiveFromTools(initialTools)
    const toolsStructDirty =
        stableStringify(toolsSansSensitive) !==
        stableStringify(initialToolsSansSensitive)

    if (toolsStructDirty) {
        push('tools', {
            structDirty: toolsStructDirty,
            hint: 'Tools (including non-secret Stripe fields) differ from saved bot (or shape/key order).',
        })
    }
    if (JSON.stringify(leadCollect) !== JSON.stringify(initialLeadCollect)) {
        push('leadCollect', {
            stableEqual:
                stableStringify(leadCollect) ===
                stableStringify(initialLeadCollect),
        })
    }
    if (stableStringify(mcpServers || []) !== stableStringify(initialMcpServers)) {
        push('mcpServers', {
            stableEqual:
                stableStringify(mcpServers || []) ===
                stableStringify(initialMcpServers),
        })
    }

    return { dirty: reasons.length > 0, reasons }
}

const PageAppearance = ({ team, bot, setBot, control: controlProp }) => {
    const router = useRouter()
    const [user] = useAuthState(auth)
    const [errorText, setErrorText] = useState(null)
    const [infoText, setInfoText] = useState(null)
    const [stripeOAuthLoading, setStripeOAuthLoading] = useState(false)
    const [stripeOAuthError, setStripeOAuthError] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [bounceSave, setBounceSave] = useState(false)
    const [uploading, setUploading] = useState(null)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [showOpenAIModal, setShowOpenAIModal] = useState(false)
    const [, bumpTeamOpenAiKey] = useReducer((x) => x + 1, 0)
    const [canModify, setModify] = useState(false)
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [activeTab, setActiveTab] = useState('content')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [hasHydrated, setHasHydrated] = useState(false)
    const [customButtonFieldErrors, setCustomButtonFieldErrors] = useState({})
    const controlValue = controlProp
        || (Array.isArray(router.query.control) ? router.query.control[0] : router.query.control)
        || 'design'

    useEffect(() => {
        setHasHydrated(true)
    }, [])

    //bot settings
    const [allowedDomains, setAllowedDomains] = useState(
        bot.allowedDomains || [],
    )
    const [allowedDomainsText, setAllowedDomainsText] = useState(
        allowedDomains.join(', '),
    )
    const [logo, setLogo] = useState(bot.logo || null)
    const [headerAlignment, setHeaderAlignment] = useState(
        bot.headerAlignment || 'center',
    )
    const [color, setColor] = useState(bot.color || '#1292EE')
    const [colorInput, setColorInput] = useState(bot.color || '#1292EE')
    const [icon, setIcon] = useState(bot.icon || 'default')
    const [alignment, setAlignment] = useState(bot.alignment || 'right')
    const [botIcon, setBotIcon] = useState(bot.botIcon || 'none')
    const [branding, setBranding] = useState(
        bot.branding === undefined ? true : bot.branding,
    )
    const [supportLink, setSupportLink] = useState(bot.supportLink || '')
    const [showButtonLabel, setShowButtonLabel] = useState(
        bot.showButtonLabel || false,
    )
    const [labels, setLabels] = useState(
        bot.labels || i18n[bot.language]?.labels || i18n.en.labels,
    )
    const [hideSources, setHideSources] = useState(bot.hideSources)
    const [showCopyButton, setShowCopyButton] = useState(
        bot.showCopyButton || false,
    )
    const [isAgent, setIsAgent] = useState(
        bot.isAgent === undefined ? false : bot.isAgent, //default to false for old bots
    )

    const [mcpServers, setMcpServers] = useState(bot.mcpServers || [])
    const [tools, setTools] = useState(() => getInitialDisplayTools(bot.tools))
    const [webSearchAllowedDomainsText, setWebSearchAllowedDomainsText] =
        useState(() =>
            Array.isArray(bot?.tools?.web_search?.allowed_domains)
                ? bot.tools.web_search.allowed_domains.join(', ')
                : '',
        )
    const [linkSafetyEnabled, setLinkSafetyEnabled] = useState(
        bot.linkSafetyEnabled === true,
    )
    const [keepFooterVisible, setKeepFooterVisible] = useState(
        bot.keepFooterVisible === true,
    )
    const [imageUploads, setImageUploads] = useState(
        ((bot.imageUploads === undefined || bot.imageUploads) &&
            checkPlanPermission(team, 'standard', 'imageUploads').allowed) ||
            false,
    )
    const [leadCollect, setLeadCollect] = useState(() => {
        if (!bot?.leadCollect) {
            return false
        }

        try {
            return toWidgetLeadCollectState(bot.leadCollect)
        } catch (error) {
            return false
        }
    })
    const [showColorPicker, setShowColorPicker] = useState(false)
    const previousBranding = useRef(branding)
    const previousImageUploads = useRef(imageUploads)
    const previousLeadCollect = useRef(leadCollect)
    const iconRef = useRef(null)
    const avatarRef = useRef(null)
    const logoRef = useRef(null)
    const colorPickerRef = useRef(null)

    const brandLogos = useMemo(() => bot?.brandAnalysis?.logos || [], [bot])
    const brandIcons = useMemo(
        () => brandLogos.filter((logo) => logo.type === 'icon'),
        [brandLogos],
    )
    const brandIconOptions = useMemo(
        () => (brandIcons.length > 0 ? brandIcons : brandLogos),
        [brandIcons, brandLogos],
    )
    const brandColors = useMemo(() => bot?.brandAnalysis?.colors || [], [bot])

    const hydrateAppearanceStateFromBot = useCallback(
        (nextBot) => {
            if (!nextBot || !team) return

            const nextAllowedDomains = nextBot.allowedDomains || []
            const nextColor = nextBot.color || '#1292EE'
            const nextBotIcon = nextBot.botIcon || 'none'
            const nextBranding =
                nextBot.branding === undefined ? true : nextBot.branding
            const nextIsAgent =
                nextBot.isAgent === undefined ? false : nextBot.isAgent
            const nextLabels =
                nextBot.labels ||
                i18n[nextBot.language]?.labels ||
                i18n.en.labels
            const nextTools = getInitialDisplayTools(nextBot.tools)
            const nextImageUploads =
                ((nextBot.imageUploads === undefined ||
                    nextBot.imageUploads) &&
                    checkPlanPermission(team, 'standard', 'imageUploads')
                        .allowed) ||
                false
            const nextLeadCollect = (() => {
                if (!nextBot?.leadCollect) {
                    return false
                }

                try {
                    return toWidgetLeadCollectState(nextBot.leadCollect)
                } catch (error) {
                    return false
                }
            })()

            setAllowedDomains(nextAllowedDomains)
            setAllowedDomainsText(nextAllowedDomains.join(', '))
            setLogo(nextBot.logo || null)
            setHeaderAlignment(nextBot.headerAlignment || 'center')
            setColor(nextColor)
            setColorInput(nextColor)
            setIcon(nextBot.icon || 'default')
            setAlignment(nextBot.alignment || 'right')
            setBotIcon(nextBotIcon)
            setBranding(nextBranding)
            setSupportLink(nextBot.supportLink || '')
            setShowButtonLabel(nextBot.showButtonLabel || false)
            setLabels(nextLabels)
            setHideSources(nextBot.hideSources)
            setShowCopyButton(nextBot.showCopyButton || false)
            setIsAgent(nextIsAgent)
            setTools(nextTools)
            setWebSearchAllowedDomainsText(
                Array.isArray(nextTools?.web_search?.allowed_domains)
                    ? nextTools.web_search.allowed_domains.join(', ')
                    : '',
            )
            setMcpServers(nextBot.mcpServers || [])
            previousBranding.current = nextBranding
            previousImageUploads.current = nextImageUploads
            previousLeadCollect.current = nextLeadCollect
            setLinkSafetyEnabled(nextBot.linkSafetyEnabled === true)
            setKeepFooterVisible(nextBot.keepFooterVisible === true)
            setImageUploads(nextImageUploads)
            setLeadCollect(nextLeadCollect)
        },
        [team],
    )

    const toggleSchedulingAction = useCallback((key, enabled) => {
        setTools((prev) => {
            const next = { ...prev }
            const currentAction = prev?.[key] || createDefaultBookingTool(key)

            if (enabled) {
                next[key] = {
                    ...currentAction,
                    enabled: true,
                }

                for (const otherKey of BOOKING_ACTION_KEYS) {
                    if (otherKey === key || !prev?.[otherKey]) {
                        continue
                    }
                    next[otherKey] = {
                        ...prev[otherKey],
                        enabled: false,
                    }
                }
        return next
            }

            next[key] = {
                ...currentAction,
                enabled: false,
            }
            return next
        })
    }, [])

    useEffect(() => {
        if (!bot || !team) return
        hydrateAppearanceStateFromBot(bot)
        // Intentionally bot?.id + team only: re-hydrating on every bot prop update would
        // clobber in-progress edits. After save, updateBot calls hydrate with the response.
    }, [bot?.id, team, hydrateAppearanceStateFromBot])

    useEffect(() => {
        if (!team || !user) return
        setModify(canUserEditBot(team, user.uid, bot))
    }, [team, user, bot])

    const handledStripeOAuthReturn = useRef(false)
    useEffect(() => {
        handledStripeOAuthReturn.current = false
    }, [bot?.id])

    useEffect(() => {
        const raw = router.query.stripe_connect
        const stripeConnect = Array.isArray(raw) ? raw[0] : raw
        if (!stripeConnect || handledStripeOAuthReturn.current) return
        if (!team?.id || !bot?.id || !setBot) return

        handledStripeOAuthReturn.current = true

        let cancelled = false
        ;(async () => {
            const reasonRaw = router.query.reason
            const reason = Array.isArray(reasonRaw) ? reasonRaw[0] : reasonRaw
            if (stripeConnect === 'success') {
                setErrorText(null)
                setInfoText('Stripe connected successfully.')
            } else if (stripeConnect === 'error') {
                setInfoText(null)
                setErrorText(
                    `Stripe connection failed${reason ? `: ${reason}` : '.'}`,
                )
            }
            try {
                const res = await fetch(`/api/teams/${team.id}/bots/${bot.id}`)
                if (!cancelled && res.ok) {
                    const data = await res.json()
                    setBot(data)
                    mergeServerStripeIntoLocalTools(setTools, data)
                }
            } catch {
                // ignore
            }
            if (!cancelled) {
                const nextQuery = { ...router.query }
                delete nextQuery.stripe_connect
                delete nextQuery.reason
                router.replace(
                    { pathname: router.pathname, query: nextQuery },
                    undefined,
                    { shallow: true },
                )
            }
        })()
        return () => {
            cancelled = true
        }
    }, [router.query, team?.id, bot?.id, setBot, router, setTools])

    const refreshStripeConnectionFromServer = useCallback(async () => {
        if (!team?.id || !bot?.id || !setBot) return
        try {
            const res = await fetch(`/api/teams/${team.id}/bots/${bot.id}`)
            if (!res.ok) return
            const nextBot = await res.json()
            setBot(nextBot)
            mergeServerStripeIntoLocalTools(setTools, nextBot)
        } catch {
            // ignore
        }
    }, [team?.id, bot?.id, setBot, setTools])

    useEffect(() => {
        const onMessage = (event) => {
            if (typeof window === 'undefined') return
            if (event.origin !== window.location.origin) return
            const data = event.data
            if (!data || data.type !== STRIPE_OAUTH_POSTMESSAGE_TYPE) return
            if (data.teamId !== team?.id || data.botId !== bot?.id) return

            setStripeOAuthLoading(false)
            if (data.success) {
                setStripeOAuthError('')
                setErrorText(null)
                setInfoText('Stripe connected successfully.')
                ;(async () => {
                    try {
                        const res = await fetch(
                            `/api/teams/${team.id}/bots/${bot.id}`,
                        )
                        if (res.ok) {
                            const nextBot = await res.json()
                            setBot(nextBot)
                            mergeServerStripeIntoLocalTools(setTools, nextBot)
                        }
                    } catch {
                        // ignore
                    }
                })()
            } else {
                setInfoText(null)
                const reason = data.reason ? String(data.reason) : ''
                const msg = reason
                    ? `Stripe connection failed: ${reason}`
                    : 'Stripe connection failed.'
                setStripeOAuthError(msg)
                setErrorText(msg)
            }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [team?.id, bot?.id, setBot, setTools])

    useEffect(() => {
        if (previousBranding.current === branding) {
            return
        }

        previousBranding.current = branding

        if (
            !branding &&
            !checkPlanPermission(team, 'business', 'branding').allowed
        ) {
            setShowUpgrade(true)
            setBranding(true)
        }
    }, [branding, team])

    useEffect(() => {
        if (previousImageUploads.current === imageUploads) {
            return
        }

        previousImageUploads.current = imageUploads

        if (
            imageUploads &&
            !checkPlanPermission(team, 'standard', 'imageUploads').allowed
        ) {
            setShowUpgrade(true)
            setImageUploads(false)
        }
    }, [imageUploads, team])

    useEffect(() => {
        if (previousLeadCollect.current === leadCollect) {
            return
        }

        previousLeadCollect.current = leadCollect

        if (
            isLeadCollectEnabled(leadCollect) &&
            !checkPlanPermission(team, 'personal', 'leadCollect').allowed
        ) {
            setShowUpgrade(true)
            setLeadCollect(false)
        }
    }, [leadCollect, team])

    useEffect(() => {
        if (icon === 'custom') {
            //open file picker
            iconRef.current.click()
        }
        if (botIcon === 'custom') {
            //open file picker
            avatarRef.current.click()
        }
    }, [icon, botIcon])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target)
            ) {
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

    const appearanceDirtySnapshot = useMemo(
        () =>
            computeAppearanceDirtySnapshot(
                bot,
                team,
                {
                    color,
                    icon,
                    alignment,
                    botIcon,
                    branding,
                    supportLink,
                    showButtonLabel,
                    headerAlignment,
                    hideSources,
                    showCopyButton,
                    isAgent,
                    imageUploads,
                    logo,
                    linkSafetyEnabled,
                    keepFooterVisible,
                    allowedDomains,
                    labels,
                    tools,
                    leadCollect,
                    mcpServers,
                },
            ),
        [
            bot,
            team,
            color,
            icon,
            alignment,
            botIcon,
            branding,
            supportLink,
            showButtonLabel,
            headerAlignment,
            hideSources,
            showCopyButton,
            isAgent,
            imageUploads,
            logo,
            allowedDomains,
            labels,
            tools,
            leadCollect,
            mcpServers,
            linkSafetyEnabled,
            keepFooterVisible,
        ],
    )

    const isDirty = appearanceDirtySnapshot.dirty

    useEffect(() => {
        // Bounce continuously while there are unsaved changes.
        setBounceSave(Boolean(isDirty && !isUpdating))
    }, [isDirty, isUpdating])

    const lastAppearanceBounceLogKey = useRef('')
    useEffect(() => {
        if (!bounceSave) {
            lastAppearanceBounceLogKey.current = ''
            return
        }
        const key = JSON.stringify(
            appearanceDirtySnapshot.reasons.map((r) =>
                r.field === 'tools'
                    ? [r.field, r.structDirty]
                    : [r.field, r.stableEqual],
            ),
        )
        if (lastAppearanceBounceLogKey.current === key) return
        lastAppearanceBounceLogKey.current = key
        console.log(
            '[PageAppearance] Save button bouncing — unsaved changes:',
            appearanceDirtySnapshot.reasons,
        )
    }, [bounceSave, appearanceDirtySnapshot])

    useEffect(() => {
        const handleBrowseAway = (url) => {
            if (!isDirty || isUpdating) return
            if (
                window.confirm(
                    'You have unsaved changes. Are you sure you want to leave?',
                )
            )
                return
            router.events.emit('routeChangeError')
            throw 'routeChange aborted.'
        }

        const handleBeforeUnload = (e) => {
            if (!isDirty || isUpdating) return
            e.preventDefault()
            e.returnValue = ''
        }

        router.events.on('routeChangeStart', handleBrowseAway)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            router.events.off('routeChangeStart', handleBrowseAway)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty, isUpdating, router])

    const widgetRootStyle = useMemo(() => {
        const widgetColor = color || '#1292EE'

        return {
            '--mybot-color': widgetColor,
            '--mybot-color-800': `color-mix(in srgb, ${widgetColor}, black 20%)`,
            '--mybot-text': decideTextColor(widgetColor),
            '--mybot-logo-on-light': getColorForLightBackground(widgetColor),
            '--mybot-shadow': `color-mix(in srgb, ${widgetColor} 20%, transparent)`,
            '--mybot-logo': logo || '',
            '--mybot-header-alignment': headerAlignment,
            '--mybot-button-alignment': alignment,
            '--mybot-button-icon': icon,
            '--mybot-avatar': botIcon,
            '--mybot-show-button-label': showButtonLabel ? 'true' : 'false',
            '--mybot-branding': branding ? 'true' : 'false',
            '--mybot-support-link': supportLink || '',
            '--mybot-hide-sources': hideSources ? 'true' : 'false',
            '--mybot-show-copy-button': showCopyButton ? 'true' : 'false',
            '--mybot-is-agent': isAgent ? 'true' : 'false',
            '--mybot-image-uploads': imageUploads ? 'true' : 'false',
        }
    }, [
        alignment,
        botIcon,
        branding,
        color,
        headerAlignment,
        hideSources,
        icon,
        imageUploads,
        isAgent,
        logo,
        showButtonLabel,
        showCopyButton,
        supportLink,
    ])

    const updateColor = (nextColor) => {
        setColor(nextColor)
        setColorInput(nextColor)
    }

    const handleColorInputChange = (event) => {
        const nextValue = event.target.value
        setColorInput(nextValue)
        const normalized = normalizeHexColor(nextValue)
        if (normalized) {
            updateColor(normalized)
        }
    }

    const handleColorInputBlur = () => {
        const normalized = normalizeHexColor(colorInput)
        if (normalized) {
            updateColor(normalized)
        } else {
            setColorInput(color)
        }
    }

    function handleFileChange(e, type) {
        const file = e.target.files[0]
        if (file) {
            setUploading(type)
            //upload to firebase cloud storage
            //generate uuid for file name with same extension
            const uuid = uuidv4()
            const extension = file.name.split('.').pop()
            //move the file to the correct location in bucket
            const filepath = `teams/${team.id}/bots/${bot.id}/images/${uuid}.${extension}`
            const storageRef = ref(storage, filepath)

            uploadBytes(storageRef, file)
                .then((snapshot) => {
                    //get public url for file
                    const url =
                        process.env.NODE_ENV === 'development'
                            ? 'https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/' +
                              encodeURIComponent(filepath) +
                              '?alt=media'
                            : 'https://cdn.docsbot.ai/' +
                              encodeURIComponent(filepath) +
                              '?alt=media'
                    //const url = 'https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/' + encodeURIComponent(filepath) + '?alt=media'
                    if (type === 'icon') setIcon(url)
                    if (type === 'avatar') setBotIcon(url)
                    if (type === 'logo') setLogo(url)
                    setUploading(null)
                })
                .catch((error) => {
                    console.warn(error)
                    setUploading(null)
                    setErrorText(
                        'Error uploading file, please try again. If the problem persists, try logging out then back in again.',
                    )
                })
        }
    }

    const clearCustomButtonFieldError = useCallback((index, field) => {
        setCustomButtonFieldErrors((prev) => {
            const row = prev[index]
            if (!row?.[field]) return prev
            const nextRow = { ...row }
            delete nextRow[field]
            const next = { ...prev }
            if (Object.keys(nextRow).length === 0) delete next[index]
            else next[index] = nextRow
            return next
        })
    }, [])

    const clearCustomButtonRowErrors = useCallback((index) => {
        setCustomButtonFieldErrors((prev) => {
            if (!(index in prev)) return prev
            const next = { ...prev }
            delete next[index]
            return next
        })
    }, [])

    const clearAllCustomButtonFieldErrors = useCallback(() => {
        setCustomButtonFieldErrors({})
    }, [])

    async function updateBot() {
        setAllowedDomainsText(allowedDomains.join(', '))
        setErrorText('')

        const customBtnValidation = getCustomButtonsFormValidationErrors(
            tools?.customButtons,
        )
        if (hasCustomButtonsFormValidationErrors(customBtnValidation)) {
            setCustomButtonFieldErrors(customBtnValidation.byIndex || {})
            setErrorText(
                customBtnValidation.listError ||
                    'Fix the highlighted custom button fields before saving.',
            )
            return
        }
        setCustomButtonFieldErrors({})

        const customButtonCount = Array.isArray(tools?.customButtons)
            ? tools.customButtons.length
            : 0
        const customButtonSlots = getCustomButtonsSlotLimit(team)
        if (!isSuperAdmin(user?.uid)) {
            if (customButtonSlots === 0 && customButtonCount > 0) {
                setErrorText(
                    'Custom CTA buttons are only available on the Personal plan or higher.',
                )
                return
            }
            if (
                customButtonSlots !== Number.POSITIVE_INFINITY &&
                customButtonCount > customButtonSlots
            ) {
                setErrorText(
                    'Your plan includes one custom CTA button. Upgrade to Standard or higher to add more.',
                )
                return
            }
        }

        setIsUpdating(true)

        let normalizedTools
        try {
            normalizedTools = sanitizeBotTools(tools || {})
        } catch (error) {
            setErrorText(error.message)
            setIsUpdating(false)
            return
        }

        const finalTools =
            bot?.privacy !== 'private' && normalizedTools?.web_search?.enabled === true
                ? {
                      ...normalizedTools,
                      web_search: {
                          ...(normalizedTools?.web_search || {}),
                          enabled: true,
                          live: false,
                      },
                  }
                : normalizedTools

        const botSettings = {
            allowedDomains,
            color,
            icon,
            alignment,
            botIcon: botIcon === 'none' ? false : botIcon,
            branding,
            supportLink,
            showButtonLabel,
            labels,
            hideSources,
            showCopyButton,
            logo,
            headerAlignment,
            isAgent,
            tools: finalTools,
            imageUploads,
            leadCollect,
            linkSafetyEnabled,
            keepFooterVisible,
        }

        if (
            stableStringify(mcpServers || []) !==
            stableStringify(bot?.mcpServers || [])
        ) {
            botSettings.mcpServers = mcpServers
        }

        const urlParams = ['teams', team.id, 'bots', bot.id]
        const apiPath = '/api/' + urlParams.join('/')

        const response = await fetch(apiPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(botSettings),
        })
        if (response.ok) {
            const data = await response.json()
            setIsUpdating(false)
            if (setBot) setBot(data)
            // Match local form state to getBot() shape (merged labels, sanitized stripe,
            // etc.) so dirty detection agrees with the saved baseline.
            hydrateAppearanceStateFromBot(data)
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText(response.status + ', please try again.')
            }
            setIsUpdating(false)
        }
    }

    if (!bot) return null

    const title = [bot.name, 'Widget']

    // Function to handle agent mode toggle
    const handleAgentToggle = (enabled) => {
        setIsAgent(enabled)
        // If agent mode is being enabled and there's no agent prompt, show the prompt modal
        if (enabled && !bot.agentPrompt) {
            setShowPromptModal(true)
        }
    }

    const SaveChanges = (
        <Tooltip content="Save Changes">
            <IconButton
                name="submit-form"
                {...(isUpdating
                    ? { icon: LoadingSpinner }
                    : { icon: SaveDiskIcon })}
                theme={isDirty && !isUpdating ? 'blueSolid' : undefined}
                className={bounceSave ? 'animate-bounce' : undefined}
                label="Save Changes"
                onClick={(event) => {
                    event.preventDefault()
                    updateBot()
                }}
                disabled={isUpdating || !canModify}
            />
        </Tooltip>
    )

    const CloseSidebar = (
        <IconButton
            icon={XMarkIcon}
            label="Close"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
    )

    const SidebarActions = (
        <div className="flex items-center gap-2">
            {SaveChanges}
            {CloseSidebar}
        </div>
    )

    const dataContent = [
        {
            id: 'design',
            title: 'Design',
            content: (
                <AppearanceDesign
                    color={color}
                    colorInput={colorInput}
                    showColorPicker={showColorPicker}
                    setShowColorPicker={setShowColorPicker}
                    colorPickerRef={colorPickerRef}
                    updateColor={updateColor}
                    handleColorInputChange={handleColorInputChange}
                    handleColorInputBlur={handleColorInputBlur}
                    brandColors={brandColors}
                    botIcon={botIcon}
                    setBotIcon={setBotIcon}
                    isUpdating={isUpdating}
                    uploading={uploading}
                    brandIconOptions={brandIconOptions}
                    avatarRef={avatarRef}
                    handleFileChange={handleFileChange}
                    brandLogos={brandLogos}
                    logo={logo}
                    setLogo={setLogo}
                    logoRef={logoRef}
                    headerAlignment={headerAlignment}
                    setHeaderAlignment={setHeaderAlignment}
                    icon={icon}
                    setIcon={setIcon}
                    iconRef={iconRef}
                    alignment={alignment}
                    setAlignment={setAlignment}
                    showButtonLabel={showButtonLabel}
                    setShowButtonLabel={setShowButtonLabel}
                    labels={labels}
                    setLabels={setLabels}
                />
            ),
        },
        {
            id: 'content',
            title: 'Content',
            content: (
                <AppearanceContent
                    isAgent={isAgent}
                    labels={labels}
                    setLabels={setLabels}
                    isUpdating={isUpdating}
                    team={team}
                    branding={branding}
                    setBranding={setBranding}
                    hideSources={hideSources}
                    setHideSources={setHideSources}
                    showCopyButton={showCopyButton}
                    setShowCopyButton={setShowCopyButton}
                    linkSafetyEnabled={linkSafetyEnabled}
                    setLinkSafetyEnabled={setLinkSafetyEnabled}
                    keepFooterVisible={keepFooterVisible}
                    setKeepFooterVisible={setKeepFooterVisible}
                    imageUploads={imageUploads}
                    setImageUploads={setImageUploads}
                />
            ),
        },
        {
            id: 'actions',
            title: 'Actions',
            content: (
                <AppearanceActions
                    bot={bot}
                    setBot={setBot}
                    toggleSchedulingAction={toggleSchedulingAction}
                    isAgent={isAgent}
                    handleAgentToggle={handleAgentToggle}
                    setShowPromptModal={setShowPromptModal}
                    labels={labels}
                    setLabels={setLabels}
                    isUpdating={isUpdating}
                    tools={tools}
                    team={team}
                    setTools={setTools}
                    webSearchAllowedDomainsText={webSearchAllowedDomainsText}
                    setWebSearchAllowedDomainsText={setWebSearchAllowedDomainsText}
                    supportLink={supportLink}
                    setSupportLink={setSupportLink}
                    leadCollect={leadCollect}
                    setLeadCollect={setLeadCollect}
                    toWidgetLeadCollectState={toWidgetLeadCollectState}
                    setShowUpgrade={setShowUpgrade}
                    onRequireOpenAIKey={() => setShowOpenAIModal(true)}
                    canManageStripeActions={hasHydrated && isSuperAdmin(user?.uid)}
                    stripeOAuthLoading={stripeOAuthLoading}
                    setStripeOAuthLoading={setStripeOAuthLoading}
                    stripeOAuthError={stripeOAuthError}
                    setStripeOAuthError={setStripeOAuthError}
                    onStripeOAuthPopupClosed={refreshStripeConnectionFromServer}
                    mcpServers={mcpServers}
                    setMcpServers={setMcpServers}
                    customButtonFieldErrors={customButtonFieldErrors}
                    onClearCustomButtonFieldError={clearCustomButtonFieldError}
                    onClearCustomButtonRowErrors={clearCustomButtonRowErrors}
                    onClearAllCustomButtonFieldErrors={
                        clearAllCustomButtonFieldErrors
                    }
                />
            ),
        },
        {
            id: 'deploy',
            title: 'Deploy',
            content: (
                <AppearanceUsage
                    bot={bot}
                    team={team}
                    allowedDomainsText={allowedDomainsText}
                    setAllowedDomainsText={setAllowedDomainsText}
                    setAllowedDomains={setAllowedDomains}
                    isUpdating={isUpdating}
                />
            ),
        },
    ]

    const activeAppearanceTab =
        dataContent.find((tab) => tab.id === controlValue) || dataContent[0]
    const appearanceTitle = `Widget ${activeAppearanceTab?.title || 'Design'}`

    return (
        <div
            className="h-full min-h-0 flex-1 flex-col px-4 py-4"
            style={widgetRootStyle}
        >
            <div className="relative flex h-full min-h-0 flex-1">
                <IconButton
                    icon={PencilIcon}
                    label="Open Appearance Settings"
                    className="absolute left-0 top-0 z-10 lg:hidden"
                    onClick={() => {
                        setSidebarOpen(true)
                    }}
                />

                <Workspace.Sidebar
                    title={appearanceTitle}
                    action={SidebarActions}
                    className={clsx(
                        'fixed left-0 top-0 z-[1000000] h-full !max-w-none md:absolute md:z-30 md:!max-w-[420px] lg:!max-w-[60%]',
                        sidebarOpen
                            ? 'flex w-full lg:w-auto'
                            : 'hidden lg:flex',
                    )}
                    bodyClassName="overflow-y-hidden"
                >
                    <ModalCheckout
                        team={team}
                        open={showUpgrade}
                        setOpen={setShowUpgrade}
                    />

                    <ModalOpenAI
                        team={team}
                        open={showOpenAIModal}
                        setOpen={setShowOpenAIModal}
                        onKey={(key) => {
                            team.openAIKey = key
                            bumpTeamOpenAiKey()
                        }}
                    />

                    <ModalPrompt
                        team={team}
                        integrations={bot.integrations || []}
                        bot={bot}
                        setBot={setBot}
                        open={showPromptModal}
                        setOpen={setShowPromptModal}
                    />

                    <form
                        className="flex h-full min-h-0 flex-col"
                        onSubmit={(e) => {
                            e.preventDefault()
                        }}
                    >
                        <div className="min-h-0 flex-1">
                            <div className="h-full overflow-y-auto p-6">
                                {infoText ? (
                                    <div className="mb-4">
                                        <Alert title={infoText} type="info" />
                                    </div>
                                ) : null}
                                {(!isAgent || errorText) && (
                                    <div className="mb-4">
                                        <Alert title={errorText} type="error" />

                                        {!isAgent && (
                                            <Alert
                                                title="Agent Mode is here!"
                                                type="info"
                                            >
                                                Please enable our new{' '}
                                                <Link
                                                    href="https://docsbot.ai/article/docsbot-goes-agentic-ai-agents-for-your-team-customers"
                                                    target="_blank"
                                                    className="text-blue-600 underline hover:text-blue-500"
                                                >
                                                    Agentic mode
                                                </Link>
                                                {' '}for better results and to use all our new
                                                features. It provides more intelligent and
                                                contextual responses, tool calling to
                                                perform actions, conversaton view, and
                                                so much more! When enabling,{' '}
                                                <strong>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPromptModal(true)
                                                        }
                                                        className="text-blue-600 underline hover:text-blue-500"
                                                    >
                                                        set your agent instructions
                                                    </button>{' '}
                                                    and please test!
                                                </strong>{' '}
                                                Start with a preset role and adjust,
                                                then update or remove any instructions
                                                that may conflict.
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleAgentToggle(true)
                                                    }
                                                    className="mt-2 block rounded-lg border border-blue-600 px-4 py-2 font-medium transition hover:bg-blue-100"
                                                    disabled={isUpdating}
                                                >
                                                    Enable Agent Mode
                                                </button>
                                            </Alert>
                                        )}
                                    </div>
                                )}

                                {activeAppearanceTab?.content}
                            </div>
                        </div>
                    </form>
                </Workspace.Sidebar>

                <div className="flex h-full min-h-0 flex-1 justify-center py-10 pl-0 lg:pl-[60%]">
                    <div className="relative flex h-full min-h-0 w-full max-w-4xl flex-col items-center px-6">
                        {/* <AppearanceResize> */}
                        <AppearancePreview
                            bot={bot}
                            color={color}
                            logo={logo}
                            headerAlignment={headerAlignment}
                            alignment={alignment}
                            branding={branding}
                            icon={icon}
                            botIcon={botIcon}
                            showButtonLabel={showButtonLabel}
                            labels={labels}
                            hideSources={hideSources}
                            showCopyButton={showCopyButton}
                            supportLink={supportLink}
                            isAgent={isAgent}
                            tools={tools}
                            imageUploads={imageUploads}
                            leadCollect={leadCollect}
                        />
                        {/* </AppearanceResize> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PageAppearance
