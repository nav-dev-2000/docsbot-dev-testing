import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import SourceDelete from '@/components/SourceDelete'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeStatusSource from '@/components/BadgeStatusSource'
import { canSourceTypeSchedule } from '@/constants/sourceTypes.constants'

export default function ModalSource({ team, bot, source, setSources, children }) {
  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [errorText, setErrorText] = useState(null)
  const [selectedInterval, setSelectedInterval] = useState(source.scheduleInterval ?? 'none')
  const [submitting, setSubmitting] = useState(false)
  const [showInterval, setShowInterval] = useState(canSourceTypeSchedule(source.type))
  const [locked, setLocked] = useState(null)

  const updateSource = async () => {
    setErrorText('')
    setSubmitting(true)
    const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}/sources/${source.id}/reingest`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interval: selectedInterval }),
    })
    if (response.ok) {
      const { newScheduled } = await response.json()
      setSources((sources) => sources.map((s) => s.id === source.id ? {...source, scheduled: newScheduled} : s))
      setSubmitting(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setSubmitting(false)
    }
  }

  const refreshSource = async () => {
    setErrorText('')
    const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}/sources/${source.id}/reingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const { newScheduled } = await response.json()
      setSources((sources) => sources.map((s) => s.id === source.id ? {...source, status: 'pending', scheduled: newScheduled} : s))
      setOpen(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  useEffect(() => {
    setLocked(null)
    if (source.status !== 'ready') {
      setLocked('This source is currently being processed. Please wait.')
    }

    setShowInterval(canSourceTypeSchedule(source.type))
  }, [source])

  return (
    <>
      <a
        type="button"
        className="m-0 block cursor-pointer"
        disabled={source.status !== 'ready'}
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
                      className="rounded-md bg-white text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setToDelete(source)}
                    >
                      <span className="sr-only">Delete</span>
                      <TrashIcon className="h-6 w-6" aria-hidden="true" />
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

                  <div className="rounded-lg bg-white p-8 shadow">
                    <div className="pb-2">
                      <h3 className="inline-flex text-2xl font-bold">{source.title ?? source.url}</h3>
                      <h1 className="inline-flex pl-2 text-sm font-medium text-gray-500 flex-end">{source.type.toUpperCase()}</h1>
                    </div>
                    <BadgeStatusSource source={source} />
                    <Alert title={errorText} type="warning" />
                    <SourceDelete 
                      team={team}
                      bot={bot}
                      source={toDelete}
                      setToDelete={setToDelete}
                      setErrorText={setErrorText}
                      setSources={setSources}
                    />
                    {showInterval && (
                      <>
                        <Alert title={locked || "You can schedule this source to be refreshed by an interval. This will refetch any URLs or files and update the source with the latest data. Useful if you want to keep your bot up to date with the latest version of your data."} type="info" />
                        <div className="mt-4 justify-start">
                          <label htmlFor="intervals" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scheduled refresh</label>
                          <select id="countries" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            onChange={(val) => setSelectedInterval(val.target.value)}
                            value={selectedInterval}
                            disabled={submitting || locked !== null}>
                            <option value="none">Never</option>
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                          </select>
                          <h1 className="inline-flex pl-2 text-sm font-medium text-gray-500 flex-end">
                            {source.scheduled ? "Currently scheduled to be refreshed at " + new Date(source.scheduled).toLocaleString() : "This source has not been scheduled to be refreshed."}
                          </h1>
                        </div>
                        <div className="mt-6 mb-2 flex flex-shrink-0 items-end justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                            onClick={refreshSource}
                            disabled={submitting || locked !== null}
                          >
                            <ArrowPathIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                            Refresh
                          </button>
                          <button
                            disabled={submitting || locked !== null}
                            onClick={updateSource}
                            className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                          >
                            {submitting && (
                              <LoadingSpinner className="mr-3" />
                            )}
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
