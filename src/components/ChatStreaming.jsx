import { useEffect, useState, useRef } from 'react'
import {
  HandThumbDownIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  LinkIcon,
  UserCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'
import remarkExternalLinks from 'remark-external-links'
import Alert from '@/components/Alert'
import RobotIcon from '@/components/RobotIcon'
import classNames from '@/utils/classNames'
import LoadingDots from './LoadingDots'
import { grabQuestions } from '@/utils/helpers'

export default function Chat({ teamId, bot }) {
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answerHtml, setAnswerHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [errorText, setErrorText] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [ratings, setRatings] = useState({})
  const [questions, setQuestions] = useState(bot.questions ? (bot.questions.length > 3 ? grabQuestions(bot) : bot.questions) : [])

  //clear error text when question changes
  useEffect(() => {
    if (question) {
      setErrorText(null)
    }
  }, [question])

  //convert markdown to html when answer changes or is appended to
  useEffect(() => {
    if (currentAnswer) {
      remark()
        .use(html)
        .use(remarkGfm)
        .use(remarkExternalLinks, { target: '_blank', rel: ['noopener'] })
        .process(currentAnswer)
        .then((html) => {
          setAnswerHtml(html.toString())
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
  const askQuestion = async () => {
    if (!question || question.length < 5) {
      setErrorText('Please enter a full question.')
      return
    }
    setLoading(true)
    setErrorText(null)
    setAnswerHtml('')
    setCurrentAnswer('')
    setLoadingMessage('Sending...')

    //get apiBase from env
    const apiUrl = `${process.env.NEXT_PUBLIC_BOT_WEBSOCKET}/teams/${teamId}/bots/${bot.id}/chat`
    const ws = new WebSocket(apiUrl)

    // Send message to server when connection is established
    ws.onopen = function (event) {
      setLoadingMessage('Thinking...')
      setAnswers((prev) => {
        //add new question
        return [...prev, { type: 'question', question: question }]
      })
      setQuestion('')

      const req = { question: question, markdown: true, history: chatHistory }
      if (bot.privacy === 'private') {
        //add token to request
        req.auth = bot.signature
      }
      ws.send(JSON.stringify(req))
    }

    ws.onerror = function (event) {
      console.log('error', event)
      setLoading(false)
      setLoadingMessage(null)
      setErrorText('There was a connection error. Please try again.')
      //strip all empty answers
      if (answers.length > 0) {
        setAnswers((prev) => {
          return [...prev.filter((a) => a.type !== 'answer' || a.html)]
        })
      }
    }

    ws.onclose = function (event) {
      if (!event.wasClean) {
        setLoading(false)
        setLoadingMessage(null)
        setErrorText('Network error, please try again.')
        //strip all empty answers
        if (answers.length > 0) {
          setAnswers((prev) => {
            return [...prev.filter((a) => a.type !== 'answer' || a.html)]
          })
        }
      }
    }

    // Receive message from server word by word. Display the words as they are received.
    ws.onmessage = function (event) {
      const data = JSON.parse(event.data)
      if (data.sender === 'bot') {
        if (data.type === 'start') {
          setLoadingMessage('Checking my sources...')
          setAnswers((prev) => {
            //add new question
            return [...prev, { type: 'answer', html: null, rating: 0 }]
          })
        } else if (data.type === 'stream') {
          setLoadingMessage('Answering...')
          //append to answer
          setCurrentAnswer((prev) => {
            return prev + data.message
          })
        } else if (data.type === 'info') {
          setLoadingMessage(data.message)
        } else if (data.type === 'end') {
          const endData = JSON.parse(data.message)
          setChatHistory(endData.history)
          setCurrentAnswer(endData.answer)
          setAnswers((prev) => {
            prev[prev.length - 1].sources = endData.sources
            prev[prev.length - 1].id = endData.id
            return prev
          })
          setLoading(false)
          setLoadingMessage(null)
          ws.close()
        } else if (data.type === 'error') {
          setErrorText(data.message)
          //strip all empty answers
          if (answers.length > 0) {
            setAnswers((prev) => {
              return [...prev.filter((a) => a.type !== 'answer' || a.html)]
            })
          }
          setLoading(false)
          setLoadingMessage(null)
          ws.close()
        }
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

    const apiUrl = `https://api.docsbot.ai/teams/${teamId}/bots/${bot.id}/rate/${answerId}`
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

  const Source = ({ source }) => {
    const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
    const page = source.page ? ` - Page ${source.page}` : ''

    return (
      <div className="flex items-center">
        <SourceIcon className="mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />
        {source.url ? (
          <Link href={source.url} target="_blank" className="focus:outline-none">
            <p className="text-left text-sm font-medium text-gray-500">
              {source.title}
              {page}
            </p>
          </Link>
        ) : (
          <p className="text-left text-sm font-medium text-gray-500">
            {source.title || source.url}
            {page}
          </p>
        )}
      </div>
    )
  }

  const ChatRow = ({ answer }) => {
    if (answer.type === 'question') {
      return (
        <div className="relative mt-4 max-w-fit rounded-md bg-teal-50 text-left shadow-sm sm:rounded-lg">
          <div className="absolute -inset-7 flex h-28 items-center text-2xl font-extrabold tracking-tighter">
            <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-lg">
              <UserCircleIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </span>
          </div>
          <div className="prose min-w-full p-4 px-6 sm:px-8">{answer.question}</div>
        </div>
      )
    } else {
      return (
        <div
          className="relative mt-4 rounded-md border bg-white text-left shadow-sm sm:rounded-lg"
          id={answer.id || null}
        >
          <div className="absolute -inset-7 flex h-32 items-center text-2xl font-extrabold tracking-tighter">
            <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-2 shadow-lg">
              <RobotIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </span>
          </div>
          {answer.html ? (
            <div
              className={classNames(
                answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '',
                'prose min-w-full p-6 sm:px-8'
              )}
              dangerouslySetInnerHTML={{ __html: answer.html }}
            />
          ) : (
            <div
              className={classNames(
                answer.sources?.length > 0 ? 'pb-2 sm:pb-2' : '',
                'prose min-w-full p-6 sm:px-8'
              )}
            >
              <LoadingDots />
            </div>
          )}

          {answer.sources?.length > 0 && (
            <div className="relative px-6 pb-4 pr-4 sm:px-8 sm:pr-4">
              <div className="text-sm font-semibold text-gray-800">Sources:</div>
              <div className="items-end justify-between sm:flex">
                <div
                  className={classNames(
                    answer.sources.length == 2 ? 'sm:grid-cols-2' : '',
                    answer.sources.length == 3 ? 'lg:grid-cols-3' : '',
                    answer.sources.length == 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : '',
                    'grid grid-cols-1 gap-4'
                  )}
                >
                  {answer.sources.map((source, index) => (
                    <Source key={index} source={source} />
                  ))}
                </div>
                {answer.id && (
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      type="button"
                      onClick={() => setRating(answer.id, 1)}
                      disabled={ratings[answer.id] === 1}
                      className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                    >
                      <span className="sr-only">Unhelpful</span>
                      <HandThumbUpIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(answer.id, -1)}
                      disabled={ratings[answer.id] === -1}
                      className="rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:text-cyan-600"
                    >
                      <span className="sr-only">Helpful</span>
                      <HandThumbDownIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="relative py-8 px-4">
      <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
        <div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {bot.name}
          </p>
          <p className="mx-auto mt-5 max-w-prose text-xl text-gray-500">{bot.description}</p>
        </div>
        <div className="mt-12">
          {answers.map((answer, index) => (
            <ChatRow key={index} answer={answer} />
          ))}

          <Alert title={errorText} type="warning" />
          <form
            className="mt-10 flex justify-center"
            onSubmit={(e) => {
              e.preventDefault()
              if (!loading) {
                askQuestion()
              }
            }}
            disabled={loading}
          >
            <div className="mt-1 w-full rounded-md sm:flex sm:shadow-sm">
              <div className="relative flex w-full flex-grow items-center shadow-sm sm:shadow-inherit">
                <input
                  type="text"
                  name="query"
                  id="query"
                  value={question}
                  maxLength={2000}
                  minLength={5}
                  required
                  onChange={(e) => setQuestion(e.target.value)}
                  tabIndex={1}
                  autoComplete="off"
                  className="block w-full rounded-md border-gray-300 py-4 pl-4 pr-10 text-sm focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 sm:py-2 sm:pl-6 sm:pr-12 sm:text-lg"
                  placeholder={answers.length ? '' : 'What can I help you with?'}
                />

                <button
                  type="submit"
                  tabIndex={2}
                  disabled={loading}
                  className="absolute right-0 mr-3 text-cyan-600  hover:text-cyan-700 focus:ring-cyan-400"
                >
                  <span className="sr-only">Ask</span>
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
          </form>

          <div className="mt-3 items-center justify-between sm:flex">
            {questions &&
              questions.length > 0 &&
              questions.map((recommendedQuestion) => (
                <button
                  type="button"
                  className="mr-2 flex items-center justify-center text-cyan-700 hover:text-cyan-800 focus:ring-cyan-600 focus:ring-offset-cyan-50"
                  onClick={() => {
                    setQuestion(recommendedQuestion)
                    askQuestion()
                  }}
                  key={recommendedQuestion}
                >
                  <LightBulbIcon className="mr-1 h-5 w-5 text-cyan-700" aria-hidden="true" />
                  <p className="text-left text-xs">{recommendedQuestion}</p>
                </button>
              ))}
          </div>

        </div>
      </div>
    </div>
  )
}
