import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { LanguageIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import { stripePlan } from '@/utils/helpers'
import Alert from '@/components/Alert'

export default function ModalPrompt({ team, bot }) {
  const [open, setOpen] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [language, setLanguage] = useState(bot.language || 'en')
  const [botName, setBotName] = useState(bot.name)
  const [botDescription, setBotDescription] = useState(bot.description)
  const [privacy, setPrivacy] = useState(bot.privacy)

  async function updateBot() {
    setErrorText('')

    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots', bot.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, name: botName, description: botDescription, privacy }),
    })
    if (response.ok) {
      const data = await response.json()
      setOpen(false)
      setIsUpdating(false)
      //refresh the page
      window.location.reload()
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText(response.status + ', please try again.')
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
        <PencilSquareIcon className="mr-1 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <p>Edit</p>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      updateBot()
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
                        Edit Bot
                      </Dialog.Title>
                      <Alert title={errorText} type="error" />
                      <p className="text-md text-gray-700">Adjust the settings for your bot.</p>

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
                              <legend className="text-sm font-medium text-gray-900">Privacy</legend>
                              <div className="mt-2 space-y-2">
                                <div className="relative flex items-start">
                                  <div className="absolute flex h-5 items-center">
                                    <input
                                      id="privacy-public"
                                      name="privacy"
                                      value="public"
                                      aria-describedby="privacy-public-description"
                                      type="radio"
                                      className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                      checked={privacy === 'public'}
                                      onChange={() => setPrivacy('public')}
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
                                        checked={privacy === 'private'}
                                        onChange={() => setPrivacy('private')}
                                        disabled={isUpdating || stripePlan(team).name === 'Free'}
                                      />
                                    </div>
                                    <div className="pl-7 text-sm">
                                      <label
                                        htmlFor="privacy-private"
                                        className="font-medium text-gray-900"
                                      >
                                        Private
                                        {stripePlan(team).name === 'Free' && (
                                          <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                            Paid
                                          </span>
                                        )}
                                      </label>
                                      <p id="privacy-private-description" className="text-gray-500">
                                        Authenticated API access only. Good for internal company
                                        content.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </fieldset>
                            <fieldset>
                              <legend className="text-sm font-medium text-gray-900">
                                Language
                              </legend>
                              <div className="mt-2 space-y-2">
                                <div className="relative flex items-start">
                                  <div className="absolute flex h-5 items-center">
                                    <input
                                      id="language-english"
                                      name="language"
                                      value="en"
                                      type="radio"
                                      className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                      checked={language === 'en'}
                                      onChange={() => setLanguage('en')}
                                      disabled={isUpdating}
                                    />
                                  </div>
                                  <div className="pl-7 text-sm">
                                    <label
                                      htmlFor="language-english"
                                      className="font-medium text-gray-900"
                                    >
                                      English
                                    </label>
                                  </div>
                                </div>
                                <div>
                                  <div className="relative flex items-start">
                                    <div className="absolute flex h-5 items-center">
                                      <input
                                        id="language-japanese"
                                        name="language"
                                        value="jp"
                                        type="radio"
                                        className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        checked={language === 'jp'}
                                        onChange={() => setLanguage('jp')}
                                        disabled={isUpdating}
                                      />
                                    </div>
                                    <div className="pl-7 text-sm">
                                      <label
                                        htmlFor="language-japanese"
                                        className="font-medium text-gray-900"
                                      >
                                        Japanese (日本語)
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </fieldset>
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
                            <span>Save</span>
                          ) : (
                            <span>
                              <LoadingSpinner /> Saving...
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
