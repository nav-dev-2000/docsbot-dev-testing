import {
    useState,
    useEffect,
    useRef,
    Fragment,
    useMemo,
    useCallback,
} from 'react'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import {
    ChevronLeftIcon,
    DocumentTextIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    ClipboardIcon,
    CheckIcon,
    LinkIcon,
    ChevronRightIcon,
    CalendarIcon,
    ClockIcon,
    LifebuoyIcon as LifebuoyIconOutline,
    MinusCircleIcon,
    CheckCircleIcon as CheckCircleIconOutline,
    FaceSmileIcon,
    TagIcon,
    FaceFrownIcon,
    ExclamationCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    NoSymbolIcon,
    PencilSquareIcon,
    ClipboardDocumentIcon,
    UsersIcon,
    TrashIcon,
} from '@heroicons/react/24/outline'
import {
    CheckCircleIcon as CheckCircleIconSolid,
    LifebuoyIcon as LifebuoyIconSolid,
} from '@heroicons/react/24/solid'
import RobotIcon from '@/components/RobotIcon'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import { i18n } from '@/constants/strings.constants'
import TimeAgo from '@/components/TimeAgo'
import UserAvatar from '@/components/UserAvatar'
import clsx from 'clsx'
import LocaleDateTime from '@/components/LocaleDateTime'
import ModalQA from '@/components/ModalQA'
import Paginator from '@/components/Paginator'
import Tooltip from '@/components/Tooltip'
import { Dialog, Transition } from '@headlessui/react'
import ConversationMetadataViewer from '@/components/ConversationMetadataViewer'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import Workspace from '@new-dashboard/Workspace'
import { canUserEditBot } from '@/utils/function.utils'
import { auth } from '@/config/firebase-ui.config'

const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

function BotMessage({
    team,
    question,
    text,
    id,
    onRate,
    rating = 0,
    labels,
    botId,
    canModify,
}) {
    const [isCopied, setIsCopied] = useState(false)
    const [qaOpen, setQAOpen] = useState(false)

    const handleCopyText = () => {
        navigator.clipboard.writeText(text)
        setIsCopied(true)
        setTimeout(() => {
            setIsCopied(false)
        }, 1500)
    }

    return (
        <div className="mb-4 flex items-start self-end">
            <div
                dir="auto"
                className="text-md prose max-w-3xl rounded-2xl rounded-tr-none border bg-cyan-50 px-6 py-4 text-start leading-snug text-gray-700 first:prose-p:my-0 prose-pre:my-0"
            >
                <ModalQA
                    team={team}
                    botId={botId}
                    question={{ id, question, answer: text }}
                    open={qaOpen}
                    setOpen={setQAOpen}
                    hideButton={true}
                />
                <Streamdown
                    mode="static"
                    isAnimating={false}
                    remarkPlugins={streamdownRemarkPlugins}
                >
                    {preprocessMath(text)}
                </Streamdown>
                {id && (
                    <div className="mt-4 flex items-center justify-end space-x-1">
                        {canModify && (
                            <Tooltip content="Revise answer">
                                <button
                                    onClick={() => setQAOpen(true)}
                                    className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                                >
                                    <PencilSquareIcon className="h-5 w-5" />
                                </button>
                            </Tooltip>
                        )}
                        <Tooltip content="View question details">
                            <Link
                                href={`/app/bots/${botId}/analytics/questions/${id}`}
                                className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                            >
                                <LinkIcon className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <Tooltip
                            content={
                                isCopied
                                    ? 'Copied!'
                                    : 'Copy answer to clipboard'
                            }
                        >
                            <button
                                onClick={handleCopyText}
                                className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                            >
                                {isCopied ? (
                                    <CheckIcon className="h-5 w-5" />
                                ) : (
                                    <ClipboardIcon className="h-5 w-5" />
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            content={
                                rating === 1
                                    ? 'Marked as helpful'
                                    : labels.helpful
                            }
                        >
                            <button
                                type="button"
                                onClick={() => onRate(id, 1)}
                                disabled={rating === 1}
                                className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                            >
                                <span className="sr-only">
                                    {labels.helpful}
                                </span>
                                <HandThumbUpIcon
                                    className={`h-5 w-5 ${rating === 1 ? 'text-cyan-600' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                        </Tooltip>
                        <Tooltip
                            content={
                                rating === -1
                                    ? 'Marked as unhelpful'
                                    : labels.unhelpful
                            }
                        >
                            <button
                                type="button"
                                onClick={() => onRate(id, -1)}
                                disabled={rating === -1}
                                className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                            >
                                <span className="sr-only">
                                    {labels.unhelpful}
                                </span>
                                <HandThumbDownIcon
                                    className={`h-5 w-5 ${rating === -1 ? 'text-orange-600' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className="ml-3 hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-cyan-600 sm:flex lg:hidden xl:flex">
                <RobotIcon className="h-auto w-4/6 object-scale-down text-white" />
            </div>
        </div>
    )
}

function UserMessage({
    text,
    alias,
    email,
    image_urls,
    timestamp,
    showHeader,
}) {
    const [expandedImage, setExpandedImage] = useState(null)

    return (
        <>
            {showHeader && timestamp && (
                <div className="mb-1 flex max-w-3xl items-start justify-start">
                    <div className="mr-3 hidden h-10 w-10 flex-none sm:flex lg:hidden xl:flex"></div>
                    <div className="text-xs text-gray-400">
                        <LocaleDateTime date={timestamp} />
                    </div>
                </div>
            )}
            <div className="mb-4 flex max-w-3xl items-start justify-start">
                <UserAvatar
                    alias={alias}
                    email={email}
                    className="mr-3 hidden h-10 w-10 flex-none rounded-full bg-gray-50 sm:flex lg:hidden xl:flex"
                />
                {timestamp ? (
                    <Tooltip
                        content={`${new Date(timestamp).getFullYear()}-${new Date(timestamp).getMonth() + 1}-${new Date(timestamp).getDate()} ${new Date(timestamp).toLocaleTimeString('en-US')}`}
                    >
                        <div
                            dir="auto"
                            className="text-md rounded-2xl rounded-tl-none border bg-white px-6 py-4 text-start text-gray-700"
                        >
                            {image_urls && image_urls.length > 0 && (
                                <div className="mb-2 grid grid-cols-4 gap-2">
                                    {image_urls.map((imageUrl, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setExpandedImage(imageUrl)
                                            }
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
                            {text}
                        </div>
                    </Tooltip>
                ) : (
                    <div
                        dir="auto"
                        className="text-md rounded-2xl rounded-tl-none border bg-white px-6 py-4 text-start text-gray-700"
                    >
                        {image_urls && image_urls.length > 0 && (
                            <div className="mb-2 grid grid-cols-4 gap-2">
                                {image_urls.map((imageUrl, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            setExpandedImage(imageUrl)
                                        }
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
                        {text}
                    </div>
                )}
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
                                <Dialog.Panel
                                    className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
                                    onClick={() => setExpandedImage(null)}
                                >
                                    <div className="absolute right-0 top-0 z-10 pr-4 pt-4">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white/80 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setExpandedImage(null)
                                            }}
                                        >
                                            <span className="sr-only">
                                                Close
                                            </span>
                                            <XMarkIcon
                                                className="h-6 w-6"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                    <img
                                        src={expandedImage}
                                        alt="Expanded view"
                                        className="max-h-[90vh] max-w-[90vw] object-contain"
                                    />
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )
}

const emptyConversations = {
    pagination: {
        perPage: 25,
        page: 0,
        viewableCount: 0,
        totalCount: 0,
        hasMorePages: false,
        planLimit: 10,
    },
    conversations: [],
}

const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value)

const PageAnalyticsConversations = ({ team, bot, preConversations = null }) => {
    const [conversations, setConversations] = useState(
        preConversations || emptyConversations,
    )
    const router = useRouter()
    const conversationIdParam = getQueryValue(router.query.conversationId)
    const [conversation, setConversation] = useState(null)
    const [labels, setLabels] = useState(
        bot.labels || i18n[bot?.language]?.labels || i18n.en.labels,
    )
    const [errorText, setErrorText] = useState(null)
    const [ratings, setRatings] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingConversations, setIsLoadingConversations] = useState(false)
    const [hasLoadedConversations, setHasLoadedConversations] = useState(
        preConversations !== null,
    )
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [copied, setCopied] = useState(false)
    const [emailCopied, setEmailCopied] = useState(false)
    const [canModify, setModify] = useState(false)
    const [user] = useAuthState(auth)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const requestedConversationIdRef = useRef(null)
    const showLoading =
        isLoading || isLoadingConversations || !hasLoadedConversations

    // Sync state with props when they change
    useEffect(() => {
        const nextConversations = preConversations || emptyConversations
        setConversations(nextConversations)
        setConversation(null)
        setRatings({})
        setIsLoadingConversations(false)
        setHasLoadedConversations(preConversations !== null)
        requestedConversationIdRef.current = null
    }, [bot?.id, preConversations])

    const changePage = useCallback(
        async (page, ipFilter, resolved, escalated) => {
            setErrorText(null)
            setIsLoadingConversations(true)
            const urlParams = [
                'teams',
                team.id,
                'bots',
                bot.id,
                'conversations?page=' +
                    page +
                    (ipFilter !== null && ipFilter !== undefined
                        ? '&ip=' + ipFilter
                        : '') +
                    (resolved !== null && resolved !== undefined
                        ? '&resolved=' + resolved
                        : '') +
                    (escalated !== null && escalated !== undefined
                        ? '&escalated=' + escalated
                        : ''),
            ]
            const path = '/api/' + urlParams.join('/')

            try {
                const response = await fetch(path, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                if (response.ok) {
                    const data = await response.json()
                    setConversations(data)
                } else {
                    try {
                        const data = await response.json()
                        setErrorText(
                            data.message ||
                                'Something went wrong, please try again.',
                        )
                    } catch (e) {
                        setErrorText(
                            'Error ' + response.status + ', please try again.',
                        )
                    }
                }
            } catch (error) {
                setErrorText('Something went wrong, please try again.')
            } finally {
                setIsLoadingConversations(false)
                setHasLoadedConversations(true)
            }
        },
        [team.id, bot.id],
    )

    // Function to fetch a single conversation with full history
    const fetchConversation = useCallback(
        async (conversationId) => {
            setIsLoading(true)
            setErrorText(null)

            try {
                const response = await fetch(
                    `/api/teams/${team.id}/bots/${bot.id}/conversations/${conversationId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                )

                if (response.ok) {
                    const fullConversation = await response.json()

                    // Update the conversations array with the full conversation data
                    setConversations((prev) => ({
                        ...prev,
                        conversations: prev.conversations.map((conv) =>
                            conv.id === conversationId
                                ? fullConversation
                                : conv,
                        ),
                    }))

                    setConversation(fullConversation)
                } else {
                    const data = await response.json()
                    setErrorText(data.message || 'Failed to load conversation')
                }
            } catch (error) {
                console.error('Error fetching conversation:', error)
                setErrorText('Failed to load conversation')
            } finally {
                setIsLoading(false)
            }
        },
        [team.id, bot.id],
    )

    const updateConversationQuery = useCallback(
        (nextConversationId) => {
            if (!router.isReady) return

            const nextQuery = {
                ...router.query,
                tab: 'analytics',
                control: 'conversations',
            }

            delete nextQuery.questionId
            delete nextQuery.jobId

            if (nextConversationId) {
                nextQuery.conversationId = nextConversationId
            } else {
                delete nextQuery.conversationId
            }

            const currentConversationId = getQueryValue(
                router.query.conversationId,
            )
            const currentTab = getQueryValue(router.query.tab)
            const currentControl = getQueryValue(router.query.control)
            const hasExtraParams =
                'questionId' in router.query || 'jobId' in router.query

            if (
                currentConversationId === nextConversationId &&
                currentTab === 'analytics' &&
                currentControl === 'conversations' &&
                !hasExtraParams
            ) {
                return
            }

            router.replace(
                {
                    pathname: router.pathname,
                    query: nextQuery,
                },
                undefined,
                { shallow: true },
            )
        },
        [router],
    )

    const selectConversation = useCallback(
        (nextConversationId, { updateUrl = true } = {}) => {
            if (!nextConversationId) return

            if (conversation?.id === nextConversationId) {
                if (updateUrl) {
                    updateConversationQuery(nextConversationId)
                }
                return
            }

            if (
                requestedConversationIdRef.current === nextConversationId &&
                isLoading
            ) {
                return
            }

            requestedConversationIdRef.current = nextConversationId
            fetchConversation(nextConversationId)
            setRatings({})

            if (updateUrl) {
                updateConversationQuery(nextConversationId)
            }
        },
        [
            conversation?.id,
            fetchConversation,
            isLoading,
            updateConversationQuery,
        ],
    )

    useEffect(() => {
        if (!team || !user) return
        setModify(canUserEditBot(team, user.uid))
    }, [team, user])

    // Sync conversation selection with URL params
    useEffect(() => {
        if (
            !conversations.conversations ||
            conversations.conversations.length === 0
        ) {
            // Only fetch if we do not have preloaded data
            if (!hasLoadedConversations && preConversations === null) {
                changePage(0)
            }

            if (conversation) {
                setConversation(null)
            }

            if (preConversations && router.isReady && conversationIdParam) {
                updateConversationQuery(null)
            }
            return
        }

        if (!router.isReady) return

        if (conversationIdParam) {
            if (conversation?.id === conversationIdParam) return

            if (
                requestedConversationIdRef.current === conversationIdParam &&
                isLoading
            ) {
                return
            }

            const targetConversation = conversations.conversations.find(
                (c) => c.id === conversationIdParam,
            )
            if (targetConversation) {
                selectConversation(conversationIdParam, { updateUrl: false })
            } else if (conversations.conversations[0]) {
                selectConversation(conversations.conversations[0].id)
            }
            return
        }

        if (!conversation && conversations.conversations[0]) {
            selectConversation(conversations.conversations[0].id)
        } else if (conversation && !conversationIdParam) {
            updateConversationQuery(conversation.id)
        }
    }, [
        conversations.conversations,
        conversation,
        conversationIdParam,
        isLoading,
        isLoadingConversations,
        hasLoadedConversations,
        changePage,
        selectConversation,
        updateConversationQuery,
        router.isReady,
        preConversations,
    ])

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
                    setErrorText(
                        data.error || 'Something went wrong, please try again.',
                    )
                } catch (e) {
                    setErrorText('Something went wrong, please try again.')
                }
                setRatings((prev) => {
                    prev[answerId] = 0
                    return { ...prev }
                })
            }
        } catch (e) {
            console.warn(e)
            setErrorText('Something went wrong, please try again.')
            setRatings((prev) => {
                prev[answerId] = 0
                return { ...prev }
            })
        }
    }

    const currentConversationIndex = conversations.conversations.findIndex(
        (c) => c.id === conversation?.id,
    )
    const canGoPrevious = currentConversationIndex > 0
    const canGoNext =
        currentConversationIndex < conversations.conversations.length - 1 &&
        currentConversationIndex !== -1

    const handlePrevious = () => {
        if (canGoPrevious) {
            const prevConversation =
                conversations.conversations[currentConversationIndex - 1]
            selectConversation(prevConversation.id)
        }
    }

    const handleNext = () => {
        if (canGoNext) {
            const nextConversation =
                conversations.conversations[currentConversationIndex + 1]
            selectConversation(nextConversation.id)
        }
    }

    // Add new function to generate summary
    const generateSummary = async (conversationId) => {
        if (!conversationId || isSummarizing) return

        // Check if user has pro permissions
        if (!checkPlanPermission(team, 'standard').allowed) {
            setShowUpgrade(true)
            return
        }

        setIsSummarizing(true)
        setErrorText(null)

        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/conversations/${conversationId}/summarize`
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + bot.signature,
                },
            })

            if (response.ok) {
                const updatedConversation = await response.json()

                // Update conversations and current conversation with new summary and title
                setConversations((prev) => ({
                    ...prev,
                    conversations: prev.conversations.map((conv) =>
                        conv.id === conversationId
                            ? {
                                  ...conv,
                                  summary: updatedConversation.summary,
                                  title:
                                      updatedConversation.title || conv.title,
                                  sentiment:
                                      updatedConversation.sentiment ||
                                      conv.sentiment,
                                  topic:
                                      updatedConversation.topic || conv.topic,
                              }
                            : conv,
                    ),
                }))

                setConversation((prev) => ({
                    ...prev,
                    summary: updatedConversation.summary,
                    title: updatedConversation.title || prev.title,
                    sentiment: updatedConversation.sentiment || prev.sentiment,
                    topic: updatedConversation.topic || prev.topic,
                }))
            } else {
                const data = await response.json()
                setErrorText(data.message || 'Failed to generate summary')
            }
        } catch (error) {
            console.error('Error generating summary:', error)
            setErrorText('Failed to generate summary')
        } finally {
            setIsSummarizing(false)
        }
    }

    // Function to copy conversation link
    const copyConversationLink = () => {
        if (!conversation) return

        const conversationUrl = `${window.location.origin}/app/bots/${bot.id}/analytics/conversations?conversationId=${conversation.id}`
        navigator.clipboard.writeText(conversationUrl)
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    // Function to copy user email
    const copyUserEmail = () => {
        if (!conversation || !conversation.metadata?.email) return

        navigator.clipboard.writeText(conversation.metadata.email)
        setEmailCopied(true)
        setTimeout(() => {
            setEmailCopied(false)
        }, 2000)
    }

    const deleteConversation = async (conversationId) => {
        if (!canModify) return

        // If this is the first click, set confirmation state
        if (deleteConfirm !== conversationId) {
            setDeleteConfirm(conversationId)
            // Reset confirmation after 3 seconds
            setTimeout(() => {
                setDeleteConfirm(null)
            }, 3000)
            return
        }

        // Reset confirmation state
        setDeleteConfirm(null)

        const urlParams = [
            'teams',
            team.id,
            'bots',
            bot.id,
            'conversations',
            conversationId,
        ]
        const path = '/api/' + urlParams.join('/')

        const response = await fetch(path, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (response.ok) {
            setConversations((prevConversations) => {
                const conversationIndex =
                    prevConversations.conversations.findIndex(
                        (conv) => conv.id === conversationId,
                    )
                const newConversations = [...prevConversations.conversations]
                newConversations.splice(conversationIndex, 1)
                return { ...prevConversations, conversations: newConversations }
            })
            // Navigate to the previous conversation or back to bot page
            const currentIndex = conversations.conversations.findIndex(
                (conv) => conv.id === conversationId,
            )
            if (currentIndex > 0) {
                selectConversation(
                    conversations.conversations[currentIndex - 1].id,
                )
            } else if (conversations.conversations.length > 1) {
                selectConversation(
                    conversations.conversations[currentIndex + 1].id,
                )
            } else {
                // No more conversations, redirect to bot page
                window.location.href = `/app/bots/${bot.id}`
            }
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
        }
    }

    if (!bot) return null

    const title = [bot.name, 'Conversations']

    const Header = () => {
        return (
            <>
                <div className="w-full bg-white p-2 px-2 lg:px-4 lg:pr-80 xl:pr-96">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                {conversation.metadata?.name &&
                                    conversation.metadata?.email && (
                                        <Tooltip
                                            content={
                                                emailCopied
                                                    ? 'Copied!'
                                                    : `${conversation.metadata.name}<br/>${conversation.metadata.email}<br/><small>Click to copy email</small>`
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
                                                            conversation
                                                                .metadata.name
                                                        }
                                                        email={
                                                            conversation
                                                                .metadata.email
                                                        }
                                                        className="h-5 w-5 rounded-full"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        </Tooltip>
                                    )}
                                <ConversationMetadataViewer
                                    metadata={conversation?.metadata}
                                />
                                <Tooltip
                                    content={`Created: ${new Date(conversation.createdAt).toUTCString()}`}
                                >
                                    <div className="flex items-center text-sm text-gray-500">
                                        <CalendarIcon
                                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                                            aria-hidden="true"
                                        />
                                        <span className="ml-1.5 hidden xl:inline">
                                            <TimeAgo
                                                dateTime={
                                                    conversation.updatedAt
                                                }
                                            />
                                        </span>
                                    </div>
                                </Tooltip>
                                <Tooltip
                                    content={`Updated: ${new Date(conversation.updatedAt).toUTCString()}`}
                                >
                                    <div className="flex items-center text-sm text-gray-500">
                                        <ClockIcon
                                            className="h-5 w-5 flex-shrink-0 text-gray-400"
                                            aria-hidden="true"
                                        />
                                        <span className="ml-1.5 hidden xl:inline">
                                            <TimeAgo
                                                dateTime={
                                                    conversation.updatedAt
                                                }
                                            />
                                        </span>
                                    </div>
                                </Tooltip>
                                {conversation.resolved === 'confirmed' ? (
                                    <Tooltip content="Confirmed resolved by user">
                                        <div className="flex items-center text-sm text-green-600">
                                            <CheckCircleIconSolid
                                                className="h-5 w-5 flex-shrink-0 text-green-500"
                                                aria-hidden="true"
                                            />
                                            <span className="ml-1.5 hidden sm:inline">
                                                Resolved
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : conversation.resolved === 'assumed' ? (
                                    <Tooltip content="Classified as resolved by AI">
                                        <div className="flex items-center text-sm text-green-600">
                                            <CheckCircleIconOutline
                                                className="h-5 w-5 flex-shrink-0 text-green-500"
                                                aria-hidden="true"
                                            />
                                            <span className="ml-1.5 hidden sm:inline">
                                                Resolved
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : conversation.resolved === 'unresolved' ? (
                                    <Tooltip content="Confirmed unresolved by user or AI">
                                        <div className="flex items-center text-sm text-orange-500">
                                            <ExclamationCircleIcon
                                                className="h-5 w-5 flex-shrink-0 text-orange-400"
                                                aria-hidden="true"
                                            />
                                            <span className="ml-1.5 hidden sm:inline">
                                                Unresolved
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : null}
                                {conversation.escalated === 'handled' ? (
                                    <Tooltip content="User clicked escalation button">
                                        <div className="flex items-center text-sm text-blue-500">
                                            <LifebuoyIconSolid
                                                className="h-5 w-5 flex-shrink-0 text-blue-400"
                                                aria-hidden="true"
                                            />
                                            <span className="ml-1.5 hidden sm:inline">
                                                Escalated
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : conversation.escalated === 'triggered' ? (
                                    <Tooltip content="User asked to be escalated - classified by AI">
                                        <div className="flex items-center text-sm text-blue-500">
                                            <LifebuoyIconOutline
                                                className="h-5 w-5 flex-shrink-0 text-blue-400"
                                                aria-hidden="true"
                                            />
                                            <span className="ml-1.5 hidden sm:inline">
                                                Escalation Intent
                                            </span>
                                        </div>
                                    </Tooltip>
                                ) : null}
                                {conversation.sentiment ||
                                !checkPlanPermission(team, 'business')
                                    .allowed ? (
                                    <Tooltip
                                        content={
                                            !checkPlanPermission(
                                                team,
                                                'business',
                                            ).allowed
                                                ? 'Sentiment analysis requires Business plan'
                                                : `Conversation sentiment: ${conversation.sentiment.charAt(0).toUpperCase() + conversation.sentiment.slice(1)}`
                                        }
                                    >
                                        <div className="flex items-center text-sm">
                                            {!checkPlanPermission(
                                                team,
                                                'business',
                                            ).allowed ? (
                                                <div className="flex items-center text-gray-400">
                                                    <NoSymbolIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden sm:inline">
                                                        Sentiment
                                                    </span>
                                                </div>
                                            ) : conversation.sentiment ===
                                              'positive' ? (
                                                <div className="flex items-center text-green-600">
                                                    <FaceSmileIcon
                                                        className="h-5 w-5 flex-shrink-0 text-green-500"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden sm:inline">
                                                        Positive
                                                    </span>
                                                </div>
                                            ) : conversation.sentiment ===
                                              'negative' ? (
                                                <div className="flex items-center text-orange-600">
                                                    <FaceFrownIcon
                                                        className="h-5 w-5 flex-shrink-0 text-orange-500"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden sm:inline">
                                                        Negative
                                                    </span>
                                                </div>
                                            ) : conversation.sentiment ===
                                              'neutral' ? (
                                                <div className="flex items-center text-gray-600">
                                                    <MinusCircleIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-500"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden sm:inline">
                                                        Neutral
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </Tooltip>
                                ) : null}
                                {conversation.topic ||
                                !checkPlanPermission(team, 'business')
                                    .allowed ? (
                                    <Tooltip
                                        content={
                                            !checkPlanPermission(
                                                team,
                                                'business',
                                            ).allowed
                                                ? 'Topic categorization requires Business plan'
                                                : `Conversation topic: ${conversation.topic}`
                                        }
                                    >
                                        <div className="flex items-center text-sm">
                                            {!checkPlanPermission(
                                                team,
                                                'business',
                                            ).allowed ? (
                                                <div className="flex items-center text-gray-400">
                                                    <NoSymbolIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden sm:inline">
                                                        Topic
                                                    </span>
                                                </div>
                                            ) : conversation.topic ? (
                                                <div className="flex items-center text-gray-500">
                                                    <TagIcon
                                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="ml-1.5 hidden capitalize sm:inline">
                                                        {conversation.topic}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </Tooltip>
                                ) : null}
                            </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-4 lg:mr-2 xl:mr-4">
                            <Tooltip
                                content={
                                    copied
                                        ? 'Copied!'
                                        : 'Copy a link to this conversation to share with team members or support.'
                                }
                            >
                                <button
                                    className="flex items-center text-gray-400 hover:text-gray-600"
                                    onClick={copyConversationLink}
                                    disabled={copied}
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
                                        deleteConfirm === conversation.id
                                            ? 'Click again to confirm deletion'
                                            : 'Delete this conversation'
                                    }
                                >
                                    <button
                                        className={`flex items-center rounded-md p-1 ${
                                            deleteConfirm === conversation.id
                                                ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                                                : 'text-gray-400 hover:text-red-600'
                                        }`}
                                        onClick={() =>
                                            deleteConversation(conversation.id)
                                        }
                                    >
                                        <TrashIcon
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </Tooltip>
                            )}

                            <Paginator
                                perPage={conversations.pagination.perPage}
                                totalCount={
                                    conversations.pagination.viewableCount
                                }
                                page={conversations.pagination.page}
                                changePage={(page) => changePage(page)}
                            />
                        </div>
                    </div>
                </div>
                {conversation.title && (
                    <div className="w-full border-b border-t border-gray-200 bg-white px-4 pt-4 lg:px-6 lg:pr-80 xl:pr-96">
                        <div className="flex flex-col pb-5 lg:flex-row lg:items-start lg:justify-between lg:pr-2 xl:pr-4">
                            <div className="w-full items-center justify-between sm:flex">
                                <div>
                                    <h2 className="my-0 text-base font-semibold text-gray-900">
                                        {conversation.title}
                                    </h2>
                                    {conversation.summary && (
                                        <div className="mt-4 flex-1 text-sm text-gray-500">
                                            {conversation.summary}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-0 mt-4 flex-none sm:ml-4 sm:mt-0">
                                    {conversation.summary ? (
                                        <Tooltip
                                            content={
                                                isSummarizing
                                                    ? 'Refreshing summary...'
                                                    : 'Refresh summary'
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    generateSummary(
                                                        conversation.id,
                                                    )
                                                }
                                                disabled={isSummarizing}
                                                className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <ArrowPathIcon
                                                    className={clsx(
                                                        'h-5 w-5',
                                                        isSummarizing &&
                                                            'animate-spin',
                                                    )}
                                                />
                                            </button>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                generateSummary(conversation.id)
                                            }
                                            disabled={isSummarizing}
                                            className="inline-flex flex-none items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <DocumentTextIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                                            {isSummarizing
                                                ? 'Generating summary...'
                                                : 'Generate summary'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <>
            {conversation && <Header />}

            <ModalCheckout
                team={team}
                open={showUpgrade}
                setOpen={setShowUpgrade}
            />
            <main className="relative h-full overflow-y-auto lg:pr-80 xl:pr-96">
                <Alert title={errorText} type="warning" />
                <div className="mx-auto max-w-4xl bg-gray-50 py-2 lg:py-4">
                    {showLoading ? (
                        <Workspace.Loader
                            message="Loading conversation..."
                            variant="conversations-main"
                        />
                    ) : conversation ? (
                        <div className="relative flex h-full flex-col overflow-y-scroll px-3 pt-4">
                            {conversation.truncated && (
                                <>
                                    <div className="mb-4 flex max-w-3xl items-start justify-start opacity-50">
                                        <UserAvatar
                                            alias={conversation.alias}
                                            email={conversation.email}
                                            className="mr-3 hidden h-10 w-10 flex-none rounded-full bg-gray-50 sm:flex lg:hidden xl:flex"
                                        />
                                        <div className="rounded-2xl rounded-tl-none border bg-white px-8 py-2 text-xl text-gray-400">
                                            ⋯
                                        </div>
                                    </div>
                                    <div className="mb-4 flex items-start self-end opacity-50">
                                        <div className="prose max-w-3xl rounded-2xl rounded-tr-none border bg-cyan-50 px-8 py-2 text-xl leading-snug text-gray-400 prose-pre:my-0">
                                            ⋯
                                        </div>
                                        <div className="ml-3 hidden h-10 w-10 flex-none items-center justify-center rounded-full bg-cyan-600 sm:flex lg:hidden xl:flex">
                                            <RobotIcon className="h-auto w-4/6 object-scale-down text-white" />
                                        </div>
                                    </div>
                                    <div className="relative mb-4 flex items-center justify-center">
                                        <div className="absolute inset-0 mx-auto flex max-w-xl items-center">
                                            <div className="w-full border-t border-dashed border-gray-200"></div>
                                        </div>
                                        <Tooltip content="Some older messages have been truncated due to length limits. You can still view all individual messages in the question logs">
                                            <div className="relative rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-500">
                                                Earlier messages truncated
                                            </div>
                                        </Tooltip>
                                    </div>
                                </>
                            )}
                            {conversation.history.map((message, index) => {
                                const prevMessage =
                                    index > 0
                                        ? conversation.history[index - 1]
                                        : null
                                if (message['Human']) {
                                    const currentTs = message.timestamp
                                    const prevTs = prevMessage?.timestamp
                                    const showHeader =
                                        currentTs && prevTs
                                            ? new Date(currentTs).getTime() -
                                                  new Date(prevTs).getTime() >
                                              1000 * 60 * 60
                                            : false
                                    return (
                                        <UserMessage
                                            text={message['Human']}
                                            alias={conversation.alias}
                                            email={conversation.email}
                                            image_urls={message.image_urls}
                                            timestamp={message.timestamp}
                                            showHeader={showHeader}
                                            key={index}
                                        />
                                    )
                                } else if (message['AI']) {
                                    return (
                                        <BotMessage
                                            key={index}
                                            team={team}
                                            question={prevMessage?.['Human']}
                                            text={message['AI']}
                                            id={message.id}
                                            onRate={setRating}
                                            rating={
                                                ratings[message.id] ||
                                                message.rating ||
                                                0
                                            }
                                            labels={labels}
                                            botId={bot.id}
                                            canModify={canModify}
                                        />
                                    )
                                }
                            })}
                            {/* Conversation Navigation Buttons */}
                            <div className="mb-1 mt-8 flex justify-between border-t pt-4">
                                <button
                                    onClick={handlePrevious}
                                    disabled={!canGoPrevious}
                                    className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeftIcon
                                        className="-ml-1 mr-2 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    Previous
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!canGoNext}
                                    className="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRightIcon
                                        className="-mr-1 ml-2 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center p-8 text-gray-500">
                            No recorded conversations yet. Go ahead and{' '}
                            <Link
                                href={`/app/bots/${bot.id}`}
                                className="ml-1 text-cyan-600 hover:text-cyan-700"
                            >
                                chat with your bot
                            </Link>
                            !
                        </div>
                    )}
                </div>
            </main>

            <aside className="absolute inset-y-0 right-0 hidden w-80 overflow-y-auto border-l border-gray-200 bg-white pt-16 lg:block xl:w-96">
                {showLoading ? (
                    <Workspace.Loader variant="conversations-sidebar" />
                ) : (
                    conversations && (
                        <ul role="list" className="divide-y divide-gray-100">
                            {conversations.conversations.map((convo) => (
                                <li
                                    key={convo.id}
                                    className={clsx(
                                        'relative flex items-center justify-between gap-x-4 px-2 py-5 hover:bg-gray-50 lg:px-4',
                                        conversation &&
                                            convo.id === conversation.id
                                            ? 'bg-cyan-50 shadow-inner hover:bg-cyan-50'
                                            : 'bg-white',
                                    )}
                                >
                                    <div className="absolute right-2 top-2 flex space-x-1 lg:right-4">
                                        {convo.resolved === 'confirmed' ? (
                                            <Tooltip content="Confirmed by user">
                                                <CheckCircleIconSolid
                                                    className="h-4 w-4 flex-shrink-0 text-green-500"
                                                    aria-hidden="true"
                                                />
                                            </Tooltip>
                                        ) : convo.resolved === 'assumed' ? (
                                            <Tooltip content="Classified as resolved by AI">
                                                <CheckCircleIconOutline
                                                    className="h-4 w-4 flex-shrink-0 text-green-500"
                                                    aria-hidden="true"
                                                />
                                            </Tooltip>
                                        ) : convo.resolved === 'unresolved' ? (
                                            <Tooltip content="Confirmed by user or classified by AI">
                                                <MinusCircleIcon
                                                    className="h-4 w-4 flex-shrink-0 text-orange-400"
                                                    aria-hidden="true"
                                                />
                                            </Tooltip>
                                        ) : null}
                                        {convo.escalated === 'handled' ? (
                                            <Tooltip content="User clicked escalation button">
                                                <LifebuoyIconSolid
                                                    className="h-4 w-4 flex-shrink-0 text-blue-400"
                                                    aria-hidden="true"
                                                />
                                            </Tooltip>
                                        ) : convo.escalated === 'triggered' ? (
                                            <Tooltip content="User asked to be escalated - classified by AI">
                                                <LifebuoyIconOutline
                                                    className="h-4 w-4 flex-shrink-0 text-blue-400"
                                                    aria-hidden="true"
                                                />
                                            </Tooltip>
                                        ) : null}
                                    </div>
                                    <UserAvatar
                                        alias={convo.alias}
                                        email={convo.metadata?.email}
                                        className="h-10 w-10 flex-none rounded-full bg-gray-50"
                                    />
                                    <div className="min-w-0 flex-auto">
                                        <div className="flex items-baseline justify-between gap-x-4">
                                            <p
                                                className="truncate text-left text-xs font-semibold leading-6 text-gray-900"
                                                style={{
                                                    maxWidth:
                                                        'calc(100% - 50px)',
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        selectConversation(
                                                            convo.id,
                                                        )
                                                    }}
                                                >
                                                    <span className="absolute inset-x-0 -top-px bottom-0" />
                                                    {convo.alias}
                                                </button>
                                            </p>
                                            <Tooltip
                                                content={`Updated: ${new Date(convo.updatedAt).toUTCString()}`}
                                            >
                                                <p className="flex-none text-xs text-gray-600">
                                                    <TimeAgo
                                                        dateTime={
                                                            convo.updatedAt
                                                        }
                                                    />
                                                </p>
                                            </Tooltip>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
                                            {convo.title ?? ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </aside>
        </>
    )
}

export default PageAnalyticsConversations
