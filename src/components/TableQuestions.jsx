import clsx from 'clsx'
import { useEffect, useState, useRef, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  HandThumbDownIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  LinkIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Paginator from '@/components/Paginator'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'

export default function TableQuestions({ questions, changePage }) {
  const [ipFilter, setIPFilter] = useState(null)
  const Sources = ({ sources }) => {
    return (
      <ul className="my-0 list-none py-0">
        {sources.map((source, index) => (
          <Source key={index} source={source} />
        ))}
      </ul>
    )
  }

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

  const FullSource = ({ source }) => {
    const SourceIcon = source.url ? LinkIcon : DocumentTextIcon
    const page = source.page ? ` - Page ${source.page}` : ''

    return (
      <>
        <h4 className="mb-2 flex items-center text-sm text-gray-500">
          <SourceIcon className="mr-1 h-3 w-3 text-gray-400" aria-hidden="true" />
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
      </>
    )
  }

  const Rating = ({ rating }) => {
    const ThumbIcon = rating > 0 ? HandThumbUpIcon : rating < 0 ? HandThumbDownIcon : null

    if (!ThumbIcon) return null

    return (
      <>
        <span className="sr-only">{rating > 0 ? 'Up vote' : 'Down vote'}</span>
        <ThumbIcon
          className={clsx(rating > 0 ? 'text-green-600' : 'text-red-600', 'h-6 w-6')}
          aria-hidden="true"
        />
      </>
    )
  }

  const Answer = ({ question, children }) => {
    const [open, setOpen] = useState(false)
    const [answerHtml, setAnswerHtml] = useState(null)
    const [shortAnswer, setShortAnswer] = useState(question.answer)

    useEffect(() => {
      if (question.answer) {
        if (question.answer.length > 300) {
          setShortAnswer(question.answer.substring(0, 300) + '...')
        }
        remark()
          .use(html)
          .use(remarkGfm)
          .process(question.answer)
          .then((html) => {
            setAnswerHtml(html.toString())
          })
      }
    }, [question.answer])

    return (
      <>
        <a
          type="button"
          className="m-0 block cursor-pointer px-3 py-4"
          onClick={() => setOpen(true)}
        >
          {children}
        </a>
        <Transition.Root show={open} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setOpen}>
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

            <div className="fixed inset-0 z-10 overflow-y-auto">
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
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        onClick={() => setOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="p-8">
                      <h2 className="text-md font-medium text-gray-400">IP Hash {question.ip} said:</h2>
                      <h2 className="text-xl font-medium text-gray-900">{question.question}</h2>

                      <div
                        className="prose mt-2 w-full max-w-none"
                        dangerouslySetInnerHTML={{ __html: answerHtml }}
                      />

                      <h3 className="mt-2 text-base font-medium text-gray-700">Used Sources:</h3>
                      {question.sources.map((source, index) => (
                        <FullSource key={index} source={source} />
                      ))}
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

  const ShortAnswer = ({ answer }) => {
    const [shortAnswer, setShortAnswer] = useState(answer)

    useEffect(() => {
      if (answer.length > 300) {
        setShortAnswer(answer.substring(0, 300) + '...')
      }
    }, [answer])

    return <>{shortAnswer}</>
  }

  const updateIPFilter = (ip) => {
    setIPFilter((ipFilter) => {
      if (ipFilter === null) {
        return ip
      } else {
        return null
      }
    })
  }

  return (
    <div className="mx-0 rounded-lg bg-white p-4 shadow-lg lg:p-8">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold leading-6 text-gray-900">Questions</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all the questions you or users have asked your bot.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Paginator
              perPage={questions.pagination.perPage}
              totalCount={questions.pagination.totalCount}
              page={questions.pagination.page}
              changePage={changePage}
            />
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                    >
                      IP hash
                    </th>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell sm:pl-0"
                    >
                      Question
                    </th>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                    >
                      Answer
                    </th>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                    >
                      Sources
                    </th>
                    <th
                      scope="col"
                      className="sticky top-16 z-10 hidden border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell"
                    >
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.questions.map((question, questionIdx) => {
                    if (ipFilter !== null && question.ip !== ipFilter) {
                      return null
                    }

                    return (
                      <tr key={question.id} className="hover:bg-gray-50">
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden text-sm text-gray-500 lg:table-cell'
                          )}
                        >
                          <Answer {...{ question }}>
                            {question.isChat ? (
                              <ChatBubbleLeftEllipsisIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                                title="Chat"
                              />
                            ) : (
                              <QuestionMarkCircleIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                                title="Q / A"
                              />
                            )}
                          </Answer>
                        </td>
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'max-w-xs overflow-hidden text-sm font-medium text-gray-700 sm:pl-0 lg:table-cell'
                          )}
                        >
                          {(question.ip !== undefined && question.ip !== null && question.ip !== "") && (
                            <div className='p-1'>
                              <span className="mt-2 hidden text-xs text-gray-400 sm:block truncate">
                                {question.ip}
                              </span>
                              <button
                                type="button"
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex"
                                onClick={() => {updateIPFilter(question.ip)}}>
                                <span className="pl-1 m-auto hidden text-xs text-gray-400 sm:block">Filter</span>
                                {ipFilter === null ? <AdjustmentsHorizontalIcon className="m-auto h-6 w-6" aria-hidden="true" /> : <XMarkIcon className="m-auto h-6 w-6" aria-hidden="true" />}
                              </button>
                            </div>
                          )}
                        </td>
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'max-w-xs overflow-hidden text-sm font-medium text-gray-700 sm:pl-0 lg:table-cell'
                          )}
                        >
                          <Answer {...{ question }}>
                            <p>{question.question}</p>
                            <span className="mt-2 hidden text-xs text-gray-400 sm:block">
                              {question.createdAt}
                            </span>
                            <dl className="font-normal lg:hidden">
                              <dt className="sr-only">Answer</dt>
                              <dd className="mt-1 text-sm text-gray-600">
                                <ShortAnswer answer={question.answer} />
                              </dd>
                              <dt className="sr-only">Sources</dt>
                              <dd className="mt-2 text-gray-500">
                                <Sources sources={question.sources} />
                              </dd>
                            </dl>
                          </Answer>
                        </td>
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden text-sm text-gray-500 lg:table-cell'
                          )}
                        >
                          <Answer {...{ question }}>
                            <ShortAnswer answer={question.answer} />
                          </Answer>
                        </td>
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden truncate text-sm text-gray-500 lg:table-cell'
                          )}
                        >
                          <Answer {...{ question }}>
                            <Sources sources={question.sources} />
                          </Answer>
                        </td>
                        <td
                          className={clsx(
                            questionIdx !== questions.length - 1 ? 'border-b border-gray-200' : '',
                            'hidden whitespace-nowrap text-sm text-gray-500 lg:table-cell'
                          )}
                        >
                          <Answer {...{ question }}>
                            <Rating rating={question.rating} />
                          </Answer>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center md:justify-end">
          <Paginator
            perPage={questions.pagination.perPage}
            totalCount={questions.pagination.totalCount}
            page={questions.pagination.page}
            changePage={changePage}
          />
        </div>
      </div>
    </div>
  )
}
