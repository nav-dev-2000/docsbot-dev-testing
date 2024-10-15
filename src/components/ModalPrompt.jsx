import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CommandLineIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModalCheckout from '@/components/ModalCheckout'
import { stripePlan, isSuperAdmin } from '@/utils/helpers'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { canUserEditBot } from '@/utils/function.utils'
import Tooltip from '@/components/Tooltip'


export default function ModalPrompt({ team, integrations, bot }) {
  const [open, setOpen] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [prompt, setPrompt] = useState(bot.customPrompt || '')
  const [hsPrompt, setHSPrompt] = useState(bot.helpscoutPrompt || '')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [user] = useAuthState(auth)
  const [canModify, setModify] = useState(false)
  const [activeTab, setActiveTab] = useState('regular')
  const helpScoutIntegration = integrations.find((i) => i.id === 'helpscout')

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid))
  }, [team, user])

  const tabs = [
    { name: 'Regular Prompt', id: 'regular', current: activeTab === 'regular' },
    { name: 'Help Scout Prompt', id: 'helpscout', current: activeTab === 'helpscout', disabled: !helpScoutIntegration },
  ]

  async function updatePrompt() {
    setErrorText('')

    //show upgrade modal if they are not power and doing anything other than erasing the prompt
    if (prompt && stripePlan(team).bots < 3 && !isSuperAdmin(user.uid)) {
      setShowUpgrade(true)
      return
    }

    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots', bot.id]
    const apiPath = '/api/' + urlParams.join('/')

    let data = {}
    data.customPrompt = prompt
    if (helpScoutIntegration) {
      data.helpscoutPrompt = hsPrompt
    }

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      const data = await response.json()
      setOpen(false)
      setIsUpdating(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Tooltip content="Customize your bot's behavior">
        <button
          className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          onClick={() => setOpen(true)}
        >
          <CommandLineIcon
            className="mr-1 h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          {bot.customPrompt ? <p>Custom prompt</p> : <p>Default prompt</p>}
        </button>
      </Tooltip>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl sm:p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      updatePrompt()
                    }}
                  >
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
                    <div className="">
                      <Dialog.Title
                        as="h3"
                        className="mb-4 text-xl font-medium leading-6 text-gray-900"
                      >
                        Customize Prompt
                        {stripePlan(team).bots < 3 && (
                          <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                            Power
                          </span>
                        )}
                      </Dialog.Title>
                      <Alert title={errorText} type="error" />
                      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                          <p className="text-md text-gray-700">
                            Add some custom instructions to your prompt to
                            adjust your bot's answer output to your specific use
                            case. You can use this powerful tool to change
                            behavior, formatting, and provide any context that
                            needs to be available for every response.
                          </p>
                          <h3 className="mt-4 text-lg font-medium text-gray-800">
                            Examples
                          </h3>
                          <ul className="ml-4 mt-2 list-disc text-sm text-gray-700">
                            <li className="text-sm text-gray-700">
                              <code>
                                Politely refuse to answer questions unrelated to{' '}
                                {bot.name}.
                              </code>
                            </li>
                            <li className="text-sm text-gray-700">
                              <code>
                                Use \[...\] for block math and \(...\) for
                                inline math in your response.
                              </code>{' '}
                              (for pretty display of equations)
                            </li>
                            <li className="text-sm text-gray-700">
                              <code>
                                If relevant to the user's question, after your
                                answer, suggest my book "{bot.name} For
                                Dummies".
                              </code>
                            </li>
                            <li className="text-sm text-gray-700">
                              <code>
                                If the answer is not in the provided context,
                                recommend they contact the {bot.name} support
                                team and provide a link to
                                https://mysite.com/support/
                              </code>
                            </li>
                            <li className="text-sm text-gray-700">
                              <code>
                                Always respond as if you are Pee-wee Herman.
                              </code>
                            </li>
                          </ul>
                        </div>
                        <div className="flex flex-col lg:col-span-2">
                          <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                              {tabs.map((tab) => (
                                <a
                                  key={tab.name}
                                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                  className={clsx(
                                    tab.current
                                      ? 'border-cyan-500 text-cyan-600'
                                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                    'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium cursor-pointer',
                                    tab.disabled && 'opacity-50 cursor-not-allowed'
                                  )}
                                  aria-current={tab.current ? 'page' : undefined}
                                >
                                  {tab.name}
                                </a>
                              ))}
                            </nav>
                          </div>
                          <div className="-mt-1 flex-grow">
                            {activeTab === 'regular' && (
                              <div className="h-full">
                                <label
                                  htmlFor="prompt"
                                  className="sr-only"
                                >
                                  Custom Prompt
                                </label>
                                <div className="mt-4 h-full">
                                  <textarea
                                    id="prompt"
                                    className="block h-full w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm min-h-96"
                                    placeholder="Enter any custom prompt here..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isUpdating || !canModify}
                                  />
                                </div>
                              </div>
                            )}
                            {activeTab === 'helpscout' && helpScoutIntegration && (
                              <div className="h-full">
                                <label
                                  htmlFor="helpscoutPrompt"
                                  className="block text-left text-sm font-medium text-gray-700"
                                >
                                  Custom Help Scout Prompt
                                </label>
                                <div className="mt-1 h-full">
                                  <textarea
                                    id="helpscoutPrompt"
                                    className="block h-full w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="Enter any custom prompt here, this will be used for helpscout responses."
                                    value={hsPrompt}
                                    onChange={(e) => setHSPrompt(e.target.value)}
                                    disabled={isUpdating || !canModify}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-14 flex justify-end sm:mt-12">
                        <button
                          type="submit"
                          name="submit-form"
                          className={
                            'inline-flex w-1/4 items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm' +
                            (canModify ? '' : ' hidden')
                          }
                          disabled={isUpdating || !canModify}
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
