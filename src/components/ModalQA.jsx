import QAForm from '@/components/QAForm'
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import ModalCheckout from '@/components/ModalCheckout'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'

export default function ModalQA({
  team,
  botId,
  question,
  open,
  setOpen,
  hideButton,
}) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successText, setSuccessText] = useState(null)
  const [errorText, setErrorText] = useState(null)
  const [questions, setQuestions] = useState([
    {
      question: question.standaloneQuestion || question.question,
      answer: question.answer,
    },
  ])
  const [showUpgrade, setShowUpgrade] = useState(false)

  const saveQuestion = async () => {
    const urlParams = [
      'teams',
      team.id,
      'bots',
      botId,
      'questions',
      question.id,
    ]
    const urlPath = '/api/' + urlParams.join('/')

    const response = await fetch(urlPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revised: true,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      setSuccessText(
        "Q&A successfully added! Check your bot's dashboard to view the status.",
      )
      setSubmitted(true)
    } else {
      try {
        const data = await response.json()
        if (data.message.includes('upgrade')) {
          setShowUpgrade(true)
        } else {
          setErrorText(
            data.message || 'Something went wrong, please try again.',
          )
        }
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const uploadNewSource = async () => {
    if (submitting || submitted) return
    setErrorText('')
    setSubmitting(true)

    const urlParams = ['teams', team.id, 'bots', botId, 'sources']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'qa',
        title: null,
        url: null,
        file: null,
        scheduleInterval: 'none',
        faqs: questions,
      }),
    })
    if (response.ok) {
      const data = await response.json()
      await saveQuestion()
    } else {
      try {
        const data = await response.json()
        if (data.message.includes('upgrade')) {
          setShowUpgrade(true)
        } else {
          setErrorText(
            data.message || 'Something went wrong, please try again.',
          )
        }
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setSubmitting(false)
  }

  const openQA = () => {
    if (question.revised) {
      window.location.href = '/app/bots/' + botId
      return
    }

    setOpen(true)
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      {!hideButton && (
        <button
          type="button"
          className={
            'flex cursor-pointer items-center justify-end rounded-md border border-cyan-700 bg-white px-2 py-1 text-sm font-medium text-cyan-700 ring-1 ring-cyan-500 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-600 ' +
            (question?.revised ? 'font-semibold' : '')
          }
          onClick={openQA}
        >
          <PencilSquareIcon className="mr-1 h-4 w-4" aria-hidden="true" />
          Revise answer
        </button>
      )}

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
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rounded-lg bg-white p-8 shadow">
                    <h3 className="text-bold mb-4 text-2xl">Revise Answer</h3>
                    <Alert type="error" title={errorText} />
                    <Alert type="success" title={successText} />
                    {!submitted && (
                      <>
                        <Alert
                          type="info"
                          title="This will create or update a Q&A source for your bot. If an existing question exists with a conflicting answer your bot may get confused, so make sure you're only adding questions you haven't answered before."
                          dismissKey="qa-conflicting-answer-warning"
                        />
                        <QAForm
                          questions={questions}
                          setQuestions={setQuestions}
                          hideAdd={true}
                          canChange={true}
                        />
                        <div className="mt-4 flex flex-shrink-0 items-end justify-end">
                          <button
                            disabled={submitting}
                            onClick={uploadNewSource}
                            className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                          >
                            {submitting && <LoadingSpinner className="mr-3" />}
                            Save
                          </button>
                        </div>
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
