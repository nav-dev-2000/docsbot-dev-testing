import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import { stripePlan } from '@/utils/helpers'
import Alert from '@/components/Alert'
import ModalCheckout from '@/components/ModalCheckout'
import { useRouter } from 'next/router'

export const BotCopyModal = ({ team, bot }) => {
  const [open, setOpen] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [botName, setBotName] = useState(`${bot.name} Copy`)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (stripePlan(team).name === 'Free') {
      setShowUpgrade(true)
    }
  }, [team])

  const createCopy = async () => {
    if (!botName) {
      setErrorText('Please enter a name for your bot.')
      return
    }
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots']
    const apiPath = '/api/' + urlParams.join('/')

    const data = {
      ...bot,
      name: botName,
      copyFrom: bot.id
    }

    if (data?.id) {
      delete data.id
    }
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      const rdata = await response.json()
      setIsUpdating(false)
      setOpen(false)
      await router.push(`/app/bots/${rdata.id}`)
      router.reload()
    } else {
      try {
        const rdata = await response.json()
        setErrorText(rdata.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ' creating bot, please try again later. Please be patient while our DB provider is trying to scale to meet the extreme demand.')
      }
      setIsUpdating(false)
    }
  }

  return (
    <>
      <button
        className="flex items-center text-sm text-gray-600 hover:text-gray-800"
        title="Edit bot"
        onClick={() => setOpen(true)}
      >
        <DocumentDuplicateIcon className="mr-1 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <p>Copy</p>
      </button>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      createCopy()
                    }}
                  >
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
                    <div className="">
                      <Dialog.Title
                        as="h3"
                        className="mb-4 text-xl font-medium leading-6 text-gray-900"
                      >
                        Copy {bot.name}
                      </Dialog.Title>
                      <Alert title={errorText} type="error" />
                      <p className="text-md text-gray-700">Create a new bot with the same settings and source training data. Useful for testing and staging changes.</p>
                      <p className="text-sm text-gray-600">NOTE: Cloud sources (Notion, Google Drive, etc) added via our partner Carbon will not be able to be refreshed in the copy, as they limit to one connnection per user account.</p>

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pt-6 pb-5">
                            <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
                            <div>
                            <label htmlFor="project-name" className="block text-sm font-medium text-gray-900">
                              Name
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="project-name"
                                id="project-name"
                                value={botName}
                                onChange={(e) => setBotName(e.target.value)}
                                disabled={isUpdating}
                                placeholder="What would you like to call your bot?"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                              />
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end sm:mt-6">
                        <button
                          type="submit"
                          name="submit-form"
                          className="inline-flex w-1/4 items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm"
                          disabled={isUpdating}
                        >
                          {!isUpdating ? (
                            <span>Duplicate</span>
                          ) : (
                            <span>
                              <LoadingSpinner /> Duplicating...
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}