import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CodeBracketSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'
import FieldToggle from '@/components/FieldToggle'
import FieldRadioIcon from '@/components/FieldRadioIcon'
import { i18n } from '@/constants/strings.constants'
import { SketchPicker } from 'react-color'
import {
  faComment,
  faComments,
  faRobot,
  faLifeRing,
  faQuestion,
  faBook,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from '@/utils/classNames'
import { decideTextColor } from '@/utils/colors'
import { stripePlan } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'

//icon can be default, robot, life-ring, or question-circle
const iconMap = {
  default: faComment,
  comments: faComments,
  robot: faRobot,
  'life-ring': faLifeRing,
  question: faQuestion,
  book: faBook,
}

export default function ModalEmbed({ team, bot }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  //bot settings
  const [allowedDomains, setAllowedDomains] = useState(bot.allowedDomains || [])
  const [allowedDomainsText, setAllowedDomainsText] = useState(allowedDomains.join(', '))
  const [color, setColor] = useState(bot.color || '#1292EE')
  const [icon, setIcon] = useState(bot.icon || 'default')
  const [alignment, setAlignment] = useState(bot.alignment || 'right')
  const [botIcon, setBotIcon] = useState(bot.botIcon || 'none')
  const [branding, setBranding] = useState(bot.branding === undefined ? true : bot.branding)
  const [supportLink, setSupportLink] = useState(bot.supportLink || '')
  const [showButtonLabel, setShowButtonLabel] = useState(bot.showButtonLabel || false)
  const [labels, setLabels] = useState(bot.labels || i18n[bot.language]?.labels || i18n.en.labels)

  useEffect(() => {
    if (!branding && stripePlan(team).bots < 10) {
      setShowUpgrade(true)
      setBranding(true)
    }
  }, [branding, team])

  async function updateBot() {
    setAllowedDomainsText(allowedDomains.join(', '))
    setErrorText('')
    setIsUpdating(true)

    const botSettings = {
      allowedDomains,
      color,
      icon,
      alignment,
      botIcon: botIcon === 'none' ? false : botIcon,
      branding,
      supportLink,
      showButtonLabel,
      labels,
    }

    const urlParams = ['teams', team.id, 'bots', bot.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botSettings),
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
        setErrorText(response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  const embed = `<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify,options:c.options});var t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));var o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(e).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};</script>
<script type="text/javascript">
  DocsBotAI.init({id: "${team.id}/${bot.id}"});
</script>`

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <a
        type="button"
        className="mt-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
        onClick={() => setOpen(true)}
      >
        <CodeBracketSquareIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
        Widget Embed
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

                    <div className="rounded-lg bg-white p-8 shadow">
                      <h3 className="text-2xl font-bold">Chat Widget Embed Code</h3>
                      <p className="text-md mt-2 text-justify text-gray-800">
                        You can embed this DocsBot on your website by adding the following code to
                        your HTML page before the closing `&lt;/body&gt;` tag.
                      </p>
                      <div
                        className="mx-auto mt-4 block h-36 overflow-scroll whitespace-pre-wrap break-all rounded-md border-2 border-solid border-gray-200 bg-gray-700 px-4 py-2 font-mono text-sm text-white"
                        disabled
                      >
                        {embed}
                      </div>
                      <div className="mx-auto mt-4 mb-8 items-end justify-between sm:flex">
                        <button
                          className="rounded bg-cyan-600 py-2 px-4 text-white hover:bg-cyan-600 active:opacity-80 sm:w-1/3"
                          onClick={(e) => {
                            e.preventDefault()
                            navigator.clipboard.writeText(embed)
                            setCopied(true)
                            setTimeout(() => {
                              setCopied(false)
                            }, 2000)
                          }}
                        >
                          {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <Link
                          href="/docs/embeddable-chat-widget"
                          className="mt-4 block text-cyan-800 underline sm:mt-0"
                        >
                          Full widget documentation
                        </Link>
                      </div>

                      <h3 className="text-2xl font-bold">Customize the Widget</h3>
                      <Alert title={errorText} type="error" />
                      <p className="text-md text-gray-700">
                        Customize the behavior and appearance of your chat widget. Changes can take
                        a few minutes to appear on your site.
                      </p>

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pt-6 pb-5">
                            <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-x-8 sm:space-y-0">
                              <div className="flex w-full items-center justify-between">
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-gray-900">
                                    Widget Color
                                  </label>
                                  <SketchPicker
                                    color={color}
                                    onChange={(color) => setColor(color.hex)}
                                    disableAlpha={true}
                                    presetColors={[
                                      '#F44336',
                                      '#E91E63',
                                      '#9C27B0',
                                      '#673AB7',
                                      '#3F51B5',
                                      '#2196F3',
                                      '#03A9F4',
                                      '#00BCD4',
                                      '#009688',
                                      '#4CAF50',
                                      '#FFEB3B',
                                      '#FF9800',
                                      '#FF5722',
                                      '#607D8B',
                                      '#FFFFFF',
                                      '#000000',
                                    ]}
                                  />
                                </div>
                                <span
                                  className={classNames(
                                    alignment === 'right' ? 'ml-auto' : 'mx-auto',
                                    showButtonLabel ? '' : 'w-14',
                                    'inline-flex h-14 items-center justify-center rounded-full px-5 text-lg font-medium text-white shadow-lg hover:opacity-90'
                                  )}
                                  style={{
                                    backgroundColor: color,
                                    color: decideTextColor(color),
                                  }}
                                >
                                  <FontAwesomeIcon icon={iconMap[icon]} size="xl" />
                                  {showButtonLabel && (
                                    <span className="text-md ml-3 font-normal">
                                      {labels.floatingButton}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-col justify-between space-y-4 sm:space-y-0">
                                <FieldRadioIcon
                                  type="icon"
                                  label="Button Icon"
                                  icon={icon}
                                  setIcon={setIcon}
                                  disabled={isUpdating}
                                />
                                <div>
                                  <label className="block text-sm font-medium text-gray-900">
                                    Button Alignment
                                  </label>
                                  <fieldset className="mt-4">
                                    <legend className="sr-only">Alignment</legend>
                                    <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
                                      <div className="flex items-center">
                                        <input
                                          id="left"
                                          name="alignment"
                                          type="radio"
                                          checked={alignment === 'left'}
                                          onChange={() => setAlignment('left')}
                                          className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                        />
                                        <label
                                          htmlFor="left"
                                          className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                        >
                                          Left
                                        </label>
                                      </div>
                                      <div className="flex items-center">
                                        <input
                                          id="right"
                                          name="alignment"
                                          type="radio"
                                          checked={alignment === 'right'}
                                          onChange={() => setAlignment('right')}
                                          className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                        />
                                        <label
                                          htmlFor="right"
                                          className="ml-3 block text-sm font-medium leading-6 text-gray-900"
                                        >
                                          Right
                                        </label>
                                      </div>
                                    </div>
                                  </fieldset>
                                </div>
                                <FieldToggle
                                  label="Show Button Text"
                                  description="Show text next to the floating button icon?"
                                  enabled={showButtonLabel}
                                  setEnabled={setShowButtonLabel}
                                  disabled={isUpdating}
                                />
                                <div>
                                  <label
                                    htmlFor="button-label"
                                    className="block text-sm font-medium text-gray-900"
                                  >
                                    Button Text
                                  </label>
                                  <div className="mt-1">
                                    <input
                                      type="text"
                                      name="button-label"
                                      id="button-label"
                                      value={labels.floatingButton}
                                      onChange={(e) =>
                                        setLabels({ ...labels, floatingButton: e.target.value })
                                      }
                                      disabled={!showButtonLabel || isUpdating}
                                      placeholder="Button text"
                                      className="block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <FieldRadioIcon
                              type="bot"
                              label="Bot Avatar"
                              icon={botIcon}
                              setIcon={setBotIcon}
                              disabled={isUpdating}
                            />

                            <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:space-x-8 sm:space-y-0">
                              <div className="w-full">
                                <label
                                  htmlFor="support-link"
                                  className="block text-sm font-medium text-gray-900"
                                >
                                  Support Link
                                </label>
                                <span className="text-sm text-gray-500">
                                  This link will appear after the bot replies. Optional, leave blank
                                  to hide.
                                </span>
                                <div className="mt-1">
                                  <input
                                    type="text"
                                    name="support-link"
                                    id="support-link"
                                    value={supportLink}
                                    onChange={(e) => setSupportLink(e.target.value)}
                                    disabled={isUpdating}
                                    placeholder="https://example.com/support/"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
                                  />
                                </div>
                              </div>
                              <div className="w-full">
                                <label
                                  htmlFor="support-label"
                                  className="block text-sm font-medium text-gray-900"
                                >
                                  Support Button Text
                                </label>
                                <span className="text-sm text-gray-500">
                                  This text will appear on the support link button if a link has
                                  been set.
                                </span>
                                <div className="mt-1">
                                  <input
                                    type="text"
                                    name="support-label"
                                    id="support-label"
                                    value={labels.getSupport}
                                    onChange={(e) =>
                                      setLabels({ ...labels, getSupport: e.target.value })
                                    }
                                    disabled={isUpdating}
                                    placeholder="Support text"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="w-full">
                              <label
                                htmlFor="message-label"
                                className="block text-sm font-medium text-gray-900"
                              >
                                First Message
                              </label>
                              <span className="text-sm text-gray-500">
                                This text will appear as the first message from the bot displayed to
                                the user. Optional, leave blank to disable.
                              </span>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="message-label"
                                  id="message-label"
                                  value={labels.firstMessage}
                                  onChange={(e) =>
                                    setLabels({ ...labels, firstMessage: e.target.value })
                                  }
                                  disabled={isUpdating}
                                  placeholder="Enter your message here..."
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
                                />
                              </div>
                            </div>

                            <FieldToggle
                              label="Show Branding"
                              description="If your plan allows you can disable the DocsBot branding in your widget footer."
                              enabled={branding}
                              setEnabled={setBranding}
                              disabled={isUpdating || stripePlan(team).bots < 10}
                            />

                            <div className="w-full">
                              <label
                                htmlFor="domains"
                                className="block text-sm font-medium text-gray-900"
                              >
                                Allowed Domains
                              </label>
                              <span className="text-sm text-gray-500">
                                Enter a comma-separated list of domains that are allowed to embed
                                this widget. Any subdomains must be listed seperately. Leave blank
                                to allow all domains.
                              </span>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="domains"
                                  id="domains"
                                  value={allowedDomainsText}
                                  onChange={(e) => {
                                    setAllowedDomainsText(e.target.value)
                                    setAllowedDomains(
                                      e.target.value
                                        .split(',')
                                        .filter((s) => s)
                                        .map((d) => d.trim().toLowerCase())
                                    )
                                  }}
                                  disabled={isUpdating}
                                  placeholder="mysite.com, www.mysite.com, anotherdomain.com, etc"
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:text-sm"
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
