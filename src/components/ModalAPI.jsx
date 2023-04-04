import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CodeBracketSquareIcon, CogIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ModalAPI({ team, bot }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const embed = `<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(t){return new Promise((e,n)=>{var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src="https://widget.docsbot.ai/chat.js";const i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i),s.addEventListener("load",()=>{window.DocsBotAI.mount({id:t.id,supportCallback:t.supportCallback});let o;o=function o(t){return new Promise((e)=>{if(document.querySelector(t))return e(document.querySelector(t));const n=new MutationObserver((o)=>{if(document.querySelector(t))return e(document.querySelector(t)),n.disconnect()});n.observe(document.body,{childList:!0,subtree:!0})})},o&&o("#docsbotai-root").then(e).catch(n)}),s.addEventListener("error",(t)=>{n(t.message)})})}</script>
<script type="text/javascript">DocsBotAI.init({id: "${team.id}/${bot.id}"});</script>`

  return (
    <>
      <a
        type="button"
        className="mt-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
        onClick={() => setOpen(true)}
      >
        <CodeBracketSquareIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
        Integrations
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
                    <h3 className="text-2xl font-bold">Chat Widget Embed Code</h3>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      You can embed this DocsBot on your website by adding the following code to
                      your HTML page before the closing `&lt;/body&gt;` tag.
                    </p>
                    <div
                      className="mx-auto mt-4 block sm:w-2/3 whitespace-pre-wrap break-all rounded-md border-2 border-solid border-gray-200 p-4 font-mono text-sm"
                      disabled
                    >
                      {embed}
                    </div>
                    <div className="mx-auto mt-4 sm:flex sm:w-2/3 items-end justify-between">
                      <button
                        className="rounded sm:w-1/3 bg-cyan-500 py-2 px-4 font-bold text-white hover:bg-cyan-600 active:opacity-80"
                        onClick={(e) => {
                          navigator.clipboard.writeText(embed)
                          setCopied(true)
                          setTimeout(() => {
                            setCopied(false)
                          }, 2000)
                        }}
                      >
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                      <Link href="/docs/embeddable-chat-widget" className="mt-4 sm:mt-0 block text-cyan-800 underline">
                        Full widget documentation
                      </Link>
                    </div>

                    <h3 className="mt-8 text-2xl font-bold">API Documentation</h3>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      You can find the full{' '}
                      <Link href="/docs" className="text-cyan-800 underline">
                        DocsBot API documentation here
                      </Link>
                      . You will use the Team ID and Bot ID below for the admin API and chat APIs
                      for this bot.
                    </p>
                    <h3 className="mt-8 text-xl font-bold">Team ID</h3>
                    <pre className="block">{team.id}</pre>
                    <h3 className="mt-8 text-xl font-bold">Bot ID</h3>
                    <pre className="block">{bot.id}</pre>
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
