import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ShareIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import classNames from '@/utils/classNames'

export default function ModalSource({ team, bot, source, setErrorText, children }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const updateSource = async () => {
    setErrorText('')
    setSubmitting(true)
    const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}/sources/${source.id}/reingest`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      const deleting = source.id
      setSources(sources.filter((source) => source.id !== deleting))
      setToDelete(null)
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

  return (
    <>
      <a
        type="button"
        className="m-0 block cursor-pointer px-3 py-4"
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
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rounded-lg bg-white p-8 shadow">
                    <h3 className="text-2xl font-bold">{source.title ?? source.url}</h3>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      You can schedule this source to be reingested by an interval. This will refetch any URLs or files and update the source with the latest data. Useful if you want to keep your bot up to date with the latest version of your data.
                    </p>
                    <div className="mt-4 flex justify-start space-x-4">
                      
                    </div>
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
