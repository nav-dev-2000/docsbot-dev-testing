import { useEffect, useState, useRef, Fragment } from 'react'
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
  BeakerIcon,
  PhotoIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import {
  PaperAirplaneIcon,
  BeakerIcon as BeakerIconSolid,
} from '@heroicons/react/24/solid'
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

export default function Chat({ team, bot, showResearchMode = false }) {
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answerHtml, setAnswerHtml] = useState('')
  const [currentSource, setCurrentSource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [canModify, setModify] = useState(false)
  const [ratings, setRatings] = useState({})
  const [isResearchMode, setIsResearchMode] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)
  const [researchDisabled, setResearchDisabled] = useState(
    bot.model === 'gpt-3.5-turbo-0613',
  )
  const [conversationId, setConversationId] = useState(uuidv4())
  const [selectedModel, setSelectedModel] = useState(bot.model)
  const [questions, setQuestions] = useState(
    bot.questions
      ? bot.questions.length >= 4
        ? grabQuestions(bot)
        : bot.questions.slice(0, 2)
      : [],
  )
  const [isCopied, setIsCopied] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const [screenWidth, setScreenWidth] = useState(null)
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

  const validModels = [
    /* not yet supported in API
    { id: 'o3', name: 'o3', description: 'Uses advanced reasoning - requires verification' },
    {
      id: 'o4-mini',
      name: 'o4-mini',
      description: 'Fastest at advanced reasoning - requires verification',
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      description: 'Great at coding and visual reasoning',
    },
    { id: 'o1', name: 'o1', description: 'Uses advanced reasoning' },
    */
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description:
        'Most capable general-purpose model for better instruction following',
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
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Great for most tasks' },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o mini',
      description: 'Faster for everyday tasks',
    },
  ]

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid))
  }, [team, user])

  useEffect(() => {
    const handleScreenChange = () => {
      setScreenWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleScreenChange)
    return () => {
      window.removeEventListener('resize', handleScreenChange)
    }
  }, [])

  useEffect(() => {
    let timeoutId = null
    timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [screenWidth])

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

  //convert markdown to html when answer changes or is appended to
  useEffect(() => {
    if (currentAnswer) {
      // Remove incomplete markdown images, but keep the alt text
      let filteredAnswer = currentAnswer.replace(
        /!\[([^\]]*?)(?:\](?:\([^)]*)?)?$/gm,
        '$1',
      )
      // Remove incomplete markdown links, but keep the link text
      filteredAnswer = filteredAnswer.replace(
        /\[([^\]]*?)(?:\](?:\([^)"]*(?:"[^"]*")?[^)]*)?)?$/gm,
        '$1',
      )

      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
        .use(remarkMath, {
          singleDollarTextMath: false,
        })
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)
        .process(preprocessLaTeX(filteredAnswer))
        .then((file) => {
          setAnswerHtml(String(file))
        })
        .catch((error) => {
          console.error('Error processing markdown:', error)
        })
    }
  }, [currentAnswer])

  //update answer html when answers change
  useEffect(() => {
    if (answers.length > 0 && answerHtml) {
      const lastAnswer = answers[answers.length - 1]
      if (lastAnswer.type === 'answer') {
        setAnswers((prev) => {
          //edit last answer
          prev[prev.length - 1].html = answerHtml
          return [...prev]
        })
      }
    }
  }, [answerHtml])

  // make api call to ask question
  const askQuestion = async (askedQuestion) => {
    if (!askedQuestion || askedQuestion.length < 2) {
      setErrorText('Please enter a full question.')
      return
    }
    setLoading(true)
    setErrorText(null)
    setAnswerHtml('')
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
    if (isResearchMode) {
      body.context_items = 16
    } else {
      body.context_items = 6
      body.autocut = 2
    }

    //only send model if they can
    if (team?.supportsGPT4 && team?.openAIKey && checkPlanPermission(team, 'hobby').allowed) {
      body.model = selectedModel
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
                return [...prev, { type: 'answer', html: null, rating: 0 }]
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
              const newAnswer = prev + msg.data
              return newAnswer
            })
          } else if (msg.event === 'error') {
            setLoading(false)
            setErrorText(msg.data)
            //strip all empty answers
            if (answers.length > 0) {
              setAnswers((prev) => {
                return [...prev.filter((a) => a.type !== 'answer' || a.html)]
              })
            }
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
                if (answers.length > 0) {
                  setAnswers((prev) => {
                    return [
                      ...prev.filter((a) => a.type !== 'answer' || a.html),
                    ]
                  })
                }
                return false
              }

              console.log(endData)

              // Check if history exists before setting it
              if (endData.history) {
                setChatHistory(endData.history)
              }

              if (msg.event === 'is_resolved_question') {
                setAnswers((prev) => {
                  //add new answer
                  return [
                    ...prev,
                    {
                      type: 'answer',
                      html: endData.answer,
                      markdown: endData.answer,
                      rating: 0,
                      id: endData.id,
                      options: endData.options,
                    },
                  ]
                })
                setCurrentAnswer(endData.answer)
              } else {
                if (endData.answer) {
                  setCurrentAnswer(endData.answer)
                }

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
                    }
                  }
                  return newPrev
                })
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
              if (answers.length > 0) {
                setAnswers((prev) => {
                  return [...prev.filter((a) => a.type !== 'answer' || a.html)]
                })
              }
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
            if (answers.length > 0) {
              setAnswers((prev) => {
                return [...prev.filter((a) => a.type !== 'answer' || a.html)]
              })
            }
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
              if (answers.length > 0) {
                setAnswers((prev) => {
                  return [...prev.filter((a) => a.type !== 'answer' || a.html)]
                })
              }
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
              if (answers.length > 0) {
                setAnswers((prev) => {
                  return [...prev.filter((a) => a.type !== 'answer' || a.html)]
                })
              }
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
      if (answers.length > 0) {
        setAnswers((prev) => {
          return [...prev.filter((a) => a.type !== 'answer' || a.html)]
        })
      }
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
    const [content, setContent] = useState(null)

    //convert markdown to html when answer changes or is appended to
    useEffect(() => {
      if (currentSource?.content) {
        unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
          .use(remarkMath, { singleDollarTextMath: false })
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(preprocessLaTeX(currentSource?.content))
          .then((file) => {
            setContent(String(file))
          })
          .catch((error) => {
            console.error('Error processing markdown:', error)
          })
      }
    }, [currentSource])

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
                      <div
                        className="prose mt-4 min-w-full text-left"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
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

    if (source.used === false && !isResearchMode) return null

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

    if (source.used === false && !isResearchMode) return null

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

  const ChatRow = ({ answer, question }) => {
    const gridItemRef = useRef(null)
    const [expandedImage, setExpandedImage] = useState(null)
    const [qaOpen, setQAOpen] = useState(false)

    useEffect(() => {
      if (gridItemRef.current) {
        const gridItems = gridItemRef.current.children

        let maxItemHeight = 0
        Array.from(gridItems).forEach((item) => {
          const height = item.offsetHeight
          if (height > maxItemHeight) {
            maxItemHeight = height
          }
        })

        // Only set height if we found a valid height
        if (maxItemHeight > 0) {
          Array.from(gridItems).forEach((item) => {
            item.style.height = `${maxItemHeight}px`
          })
        }
      }
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
              {answer.images && answer.images.length > 0 && (
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
      return (
        <div
          ref={gridItemRef}
          className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-12')}
        >
          <div
            className={clsx(
              'relative col-span-1 mt-4 h-fit rounded-md border bg-white text-left shadow-sm sm:col-span-8 sm:rounded-lg',
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
          {answer.html ? (
              <div dir="auto" className={clsx(answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '', 'prose min-w-full p-6 text-start sm:px-8')} dangerouslySetInnerHTML={{ __html: answer.html }} />
            ) : (
              <div
                className={clsx(
                  answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '',
                  'prose min-w-full p-6 sm:px-8',
                )}
              >
                <LoadingDots />
              </div>
            )}

            {(answer.markdown) && (
              <div
                className={clsx(
                  'flex items-end justify-between px-6 pb-4 pr-4 sm:justify-end sm:px-8 sm:pr-4',
                )}
              >
                {answer.sources?.length > 0 && answer.sources.filter(source => !(source.used === false && !isResearchMode)).length > 0 && !hideSources && (
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
          {answer.sources?.length > 0 && answer.sources.filter(source => !(source.used === false && !isResearchMode)).length > 0 && (
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
  }

  const ModelSelector = () => {
    const isDisabled =
      !team?.supportsGPT4 ||
      !team?.openAIKey ||
      !checkPlanPermission(team, 'hobby').allowed
    const tooltipContent = isDisabled
      ? !team?.supportsGPT4
        ? 'GPT-4 access required. Please upgrade your plan or add an OpenAI API key with credit.'
        : !team?.openAIKey
          ? 'OpenAI API key required to change models. Configure on the API page.'
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
          {answers.map((answer, index) => (
            <ChatRow
              key={index}
              answer={answer}
              question={answers[index - 1]?.question}
            />
          ))}

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
                          ? 'Enable research mode'
                          : 'Upgrade to the Personal plan to enable research mode'
                      }
                    >
                      <button
                        type="button"
                        className={clsx(
                          'rounded-md p-2 hover:text-cyan-600',
                          isResearchMode
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
                          setIsResearchMode((prev) => !prev)
                        }}
                      >
                        {isResearchMode ? (
                          <BeakerIconSolid className="h-5 w-5" />
                        ) : (
                          <BeakerIcon className="h-5 w-5" />
                        )}
                      </button>
                    </Tooltip>
                  )}
                  <ModelSelector />
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
              {isResearchMode && showResearchMode ? (
                <p className="hidden max-w-prose text-left text-xs text-gray-500 sm:block">
                  Note: Enabling Research Mode passes more source context in
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
