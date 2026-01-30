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
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  PaperAirplaneIcon,
  RectangleStackIcon as RectangleStackIconSolid,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import Alert from '@/components/Alert'
import RobotIcon from '@/components/RobotIcon'
import LoadingDots from './LoadingDots'
import { grabQuestions } from '@/utils/helpers'
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
          <div className="absolute -inset-7 flex h-28 w-12 items-center text-2xl font-extrabold tracking-tighter">
            <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-lg">
              <UserCircleIcon
                className="h-7 w-7 text-white"
                aria-hidden="true"
              />
            </span>
          </div>
          <div dir="auto" className="prose min-w-full p-4 px-6 text-start sm:px-8">
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
    return (
      <div
        className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-12')}
      >
        <div
          className={clsx(
            'relative col-span-1 mt-4 rounded-md border bg-white text-left shadow-sm sm:col-span-8 sm:rounded-lg',
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
            answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '',
            'min-w-full p-6 text-start sm:px-8',
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
                'flex items-end justify-between px-6 pb-4 pr-4 sm:justify-end sm:px-8 sm:pr-4',
              )}
            >
              {answer.sources?.length > 0 && answer.sources.filter(source => !(source.used === false && !isContextBoost)).length > 0 && !hideSources && (
                <div className="block text-left sm:hidden">
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
          <div className="col-span-4 mt-4 hidden overflow-y-scroll text-left sm:block">
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

// Component to display tool calls - simplified inline style
const ToolCallDisplay = memo(({ toolCalls, isStreamingStarted = true }) => {
  if (!toolCalls || toolCalls.length === 0) return null

  return (
    <div className="mb-2 flex flex-col text-left">
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
                <details key={toolCall.id || idx} className="group ms-6 text-sm text-gray-500">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                    {isStreamingStarted ? (
                      <DocumentMagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    ) : (
                      <div className="relative w-4 h-4 flex-shrink-0">
                        <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                        <div className="absolute left-0 top-0 h-4 w-4 animate-spin rounded-full border-t-2 border-gray-400"></div>
                      </div>
                    )}
                    <span className="font-medium">{isStreamingStarted ? 'Searched documentation:' : 'Searching documentation:'}</span>
                    <span className="group-open:hidden">{allTerms.length} {allTerms.length === 1 ? 'term' : 'terms'}</span>
                    <span className="hidden group-open:inline text-gray-400 text-xs">Hide terms</span>
                    <ChevronDownIcon className="h-3 w-3 text-gray-400 transition-transform duration-150 group-open:rotate-180 flex-shrink-0" />
                  </summary>
                  <ul className="mt-2 ms-6 space-y-1">
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
              <div key={toolCall.id || idx} className="flex items-center gap-2 text-sm text-gray-500 ms-6">
                {isStreamingStarted ? (
                  <DocumentMagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                ) : (
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                    <div className="absolute left-0 top-0 h-4 w-4 animate-spin rounded-full border-t-2 border-gray-400"></div>
                  </div>
                )}
                <span className="font-medium">{isStreamingStarted ? 'Searched documentation' : 'Searching documentation'}</span>
              </div>
            )
          } catch (error) {
            console.error('Error parsing tool_call data:', error)
            return (
              <div key={toolCall.id || idx} className="flex items-center gap-2 text-sm text-gray-500 ms-8">
                {isStreamingStarted ? (
                  <DocumentMagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                ) : (
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                    <div className="absolute left-0 top-0 h-4 w-4 animate-spin rounded-full border-t-2 border-gray-400"></div>
                  </div>
                )}
                <span className="font-medium">{isStreamingStarted ? 'Searched documentation' : 'Searching documentation'}</span>
              </div>
            )
          }
        } else if (name === 'human_escalation') {
          return (
            <div key={toolCall.id || idx} className="flex items-center gap-2 text-sm text-gray-500">
              <LifebuoyIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="font-medium">Escalating to human</span>
            </div>
          )
        }
        
        // Generic tool call
        return (
          <div key={toolCall.id || idx} className="flex items-center gap-2 text-sm text-gray-500">
            <BeakerIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="font-medium">Using {name}</span>
          </div>
        )
      })}
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.toolCalls === nextProps.toolCalls && prevProps.isStreamingStarted === nextProps.isStreamingStarted
})
ToolCallDisplay.displayName = 'ToolCallDisplay'

// Brain icon for reasoning display
const BrainIcon = ({ className }) => (
  <svg viewBox="18 58 115 98" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M129.49 114.51C129.121 116.961 128.187 119.293 126.762 121.322C125.337 123.351 123.461 125.021 121.28 126.2C120.676 126.535 120.043 126.816 119.39 127.04C120.22 138.04 102.74 142.04 93.32 139.42L96.82 151.66L87.82 151.98L72.07 129.43C66.76 130.93 60.49 131.65 56.44 125.15C56.0721 124.553 55.7382 123.935 55.44 123.3C54.4098 123.51 53.3614 123.617 52.31 123.62C49.31 123.62 44.31 122.72 41.77 120.96C39.7563 119.625 38.1588 117.75 37.16 115.55C31.75 116.29 27.16 115.02 24.16 111.88C20.36 107.97 19.28 101.51 21.26 94.58C23.87 85.33 31.81 74.91 47.59 71C48.9589 69.2982 50.5972 67.8322 52.44 66.66C62.35 60.31 78.44 59.76 90.65 65.79C95.3836 64.9082 100.27 65.376 104.75 67.14C113.53 70.43 119.91 77.31 121.11 84.3C123.487 85.5317 125.433 87.4568 126.69 89.82C129.32 94.76 129.69 99.71 127.92 103.71C129.587 107.049 130.138 110.835 129.49 114.51ZM123.01 109.31C121.612 110.048 120.056 110.434 118.475 110.434C116.894 110.434 115.338 110.048 113.94 109.31L114.67 104.46C117.75 104.76 120.26 103.8 121.57 101.83C123.04 99.64 122.81 96.39 120.95 92.9C118.87 88.99 114.38 88.37 111.89 88.34H111.73C105.49 88.34 99.13 91.89 96.56 96.52L92.82 94.73C93.5553 92.3449 94.8046 90.15 96.48 88.3C95.0376 87.0754 93.9474 85.4887 93.3217 83.703C92.696 81.9173 92.5574 79.9971 92.92 78.14L96.61 77.8C96.7789 79.302 97.4 80.7172 98.3911 81.8583C99.3822 82.9994 100.697 83.8125 102.16 84.19C105.238 82.8161 108.58 82.1335 111.95 82.19C112.43 82.19 112.89 82.24 113.36 82.27C110.969 78.0312 107.18 74.7545 102.64 73C91.56 68.7 84.09 75.37 82.38 77.67C78.26 83.19 80.9 88.41 82.91 91.8L79.61 94.8C76.736 92.314 74.8075 88.9127 74.15 85.17C69.92 86.44 64.24 86.17 61.06 80.74L64.06 78.68C67.43 81.2 72.78 80.98 75.32 77.87C75.9252 76.4949 76.6905 75.1959 77.6 74C79.044 72.093 80.7864 70.4316 82.76 69.08C74.47 66.82 62.76 67.19 55.68 71.73C53.7668 72.841 52.192 74.4517 51.1244 76.3895C50.0569 78.3274 49.5368 80.5192 49.62 82.73C49.62 86.3 52.42 91.94 56.19 92.82L54 97.07C51.5946 96.5129 49.4109 95.2487 47.73 93.44L44.48 97.58L41.23 96L44.41 87.68C43.8904 86.064 43.624 84.3774 43.62 82.68C43.628 81.3361 43.7687 79.9963 44.04 78.68C34.04 82.81 29.1 89.68 27.29 95.96C25.9 100.79 26.44 105.15 28.72 107.49C30.53 109.35 33.3 109.79 35.91 109.62L42.91 104.17L45.21 106.11L43.13 112.93C44.22 116.4 47.79 118.19 54.3 116.93C54.6375 114.169 55.7272 111.554 57.45 109.37C58.7133 107.552 60.3846 106.056 62.33 105L65.75 95.79L69.17 95.64L68.8 103.19C74.55 102.6 80.98 103.77 86.97 102.87L88.07 106.87C79.29 110.93 70.3 104.31 62.15 113.04C59.22 116.18 60.34 118.91 62.15 121.66C64.76 125.59 69.66 123.23 74.67 121.66C82.26 119.34 87.77 117.66 98.16 118.51C95.68 113.8 95.92 108.11 99.24 101.85L104.13 103.78C100.7 111.69 103.91 116.27 106.13 118.29C109.56 121.41 114.72 122.35 118.13 120.47C119.436 119.749 120.559 118.737 121.412 117.513C122.265 116.289 122.825 114.885 123.05 113.41C123.275 112.051 123.258 110.663 123 109.31H123.01Z"/>
  </svg>
)

// Component to display a single reasoning item
const ReasoningItem = memo(({ text, isStreaming = false, hasFollowingEvent = false, isAnswerStreaming = false }) => {
  // Show "Thought" if there's a following event OR if the answer has started streaming
  const isComplete = hasFollowingEvent || isAnswerStreaming
  
  if (!text || !text.trim()) {
    // Show "Thinking..." or "Thought" when reasoning is active but text is empty
    if (isStreaming || hasFollowingEvent) {
      return (
        <div className="mt-2 ms-6 flex items-center gap-2 text-sm text-gray-500">
          <BrainIcon className={clsx("h-4 w-4 flex-shrink-0 text-gray-400", isStreaming && !isComplete && "animate-wobble")} />
          <span className="font-medium">{isComplete ? 'Thought' : 'Thinking...'}</span>
        </div>
      )
    }
    return null
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
      <details className="group mt-2 ms-6 text-sm text-gray-500">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
          <BrainIcon className={clsx("h-4 w-4 flex-shrink-0 text-gray-400", isStreaming && !isComplete && "animate-wobble")} />
          <span className="group-open:hidden">{preview}...</span>
          <span className="hidden group-open:inline text-gray-400 text-xs">Hide thinking</span>
          <ChevronDownIcon className="h-3 w-3 text-gray-400 transition-transform duration-150 group-open:rotate-180 flex-shrink-0" />
        </summary>
        <div className="mt-2 ms-6 text-gray-500 text-left [&_p]:text-left [&_*]:text-left">
          <Streamdown mode="static" isAnimating={false} remarkPlugins={streamdownRemarkPlugins}>
            {text}
          </Streamdown>
        </div>
      </details>
    )
  }

  return (
    <div className="mt-2 ms-6 flex items-center gap-2 text-sm text-gray-500">
      <BrainIcon className={clsx("h-4 w-4 flex-shrink-0 text-gray-400", isStreaming && !isComplete && "animate-wobble")} />
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

export default function Chat({ team, bot, showResearchMode = false }) {
  const [question, setQuestion] = useState('')
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
  
  // Models that support reasoning effort
  // GPT-5.1 series: gpt-5.1, gpt-5.2
  // GPT-5.0 series: gpt-5, gpt-5-mini, gpt-5-nano
  // O-series: o1, o1-mini, o3, o3-mini, o4, o4-mini
  const reasoningModels = [
    'gpt-5.1', 'gpt-5.2',  // GPT-5.1 series
    'gpt-5', 'gpt-5-mini', 'gpt-5-nano',  // GPT-5.0 series
    'o1', 'o1-mini', 'o3', 'o3-mini', 'o4', 'o4-mini'  // O-series
  ]
  
  // Check if a model is a reasoning model
  const isReasoningModel = (model) => {
    return reasoningModels.includes(model)
  }
  
  // Get default reasoning effort based on model
  const getDefaultReasoningEffort = (model) => {
    // GPT-5.1 series: default "none"
    if (model === 'gpt-5.1' || model === 'gpt-5.2') {
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
    // GPT-5.1 series: "high", "medium", "low", "none"
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
  
  const [questions, setQuestions] = useState(
    bot.questions
      ? bot.questions.length >= 4
        ? grabQuestions(bot)
        : bot.questions.slice(0, 2)
      : [],
  )
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

  const validModels = [
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      description:
        'Most powerful flagship model with long-context work, stronger tool use, and adaptive reasoning - requires verification',
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
    setModify(canUserEditBot(team, user.uid))
  }, [team, user])


  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [question, selectedImages])

  //clear error text when question changes
  useEffect(() => {
    if (question) {
      setErrorText(null)
    }
  }, [question])

  // make api call to ask question
  const askQuestion = async (askedQuestion) => {
    if (!askedQuestion || askedQuestion.length < 2) {
      setErrorText('Please enter a full question.')
      return
    }
    setLoading(true)
    setErrorText(null)
    setCurrentAnswer('')
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
    setQuestion('')
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
                return prev + '\n'
              } else {
                return prev + msg.data
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
                id: uuidv4(),
                type: 'reasoning',
                text: reasoningData.text || '',
                timestamp: Date.now(),
              }
              setAgentEvents((prev) => {
                const updated = [...prev, newEvent]
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
                // Clear agent events for next question
                setAgentEvents([])
                agentEventsRef.current = []
              } else {
                if (endData.answer) {
                  setCurrentAnswer(endData.answer)
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

  const FullSource = () => {
    if (!currentSource) return null

    const page = currentSource?.page ? ` - Page ${currentSource?.page}` : ''
    const SourceIcon = currentSource?.url ? LinkIcon : DocumentTextIcon

    return (
      <Transition.Root show={!!currentSource} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setCurrentSource}>
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
                        <SourceIcon
                          className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-800"
                          aria-hidden="true"
                        />
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
    const page = source.page ? ` - Page ${source.page}` : ''

    if (source.used === false && !isContextBoost) return null

    return (
      <li className="my-1 flex cursor-pointer items-center">
        <button
          onClick={() => setCurrentSource(source)}
          className="flex items-center text-left text-sm font-medium leading-tight text-gray-500"
        >
          <SourceIcon
            className={clsx(
              'mr-1.5 h-4 w-4 flex-shrink-0',
              source.used === true ? 'text-gray-600' : 'text-gray-400',
            )}
            aria-hidden="true"
          />
          {source.title || source.url}
          {page}
        </button>
      </li>
    )
  }

  const Source = ({ source }) => {
    const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
    const page = source.page ? ` - Page ${source.page}` : ''

    if (source.used === false && !isContextBoost) return null

    return (
      <li className="my-1 flex cursor-pointer items-center">
        <SourceIcon
          className={clsx(
            'mr-1.5 h-4 w-4 flex-shrink-0',
            source.used === true ? 'text-gray-600' : 'text-gray-400',
          )}
          aria-hidden="true"
        />
        {source.url ? (
          <Link
            href={source.url}
            target="_blank"
            className="focus:outline-none"
          >
            <p className="text-left">
              {source.title}
              {page}
            </p>
          </Link>
        ) : (
          <p className="text-left">
            {source.title || source.url}
            {page}
          </p>
        )}
      </li>
    )
  }

  // ChatRow is now defined outside of Chat for proper memoization

  const ModelSelector = () => {
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
      <Listbox value={selectedModel} onChange={setSelectedModel}>
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
                  onClick={(e) => {
                    if (!checkPlanPermission(team, 'hobby').allowed) {
                      setPendingUpgrade(true)
                    }
                    if (isDisabled) {
                      e.preventDefault()
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
            <Listbox.Options className="absolute bottom-full left-0 z-10 mb-2 max-h-72 w-72 origin-bottom-right divide-y divide-gray-200 overflow-hidden overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
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

  const ReasoningSelector = () => {
    // Only show if model supports reasoning
    if (!isReasoningModel(selectedModel) || !reasoningEffort) {
      return null
    }

    // Get supported values for the current model
    const supportedValues = getSupportedReasoningEfforts(selectedModel)
    
    // Map of all possible reasoning effort options
    const allReasoningOptions = {
      none: { value: 'none', label: 'None', description: 'Least reasoning (GPT-5.1 default)' },
      minimal: { value: 'minimal', label: 'Minimal', description: 'Minimal reasoning (GPT-5 default)' },
      low: { value: 'low', label: 'Low', description: 'Light reasoning (O-series default)' },
      medium: { value: 'medium', label: 'Medium', description: 'Balanced reasoning' },
      high: { value: 'high', label: 'High', description: 'Maximum reasoning depth' },
    }
    
    // Filter options to only show supported values for this model
    const reasoningOptions = supportedValues.map(value => allReasoningOptions[value])

    const isDisabled =
      !team?.supportsGPT4 ||
      !team?.openAIKey ||
      !checkPlanPermission(team, 'hobby').allowed

    return (
      <Listbox value={reasoningEffort} onChange={setReasoningEffort}>
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
                  onClick={(e) => {
                    if (!checkPlanPermission(team, 'hobby').allowed) {
                      setPendingUpgrade(true)
                    }
                    if (isDisabled) {
                      e.preventDefault()
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
            <Listbox.Options className="absolute bottom-full left-0 z-10 mb-2 max-h-72 w-72 origin-bottom-right divide-y divide-gray-200 overflow-hidden overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
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

  return (
    <div className="relative flex justify-center py-8">
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <div className="flex w-full flex-col px-10 text-center sm:max-w-3xl lg:max-w-7xl lg:px-12">
        <div className="my-auto">
          {bot.logo && !showResearchMode && (
            <div className="flex items-center justify-center">
              <img src={bot.logo} alt={bot.name} className="max-h-9 w-auto" />
            </div>
          )}
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {bot.name}
          </p>
          <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">
            {bot.description}
          </p>
          <Alert 
            title="Welcome to your new AI Agent!" 
            type="info"
            dismissKey="agent-beta-welcome"
          >
            You are chatting using our new Agent functionality, which
            provides more intelligent and contextual responses, tool calling to
            perform actions, as well as image and model selection support! You
            may need to adjust your custom prompt to tune behavior for your use
            case, such as providing different instructions for when the agent
            should look up information from your docs.
          </Alert>
        </div>

        <FullSource />

        <div className="mt-6">
          {useMemo(() => {
            // Render all completed messages (everything except the last one if it's streaming)
            const completedMessages = answers.slice(0, 
              loading && answers.length > 0 && answers[answers.length - 1].type === 'answer' 
                ? answers.length - 1 
                : answers.length
            )
            const result = []
            completedMessages.forEach((answer, index) => {
              // Render agent events (reasoning and tool calls) in order before answer
              if (answer.type === 'answer' && answer.agentEvents && answer.agentEvents.length > 0) {
                const agentEvents = []
                answer.agentEvents.forEach((event, eventIndex) => {
                  const hasFollowingEvent = eventIndex < answer.agentEvents.length - 1
                  if (event.type === 'reasoning') {
                    agentEvents.push(
                      <ReasoningItem key={`reasoning-${answer.id || index}-${eventIndex}`} text={event.text} isStreaming={false} hasFollowingEvent={hasFollowingEvent} />
                    )
                  } else if (event.type === 'tool_call') {
                    agentEvents.push(
                      <div key={`toolcall-${answer.id || index}-${eventIndex}`} className="mt-2">
                        <ToolCallDisplay toolCalls={[event]} isStreamingStarted={true} />
                      </div>
                    )
                  }
                })
                // Wrap all agent events in a container with extra top margin
                if (agentEvents.length > 0) {
                  result.push(
                    <div key={`agent-events-${answer.id || index}`} className="mt-4">
                      {agentEvents}
                    </div>
                  )
                }
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
          }, [answers, loading, isCopied, copiedId, ratings, isContextBoost])}
          {/* Render agent events (reasoning and tool calls) while loading, in order */}
          {loading && agentEvents.length > 0 && (
            <div className="mt-4">
              {agentEvents.map((event, eventIndex) => {
                const hasFollowingEvent = eventIndex < agentEvents.length - 1
                const isAnswerStreaming = currentAnswer.length > 0
                if (event.type === 'reasoning') {
                  return (
                    <ReasoningItem key={`streaming-reasoning-${eventIndex}`} text={event.text} isStreaming={true} hasFollowingEvent={hasFollowingEvent} isAnswerStreaming={isAnswerStreaming} />
                  )
                } else if (event.type === 'tool_call') {
                  return (
                    <div key={`streaming-toolcall-${eventIndex}`} className="mt-2">
                      <ToolCallDisplay toolCalls={[event]} isStreamingStarted={isAnswerStreaming || hasFollowingEvent} />
                    </div>
                  )
                }
                return null
              })}
            </div>
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

          {showQuestion && (
            <div className="mx-auto mt-5 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
              {questions &&
                questions.length > 0 &&
                questions.map((recommendedQuestion) => (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-lg border border-gray-300 p-3 text-cyan-700 hover:bg-white hover:text-cyan-800 focus:ring-cyan-600 focus:ring-offset-cyan-50"
                    onClick={() => {
                      setQuestion(recommendedQuestion)
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

          <form
            className="mt-4 flex flex-col justify-center"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading) {
                askQuestion(question)
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
                  ref={textareaRef}
                  name="query"
                  id="query"
                  value={question}
                  maxLength={2000}
                  minLength={2}
                  required
                  rows={1}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    //this detects if the user is typing in a IME session (ie Kanji autocomplete) to avoid premature submission
                    if (e.isComposing || e.keyCode === 229) {
                      return
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (e.shiftKey) {
                        setQuestion((prevQuestion) => `${prevQuestion}\n`)
                      } else if (!e.shiftKey && !loading) {
                        askQuestion(question)
                      }
                    }
                  }}
                  tabIndex={1}
                  autoComplete="off"
                  className={clsx(
                    'text-md block min-h-16 w-full resize-none rounded-xl border border-gray-300 px-2 pb-10 outline-none focus:border-none focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:px-4',
                    selectedImages.length > 0 ? 'pt-24' : 'pt-3',
                  )}
                  placeholder={bot.labels.inputPlaceholder}
                />

                <button
                  type="submit"
                  tabIndex={2}
                  disabled={loading}
                  className="absolute bottom-0 right-0 my-3 mr-2 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
                >
                  <span className="sr-only">{bot.labels.inputPlaceholder}</span>
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

            <div className="mb-4 flex items-start justify-between">
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
                      setQuestion('')
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
          </form>
        </div>
      </div>
    </div>
  )
}
