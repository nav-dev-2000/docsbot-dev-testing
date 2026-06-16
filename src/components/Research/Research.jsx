import {
    useState,
    useEffect,
    useRef,
    Fragment,
    useCallback,
    useMemo,
} from 'react'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import { isSuperAdmin } from '@/utils/helpers'
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
    BellIcon,
    ChatBubbleLeftRightIcon,
    FlagIcon,
    LanguageIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
    CheckCircleIcon as CheckCircleIconSolid,
    CodeBracketSquareIcon as CodeBracketSquareIconSolid,
    GlobeAltIcon as GlobeAltIconSolid,
    DocumentMagnifyingGlassIcon as DocumentMagnifyingGlassIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from '@heroicons/react/24/solid'
import RobotIcon from '@/components/RobotIcon'
import UserAvatar from '@/components/UserAvatar'
import Link from 'next/link'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessLaTeX } from '@/utils/helpers'
import { preprocessMath } from '@/utils/markdown'
import { renderToStaticMarkup } from 'react-dom/server'

const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]
import parse from 'html-react-parser'
import TimeAgo from '@/components/TimeAgo'
import clsx from 'clsx'
import LocaleDateTime from '@/components/LocaleDateTime'
import Tooltip from '@/components/Tooltip'
import ResearchActionButtons from '@/components/ResearchActionButtons'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import ModalOpenAI from '@/components/ModalOpenAI'
import { canUserEditBot } from '@/utils/function.utils'
import { auth } from '@/config/firebase-ui.config'
import { getPreference, setPreference } from '@/utils/preferences'
import LoadingDots from '@/components/LoadingDots'
import LoadingSpinner from '@/components/LoadingSpinner'
import Paginator from '@/components/Paginator'
import Workspace from '@new-dashboard/Workspace'
import Chip from '@new-dashboard/Chip'
import { usePostHog } from 'posthog-js/react'
import {
    normalizeResearchJobTools,
    injectCitationPlaceholders,
    extractUrlAnnotations,
    escapeHtml,
    arrayBufferToBase64,
    base64ToUint8Array,
    formatLocalDateTime,
    calculateResearchCost,
    RESEARCH_SUGGESTIONS,
} from '@/components/Research'

const parseUsageNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

const formatAiCredits = (value) => {
    const number = parseUsageNumber(value)
    if (number === null) return null

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: number > 0 && number < 10 ? 1 : 0,
        maximumFractionDigits: number > 0 && number < 10 ? 1 : 0,
    }).format(number)
}

const getResearchUsageSummary = (job) => {
    const credits = parseUsageNumber(job?.aiCredits)

    if (credits === null || credits <= 0) {
        return null
    }

    return { credits }
}

function ResearchUsageSummary({ usage }) {
    if (!usage) return null

    return (
        <div className="mb-4 text-left text-xs text-gray-500">
            AI credits used: {formatAiCredits(usage.credits)}
        </div>
    )
}

// Internal reusable UserMessage component matching conversations.jsx styling
// Keeps the bubble on the right while allowing text alignment to follow content direction
function UserMessage({ text, alias, email, html, className = '' }) {
    return (
        <div
            className={`mb-4 ml-auto flex max-w-3xl items-start justify-end ${className}`}
        >
            <div
                dir="auto"
                className={`text-md rounded-2xl rounded-tr-none border bg-cyan-50 px-6 py-4 text-start text-gray-700 ${html ? 'first:p:my-0 leading-snug' : ''}`}
            >
                {html ? (
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                ) : text ? (
                    <Streamdown
                        mode="static"
                        isAnimating={false}
                        remarkPlugins={streamdownRemarkPlugins}
                    >
                        {preprocessMath(text)}
                    </Streamdown>
                ) : null}
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
        ? `text-md w-full min-w-full rounded-2xl border bg-white px-6 pt-6 pb-4 text-start leading-snug text-gray-700 first:p:my-0`
        : `text-md ${messageWidth} rounded-2xl rounded-tl-none border bg-white px-6 py-4 text-start leading-snug text-gray-700 first:p:my-0`

    const showAvatar = !isFullWidth

    return (
        <div className={containerClass}>
            {showAvatar && (
                <div className="mr-3 hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-cyan-600 sm:flex lg:hidden xl:flex">
                    <RobotIcon className="h-auto w-4/6 object-scale-down text-white" />
                </div>
            )}
            {children ? (
                <div dir="auto" className={messageClass}>
                    {children}
                </div>
            ) : html ? (
                <div
                    dir="auto"
                    className={messageClass}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            ) : text ? (
                <div
                    dir="auto"
                    className={`${messageClass} whitespace-pre-wrap`}
                >
                    <Streamdown
                        mode="static"
                        isAnimating={false}
                        remarkPlugins={streamdownRemarkPlugins}
                    >
                        {preprocessMath(text)}
                    </Streamdown>
                </div>
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

// Icon map for suggestion chips
const SUGGESTION_ICONS = {
    ChatBubbleLeftRightIcon,
    DocumentMagnifyingGlassIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    CodeBracketSquareIcon,
    LightBulbIcon,
    CalendarIcon,
    FlagIcon,
    MagnifyingGlassIcon,
    LanguageIcon,
    ChartBarIcon,
    UserCircleIcon,
}

// Horizontal clickable suggestion chips for research prompts (carousel)
const SUGGESTION_CAROUSEL_INTERVAL_MS = 4000

function SuggestionChips({ onSelect, disabled }) {
    const scrollRef = useRef(null)
    const itemRef = useRef(null)
    const [hasOverflow, setHasOverflow] = useState(true)

    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const check = () => {
            setHasOverflow(
                container.scrollWidth > container.clientWidth,
            )
        }
        check()
        const ro = new ResizeObserver(check)
        ro.observe(container)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const container = scrollRef.current
        const item = itemRef.current
        if (!container || !item || disabled) return

        const itemWidth = item.offsetWidth + 8 // gap-2 = 8px
        const advance = () => {
            if (!container) return
            const maxScroll = container.scrollWidth - container.clientWidth
            if (maxScroll <= 0) return

            const nextScroll = container.scrollLeft + itemWidth
            if (nextScroll >= maxScroll) {
                container.scrollTo({ left: 0, behavior: 'smooth' })
            } else {
                container.scrollTo({ left: nextScroll, behavior: 'smooth' })
            }
        }

        const id = setInterval(advance, SUGGESTION_CAROUSEL_INTERVAL_MS)
        return () => clearInterval(id)
    }, [disabled])

    const scrollBy = (direction) => {
        const container = scrollRef.current
        const item = itemRef.current
        if (!container || !item || disabled) return
        const itemWidth = item.offsetWidth + 8
        const maxScroll = container.scrollWidth - container.clientWidth
        if (maxScroll <= 0) return

        if (direction === 'left') {
            const nextScroll = container.scrollLeft - itemWidth
            container.scrollTo({
                left: nextScroll < 0 ? maxScroll : nextScroll,
                behavior: 'smooth',
            })
        } else {
            const nextScroll = container.scrollLeft + itemWidth
            container.scrollTo({
                left: nextScroll >= maxScroll ? 0 : nextScroll,
                behavior: 'smooth',
            })
        }
    }

    return (
        <div className="relative mb-4 overflow-hidden">
            {hasOverflow && (
                <>
                    <button
                        type="button"
                        onClick={() => scrollBy('left')}
                        disabled={disabled}
                        aria-label="Scroll suggestions left"
                        className={clsx(
                            'absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-white/40 backdrop-blur-sm transition-colors hover:bg-white/60 focus:outline-none',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy('right')}
                        disabled={disabled}
                        aria-label="Scroll suggestions right"
                        className={clsx(
                            'absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-white/40 backdrop-blur-sm transition-colors hover:bg-white/60 focus:outline-none',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                </>
            )}
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto pb-1 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {RESEARCH_SUGGESTIONS.map((suggestion, index) => {
                    const IconComponent =
                        SUGGESTION_ICONS[suggestion.icon] || LightBulbIcon
                    const isFirst = index === 0
                    return (
                        <button
                            key={index}
                            ref={isFirst ? itemRef : undefined}
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(suggestion)}
                            className={clsx(
                                'flex min-w-0 max-w-[280px] flex-shrink-0 snap-start items-start gap-2 rounded-xl border px-4 py-2 text-left text-sm transition-colors',
                                'border-gray-200 bg-white text-gray-700 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-800',
                                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1',
                                disabled && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            <IconComponent className="mt-1.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                            <span className="min-w-0 break-words italic">
                                "{suggestion.prompt}"
                            </span>
                        </button>
                    )
                })}
            </div>
            <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent"
            />
        </div>
    )
}

// Renders a compact, collapsible timeline of tool calls and reasoning steps
function OutputTimeline({ output, defaultOpen = false, onScrollToBottom }) {
    const [htmlMap, setHtmlMap] = useState({})
    const stepsContainerRef = useRef(null)
    const detailsRef = useRef(null)

    const scrollToBottom = () => {
        // Only scroll if the details element is open
        if (
            detailsRef.current &&
            detailsRef.current.open &&
            stepsContainerRef.current
        ) {
            stepsContainerRef.current.scrollTop =
                stepsContainerRef.current.scrollHeight
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

        const markdownMap = {}
        output.forEach((item, idx) => {
            if (item?.type !== 'reasoning') return
            const text = (item.summary || [])
                .map((s) => s?.text)
                .filter(Boolean)
                .join('\n\n')
            if (text && text.trim()) {
                markdownMap[idx] = preprocessLaTeX(text)
            }
        })
        setHtmlMap(markdownMap)
    }, [output])

    if (!Array.isArray(output) || output.length === 0) return null

    const getIcon = (item) => {
        switch (item.type) {
            case 'reasoning':
                return <LightBulbIcon className="h-4 w-4 text-amber-500" />
            case 'web_search_call': {
                const a = item.action || {}
                if (a.type === 'open_page') {
                    return (
                        <CursorArrowRaysIcon className="h-4 w-4 text-cyan-600" />
                    )
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
                return (
                    <CodeBracketSquareIcon className="h-4 w-4 text-indigo-600" />
                )
            case 'output_text':
            case 'message': // done
                return <CheckCircleIcon className="h-4 w-4 text-green-600" />
            case 'mcp_call':
                const toolName = item.name || 'unknown'
                const serverLabel = item.server_label || ''
                if (toolName === 'search') {
                    // Check if this is a question history search by server_label
                    if (serverLabel === 'question_history_search') {
                        return (
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-teal-600" />
                        )
                    }
                    return (
                        <DocumentMagnifyingGlassIcon className="h-4 w-4 text-blue-600" />
                    )
                } else if (toolName === 'fetch') {
                    return (
                        <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                    )
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
                        let shortPath =
                            path.length > 40 ? path.slice(0, 40) + '...' : path
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
                        <strong>Searched web for:</strong> “
                        <pre className="inline whitespace-pre-wrap text-xs">
                            {a.query || ''}
                        </pre>
                        “
                    </>
                )
            if (a.type === 'find_in_page')
                return (
                    <>
                        <strong>Find</strong> “
                        <pre className="inline whitespace-pre-wrap text-xs">
                            {a.pattern || ''}
                        </pre>
                        “<strong> in </strong> {renderUrlLink(a.url)}
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
                const serverLabel = item.server_label || ''

                // Skip MCP calls with no arguments
                if (!item.arguments || Object.keys(args).length === 0) {
                    return null
                }

                if (toolName === 'search') {
                    // Check if this is a question history search by server_label
                    if (serverLabel === 'question_history_search') {
                        return (
                            <>
                                <strong>Search question history for:</strong> "
                                <pre className="inline whitespace-pre-wrap text-xs">
                                    {args.query || 'No query'}
                                </pre>
                                "
                            </>
                        )
                    }
                    return (
                        <>
                            <strong>Search docs for:</strong> "
                            <pre className="inline whitespace-pre-wrap text-xs">
                                {args.query || 'No query'}
                            </pre>
                            "
                        </>
                    )
                }

                if (toolName === 'fetch') {
                    // Check if this is a question history fetch by server_label
                    if (serverLabel === 'question_history_search') {
                        return (
                            <>
                                <strong>Read conversation:</strong> "
                                <pre className="inline whitespace-pre-wrap text-xs">
                                    {output.title || output.url || 'No title'}
                                </pre>
                                "
                            </>
                        )
                    }
                    return (
                        <>
                            <strong>Open document:</strong> "
                            <pre className="inline whitespace-pre-wrap text-xs">
                                {output.title || output.url || 'No title'}
                            </pre>
                            "
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
    const {
        webSearchesCount,
        urlsCount,
        mcpSearchesCount,
        mcpFetchesCount,
        questionHistorySearchesCount,
    } = (() => {
        let webSearches = 0
        const urls = new Set()
        let mcpSearches = 0
        let mcpFetches = 0
        let questionHistorySearches = 0
        for (const item of output) {
            if (item?.type === 'web_search_call') {
                const a = item.action || {}
                if (a.type === 'search') webSearches += 1
                if (
                    (a.type === 'open_page' || a.type === 'find_in_page') &&
                    a.url
                )
                    urls.add(a.url)
            }
            if (item?.type === 'mcp_call') {
                const toolName = item.name || 'unknown'
                const serverLabel = item.server_label || ''
                if (toolName === 'search') {
                    // Check if this is a question history search by server_label
                    if (serverLabel === 'question_history_search') {
                        questionHistorySearches += 1
                    } else {
                        mcpSearches += 1
                    }
                } else if (toolName === 'fetch') {
                    mcpFetches += 1
                }
            }
        }
        return {
            webSearchesCount: webSearches,
            urlsCount: urls.size,
            mcpSearchesCount: mcpSearches,
            mcpFetchesCount: mcpFetches,
            questionHistorySearchesCount: questionHistorySearches,
        }
    })()

    return (
        <details
            ref={detailsRef}
            className="group mt-6 w-full text-left"
            open={!!defaultOpen}
        >
            <summary className="text-md flex cursor-pointer select-none list-none items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-100">
                <Tooltip
                    content={`Web Searches: ${webSearchesCount} • URLs: ${urlsCount} • Documentation Searches: ${mcpSearchesCount} • Question History Searches: ${questionHistorySearchesCount} • Documents: ${mcpFetchesCount}`}
                >
                    <span>Research Steps ({output.length})</span>
                </Tooltip>
                <ChevronRightIcon className="h-4 w-4 text-gray-500 transition-transform duration-150 group-open:rotate-90" />
            </summary>
            <div
                ref={stepsContainerRef}
                className="mt-2 max-h-96 overflow-y-auto pl-1 pr-2"
            >
                <ol className="relative ml-3 border-l border-gray-200 text-left">
                    {output.map((item, idx) => {
                        const title = getTitle(item)
                        // Hide reasoning items without visible text
                        if (!title) return null
                        return (
                            <li
                                key={item.id || idx}
                                className="relative ml-4 py-2 text-left"
                            >
                                <span className="absolute -left-8 top-2.5 inline-flex h-8 w-8 items-center justify-center bg-gray-50">
                                    {getIcon(item)}
                                </span>
                                <div className="mt-1.5 text-left text-xs leading-5 text-gray-700">
                                    {item.type === 'reasoning' &&
                                    htmlMap[idx] ? (
                                        <div className="max-w-none text-left">
                                            <Streamdown
                                                mode="static"
                                                isAnimating={false}
                                                remarkPlugins={
                                                    streamdownRemarkPlugins
                                                }
                                            >
                                                {preprocessMath(htmlMap[idx])}
                                            </Streamdown>
                                        </div>
                                    ) : item.type === 'code_interpreter_call' &&
                                      (item.code || item.action?.code) ? (
                                        <>
                                            <div className="whitespace-pre-wrap text-left text-sm font-medium text-gray-900">
                                                {title}
                                            </div>
                                            <pre className="max-w-full overflow-x-auto rounded-md bg-gray-50 p-2 text-[11px] leading-5 text-gray-800">
                                                <code>
                                                    {item.code ||
                                                        item.action?.code}
                                                </code>
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
                return (
                    <QuestionMarkCircleIcon className="h-4 w-4 text-blue-500" />
                )
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
                return (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                )
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
                'relative flex cursor-pointer items-center justify-between gap-x-4 px-2 py-5 lg:px-4',
                isSelected
                    ? 'bg-cyan-50 shadow-inner hover:bg-cyan-50'
                    : 'bg-white hover:bg-gray-50',
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

export function ResearchInterface({
    team,
    bot,
    onJobCreated,
    clarifyingJob = null,
    onClarificationsContinue,
    setSelectedJob,
    setResearchJobs,
    selectedJob = null,
    previousJobStatusesRef,
    newlyCreatedJobIdsRef,
    sendJobNotification,
    newDashboard = false,
}) {
    const [question, setQuestion] = useState('')
    const [selectedModel, setSelectedModel] = useState('o4-mini')
    const [webSearch, setWebSearch] = useState(false)
    const [codeInterpreter, setCodeInterpreter] = useState(false)
    const [questionHistory, setQuestionHistory] = useState(false)
    const [docsSearch, setDocsSearch] = useState(true)
    const webSearchRef = useRef(false)
    const codeInterpreterRef = useRef(false)
    const questionHistoryRef = useRef(false)
    const docsSearchRef = useRef(true)
    const [loading, setLoading] = useState(false)
    const [errorText, setErrorText] = useState(null)
    const [showOpenAI, setShowOpenAI] = useState(false)
    const [user] = useAuthState(auth)
    const textareaRef = useRef(null)
    const [clarificationsMarkdown, setClarificationsMarkdown] = useState('')
    const posthog = usePostHog()
    const [researchAgentAlertDismissed, setResearchAgentAlertDismissed] =
        useState(false)

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            getPreference('dismissed-research-agent-info') === true
        ) {
            setResearchAgentAlertDismissed(true)
        }
    }, [])

    const validModels = [
        {
            id: 'o3',
            name: 'o3',
            creditMultiplier: 23,
            description:
                'Uses advanced reasoning - Slower, requires an OpenAI API key',
        },
        {
            id: 'o4-mini',
            name: 'o4-mini',
            creditMultiplier: 5,
            description:
                'Fastest at advanced reasoning - Recommended for most tasks',
        },
    ]
    const selectedModelItem =
        validModels.find((model) => model.id === selectedModel) || null
    const usesTeamOpenAIKey = Boolean(team?.openAIKey)
    const displayCreditMultiplier = (model) =>
        usesTeamOpenAIKey ? 1 : model?.creditMultiplier || 1
    const creditMultiplierTooltip = (model) =>
        usesTeamOpenAIKey
            ? '1x AI credits for deep research token usage with your OpenAI key.'
            : `${displayCreditMultiplier(model)}x AI credits for deep research token usage.`

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
        webSearchRef.current = webSearch
    }, [webSearch])

    useEffect(() => {
        codeInterpreterRef.current = codeInterpreter
    }, [codeInterpreter])

    useEffect(() => {
        questionHistoryRef.current = questionHistory
    }, [questionHistory])

    useEffect(() => {
        docsSearchRef.current = docsSearch
    }, [docsSearch])

    const setWebSearchValue = (value) => {
        webSearchRef.current = value
        setWebSearch(value)
    }

    const setCodeInterpreterValue = (value) => {
        codeInterpreterRef.current = value
        setCodeInterpreter(value)
    }

    const setQuestionHistoryValue = (value) => {
        questionHistoryRef.current = value
        setQuestionHistory(value)
    }

    const setDocsSearchValue = (value) => {
        docsSearchRef.current = value
        setDocsSearch(value)
    }

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

    // Store clarifications markdown when present
    useEffect(() => {
        if (!clarifyingJob?.clarifications) {
            setClarificationsMarkdown('')
            return
        }
        setClarificationsMarkdown(preprocessLaTeX(clarifyingJob.clarifications))
    }, [clarifyingJob?.clarifications])

    // Sync local toggles and model from clarifying job (DB/list API provides camelCase fields)
    useEffect(() => {
        if (!clarifyingJob) return
        const normalizedClarifyingJob = normalizeResearchJobTools(clarifyingJob)
        if (typeof clarifyingJob.model === 'string') {
            setSelectedModel(clarifyingJob.model)
        }
        if (normalizedClarifyingJob.webSearch !== undefined) {
            setWebSearchValue(Boolean(normalizedClarifyingJob.webSearch))
        }
        if (normalizedClarifyingJob.codeInterpreter !== undefined) {
            setCodeInterpreterValue(
                Boolean(normalizedClarifyingJob.codeInterpreter),
            )
        }
        if (normalizedClarifyingJob.questionHistory !== undefined) {
            setQuestionHistoryValue(
                Boolean(normalizedClarifyingJob.questionHistory),
            )
        }
        if (normalizedClarifyingJob.docsSearch !== undefined) {
            setDocsSearchValue(Boolean(normalizedClarifyingJob.docsSearch))
        }
    }, [clarifyingJob])

    // Helper to update selectedJob when tools are toggled (only if job hasn't started)
    const updateSelectedJobTools = (
        newWebSearch,
        newCodeInterpreter,
        newQuestionHistory,
        newDocsSearch,
    ) => {
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
                    questionHistory: newQuestionHistory,
                    docsSearch: newDocsSearch,
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
                    questionHistory: newQuestionHistory,
                    docsSearch: newDocsSearch,
                }
            })
        }
        // If no job exists yet in first step, we don't need to update selectedJob
    }

    const startResearch = async (e) => {
        e.preventDefault()

        const currentWebSearch = webSearchRef.current
        const currentCodeInterpreter = codeInterpreterRef.current
        const currentQuestionHistory = questionHistoryRef.current
        const currentDocsSearch = docsSearchRef.current

        if (!question || question.length < 2) {
            setErrorText('Please enter a full question.')
            return
        }

        // Ensure at least documentation search or question history is selected
        if (!currentDocsSearch && !currentQuestionHistory) {
            setErrorText(
                'Please enable at least Documentation Search or Question History.',
            )
            return
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
                        web_search: currentWebSearch,
                        code_interpreter: currentCodeInterpreter,
                        question_history: currentQuestionHistory,
                        docs_search: currentDocsSearch,
                        metadata:
                            user?.displayName || user?.email || user?.uid
                                ? {
                                      name: user?.displayName || null,
                                      email: user?.email || null,
                                      uid: user?.uid || null,
                                  }
                                : undefined,
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('Clarification response:', data)
                    setQuestion('')
                    setErrorText(null) // Clear any previous error messages

                    // Immediately update the selected job with the response data to show loading state
                    if (data.jobId && data.status) {
                        const previousStatus =
                            previousJobStatusesRef?.current?.get(data.jobId) ||
                            clarifyingJob?.status

                        const updatedJob = normalizeResearchJobTools(
                            {
                                ...clarifyingJob,
                                ...data,
                                // Store the answers that were just submitted
                                answers: question,
                                // Ensure summary is preserved from the response
                                summary: data.summary || clarifyingJob?.summary,
                                // Preserve metadata from API response or existing
                                metadata:
                                    data.metadata || clarifyingJob?.metadata,
                            },
                            clarifyingJob,
                        )

                        // Check for status transition and send notification if needed
                        if (
                            previousStatus !== updatedJob.status &&
                            sendJobNotification
                        ) {
                            sendJobNotification(updatedJob, previousStatus)
                        }

                        // Update previous status
                        if (previousJobStatusesRef?.current) {
                            previousJobStatusesRef.current.set(
                                data.jobId,
                                updatedJob.status,
                            )
                        }

                        console.log('Updated job:', updatedJob)
                        setSelectedJob && setSelectedJob(updatedJob)

                        // Also update the job in the research tasks list
                        setResearchJobs &&
                            setResearchJobs((prev) =>
                                prev.map((j) =>
                                    j.jobId === data.jobId ? updatedJob : j,
                                ),
                            )
                    }

                    // Only call onClarificationsContinue if we need to fetch additional data
                    // Since we already have the updated status, we don't need to fetch immediately
                    // The polling will handle status updates for queued/in_progress jobs
                } else {
                    try {
                        const data = await response.json()
                        console.error('Clarification submission failed:', data)
                        setErrorText(
                            data.error ||
                                data.message ||
                                'Failed to continue deep research task',
                        )
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
                    web_search: currentWebSearch,
                    code_interpreter: currentCodeInterpreter,
                    question_history: currentQuestionHistory,
                    docs_search: currentDocsSearch,
                    metadata:
                        user?.displayName || user?.email || user?.uid
                            ? {
                                  name: user?.displayName || null,
                                  email: user?.email || null,
                                  uid: user?.uid || null,
                              }
                            : undefined,
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
                            webSearch: currentWebSearch,
                            codeInterpreter: currentCodeInterpreter,
                            questionHistory: currentQuestionHistory,
                            docsSearch: currentDocsSearch,
                            metadata:
                                data.metadata ||
                                (user?.displayName || user?.email || user?.uid
                                    ? {
                                          name: user?.displayName || null,
                                          email: user?.email || null,
                                          uid: user?.uid || null,
                                      }
                                    : undefined),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }

                        // Mark this job as newly created so we can prompt for notifications
                        if (newlyCreatedJobIdsRef?.current) {
                            newlyCreatedJobIdsRef.current.add(data.jobId)
                        }

                        // Initialize status tracking for the new job
                        if (previousJobStatusesRef?.current) {
                            previousJobStatusesRef.current.set(
                                data.jobId,
                                newJob.status,
                            )
                        }

                        // Add the new job to the research tasks list
                        setResearchJobs &&
                            setResearchJobs((prev) => [newJob, ...prev])

                        // Select the new job immediately
                        setSelectedJob && setSelectedJob(newJob)
                    }

                    // Call onJobCreated, but don't fail the entire operation if it fails.
                    if (data.jobId) {
                        setPreference('dismissed-research-agent-info', true)
                        setResearchAgentAlertDismissed(true)
                        try {
                            onJobCreated(data.jobId)
                        } catch (err) {
                            console.error(
                                'Error in onJobCreated callback:',
                                err,
                            )
                        }

                        // Track deep research job creation in PostHog (only after initial response with title)
                        if (posthog && user && data.title) {
                            try {
                                posthog.capture('Deep Research Job Created', {
                                    botId: bot.id,
                                    botName: bot.name,
                                    teamId: team.id,
                                    model: selectedModel,
                                    webSearch: currentWebSearch,
                                    codeInterpreter: currentCodeInterpreter,
                                    questionHistory: currentQuestionHistory,
                                    title: data.title,
                                })
                            } catch (err) {
                                console.error(
                                    'Error tracking job creation in PostHog:',
                                    err,
                                )
                            }
                        }
                    }
                } else {
                    try {
                        const data = await response.json()
                        setErrorText(
                            data.error ||
                                data.message ||
                                'Failed to start deep research task',
                        )
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
                disabled={loading}
            >
                <div className="relative">
                    <div className="inline-block">
                        <Tooltip content="Change model" placement="top">
                            <div>
                                <Listbox.Button
                                    className={clsx(
                                        'flex items-center p-2 text-xs text-gray-600 hover:text-cyan-600',
                                        loading
                                            ? 'pointer-events-none cursor-not-allowed opacity-50'
                                            : 'cursor-pointer',
                                    )}
                                >
                                    <CubeIcon
                                        className="mr-1 h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    {selectedModelItem?.name || selectedModel}
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
                                            active
                                                ? 'bg-cyan-600 text-white'
                                                : 'text-gray-900',
                                        )
                                    }
                                >
                                    {({ selected, active }) => (
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center justify-between gap-3">
                                                <p
                                                    className={clsx(
                                                        'font-normal',
                                                        selected &&
                                                            'font-semibold',
                                                    )}
                                                >
                                                    {model.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Tooltip
                                                        content={creditMultiplierTooltip(
                                                            model,
                                                        )}
                                                        placement="top"
                                                    >
                                                        <span>
                                                            <Chip
                                                                content={`${displayCreditMultiplier(model)}x`}
                                                                className={clsx(
                                                                    'px-2 py-0.5',
                                                                    active
                                                                        ? 'border-cyan-200 bg-white/10 text-white'
                                                                        : 'border-slate-300 bg-slate-50 text-slate-700',
                                                                )}
                                                            />
                                                        </span>
                                                    </Tooltip>
                                                    {selected && (
                                                        <span
                                                            className={
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-cyan-600'
                                                            }
                                                        >
                                                            <CheckIcon
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p
                                                className={clsx(
                                                    'mt-1 text-xs',
                                                    active
                                                        ? 'text-cyan-200'
                                                        : 'text-gray-500',
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
            <ModalOpenAI
                team={team}
                open={showOpenAI}
                setOpen={setShowOpenAI}
                onKey={(key) => {
                    team.openAIKey = key
                }}
            />
            <div className="flex w-full flex-col text-center">
                <div className="my-auto">
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        {clarifyingJob
                            ? clarifyingJob.title
                            : 'Deep Research Agent'}
                    </p>
                    {!clarifyingJob && !researchAgentAlertDismissed && (
                        <Alert
                            title="Deep Research Agent"
                            type="info"
                            dismissKey="research-agent-info"
                        >
                            This agent uses advanced reasoning models and
                            multiple searches to perform deep research tasks. It
                            can search your data, the web, write and run code
                            for accurate data analysis & math, and provide
                            comprehensive answers with detailed reasoning.
                            Research tasks take anywhere from 5 to 25 minutes so
                            it's optimized to use for very complex or detailed
                            reports, not simple questions.
                        </Alert>
                    )}
                </div>

                <div className="mt-6">
                    <Alert title={errorText} type="warning" />

                    {!clarifyingJob && (
                        <>
                            <p className="mb-2 text-center text-sm text-gray-500">
                                Choose a template prompt or write your own.
                            </p>
                            <SuggestionChips
                                disabled={loading}
                                onSelect={(suggestion) => {
                                    setQuestion(suggestion.prompt)
                                    setWebSearchValue(suggestion.webSearch)
                                    setCodeInterpreterValue(
                                        suggestion.codeInterpreter,
                                    )
                                    setQuestionHistoryValue(
                                        suggestion.questionHistory,
                                    )
                                    setDocsSearchValue(suggestion.docsSearch)
                                    updateSelectedJobTools(
                                        suggestion.webSearch,
                                        suggestion.codeInterpreter,
                                        suggestion.questionHistory,
                                        suggestion.docsSearch,
                                    )
                                    setErrorText(null)
                                    textareaRef.current?.focus()
                                }}
                            />
                        </>
                    )}

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
                                text={
                                    clarificationsMarkdown ||
                                    clarifyingJob.clarifications
                                }
                            />
                        </>
                    )}

                    {bot?.privacy === 'private' && webSearch && (
                        <Alert
                            title="Privacy Warning"
                            type="warning"
                            dismissKey="web-search-private-warning"
                        >
                            Enabling web search could potentially leak private
                            information from your training data to websites. The
                            agent may include sensitive content from your
                            knowledge base in web search queries.
                        </Alert>
                    )}

                    <form
                        className="mt-4 flex flex-col justify-center"
                        onSubmit={startResearch}
                        disabled={loading}
                    >
                        <fieldset
                            disabled={loading}
                            aria-disabled={loading}
                            className={clsx(
                                loading && 'opacity-75',
                            )}
                        >
                            <div className="mb-1 mt-1 w-full rounded-xl sm:flex sm:shadow-sm">
                                <div className="relative flex w-full flex-grow items-stretch shadow-sm sm:shadow-inherit">
                                    <div className="absolute bottom-0 left-0 z-10 flex items-center gap-0 pl-2">
                                        {/* Documentation Search toggle as icon button */}
                                        <Tooltip
                                            content={'Documentation Search'}
                                        >
                                            <div className="inline-block">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading ||
                                                        (docsSearch &&
                                                            !questionHistory)
                                                    }
                                                    className={clsx(
                                                        'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                                                        docsSearch
                                                            ? 'font-bold text-cyan-600'
                                                            : 'text-gray-600',
                                                    )}
                                                    onClick={() => {
                                                        // Prevent disabling if questionHistory is also disabled
                                                        const currentDocsSearch =
                                                            docsSearchRef.current
                                                        const currentQuestionHistory =
                                                            questionHistoryRef.current

                                                        if (
                                                            currentDocsSearch &&
                                                            !currentQuestionHistory
                                                        ) {
                                                            setErrorText(
                                                                'Please enable at least Documentation Search or Question History.',
                                                            )
                                                            return
                                                        }
                                                        const newValue =
                                                            !currentDocsSearch
                                                        setDocsSearchValue(
                                                            newValue,
                                                        )
                                                        setErrorText(null)
                                                        updateSelectedJobTools(
                                                            webSearchRef.current,
                                                            codeInterpreterRef.current,
                                                            questionHistoryRef.current,
                                                            newValue,
                                                        )
                                                    }}
                                                >
                                                    {docsSearch ? (
                                                        <DocumentMagnifyingGlassIconSolid className="h-5 w-5" />
                                                    ) : (
                                                        <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </Tooltip>
                                        {/* Question History toggle as icon button */}
                                        <Tooltip content={'Question History'}>
                                            <div className="inline-block">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading ||
                                                        (questionHistory &&
                                                            !docsSearch)
                                                    }
                                                    className={clsx(
                                                        'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                                                        questionHistory
                                                            ? 'font-bold text-cyan-600'
                                                            : 'text-gray-600',
                                                    )}
                                                    onClick={() => {
                                                        // Prevent disabling if docsSearch is also disabled
                                                        const currentQuestionHistory =
                                                            questionHistoryRef.current
                                                        const currentDocsSearch =
                                                            docsSearchRef.current

                                                        if (
                                                            currentQuestionHistory &&
                                                            !currentDocsSearch
                                                        ) {
                                                            setErrorText(
                                                                'Please enable at least Documentation Search or Question History.',
                                                            )
                                                            return
                                                        }
                                                        const newValue =
                                                            !currentQuestionHistory
                                                        setQuestionHistoryValue(
                                                            newValue,
                                                        )
                                                        setErrorText(null)
                                                        updateSelectedJobTools(
                                                            webSearchRef.current,
                                                            codeInterpreterRef.current,
                                                            newValue,
                                                            docsSearchRef.current,
                                                        )
                                                    }}
                                                >
                                                    {questionHistory ? (
                                                        <ChatBubbleLeftRightIconSolid className="h-5 w-5" />
                                                    ) : (
                                                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </Tooltip>
                                        {/* Web Search toggle as icon button */}
                                        <Tooltip content={'Web Search'}>
                                            <div className="inline-block">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading
                                                    }
                                                    className={clsx(
                                                        'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                                                        webSearch
                                                            ? 'font-bold text-cyan-600'
                                                            : 'text-gray-600',
                                                    )}
                                                    onClick={() => {
                                                        const newValue =
                                                            !webSearchRef.current
                                                        setWebSearchValue(
                                                            newValue,
                                                        )
                                                        updateSelectedJobTools(
                                                            newValue,
                                                            codeInterpreterRef.current,
                                                            questionHistoryRef.current,
                                                            docsSearchRef.current,
                                                        )
                                                    }}
                                                >
                                                    {webSearch ? (
                                                        <GlobeAltIconSolid className="h-5 w-5" />
                                                    ) : (
                                                        <GlobeAltIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </Tooltip>
                                        {/* Code tools toggle as icon button */}
                                        <Tooltip content={'Code Interpreter'}>
                                            <div className="inline-block">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading
                                                    }
                                                    className={clsx(
                                                        'rounded-md p-2 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-50',
                                                        codeInterpreter
                                                            ? 'font-bold text-cyan-600'
                                                            : 'text-gray-600',
                                                    )}
                                                    onClick={() => {
                                                        const newValue =
                                                            !codeInterpreterRef.current
                                                        setCodeInterpreterValue(
                                                            newValue,
                                                        )
                                                        updateSelectedJobTools(
                                                            webSearchRef.current,
                                                            newValue,
                                                            questionHistoryRef.current,
                                                            docsSearchRef.current,
                                                        )
                                                    }}
                                                >
                                                    {codeInterpreter ? (
                                                        <CodeBracketSquareIconSolid className="h-5 w-5" />
                                                    ) : (
                                                        <CodeBracketSquareIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </Tooltip>
                                        <ModelSelector />
                                    </div>

                                    <textarea
                                        ref={textareaRef}
                                        name="query"
                                        id="query"
                                        value={question}
                                        disabled={loading}
                                        maxLength={2000}
                                        minLength={2}
                                        required
                                        rows={1}
                                        onChange={(e) =>
                                            setQuestion(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.isComposing ||
                                                e.keyCode === 229
                                            ) {
                                                return
                                            }
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                if (e.shiftKey) {
                                                    setQuestion(
                                                        (prevQuestion) =>
                                                            `${prevQuestion}\n`,
                                                    )
                                                } else if (!e.shiftKey && !loading) {
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
                                                ? 'Please answer the clarification questions...'
                                                : 'Ask a complex research question...'
                                        }
                                    />

                                    <button
                                        type="submit"
                                        tabIndex={2}
                                        disabled={loading}
                                        className="absolute bottom-0 right-0 my-3 mr-2 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        <span className="sr-only">
                                            Start research
                                        </span>
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
                                    <span>
                                        Use Shift + Enter to skip to a new line.
                                    </span>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    )
}

export function ResearchResults({
    job,
    onBack,
    onJobUpdate,
    hasPushSubscription,
    notificationPermission,
    isNotificationSupported,
    onSubscribeToNotifications,
    newDashboard = false,
}) {
    const [clarificationsMarkdown, setClarificationsMarkdown] = useState('')
    const [summaryMarkdown, setSummaryMarkdown] = useState('')
    const [isHtmlCopied, setIsHtmlCopied] = useState(false)
    const [costInfo, setCostInfo] = useState(null)
    const [footnotes, setFootnotes] = useState([])
    const [user] = useAuthState(auth)
    const scrollToBottomRef = useRef(null)
    const usageSummary = getResearchUsageSummary(job)

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

    // Store clarifications markdown
    useEffect(() => {
        if (!job?.clarifications) {
            setClarificationsMarkdown('')
            return
        }
        setClarificationsMarkdown(preprocessLaTeX(job.clarifications))
    }, [job?.clarifications])

    // Store summary markdown
    useEffect(() => {
        if (!job?.summary) {
            setSummaryMarkdown('')
            return
        }
        setSummaryMarkdown(preprocessLaTeX(job.summary))
    }, [job?.summary])

    const [resultMarkdown, setResultMarkdown] = useState('')

    useEffect(() => {
        if (!job?.result) {
            setResultMarkdown('')
            setFootnotes([])
            return
        }

        const annotations = extractUrlAnnotations(job?.response)
        const { annotatedText, footnotes: generatedFootnotes } =
            injectCitationPlaceholders(job.result, annotations)
        setFootnotes(generatedFootnotes)

        // Store the markdown - we'll process citations in renderedResultContent
        setResultMarkdown(preprocessLaTeX(annotatedText))
    }, [job?.response, job?.result])

    const renderedResultContent = useMemo(() => {
        if (!resultMarkdown) return null

        // Replace citation placeholders with superscript links in the markdown before rendering
        // Using <sup> with <a> which should pass through sanitization
        let processedMarkdown = resultMarkdown
        if (footnotes.length > 0) {
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_(\d+)\}\}/g,
                (_match, num) =>
                    `<sup class="citation-ref"><a href="#footnote-${num}" class="citation-link">[${num}]</a></sup>`,
            )
        } else {
            // Strip citation placeholders if no footnotes
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_\d+\}\}/g,
                '',
            )
        }

        return (
            <Streamdown
                mode="static"
                isAnimating={false}
                remarkPlugins={streamdownRemarkPlugins}
            >
                {preprocessMath(processedMarkdown)}
            </Streamdown>
        )
    }, [resultMarkdown, footnotes])

    // Compute pricing based on Standard tier deep-research models and tool calls
    useEffect(() => {
        const cost = calculateResearchCost(job)
        if (!cost) {
            setCostInfo(null)
            return
        }

        const round = (n) => Math.round(n * 1000) / 1000 // keep three decimals pre-render
        setCostInfo({
            total: round(cost.totalCost),
            input: round(cost.inputCost),
            output: round(cost.outputCost),
            tools: round(cost.toolsCost),
            breakdown: {
                webSearchCalls: cost.webSearchCalls,
                codeInterpreterCalls: cost.codeInterpreterCalls,
                model: cost.model,
                inputTokens: cost.inputTokens,
                cachedTokens: cost.cachedTokens,
                outputTokens: cost.outputTokens,
            },
        })
    }, [job])

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
        if (!resultMarkdown) return

        // Process markdown the same way as normal view and print view
        let processedMarkdown = resultMarkdown
        if (footnotes.length > 0) {
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_(\d+)\}\}/g,
                (_match, num) =>
                    `<sup class="citation-ref"><a href="#footnote-${num}" class="citation-link">[${num}]</a></sup>`,
            )
        } else {
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_\d+\}\}/g,
                '',
            )
        }

        // Render using Streamdown just like print view
        const resultHtml = renderToStaticMarkup(
            <Streamdown
                mode="static"
                isAnimating={false}
                remarkPlugins={streamdownRemarkPlugins}
                controls={false}
            >
                {preprocessMath(processedMarkdown)}
            </Streamdown>,
        )

        const title = job?.title
            ? escapeHtml(job.title)
            : 'Deep Research Findings'
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
                        const safeUrl = footnote.url
                            ? escapeHtml(footnote.url)
                            : ''
                        const label =
                            footnote.title ||
                            footnote.url ||
                            `Source ${footnote.number}`
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
                    'text/plain': new Blob(
                        [appendSignature(job?.result || '')],
                        { type: 'text/plain' },
                    ),
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
        if (!job?.result || !resultMarkdown) return

        const printWindow = window.open(
            '',
            '_blank',
            'width=900,height=1200,scrollbars=yes',
        )
        if (!printWindow) {
            console.warn('Unable to open print preview window')
            return
        }
        printWindow.opener = null

        const origin = window.location.origin
        const displayTitle = job.title
            ? escapeHtml(job.title)
            : 'Deep Research Report'
        const completedTimestamp =
            job?.completedAt || job?.updatedAt || job?.createdAt
        const completedLabel = formatLocalDateTime(completedTimestamp)
        const requestedBy = job?.metadata?.name
            ? escapeHtml(job.metadata.name)
            : ''
        const requesterEmail = job?.metadata?.email
            ? escapeHtml(job.metadata.email)
            : ''

        const metaParts = []
        if (completedLabel) metaParts.push(completedLabel)
        if (requestedBy) metaParts.push(`Requested by ${requestedBy}`)
        if (requesterEmail) metaParts.push(requesterEmail)

        const metaLine = metaParts.join(' • ')

        // Process markdown the same way as normal view
        let processedMarkdown = resultMarkdown
        if (footnotes.length > 0) {
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_(\d+)\}\}/g,
                (_match, num) =>
                    `<sup class="citation-ref"><a href="#footnote-${num}" class="citation-link">[${num}]</a></sup>`,
            )
        } else {
            processedMarkdown = resultMarkdown.replace(
                /\{\{CITATION_\d+\}\}/g,
                '',
            )
        }

        // Render using Streamdown just like normal view
        const renderedHtml = renderToStaticMarkup(
            <Streamdown
                mode="static"
                isAnimating={false}
                remarkPlugins={streamdownRemarkPlugins}
                controls={false}
            >
                {preprocessMath(processedMarkdown)}
            </Streamdown>,
        )

        const sections = [
            `
      <section>
        ${renderedHtml}
      </section>
    `,
        ]

        let sourcesSection = ''
        if (footnotes.length > 0) {
            const sources = footnotes
                .map((footnote) => {
                    const safeUrl = footnote.url ? escapeHtml(footnote.url) : ''
                    const label =
                        footnote.title ||
                        footnote.url ||
                        `Source ${footnote.number}`
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
            document.head?.querySelectorAll('style, link[rel="stylesheet"]') ||
                [],
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
            <article class="max-w-none">
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
    }, [job, resultMarkdown, footnotes])

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
                        text={clarificationsMarkdown || job.clarifications}
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
                        text={summaryMarkdown || job.summary}
                        className="mr-12"
                    />
                )}

                {/* Collapsible timeline of tool calls and reasoning */}
                {job?.response?.output && (
                    <OutputTimeline
                        output={job.response.output}
                        defaultOpen={
                            job.status === 'in_progress' ||
                            job.status === 'queued'
                        }
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
                                    <svg
                                        className="h-7 w-7 text-white"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div className="rounded-md bg-red-50 p-6 text-start sm:px-8">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Deep Research Failed
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>
                                                {job.response?.error?.message ||
                                                    job.response?.error ||
                                                    'The deep research task encountered an error and could not complete.'}
                                            </p>
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
                                    <svg
                                        className="h-7 w-7 text-white"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div className="rounded-md bg-yellow-50 p-6 text-start sm:px-8">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-yellow-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            Deep research incomplete
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>
                                                {job.response?.error?.message ||
                                                    job.response?.error ||
                                                    'The deep research task was not completed.'}
                                            </p>
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
                                    <svg
                                        className="h-7 w-7 text-white"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            </div>
                            <div className="rounded-md bg-gray-50 p-6 text-start sm:px-8">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-gray-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-gray-800">
                                            Deep research cancelled
                                        </h3>
                                        <div className="mt-2 text-sm text-gray-700">
                                            <p>
                                                The deep research task was
                                                cancelled.
                                            </p>
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
                                    {job?.status === 'completed' &&
                                        job?.result && (
                                            <div className="flex justify-end">
                                                <ResearchActionButtons
                                                    onCopy={handleCopyHtml}
                                                    onPrint={handlePrintReport}
                                                    isCopied={isHtmlCopied}
                                                    compact={true}
                                                />
                                            </div>
                                        )}
                                    <div
                                        className="max-w-none text-slate-800"
                                        onClick={(e) => {
                                            // Handle citation link clicks for smooth scrolling
                                            const link = e.target.closest(
                                                'a[href^="#footnote-"]',
                                            )
                                            if (link) {
                                                e.preventDefault()
                                                const id = link
                                                    .getAttribute('href')
                                                    .slice(1)
                                                document
                                                    .getElementById(id)
                                                    ?.scrollIntoView({
                                                        behavior: 'smooth',
                                                        block: 'center',
                                                    })
                                            }
                                        }}
                                    >
                                        {renderedResultContent}
                                    </div>
                                    {footnotes.length > 0 && (
                                        <section
                                            className="mt-6 border-t border-gray-200 pt-4"
                                            aria-labelledby="docsbot-footnotes-heading"
                                        >
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
                                                            {footnote.title ||
                                                                footnote.url}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ol>
                                        </section>
                                    )}
                                    {job?.status === 'completed' &&
                                        job?.result && (
                                            <div
                                                className={`flex border-t border-gray-200 pt-4 ${costInfo && user && isSuperAdmin(user.uid) ? 'items-center justify-between' : 'justify-end'}`}
                                            >
                                                {costInfo &&
                                                    user &&
                                                    isSuperAdmin(user.uid) && (
                                                        <Tooltip content="Only shown to Super Admins.">
                                                            <div className="select-none text-xs leading-tight text-gray-500">
                                                                Estimated cost:
                                                                $
                                                                {costInfo.total.toFixed(
                                                                    2,
                                                                )}
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
                                    <span className="ml-2 mt-2 text-xs text-gray-500">
                                        Deep research tasks can take many
                                        minutes to complete, please wait or
                                        check back later...
                                        {hasPushSubscription &&
                                            notificationPermission ===
                                                'granted' && (
                                                <span className="mt-1 block text-cyan-600">
                                                    You'll receive a
                                                    notification when this task
                                                    completes.
                                                </span>
                                            )}
                                    </span>
                                    {isNotificationSupported &&
                                        notificationPermission !==
                                            'granted' && (
                                            <div className="ml-2 mt-3">
                                                {notificationPermission ===
                                                'denied' ? (
                                                    <div className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                                                        <BellIcon className="h-4 w-4" />
                                                        <span>
                                                            Notifications
                                                            blocked. Enable them
                                                            in browser settings
                                                            to get notified.
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={
                                                            onSubscribeToNotifications
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                                        type="button"
                                                    >
                                                        <BellIcon className="h-4 w-4" />
                                                        Get notified when this
                                                        task completes
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </BotMessage>
                )}

                <ResearchUsageSummary usage={usageSummary} />

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

export function Research({
    team,
    bot,
    newDashboard = false,
    researchJobs: propsResearchJobs,
    setResearchJobs: propsSetResearchJobs,
    selectedJob: propsSelectedJob,
    setSelectedJob: propsSetSelectedJob,
}) {
    const [internalResearchJobs, setInternalResearchJobs] = useState([])
    const [internalSelectedJob, setInternalSelectedJob] = useState(null)

    const researchJobs = propsResearchJobs || internalResearchJobs
    const setResearchJobs = propsSetResearchJobs || setInternalResearchJobs
    const selectedJob = propsSelectedJob || internalSelectedJob
    const setSelectedJob = propsSetSelectedJob || setInternalSelectedJob

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
    const [notificationPermission, setNotificationPermission] = useState(() =>
        typeof window !== 'undefined' && typeof Notification !== 'undefined'
            ? Notification.permission
            : 'default',
    )
    const [hasPushSubscription, setHasPushSubscription] = useState(false)
    const didInitFromJobId = useRef(false)
    const scrollToBottomRef = useRef(null)
    const notificationPromptedRef = useRef(false)
    const notifiedJobIdsRef = useRef(new Set())
    const pushSubscriptionAttemptedRef = useRef(false)
    const lastSelectedStatusRef = useRef(null)
    const newlyCreatedJobIdsRef = useRef(new Set())
    const previousJobStatusesRef = useRef(new Map()) // Track previous statuses to detect transitions

    const isNotificationSupported =
        typeof window !== 'undefined' && typeof Notification !== 'undefined'

    const isPushSupported =
        isNotificationSupported &&
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        !!process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY

    const registerPushSubscription = useCallback(async () => {
        if (!isPushSupported) return false

        try {
            const registration =
                await navigator.serviceWorker.register('/service-worker.js')

            // Wait for service worker to be ready
            await registration.update()
            const readyRegistration = await navigator.serviceWorker.ready

            // Check if we already have a subscription saved
            const existing =
                await readyRegistration.pushManager.getSubscription()

            // If we already have a subscription and we've attempted before, skip
            if (existing && pushSubscriptionAttemptedRef.current) {
                return true
            }

            let subscription = existing
            if (!subscription) {
                const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
                if (!publicKey) return false

                subscription = await readyRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: base64ToUint8Array(publicKey),
                })
            }

            if (!subscription) return false

            // Extract keys from PushSubscription object
            const p256dhKey = subscription.getKey('p256dh')
            const authKey = subscription.getKey('auth')

            if (!p256dhKey || !authKey) return false

            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(p256dhKey),
                    auth: arrayBufferToBase64(authKey),
                },
            }

            const response = await fetch(
                '/api/notifications/push-subscription',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: subscriptionData }),
                },
            )

            if (!response.ok) return false

            // Only mark as attempted after successful save
            pushSubscriptionAttemptedRef.current = true
            return true
        } catch (error) {
            return false
        }
    }, [isPushSupported])

    const promptForNotificationPermission = useCallback(() => {
        if (notificationPromptedRef.current) return
        if (!isNotificationSupported) return

        notificationPromptedRef.current = true

        if (Notification.permission !== 'default') {
            setNotificationPermission(Notification.permission)
            return
        }

        Notification.requestPermission()
            .then((permission) => {
                setNotificationPermission(permission)
            })
            .catch(() => {
                setNotificationPermission(Notification.permission)
            })
    }, [isNotificationSupported])

    // Check if push subscription exists
    const checkPushSubscription = useCallback(async () => {
        if (!isPushSupported || notificationPermission !== 'granted') {
            setHasPushSubscription(false)
            return
        }

        try {
            const registration = await navigator.serviceWorker.ready
            const subscription =
                await registration.pushManager.getSubscription()
            setHasPushSubscription(!!subscription)
        } catch (error) {
            console.warn('Error checking push subscription:', error)
            setHasPushSubscription(false)
        }
    }, [isPushSupported, notificationPermission])

    useEffect(() => {
        if (notificationPermission !== 'granted') {
            setHasPushSubscription(false)
            return
        }

        registerPushSubscription().then(() => {
            checkPushSubscription()
        })
    }, [
        notificationPermission,
        registerPushSubscription,
        checkPushSubscription,
    ])

    // Check subscription status when component mounts or notification permission changes
    useEffect(() => {
        checkPushSubscription()
    }, [checkPushSubscription])

    // Handle subscribing to notifications (prompt + register)
    const handleSubscribeToNotifications = useCallback(async () => {
        if (!isNotificationSupported) return

        // Request permission
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)

        // If granted, register push subscription
        if (permission === 'granted') {
            await registerPushSubscription()
            await checkPushSubscription()
        }
    }, [
        isNotificationSupported,
        registerPushSubscription,
        checkPushSubscription,
    ])

    // Load notified job IDs from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const stored = localStorage.getItem('docsbot-notified-job-ids')
            if (stored) {
                const ids = JSON.parse(stored)
                notifiedJobIdsRef.current = new Set(ids)
            }
        } catch (err) {
            console.warn(
                'Error loading notified job IDs from localStorage',
                err,
            )
        }
    }, [])

    // Save notified job IDs to localStorage whenever it changes
    const markJobAsNotified = useCallback((jobId) => {
        if (!jobId) return
        notifiedJobIdsRef.current.add(jobId)
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(
                    'docsbot-notified-job-ids',
                    JSON.stringify(Array.from(notifiedJobIdsRef.current)),
                )
            } catch (err) {
                console.warn(
                    'Error saving notified job IDs to localStorage',
                    err,
                )
            }
        }
    }, [])

    // Check if a job was created by the current user
    const isJobCreatedByUser = useCallback(
        (job) => {
            // Prefer uid match if available, fallback to email
            if (user?.uid && job?.metadata?.uid) {
                return job.metadata.uid === user.uid
            }
            if (user?.email && job?.metadata?.email) {
                return (
                    job.metadata.email.toLowerCase() ===
                    user.email.toLowerCase()
                )
            }
            return false
        },
        [user?.uid, user?.email],
    )

    // Send notification for a job when it transitions to terminal status
    const sendJobNotification = useCallback(
        (job, previousStatus) => {
            if (!isNotificationSupported) return false
            if (notificationPermission !== 'granted') return false
            if (!job?.jobId) return false
            if (!isJobCreatedByUser(job)) return false // Only notify for jobs created by current user
            if (notifiedJobIdsRef.current.has(job.jobId)) return false // Already notified

            // Only notify for transitions to 'completed' or 'failed' (not 'cancelled')
            const notifyStatuses = new Set(['completed', 'failed'])
            if (!notifyStatuses.has(job.status)) return false

            // Only notify if transitioning from a non-terminal status
            const terminalStatuses = new Set([
                'completed',
                'failed',
                'cancelled',
            ])
            if (terminalStatuses.has(previousStatus)) return false // Already was terminal

            const title =
                job.title || job.question || 'Deep research task update'
            const statusLabel =
                job.status === 'completed' ? 'completed' : 'failed'

            try {
                new Notification(title, {
                    body: `Deep research task ${statusLabel}.`,
                })
                markJobAsNotified(job.jobId)
                return true
            } catch (err) {
                console.warn(
                    'Unable to send notification for job',
                    job.jobId,
                    err,
                )
                return false
            }
        },
        [
            isNotificationSupported,
            notificationPermission,
            isJobCreatedByUser,
            markJobAsNotified,
        ],
    )

    useEffect(() => {
        if (!isNotificationSupported) return
        setNotificationPermission(Notification.permission)
    }, [isNotificationSupported])

    useEffect(() => {
        if (!selectedJob?.status) {
            lastSelectedStatusRef.current = selectedJob?.status ?? null
            return
        }

        const currentStatus = selectedJob.status
        const previousStatus = lastSelectedStatusRef.current
        const isActiveJob =
            currentStatus === 'queued' || currentStatus === 'in_progress'
        const isNewlyCreated =
            selectedJob.jobId &&
            newlyCreatedJobIdsRef.current.has(selectedJob.jobId)

        // Only prompt for notifications for newly created jobs when they become active
        // This prevents prompting when loading existing jobs from the server
        const hasStartedResearch =
            isNewlyCreated &&
            (previousStatus === 'clarifying' ||
                previousStatus === null ||
                previousStatus === undefined) &&
            isActiveJob

        // Also prompt if a newly created job is selected that's already active
        const isNewlyCreatedActiveJob =
            isNewlyCreated &&
            isActiveJob &&
            (previousStatus === null ||
                previousStatus === undefined ||
                previousStatus !== currentStatus)

        if (hasStartedResearch || isNewlyCreatedActiveJob) {
            promptForNotificationPermission()
            // Remove from tracking set after prompting to avoid re-prompting
            if (selectedJob.jobId) {
                newlyCreatedJobIdsRef.current.delete(selectedJob.jobId)
            }
        }

        lastSelectedStatusRef.current = currentStatus
    }, [
        promptForNotificationPermission,
        selectedJob?.status,
        selectedJob?.jobId,
    ])

    // Determine if current user can modify bot
    useEffect(() => {
        if (!team || !user || !bot) return
        setModify(canUserEditBot(team, user.uid, bot))
    }, [team, user, bot])

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
                        const normalizedJob = normalizeResearchJobTools(job)
                        const exists = prev.some(
                            (j) => j.jobId === normalizedJob.jobId,
                        )
                        return exists ? prev : [normalizedJob, ...prev]
                    })
                    setSelectedJob(normalizeResearchJobTools(job))
                    // also refresh status
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
    }, [team?.id, bot?.id, researchJobs, setSelectedJob, setResearchJobs])

    useEffect(() => {
        console.log('selectedJob', selectedJob)
        if (
            selectedJob &&
            (selectedJob.status === 'queued' ||
                selectedJob.status === 'in_progress')
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
    }, [selectedJob, pollingInterval])

    const fetchResearchJobs = useCallback(
        async (page = 0, { silent = false } = {}) => {
            if (!team?.id || !bot?.id) return
            const pageSize = perPage

            if (!silent) setLoading(true)
            if (!silent) setErrorText(null)

            try {
                const path = `/api/teams/${team.id}/bots/${bot.id}?tab=research&page=${page}&perPage=${pageSize}`
                const response = await fetch(path, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                })

                if (response.ok) {
                    const data = await response.json()
                    const jobs = data.jobs || []

                    // Initialize previous statuses for loaded jobs (but don't send notifications yet)
                    // This prevents notifications on initial page load
                    jobs.forEach((job) => {
                        if (job?.jobId && job?.status) {
                            // Only initialize if we haven't seen this job before
                            if (
                                !previousJobStatusesRef.current.has(job.jobId)
                            ) {
                                previousJobStatusesRef.current.set(
                                    job.jobId,
                                    job.status,
                                )
                            }
                        }
                    })

                    setResearchJobs(
                        jobs.map((job) => normalizeResearchJobTools(job)),
                    )
                    // best-effort pagination mapping
                    const pagination = data.pagination || {}
                    setCurrentPage(pagination.page ?? page)
                    setPerPage(pagination.perPage ?? pageSize)
                    setTotalCount(
                        pagination.viewableCount ??
                            pagination.totalCount ??
                            data.totalCount ??
                            (Array.isArray(jobs) ? jobs.length : 0),
                    )
                } else {
                    try {
                        const data = await response.json()
                        if (!silent) {
                            setErrorText(
                                data.error ||
                                    data.message ||
                                    'Failed to load deep research tasks',
                            )
                        }
                    } catch (err) {
                        console.error('Error parsing error response:', err)
                        if (!silent)
                            setErrorText('Failed to load deep research tasks')
                    }
                }
            } catch (error) {
                console.error('Error fetching deep research tasks:', error)
                if (!silent) setErrorText('Failed to load deep research tasks')
            } finally {
                if (!silent) setLoading(false)
            }
        },
        [bot?.id, perPage, team?.id, setResearchJobs],
    )

    useEffect(() => {
        fetchResearchJobs(0)
    }, [fetchResearchJobs])

    const changePage = async (page) => {
        await fetchResearchJobs(page)
    }

    // Track status transitions for selectedJob (notifications are handled in fetchJobStatus)
    useEffect(() => {
        if (!selectedJob?.jobId || !selectedJob?.status) return

        const currentStatus = selectedJob.status
        // Initialize or update previous status tracking
        // This ensures we can detect transitions when fetchJobStatus is called
        if (!previousJobStatusesRef.current.has(selectedJob.jobId)) {
            previousJobStatusesRef.current.set(selectedJob.jobId, currentStatus)
        }
    }, [selectedJob?.jobId, selectedJob?.status, previousJobStatusesRef])

    const fetchJobStatus = async (jobId) => {
        try {
            // First try to fetch from internal API (Firestore)
            // This ensures we always have the latest data even if the Bot API is unreachable
            const internalPath = `/api/teams/${team.id}/bots/${bot.id}/research/${jobId}`
            const internalResponse = await fetch(internalPath)

            let jobData = null
            if (internalResponse.ok) {
                jobData = await internalResponse.json()
            }

            // Then try to poll the Bot API for real-time status updates if needed
            // (only if job is active)
            const isActive =
                jobData &&
                (jobData.status === 'queued' ||
                    jobData.status === 'in_progress')

            if (isActive && process.env.NEXT_PUBLIC_BOT_API_URL) {
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
                        jobData = await response.json()
                    }
                } catch (apiErr) {
                    console.warn(
                        'Bot API unreachable, using Firestore status',
                        apiErr,
                    )
                }
            }

            if (jobData) {
                const job = jobData
                const existing =
                    researchJobs.find((j) => j.jobId === jobId) || {}

                // Track previous status before updating to detect transitions
                const previousStatus =
                    previousJobStatusesRef.current.get(jobId) || existing.status

                const merged = normalizeResearchJobTools(
                    {
                        ...existing,
                        ...job,
                        // Preserve answers and summary from existing or new data
                        answers: job.answers || existing.answers,
                        summary: job.summary || existing.summary,
                        // Preserve metadata from API response or existing
                        metadata: job.metadata || existing.metadata,
                    },
                    existing,
                )

                // Check for status transition and send notification if needed
                if (previousStatus !== merged.status) {
                    sendJobNotification(merged, previousStatus)
                }

                // Update previous status
                previousJobStatusesRef.current.set(jobId, merged.status)

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
                    setErrorText(
                        data.error ||
                            data.message ||
                            'Failed to cancel deep research task',
                    )
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
                    setErrorText(
                        data.error ||
                            data.message ||
                            'Failed to delete deep research task',
                    )
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
        const jobUrl = `${window.location.origin}/app/bots/${bot.id}?tab=research&jobId=${selectedJob.jobId}`
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
                                    job = {
                                        ...job,
                                        clarifications: dbJob.clarifications,
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn(
                                'Error fetching clarifications on create:',
                                err,
                            )
                        }
                    }
                    const existing =
                        researchJobs.find((j) => j.jobId === jobId) || {}
                    const merged = normalizeResearchJobTools(
                        {
                            ...existing,
                            ...job,
                            // Preserve answers and summary from existing or new data
                            answers: job.answers || existing.answers,
                            summary: job.summary || existing.summary,
                            // Preserve metadata from API response or existing
                            metadata: job.metadata || existing.metadata,
                        },
                        existing,
                    )
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
        return (
            <div className={clsx('w-full bg-white p-2 px-2 lg:px-6')}>
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="mt-1 flex flex-col items-center sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-2 sm:py-1 lg:space-x-6">
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
                                                            alias={
                                                                selectedJob
                                                                    .metadata
                                                                    .name
                                                            }
                                                            email={
                                                                selectedJob
                                                                    .metadata
                                                                    .email
                                                            }
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
                                                    <TimeAgo
                                                        dateTime={
                                                            selectedJob.createdAt
                                                        }
                                                    />
                                                </span>
                                            </div>
                                        </Tooltip>
                                        {selectedJob.status === 'completed' &&
                                            selectedJob.completedAt && (
                                                <Tooltip content={`Run time`}>
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <ClockIcon
                                                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                            aria-hidden="true"
                                                        />
                                                        <span className="ml-1.5 hidden 2xl:inline">
                                                            {formatRuntime(
                                                                selectedJob,
                                                            )}
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            )}
                                    </div>
                                    <div className="h-6 border-l border-gray-300"></div>
                                    <div className="flex flex-wrap items-center gap-x-2 xl:gap-x-4">
                                        <Tooltip
                                            content={
                                                selectedJob.docsSearch
                                                    ? 'Documentation search enabled'
                                                    : 'Documentation search disabled'
                                            }
                                        >
                                            <div className="flex items-center text-sm text-gray-500">
                                                {selectedJob.docsSearch ? (
                                                    <DocumentMagnifyingGlassIconSolid
                                                        className="h-5 w-5 flex-shrink-0 text-cyan-600"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <DocumentMagnifyingGlassIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>
                                        </Tooltip>
                                        <Tooltip
                                            content={
                                                selectedJob.webSearch
                                                    ? 'Web search enabled'
                                                    : 'Web search disabled'
                                            }
                                        >
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
                                        <Tooltip
                                            content={
                                                selectedJob.questionHistory
                                                    ? 'Question history enabled'
                                                    : 'Question history disabled'
                                            }
                                        >
                                            <div className="flex items-center text-sm text-gray-500">
                                                {selectedJob.questionHistory ? (
                                                    <ChatBubbleLeftRightIconSolid
                                                        className="h-5 w-5 flex-shrink-0 text-cyan-600"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <ChatBubbleLeftRightIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>
                                        </Tooltip>
                                        <Tooltip
                                            content={
                                                selectedJob.codeInterpreter
                                                    ? 'Code interpreter enabled'
                                                    : 'Code interpreter disabled'
                                            }
                                        >
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
                        <Tooltip content="Start a deep research task">
                            <button
                                type="button"
                                onClick={() => setSelectedJob(null)}
                                disabled={loading}
                                className={clsx(
                                    'hidden items-center rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:inline-flex',
                                    loading
                                        ? 'cursor-not-allowed border-gray-200 text-gray-400'
                                        : 'border-cyan-600 text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-600',
                                )}
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
                                            <CheckIcon
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
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
                                                : deleteConfirm ===
                                                    selectedJob.jobId
                                                  ? 'Click again to confirm deletion'
                                                  : 'Delete this deep research task'
                                        }
                                    >
                                        <button
                                            className={`flex items-center rounded-md p-1 ${
                                                deleteConfirm ===
                                                selectedJob.jobId
                                                    ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                                                    : 'text-gray-400 hover:text-red-600'
                                            }`}
                                            onClick={() =>
                                                deleteJob(selectedJob.jobId)
                                            }
                                            disabled={
                                                deletingJobId ===
                                                selectedJob.jobId
                                            }
                                            type="button"
                                        >
                                            {deletingJobId ===
                                            selectedJob.jobId ? (
                                                <LoadingSpinner small={true} />
                                            ) : (
                                                <TrashIcon
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
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

    const content = (
        <>
            <main className={clsx('relative')}>
                <div className="mx-auto max-w-4xl">
                    <Alert title={errorText} type="warning" />
                </div>
                <div className="mx-auto max-w-4xl bg-gray-50 py-2 lg:py-4">
                    {loading ? (
                        newDashboard ? (
                            <Workspace.Loader
                                message="Loading research..."
                                variant="research-main"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-8 text-gray-500">
                                Loading deep research tasks...
                            </div>
                        )
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
                                previousJobStatusesRef={previousJobStatusesRef}
                                newlyCreatedJobIdsRef={newlyCreatedJobIdsRef}
                                sendJobNotification={sendJobNotification}
                                newDashboard={true}
                            />
                        ) : (
                            <ResearchResults
                                job={selectedJob}
                                onBack={() => {
                                    setSelectedJob(null)
                                    const url = new URL(window.location.href)
                                    url.searchParams.delete('jobId')
                                    window.history.replaceState(
                                        {},
                                        '',
                                        url.toString(),
                                    )
                                }}
                                onJobUpdate={(scrollFn) => {
                                    scrollToBottomRef.current = scrollFn
                                }}
                                hasPushSubscription={hasPushSubscription}
                                notificationPermission={notificationPermission}
                                isNotificationSupported={
                                    isNotificationSupported
                                }
                                onSubscribeToNotifications={
                                    handleSubscribeToNotifications
                                }
                                newDashboard={true}
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
                            previousJobStatusesRef={previousJobStatusesRef}
                            newlyCreatedJobIdsRef={newlyCreatedJobIdsRef}
                            sendJobNotification={sendJobNotification}
                            newDashboard={true}
                        />
                    )}
                </div>
            </main>
        </>
    )

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden">
            <Header />
            <div className="relative flex flex-1 overflow-hidden">
                <div className="h-full min-w-0 flex-1 overflow-y-auto">
                    {content}
                </div>
                <aside className="hidden h-full w-80 overflow-y-auto border-l border-gray-200 bg-white lg:block xl:w-96">
                    {loading && newDashboard ? (
                        <Workspace.Loader variant="research-sidebar" />
                    ) : researchJobs && researchJobs.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-100">
                            {researchJobs.map((job) => (
                                <ResearchJob
                                    key={job.jobId}
                                    job={job}
                                    onSelect={handleSelectJob}
                                    isSelected={
                                        selectedJob?.jobId === job.jobId
                                    }
                                    onCancel={cancelJob}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="flex h-full items-center justify-center p-8 text-gray-500">
                            No deep research tasks yet. Start your first deep
                            research task!
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}

export default Research
