import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import Alert from '@/components/Alert'
import { useRouter } from 'next/router'
import { stripePlan } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'

export default function NewBotPanel({ team, open, setOpen }) {
  const [botName, setBotName] = useState('')
  const [botDescription, setBotDescription] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const [errorText, setErrorText] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && stripePlan(team).bots <= team.botCount) {
      setOpen(false)
      setShowUpgrade(true)
    }
  }, [open])

  async function createBot() {
    if (!botName) {
      setErrorText('Please enter a name for your bot.')
      return
    }
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: botName,
        description: botDescription,
        privacy: privacy,
      }),
    })
    if (response.ok) {
      const data = await response.json()
      setBotName('')
      setBotDescription('')
      setPrivacy('public')
      setIsUpdating(false)
      setOpen(false)
      router.push(`/app/bots/${data.id}`)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText(response.statusText + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <form
                      action="#"
                      className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                      onSubmit={(e) => {
                        e.preventDefault()
                        createBot()
                      }}
                    >
                      <div className="h-0 flex-1 overflow-y-auto">
                        <div className="bg-gradient-to-r from-cyan-700 to-cyan-800 py-6 px-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <Dialog.Title className="text-lg font-medium text-white">
                              Create a new DocsBot
                            </Dialog.Title>
                            <div className="ml-3 flex h-7 items-center">
                              <button
                                type="button"
                                className="rounded-md text-cyan-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                                onClick={() => setOpen(false)}
                              >
                                <span className="sr-only">Close panel</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-cyan-100">
                              Fill in the information below to create your new bot. Once created you
                              can add source documentation and content then start chatting!
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="divide-y divide-gray-200 px-4 sm:px-6">
                            <Alert title={errorText} type="error" />
                            <div className="space-y-6 pt-6 pb-5">
                              <div>
                                <label
                                  htmlFor="project-name"
                                  className="block text-sm font-medium text-gray-900"
                                >
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
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                  />
                                </div>
                              </div>
                              <div>
                                <label
                                  htmlFor="description"
                                  className="block text-sm font-medium text-gray-900"
                                >
                                  Description
                                </label>
                                <div className="mt-1">
                                  <textarea
                                    id="description"
                                    name="description"
                                    placeholder="(optional) Describe what your bot will do and how it will be used, e.g. 'Ask me anything about my product!'"
                                    rows={4}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    value={botDescription}
                                    disabled={isUpdating}
                                    onChange={(e) => setBotDescription(e.target.value)}
                                  />
                                </div>
                              </div>

                              <fieldset>
                                <legend className="text-sm font-medium text-gray-900">
                                  Privacy
                                </legend>
                                <div className="mt-2 space-y-5">
                                  <div className="relative flex items-start">
                                    <div className="absolute flex h-5 items-center">
                                      <input
                                        id="privacy-public"
                                        name="privacy"
                                        value="public"
                                        aria-describedby="privacy-public-description"
                                        type="radio"
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        defaultChecked
                                        disabled={isUpdating}
                                      />
                                    </div>
                                    <div className="pl-7 text-sm">
                                      <label
                                        htmlFor="privacy-public"
                                        className="font-medium text-gray-900"
                                      >
                                        Public access
                                      </label>
                                      <p id="privacy-public-description" className="text-gray-500">
                                        Allows for embedding on the frontend of websites.
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="relative flex items-start">
                                      <div className="absolute flex h-5 items-center">
                                        <input
                                          id="privacy-private"
                                          name="privacy"
                                          value="private"
                                          aria-describedby="privacy-private-to-project-description"
                                          type="radio"
                                          className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                          disabled
                                        />
                                      </div>
                                      <div className="pl-7 text-sm">
                                        <label
                                          htmlFor="privacy-private"
                                          className="font-medium text-gray-500"
                                        >
                                          Private (coming soon)
                                          <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                            Pro
                                          </span>
                                        </label>
                                        <p
                                          id="privacy-private-description"
                                          className="text-gray-400"
                                        >
                                          Authenticated API access only. Good for internal company
                                          content.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </fieldset>
                            </div>
                            <div className="hidden pt-4 pb-6">
                              <div className="mt-4 flex text-sm">
                                <a
                                  href="#"
                                  className="group inline-flex items-center text-gray-500 hover:text-gray-900"
                                >
                                  <QuestionMarkCircleIcon
                                    className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                    aria-hidden="true"
                                  />
                                  <span className="ml-2">Learn more</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 justify-end px-4 py-4">
                        <button
                          type="button"
                          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                          onClick={() => setOpen(false)}
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                        <input
                          type="submit"
                          disabled={isUpdating}
                          value={isUpdating ? 'Creating...' : 'Create Bot'}
                          className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                        />
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
