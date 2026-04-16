import { useEffect, useState, useRef, Fragment, memo, useMemo, useCallback } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import {
  HandThumbDownIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  LinkIcon,
  UserCircleIcon,
  LightBulbIcon,
  ClipboardIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  RectangleStackIcon,
  PhotoIcon,
  CubeIcon,
  DocumentMagnifyingGlassIcon,
  LifebuoyIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline'
import {
  PaperAirplaneIcon,
  RectangleStackIcon as RectangleStackIconSolid,
  StopIcon,
  GlobeAltIcon as GlobeAltIconSolid,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import Alert from '@/components/Alert'
import RobotIcon from '@/components/RobotIcon'
import LoadingDots from './LoadingDots'
import { grabQuestions } from '@/utils/helpers'
import {
  DEFAULT_WEB_SEARCH_MODEL,
  WEB_SEARCH_COMPATIBLE_MODELS_LABEL,
  formatWebSearchModelLabel,
  isWebSearchCompatibleModel,
} from '@/lib/webSearch'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { usePostHog } from 'posthog-js/react'
import { v4 as uuidv4 } from 'uuid'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import Tooltip from '@/components/Tooltip'
import clsx from 'clsx'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalQA from '@/components/ModalQA'
import { canUserEditBot } from '@/utils/function.utils'
import Widget from '@new-dashboard/Widget'
import { i18n } from '@/constants/strings.constants'


const streamdownRemarkPlugins = [
  ...Object.values(defaultRemarkPlugins),
  [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

// Separate component for streaming content - defined outside Chat to enable proper memoization
const StreamingContent = memo(({ content, isStreaming }) => {
  return (
    <Streamdown
      mode={isStreaming ? 'streaming' : 'static'}
      isAnimating={false}
      remarkPlugins={streamdownRemarkPlugins}
      showMermaidActions={true}
    >
      {preprocessMath(content)}
    </Streamdown>
  )
}, (prevProps, nextProps) => prevProps.content === nextProps.content && prevProps.isStreaming === nextProps.isStreaming)
StreamingContent.displayName = 'StreamingContent'

// ChatRow component - defined outside Chat to enable proper memoization
const ChatRow = memo(({ 
  answer, 
  question, 
  currentAnswerText, 
  isStreaming,
  // Dependencies from Chat scope
  team,
  bot,
  isContextBoost,
  hideSources,
  canModify,
  isCopied,
  copiedId,
  ratings,
  handleCopyText,
  setRating,
  askQuestion,
  Source,
  SourceResearch,
}) => {
  const [expandedImage, setExpandedImage] = useState(null)
  const [qaOpen, setQAOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (answer.type === 'question') {
    return (
      <>
        <div className="relative mt-4 max-w-fit rounded-md bg-teal-50 text-left shadow-sm sm:rounded-lg">
          <div className="absolute -inset-7 flex h-32 w-12 items-center text-2xl font-extrabold tracking-tighter">
            <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-lg">
              <UserCircleIcon
                className="h-7 w-7 text-white"
                aria-hidden="true"
              />
            </span>
          </div>
          <div dir="auto" className="relative z-10 prose min-w-full p-4 px-6 text-start sm:px-8 prose-pre:my-0">
            {isMounted && answer.images && answer.images.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {answer.images.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setExpandedImage(imageUrl)}
                    className="relative overflow-hidden rounded-lg hover:opacity-90"
                  >
                    <img
                      src={imageUrl}
                      alt={`User uploaded image ${index + 1}`}
                      className="m-0 h-20 w-20 rounded-lg object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            {answer.question}
          </div>
        </div>

        <Transition.Root show={!!expandedImage} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={setExpandedImage}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                    <div className="absolute right-0 top-0 z-10 pr-4 pt-4">
                      <button
                        type="button"
                        className="rounded-md bg-white/80 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        onClick={() => setExpandedImage(null)}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div
                      onClick={() => setExpandedImage(null)}
                      className="cursor-pointer"
                    >
                      <img
                        src={expandedImage}
                        alt="Expanded view"
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                      />
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </>
    )
  } else {
    const markdownContent =
      answer.markdown || (isStreaming ? (currentAnswerText || '') : '')
    const isLoadingOnly = !markdownContent
    return (
      <div
        className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-12')}
      >
        <div
          className={clsx(
            'relative col-span-1 mt-4 border bg-white text-left shadow-sm sm:col-span-8',
            isLoadingOnly
              ? 'max-w-fit justify-self-start rounded-md sm:rounded-lg'
              : 'rounded-md sm:rounded-lg',
          )}
          id={answer.id || null}
        >
        <div className="absolute -inset-7 flex h-32 w-12 items-center text-2xl font-extrabold tracking-tighter">
          <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-lg">
            <RobotIcon className="h-7 w-7 text-white" aria-hidden="true" />
          </span>
        </div>
        <ModalQA
          team={team}
          botId={bot.id}
          question={{ id: answer.id, question, answer: answer.markdown }}
          open={qaOpen}
          setOpen={setQAOpen}
          hideButton={true}
        />
        <div
          dir="auto"
          className={clsx(
            isLoadingOnly
              ? 'relative z-10 flex items-center p-4 px-6'
              : clsx(
                  answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '',
                  'relative z-10 min-w-full p-6 text-start sm:px-8',
                ),
          )}
        >
          {markdownContent ? (
            <StreamingContent content={markdownContent} isStreaming={isStreaming} />
          ) : (
            <LoadingDots />
          )}
        </div>

          {answer.markdown && (
            <div
              className={clsx(
                'relative z-10 flex items-end justify-between px-6 pb-4 pr-4 sm:justify-end sm:px-8 sm:pr-4',
                !(answer.sources?.length > 0 && answer.sources.filter(s => !(s.used === false && !isContextBoost)).length > 0 && !hideSources) && !answer.options && '-mt-4',
              )}
            >
              {answer.sources?.length > 0 && answer.sources.filter(source => !(source.used === false && !isContextBoost)).length > 0 && !hideSources && (
                <div className="relative z-10 block text-left sm:hidden">
                  <div className="text-sm font-semibold text-gray-800">
                    {bot.labels.sources}
                  </div>
                  <ul className="mt-2">
                    {answer.sources.map((source, index) => (
                      <Source key={index} source={source} />
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between space-x-1">
                {answer.id && canModify && (
                <Tooltip content="Revise answer">
                  <button
                    onClick={() => setQAOpen(true)}
                    className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
                )}
                <button
                  onClick={() =>
                    handleCopyText(answer.markdown, answer.id || '')
                  }
                  title="Copy answer to clipboard"
                  className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                >
                  {isCopied && copiedId === (answer.id || '') ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5" />
                  )}
                </button>
                {answer.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRating(answer.id, 1)}
                      disabled={ratings[answer.id] === 1}
                      className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                    >
                      <span className="sr-only">{bot.labels.helpful}</span>
                      <HandThumbUpIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(answer.id, -1)}
                      disabled={ratings[answer.id] === -1}
                      className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                    >
                      <span className="sr-only">{bot.labels.unhelpful}</span>
                      <HandThumbDownIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </>
                )}
              </div>
              {answer.options && (
                <div className="flex items-center justify-between space-x-2">
                  {Object.entries(answer.options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => askQuestion(value)}
                      className="rounded-full border border-cyan-500 bg-gray-50 px-3 text-cyan-600 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {answer.sources?.length > 0 && answer.sources.filter(source => !(source.used === false && !isContextBoost)).length > 0 && (
          <div className="relative z-10 col-span-4 mt-4 hidden overflow-y-scroll text-left sm:block">
            <div className="text-sm font-semibold text-gray-800">
              {bot.labels.sources}
            </div>
            <ul className="mt-2">
              {answer.sources.map((source, index) => (
                <SourceResearch key={index} source={source} />
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
}, (prevProps, nextProps) => {
  // Only re-render if essential props change
  if (prevProps.answer !== nextProps.answer) return false
  if (prevProps.question !== nextProps.question) return false
  if (prevProps.isStreaming !== nextProps.isStreaming) return false
  if (nextProps.isStreaming) {
    return prevProps.currentAnswerText === nextProps.currentAnswerText
  }
  // For non-streaming rows, also check UI state props
  if (prevProps.isCopied !== nextProps.isCopied) return false
  if (prevProps.copiedId !== nextProps.copiedId) return false
  if (prevProps.ratings !== nextProps.ratings) return false
  return true
})
ChatRow.displayName = 'ChatRow'

const WEB_SEARCH_TOOL_NAMES = new Set([
  'web_search',
  'web_search_call',
  'web_search_preview',
])

function firstNonEmptyString(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c
  }
  return ''
}

function normalizeActionType(value) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'search' ||
    normalized === 'open_page' ||
    normalized === 'find_in_page'
  ) {
    return normalized
  }
  return ''
}

function tryParseJsonObject(str) {
  if (typeof str !== 'string' || !str.trim()) return null
  try {
    const v = JSON.parse(str)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

function isWebSearchEnvelopeType(t) {
  if (typeof t !== 'string') return false
  const x = t.trim().toLowerCase()
  return (
    x === 'web_search_call' ||
    x === 'web_search_preview' ||
    x === 'web_search'
  )
}

/**
 * OpenAI / agent payloads may be a flat action `{ type, query }`, or an envelope
 * `{ type: "web_search_call", action: {...} }` with `action` sometimes JSON-stringified.
 */
function unwrapWebSearchParamsObject(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed

  if (typeof parsed.params === 'string') {
    const inner = tryParseJsonObject(parsed.params)
    if (inner) return unwrapWebSearchParamsObject(inner)
  }

  const topType =
    typeof parsed.type === 'string' ? parsed.type.trim().toLowerCase() : ''

  if (parsed.action != null) {
    const inner =
      typeof parsed.action === 'string'
        ? tryParseJsonObject(parsed.action)
        : parsed.action
    if (inner && typeof inner === 'object') {
      if (isWebSearchEnvelopeType(topType)) {
        return inner
      }
      if (
        !topType &&
        (normalizeActionType(inner.type) ||
          normalizeActionType(inner.action_type) ||
          firstNonEmptyString(
            inner.query,
            inner.url,
            inner.pattern,
            Array.isArray(inner.queries) ? inner.queries[0] : '',
          ))
      ) {
        return inner
      }
    }
  }

  return parsed
}

function parseWebSearchToolCallParams(rawParams) {
  let parsed = rawParams
  if (typeof parsed === 'string') {
    parsed = tryParseJsonObject(parsed)
    if (!parsed) {
      return {}
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return {}
  }

  parsed = unwrapWebSearchParamsObject(parsed)

  const source = parsed

  const query = firstNonEmptyString(
    source.query,
    source.action?.query,
    Array.isArray(source.queries) ? source.queries[0] : '',
    Array.isArray(source.action?.queries) ? source.action.queries[0] : '',
  )
  const url = firstNonEmptyString(
    source.action?.url,
    source.url,
    source.action?.target_url,
    source.target_url,
  )
  const pattern = firstNonEmptyString(
    source.action?.pattern,
    source.pattern,
  )

  const typeFromNestedAction = normalizeActionType(
    typeof source.action?.type === 'string' ? source.action.type : '',
  )
  let actionType = normalizeActionType(
    source.action_type ||
      (typeof source.type === 'string' && !isWebSearchEnvelopeType(source.type)
        ? source.type
        : ''),
  )
  if (!actionType && typeFromNestedAction) {
    actionType = typeFromNestedAction
  }

  if (!actionType) {
    if (query) actionType = 'search'
    else if (url && pattern) actionType = 'find_in_page'
    else if (url) actionType = 'open_page'
    else if (pattern) actionType = 'find_in_page'
  }

  return {
    webSearchActionType: actionType,
    webSearchQuery: query || '',
    webSearchUrl: url || '',
    webSearchPattern: pattern || '',
  }
}

function compactActivityUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return ''
  try {
    const href = /^https?:\/\//i.test(urlString.trim())
      ? urlString.trim()
      : `https://${urlString.trim()}`
    const parsed = new URL(href)
    const hostname = parsed.hostname.replace(/^www\./i, '')
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname
    const compact = `${hostname}${pathname}`
    if (compact.length <= 60) return compact
    return `${compact.slice(0, 57)}...`
  } catch {
    const compact = urlString.trim()
    if (compact.length <= 60) return compact
    return `${compact.slice(0, 57)}...`
  }
}

function faviconUrl(displayUrl) {
  try {
    const href = /^https?:\/\//i.test(displayUrl)
      ? displayUrl
      : `https://${displayUrl}`
    const host = new URL(href).hostname.replace(/^www\./i, '')
    if (!host) return ''
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=16`
  } catch {
    return ''
  }
}

const FAVICON_SOURCE_TYPES = new Set(['url', 'urls', 'sitemap', 'rss'])

function sourceFaviconUrl(source) {
  const sourceType =
    typeof source?.type === 'string' ? source.type.trim().toLowerCase() : ''

  if (!FAVICON_SOURCE_TYPES.has(sourceType) || !source?.url) {
    return ''
  }

  return faviconUrl(source.url)
}

function normalizeWebSearchHref(urlString) {
  if (!urlString || typeof urlString !== 'string') return ''
  const t = urlString.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

function splitTemplateAroundKey(template, key) {
  if (typeof template !== 'string') return null
  const token = `{${key}}`
  const i = template.indexOf(token)
  if (i === -1) return null
  return { before: template.slice(0, i), after: template.slice(i + token.length) }
}

const AgentActivityWithUrl = memo(function AgentActivityWithUrl({
  icon: Icon,
  labelBefore = '',
  labelAfter = '',
  compactUrl,
  fullUrl,
  isStreamingStarted = true,
}) {
  const favicon = faviconUrl(fullUrl || compactUrl)

  return (
    <div className={clsx("flex min-w-0 max-w-full items-center text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
      <AgentEventLeading icon={Icon} isStreamingStarted={isStreamingStarted} />
      <span
        dir="auto"
        className="min-w-0 max-w-full font-medium [overflow-wrap:anywhere] line-clamp-2"
      >
        {labelBefore}
        <span
          className="inline-flex max-w-[min(36ch,70vw)] min-w-0 items-center gap-[0.28em] align-middle font-mono text-[0.82em] text-gray-500/80"
          title={fullUrl || compactUrl}
        >
          {favicon ? (
            <img
              src={favicon}
              alt=""
              width={12}
              height={12}
              loading="lazy"
              className="h-3 w-3 shrink-0 rounded-sm"
            />
          ) : null}
          <span className="min-w-0 flex-1 truncate">{compactUrl}</span>
        </span>
        {labelAfter}
      </span>
    </div>
  )
})
AgentActivityWithUrl.displayName = 'AgentActivityWithUrl'

const AgentActivityWithValue = memo(function AgentActivityWithValue({
  icon: Icon,
  labelBefore = '',
  labelAfter = '',
  value = '',
  fullValue = '',
  isStreamingStarted = true,
}) {
  return (
    <div className={clsx("flex min-w-0 max-w-full items-center text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
      <AgentEventLeading icon={Icon} isStreamingStarted={isStreamingStarted} />
      <span
        dir="auto"
        className="min-w-0 max-w-full font-medium [overflow-wrap:anywhere] line-clamp-2"
      >
        {labelBefore}
        <span
          className="inline-flex max-w-[min(36ch,70vw)] min-w-0 items-center align-middle font-mono text-[0.82em] text-gray-500/80"
          title={fullValue || value}
        >
          <span className="min-w-0 flex-1 truncate">{value}</span>
        </span>
        {labelAfter}
      </span>
    </div>
  )
})
AgentActivityWithValue.displayName = 'AgentActivityWithValue'

function fillAgentLabelTemplate(template, replacements) {
  if (typeof template !== 'string' || !template.trim()) return ''
  let out = template
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(`{${k}}`).join(String(v ?? ''))
  }
  return out
}

function upsertReasoningEvent(events, incomingEvent) {
  if (!incomingEvent?.reasoningId) {
    return [...events, incomingEvent]
  }

  const existingIndex = events.findIndex(
    (event) => event.type === 'reasoning' && event.reasoningId === incomingEvent.reasoningId,
  )

  if (existingIndex === -1) {
    return [...events, incomingEvent]
  }

  const updated = [...events]
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...incomingEvent,
    eventKey: updated[existingIndex].eventKey || incomingEvent.eventKey,
  }
  return updated
}

function resolveWebSearchToolCallDisplay(labels, parsed) {
  const defaultLabels = i18n?.en?.labels || {}
  const q = { ...defaultLabels, ...(labels || {}) }
  const base = q.agentActivityWebSearch || 'Searching the web…'
  const actionType = parsed.webSearchActionType

  if (actionType === 'search' && parsed.webSearchQuery) {
    const tmpl = q.agentActivityWebSearchQuery || '{query}'
    const split = splitTemplateAroundKey(tmpl, 'query')
    if (split) {
      return {
        kind: 'withValue',
        labelBefore: split.before,
        labelAfter: split.after,
        value: parsed.webSearchQuery,
        fullValue: parsed.webSearchQuery,
      }
    }
    const t = fillAgentLabelTemplate(tmpl, {
      query: parsed.webSearchQuery,
    })
    return { kind: 'plain', text: t || base }
  }

  if (actionType === 'open_page' && parsed.webSearchUrl) {
    const tmpl =
      q.agentActivityWebSearchOpeningPage || 'Opening {url}'
    const fullUrl = normalizeWebSearchHref(parsed.webSearchUrl)
    const compact = compactActivityUrl(parsed.webSearchUrl)
    const split = splitTemplateAroundKey(tmpl, 'url')
    if (split && compact) {
      return {
        kind: 'withUrl',
        labelBefore: split.before,
        labelAfter: split.after,
        compactUrl: compact,
        fullUrl,
      }
    }
    const t = fillAgentLabelTemplate(tmpl, {
      url: compact,
    })
    return { kind: 'plain', text: t || base }
  }

  if (
    actionType === 'find_in_page' &&
    (parsed.webSearchUrl || parsed.webSearchPattern)
  ) {
    const tmpl = q.agentActivityWebSearchSearchingPage || ''
    const fullUrl = normalizeWebSearchHref(parsed.webSearchUrl)
    const compact = parsed.webSearchUrl
      ? compactActivityUrl(parsed.webSearchUrl)
      : ''
    if (parsed.webSearchUrl && tmpl.includes('{url}')) {
      const split = splitTemplateAroundKey(tmpl, 'url')
      if (split && compact) {
        const labelBefore = fillAgentLabelTemplate(split.before, {
          pattern: parsed.webSearchPattern,
        })
        const labelAfter = fillAgentLabelTemplate(split.after, {
          pattern: parsed.webSearchPattern,
        })
        return {
          kind: 'withUrl',
          labelBefore,
          labelAfter,
          compactUrl: compact,
          fullUrl,
        }
      }
    }
    const t = fillAgentLabelTemplate(tmpl, {
      url: compact,
      pattern: parsed.webSearchPattern,
    })
    return { kind: 'plain', text: t || base }
  }

  return { kind: 'plain', text: base }
}

const AGENT_EVENT_ROW_CLASS =
  'relative isolate py-1 pr-2 pl-8 before:absolute before:inset-y-0 before:left-5 before:right-0 before:-z-10 before:rounded-md before:transition-colors hover:before:bg-gray-100/70'
const AGENT_EVENTS_TIMELINE_CLASS =
  'relative ml-3 text-left before:absolute before:bottom-2 before:left-0 before:top-2 before:border-l before:border-gray-200 before:content-[\"\"]'

function humanizeSnakeCaseLabel(value) {
  if (value == null || value === '') return ''
  const s = String(value).trim()
  if (!s) return ''
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function isMcpToolCallEvent(toolCall) {
  const t = String(toolCall.tool_type || '').toLowerCase()
  if (t === 'mcp') return true
  const server = toolCall.mcp_server || toolCall.server_label
  const tool = toolCall.mcp_tool || toolCall.tool_name
  return Boolean(server && tool)
}

function getMcpToolCallLabels(toolCall) {
  const serverRaw = toolCall.server_label || toolCall.mcp_server || ''
  const toolRaw = toolCall.mcp_tool || toolCall.tool_name || ''
  let serverLabel = humanizeSnakeCaseLabel(serverRaw)
  let toolLabel = humanizeSnakeCaseLabel(toolRaw)
  if (serverLabel && toolLabel) {
    return { serverLabel, toolLabel }
  }
  const nameFallback = humanizeSnakeCaseLabel(
    String(toolCall.name || '').replace(/^mcp_/i, ''),
  )
  if (!toolLabel) {
    toolLabel = nameFallback || 'tool'
  }
  if (!serverLabel) {
    serverLabel = 'MCP'
  }
  return { serverLabel, toolLabel }
}

function AgentEventLeading({
  icon: Icon,
  isStreamingStarted = true,
  iconClassName,
}) {
  return (
    <span className="absolute -left-[13px] top-1.5 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
      {isStreamingStarted ? (
        <Icon className={clsx('h-4 w-4 text-gray-400', iconClassName)} aria-hidden />
      ) : (
        <div className="relative h-4 w-4">
          <div className="h-4 w-4 rounded-full border border-gray-300" />
          <div className="absolute left-0 top-0 h-4 w-4 animate-spin rounded-full border-t-2 border-gray-400" />
        </div>
      )}
    </span>
  )
}

// Component to display tool calls - simplified inline style
const ToolCallDisplay = memo(({ toolCalls, isStreamingStarted = true, labels = {} }) => {
  if (!toolCalls || toolCalls.length === 0) return null

  return (
    <div className="mb-0 flex flex-col text-left">
      {toolCalls.map((toolCall, idx) => {
        const name = toolCall.name || ''
        
        if (name === 'search_documentation') {
          try {
            const params = typeof toolCall.params === 'string' 
              ? JSON.parse(toolCall.params) 
              : toolCall.params
            
            const queries = params.query || []
            const question = params.question || ''
            // Combine queries and question into a single list
            const allTerms = question ? [...queries, question] : queries
            
            // If there are terms, use expandable details
            if (allTerms.length > 0) {
              return (
                <details key={toolCall.id || idx} className="group text-sm text-gray-500">
                  <summary className={clsx("cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden", AGENT_EVENT_ROW_CLASS)}>
                    <AgentEventLeading
                      icon={DocumentMagnifyingGlassIcon}
                      isStreamingStarted={isStreamingStarted}
                    />
                    <span className="font-medium">{isStreamingStarted ? 'Searched documentation:' : 'Searching documentation:'}</span>
                    <span className="group-open:hidden">{allTerms.length} {allTerms.length === 1 ? 'term' : 'terms'}</span>
                    <span className="hidden group-open:inline text-gray-400 text-xs">Hide terms</span>
                    <ChevronDownIcon className="h-3 w-3 text-gray-400 transition-transform duration-150 group-open:rotate-180 flex-shrink-0" />
                  </summary>
                  <ul className="mt-2 ms-10 space-y-1">
                    {allTerms.map((term, termIdx) => (
                      <li key={termIdx} className="text-xs text-gray-500">
                        <pre className="inline whitespace-pre-wrap text-xs">{term}</pre>
                      </li>
                    ))}
                  </ul>
                </details>
              )
            }
            
            // No terms at all, just show the label
            return (
              <div key={toolCall.id || idx} className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
                <AgentEventLeading
                  icon={DocumentMagnifyingGlassIcon}
                  isStreamingStarted={isStreamingStarted}
                />
                <span className="font-medium">{isStreamingStarted ? 'Searched documentation' : 'Searching documentation'}</span>
              </div>
            )
          } catch (error) {
            console.error('Error parsing tool_call data:', error)
            return (
              <div key={toolCall.id || idx} className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
                <AgentEventLeading
                  icon={DocumentMagnifyingGlassIcon}
                  isStreamingStarted={isStreamingStarted}
                />
                <span className="font-medium">{isStreamingStarted ? 'Searched documentation' : 'Searching documentation'}</span>
              </div>
            )
          }
        } else if (WEB_SEARCH_TOOL_NAMES.has(name)) {
          let parsed = {}
          try {
            parsed = parseWebSearchToolCallParams(toolCall.params)
          } catch (error) {
            console.error('Error parsing web_search tool_call params:', error)
          }
          const display = resolveWebSearchToolCallDisplay(labels, parsed)
          if (display.kind === 'withUrl') {
            return (
              <AgentActivityWithUrl
                key={toolCall.id || idx}
                icon={GlobeAltIcon}
                labelBefore={display.labelBefore}
                labelAfter={display.labelAfter}
                compactUrl={display.compactUrl}
                fullUrl={display.fullUrl}
                isStreamingStarted={isStreamingStarted}
              />
            )
          }
          if (display.kind === 'withValue') {
            return (
              <AgentActivityWithValue
                key={toolCall.id || idx}
                icon={GlobeAltIcon}
                labelBefore={display.labelBefore}
                labelAfter={display.labelAfter}
                value={display.value}
                fullValue={display.fullValue}
                isStreamingStarted={isStreamingStarted}
              />
            )
          }
          return (
            <div
              key={toolCall.id || idx}
              className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}
            >
              <AgentEventLeading
                icon={GlobeAltIcon}
                isStreamingStarted={isStreamingStarted}
              />
              <span className="font-medium">{display.text}</span>
            </div>
          )
        } else if (name === 'human_escalation') {
          return (
            <div key={toolCall.id || idx} className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
              <AgentEventLeading icon={LifebuoyIcon} />
              <span className="font-medium">Escalating to human</span>
            </div>
          )
        } else if (isMcpToolCallEvent(toolCall)) {
          const { serverLabel, toolLabel } = getMcpToolCallLabels(toolCall)
          return (
            <div key={toolCall.id || idx} className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
              <AgentEventLeading
                icon={ServerStackIcon}
                isStreamingStarted={isStreamingStarted}
              />
              <span className="font-medium">
                {isStreamingStarted ? 'Called' : 'Calling'}{' '}
                <span className="font-normal text-gray-500">{serverLabel}: </span>
                <span className="text-gray-700">{toolLabel}</span>
              </span>
            </div>
          )
        }

        // Generic tool call
        return (
          <div key={toolCall.id || idx} className={clsx("flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
            <AgentEventLeading icon={BeakerIcon} />
            <span className="font-medium">Using {name}</span>
          </div>
        )
      })}
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.toolCalls === nextProps.toolCalls &&
    prevProps.isStreamingStarted === nextProps.isStreamingStarted &&
    prevProps.labels === nextProps.labels
  )
})
ToolCallDisplay.displayName = 'ToolCallDisplay'

// Brain icon for reasoning display
const BrainIcon = ({ className }) => (
  <svg viewBox="18 58 115 98" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M129.49 114.51C129.121 116.961 128.187 119.293 126.762 121.322C125.337 123.351 123.461 125.021 121.28 126.2C120.676 126.535 120.043 126.816 119.39 127.04C120.22 138.04 102.74 142.04 93.32 139.42L96.82 151.66L87.82 151.98L72.07 129.43C66.76 130.93 60.49 131.65 56.44 125.15C56.0721 124.553 55.7382 123.935 55.44 123.3C54.4098 123.51 53.3614 123.617 52.31 123.62C49.31 123.62 44.31 122.72 41.77 120.96C39.7563 119.625 38.1588 117.75 37.16 115.55C31.75 116.29 27.16 115.02 24.16 111.88C20.36 107.97 19.28 101.51 21.26 94.58C23.87 85.33 31.81 74.91 47.59 71C48.9589 69.2982 50.5972 67.8322 52.44 66.66C62.35 60.31 78.44 59.76 90.65 65.79C95.3836 64.9082 100.27 65.376 104.75 67.14C113.53 70.43 119.91 77.31 121.11 84.3C123.487 85.5317 125.433 87.4568 126.69 89.82C129.32 94.76 129.69 99.71 127.92 103.71C129.587 107.049 130.138 110.835 129.49 114.51ZM123.01 109.31C121.612 110.048 120.056 110.434 118.475 110.434C116.894 110.434 115.338 110.048 113.94 109.31L114.67 104.46C117.75 104.76 120.26 103.8 121.57 101.83C123.04 99.64 122.81 96.39 120.95 92.9C118.87 88.99 114.38 88.37 111.89 88.34H111.73C105.49 88.34 99.13 91.89 96.56 96.52L92.82 94.73C93.5553 92.3449 94.8046 90.15 96.48 88.3C95.0376 87.0754 93.9474 85.4887 93.3217 83.703C92.696 81.9173 92.5574 79.9971 92.92 78.14L96.61 77.8C96.7789 79.302 97.4 80.7172 98.3911 81.8583C99.3822 82.9994 100.697 83.8125 102.16 84.19C105.238 82.8161 108.58 82.1335 111.95 82.19C112.43 82.19 112.89 82.24 113.36 82.27C110.969 78.0312 107.18 74.7545 102.64 73C91.56 68.7 84.09 75.37 82.38 77.67C78.26 83.19 80.9 88.41 82.91 91.8L79.61 94.8C76.736 92.314 74.8075 88.9127 74.15 85.17C69.92 86.44 64.24 86.17 61.06 80.74L64.06 78.68C67.43 81.2 72.78 80.98 75.32 77.87C75.9252 76.4949 76.6905 75.1959 77.6 74C79.044 72.093 80.7864 70.4316 82.76 69.08C74.47 66.82 62.76 67.19 55.68 71.73C53.7668 72.841 52.192 74.4517 51.1244 76.3895C50.0569 78.3274 49.5368 80.5192 49.62 82.73C49.62 86.3 52.42 91.94 56.19 92.82L54 97.07C51.5946 96.5129 49.4109 95.2487 47.73 93.44L44.48 97.58L41.23 96L44.41 87.68C43.8904 86.064 43.624 84.3774 43.62 82.68C43.628 81.3361 43.7687 79.9963 44.04 78.68C34.04 82.81 29.1 89.68 27.29 95.96C25.9 100.79 26.44 105.15 28.72 107.49C30.53 109.35 33.3 109.79 35.91 109.62L42.91 104.17L45.21 106.11L43.13 112.93C44.22 116.4 47.79 118.19 54.3 116.93C54.6375 114.169 55.7272 111.554 57.45 109.37C58.7133 107.552 60.3846 106.056 62.33 105L65.75 95.79L69.17 95.64L68.8 103.19C74.55 102.6 80.98 103.77 86.97 102.87L88.07 106.87C79.29 110.93 70.3 104.31 62.15 113.04C59.22 116.18 60.34 118.91 62.15 121.66C64.76 125.59 69.66 123.23 74.67 121.66C82.26 119.34 87.77 117.66 98.16 118.51C95.68 113.8 95.92 108.11 99.24 101.85L104.13 103.78C100.7 111.69 103.91 116.27 106.13 118.29C109.56 121.41 114.72 122.35 118.13 120.47C119.436 119.749 120.559 118.737 121.412 117.513C122.265 116.289 122.825 114.885 123.05 113.41C123.275 112.051 123.258 110.663 123 109.31H123.01Z"/>
  </svg>
)

function parseReasoningText(text = '') {
  const normalized = typeof text === 'string' ? text.replace(/\r\n/g, '\n') : ''
  if (!normalized.trim()) {
    return { title: '', body: '', hasStructuredTitle: false }
  }

  const lines = normalized.split('\n')
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim())
  if (firstNonEmptyIndex === -1) {
    return { title: '', body: '', hasStructuredTitle: false }
  }

  const firstLine = lines[firstNonEmptyIndex].trim()
  const titleMatch = firstLine.match(/^\*\*(.+?)\*\*$/)

  if (!titleMatch) {
    return {
      title: '',
      body: normalized.trim(),
      hasStructuredTitle: false,
    }
  }

  const body = lines
    .slice(firstNonEmptyIndex + 1)
    .join('\n')
    .replace(/^\n+/, '')
    .trim()

  return {
    title: titleMatch[1].trim(),
    body,
    hasStructuredTitle: true,
  }
}

// Component to display a single reasoning item
const ReasoningItem = memo(({ text, isStreaming = false, hasFollowingEvent = false, isAnswerStreaming = false, thinkingLabel = 'Thinking…' }) => {
  // Show "Thought" if there's a following event OR if the answer has started streaming
  const isComplete = hasFollowingEvent || isAnswerStreaming
  
  if (!text || !text.trim()) {
    // Show "Thinking..." or "Thought" when reasoning is active but text is empty
    if (isStreaming || hasFollowingEvent) {
      return (
        <div className={clsx("mt-2 flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
          <AgentEventLeading
            icon={BrainIcon}
            iconClassName={clsx("h-4 w-4 text-gray-400", isStreaming && !isComplete && "animate-wobble")}
          />
          <span className="font-medium">{isComplete ? 'Thought' : thinkingLabel}</span>
        </div>
      )
    }
    return null
  }

  const { title, body, hasStructuredTitle } = parseReasoningText(text)

  if (hasStructuredTitle) {
    if (body) {
      return (
        <details className="group mt-2 text-sm text-gray-500">
          <summary className={clsx("cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden min-h-0", AGENT_EVENT_ROW_CLASS)}>
            <AgentEventLeading
              icon={BrainIcon}
              iconClassName={clsx("h-4 w-4 text-gray-400", isStreaming && !isComplete && "animate-wobble")}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              Thought:{' '}
              <span className="text-gray-600 font-semibold">{title}</span>
            </span>
            <span className="ml-auto hidden whitespace-nowrap text-xs text-gray-400 group-open:inline">
              Hide thinking
            </span>
            <ChevronDownIcon className="h-3 w-3 text-gray-400 transition-transform duration-150 group-open:rotate-180 flex-shrink-0" />
          </summary>
          <div className="mt-2 ms-10 text-gray-500 text-left [&_p]:text-left [&_*]:text-left">
            <Streamdown mode="static" isAnimating={false} remarkPlugins={streamdownRemarkPlugins}>
              {body}
            </Streamdown>
          </div>
        </details>
      )
    }

    return (
      <div className={clsx("mt-2 flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
        <AgentEventLeading
          icon={BrainIcon}
          iconClassName={clsx("h-4 w-4 text-gray-400", isStreaming && !isComplete && "animate-wobble")}
        />
        <span className="font-medium">
          Thought:{' '}
          <span className="text-gray-600 font-semibold">{title}</span>
        </span>
      </div>
    )
  }

  // Get truncated preview (first ~150 chars or first 2 sentences)
  const getPreview = (text) => {
    // Strip markdown for preview
    const plainText = text.replace(/[#*_`~\[\]]/g, '').replace(/\n+/g, ' ')
    const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [plainText]
    const firstTwo = sentences.slice(0, 2).join('')
    if (firstTwo.length > 150) {
      return firstTwo.substring(0, 150).trim()
    }
    if (sentences.length > 2) {
      return firstTwo.trim()
    }
    return plainText.length > 150 ? plainText.substring(0, 150).trim() : plainText
  }
  
  const preview = getPreview(text)
  const needsExpansion = text.length > preview.length + 20 // Add buffer for markdown chars

  if (needsExpansion) {
    return (
      <details className="group mt-2 text-sm text-gray-500">
        <summary className={clsx("cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden min-h-0", AGENT_EVENT_ROW_CLASS)}>
          <AgentEventLeading
            icon={BrainIcon}
            iconClassName={clsx("h-4 w-4 text-gray-400", isStreaming && !isComplete && "animate-wobble")}
          />
          <span className="group-open:hidden min-w-0 truncate">{preview}…</span>
          <span className="ml-auto hidden whitespace-nowrap text-xs text-gray-400 group-open:inline">
            Hide thinking
          </span>
          <ChevronDownIcon className="h-3 w-3 text-gray-400 transition-transform duration-150 group-open:rotate-180 flex-shrink-0" />
        </summary>
        <div className="mt-2 ms-10 text-gray-500 text-left [&_p]:text-left [&_*]:text-left">
          <Streamdown mode="static" isAnimating={false} remarkPlugins={streamdownRemarkPlugins}>
            {text}
          </Streamdown>
        </div>
      </details>
    )
  }

  return (
    <div className={clsx("mt-2 flex items-center gap-2 text-sm text-gray-500", AGENT_EVENT_ROW_CLASS)}>
      <AgentEventLeading
        icon={BrainIcon}
        iconClassName={clsx("h-4 w-4 text-gray-400", isStreaming && !isComplete && "animate-wobble")}
      />
      <div className="text-gray-500 text-left [&_p]:text-left [&_*]:text-left">
        <Streamdown mode="static" isAnimating={false} remarkPlugins={streamdownRemarkPlugins}>
          {text}
        </Streamdown>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.text === nextProps.text && prevProps.isStreaming === nextProps.isStreaming && prevProps.hasFollowingEvent === nextProps.hasFollowingEvent && prevProps.isAnswerStreaming === nextProps.isAnswerStreaming
})
ReasoningItem.displayName = 'ReasoningItem'

const AgentEventsList = memo(function AgentEventsList({
  events = [],
  defaultOpen = false,
  labels = {},
  isStreaming = false,
  isAnswerStreaming = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  useEffect(() => {
    setIsOpen(defaultOpen)
  }, [defaultOpen])

  if (!events || events.length === 0) {
    return null
  }

  const sectionLabel = labels.agentActivitySection || 'Agent activity…'

  const renderEvent = (event, eventIndex) => {
    const hasFollowingEvent = eventIndex < events.length - 1

    if (event.type === 'reasoning') {
      return (
        <ReasoningItem
          key={event.eventKey || `reasoning-${eventIndex}`}
          text={event.text}
          isStreaming={isStreaming}
          hasFollowingEvent={hasFollowingEvent}
          isAnswerStreaming={isAnswerStreaming}
          thinkingLabel={labels.agentActivityThinking}
        />
      )
    }

    if (event.type === 'tool_call') {
      return (
        <div key={event.eventKey || `toolcall-${eventIndex}`} className="mt-2">
          <ToolCallDisplay
            toolCalls={[event]}
            isStreamingStarted={isAnswerStreaming || hasFollowingEvent || !isStreaming}
            labels={labels}
          />
        </div>
      )
    }

    return null
  }

  if (events.length === 1) {
    return <div className="mt-4 ml-4">{renderEvent(events[0], 0)}</div>
  }

  return (
    <details
      className="mt-4 text-sm text-gray-500"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex w-full cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 text-left text-gray-500 hover:text-gray-700 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 font-medium">{sectionLabel}</span>
        {isOpen ? (
          <ChevronDownIcon
            className="ml-auto h-3 w-3 flex-shrink-0 text-gray-400"
            aria-hidden
          />
        ) : (
          <ChevronRightIcon
            className="ml-auto h-3 w-3 flex-shrink-0 text-gray-400"
            aria-hidden
          />
        )}
      </summary>
      <div className="ml-4 mt-2">
        <div className={AGENT_EVENTS_TIMELINE_CLASS}>
          {events.map((event, eventIndex) => renderEvent(event, eventIndex))}
        </div>
      </div>
    </details>
  )
})
AgentEventsList.displayName = 'AgentEventsList'

export default function Chat({ team, bot, showResearchMode = false, newDashboard = false }) {
  const getDefaultWebSearchEnabled = useCallback(
    (currentBot) => currentBot?.tools?.web_search?.enabled === true,
    [],
  )
  const questionRef = useRef('')
  const [formKey, setFormKey] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentSource, setCurrentSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [canModify, setModify] = useState(false)
  const [ratings, setRatings] = useState({})
  const [isContextBoost, setIsContextBoost] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)
  const [contextBoostDisabled, setContextBoostDisabled] = useState(
    bot.model === 'gpt-3.5-turbo-0613',
  )
  const [conversationId, setConversationId] = useState(uuidv4())
  const [selectedModel, setSelectedModel] = useState(bot.model)
  const [webSearch, setWebSearch] = useState(() => getDefaultWebSearchEnabled(bot))
  const activeWebSearchModel =
    selectedModel || bot.model || DEFAULT_WEB_SEARCH_MODEL
  const webSearchModelCompatible =
    isWebSearchCompatibleModel(activeWebSearchModel)
  const canUseWebSearch =
    Boolean(team?.openAIKey) &&
    checkPlanPermission(team, 'standard').allowed &&
    webSearchModelCompatible
  
  // Models that support reasoning effort
  // GPT-5.4 series: gpt-5.4, gpt-5.4-mini, gpt-5.4-nano
  // GPT-5.x series: gpt-5.1, gpt-5.2
  // GPT-5.0 series: gpt-5, gpt-5-mini, gpt-5-nano
  // O-series: o1, o1-mini, o3, o3-mini, o4, o4-mini
  const reasoningModels = [
    'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-5.1', 'gpt-5.2',  // GPT-5.4 / GPT-5.x series
    'gpt-5', 'gpt-5-mini', 'gpt-5-nano',  // GPT-5.0 series
    'o1', 'o1-mini', 'o3', 'o3-mini', 'o4', 'o4-mini'  // O-series
  ]
  
  // Check if a model is a reasoning model
  const isReasoningModel = (model) => {
    return reasoningModels.includes(model)
  }
  
  // Get default reasoning effort based on model
  const getDefaultReasoningEffort = (model) => {
    // GPT-5.4 nano defaults to "medium"
    if (model === 'gpt-5.4-nano') {
      return 'medium'
    }

    // GPT-5.4 series: default "none"
    if (model === 'gpt-5.4' || model === 'gpt-5.4-mini' || model === 'gpt-5.1' || model === 'gpt-5.2') {
      return 'none'
    }
    // GPT-5.0 series: default "minimal"
    if (model === 'gpt-5' || model === 'gpt-5-mini' || model === 'gpt-5-nano') {
      return 'minimal'
    }
    // O-series: default "low"
    if (model.startsWith('o')) {
      return 'low'
    }
    // Non-reasoning models
    return null
  }
  
  // Get supported reasoning effort values for a model (ordered highest to lowest)
  const getSupportedReasoningEfforts = (model) => {
    // GPT-5.4 series: "xhigh", "high", "medium", "low", "none"
    if (model === 'gpt-5.4' || model === 'gpt-5.4-mini' || model === 'gpt-5.4-nano') {
      return ['xhigh', 'high', 'medium', 'low', 'none']
    }
    // GPT-5.1 / GPT-5.2 series: "high", "medium", "low", "none"
    if (model === 'gpt-5.1' || model === 'gpt-5.2') {
      return ['high', 'medium', 'low', 'none']
    }
    // GPT-5.0 series: "high", "medium", "low", "minimal"
    if (model === 'gpt-5' || model === 'gpt-5-mini' || model === 'gpt-5-nano') {
      return ['high', 'medium', 'low', 'minimal']
    }
    // O-series: "high", "medium", "low"
    if (model.startsWith('o')) {
      return ['high', 'medium', 'low']
    }
    // Non-reasoning models
    return []
  }
  
  const [reasoningEffort, setReasoningEffort] = useState(
    getDefaultReasoningEffort(bot.model)
  )
  
  // Update reasoning effort when model changes
  // Preserve current value if it's supported by the new model, otherwise use default
  useEffect(() => {
    const defaultEffort = getDefaultReasoningEffort(selectedModel)
    const supportedValues = getSupportedReasoningEfforts(selectedModel)
    
    setReasoningEffort((currentEffort) => {
      // If current effort is valid for the new model, keep it
      if (currentEffort && supportedValues.includes(currentEffort)) {
        return currentEffort
      }
      // Otherwise use the default for the new model
      return defaultEffort
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel])
  
  const [questions, setQuestions] = useState(() =>
    bot.questions
      ? bot.questions.length >= 4
        ? bot.questions.slice(0, 4)
        : bot.questions.slice(0, 2)
      : [],
  )
  const lastRandomizedBotIdRef = useRef(null)
  useEffect(() => {
    if (!bot?.questions || bot.questions.length < 4 || lastRandomizedBotIdRef.current === bot?.id) return
    lastRandomizedBotIdRef.current = bot?.id
    const id = setTimeout(() => setQuestions(grabQuestions(bot)), 100)
    return () => clearTimeout(id)
  }, [bot?.id])
  const [isCopied, setIsCopied] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const [hideSources, setHideSources] = useState(
    () => bot?.hideSources || false,
  )
  const [selectedImages, setSelectedImages] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const fileInputRef = useRef(null)
  const [user] = useAuthState(auth)
  const textareaRef = useRef(null)
  const posthog = usePostHog()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [pendingUpgrade, setPendingUpgrade] = useState(false)
  const [agentEvents, setAgentEvents] = useState([]) // Track tool calls and reasoning in order
  const agentEventsRef = useRef([]) // Ref to track agent events for closure access
  const abortControllerRef = useRef(null)
  const currentAnswerRef = useRef('')
  const messagesEndRef  = useRef(null)
  const messagesScrollRef = useRef(null)
  const shouldAutoScrollRef = useRef(true)
  
  const updateShouldAutoScroll = useCallback(() => {
    const el = messagesScrollRef.current
    if (!el) return
  
    const isAtBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - 40

    // HARD STOP auto-scroll if user is not at bottom
    shouldAutoScrollRef.current = isAtBottom
  }, [])


  useEffect(() => {
    if (!shouldAutoScrollRef.current) return
  
    const el = messagesScrollRef.current
    if (!el) return
  
    // Use requestAnimationFrame to avoid layout thrash during streaming
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        block: 'end',
        behavior: 'auto', // no smooth during streaming
      })
    })
  }, [answers.length, agentEvents.length, currentAnswer])

  const handleStop = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    // Preserve any streamed content so we don't leave an empty placeholder row
    const partial = currentAnswerRef.current || ''
    const partialEvents = agentEventsRef.current.filter(
      (evt) => evt.type !== 'reasoning' || (evt.text && evt.text.trim()),
    )
    setAnswers((prev) => {
      const next = [...prev]
      if (next.length === 0) return next
      const last = next[next.length - 1]
      if (last.type !== 'answer') return next

      if (partial && partial.trim()) {
        next[next.length - 1] = {
          ...last,
          markdown: partial,
          agentEvents: partialEvents.length > 0 ? partialEvents : last.agentEvents,
        }
      } else {
        // If the user stopped immediately, remove the empty placeholder answer
        next.pop()
      }
      return next
    })
    setAgentEvents([])
    agentEventsRef.current = []
    setLoading(false)
  }

  const validModels = [
    {
      id: 'gpt-5.4',
      name: 'GPT-5.4',
      description:
        'Newest frontier model with long-context work, stronger tool use, and adaptive reasoning - requires verification',
    },
    {
      id: 'gpt-5.4-mini',
      name: 'GPT-5.4 mini',
      description:
        'Latest efficient model - fast, great coding & tool use',
    },
    {
      id: 'gpt-5.4-nano',
      name: 'GPT-5.4 nano',
      description: 'Fast & cost-effective GPT-5.4 option',
    },
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      description:
        'Previous flagship model with long-context work, stronger tool use, and adaptive reasoning - requires verification',
    },
    {
      id: 'gpt-5.1',
      name: 'GPT-5.1',
      description:
        'Model with the great instruction following and faster responses - requires verification',
    },
    {
      id: 'gpt-5',
      name: 'GPT-5',
      description:
        'Powerful general-purpose model - requires verification',
    },
    {
      id: 'gpt-5-mini',
      name: 'GPT-5 mini',
      description: 'Compact & smart version of GPT-5',
    },
    {
      id: 'gpt-5-nano',
      name: 'GPT-5 nano',
      description: 'Fastest version of GPT-5',
    },
    { id: 'o3', name: 'o3', description: 'Uses advanced reasoning - requires verification' },
    {
      id: 'o4-mini',
      name: 'o4-mini',
      description: 'Fastest at advanced reasoning - requires verification',
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description:
        'Previous generation model for better instruction following',
    },
    {
      id: 'gpt-4.1-mini',
      name: 'GPT-4.1 mini',
      description: 'Compact version of GPT-4.1',
    },
    {
      id: 'gpt-4.1-nano',
      name: 'GPT-4.1 nano',
      description: 'Fastest version of GPT-4.1',
    },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Previous generation model' },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      description: 'Previous generation fast model',
    },
  ]

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid, bot))
  }, [team, user, bot])

  useEffect(() => {
    setWebSearch(getDefaultWebSearchEnabled(bot))
  }, [bot, getDefaultWebSearchEnabled])


  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [selectedImages.length, formKey, resizeTextarea])

  const clearDraftQuestion = useCallback(() => {
    questionRef.current = ''
    setFormKey((k) => k + 1)
  }, [])

  // make api call to ask question
  const askQuestion = async (askedQuestion) => {
    shouldAutoScrollRef.current = true
    if (!askedQuestion || askedQuestion.length < 2) {
      setErrorText('Please enter a full question.')
      return
    }
    if (!bot.agentPrompt || !String(bot.agentPrompt).trim()) {
      setErrorText('Set your agent prompt in Custom Instructions to enable chat.')
      return
    }

    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const ctrl = new AbortController()
    abortControllerRef.current = ctrl

    setLoading(true)
    setErrorText(null)
    setCurrentAnswer('')
    currentAnswerRef.current = ''
    setShowQuestion(false)
    setAnswers((prev) => {
      //add new question with images
      return [
        ...prev,
        {
          type: 'question',
          question: askedQuestion,
          images: selectedImages.map((img) => img.url),
        },
      ]
    })
    // Clear selected images after adding to message
    setSelectedImages([])
    setImageUrls([])
    // Clear agent events for new question
    setAgentEvents([])
    agentEventsRef.current = []

    //get apiBase from env
    const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/chat-agent`
    const headers = {
      'Content-Type': 'application/json',
    }

    //add token to request
    headers['Authorization'] = 'Bearer ' + bot.signature

    //get name and email
    const metadata = {}
    let testing = false
    if (user) {
      metadata.name = user.displayName
      metadata.email = user.email
      testing = true
    }
    const body = {
      conversationId,
      question: askedQuestion,
      testing,
      metadata,
      full_source: true,
      stream: true,
      document_retriever: true,
      web_search: canUseWebSearch && webSearch,
      human_escalation: false,
      followup_rating: false,
      image_urls: imageUrls,
      default_language: navigator.language,
    }
    if (isContextBoost) {
      body.context_items = 16
    } else {
      body.context_items = 6
      body.autocut = 2
    }

    //only send model if they can
    if (team?.supportsGPT4 && team?.openAIKey && checkPlanPermission(team, 'hobby').allowed) {
      body.model = selectedModel
      // Add reasoning_effort if model supports it
      if (isReasoningModel(selectedModel) && reasoningEffort) {
        body.reasoning_effort = reasoningEffort
        
        // If reasoning is enabled above the minimum, increase search_limit to 4
        const defaultEffort = getDefaultReasoningEffort(selectedModel)
        const supportedValues = getSupportedReasoningEfforts(selectedModel)
        const defaultIndex = supportedValues.indexOf(defaultEffort)
        const currentIndex = supportedValues.indexOf(reasoningEffort)
        
        // If current reasoning effort is higher than default (lower index = higher effort)
        if (currentIndex !== -1 && defaultIndex !== -1 && currentIndex < defaultIndex) {
          body.search_limit = 4
        }
      }
    }
    
    class FatalError extends Error {}
    class RetriableError extends Error {}

    // Track retry attempts - start at 0 so we get a total of 3 attempts (initial + 2 retries)
    let retryCount = 0
    const MAX_RETRIES = 2
    let hasReceivedEvents = false

    try {
      await fetchEventSource(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal,
        async onopen(response) {
          console.log(
            'SSE Response:',
            response.status,
            response.headers.get('content-type'),
          )

          if (response.ok) {
            // 200-299 responses are good, regardless of content type
            // Create initial answer object if it doesn't exist
            setAnswers((prev) => {
              if (prev.length === 0 || prev[prev.length - 1].type !== 'answer') {
                return [...prev, { type: 'answer', markdown: '', rating: 0 }]
              }
              return prev
            })
            return
          } else if (response.status >= 400 && response.status < 500) {
            // Try to extract error message from response body
            let errorMessage = `HTTP error ${response.status}`
            try {
              const responseBody = await response.text()
              const parsedBody = JSON.parse(responseBody)
              if (parsedBody && parsedBody.error) {
                errorMessage = parsedBody.error
              }
            } catch (e) {
              console.error('Failed to parse error response:', e)
            }
            throw new FatalError(errorMessage)
          } else {
            // Server errors should be retried
            throw new RetriableError(`HTTP error ${response.status}`)
          }
        },
        onmessage(msg) {
          hasReceivedEvents = true

          if (msg.event === 'stream') {
            //append to answer
            setCurrentAnswer((prev) => {
              // Handle empty data fields as line breaks to preserve formatting
              if (msg.data === '') {
                const next = prev + '\n'
                currentAnswerRef.current = next
                return next
              } else {
                const next = prev + msg.data
                currentAnswerRef.current = next
                return next
              }
            })
          } else if (msg.event === 'tool_call') {
            // Handle tool call events
            try {
              const toolCallData = JSON.parse(msg.data)
              const newEvent = {
                id: uuidv4(),
                type: 'tool_call',
                name: toolCallData.name,
                params: toolCallData.params,
                tool_type: toolCallData.tool_type,
                mcp_server: toolCallData.mcp_server,
                mcp_tool: toolCallData.mcp_tool,
                tool_name: toolCallData.tool_name,
                server_label: toolCallData.server_label,
                timestamp: Date.now(),
              }
              setAgentEvents((prev) => {
                const updated = [...prev, newEvent]
                agentEventsRef.current = updated
                return updated
              })
            } catch (error) {
              console.error('Error parsing tool_call data:', error)
            }
          } else if (msg.event === 'reasoning') {
            // Handle reasoning summary events
            try {
              const reasoningData = JSON.parse(msg.data)
              const newEvent = {
                eventKey: uuidv4(),
                reasoningId: reasoningData.id || null,
                type: 'reasoning',
                text: reasoningData.text || '',
                timestamp: Date.now(),
              }
              setAgentEvents((prev) => {
                const updated = upsertReasoningEvent(prev, newEvent)
                agentEventsRef.current = updated
                return updated
              })
            } catch (error) {
              console.error('Error parsing reasoning data:', error)
            }
          } else if (msg.event === 'error') {
            setLoading(false)
            setErrorText(msg.data)
            setAgentEvents([])
            agentEventsRef.current = []
            //strip all empty answers (always run - don't check stale closure value)
            setAnswers((prev) => {
              return prev.filter((a) => a.type !== 'answer' || a.markdown)
            })
            throw new FatalError(msg.data)
          } else {
            try {
              // Handle case where msg.data is empty or invalid JSON
              if (!msg.data || !msg.event) {
                console.warn(
                  'Received empty message - connection may have dropped',
                )
                return false
              }

              let endData
              try {
                endData = JSON.parse(msg.data)
              } catch (jsonError) {
                console.error(
                  'JSON parse error:',
                  jsonError,
                  'Raw data:',
                  msg.data,
                )
                setErrorText('Incomplete response received. Please try again.')
                setLoading(false)
                //strip all empty answers
                setAnswers((prev) => {
                  return prev.filter((a) => a.type !== 'answer' || a.markdown)
                })
                return false
              }

              console.log(endData)

              // Check if history exists before setting it
              if (endData.history) {
                setChatHistory(endData.history)
              }

              if (msg.event === 'is_resolved_question') {
                // Filter out empty reasoning events when saving
                const currentEvents = agentEventsRef.current.filter(
                  e => e.type !== 'reasoning' || (e.text && e.text.trim())
                )
                setAnswers((prev) => {
                  //add new answer with agent events
                  return [
                    ...prev,
                    {
                      type: 'answer',
                      markdown: endData.answer,
                      rating: 0,
                      id: endData.id,
                      options: endData.options,
                      agentEvents: currentEvents,
                    },
                  ]
                })
                setCurrentAnswer(endData.answer)
                currentAnswerRef.current = endData.answer || ''
                // Clear agent events for next question
                setAgentEvents([])
                agentEventsRef.current = []
              } else {
                if (endData.answer) {
                  setCurrentAnswer(endData.answer)
                  currentAnswerRef.current = endData.answer || ''
                }

                // Filter out empty reasoning events when saving
                const currentEvents = agentEventsRef.current.filter(
                  e => e.type !== 'reasoning' || (e.text && e.text.trim())
                )
                setAnswers((prev) => {
                  const newPrev = [...prev]
                  if (newPrev.length > 0) {
                    newPrev[newPrev.length - 1] = {
                      ...newPrev[newPrev.length - 1],
                      sources: endData.sources,
                      id: endData.id,
                      options:
                        endData.options || newPrev[newPrev.length - 1].options,
                      markdown: endData.answer,
                      agentEvents: currentEvents.length > 0 ? currentEvents : (newPrev[newPrev.length - 1].agentEvents || []),
                    }
                  }
                  return newPrev
                })
                // Clear agent events when answer is complete
                setAgentEvents([])
                agentEventsRef.current = []
              }

              setLoading(false)
              return true
            } catch (error) {
              console.error(
                'Error processing message:',
                error,
                'Message data:',
                msg.data,
              )
              setErrorText('Error processing response. Please try again.')
              setLoading(false)
              //strip all empty answers
              setAnswers((prev) => {
                return prev.filter((a) => a.type !== 'answer' || a.markdown)
              })
              return false
            }
          }
        },
        onerror(err) {
          console.log('Error in SSE:', err)

          if (err instanceof FatalError) {
            // For fatal errors (4xx), don't retry and show error
            setErrorText(
              err.message ||
                'There was an error with your request. Please try again.',
            )
            setLoading(false)
            //strip all empty answers
            setAnswers((prev) => {
              return prev.filter((a) => a.type !== 'answer' || a.markdown)
            })
            throw err // Re-throw to stop the operation
          } else if (err instanceof RetriableError && !hasReceivedEvents) {
            // Only retry if we haven't received any events yet
            retryCount++

            if (retryCount > MAX_RETRIES) {
              // Too many retries, give up
              setErrorText(
                'Failed to connect after several attempts. Please try again later.',
              )
              setLoading(false)
              //strip all empty answers
              setAnswers((prev) => {
                return prev.filter((a) => a.type !== 'answer' || a.markdown)
              })
              throw new FatalError('Max retries exceeded')
            }

            console.log(
              `Retrying connection... Attempt ${retryCount}/${MAX_RETRIES}`,
            )

            // Return delay with exponential backoff (in ms)
            return Math.min(1000 * 2 ** retryCount, 10000)
          } else if (!hasReceivedEvents) {
            // Only retry network-level errors if we haven't received any events
            retryCount++

            if (retryCount > MAX_RETRIES) {
              setErrorText(
                'Unable to connect to the server. Please check your connection and try again.',
              )
              setLoading(false)
              //strip all empty answers
              setAnswers((prev) => {
                return prev.filter((a) => a.type !== 'answer' || a.markdown)
              })
              throw new FatalError('Network connection failed')
            }

            console.log(
              `Network error, retrying... Attempt ${retryCount}/${MAX_RETRIES}`,
            )
            return Math.min(1000 * 2 ** retryCount, 10000)
          } else {
            // If we've received events, just show an error without retrying
            setErrorText('Connection lost. Please try again.')
            setLoading(false)
            throw err
          }
        },
      })
    } catch (error) {
      if (error.name === 'AbortError') {
        if (abortControllerRef.current !== ctrl) {
          return
        }
        setLoading(false)
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
        }
        return
      }
      console.error('Failed to fetch answer:', error)
      setErrorText(
        error instanceof Error
          ? error.message
          : 'Unknown error. Please try again later.',
      )
      setLoading(false)
      //strip all empty answers
      setAnswers((prev) => {
        return prev.filter((a) => a.type !== 'answer' || a.markdown)
      })
    }

    if (abortControllerRef.current === ctrl) {
      abortControllerRef.current = null
    }

    if (testing) {
      posthog?.capture('Bot Tested', { 'Bot name': bot.name })
      if (window.bento !== undefined) {
        window.bento.track('botTested', { botName: bot.name })
      }
    }
  }

  // make api call to rate
  const setRating = async (answerId, newRating = 0) => {
    if (!answerId) {
      return
    }

    setErrorText(null)
    setRatings((prev) => {
      prev[answerId] = newRating
      return { ...prev }
    })

    const data = { rating: newRating }

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    if (bot.privacy === 'private') {
      //add token to request
      headers['Authorization'] = 'Bearer ' + bot.signature
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/rate/${answerId}`
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const data = await response.json()
        //if trimmed answer is empty, show error
        if (data.error) {
          setErrorText(data.error)
          setRatings((prev) => {
            prev[answerId] = 0
            return { ...prev }
          })
        }
      } else {
        try {
          const data = await response.json()
          setErrorText(data.error || 'Something went wrong, please try again.')
        } catch (e) {
          setErrorText('Something went wrong, please try again.')
        }
        setLoading(false)
        setRatings((prev) => {
          prev[answerId] = 0
          return { ...prev }
        })
      }
    } catch (e) {
      console.warn(e)
      setErrorText('Something went wrong, please try again.')
      setLoading(false)
      setRatings((prev) => {
        prev[answerId] = 0
        return { ...prev }
      })
    }
  }

  const handleCopyText = (htmlText, id) => {
    navigator.clipboard.writeText(htmlText)
    setCopiedId(id)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
      setCopiedId('')
    }, 1500)
  }

  // Agent chat requires a non-empty agent prompt (Custom Instructions)
  const missingAgentPrompt = !bot.agentPrompt || !String(bot.agentPrompt).trim()

  const FullSource = () => {
    if (!currentSource) return null

    const page = currentSource?.page ? ` - Page ${currentSource?.page}` : ''
    const SourceIcon = currentSource?.url ? LinkIcon : DocumentTextIcon
    const sourceFavicon = sourceFaviconUrl(currentSource)

    return (
      <Transition.Root show={!!currentSource} as={Fragment}>
        <Dialog as="div" className="relative z-modal" onClose={setCurrentSource}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setCurrentSource(null)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-1 text-center sm:mt-2">
                      <Dialog.Title
                        as="h3"
                        className="flex items-center justify-start text-xl font-semibold leading-6 text-gray-900"
                      >
                        {sourceFavicon ? (
                          <img
                            src={sourceFavicon}
                            alt=""
                            width={16}
                            height={16}
                            className="mr-1.5 h-4 w-4 flex-shrink-0 rounded-sm"
                          />
                        ) : (
                          <SourceIcon
                            className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-800"
                            aria-hidden="true"
                          />
                        )}
                        {currentSource.url ? (
                          <Link
                            href={currentSource.url}
                            target="_blank"
                            className="flex items-center space-x-2 hover:underline focus:outline-none"
                          >
                            <p className="text-left">
                              {currentSource.title}
                              {page}
                            </p>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-gray-800" />
                          </Link>
                        ) : (
                          <p className="text-left">
                            {currentSource.title || currentSource.url}
                            {page}
                          </p>
                        )}
                      </Dialog.Title>
                      <div className="mt-4 min-w-full text-left">
                        <Streamdown
                          mode="static"
                          isAnimating={false}
                          remarkPlugins={streamdownRemarkPlugins}
                          showMermaidActions={true}
                        >
                          {preprocessMath(currentSource?.content)}
                        </Streamdown>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  const SourceResearch = ({ source }) => {
    const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
    const sourceFavicon = sourceFaviconUrl(source)
    const page = source.page ? ` - Page ${source.page}` : ''

    if (source.used === false && !isContextBoost) return null

    return (
      <li className="my-1 flex cursor-pointer items-center">
        <button
          onClick={() => setCurrentSource(source)}
          className="flex items-center text-left text-sm font-medium leading-tight text-gray-500"
        >
          {sourceFavicon ? (
            <img
              src={sourceFavicon}
              alt=""
              width={16}
              height={16}
              className="mr-1.5 h-4 w-4 flex-shrink-0 rounded-sm"
            />
          ) : (
            <SourceIcon
              className={clsx(
                'mr-1.5 h-4 w-4 flex-shrink-0',
                source.used === true ? 'text-gray-600' : 'text-gray-400',
              )}
              aria-hidden="true"
            />
          )}
          {source.title || source.url}
          {page}
        </button>
      </li>
    )
  }

  const Source = ({ source }) => {
    const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
    const sourceFavicon = sourceFaviconUrl(source)
    const page = source.page ? ` - Page ${source.page}` : ''

    if (source.used === false && !isContextBoost) return null

    return (
      <li className="my-1 flex cursor-pointer items-center">
        {sourceFavicon ? (
          <img
            src={sourceFavicon}
            alt=""
            width={16}
            height={16}
            className="mr-1.5 h-4 w-4 flex-shrink-0 rounded-sm"
          />
        ) : (
          <SourceIcon
            className={clsx(
              'mr-1.5 h-4 w-4 flex-shrink-0',
              source.used === true ? 'text-gray-600' : 'text-gray-400',
            )}
            aria-hidden="true"
          />
        )}
        {source.url ? (
          <Link
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-left text-sm font-medium text-cyan-600 hover:text-cyan-800 hover:underline focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
          >
            {source.title}
            {page}
          </Link>
        ) : (
          <span className="text-left text-sm text-gray-600">
            {source.title || source.url}
            {page}
          </span>
        )}
      </li>
    )
  }

  // ChatRow is now defined outside of Chat for proper memoization

  const ModelSelector = ({ align = 'left' }) => {
    const isDisabled =
      !team?.supportsGPT4 ||
      !team?.openAIKey ||
      !checkPlanPermission(team, 'hobby').allowed
    const tooltipContent = isDisabled
      ? !team?.openAIKey
        ? 'OpenAI API key required to change models. Configure on the API page.'
        : !team?.supportsGPT4
          ? 'GPT-4 access required. Please upgrade your plan or add an OpenAI API key with credit.'
          : !checkPlanPermission(team, 'hobby').allowed
            ? 'Upgrade to Personal plan to change models.'
            : 'Change model'
      : 'Change model'

    return (
      <Listbox value={selectedModel} onChange={setSelectedModel} disabled={isDisabled}>
        <div className="relative">
          <div className="inline-block">
            <Tooltip content={tooltipContent} placement="top">
              <div>
                <Listbox.Button
                  className={clsx(
                    'flex cursor-pointer items-center p-2 text-xs',
                    isDisabled
                      ? 'cursor-not-allowed text-gray-400 opacity-50'
                      : 'text-gray-600 hover:text-cyan-600',
                  )}
                  onClick={() => {
                    if (isDisabled && !checkPlanPermission(team, 'hobby').allowed) {
                      setPendingUpgrade(true)
                    }
                  }}
                >
                  <CubeIcon className="mr-1 h-5 w-5" aria-hidden="true" />
                  {validModels
                    .find((m) => m.id === selectedModel)
                    ?.name.replace('GPT-', '') ||
                    selectedModel.replace('GPT-', '')}
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
            <Listbox.Options className={clsx(
              "absolute bottom-full z-10 mb-2 max-h-72 w-72 divide-y divide-gray-200 overflow-hidden overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
              align === 'left' ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'
            )}>
              {validModels.map((model) => (
                <Listbox.Option
                  key={model.id}
                  value={model.id}
                  className={({ active }) =>
                    clsx(
                      'group cursor-default select-none p-2 text-sm',
                      active ? 'bg-cyan-600 text-white' : 'text-gray-900',
                      isDisabled && 'cursor-not-allowed opacity-50',
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

  const ReasoningSelector = ({ align = 'left' }) => {
    // Only show if model supports reasoning
    if (!isReasoningModel(selectedModel) || !reasoningEffort) {
      return null
    }

    // Get supported values for the current model
    const supportedValues = getSupportedReasoningEfforts(selectedModel)
    
    // Map of all possible reasoning effort options
    const allReasoningOptions = {
      none: { value: 'none', label: 'None', description: 'Least reasoning (5.1+ default)' },
      minimal: { value: 'minimal', label: 'Minimal', description: 'Minimal reasoning (GPT-5 default)' },
      low: { value: 'low', label: 'Low', description: 'Light reasoning (O-series default)' },
      medium: { value: 'medium', label: 'Medium', description: 'Balanced reasoning' },
      high: { value: 'high', label: 'High', description: 'Maximum reasoning depth' },
      xhigh: { value: 'xhigh', label: 'xHigh', description: 'Extra-high reasoning depth (GPT-5.4 only)' },
    }
    
    // Filter options to only show supported values for this model
    const reasoningOptions = supportedValues.map(value => allReasoningOptions[value])

    const isDisabled =
      !team?.supportsGPT4 ||
      !team?.openAIKey ||
      !checkPlanPermission(team, 'hobby').allowed

    return (
      <Listbox value={reasoningEffort} onChange={setReasoningEffort} disabled={isDisabled}>
        <div className="relative">
          <div className="inline-block">
            <Tooltip content="Reasoning effort" placement="top">
              <div>
                <Listbox.Button
                  className={clsx(
                    'flex cursor-pointer items-center p-2 text-xs',
                    isDisabled
                      ? 'cursor-not-allowed text-gray-400 opacity-50'
                      : 'text-gray-600 hover:text-cyan-600',
                  )}
                  onClick={() => {
                    if (isDisabled && !checkPlanPermission(team, 'hobby').allowed) {
                      setPendingUpgrade(true)
                    }
                  }}
                >
                  <SparklesIcon className="mr-1 h-5 w-5" aria-hidden="true" />
                  {reasoningOptions.find((opt) => opt.value === reasoningEffort)?.label || reasoningEffort}
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
            <Listbox.Options className={clsx(
              "absolute bottom-full z-10 mb-2 max-h-72 w-72 divide-y divide-gray-200 overflow-hidden overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
              align === 'left' ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'
            )}>
              {reasoningOptions.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    clsx(
                      'group cursor-default select-none p-2 text-sm',
                      active ? 'bg-cyan-600 text-white' : 'text-gray-900',
                      isDisabled && 'cursor-not-allowed opacity-50',
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
                          {option.label}
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
                        {option.description}
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

  const handleImageSelect = (e) => {
    if (!checkPlanPermission(team, 'personal').allowed) {
      setPendingUpgrade(true)
      return
    }

    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (selectedImages.length + files.length > 4) {
      setErrorText('Maximum 4 images allowed')
      return
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorText('Please select only image files')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width
          let height = img.height
          const maxSize = 1200

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          // Create canvas and resize image
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to base64
          const base64 = canvas.toDataURL('image/jpeg', 0.8)
          setSelectedImages((prev) => [...prev, { url: base64, file }])
          setImageUrls((prev) => [...prev, base64])
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  useEffect(() => {
    if (pendingUpgrade) {
      setShowUpgrade(true)
      setPendingUpgrade(false)
    }
  }, [pendingUpgrade])

  const messages = useMemo(() => {
    const msgs = []
    answers.forEach((ans, idx) => {
      if (ans.type === 'question') {
        msgs.push({
          id: `q-${idx}`,
          role: 'user',
          content: ans.question,
          images: ans.images || [],
        })
      } else {
        const isLast = idx === answers.length - 1
        const content =
          isLast && loading && !ans.markdown ? currentAnswer : ans.markdown

        msgs.push({
          id: ans.id || `a-${idx}`,
          role: 'assistant',
          content: content,
          sources: ans.sources || [],
          answerId: ans.id,
          toolCalls: ans.agentEvents?.filter(e => e.type === 'tool_call') || [],
        })
      }
    })
    return msgs
  }, [answers, currentAnswer, loading])

  const standardMessagesUI = useMemo(() => {
    // Render all completed messages (everything except the last one if it's streaming)
    const completedMessages = answers.slice(0, 
      loading && answers.length > 0 && answers[answers.length - 1].type === 'answer' 
        ? answers.length - 1 
        : answers.length
    )
    let latestCompletedEventsIndex = -1
    completedMessages.forEach((answer, index) => {
      if (answer.type === 'answer' && answer.agentEvents && answer.agentEvents.length > 0) {
        latestCompletedEventsIndex = index
      }
    })
    const result = []
    completedMessages.forEach((answer, index) => {
      // Render agent events (reasoning and tool calls) in order before answer
      if (answer.type === 'answer' && answer.agentEvents && answer.agentEvents.length > 0) {
        result.push(
          <AgentEventsList
            key={`agent-events-${answer.id || index}`}
            events={answer.agentEvents}
            defaultOpen={!loading && index === latestCompletedEventsIndex}
            labels={bot.labels}
          />
        )
      }
      // Render the message (question or answer)
      result.push(
        <ChatRow
          key={answer.id || `${answer.type}-${index}`}
          answer={answer}
          question={answers[index - 1]?.question}
          currentAnswerText={undefined}
          isStreaming={false}
          team={team}
          bot={bot}
          isContextBoost={isContextBoost}
          hideSources={hideSources}
          canModify={canModify}
          isCopied={isCopied}
          copiedId={copiedId}
          ratings={ratings}
          handleCopyText={handleCopyText}
          setRating={setRating}
          askQuestion={askQuestion}
          Source={Source}
          SourceResearch={SourceResearch}
        />
      )
    })
    return result
  // Note: Including UI state props so completed messages update on state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, loading, isCopied, copiedId, ratings, isContextBoost])

  return (
    <div
      className={clsx(
        'relative flex flex-1 flex-col items-center gap-4',
        {
          ['h-full']: missingAgentPrompt,
          ['min-h-[100vh] md:min-h-[540px] md:h-full']: !missingAgentPrompt,
        },
      )}
    >
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />

      <Widget
        size="md"
        className={clsx(
          'flex-1 w-full max-w-5xl',
          {
            ['']: missingAgentPrompt,
            ['min-h-[100vh] md:min-h-[540px] md:h-full']: !missingAgentPrompt,
          }
        )}
      >
        <Widget.Header
          {...(bot.logo ? { logo: bot.logo } : {})}
          title={bot.name}
          subtitle={bot.description}
        />

        <Widget.Body
          emptyLabel={missingAgentPrompt ? 'Chat is disabled until you set an agent prompt.' : null}
          emptyLink={`/app/bots/${bot.id}/configure/instructions`}
        >
          <FullSource />

          <div
            ref={messagesScrollRef}
            onScroll={updateShouldAutoScroll}
            className="flex-1"
          >
            <div className="px-10">
              {standardMessagesUI}
              {/* Render agent events (reasoning and tool calls) while loading, in order */}
              {loading && agentEvents.length > 0 && (
                <AgentEventsList
                  key={`streaming-agent-events-${answers[answers.length - 1]?.id || 'current'}`}
                  events={agentEvents}
                  defaultOpen={true}
                  labels={bot.labels}
                  isStreaming={true}
                  isAnswerStreaming={currentAnswer.length > 0}
                />
              )}
              {/* Render streaming message separately so only it updates */}
              {loading && answers.length > 0 && answers[answers.length - 1].type === 'answer' && (
                <ChatRow
                  key="streaming-answer"
                  answer={answers[answers.length - 1]}
                  question={answers[answers.length - 2]?.question}
                  currentAnswerText={currentAnswer}
                  isStreaming={true}
                  team={team}
                  bot={bot}
                  isContextBoost={isContextBoost}
                  hideSources={hideSources}
                  canModify={canModify}
                  isCopied={isCopied}
                  copiedId={copiedId}
                  ratings={ratings}
                  handleCopyText={handleCopyText}
                  setRating={setRating}
                  askQuestion={askQuestion}
                  Source={Source}
                  SourceResearch={SourceResearch}
                />
              )}

              <Alert title={errorText} type="warning" />
            </div>

            {showQuestion && !missingAgentPrompt && (
              <div className="mx-auto mt-2 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                {questions &&
                  questions.length > 0 &&
                  questions.map((recommendedQuestion) => (
                    <button
                      type="button"
                      className="flex w-full items-center rounded-lg border border-gray-300 p-3 text-cyan-700 hover:bg-white hover:text-cyan-800 focus:ring-cyan-600 focus:ring-offset-cyan-50"
                      onClick={() => {
                        clearDraftQuestion()
                        askQuestion(recommendedQuestion)
                      }}
                      key={recommendedQuestion}
                    >
                      <LightBulbIcon
                        className="mr-1 h-4 w-4 text-cyan-700"
                        aria-hidden="true"
                      />
                      <p className="text-left text-xs">{recommendedQuestion}</p>
                    </button>
                  ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Widget.Body>

        {!missingAgentPrompt && (
        <Widget.Footer isDemo={false} branding={false}>
          <form
            className="mt-2 flex flex-col justify-center"
            translate="no"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading) {
                const value = questionRef.current || textareaRef.current?.value || ''
                if (value.trim().length >= 2) {
                  setErrorText(null)
                  clearDraftQuestion()
                  askQuestion(value.trim())
                } else {
                  setErrorText('Please enter a full question.')
                }
              }
            }}
            disabled={loading}
          >
            <div className="mb-1 mt-1 w-full rounded-xl sm:flex sm:shadow-sm">
              <div className="relative flex w-full flex-grow items-stretch shadow-sm sm:shadow-inherit">
                <div className="absolute bottom-0 left-0 z-10 flex items-center gap-0 pl-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Tooltip
                    content={
                      checkPlanPermission(team, 'personal').allowed
                        ? 'Add an image'
                        : 'Upgrade to the Personal plan to enable image uploads'
                    }
                  >
                    <button
                      type="button"
                      className={clsx(
                        'cursor-pointer rounded-md p-2 text-gray-600 hover:text-cyan-600',
                        selectedImages.length >= 4 &&
                          'cursor-not-allowed opacity-50',
                        !checkPlanPermission(team, 'personal').allowed &&
                          'opacity-50',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        setErrorText(null)
                        if (!checkPlanPermission(team, 'personal').allowed) {
                          setPendingUpgrade(true)
                          return
                        }
                        if (selectedImages.length < 4) {
                          fileInputRef.current?.click()
                        }
                      }}
                    >
                      <PhotoIcon className="h-5 w-5" />
                    </button>
                  </Tooltip>
                  {showResearchMode && (
                    <Tooltip
                      content={
                        !webSearchModelCompatible
                          ? `Web search requires ${WEB_SEARCH_COMPATIBLE_MODELS_LABEL}. Current model: ${formatWebSearchModelLabel(activeWebSearchModel)}.`
                          : !team?.openAIKey
                          ? 'OpenAI API key required to enable web search. Configure on the API page.'
                          : !checkPlanPermission(team, 'standard').allowed
                            ? 'Upgrade to Standard plan to enable web search.'
                            : 'Web Search'
                      }
                    >
                      <button
                        type="button"
                        className={clsx(
                          'rounded-md p-2 hover:text-cyan-600',
                          webSearch
                            ? 'font-bold text-cyan-600'
                            : 'text-gray-600',
                          !canUseWebSearch && !webSearch && 'cursor-not-allowed opacity-50',
                        )}
                        onClick={() => {
                          if (!canUseWebSearch && !webSearch) {
                            if (!checkPlanPermission(team, 'standard').allowed) {
                              setPendingUpgrade(true)
                            }
                            return
                          }
                          setErrorText(null)
                          setWebSearch((prev) => !prev)
                        }}
                      >
                        {webSearch ? (
                          <GlobeAltIconSolid className="h-5 w-5" />
                        ) : (
                          <GlobeAltIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                  )}
                  {showResearchMode && (
                    <Tooltip
                      content={
                        checkPlanPermission(team, 'hobby').allowed
                          ? 'Enable context boost'
                          : 'Upgrade to the Personal plan to enable context boost'
                      }
                    >
                      <button
                        type="button"
                        className={clsx(
                          'rounded-md p-2 hover:text-cyan-600',
                          isContextBoost
                            ? 'font-bold text-cyan-600'
                            : 'text-gray-600',
                          !checkPlanPermission(team, 'hobby').allowed &&
                            'opacity-50',
                        )}
                        onClick={() => {
                          if (!checkPlanPermission(team, 'hobby').allowed) {
                            setPendingUpgrade(true)
                            return
                          }
                          setIsContextBoost((prev) => !prev)
                        }}
                      >
                        {isContextBoost ? (
                          <RectangleStackIconSolid className="h-5 w-5" />
                        ) : (
                          <RectangleStackIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                  )}
                  <ModelSelector />
                  <ReasoningSelector />
                </div>
                {selectedImages.length > 0 && (
                  <div className="absolute left-0 right-0 top-0 flex flex-wrap gap-2 p-3 pb-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={`Selected ${index + 1}`}
                          className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -right-1 -top-1 rounded-full bg-gray-500 p-1 text-white hover:bg-gray-600"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  key={formKey}
                  ref={textareaRef}
                  name="query"
                  id="query"
                  defaultValue={questionRef.current}
                  maxLength={2000}
                  minLength={2}
                  required
                  rows={1}
                  onChange={(e) => {
                    questionRef.current = e.target.value
                    resizeTextarea()
                  }}
                  onFocus={() => setErrorText(null)}
                  onKeyDown={(e) => {
                    //this detects if the user is typing in a IME session (ie Kanji autocomplete) to avoid premature submission
                    if (e.isComposing || e.keyCode === 229) {
                      return
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (e.shiftKey) {
                        const ta = textareaRef.current
                        if (ta) {
                          const start = ta.selectionStart
                          const end = ta.selectionEnd
                          const nextValue =
                            ta.value.slice(0, start) +
                            '\n' +
                            ta.value.slice(end)
                          questionRef.current = nextValue
                          ta.value = nextValue
                          requestAnimationFrame(() => {
                            ta.focus()
                            ta.selectionStart = ta.selectionEnd = start + 1
                            resizeTextarea()
                          })
                        }
                      } else if (!e.shiftKey && !loading) {
                        const value = questionRef.current || textareaRef.current?.value || ''
                        if (value.trim().length >= 2) {
                          setErrorText(null)
                          clearDraftQuestion()
                          askQuestion(value.trim())
                        } else {
                          setErrorText('Please enter a full question.')
                        }
                      }
                    }
                  }}
                  tabIndex={1}
                  autoComplete="off"
                  className={clsx(
                    'text-md block min-h-16 w-full resize-none rounded-xl border border-gray-300 px-2 pb-10 outline-none ring-0 focus:ring-0 focus:border-cyan-600 disabled:opacity-50 sm:px-4',
                    selectedImages.length > 0 ? 'pt-24' : 'pt-3',
                  )}
                  placeholder={bot.labels.inputPlaceholder}
                />

                <button
                  type={loading ? 'button' : 'submit'}
                  tabIndex={2}
                  onClick={(e) => {
                    if (loading) {
                      handleStop(e)
                    }
                  }}
                  className="absolute bottom-0 right-0 my-3 mr-4 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
                >
                  <span className="sr-only">{loading ? 'Stop generating' : bot.labels.inputPlaceholder}</span>
                  {loading ? (
                    <div className="group flex items-center justify-center cursor-pointer">
                      <div className="relative flex h-6 w-6 items-center justify-center">
                        <div className="absolute inset-0 rounded-full opacity-25"></div>
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-600"></div>
                        <StopIcon className="relative z-10 h-3 w-3 text-cyan-600 transition-transform duration-200 group-hover:scale-125" />
                      </div>
                    </div>
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </Widget.Footer>
        )}
      </Widget>

      {!missingAgentPrompt && (
      <div className="mb-8 flex items-start justify-between w-full max-w-5xl md:w-[80%]">
        {isContextBoost && showResearchMode ? (
          <p className="hidden max-w-prose text-left text-xs text-gray-500 sm:block">
            Note: Enabling Context Boost passes more source context in
            order to answer detailed questions at the expense of more
            token usage.
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-center text-xs text-gray-500">
          <span>Use Shift + Enter to skip to a new line.</span>
          {!showQuestion && (
            <button
              type="button"
              className="ml-1 flex items-center text-gray-600 hover:text-cyan-700 focus:outline-none focus:ring-1 focus:ring-offset-2"
              onClick={() => {
                setAnswers([])
                setShowQuestion(true)
                clearDraftQuestion()
                setErrorText(null)
                setConversationId(uuidv4())
                setAgentEvents([])
                agentEventsRef.current = []
              }}
            >
              <ArrowPathIcon
                className="mr-0.5 h-3 w-3"
                aria-hidden="true"
              />
              Reset
            </button>
          )}
        </div>
      </div>
      )}
      
    </div>
  )
}
