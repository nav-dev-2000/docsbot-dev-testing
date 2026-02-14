import clsx from 'clsx'
import { useEffect, useState, useRef, Fragment, useMemo, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  HandThumbDownIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  LinkIcon,
  MinusIcon,
  XMarkIcon,
  LifebuoyIcon,
  AdjustmentsHorizontalIcon,
  UserCircleIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  CheckBadgeIcon,
  TrashIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'
import Link from 'next/link'
import Paginator from '@/components/Paginator'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import Checkout from '@/components/Checkout'
import Alert from '@/components/Alert'
import ModalQA from '@/components/ModalQA'
import LocaleDateTime from '@/components/LocaleDateTime'
import QuestionFilters from '@/components/QuestionFilters'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserEditBot } from '@/utils/function.utils'
import ModalExport from '@/components/ModalExport'
import Datepicker from 'react-tailwindcss-datepicker'
import { isSuperAdmin } from '@/utils/helpers'
import { preprocessMath } from '@/utils/markdown'
import ConversationMetadataViewer from '@/components/ConversationMetadataViewer'
import QuestionSkeleton from '@/components/QuestionSkeleton'
import HelpScoutLogo from '@/components/HelpScoutLogo'

const BLUR_LIMIT_COUNT = 2 // the amount of questions to blur before the plan limit
const streamdownRemarkPlugins = [
  ...Object.values(defaultRemarkPlugins),
  [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

const Source = ({ source }) => {
  const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
  const page = source.page ? ` - Page ${source.page}` : ''

  return (
    <li className="flex items-center truncate lg:w-48">
      <SourceIcon className="mr-1 h-3 w-3 text-gray-400" aria-hidden="true" />
      {source.url ? (
        <Link
          href={source.url}
          target="_blank"
          className="block truncate text-gray-500 underline hover:text-gray-700 focus:outline-none active:text-gray-700"
        >
          <p className="truncate text-left text-xs font-medium">
            {source.title}
            {page}
          </p>
        </Link>
      ) : (
        <p className="text-left text-xs font-medium text-gray-500">
          {source.title || source.url}
          {page}
        </p>
      )}
    </li>
  )
}

const Sources = ({ sources }) => {
  return (
    <ul className="my-0 list-none py-0">
      {sources.map((source, index) => (
        <Source key={index} source={source} />
      ))}
    </ul>
  )
}

const FullSource = ({ source }) => {
  const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
  const page = source.page ? ` - Page ${source.page}` : ''

  return (
    <div
      className={clsx(
        'px-1',
        source?.used
          ? 'my-2 rounded-md border border-gray-300 bg-cyan-50 shadow-sm'
          : '',
      )}
    >
      <h4 className="mb-2 flex items-center text-sm text-gray-500">
        {source?.used && (
          <CheckBadgeIcon
            className="mr-1 h-4 w-4 text-cyan-700"
            aria-hidden="true"
          />
        )}
        <SourceIcon
          className="mr-1 h-3 w-3 text-gray-400"
          aria-hidden="true"
        />
        {source.url ? (
          <Link
            href={source.url}
            target="_blank"
            className="block truncate underline hover:text-gray-700 focus:outline-none active:text-gray-700"
          >
            <p className="truncate text-left">
              {source.title}
              {page}
            </p>
          </Link>
        ) : (
          <p className="text-left text-gray-500">
            {source.title || source.url}
            {page}
          </p>
        )}
      </h4>
      <p className="mb-4 text-left text-xs text-gray-500">{source.content}</p>
    </div>
  )
}

const Rating = ({ rating, escalation }) => {
  const ThumbIcon = escalation
    ? LifebuoyIcon
    : rating > 0
      ? HandThumbUpIcon
      : rating < 0
        ? HandThumbDownIcon
        : MinusIcon
  const color = escalation
    ? 'text-blue-700'
    : rating > 0
      ? 'text-green-600'
      : rating < 0
        ? 'text-red-600'
        : 'text-gray-500'
  const spanText = escalation
    ? 'Escalated to support'
    : rating > 0
      ? 'Up vote'
      : rating < 0
        ? 'Down vote'
        : 'Neutral'

  return (
    <>
      <span className="sr-only">{spanText}</span>
      <ThumbIcon className={clsx(color, 'h-6 w-6')} aria-hidden="true" />
    </>
  )
}

const CouldAnswer = ({ answered, exists }) => {
  const ThumbIcon = answered
    ? CheckCircleIcon
    : exists
      ? MinusCircleIcon
      : MinusIcon
  const color = answered
    ? 'text-green-600'
    : exists
      ? 'text-red-600'
      : 'text-gray-500'
  const spanText = answered ? 'Answered' : exists ? 'Unanswered' : 'Unknown'

  return (
    <>
      <span className="sr-only">{spanText}</span>
      <ThumbIcon className={clsx(color, 'h-6 w-6')} aria-hidden="true" />
    </>
  )
}

const ShortAnswer = ({ answer }) => {
  const maxLength = 150
  if (!answer) return null
  if (answer.length <= maxLength) return <span>{answer}</span>
  return <span>{answer.substring(0, maxLength)}...</span>
}

const Answer = ({
  question,
  questionIdx,
  children,
  startOpen = false,
  team,
  bot,
  user,
  canModify,
  deleteQuestion,
  saveRating,
  updateIPFilter,
  ipFilter,
  pagination,
}) => {
  const [open, setOpen] = useState(startOpen)
  const [qaOpen, setQAOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const usedSourcesCount = question.sources?.filter(s => s?.used).length || 0
  const totalSourcesCount = question.sources?.length || 0
  // Default to showing all if zero sources were used, otherwise show only used
  const [showAllSources, setShowAllSources] = useState(usedSourcesCount === 0)
  const disabled =
    questionIdx + pagination.perPage * pagination.page + BLUR_LIMIT_COUNT >=
    pagination.planLimit

  // Reset showAllSources when modal opens or question changes
  useEffect(() => {
    if (open) {
      setShowAllSources(usedSourcesCount === 0)
    }
  }, [open, question.id, usedSourcesCount])

  return (
    <>
      {!startOpen && (
        <button
          className={
            (disabled ? '' : 'cursor-pointer') + 'm-0 block px-3 py-4 text-left'
          }
          onClick={() => {
            if (disabled) return
            setOpen(true)
          }}
          disabled={disabled}
        >
          {children}
        </button>
      )}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="z-10 relative" onClose={setOpen}>
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

          <div className="z-5 fixed inset-0 overflow-y-auto">
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
                <Dialog.Panel className="relative flex max-h-[calc(100vh-2rem)] transform flex-col overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-h-[calc(100vh-4rem)] sm:w-full sm:max-w-5xl">
                  <div className="absolute right-0 top-0 left-0 z-10 flex justify-end bg-white/90 pr-4 pt-4 backdrop-blur-sm">
                    <button
                      type="button"
                      disabled={!canModify}
                      className={
                        'mr-10 flex items-center rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2' +
                        (canModify
                          ? ' text-red-400 hover:text-red-500'
                          : ' cursor-not-allowed text-gray-300')
                      }
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <TrashIcon className="mr-1 h-4 w-4" aria-hidden="true" />{' '}
                      Delete
                    </button>

                    <button
                      className="mr-6 flex items-center text-xs text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.preventDefault()
                        navigator.clipboard.writeText(
                          `${window.location.origin}/app/bots/${bot.id}/questions/${question.id}`,
                        )
                        setCopied(true)
                        setTimeout(() => {
                          setCopied(false)
                        }, 2000)
                      }}
                      disabled={copied}
                      title="Copy a shareable link to this question to share to team members or support."
                    >
                      <ClipboardDocumentIcon
                        className="mr-1 h-4 w-4"
                        aria-hidden="true"
                      />
                      {copied ? 'Copied!' : 'Copy Share Link'}
                    </button>

                    {question.conversationId && (
                      <Tooltip content="View full conversation">
                        <Link
                          href={`/app/bots/${bot.id}/conversations?conversationId=${question.conversationId}`}
                          className="mr-6 flex items-center text-xs text-gray-400 hover:text-gray-600"
                        >
                          <ChatBubbleLeftRightIcon
                            className="mr-1 h-4 w-4"
                            aria-hidden="true"
                          />
                          Conversation
                        </Link>
                      </Tooltip>
                    )}

                    {question.metadata?.helpscoutReply === true && (
                      <Tooltip
                        content={
                          question.metadata?.helpscoutConversationUrl
                            ? 'View conversation in Help Scout'
                            : 'Help Scout conversation'
                        }
                      >
                        {question.metadata?.helpscoutConversationUrl ? (
                          <a
                            href={question.metadata.helpscoutConversationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-6 flex items-center text-xs text-gray-400 hover:text-gray-600"
                          >
                            <HelpScoutLogo
                              className="mr-1 h-4 w-4 text-[#1292ee]"
                              aria-hidden="true"
                            />
                            Help Scout
                          </a>
                        ) : (
                          <div className="mr-6 flex items-center text-xs text-gray-400">
                            <HelpScoutLogo
                              className="mr-1 h-4 w-4 text-[#1292ee]"
                              aria-hidden="true"
                            />
                            Help Scout
                          </div>
                        )}
                      </Tooltip>
                    )}

                    {user && user.uid && isSuperAdmin(user.uid) && (
                      <Link
                        href={`https://smith.langchain.com/o/3a7d1270-cdc3-4de5-8a1a-c595a186eb5a/projects/p/7a4e94a1-8115-48bd-a144-fd83defbf4b0/r/${question.run_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-6 flex items-center text-xs text-gray-400 hover:text-gray-600"
                        title="View run in LangSmith"
                      >
                        <ChartBarIcon
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        View Trace
                      </Link>
                    )}

                    <button
                      type="button"
                      disabled={!canModify}
                      className={
                        'mr-2 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2' +
                        (canModify ? ' ' : ' cursor-not-allowed')
                      }
                      onClick={() => saveRating(question.id, 1)}
                    >
                      <span className="sr-only">Up vote</span>
                      <HandThumbUpIcon
                        className={clsx(
                          'h-6 w-6',
                          question.rating > 0 ? 'text-green-600' : 'text-gray-600',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      disabled={!canModify}
                      className={
                        'mr-2 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2' +
                        (canModify ? ' ' : ' cursor-not-allowed')
                      }
                      onClick={() => saveRating(question.id, -1)}
                    >
                      <span className="sr-only">Down vote</span>
                      <HandThumbDownIcon
                        className={clsx(
                          'h-6 w-6',
                          question.rating < 0 ? 'text-red-600' : 'text-gray-600',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                    {question?.escalation && (
                      <Alert
                        title="This user escalated this message to support"
                        type="info"
                        className="rounded-t-lg"
                      />
                    )}
                    <div className="flex-inline p-0">
                      <div className="flex items-center">
                        <h2 className="flex items-center text-wrap text-sm font-medium text-gray-400">
                          <img
                            className="mr-1 inline-block h-5 w-5 rounded-full"
                            src={`https://api.dicebear.com/6.x/personas/svg?seed=${question.alias}?size=24&backgroundType=gradientLinear,solid&backgroundColor=FDE7E4,FFE8EF,FCF2FF,EBDFFF,EEF1FF,EAF5FF,E9FDFF,ECFFF6,F0FFE9,FFFDEE,FFF5DD,FFD9C9,EDEDED,FFFFFF,B3B3B3`}
                            alt="User avatar"
                          />
                          {question.alias} asked
                          {question.metadata?.referrer
                            ? ` from ${question.metadata.referrer}`
                            : ''}
                          :
                        </h2>
                        <div className="ml-2 flex items-center gap-2">
                          <ConversationMetadataViewer
                            metadata={question.metadata}
                          />
                          {ipFilter === null && question.ip !== undefined && (
                            <button
                              type="button"
                              className="flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                              onClick={() => {
                                updateIPFilter(question.ip, question.alias)
                              }}
                            >
                              <AdjustmentsHorizontalIcon
                                className="m-auto h-4 w-4"
                                aria-hidden="true"
                              />
                              <span className="m-auto hidden pl-1 text-xs text-gray-400 sm:block">
                                Filter to user
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <h2 className="text-xl font-medium text-gray-900">
                      {question.question}
                    </h2>
                    {question.standaloneQuestion &&
                      question.standaloneQuestion.trim() !==
                        question.answer.trim() &&
                      question.standaloneQuestion.trim() !==
                        question.question.trim() && (
                        <h3 className="mb-1 mt-1 text-sm text-gray-800">
                          Standalone Question:{' '}
                          <span className="font-semibold text-gray-900">
                            {question.standaloneQuestion}
                          </span>
                        </h3>
                      )}
                    <div className="mt-2 w-full max-w-none border-t border-gray-200 pt-2">
                      <Streamdown
                        mode="static"
                        isAnimating={false}
                        remarkPlugins={streamdownRemarkPlugins}
                      >
                        {preprocessMath(question.answer)}
                      </Streamdown>
                    </div>

                    {canModify && (
                      <div className="flex justify-end mt-4">
                        <ModalQA
                          team={team}
                          botId={bot.id}
                          question={question}
                          open={qaOpen}
                          setOpen={setQAOpen}
                        />
                      </div>
                    )}
                    {question.sources.length > 0 && (
                      <>
                        <div className="mt-2 flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-700">
                            Sources:
                          </h3>
                          <span className="text-xs text-gray-500">
                            {usedSourcesCount}/{totalSourcesCount} used
                          </span>
                        </div>
                        {question.sources
                          .filter((source) => showAllSources || source?.used)
                          .map((source, index) => (
                            <FullSource key={index} source={source} />
                          ))}
                        {usedSourcesCount > 0 && usedSourcesCount < totalSourcesCount && (
                          <button
                            type="button"
                            onClick={() => setShowAllSources(!showAllSources)}
                            className="mt-2 flex items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                          >
                            <ChevronDownIcon
                              className={clsx(
                                'mr-1 h-4 w-4 transition-transform duration-200',
                                showAllSources ? 'rotate-180' : '',
                              )}
                              aria-hidden="true"
                            />
                            {showAllSources
                              ? 'Show only used sources'
                              : `Show unused sources (${totalSourcesCount - usedSourcesCount} hidden)`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

export default function TableQuestions({
  team,
  bot,
  questions,
  setQuestions,
  changePage,
  buildParams,
  openQuestion = null,
  searchInput= '',
  setSearchInput = () => {},
}) {
  const [ipFilter, setIPFilter] = useState(null)
  const [ipAlias, setIPAlias] = useState(null)
  const [filters, setFilters] = useState({
    rating: null,
    escalated: null,
    couldAnswer: null,
  })
  const [canModify, setModify] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [searching, setSearching] = useState(false)
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [localSearchInput, setLocalSearchInput] = useState(searchInput)

  const filterOptions = useMemo(() => {
    const options = [
      {
        id: 'rating',
        name: 'Rating',
        options: [
          { value: null, label: 'All' },
          {
            value: 1,
            label: (
              <span className="flex items-center">
                <HandThumbUpIcon className="mr-1 h-4 w-4 text-green-600" /> Up
              </span>
            ),
          },
          {
            value: 0,
            label: (
              <span className="flex items-center">
                <MinusIcon className="mr-1 h-4 w-4 text-gray-500" /> Neutral
              </span>
            ),
          },
          {
            value: -1,
            label: (
              <span className="flex items-center">
                <HandThumbDownIcon className="mr-1 h-4 w-4 text-red-600" /> Down
              </span>
            ),
          },
        ],
      },
      {
        id: 'escalated',
        name: 'Escalated',
        options: [
          { value: null, label: 'All' },
          {
            value: true,
            label: (
              <span className="flex items-center">
                <LifebuoyIcon className="mr-1 h-4 w-4 text-blue-700" /> Escalated
              </span>
            ),
          },
          {
            value: false,
            label: (
              <span className="flex items-center">
                <LifebuoyIcon className="mr-1 h-4 w-4 text-gray-500" /> Not
                Escalated
              </span>
            ),
          },
        ],
      },
    ]

    options.push({
      id: 'couldAnswer',
      name: 'Could Answer',
      options: [
        { value: null, label: 'All' },
        {
          value: true,
          label: (
            <span className="flex items-center">
              <CheckCircleIcon className="mr-1 h-4 w-4 text-green-600" />{' '}
              Answered
            </span>
          ),
        },
        {
          value: false,
          label: (
            <span className="flex items-center">
              <MinusCircleIcon className="mr-1 h-4 w-4 text-red-600" /> Not
              Answered
            </span>
          ),
        },
      ],
    })

    return options
  }, [])

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid, bot))
  }, [team, user, bot])

  // Sync local search input with prop when it changes externally (e.g., when filters clear it)
  useEffect(() => {
    setLocalSearchInput(searchInput)
  }, [searchInput])

  // When non-date filters change, clear search (search only works with date range)
  useEffect(() => {
    if (!team || !user) return

    // Clear search when non-date filters change
    if (lastSearchedQuery) {
      setSearchInput('')
      setLocalSearchInput('')
      setLastSearchedQuery('')
    }

    const performSearch = async () => {
      setSearching(true)
      await changePage(
        0,
        ipFilter,
        filters.rating,
        filters.escalated,
        filters.couldAnswer,
        dateRange,
        '', // Clear search for non-date filters
      )
      setSearching(false)
    }

    performSearch()
  }, [
    ipFilter,
    filters.rating,
    filters.escalated,
    filters.couldAnswer,
  ])

  // When date range changes, preserve search (date range is compatible with search)
  useEffect(() => {
    if (!team || !user) return

    const performSearch = async () => {
      setSearching(true)
      // Preserve search query when date range changes (if search exists)
      await changePage(
        0,
        ipFilter,
        filters.rating,
        filters.escalated,
        filters.couldAnswer,
        dateRange,
        lastSearchedQuery || '', // Preserve search when date range changes
      )
      setSearching(false)
    }

    performSearch()
  }, [dateRange])

  const handleSearch = async () => {
    if (!team || !user) return
    
    // Sync local input to parent
    setSearchInput(localSearchInput)
    
    // Clear filters but preserve date range when performing a search
    setIPFilter(null)
    setIPAlias(null)
    setFilters({
      rating: null,
      escalated: null,
      couldAnswer: null,
    })
    // Don't reset dateRange - preserve current date filter
    
    setSearching(true)
    await changePage(
      0,
      null,
      null,
      null,
      null,
      dateRange, // Preserve current date range when searching
      localSearchInput,
    )
    setLastSearchedQuery(localSearchInput)
    setSearching(false)
  }

  const clearSearch = async () => {
    setLocalSearchInput('')
    setSearchInput('')
    setLastSearchedQuery('')
    if (!team || !user) return
    setSearching(true)
    await changePage(
      0,
      ipFilter,
      filters.rating,
      filters.escalated,
      filters.couldAnswer,
      dateRange,
      '',
    )
    setSearching(false)
  }

  // blur is only enabled when we've reached our plan limit
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return (
      questions.questions.length +
        questions.pagination.perPage * questions.pagination.page >=
      questions.pagination.planLimit
    )
  })

  const saveRating = useCallback(async (questionId, newRating) => {
    const data = { rating: newRating }

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bot?.signature}`,
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/rate/${questionId}`
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setQuestions((prevQuestions) => {
          const questionIndex = prevQuestions.questions.findIndex(
            (question) => question.id === questionId,
          )
          const newQuestions = [...prevQuestions.questions]
          newQuestions[questionIndex].rating = newRating
          return { ...prevQuestions, questions: newQuestions }
        })
      } else {
        try {
          const data = await response.json()
          if (data.error) {
            console.warn(
              data.error || 'Something went wrong, please try again.',
            )
          }
        } catch (e) {
          console.warn(e)
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }, [team?.id, bot?.id, bot?.signature, setQuestions])

  const deleteQuestion = useCallback(async (questionId) => {
    const urlParams = [
      'teams',
      team.id,
      'bots',
      bot.id,
      'questions',
      questionId,
    ]
    const path = '/api/' + urlParams.join('/')

    const response = await fetch(path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      setQuestions((prevQuestions) => {
        const questionIndex = prevQuestions.questions.findIndex(
          (question) => question.id === questionId,
        )
        const newQuestions = [...prevQuestions.questions]
        newQuestions[questionIndex].deleted = true
        return { ...prevQuestions, questions: newQuestions }
      })
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }, [team?.id, bot?.id, setQuestions])

  const downloadLogs = async () => {
    if (exporting) {
      return
    }
    setExporting(true)

    // ask api to generate logs
    const apiUrl = `/api/teams/${team.id}/bots/${bot.id}/export-log?${buildParams(ipFilter, filters.rating, filters.escalated, filters.couldAnswer, dateRange)}`
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
      if (response.ok) {
        // we get a signed url back
        const { url } = await response.json()
        var link = document.createElement('a')
        link.href = url
        link.click()
        link.remove()

        setExportOpen(false)
      } else {
        try {
          const { message } = await response.json()
          setErrorText(message)
        } catch (e) {
          console.warn(e)
          setErrorText('Something went wrong, please try again.')
        }
      }
    } catch (e) {
      console.warn(e)
      setErrorText('Something went wrong, please try again.')
    }
    setExporting(false)
  }

  const updateIPFilter = useCallback((ip, alias) => {
    setIPFilter(ip)
    setIPAlias(alias)
  }, [])

  const commonAnswerProps = useMemo(() => ({
    team,
    bot,
    user,
    canModify,
    deleteQuestion,
    saveRating,
    updateIPFilter,
    ipFilter,
    pagination: questions.pagination,
  }), [team, bot, user, canModify, deleteQuestion, saveRating, updateIPFilter, ipFilter, questions.pagination])

  return (
    <>
      <div className="mb-4 flex justify-between">
        <Link
          href={`/app/bots/${bot.id}`}
          className="text-md flex items-center font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon
            className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400"
            aria-hidden="true"
          />
          Back
        </Link>
        <div className="flex items-center justify-center space-x-2">
          <Link
            href={`/app/bots/${bot.id}/reports`}
            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChartBarIcon
              className="mr-2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            Reports
          </Link>
          <button
            onClick={() => setExportOpen((prev) => !prev)}
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
          >
            Export Logs
          </button>
        </div>
      </div>
      <ModalExport
        team={team}
        bot={bot}
        open={exportOpen}
        setOpen={setExportOpen}
        downloadLogs={async () => {
          await downloadLogs()
          setExportOpen(false)
        }}
        isProcessing={exporting}
      />

      <Alert title={errorText} type="error" className="rounded-t-lg" />
      <div className="mx-0 mt-4 rounded-lg bg-white p-4 shadow-lg lg:p-8">
        <div className="px-0">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-6 text-gray-900">
                Questions
              </h1>
              {lastSearchedQuery && (
                <button
                  type="button"
                  className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={clearSearch}
                  title={`Search: ${lastSearchedQuery}`}
                >
                  <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                  <span className="m-auto flex pl-1 text-xs text-gray-400">
                    <MagnifyingGlassIcon className="mr-1 h-4 w-4" />
                    {lastSearchedQuery.length > 30 ? `${lastSearchedQuery.substring(0, 30)}...` : lastSearchedQuery}
                  </span>
                </button>
              )}
              {ipFilter !== null && (
                <button
                  type="button"
                  className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => {
                    updateIPFilter(null, null)
                  }}
                >
                  <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                  <span className="m-auto flex pl-1 text-xs text-gray-400">
                    <UserCircleIcon className="mr-1 h-4 w-4" /> {ipAlias}
                  </span>
                </button>
              )}
              {filters.rating !== null && (
                <button
                  type="button"
                  className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => {
                    setFilters((prevFilters) => {
                      return { ...prevFilters, rating: null }
                    })
                  }}
                >
                  <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                  <span className="m-auto flex pl-1 text-xs text-gray-400">
                    {
                      filterOptions[0].options.find(
                        (option) => option.value === filters.rating,
                      ).label
                    }
                  </span>
                </button>
              )}
              {filters.escalated !== null && (
                <button
                  type="button"
                  className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => {
                    setFilters((prevFilters) => {
                      return { ...prevFilters, escalated: null }
                    })
                  }}
                >
                  <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                  <span className="m-auto flex pl-1 text-xs text-gray-400">
                    {
                      filterOptions[1].options.find(
                        (option) => option.value === filters.escalated,
                      ).label
                    }
                  </span>
                </button>
              )}
              {filters.couldAnswer !== null && (
                <button
                  type="button"
                  className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => {
                    setFilters((prevFilters) => {
                      return { ...prevFilters, couldAnswer: null }
                    })
                  }}
                >
                  <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                  <span className="m-auto flex pl-1 text-xs text-gray-400">
                    {
                      filterOptions[2].options.find(
                        (option) => option.value === filters.couldAnswer,
                      ).label
                    }
                  </span>
                </button>
              )}
              {dateRange && (() => {
                const defaultStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                const defaultEndDate = new Date()
                
                const compareDates = (date1, date2) => {
                  if (!date1 || !date2) return false
                  const d1 = new Date(date1)
                  const d2 = new Date(date2)
                  return d1.getFullYear() === d2.getFullYear() &&
                         d1.getMonth() === d2.getMonth() &&
                         d1.getDate() === d2.getDate()
                }
                
                const isDefaultRange = 
                  compareDates(dateRange.startDate, defaultStartDate) &&
                  compareDates(dateRange.endDate, defaultEndDate)
                
                if (isDefaultRange) return null
                
                const formatDate = (date) => {
                  if (!date) return ''
                  const d = new Date(date)
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
                
                return (
                  <button
                    type="button"
                    className="flex items-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    onClick={() => {
                      setDateRange({
                        startDate: defaultStartDate,
                        endDate: defaultEndDate,
                      })
                    }}
                    title={`Date range: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
                  >
                    <XMarkIcon className="m-auto h-4 w-4" aria-hidden="true" />
                    <span className="m-auto flex pl-1 text-xs text-gray-400">
                      {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                    </span>
                  </button>
                )
              })()}
            </div>
              <p className="mt-2 text-sm text-gray-700">
                A log of questions and lookup answers you or users have asked your bot in the last
                90 days. Does not include non-question messages, which are available in the <Link href={`/app/bots/${bot.id}/conversations`} className="text-cyan-600 hover:text-cyan-700">conversation logs</Link>.
              </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <QuestionFilters
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
              />
              <div className="flex flex-wrap items-center gap-4 sm:gap-2 md:gap-4 sm:justify-end">
                <Tooltip content="Semantic search - finds questions by meaning, not just keywords">
                  <div className="w-full sm:w-64">
                    <div className="flex">
                      <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                        <input
                          type="text"
                          placeholder="Search logs"
                          value={localSearchInput}
                          onChange={(e) =>{ 
                            setLocalSearchInput(e.target.value)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSearch()
                            }
                          }}
                          className={clsx(
                            "col-start-1 row-start-1 block w-full min-w-0 border-0 bg-white py-2.5 pl-12 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 sm:pl-11 sm:text-sm/6 rounded-l-lg",
                            localSearchInput ? "pr-8" : "pr-4"
                          )}
                        />
                        <MagnifyingGlassIcon
                          aria-hidden="true"
                          className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400 sm:size-4"
                        />
                        {localSearchInput && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={clearSearch}
                          >
                            <XMarkIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        className="flex shrink-0 items-center border-0 rounded-r-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 hover:bg-gray-50 focus:relative focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 disabled:opacity-50"
                        onClick={handleSearch}
                        disabled={searching || !localSearchInput}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </Tooltip>
                <div className="light w-full sm:w-auto overflow-visible">
                  <Datepicker
                    value={dateRange}
                    primaryColor="cyan"
                    onChange={setDateRange}
                    showShortcuts={true}
                    useRange={false}
                    minDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
                    maxDate={new Date()}
                    classNames={{
                      container: 'z-10',
                      input: 'py-1 text-base sm:text-sm/6 border-0 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600',
                    }}
                  />
                </div>
              </div>
            </div>
            <div className={clsx("flex justify-center lg:justify-end", searching && "opacity-50 pointer-events-none")}>
              <Paginator
                perPage={questions.pagination.perPage}
                totalCount={questions.pagination.viewableCount}
                page={questions.pagination.page}
                changePage={(page) =>
                  changePage(
                    page,
                    ipFilter,
                    filters.rating,
                    filters.escalated,
                    filters.couldAnswer,
                    dateRange,
                    lastSearchedQuery,
                  )
                }
              />
            </div>
          </div>

          {openQuestion && (
            <Answer
              question={openQuestion}
              {...commonAnswerProps}
              startOpen={true}
            />
          )}

          <div className="mt-2 flow-root">
            <div className="-mx-2 -my-2">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell sm:pl-0"
                      >
                        Question
                      </th>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        Answer
                      </th>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        Sources
                      </th>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        Rating
                      </th>
                      <th
                        scope="col"
                        className="z-5 sticky top-16 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                      >
                        Could Answer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {searching && (
                      <>
                        {Array.from({ length: 4 }).map((_, index) => (
                          <QuestionSkeleton key={index} bot={bot} />
                        ))}
                      </>
                    )}
                    {!searching && questions.questions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-10 text-center text-sm text-gray-500"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <MagnifyingGlassIcon className="mb-2 h-10 w-10 text-gray-300" />
                            <p className="text-lg font-medium text-gray-900">
                              No questions found
                            </p>
                            <p className="mt-1">
                              Try adjusting your search or filters to find what
                              you're looking for.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!searching &&
                      questions.questions.map((question, questionIdx) => {
                      // if the question is deleted, show a row with a message
                      if (question.deleted) {
                        return null
                      }

                      return (
                        <tr
                          key={question.id}
                          className={clsx(
                            questionIdx +
                              questions.pagination.perPage *
                                questions.pagination.page +
                              BLUR_LIMIT_COUNT >=
                              questions.pagination.planLimit && blurEnabled
                              ? 'blur-sm'
                              : 'hover:bg-gray-50',
                            question.testing ? 'bg-gray-50' : '',
                          )}
                        >
                          <td
                            className={clsx(
                              questionIdx !== questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'hidden text-sm text-gray-500 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              <div className="flex items-center">
                                <img
                                  className="inline-block h-9 w-9 rounded-full"
                                  src={`https://api.dicebear.com/6.x/personas/svg?seed=${question.alias}?size=36&backgroundType=gradientLinear,solid&backgroundColor=FDE7E4,FFE8EF,FCF2FF,EBDFFF,EEF1FF,EAF5FF,E9FDFF,ECFFF6,F0FFE9,FFFDEE,FFF5DD,FFD9C9,EDEDED,FFFFFF,B3B3B3                              `}
                                  alt="User avatar"
                                />
                                {question.testing && (
                                  <span className="ml-2 flex items-center text-xs text-gray-400">
                                    <UserGroupIcon
                                      className="mr-1 h-4 w-4 text-gray-500"
                                      title="Staff testing"
                                    />
                                    Staff
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-xs">{question.alias}</p>
                            </Answer>
                          </td>
                          <td
                            className={clsx(
                              questionIdx !== questions.questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'max-w-xs overflow-hidden break-words text-sm font-medium text-gray-700 sm:pl-0 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              <p>
                                {question.standaloneQuestion &&
                                question.standaloneQuestion !=
                                  question.answer &&
                                bot.language == 'en'
                                  ? question.standaloneQuestion
                                  : question.question}
                              </p>
                              <span className="mt-2 hidden text-xs text-gray-400 sm:block">
                                <LocaleDateTime date={question.createdAt} />
                              </span>
                              <dl className="font-normal lg:hidden">
                                <dt className="sr-only">Answer</dt>
                                <dd className="mt-1 text-sm text-gray-600">
                                  <ShortAnswer answer={question.answer} />
                                </dd>
                                <dt className="sr-only">Sources</dt>
                                <dd className="mt-2 text-xs text-gray-500">
                                  {question.sources && question.sources.length > 0 ? (
                                    <span>
                                      {question.sources.filter(s => s?.used).length}/{question.sources.length} sources used
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">No sources</span>
                                  )}
                                </dd>
                              </dl>
                            </Answer>
                          </td>
                          <td
                            className={clsx(
                              questionIdx !== questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'hidden break-words text-sm text-gray-500 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              <ShortAnswer answer={question.answer} />
                            </Answer>
                          </td>
                          <td
                            className={clsx(
                              questionIdx !== questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'hidden truncate text-sm text-gray-500 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              {question.sources && question.sources.length > 0 ? (
                                <span className="text-xs">
                                  {question.sources.filter(s => s?.used).length}/{question.sources.length} used
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No sources</span>
                              )}
                            </Answer>
                          </td>
                          <td

                            className={clsx(
                              questionIdx !== questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'hidden whitespace-nowrap text-sm text-gray-500 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              <Rating
                                rating={question.rating}
                                escalation={question?.escalation}
                              />
                            </Answer>
                          </td>
                          <td
                            className={clsx(
                              questionIdx !== questions.length - 1
                                ? 'border-b border-gray-200'
                                : '',
                              'hidden whitespace-nowrap text-sm text-gray-500 lg:table-cell',
                            )}
                          >
                            <Answer
                              {...{ question, questionIdx }}
                              {...commonAnswerProps}
                            >
                              <CouldAnswer
                                answered={question?.couldAnswer}
                                exists={question.couldAnswer !== null}
                              />
                            </Answer>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="relative">
                    {blurEnabled && (
                      <div className="left-50 absolute bottom-0 mb-0 w-full sm:mb-24 md:mb-24 lg:mb-20 xl:mb-0">
                        <div className="py-4">
                          <Checkout team={team}>
                            <p className="mb-4 text-center text-gray-700">
                              ... and{' '}
                              {questions.pagination.totalCount -
                                questions.pagination.planLimit +
                                BLUR_LIMIT_COUNT}{' '}
                              more questions
                            </p>
                            <h3 className="text-3xl font-bold">
                              View full chat history
                            </h3>
                            <p className="mb-8 text-center text-gray-700">
                              Upgrade to the Premium plan or higher to unlock
                              the full chat history of your users to help you
                              improve your documentation and products. View{' '}
                              <Link
                                href="/pricing"
                                target="_blank"
                                className="underline"
                              >
                                plan details
                              </Link>
                              .
                            </p>
                          </Checkout>
                        </div>
                      </div>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className={clsx("mt-6 flex justify-center md:justify-end", searching && "opacity-50 pointer-events-none")}>
            <Paginator
              perPage={questions.pagination.perPage}
              totalCount={questions.pagination.viewableCount}
              page={questions.pagination.page}
              changePage={(page) =>
                changePage(
                  page,
                  ipFilter,
                  filters.rating,
                  filters.escalated,
                  filters.couldAnswer,
                  dateRange,
                  lastSearchedQuery,
                )
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}
