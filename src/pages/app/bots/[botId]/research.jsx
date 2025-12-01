import { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot } from '@/lib/dbQueries'
import { useAuthState } from 'react-firebase-hooks/auth'
import { stripePlan, isSuperAdmin } from '@/utils/helpers'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClipboardIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PrinterIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
  BeakerIcon,
  CubeIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CodeBracketSquareIcon,
  CursorArrowRaysIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleIconSolid,
  CodeBracketSquareIcon as CodeBracketSquareIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  DocumentMagnifyingGlassIcon as DocumentMagnifyingGlassIconSolid,
} from '@heroicons/react/24/solid'
import RobotIcon from '@/components/RobotIcon'
import UserAvatar from '@/components/UserAvatar'
import Link from 'next/link'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkExternalLinks from 'remark-external-links'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { preprocessLaTeX } from '@/utils/helpers'
import parse from 'html-react-parser'
import TimeAgo from '@/components/TimeAgo'
import clsx from 'clsx'
import LocaleDateTime from '@/components/LocaleDateTime'
import Tooltip from '@/components/Tooltip'
import ResearchActionButtons from '@/components/ResearchActionButtons'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalOpenAI from '@/components/ModalOpenAI'
import { canUserEditBot } from '@/utils/function.utils'
import { auth } from '@/config/firebase-ui.config'
import LoadingDots from '@/components/LoadingDots'
import LoadingSpinner from '@/components/LoadingSpinner'
import Paginator from '@/components/Paginator'
import { usePostHog } from 'posthog-js/react'

// Normalize remark-math import across ESM/CJS to avoid runtime issues
const remarkMathPlugin =
  typeof remarkMath === 'function'
    ? remarkMath
    : remarkMath?.default || remarkMath

const extractUrlAnnotations = (response) => {
  if (!response || !Array.isArray(response.output)) return []

  const reversed = [...response.output].reverse()
  for (const item of reversed) {
    if (!Array.isArray(item?.content)) continue
    const annotations = item.content.flatMap((contentItem) =>
      Array.isArray(contentItem?.annotations)
        ? contentItem.annotations.filter(
            (annotation) => annotation?.type === 'url_citation' && annotation?.url,
          )
        : [],
    )
    if (annotations.length > 0) {
      return annotations.map((annotation) => ({
        start: Number(annotation.start_index ?? annotation.startIndex ?? 0),
        end: Number(annotation.end_index ?? annotation.endIndex ?? 0),
        title: annotation.title || annotation.url,
        url: annotation.url,
      }))
    }
  }

  return []
}

const injectCitationPlaceholders = (text, annotations) => {
  if (!text || !Array.isArray(annotations) || annotations.length === 0) {
    return { annotatedText: text || '', footnotes: [] }
  }

  const sorted = [...annotations]
    .filter((annotation) =>
      Number.isFinite(annotation.start) && Number.isFinite(annotation.end) && annotation.end > annotation.start,
    )
    .sort((a, b) => a.start - b.start)

  const citationNumbers = new Map()
  const footnotes = []
  let output = ''
  let cursor = 0

  sorted.forEach((annotation) => {
    const start = Math.max(0, Math.min(text.length, (annotation.start ?? 0) - 1))
    const end = Math.max(start, Math.min(text.length, annotation.end))
    const key = annotation.url || `${annotation.title || 'source'}-${start}-${end}`

    if (start < cursor) {
      return
    }

    if (cursor < start) {
      output += text.slice(cursor, start)
    }
    cursor = end

    if (!citationNumbers.has(key)) {
      citationNumbers.set(key, citationNumbers.size + 1)
      footnotes.push({
        number: citationNumbers.get(key),
        title: annotation.title || annotation.url,
        url: annotation.url,
      })
    }

    const citationNumber = citationNumbers.get(key)
    output += `{{CITATION_${citationNumber}}}`
  })

  if (cursor < text.length) {
    output += text.slice(cursor)
  }

  return { annotatedText: output, footnotes }
}

const replaceCitationTokens = (html, footnotes, renderFn) => {
  if (!html || !Array.isArray(footnotes) || footnotes.length === 0) {
    return html || ''
  }

  return html.replace(/\{\{CITATION_(\d+)\}\}/g, (_match, value) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return ''
    const footnote = footnotes.find((item) => item.number === number)
    return renderFn(number, footnote)
  })
}

const renderCitationMarkers = (html, footnotes) =>
  replaceCitationTokens(
    html,
    footnotes,
    (number) => `<span data-citation="${number}"></span>`,
  )

const renderCitationSupHtml = (html, footnotes) =>
  replaceCitationTokens(html, footnotes, (number, footnote) => {
    const title = footnote?.title ? escapeHtml(footnote.title) : ''
    const supClasses =
      'relative align-super text-[0.65em] font-semibold text-cyan-600'
    const linkClasses =
      'inline-flex items-center justify-center rounded-full px-0.5 text-current no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500'
    return (
      `<sup id="citation-${number}" class="${supClasses}">` +
      `<a href="#footnote-${number}" class="${linkClasses}" aria-label="Jump to source ${number}">${number}</a>` +
      '</sup>'
    )
  })

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const stripCitationLinks = (html, footnotes) => {
  if (!html || !Array.isArray(footnotes) || footnotes.length === 0) {
    return html || ''
  }

  let updated = html
  footnotes.forEach((footnote) => {
    if (!footnote?.url) return
    const pattern = new RegExp(
      `<a[^>]*?href=["']${escapeRegex(footnote.url)}["'][^>]*>(.*?)<\\/a>`,
      'gi',
    )
    updated = updated.replace(pattern, '$1')
  })

  return updated
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatPlainTextForHtml = (value = '') =>
  escapeHtml(value).replace(/\r?\n/g, '<br />')

const formatLocalDateTime = (value) => {
  if (!value) return ''
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    })
    return formatter.format(new Date(value))
  } catch (_err) {
    return new Date(value).toLocaleString()
  }
}

// Internal reusable UserMessage component matching conversations.jsx styling
// Supports right-aligned layout (research.jsx) with matching padding and icon sizes
function UserMessage({ text, alias, email, html, className = '' }) {
  return (
    <div className={`mb-4 flex max-w-3xl items-start justify-end ml-auto ${className}`}>
      <div
        dir="auto"
        className={`text-md rounded-2xl rounded-tr-none border bg-cyan-50 px-6 py-4 text-right text-gray-700 ${html ? 'prose leading-snug first:prose-p:my-0' : ''}`}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          text
        )}
      </div>
      {email ? (
        <UserAvatar
          alias={alias || 'User'}
          email={email}
          className="ml-3 hidden h-10 w-10 flex-none rounded-full bg-gray-50 sm:flex lg:hidden xl:flex"
        />
      ) : (
        <div className="ml-3 hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-700 sm:flex lg:hidden xl:flex">
          <UserCircleIcon className="h-8 w-8 text-white" />
        </div>
      )}
    </div>
  )
}

// Internal reusable BotMessage component matching conversations.jsx styling
// Supports left-aligned layout (research.jsx) with matching padding and icon sizes
function BotMessage({ text, html, className = '', children }) {
  // Extract width-related classes from className for message bubble
  const widthClasses = []
  if (className.includes('w-full')) {
    widthClasses.push('w-full')
  } else if (className.includes('max-w-4xl')) {
    widthClasses.push('max-w-4xl')
  } else {
    widthClasses.push('max-w-3xl') // Default like conversations.jsx
  }
  
  // Remove width classes from container className
  const containerClassName = className
    .replace('w-full', '')
    .replace('max-w-4xl', '')
    .replace('mr-12', '')
    .replace('mt-4', '')
    .trim()
  
  // Build container class - never add max-w-3xl to container (only to message bubble)
  let containerClass = 'mb-4 flex items-start justify-start'
  if (className.includes('w-full')) {
    containerClass = className.includes('mt-4') 
      ? 'mb-4 mt-4 flex w-full items-start justify-start'
      : 'mb-4 flex w-full items-start justify-start'
  } else if (className.includes('mr-12')) {
    containerClass = 'mb-4 flex mr-12 items-start justify-start'
  } else if (className.includes('mt-4')) {
    containerClass = `mb-4 mt-4 flex items-start justify-start`
  }
  if (containerClassName) {
    containerClass += ` ${containerClassName}`
  }
  
  const messageWidth = widthClasses.join(' ')
  const isFullWidth = className.includes('w-full')
  const messageClass = isFullWidth 
    ? `text-md prose w-full min-w-full rounded-2xl border bg-white px-6 pt-6 pb-4 text-start leading-snug text-gray-700 first:prose-p:my-0`
    : `text-md prose ${messageWidth} rounded-2xl rounded-tl-none border bg-white px-6 py-4 text-start leading-snug text-gray-700 first:prose-p:my-0`
  
  const showAvatar = !isFullWidth
  
  return (
    <div className={containerClass}>
      {showAvatar && (
        <div className="mr-3 hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-cyan-600 sm:flex lg:hidden xl:flex">
          <RobotIcon className="h-auto w-4/6 object-scale-down text-white" />
        </div>
      )}
      {children ? (
        <div
          dir="auto"
          className={messageClass}
        >
          {children}
        </div>
      ) : html ? (
        <div
          dir="auto"
          className={messageClass}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div
          dir="auto"
          className={`${messageClass} whitespace-pre-wrap`}
        >
          {text}
        </div>
      )}
    </div>
  )
}

// Rotating quotes component for research suggestions
function RotatingQuotes() {
  const quotes = [
    //"Analyze support conversation themes to spot recurring complaints and gaps.",
    "Audit support sources by comparing our manuals vs online help docs.",
    "Research and compare our product features with a competitor's.",
    "Create a whitepaper for my product combining the manual and web search for common pain points.",
    "Generate sales prospect briefings with internal and web intelligence.",
    "Run competitive content gap analysis comparing my landing pages and a competitor's.",
    "Scan market trends and opportunities from internal data plus web sources.",
    "Deliver a technical product deep dive from my internal docs.",
    "Turn a product release note and manual into a full blog article with supporting research.",
    "Convert our troubleshooting guide into a step-by-step help center article.",
    "Compare quarterly financial reports against competitor filings to highlight performance gaps.",
    "Generate a sales playbook for prospect from my SOPs and market research."
  ]

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Start with a random quote
    setCurrentQuoteIndex(Math.floor(Math.random() * quotes.length))
    
    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length)
        setIsVisible(true)
      }, 500) // Half second fade out
    }, 4000) // Change quote every 4 seconds

    return () => clearInterval(interval)
  }, [quotes.length])

  return (
    <div className="mb-4 flex justify-center">
      <div 
        className={`transition-opacity duration-500 text-center ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-sm text-gray-500 italic flex items-center justify-start text-left w-full gap-2">
          <LightBulbIcon className="h-4 w-4 text-gray-500" />
          "{quotes[currentQuoteIndex]}"
        </p>
      </div>
    </div>
  )
}

const recomputeUsageDerived = (usage) => {
  if (!usage) return usage

  const monthlyLimit = usage.monthlyLimit
  const monthlyUsed = usage.monthlyUsed ?? 0
  const lifetimeLimit = usage.lifetimeLimit
  const lifetimeUsed = usage.lifetimeUsed ?? 0

  return {
    ...usage,
    monthlyRemaining:
      monthlyLimit === null
        ? Infinity
        : Math.max(
            (typeof monthlyLimit === 'number' ? monthlyLimit : 0) -
              monthlyUsed,
            0,
          ),
    trialRemaining:
      typeof lifetimeLimit === 'number' && lifetimeLimit > 0
        ? Math.max(lifetimeLimit - lifetimeUsed, 0)
        : 0,
  }
}

const buildUsageSnapshot = (team) => {
  const plan = stripePlan(team || {})
  const rawMonthlyLimit = plan?.researchTasks
  const monthlyLimit =
    typeof rawMonthlyLimit === 'number' && !Number.isNaN(rawMonthlyLimit)
      ? rawMonthlyLimit
      : 25
  const monthlyUsed = Number(team?.researchCount ?? 0) || 0

  const baseUsage = {
    planId: plan?.id || 'free',
    planName: plan?.name || 'Free',
    monthlyLimit,
    monthlyUsed,
  }

  const questionHistory =
    team?.questionHistory && typeof team.questionHistory === 'object'
      ? Object.values(team.questionHistory)
      : []

  const historicalCounts = []
  for (const entry of questionHistory) {
    if (!entry || typeof entry !== 'object') continue
    const value = Number(entry?.research ?? entry?.researchCount ?? 0)
    if (!Number.isNaN(value)) {
      historicalCounts.push(value)
    }
  }

  const researchLifetimeCount = Number(team?.researchLifetimeCount ?? 0)
  if (!Number.isNaN(researchLifetimeCount) && researchLifetimeCount > 0) {
    historicalCounts.push(researchLifetimeCount)
  }

  if (!Number.isNaN(monthlyUsed)) {
    historicalCounts.push(monthlyUsed)
  }

  const historicalMaxResearch =
    historicalCounts.length > 0 ? Math.max(...historicalCounts) : 0

  const rawPlanResearch =
    plan?.researchTasks ?? plan?.research ?? plan?.researchTasksPerMonth ?? null

  let lifetimeLimit = null
  let legacyTrialThreshold = null

  if (rawPlanResearch && typeof rawPlanResearch === 'object') {
    const lifetimeCandidates = [
      rawPlanResearch.lifetime,
      rawPlanResearch.trial,
      rawPlanResearch.tasksLifetime,
      rawPlanResearch.jobsLifetime,
    ]

    for (const candidate of lifetimeCandidates) {
      if (typeof candidate === 'number') {
        lifetimeLimit = candidate
        break
      }
    }
  }

  if (lifetimeLimit === null) {
    const directLifetimeCandidates = [
      plan?.researchTasksLifetime,
      plan?.researchLifetime,
      plan?.research?.lifetime,
      plan?.research?.trial,
    ]

    for (const candidate of directLifetimeCandidates) {
      if (typeof candidate === 'number') {
        lifetimeLimit = candidate
        break
      }
    }
  }

  const normalizedPlanId = (baseUsage.planId || '').toLowerCase()
  const normalizedPlanName = (baseUsage.planName || '').toLowerCase()

  const isLegacyPlan = Boolean(plan?.legacy)
  const isLegacyPro =
    isLegacyPlan &&
    (normalizedPlanId === 'pro' || normalizedPlanName.includes('pro'))
  const isLegacyPersonal =
    isLegacyPlan &&
    (normalizedPlanId === 'personal' || normalizedPlanName.includes('personal'))

  if (lifetimeLimit === null && (isLegacyPro || isLegacyPersonal)) {
    lifetimeLimit = 1
    legacyTrialThreshold = 2
  }

  let lifetimeUsed = Number(team?.researchLifetimeCount ?? 0) || 0

  if (typeof lifetimeLimit === 'number') {
    if (legacyTrialThreshold !== null) {
      lifetimeUsed = historicalMaxResearch >= legacyTrialThreshold ? 1 : 0
    } else if (lifetimeUsed === 0) {
      lifetimeUsed = historicalMaxResearch
    }
  }

  return recomputeUsageDerived({
    ...baseUsage,
    lifetimeLimit,
    lifetimeUsed,
    historicalMaxResearch,
    legacyTrialThreshold,
  })
}

const formatResearchUsageDisplay = (usage) => {
  if (!usage) return null

  const {
    monthlyLimit,
    monthlyUsed = 0,
    lifetimeLimit,
    lifetimeUsed = 0,
    planName,
  } = usage

  const hasTrial =
    typeof lifetimeLimit === 'number' && lifetimeLimit > 0

  const formatRatio = (usedValue, limitValue) => {
    const used = Number.isFinite(usedValue) ? usedValue : 0
    if (limitValue === null) {
      return `${used}/\u221E`
    }
    if (typeof limitValue === 'number') {
      return `${used}/${limitValue}`
    }
    return `${used}/\u221E`
  }

  if (hasTrial && (monthlyLimit === 0 || monthlyLimit === undefined)) {
    const used = Math.min(lifetimeUsed, lifetimeLimit)
    return {
      label: `Deep research trial: ${used} / ${lifetimeLimit}`,
      tooltip:
        'Legacy Pro plans include a one-time deep research task trial that can be used before upgrading.',
      ratio: formatRatio(used, lifetimeLimit),
    }
  }

  if (monthlyLimit === null) {
    return {
      label: `${monthlyUsed} deep research tasks used`,
      tooltip: `Your ${planName} plan has a custom deep research task allowance. Contact support to adjust this limit.`,
      ratio: formatRatio(monthlyUsed, null),
    }
  }

  if (typeof monthlyLimit === 'number') {
    return {
      label: `${monthlyUsed} / ${monthlyLimit} deep research tasks this month`,
      tooltip: `Your ${planName} plan includes ${monthlyLimit} deep research tasks per month.`,
      ratio: formatRatio(monthlyUsed, monthlyLimit),
    }
  }

  return {
    label: `${monthlyUsed} deep research tasks used`,
    tooltip: `Your ${planName} plan has a custom deep research task allowance.`,
    ratio: formatRatio(monthlyUsed, monthlyLimit),
  }
}

// Renders a compact, collapsible timeline of tool calls and reasoning steps
function OutputTimeline({ output, defaultOpen = false, onScrollToBottom }) {
  const [htmlMap, setHtmlMap] = useState({})
  const stepsContainerRef = useRef(null)
  const detailsRef = useRef(null)

  const scrollToBottom = () => {
    // Only scroll if the details element is open
    if (detailsRef.current && detailsRef.current.open && stepsContainerRef.current) {
      stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight
    }
  }

  // Expose scroll function to parent component
  useEffect(() => {
    if (onScrollToBottom) {
      onScrollToBottom(scrollToBottom)
    }
  }, [onScrollToBottom])

  useEffect(() => {
    if (!Array.isArray(output) || output.length === 0) return
    
    const renderMarkdown = async () => {
      const newMap = {}
      const tasks = output.map(async (item, idx) => {
        if (item?.type !== 'reasoning') return
        const text = (item.summary || [])
          .map((s) => s?.text)
          .filter(Boolean)
          .join('\n\n')
        if (!text || !text.trim()) return
        try {
          const file = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
            .use(remarkMathPlugin, { singleDollarTextMath: false })
            .use(remarkRehype)
            .use(rehypeKatex)
            .use(rehypeStringify)
            .process(preprocessLaTeX(text))
          newMap[idx] = String(file)
        } catch (err) {
          // swallow errors; fall back to plain text
        }
      })
      await Promise.all(tasks)
      setHtmlMap(newMap)
    }
    renderMarkdown()
  }, [output])

  if (!Array.isArray(output) || output.length === 0) return null

  const getIcon = (item) => {
    switch (item.type) {
      case 'reasoning':
        return <LightBulbIcon className="h-4 w-4 text-amber-500" />
      case 'web_search_call': {
        const a = item.action || {}
        if (a.type === 'open_page') {
          return <CursorArrowRaysIcon className="h-4 w-4 text-cyan-600" />
        }
        if (a.type === 'find_in_page') {
          return <GlobeAltIcon className="h-4 w-4 text-cyan-600" />
        }
        if (a.type === 'search') {
          return <GlobeAltIcon className="h-4 w-4 text-cyan-600" />
        }
        return <GlobeAltIcon className="h-4 w-4 text-cyan-600" />
      }
      case 'code_interpreter_call':
        return <CodeBracketSquareIcon className="h-4 w-4 text-indigo-600" />
      case 'output_text':
      case 'message': // done
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'mcp_call':
        const toolName = item.name || 'unknown'
        if (toolName === 'search') {
          return <DocumentMagnifyingGlassIcon className="h-4 w-4 text-blue-600" />
        } else if (toolName === 'fetch') {
          return <DocumentTextIcon className="h-4 w-4 text-purple-600" />
        }
      default:
        return <BeakerIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getTitle = (item) => {
    if (item.type === 'reasoning') {
      const text = (item.summary || [])
        .map((s) => s?.text)
        .filter(Boolean)
        .join('\n\n')
      // Show "Thinking..." for empty reasoning items, otherwise show the text
      const trimmedText = text.trim()
      return trimmedText || 'Thinking...'
    }

    if (item.type === 'web_search_call') {
      const a = item.action || {}

      // Helper to extract domain and short path from URL
      const getDomain = (url) => {
        try {
          const u = new URL(url)
          let domain = u.hostname.replace(/^www\./, '')
          let path = u.pathname
          if (path && path !== '/') {
            // Show up to 40 chars of path, add ... if longer
            let shortPath = path.length > 40 ? path.slice(0, 40) + '...' : path
            domain += shortPath
          }
          return domain
        } catch {
          return url
        }
      }

      // Helper to render a url as a Link with favicon and domain
      const renderUrlLink = (url) => {
        if (!url) return null
        const domain = getDomain(url)
        return (
          <div className="inline-flex max-w-full items-center">
            <Link
              href={url}
              target="_blank"
              rel="noopener"
              title={url}
              className="text-token-text-secondary dark:bg-token-main-surface-secondary hover:bg-token-main-surface-primary-inverse hover:text-token-text-inverted dark:hover:bg-token-text-primary group relative inline-flex h-[25px] max-w-full select-none items-center overflow-hidden rounded-full border border-gray-200 bg-white px-3 text-xs"
            >
              <div className="z-1 inline-flex items-center gap-1">
                <div className="bg-token-main-surface-primary -ms-3 box-content h-3 w-3 shrink-0 overflow-hidden rounded-full first:-ms-1">
                  <div className="relative inline-block">
                    <div className="m-0 h-3 w-3"></div>
                    <img
                      alt=""
                      width={32}
                      height={32}
                      className="absolute inset-0 m-0 h-3 w-3 opacity-100 duration-200 motion-safe:transition-opacity"
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`}
                    />
                  </div>
                </div>
                {domain}
              </div>
            </Link>
          </div>
        )
      }

      if (a.type === 'search')
        return (
          <>
            <strong>Searched web for:</strong>{' '}
            “<pre className="inline whitespace-pre-wrap text-xs">{a.query || ''}</pre>“
          </>
        )
      if (a.type === 'find_in_page')
        return (
          <>
            <strong>Find</strong>{' '}
            “<pre className="inline whitespace-pre-wrap text-xs">{a.pattern || ''}</pre>“
            <strong> in </strong>{' '}
            {renderUrlLink(a.url)}
          </>
        )
      if (a.type === 'open_page') {
        if (!a.url) return null
        return (
          <>
            <strong>Open page:</strong> {renderUrlLink(a.url)}
          </>
        )
      }
      return <strong>Web search</strong>
    }

    if (item.type === 'code_interpreter_call') {
      return <strong>Run code</strong>
    }

    if (item.type === 'mcp_call') {
      try {
        const args = item.arguments ? JSON.parse(item.arguments) : {}
        const output = item.output ? JSON.parse(item.output) : {}
        const toolName = item.name || 'unknown'
        
        // Skip MCP calls with no arguments
        if (!item.arguments || Object.keys(args).length === 0) {
          return null
        }
        
        if (toolName === 'search') {
          return (
            <>
              <strong>Search docs for:</strong>{' '}
              "<pre className="inline whitespace-pre-wrap text-xs">{args.query || 'No query'}</pre>"
            </>
          )
        }
        
        if (toolName === 'fetch') {
          return (
            <>
              <strong>Open document:</strong>{' '}
              "<pre className="inline whitespace-pre-wrap text-xs">{output.title || output.url || 'No title'}</pre>"
            </>
          )
        }
        
        // Generic fallback for other MCP tools
        return <strong>MCP {toolName}</strong>
      } catch (err) {
        // Fallback if JSON parsing fails
        return <strong>MCP {item.name || 'unknown'}</strong>
      }
    }

    if (item.type === 'mcp_list_tools') {
      return null
    }

    if (item.status === 'completed') {
      return <strong>Done</strong>
    }

    // Skip message items entirely per requirements

    return item.type
  }

  // compute summary metrics for tooltip
  const { webSearchesCount, urlsCount, mcpSearchesCount, mcpFetchesCount } = (() => {
    let webSearches = 0
    const urls = new Set()
    let mcpSearches = 0
    let mcpFetches = 0
    for (const item of output) {
      if (item?.type === 'web_search_call') {
        const a = item.action || {}
        if (a.type === 'search') webSearches += 1
        if ((a.type === 'open_page' || a.type === 'find_in_page') && a.url)
          urls.add(a.url)
      }
      if (item?.type === 'mcp_call') {
        const toolName = item.name || 'unknown'
        if (toolName === 'search') {
          mcpSearches += 1
        } else if (toolName === 'fetch') {
          mcpFetches += 1
        }
      }
    }
    return { webSearchesCount: webSearches, urlsCount: urls.size, mcpSearchesCount: mcpSearches, mcpFetchesCount: mcpFetches }
  })()

  return (
    <details ref={detailsRef} className="group mt-6 w-full text-left" open={!!defaultOpen}>
      <summary className="text-md flex cursor-pointer select-none list-none items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-100">
        <Tooltip content={`Web Searches: ${webSearchesCount} • URLs: ${urlsCount} • Documentation Searches: ${mcpSearchesCount} • Documents: ${mcpFetchesCount}`}>
          <span>Research Steps ({output.length})</span>
        </Tooltip>
        <ChevronRightIcon className="h-4 w-4 text-gray-500 transition-transform duration-150 group-open:rotate-90" />
      </summary>
      <div ref={stepsContainerRef} className="mt-2 max-h-96 overflow-y-auto pl-1 pr-2">
        <ol className="relative ml-3 border-l border-gray-200 text-left">
          {output.map((item, idx) => {
            const title = getTitle(item)
            // Hide reasoning items without visible text
            if (!title) return null
            return (
              <li key={item.id || idx} className="relative ml-4 py-2 text-left">
                <span className="absolute -left-8 top-2.5 inline-flex h-8 w-8 items-center justify-center bg-gray-50">
                  {getIcon(item)}
                </span>
                <div className="mt-1.5 text-left text-xs leading-5 text-gray-700">
                  {item.type === 'reasoning' && htmlMap[idx] ? (
                    <div
                      className="prose prose-sm max-w-none text-left"
                      dangerouslySetInnerHTML={{ __html: htmlMap[idx] }}
                    />
                  ) : item.type === 'code_interpreter_call' &&
                    (item.code || item.action?.code) ? (
                    <>
                      <div className="whitespace-pre-wrap text-left text-sm font-medium text-gray-900">
                        {title}
                      </div>
                      <pre className="max-w-full overflow-x-auto rounded-md bg-gray-50 p-2 text-[11px] leading-5 text-gray-800">
                        <code>{item.code || item.action?.code}</code>
                      </pre>
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap text-left text-sm font-medium text-gray-900">
                      {title}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </details>
  )
}

function ResearchJob({ job, onSelect, isSelected, onCancel }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'clarifying':
        return <QuestionMarkCircleIcon className="h-4 w-4 text-blue-500" />
      case 'queued':
      case 'in_progress':
        return (
          <ArrowPathIcon className="h-4 w-4 animate-spin text-yellow-500" />
        )
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-orange-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'clarifying':
        return 'Awaiting clarification'
      case 'queued':
      case 'in_progress':
        return 'Researching...'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  return (
    <li
      className={clsx(
        'relative flex cursor-pointer items-center justify-between gap-x-4 bg-white px-2 py-5 hover:bg-gray-50 lg:px-4',
      )}
      onClick={() => onSelect(job)}
    >
      <div className="absolute right-2 top-2 flex space-x-1 lg:right-4">
        {getStatusIcon(job.status)}
        {(job.status === 'queued' || job.status === 'in_progress') && (
          <Tooltip content="Cancel deep research task">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel(job.jobId)
              }}
              className="rounded-sm text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-50">
        <BeakerIcon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="min-w-0 flex-auto">
        <div className="flex items-baseline justify-between gap-x-4">
          <p
            className="truncate text-left text-xs font-semibold leading-6 text-gray-900"
            style={{ maxWidth: 'calc(100% - 50px)' }}
          >
            <span className="absolute inset-x-0 -top-px bottom-0" />
            {job.title || job.question}
          </p>
          <Tooltip
            content={`Updated: ${new Date(job.updatedAt).toUTCString()}`}
          >
            <p className="flex-none text-xs text-gray-600">
              <TimeAgo dateTime={job.updatedAt} />
            </p>
          </Tooltip>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
          {getStatusText(job.status)}
        </p>
      </div>
    </li>
  )
}

function ResearchInterface({
  team,
  bot,
  onJobCreated,
  clarifyingJob = null,
  onClarificationsContinue,
  setSelectedJob,
  setResearchJobs,
  selectedJob = null,
  researchUsage = null,
  refreshResearchCount,
  onResearchTaskStarted,
}) {
  const [question, setQuestion] = useState('')
  const [selectedModel, setSelectedModel] = useState('o4-mini')
  const [webSearch, setWebSearch] = useState(false)
  const [codeInterpreter, setCodeInterpreter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [pendingUpgrade, setPendingUpgrade] = useState(false)
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [user] = useAuthState(auth)
  const textareaRef = useRef(null)
  const [clarificationsHtml, setClarificationsHtml] = useState('')
  const posthog = usePostHog()

  const refreshUsage =
    typeof refreshResearchCount === 'function'
      ? refreshResearchCount
      : async () => null
  const recordResearchTaskStarted =
    typeof onResearchTaskStarted === 'function'
      ? onResearchTaskStarted
      : async () => {}

  const validModels = [
    {
      id: 'o3',
      name: 'o3',
      description: 'Uses advanced reasoning - Slower & 5x more expensive, requires a OpenAI API key',
    },
    {
      id: 'o4-mini',
      name: 'o4-mini',
      description: 'Fastest at advanced reasoning - Recommended for most tasks',
    },
  ]

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [question])

  useEffect(() => {
    if (question) {
      setErrorText(null)
    }
  }, [question])

  useEffect(() => {
    if (pendingUpgrade) {
      setShowUpgrade(true)
      setPendingUpgrade(false)
    }
  }, [pendingUpgrade])

  useEffect(() => {
    if (!showOpenAI && !team.openAIKey && selectedModel === 'o3') {
      setShowOpenAI(true)
    }
  }, [selectedModel, showOpenAI, team.openAIKey])

  useEffect(() => {
    if (!showOpenAI && !team.openAIKey && selectedModel === 'o3') {
      setSelectedModel('o4-mini')
    }
  }, [showOpenAI, team.openAIKey, selectedModel])

  // Render clarifications as markdown when present
  useEffect(() => {
    const renderClarifications = async () => {
      if (!clarifyingJob?.clarifications) {
        setClarificationsHtml('')
        return
      }
      try {
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
          .use(remarkMathPlugin, { singleDollarTextMath: false })
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(preprocessLaTeX(clarifyingJob.clarifications))
        setClarificationsHtml(String(file))
      } catch (err) {
        console.warn('Error rendering clarifications markdown:', err)
        setClarificationsHtml('')
      }
    }
    renderClarifications()
  }, [clarifyingJob?.clarifications])

  // Sync local toggles and model from clarifying job (DB/list API provides camelCase fields)
  useEffect(() => {
    if (!clarifyingJob) return
    if (typeof clarifyingJob.model === 'string') {
      setSelectedModel(clarifyingJob.model)
    }
    if (clarifyingJob.webSearch !== undefined) {
      setWebSearch(Boolean(clarifyingJob.webSearch))
    }
    if (clarifyingJob.codeInterpreter !== undefined) {
      setCodeInterpreter(Boolean(clarifyingJob.codeInterpreter))
    }
  }, [clarifyingJob])

  // Helper to update selectedJob when tools are toggled (only if job hasn't started)
  const updateSelectedJobTools = (newWebSearch, newCodeInterpreter) => {
    if (!setSelectedJob) return
    
    // If we're in clarifying mode, update the selectedJob
    if (clarifyingJob) {
      const jobStatus = clarifyingJob.status
      // Don't update if job has already started (queued or in_progress)
      if (jobStatus === 'queued' || jobStatus === 'in_progress') return
      
      // Update selectedJob to reflect tool changes in header
      setSelectedJob((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          webSearch: newWebSearch,
          codeInterpreter: newCodeInterpreter,
        }
      })
      return
    }
    
    // If we're in first step and a job exists, update it only if it hasn't started
    if (selectedJob) {
      const jobStatus = selectedJob.status
      // Don't update if job has already started (queued or in_progress)
      if (jobStatus === 'queued' || jobStatus === 'in_progress') return
      
      // Update selectedJob to reflect tool changes in header
      setSelectedJob((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          webSearch: newWebSearch,
          codeInterpreter: newCodeInterpreter,
        }
      })
    }
    // If no job exists yet in first step, we don't need to update selectedJob
  }

  const startResearch = async (e) => {
    e.preventDefault()
    
    // Prevent API calls if upgrade modal is showing
    if (showUpgrade || pendingUpgrade) {
      return
    }
    
    if (!question || question.length < 2) {
      setErrorText('Please enter a full question.')
      return
    }

    let willConsumeTrial = false

    if (!clarifyingJob) {
      let usageSnapshot = researchUsage

      try {
        const fetchedUsage = await refreshUsage()
        if (fetchedUsage) {
          usageSnapshot = fetchedUsage
        }
      } catch (usageError) {
        console.warn(
          'Error refreshing research usage before starting task:',
          usageError,
        )
      }

      if (!usageSnapshot) {
        setErrorText(
          'Unable to verify deep research task allowance. Please refresh and try again.',
        )
        return
      }

      const {
        monthlyLimit,
        monthlyUsed = 0,
        lifetimeLimit,
        lifetimeUsed = 0,
        historicalMaxResearch = 0,
        legacyTrialThreshold = null,
      } = usageSnapshot

      const trialThreshold =
        legacyTrialThreshold ??
        (typeof lifetimeLimit === 'number' && lifetimeLimit > 0
          ? lifetimeLimit
          : null)

      const hasTrialAllowance = (() => {
        if (trialThreshold !== null) {
          return historicalMaxResearch < trialThreshold
        }
        if (typeof lifetimeLimit === 'number' && lifetimeLimit > 0) {
          return lifetimeUsed < lifetimeLimit
        }
        return false
      })()

      const hasMonthlyAllowance =
        monthlyLimit === null
          ? true
          : typeof monthlyLimit === 'number'
            ? monthlyUsed < monthlyLimit
            : false

      if (!hasMonthlyAllowance && !hasTrialAllowance) {
        const zeroTasks =
          (typeof monthlyLimit === 'number' ? monthlyLimit : 0) === 0 &&
          !hasTrialAllowance

        setErrorText(
          zeroTasks
            ? 'Your plan does not include deep research tasks. Upgrade to unlock them.'
            : 'You have reached your plan\'s deep research task limit for this month. Upgrade to run more tasks.',
        )
        setPendingUpgrade(true)
        setShowUpgrade(true)
        return
      }

      willConsumeTrial = !hasMonthlyAllowance && hasTrialAllowance
    }

    setLoading(true)
    setErrorText(null)

    try {
      // If we are answering clarifications, call the continue endpoint
      if (clarifyingJob) {
        const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/research/${clarifyingJob.jobId}`
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + bot.signature,
          },
          body: JSON.stringify({
            answers: question,
            model: selectedModel,
            web_search: webSearch,
            code_interpreter: codeInterpreter,
            docs_search: true,
            metadata: user?.displayName || user?.email ? {
              name: user?.displayName || null,
              email: user?.email || null,
            } : undefined,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Clarification response:', data)
          setQuestion('')
          setErrorText(null) // Clear any previous error messages
          
          // Immediately update the selected job with the response data to show loading state
          if (data.jobId && data.status) {
            const updatedJob = { 
              ...clarifyingJob, 
              ...data,
              // Store the answers that were just submitted
              answers: question,
              // Ensure summary is preserved from the response
              summary: data.summary || clarifyingJob.summary,
              // Preserve metadata from API response or existing
              metadata: data.metadata || clarifyingJob.metadata,
            }
            console.log('Updated job:', updatedJob)
            setSelectedJob && setSelectedJob(updatedJob)
            
            // Also update the job in the research tasks list
            setResearchJobs &&
              setResearchJobs((prev) =>
                prev.map((j) => (j.jobId === data.jobId ? updatedJob : j)),
              )
          }
          
          // Only call onClarificationsContinue if we need to fetch additional data
          // Since we already have the updated status, we don't need to fetch immediately
          // The polling will handle status updates for queued/in_progress jobs
        } else {
          try {
            const data = await response.json()
            console.error('Clarification submission failed:', data)
            setErrorText(data.error || data.message || 'Failed to continue deep research task')
          } catch (err) {
            console.error('Error parsing error response:', err)
            setErrorText('Failed to continue deep research task')
          }
        }
      } else {
        // Normal start research flow
        const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/research`
        const headers = {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + bot.signature,
        }

        const body = {
          question,
          model: selectedModel,
          web_search: webSearch,
          code_interpreter: codeInterpreter,
          metadata: user?.displayName || user?.email ? {
            name: user?.displayName || null,
            email: user?.email || null,
          } : undefined,
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })

        if (response.ok) {
          const data = await response.json()
          setQuestion('')
          setErrorText(null) // Clear any previous error messages

          // Immediately update the local state with the response data to avoid loading flash
          if (data.jobId) {
            const newJob = {
              jobId: data.jobId,
              title: data.title,
              question: question,
              status: data.status || 'clarifying',
              clarifications: data.clarifications,
              model: selectedModel,
              webSearch: webSearch,
              codeInterpreter: codeInterpreter,
              metadata: data.metadata || (user?.displayName || user?.email ? {
                name: user?.displayName || null,
                email: user?.email || null,
              } : undefined),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            
            // Add the new job to the research tasks list
            setResearchJobs && setResearchJobs((prev) => [newJob, ...prev])
            
            // Select the new job immediately
            setSelectedJob && setSelectedJob(newJob)
          }

          onJobCreated(data.jobId)

          await recordResearchTaskStarted({ consumeTrial: willConsumeTrial })

          // Track deep research job creation in PostHog (only after initial response with title)
          if (posthog && user && data.jobId && data.title) {
            posthog.capture('Deep Research Job Created', {
              botId: bot.id,
              botName: bot.name,
              teamId: team.id,
              model: selectedModel,
              webSearch: webSearch,
              codeInterpreter: codeInterpreter,
              title: data.title,
            })
          }
        } else {
          try {
            const data = await response.json()
            setErrorText(data.error || data.message || 'Failed to start deep research task')
          } catch (err) {
            console.error('Error parsing error response:', err)
            setErrorText('Failed to start deep research task')
          }
        }
      }
    } catch (error) {
      console.error('Error starting deep research task:', error)
      setErrorText('Failed to start deep research task')
    } finally {
      setLoading(false)
    }
  }

  const ModelSelector = () => {
    return (
      <Listbox
        value={selectedModel}
        onChange={setSelectedModel}
        disabled={loading || showUpgrade}
      >
        <div className="relative">
          <div className="inline-block">
            <Tooltip content="Change model" placement="top">
              <div>
                <Listbox.Button
                  className={clsx(
                    'flex items-center p-2 text-xs text-gray-600 hover:text-cyan-600',
                    loading || showUpgrade
                      ? 'pointer-events-none cursor-not-allowed opacity-50'
                      : 'cursor-pointer',
                  )}
                >
                  <CubeIcon className="mr-1 h-5 w-5" aria-hidden="true" />
                  {validModels.find((m) => m.id === selectedModel)?.name ||
                    selectedModel}
                </Listbox.Button>
              </div>
            </Tooltip>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Listbox.Options className="absolute bottom-full left-0 z-10 mb-2 max-h-72 w-72 origin-bottom-right divide-y divide-gray-200 overflow-hidden overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
              {validModels.map((model) => (
                <Listbox.Option
                  key={model.id}
                  value={model.id}
                  className={({ active }) =>
                    clsx(
                      'group cursor-default select-none p-2 text-sm',
                      active ? 'bg-cyan-600 text-white' : 'text-gray-900',
                    )
                  }
                >
                  {({ selected, active }) => (
                    <div className="flex flex-col text-left">
                      <div className="flex justify-between">
                        <p
                          className={clsx(
                            'font-normal',
                            selected && 'font-semibold',
                          )}
                        >
                          {model.name}
                        </p>
                        {selected && (
                          <span
                            className={active ? 'text-white' : 'text-cyan-600'}
                          >
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p
                        className={clsx(
                          'mt-1 text-xs',
                          active ? 'text-cyan-200' : 'text-gray-500',
                        )}
                      >
                        {model.description}
                      </p>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-y-auto overflow-x-visible px-3 pt-4">
      <ModalOpenAI team={team} open={showOpenAI} setOpen={setShowOpenAI} onKey={(key) => {
        team.openAIKey = key
      }} />
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <div className="flex w-full flex-col text-center">
        <div className="my-auto">
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {clarifyingJob ? clarifyingJob.title : 'Deep Research Agent'}
          </p>
          {!clarifyingJob && (
            <Alert
              title="Deep Research Agent"
              type="info"
              dismissKey="research-agent-info"
            >
              This agent uses advanced reasoning models and multiple searches to
              perform deep research tasks. It can search your data, the web, write and run code for accurate data analysis & math, and provide comprehensive answers with detailed
              reasoning. Research tasks take anywhere from 5 to 25 minutes so it's optimized to use for very complex or detailed reports, not simple questions.
            </Alert>
          )}
        </div>

        <div className="mt-6">
          <Alert title={errorText} type="warning" />

          {!clarifyingJob && <RotatingQuotes />}

          {clarifyingJob && (
            <>
              {/* First user message: the original question */}
              <UserMessage
                text={clarifyingJob.question}
                alias={clarifyingJob.metadata?.name || 'User'}
                email={clarifyingJob.metadata?.email}
              />

              {/* Bot reply: clarification questions as a normal message */}
              <BotMessage
                text={clarifyingJob.clarifications}
                html={clarificationsHtml}
              />
            </>
          )}

          {bot?.privacy === 'private' && webSearch && (
            <Alert
              title="Privacy Warning"
              type="warning"
              dismissKey="web-search-private-warning"
            >
              Enabling web search could potentially leak private information from your training data to websites. The agent may include sensitive content from your knowledge base in web search queries.
            </Alert>
          )}

          <form
            className="mt-4 flex flex-col justify-center"
            onSubmit={startResearch}
            disabled={loading || showUpgrade}
          >
            <fieldset
              disabled={loading || showUpgrade}
              aria-disabled={loading || showUpgrade}
              className={clsx((loading || showUpgrade) && 'opacity-75')}
            >
              <div className="mb-1 mt-1 w-full rounded-xl sm:flex sm:shadow-sm">
                <div className="relative flex w-full flex-grow items-stretch shadow-sm sm:shadow-inherit">
                  <div className="absolute bottom-0 left-0 z-10 flex items-center gap-0 pl-2">
                    {/* Web Search toggle as icon button */}
                    <Tooltip content={'Web Search'}>
                      <button
                        type="button"
                        disabled={loading || showUpgrade}
                        className={clsx(
                          'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                          webSearch
                            ? 'font-bold text-cyan-600'
                            : 'text-gray-600',
                        )}
                        onClick={() => {
                          const newValue = !webSearch
                          setWebSearch(newValue)
                          updateSelectedJobTools(newValue, codeInterpreter)
                        }}
                      >
                        {webSearch ? (
                          <GlobeAltIconSolid className="h-5 w-5" />
                        ) : (
                          <GlobeAltIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                    {/* Code tools toggle as icon button */}
                    <Tooltip content={'Code Interpreter'}>
                      <button
                        type="button"
                        disabled={loading || showUpgrade}
                        className={clsx(
                          'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                          codeInterpreter
                            ? 'font-bold text-cyan-600'
                            : 'text-gray-600',
                        )}
                        onClick={() => {
                          const newValue = !codeInterpreter
                          setCodeInterpreter(newValue)
                          updateSelectedJobTools(webSearch, newValue)
                        }}
                      >
                        {codeInterpreter ? (
                          <CodeBracketSquareIconSolid className="h-5 w-5" />
                        ) : (
                          <CodeBracketSquareIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                    <ModelSelector />
                  </div>

                  <textarea
                    ref={textareaRef}
                    name="query"
                    id="query"
                    value={question}
                    disabled={loading || showUpgrade}
                    maxLength={2000}
                    minLength={2}
                    required
                    rows={1}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.isComposing || e.keyCode === 229) {
                        return
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (e.shiftKey) {
                          setQuestion((prevQuestion) => `${prevQuestion}\n`)
                        } else if (!e.shiftKey && !loading && !showUpgrade) {
                          startResearch(e)
                        }
                      }
                    }}
                    tabIndex={1}
                    autoComplete="off"
                    className={clsx(
                      'text-md block min-h-16 w-full resize-none rounded-xl border border-gray-300 px-2 pb-10 pt-3 outline-none focus:border-none focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:px-4',
                    )}
                    placeholder={
                      clarifyingJob
                        ? "Please answer the clarification questions..."
                        : 'Ask a complex research question...'
                    }
                  />

                  <button
                    type="submit"
                    tabIndex={2}
                    disabled={loading || showUpgrade}
                    className="absolute bottom-0 right-0 my-3 mr-2 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <span className="sr-only">Start research</span>
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="relative w-5">
                          <div className="h-5 w-5 rounded-full border border-teal-400"></div>
                          <div className="absolute left-0 top-0 h-5 w-5 animate-spin rounded-full border-t-2 border-cyan-600"></div>
                        </div>
                      </div>
                    ) : (
                      <PaperAirplaneIcon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <span />
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <span>Use Shift + Enter to skip to a new line.</span>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  )
}

function ResearchResults({ job, onBack, onJobUpdate }) {
  const [resultHtml, setResultHtml] = useState('')
  const [resultDisplayHtml, setResultDisplayHtml] = useState('')
  const [clarificationsHtml, setClarificationsHtml] = useState('')
  const [summaryHtml, setSummaryHtml] = useState('')
  const [isHtmlCopied, setIsHtmlCopied] = useState(false)
  const [costInfo, setCostInfo] = useState(null)
  const [footnotes, setFootnotes] = useState([])
  const [user] = useAuthState(auth)
  const scrollToBottomRef = useRef(null)

  // Expose scroll function to parent component
  useEffect(() => {
    if (onJobUpdate) {
      onJobUpdate(() => {
        if (scrollToBottomRef.current) {
          scrollToBottomRef.current()
        }
      })
    }
  }, [onJobUpdate])

  // Render clarifications as markdown
  useEffect(() => {
    const renderClarifications = async () => {
      if (!job?.clarifications) {
        setClarificationsHtml('')
        return
      }
      try {
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
          .use(remarkMathPlugin, { singleDollarTextMath: false })
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(preprocessLaTeX(job.clarifications))
        setClarificationsHtml(String(file))
      } catch (err) {
        console.warn('Error rendering clarifications markdown:', err)
        setClarificationsHtml('')
      }
    }
    renderClarifications()
  }, [job?.clarifications])

  // Render summary as markdown
  useEffect(() => {
    const renderSummary = async () => {
      if (!job?.summary) {
        setSummaryHtml('')
        return
      }
      try {
        const file = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
          .use(remarkMathPlugin, { singleDollarTextMath: false })
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(preprocessLaTeX(job.summary))
        setSummaryHtml(String(file))
      } catch (err) {
        console.warn('Error rendering summary markdown:', err)
        setSummaryHtml('')
      }
    }
    renderSummary()
  }, [job?.summary])

  useEffect(() => {
    if (!job?.result) {
      setResultHtml('')
      setResultDisplayHtml('')
      setFootnotes([])
      return
    }

    const annotations = extractUrlAnnotations(job?.response)
    const { annotatedText, footnotes: generatedFootnotes } = injectCitationPlaceholders(
      job.result,
      annotations,
    )
    setFootnotes(generatedFootnotes)

    let isCancelled = false

    const createProcessor = () =>
      unified()
        .use(remarkParse)
        .use(remarkMathPlugin, { singleDollarTextMath: false })
        .use(remarkGfm)
        .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)

    const renderMarkdown = async () => {
      const tryProcess = async (source, attemptPreprocess = true) => {
        try {
          const file = await createProcessor().process(
            attemptPreprocess ? preprocessLaTeX(source) : source,
          )
          return String(file)
        } catch (error) {
          if (attemptPreprocess) {
            return tryProcess(source, false)
          }
          console.warn('Error processing markdown:', error)
          return source
        }
      }

      const html = await tryProcess(annotatedText)
      if (isCancelled) return
      const htmlWithMarkers = renderCitationMarkers(html, generatedFootnotes)
      const htmlWithSuperscripts = renderCitationSupHtml(html, generatedFootnotes)
      const cleanedMarkers = stripCitationLinks(htmlWithMarkers, generatedFootnotes)
      const cleanedSuperscripts = stripCitationLinks(
        htmlWithSuperscripts,
        generatedFootnotes,
      )
      setResultDisplayHtml(cleanedMarkers)
      setResultHtml(cleanedSuperscripts)
    }

    renderMarkdown()

    return () => {
      isCancelled = true
    }
  }, [job?.response, job?.result])

  const renderedResultContent = useMemo(() => {
    if (!resultDisplayHtml) return null
    let citationKey = 0
    return parse(resultDisplayHtml, {
      replace: (domNode) => {
        if (
          domNode.type === 'tag' &&
          domNode.name === 'span' &&
          domNode.attribs?.['data-citation']
        ) {
          const number = Number(domNode.attribs['data-citation'])
          if (!Number.isFinite(number)) return null
          const footnote = footnotes.find((item) => item.number === number)
          if (!footnote) return null
          const title =
            footnote.title || footnote.url || `Source ${number}`
          citationKey += 1
          return (
            <Tooltip
              key={`citation-${number}-${citationKey}`}
              content={title}
              placement="top"
            >
              <sup
                id={`citation-${number}`}
                className="relative align-super text-[0.65em] font-semibold text-cyan-600"
              >
                <a
                  href={`#footnote-${number}`}
                  className="inline-flex items-center justify-center rounded-full px-0.5 text-current no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                  aria-label={`Jump to source ${number}`}
                >
                  {number}
                </a>
              </sup>
            </Tooltip>
          )
        }
        return undefined
      },
    })
  }, [resultDisplayHtml, footnotes])

  // Compute pricing based on Standard tier deep-research models and tool calls
  useEffect(() => {
    const response = job?.response || null
    if (!response?.usage) {
      setCostInfo(null)
      return
    }

    const pickModel = () => {
      // Prefer explicit job.model, then response.model; fallback to 'o4-mini'
      const m = (job?.model || response?.model || '').toString().toLowerCase()
      if (m.includes('o3')) return 'o3'
      if (m.includes('o4-mini') || m.includes('o4mini') || m.includes('o4'))
        return 'o4-mini'
      return 'o4-mini'
    }

    const model = pickModel()

    // Standard tier pricing (per 1M tokens)
    const PRICES = {
      o3: { input: 10.0, cachedInput: 2.5, output: 40.0 },
      'o4-mini': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    }

    const p = PRICES[model] || PRICES['o4-mini']
    const rate = {
      input: p.input / 1_000_000,
      cached: p.cachedInput / 1_000_000,
      output: p.output / 1_000_000,
    }

    const usage = response.usage || {}
    const inputTokens = Math.max(0, usage.input_tokens || 0)
    const cachedTokens = Math.max(
      0,
      (usage.input_tokens_details &&
        usage.input_tokens_details.cached_tokens) ||
        usage.cached_tokens ||
        0,
    )
    const nonCachedTokens = Math.max(0, inputTokens - cachedTokens)
    const outputTokens = Math.max(0, usage.output_tokens || 0)

    const inputCost = nonCachedTokens * rate.input + cachedTokens * rate.cached
    const outputCost = outputTokens * rate.output

    // Tool call costs
    const outputItems = Array.isArray(response.output) ? response.output : []
    const webSearchCalls = outputItems.filter(
      (i) => i?.type === 'web_search_call',
    ).length
    const codeInterpreterCalls = outputItems.filter(
      (i) => i?.type === 'code_interpreter_call',
    ).length

    // Web search per-call fee: o-series => $10 / 1k calls = $0.01 per call
    // (If using 4o/4.1, it would be $0.025, but deep-research uses o-series here.)
    const webSearchCostPerCall = 0.01
    const codeInterpreterCostPerCall = 0.03 // per container; approximate per call

    const toolsCost =
      webSearchCalls * webSearchCostPerCall +
      codeInterpreterCalls * codeInterpreterCostPerCall

    const total = inputCost + outputCost + toolsCost

    const round = (n) => Math.round(n * 1000) / 1000 // keep three decimals pre-render
    setCostInfo({
      total: round(total),
      input: round(inputCost),
      output: round(outputCost),
      tools: round(toolsCost),
      breakdown: {
        webSearchCalls,
        codeInterpreterCalls,
        model,
        inputTokens,
        cachedTokens,
        outputTokens,
      },
    })
  }, [job?.response, job?.model])

  const appendSignature = (content) => {
    const footer = '\n\nGenerated with DocsBot'
    if (!content) return footer.trim()
    return content.endsWith(footer.trim()) ? content : `${content}${footer}`
  }

  const removeSuperscriptLinks = (html) => {
    if (!html) return ''
    return html.replace(
      /<sup([^>]*)>\s*<a[^>]*>(\d+)<\/a>(.*?)<\/sup>/gi,
      (_match, supAttrs, number, srOnly) => {
        return `<sup${supAttrs}>${number}${srOnly || ''}</sup>`
      },
    )
  }

  const handleCopyHtml = async () => {
    if (!resultHtml) return
    const title = job?.title ? escapeHtml(job.title) : 'Deep Research Findings'
    const formattedDate = formatLocalDateTime(
      job?.completedAt || job?.updatedAt || job?.createdAt,
    )
    const sourcesHtml =
      footnotes.length > 0
        ? `
            <section style="margin-top:24px;">
              <h3 style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:8px;">Sources</h3>
              <ol style="margin:0;padding-left:20px;font-size:14px;color:#1f2937;line-height:1.6;">
                ${footnotes
                  .map((footnote) => {
                    const safeUrl = footnote.url ? escapeHtml(footnote.url) : ''
                    const label = footnote.title || footnote.url || `Source ${footnote.number}`
                    const safeLabel = escapeHtml(label)
                    const linkMarkup = safeUrl
                      ? `<a href="${safeUrl}" target="_blank" rel="noopener" style="color:#0e7490;text-decoration:none;">${safeLabel}</a>`
                      : safeLabel
                    return `<li style="margin-bottom:6px;">${linkMarkup}</li>`
                  })
                  .join('')}
              </ol>
            </section>
          `
        : ''
    const htmlContent = `
      <article style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;">
        <header style="border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:24px;">
          <p style="font-size:11px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#0e7490;margin:0;">Deep Research</p>
          <h2 style="font-size:26px;margin:8px 0 6px;">${title}</h2>
          ${formattedDate ? `<p style="font-size:13px;color:#64748b;margin:0;">${formattedDate}</p>` : ''}
        </header>
        <section style="font-size:15px;color:#0f172a;">
          ${removeSuperscriptLinks(resultHtml)}
        </section>
        ${sourcesHtml}
        <footer style="margin-top:32px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.2em;">
          Generated with DocsBot
        </footer>
      </article>
    `.trim()

    try {
      if (navigator?.clipboard?.write) {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([appendSignature(job?.result || '')], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([clipboardItem])
      } else {
        await navigator.clipboard.writeText(htmlContent)
      }
      setIsHtmlCopied(true)
      setTimeout(() => {
        setIsHtmlCopied(false)
      }, 1500)
    } catch (error) {
      console.warn('Unable to copy formatted HTML:', error)
      navigator.clipboard.writeText(appendSignature(job?.result || ''))
    }
  }

  const handlePrintReport = useCallback(() => {
    if (!job?.result) return

    const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes')
    if (!printWindow) {
      console.warn('Unable to open print preview window')
      return
    }
    printWindow.opener = null

    const origin = window.location.origin
    const displayTitle = job.title ? escapeHtml(job.title) : 'Deep Research Report'
    const completedTimestamp = job?.completedAt || job?.updatedAt || job?.createdAt
    const completedLabel = formatLocalDateTime(completedTimestamp)
    const requestedBy = job?.metadata?.name ? escapeHtml(job.metadata.name) : ''
    const requesterEmail = job?.metadata?.email ? escapeHtml(job.metadata.email) : ''

    const metaParts = []
    if (completedLabel) metaParts.push(completedLabel)
    if (requestedBy) metaParts.push(`Requested by ${requestedBy}`)
    if (requesterEmail) metaParts.push(requesterEmail)

    const metaLine = metaParts.join(' • ')

    const sections = [
      `
      <section>
        ${resultHtml}
      </section>
    `,
    ]

    let sourcesSection = ''
    if (footnotes.length > 0) {
      const sources = footnotes
        .map((footnote) => {
          const safeUrl = footnote.url ? escapeHtml(footnote.url) : ''
          const label = footnote.title || footnote.url || `Source ${footnote.number}`
          const safeLabel = escapeHtml(label)
          const linkMarkup = safeUrl
            ? `<a href="${safeUrl}" target="_blank" rel="noopener">${safeLabel}</a>`
            : safeLabel
          return `
            <li id="footnote-${footnote.number}">
              ${linkMarkup}
            </li>
          `
        })
        .join('')

      sourcesSection = `
        <section class="mt-12" aria-labelledby="print-sources-heading">
          <h2 id="print-sources-heading">Sources</h2>
          <ol class="mt-4 space-y-2">${sources}</ol>
        </section>
      `
    }

    const headStyles = Array.from(
      document.head?.querySelectorAll('style, link[rel="stylesheet"]') || [],
    )
      .map((node) => node.outerHTML)
      .join('\n')

    const inlineStyles = `
      <style>
        @media print {
          .print-container {
            padding: 2rem 2.5rem;
          }
        }
      </style>
    `

    const documentHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>${displayTitle}</title>
          ${headStyles}
          ${inlineStyles}
        </head>
        <body class="bg-white text-slate-900">
          <div class="print-container mx-auto max-w-3xl px-8 py-12 sm:px-10">
            <header class="mb-10 border-b border-slate-200 pb-6">
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Deep Research Report</p>
              <h1 class="mt-2 text-3xl font-bold text-slate-900">${displayTitle}</h1>
              ${metaLine ? `<p class="mt-3 text-sm text-slate-500">${metaLine}</p>` : ''}
            </header>
            <article class="prose prose-slate max-w-none">
              ${sections.join('\n')}
              ${sourcesSection}
            </article>
            <footer class="mt-16 flex flex-col items-center justify-center gap-3 text-center text-xs uppercase tracking-wider text-slate-500">
              <span>Generated with DocsBot</span>
              <img src="${origin}/branding/docsbot-logo.svg" alt="DocsBot logo" class="h-6" />
            </footer>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(documentHtml)
    printWindow.document.close()
    printWindow.focus()

    const triggerPrint = () => {
      try {
        printWindow.print()
      } catch (err) {
        console.warn('Unable to trigger print dialog:', err)
      }
    }

    if (printWindow.document.readyState === 'complete') {
      setTimeout(triggerPrint, 300)
    } else {
      printWindow.onload = () => setTimeout(triggerPrint, 300)
    }
  }, [job, resultHtml, footnotes, clarificationsHtml, summaryHtml, costInfo])

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-3 pt-4">
      <div className="flex w-full flex-col text-center">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Back to Research
          </button>
          {job?.status === 'completed' && job?.result && (
            <ResearchActionButtons
              onCopy={handleCopyHtml}
              onPrint={handlePrintReport}
              isCopied={isHtmlCopied}
            />
          )}
        </div>

        <div className="my-auto">
          <h2 className="my-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {job.title}
          </h2>
        </div>

        {/* 1. User question */}
        <UserMessage
          text={job.question}
          alias={job.metadata?.name || 'User'}
          email={job.metadata?.email}
        />

        {/* 2. Bot clarifications */}
        {job?.clarifications && (
          <BotMessage
            text={job.clarifications}
            html={clarificationsHtml}
            className="mr-12"
          />
        )}

        {/* 3. User answers */}
        {job?.answers && (
          <UserMessage
            text={job.answers}
            alias={job.metadata?.name || 'User'}
            email={job.metadata?.email}
          />
        )}

        {/* 4. Bot summary */}
        {job?.summary && (
          <BotMessage
            text={job.summary}
            html={summaryHtml}
            className="mr-12"
          />
        )}

        {/* Collapsible timeline of tool calls and reasoning */}
        {job?.response?.output && (
          <OutputTimeline
            output={job.response.output}
            defaultOpen={job.status === 'in_progress' || job.status === 'queued'}
            onScrollToBottom={(scrollFn) => {
              scrollToBottomRef.current = scrollFn
            }}
          />
        )}

        {job.status === 'failed' ? (
          <div className="mb-4 mt-4 flex items-start justify-start">
            <div className="mr-3 hidden h-10 w-10 flex-none sm:block lg:hidden xl:block" />
            <div className="relative max-w-3xl rounded-md border bg-white text-left shadow-sm sm:rounded-lg">
              <div className="absolute -inset-7 flex h-32 w-12 items-center text-2xl font-extrabold tracking-tighter">
                <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-red-500 to-red-600 p-2 shadow-lg">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <div className="rounded-md bg-red-50 p-6 text-start sm:px-8">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Deep Research Failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{job.response?.error?.message || job.response?.error || 'The deep research task encountered an error and could not complete.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : job.status === 'incomplete' ? (
          <div className="mb-4 mt-4 flex items-start justify-start">
            <div className="mr-3 hidden h-10 w-10 flex-none sm:block lg:hidden xl:block" />
            <div className="relative max-w-3xl rounded-md border bg-white text-left shadow-sm sm:rounded-lg">
              <div className="absolute -inset-7 flex h-32 w-12 items-center text-2xl font-extrabold tracking-tighter">
                <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-yellow-500 to-yellow-600 p-2 shadow-lg">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <div className="rounded-md bg-yellow-50 p-6 text-start sm:px-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Deep research incomplete</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{job.response?.error?.message || job.response?.error || 'The deep research task was not completed.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : job.status === 'cancelled' ? (
          <div className="mb-4 mt-4 flex items-start justify-start">
            <div className="mr-3 hidden h-10 w-10 flex-none sm:block lg:hidden xl:block" />
            <div className="relative max-w-3xl rounded-md border bg-white text-left shadow-sm sm:rounded-lg">
              <div className="absolute -inset-7 flex h-32 w-12 items-center text-2xl font-extrabold tracking-tighter">
                <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-gray-500 to-gray-600 p-2 shadow-lg">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <div className="rounded-md bg-gray-50 p-6 text-start sm:px-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Deep research cancelled</h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>The deep research task was cancelled.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <BotMessage className="mt-4 w-full">
            <div className="relative">
              {renderedResultContent ? (
                <div className="space-y-2">
                  {job?.status === 'completed' && job?.result && (
                    <div className="flex justify-end">
                      <ResearchActionButtons
                        onCopy={handleCopyHtml}
                        onPrint={handlePrintReport}
                        isCopied={isHtmlCopied}
                        compact={true}
                      />
                    </div>
                  )}
                  <div className="prose prose-slate max-w-none text-slate-800">
                    {renderedResultContent}
                  </div>
                  {footnotes.length > 0 && (
                    <section className="mt-6 border-t border-gray-200 pt-4" aria-labelledby="docsbot-footnotes-heading">
                      <h3
                        id="docsbot-footnotes-heading"
                        className="text-base font-semibold text-gray-900"
                      >
                        Sources
                      </h3>
                      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
                        {footnotes.map((footnote) => (
                          <li
                            key={footnote.number}
                            id={`footnote-${footnote.number}`}
                            className="leading-relaxed"
                          >
                            <a
                              href={footnote.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-600 underline"
                            >
                              {footnote.title || footnote.url}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  {job?.status === 'completed' && job?.result && (
                    <div className={`flex pt-4 border-t border-gray-200 ${costInfo && user && isSuperAdmin(user.uid) ? 'justify-between items-center' : 'justify-end'}`}>
                      {costInfo && user && isSuperAdmin(user.uid) && (
                        <Tooltip content="Only shown to Super Admins.">
                          <div className="text-xs leading-tight text-gray-500 select-none">
                            Estimated cost: ${costInfo.total.toFixed(2)}
                          </div>
                        </Tooltip>
                      )}
                      <ResearchActionButtons
                        onCopy={handleCopyHtml}
                        onPrint={handlePrintReport}
                        isCopied={isHtmlCopied}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <LoadingDots />
                  <span className="text-xs mt-2 ml-2 text-gray-500">
                    Deep research tasks can take many minutes to complete, please wait or check back later...
                  </span>
                </div>
              )}
            </div>
          </BotMessage>
        )}

        {/* 
        {job.response && (
          <div className="mt-6 text-left">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Research Details
            </h3>
            <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {JSON.stringify(job.response, null, 2)}
              </pre>
            </div>
          </div>
        )}
        //*/}
      </div>
    </div>
  )
}

function Research({ team, bot }) {
  const [researchUsage, setResearchUsage] = useState(() =>
    buildUsageSnapshot(team),
  )
  const [researchJobs, setResearchJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [errorText, setErrorText] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)
  const [user] = useAuthState(auth)
  const [currentPage, setCurrentPage] = useState(0)
  const [perPage, setPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [canModify, setModify] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletingJobId, setDeletingJobId] = useState(null)
  const didInitFromJobId = useRef(false)
  const scrollToBottomRef = useRef(null)

  const trialNoticeInfo = useMemo(() => {
    if (!researchUsage) return null

    const {
      monthlyLimit,
      lifetimeLimit,
      trialRemaining = 0,
      legacyTrialThreshold,
      historicalMaxResearch = 0,
      planId,
      planName,
    } = researchUsage

    const hasMonthlyAllowance =
      monthlyLimit === null ||
      (typeof monthlyLimit === 'number' && monthlyLimit > 0)

    if (hasMonthlyAllowance) {
      return null
    }

    const normalizedPlanId = (planId || '').toLowerCase()
    const isLegacyTrialPlan = Boolean(normalizedPlanId === 'pro' ||
        normalizedPlanId === 'personal')

    const trialTotal =
      (typeof lifetimeLimit === 'number' && lifetimeLimit > 0
        ? lifetimeLimit
        : null) ??
      (typeof legacyTrialThreshold === 'number' && legacyTrialThreshold > 0
        ? legacyTrialThreshold
        : null) ??
      (isLegacyTrialPlan ? 2 : null)

    if (typeof trialTotal !== 'number' || trialTotal <= 0) {
      return null
    }

    const derivedUsed =
      typeof lifetimeLimit === 'number' && lifetimeLimit > 0
        ? Math.max(
            0,
            Math.min(trialTotal, trialTotal - trialRemaining),
          )
        : Math.max(
            0,
            Math.min(trialTotal, historicalMaxResearch || 0),
          )

    if (derivedUsed >= trialTotal) {
      return null
    }

    return { used: derivedUsed, total: trialTotal }
  }, [researchUsage])

  const refreshResearchCount = useCallback(async () => {
    if (!team?.id) return null
    try {
      const response = await fetch(`/api/teams/${team.id}/research-count`)
      if (!response.ok) {
        console.warn('Failed to refresh research count:', response.status)
        return null
      }
      const data = await response.json()
      const latestCount = Number(data?.researchCount ?? 0) || 0
      const baseUsage =
        researchUsage || buildUsageSnapshot(team)
      const nextUsage = recomputeUsageDerived({
        ...baseUsage,
        monthlyUsed: latestCount,
      })
      setResearchUsage(nextUsage)
      return nextUsage
    } catch (error) {
      console.warn('Error refreshing research count:', error)
      return null
    }
  }, [team, team?.id, researchUsage])

  const handleResearchTaskStarted = useCallback(
    ({ consumeTrial = false } = {}) => {
      setResearchUsage((prev) => {
        if (!prev) return prev

        const nextUsage = {
          ...prev,
          monthlyUsed: (prev.monthlyUsed ?? 0) + 1,
        }

        if (consumeTrial) {
          const lifetimeLimit = prev.lifetimeLimit
          const previousLifetimeUsed = prev.lifetimeUsed ?? 0
          nextUsage.lifetimeUsed =
            typeof lifetimeLimit === 'number'
              ? Math.min(previousLifetimeUsed + 1, lifetimeLimit)
              : previousLifetimeUsed + 1
        }

        const currentHistorical = prev.historicalMaxResearch ?? 0
        const trialThreshold = prev.legacyTrialThreshold ?? null
        const inferredHistorical = Math.max(
          currentHistorical,
          nextUsage.monthlyUsed ?? 0,
        )

        nextUsage.historicalMaxResearch = consumeTrial && trialThreshold
          ? Math.max(inferredHistorical, trialThreshold)
          : inferredHistorical

        return recomputeUsageDerived(nextUsage)
      })
    },
    [],
  )

  useEffect(() => {
    fetchResearchJobs(0)
  }, [])

  // Determine if current user can modify bot
  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid))
  }, [team, user])

  // Deep-link: select job from URL if provided (run once per page load)
  useEffect(() => {
    if (didInitFromJobId.current) return
    if (!team?.id || !bot?.id) return

    const urlParams = new URLSearchParams(window.location.search)
    const jobId = urlParams.get('jobId')
    if (!jobId) return

    didInitFromJobId.current = true

    const existing = researchJobs.find((j) => j.jobId === jobId)
    if (existing) {
      setSelectedJob(existing)
      fetchJobStatus(jobId)
      return
    }

    // Fallback: fetch from internal DB and add/select
    ;(async () => {
      try {
        const path = `/api/teams/${team.id}/bots/${bot.id}/research/${jobId}`
        const response = await fetch(path, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const job = await response.json()
          setResearchJobs((prev) => {
            const exists = prev.some((j) => j.jobId === job.jobId)
            return exists ? prev : [job, ...prev]
          })
          setSelectedJob(job)
          // also refresh external status if possible
          fetchJobStatus(jobId)
        } else {
          try {
            const data = await response.json()
            if (data.error || data.message) {
              setErrorText(data.error || data.message)
            }
          } catch (err) {
            // Silently ignore parsing errors for deep-link fetch
          }
        }
      } catch (err) {
        console.warn('Error fetching deep-linked job:', err)
      }
    })()
  }, [team?.id, bot?.id])

  useEffect(() => {
    console.log('selectedJob', selectedJob)
    if (
      selectedJob &&
      (selectedJob.status === 'queued' || selectedJob.status === 'in_progress')
    ) {
      const interval = setInterval(() => {
        fetchJobStatus(selectedJob.jobId)
      }, 20000)
      setPollingInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [selectedJob])

  const fetchResearchJobs = async (page = 0) => {
    setLoading(true)
    setErrorText(null)

    try {
      const path = `/api/teams/${team.id}/bots/${bot.id}/research?page=${page}&perPage=${perPage}`
      const response = await fetch(path, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setResearchJobs(data.jobs || [])
        // best-effort pagination mapping
        const pagination = data.pagination || {}
        setCurrentPage(pagination.page ?? page)
        setPerPage(pagination.perPage ?? perPage)
        setTotalCount(
          pagination.viewableCount ??
            pagination.totalCount ??
            data.totalCount ??
            (Array.isArray(data.jobs) ? data.jobs.length : 0),
        )
      } else {
        try {
          const data = await response.json()
          setErrorText(data.error || data.message || 'Failed to load deep research tasks')
        } catch (err) {
          console.error('Error parsing error response:', err)
          setErrorText('Failed to load deep research tasks')
        }
      }
    } catch (error) {
      console.error('Error fetching deep research tasks:', error)
      setErrorText('Failed to load deep research tasks')
    } finally {
      setLoading(false)
    }
  }

  const changePage = async (page) => {
    await fetchResearchJobs(page)
  }

  const fetchJobStatus = async (jobId) => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/research/${jobId}`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + bot.signature,
        },
      })

      if (response.ok) {
        const job = await response.json()
        const existing = researchJobs.find((j) => j.jobId === jobId) || {}
        const merged = { 
          ...existing, 
          ...job,
          // Preserve answers and summary from existing or new data
          answers: job.answers || existing.answers,
          summary: job.summary || existing.summary,
          // Preserve metadata from API response or existing
          metadata: job.metadata || existing.metadata,
        }
        setResearchJobs((prev) =>
          prev.map((j) => (j.jobId === jobId ? merged : j)),
        )
        if (selectedJob && selectedJob.jobId === jobId) {
          setSelectedJob(merged)
          
          // Scroll to bottom of research steps after status update
          if (scrollToBottomRef.current) {
            setTimeout(() => {
              scrollToBottomRef.current()
            }, 100) // Small delay to ensure DOM is updated
          }
        }
      }
    } catch (error) {
      console.error('Error fetching job status:', error)
    }
  }

  const cancelJob = async (jobId) => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/research/${jobId}`
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + bot.signature,
        },
      })

      if (response.ok) {
        await fetchResearchJobs()
        if (selectedJob && selectedJob.jobId === jobId) {
          setSelectedJob(null)
        }
      } else {
        try {
          const data = await response.json()
          setErrorText(data.error || data.message || 'Failed to cancel deep research task')
        } catch (err) {
          console.error('Error parsing error response:', err)
          setErrorText('Failed to cancel deep research task')
        }
      }
    } catch (error) {
      console.error('Error cancelling deep research task:', error)
      setErrorText('Failed to cancel deep research task')
    }
  }

  const deleteJob = async (jobId) => {
    if (!canModify) return

    if (deleteConfirm !== jobId) {
      setDeleteConfirm(jobId)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    setDeleteConfirm(null)
    setDeletingJobId(jobId)
    try {
      const path = `/api/teams/${team.id}/bots/${bot.id}/research/${jobId}`
      const response = await fetch(path, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        setResearchJobs((prev) => prev.filter((j) => j.jobId !== jobId))
        // navigate to previous or clear selection
        if (selectedJob?.jobId === jobId) {
          setSelectedJob(null)
          const url = new URL(window.location.href)
          url.searchParams.delete('jobId')
          window.history.replaceState({}, '', url.toString())
        }
      } else {
        try {
          const data = await response.json()
          setErrorText(data.error || data.message || 'Failed to delete deep research task')
        } catch (err) {
          console.error('Error parsing error response:', err)
          setErrorText('Failed to delete deep research task')
        }
      }
    } catch (err) {
      console.warn('Error deleting deep research task:', err)
      setErrorText('Failed to delete deep research task')
    } finally {
      setDeletingJobId(null)
    }
  }

  const copyJobLink = () => {
    if (!selectedJob) return
    const jobUrl = `${window.location.origin}/app/bots/${bot.id}/research?jobId=${selectedJob.jobId}`
    navigator.clipboard.writeText(jobUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Function to copy user email
  const copyUserEmail = () => {
    if (!selectedJob || !selectedJob.metadata?.email) return

    navigator.clipboard.writeText(selectedJob.metadata.email)
    setEmailCopied(true)
    setTimeout(() => {
      setEmailCopied(false)
    }, 2000)
  }

  const handleSelectJob = (job) => {
    setSelectedJob(job)
    const url = new URL(window.location.href)
    url.searchParams.set('jobId', job.jobId)
    window.history.replaceState({}, '', url.toString())
  }

  const formatRuntime = (job) => {
    if (!job?.createdAt || !job?.completedAt) return null
    const start = new Date(job.createdAt)
    const end = new Date(job.completedAt)
    const ms = Math.max(0, end - start)
    const sec = Math.floor(ms / 1000)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const handleJobCreated = (jobId) => {
    // No need to refetch all jobs since we're now updating local state immediately
    // Just fetch the individual job status after a short delay to get any updates
    setTimeout(async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/research/${jobId}`
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + bot.signature,
          },
        })
        if (response.ok) {
          let job = await response.json()
          if (job.status === 'clarifying' && !job.clarifications) {
            try {
              const path = `/api/teams/${team.id}/bots/${bot.id}/research/${jobId}`
              const dbRes = await fetch(path, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              })
              if (dbRes.ok) {
                const dbJob = await dbRes.json()
                if (dbJob?.clarifications) {
                  job = { ...job, clarifications: dbJob.clarifications }
                }
              }
            } catch (err) {
              console.warn('Error fetching clarifications on create:', err)
            }
          }
          const existing = researchJobs.find((j) => j.jobId === jobId) || {}
          const merged = { 
            ...existing, 
            ...job,
            // Preserve answers and summary from existing or new data
            answers: job.answers || existing.answers,
            summary: job.summary || existing.summary,
            // Preserve metadata from API response or existing
            metadata: job.metadata || existing.metadata,
          }
          // also update the list entry to ensure we retain camelCase fields from DB/list
          setResearchJobs((prev) =>
            prev.map((j) => (j.jobId === jobId ? merged : j)),
          )
          setSelectedJob(merged)
        }
      } catch (error) {
        console.error('Error fetching new deep research task:', error)
      }
    }, 1000)
  }

  const title = [bot.name, 'Deep Research']

  const Header = () => {
    const usageDisplay = formatResearchUsageDisplay(researchUsage)
    const usageTooltipContent = usageDisplay
      ? usageDisplay.tooltip
        ? `${usageDisplay.label}<br/>${usageDisplay.tooltip}`
        : usageDisplay.label
      : 'Start a deep research task'

    return (
      <div className="w-full border-t bg-white p-2 px-2 lg:px-6 lg:pr-80 xl:pr-96">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="mt-1 flex flex-col items-center sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-2 sm:py-1 lg:space-x-6">
              <Link
                href={`/app/bots/${bot.id}`}
                className="text-md mr-2 hidden items-center border-r border-gray-200 pr-4 font-medium text-gray-500 hover:text-gray-700 xl:flex"
              >
                <ChevronLeftIcon
                  className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                Back
              </Link>
              {selectedJob && (
                <>
                  {selectedJob.metadata?.name &&
                    selectedJob.metadata?.email && (
                      <Tooltip
                        content={
                          emailCopied
                            ? 'Copied!'
                            : `${selectedJob.metadata.name}<br/>${selectedJob.metadata.email}<br/><small>Click to copy email</small>`
                        }
                      >
                        <button
                          className="flex items-center text-gray-400 hover:text-gray-600"
                          onClick={copyUserEmail}
                          disabled={emailCopied}
                          type="button"
                        >
                          {emailCopied ? (
                            <CheckIcon
                              className="h-4 w-4 text-green-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <UserAvatar
                              alias={selectedJob.metadata.name}
                              email={selectedJob.metadata.email}
                              className="h-5 w-5 rounded-full"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </Tooltip>
                    )}
                  <div className="flex flex-wrap items-center gap-x-2 xl:gap-x-4">
                    <Tooltip
                      content={`Created: ${new Date(selectedJob.createdAt).toUTCString()}`}
                    >
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon
                          className="h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="ml-1.5 hidden 2xl:inline">
                          <TimeAgo dateTime={selectedJob.createdAt} />
                        </span>
                      </div>
                    </Tooltip>
                    {selectedJob.status === 'completed' && selectedJob.completedAt && (
                      <Tooltip content={`Run time`}>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon
                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="ml-1.5 hidden 2xl:inline">
                            {formatRuntime(selectedJob)}
                          </span>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  <div className="h-6 border-l border-gray-300"></div>
                  <div className="flex flex-wrap items-center gap-x-2 xl:gap-x-4">
                    <Tooltip content="Document search enabled">
                      <div className="flex items-center text-sm text-gray-500">
                        <DocumentMagnifyingGlassIconSolid
                          className="h-5 w-5 flex-shrink-0 text-cyan-600"
                          aria-hidden="true"
                        />
                      </div>
                    </Tooltip>
                    <Tooltip content={selectedJob.webSearch ? "Web search enabled" : "Web search disabled"}>
                      <div className="flex items-center text-sm text-gray-500">
                        {selectedJob.webSearch ? (
                          <GlobeAltIconSolid
                            className="h-5 w-5 flex-shrink-0 text-cyan-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <GlobeAltIcon
                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </Tooltip>
                    <Tooltip content={selectedJob.codeInterpreter ? "Code interpreter enabled" : "Code interpreter disabled"}>
                      <div className="flex items-center text-sm text-gray-500">
                        {selectedJob.codeInterpreter ? (
                          <CodeBracketSquareIconSolid
                            className="h-5 w-5 flex-shrink-0 text-cyan-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <CodeBracketSquareIcon
                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="ml-4 flex items-center space-x-4 lg:mr-2 xl:mr-4">
            {usageDisplay?.ratio && (
              <span className="whitespace-nowrap text-xs text-gray-500">
                {usageDisplay.ratio}
              </span>
            )}
            <Tooltip content={usageTooltipContent}>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="hidden items-center rounded-md border border-cyan-600 px-2 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 sm:inline-flex"
              >
                New Research Task
              </button>
            </Tooltip>
            {selectedJob && (
              <>
                <Tooltip
            content={
              copied
                ? 'Copied!'
                : 'Copy a link to this deep research task to share with team members.'
            }
                >
                  <button
                    className="flex items-center text-gray-400 hover:text-gray-600"
                    onClick={copyJobLink}
                    disabled={copied}
                    type="button"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ClipboardDocumentIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </Tooltip>
                {canModify && (
                  <Tooltip
                    content={
                      deletingJobId === selectedJob.jobId
                        ? 'Deleting...'
                        : deleteConfirm === selectedJob.jobId
                        ? 'Click again to confirm deletion'
                        : 'Delete this deep research task'
                    }
                  >
                    <button
                      className={`flex items-center rounded-md p-1 ${
                        deleteConfirm === selectedJob.jobId
                          ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                          : 'text-gray-400 hover:text-red-600'
                      }`}
                      onClick={() => deleteJob(selectedJob.jobId)}
                      disabled={deletingJobId === selectedJob.jobId}
                      type="button"
                    >
                      {deletingJobId === selectedJob.jobId ? (
                        <LoadingSpinner small={true} />
                      ) : (
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </Tooltip>
                )}
              </>
            )}
            <Paginator
              perPage={perPage}
              totalCount={totalCount}
              page={currentPage}
              changePage={(page) => changePage(page)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardWrap
      page="Bots"
      title={title}
      team={team}
      fullWidth={true}
      header={<Header />}
    >
      <main className="relative lg:pr-80 xl:pr-96">
        <div className="mx-auto max-w-4xl">
          {trialNoticeInfo && (
            <Alert
              type="warning"
              title="Deep Research trial access"
            >
              <p className="mb-1">
              Deep Research isn’t included in your plan, but we’re giving you a few trial tasks so you can see its powerful capabilities.
              </p>
              <p className="text-sm font-medium text-slate-700">
                Trial research tasks: {trialNoticeInfo.used}/{trialNoticeInfo.total}
              </p>
            </Alert>
          )}
          <Alert title={errorText} type="warning" />
        </div>
        <div className="mx-auto max-w-4xl bg-gray-50 py-2 lg:py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center p-8 text-gray-500">
              Loading deep research tasks...
            </div>
          ) : selectedJob ? (
            selectedJob.status === 'clarifying' ? (
              <ResearchInterface
                team={team}
                bot={bot}
                onJobCreated={handleJobCreated}
                clarifyingJob={selectedJob}
                onClarificationsContinue={() => {
                  fetchJobStatus(selectedJob.jobId)
                }}
                setSelectedJob={setSelectedJob}
                setResearchJobs={setResearchJobs}
                selectedJob={selectedJob}
                researchUsage={researchUsage}
                refreshResearchCount={refreshResearchCount}
                onResearchTaskStarted={handleResearchTaskStarted}
              />
            ) : (
              <ResearchResults
                job={selectedJob}
                onBack={() => {
                  setSelectedJob(null)
                  const url = new URL(window.location.href)
                  url.searchParams.delete('jobId')
                  window.history.replaceState({}, '', url.toString())
                }}
                onJobUpdate={(scrollFn) => {
                  scrollToBottomRef.current = scrollFn
                }}
              />
            )
          ) : (
            <ResearchInterface
              team={team}
              bot={bot}
              onJobCreated={handleJobCreated}
              setSelectedJob={setSelectedJob}
              setResearchJobs={setResearchJobs}
              selectedJob={selectedJob}
              researchUsage={researchUsage}
              refreshResearchCount={refreshResearchCount}
              onResearchTaskStarted={handleResearchTaskStarted}
            />
          )}
        </div>
      </main>

      <aside className="fixed inset-y-0 right-0 hidden w-80 overflow-y-auto border-l border-gray-200 bg-white pt-16 lg:block xl:w-96">
        {researchJobs && researchJobs.length > 0 ? (
          <ul role="list" className="divide-y divide-gray-100">
            {researchJobs.map((job) => (
              <ResearchJob
                key={job.jobId}
                job={job}
                onSelect={handleSelectJob}
                isSelected={selectedJob && selectedJob.id === job.id}
                onCancel={cancelJob}
              />
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-gray-500">
            No deep research tasks yet. Start your first deep research task!
          </div>
        )}
      </aside>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params

  if (data?.props?.team) {
    data.props.bot = await getBot(data.props.team.id, botId)
    if (!data.props.bot) {
      return {
        notFound: true,
      }
    }
  }

  return data
}

export default Research
