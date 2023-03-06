import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CogIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ModalAPI({ team, bot }) {
  const [open, setOpen] = useState(false)

  const example1 = `curl --request POST 'https://api.docsbot.ai/teams/${team.id}/bots/${bot.id}/ask' \\
--header 'Content-Type: application/json' \\
--data-raw '{
    "question": "Do you offer refunds?",
    "markdown": true,
    "full_source": false
}'`
  const response1 = `{
    "answer": "Yes, we offer refunds within 30 days of purchase if you are not satisfied with our service. Please contact our support team to initiate the refund process.",
    "sources": [
        {
            "type": "csv",
            "title": "Source Name",
            "url": "https://yourdomain.com",
            "page": 1,
            "certainty": 0.8682532906532288,
            "content": null
        },
        {
            "type": "csv",
            "title": "Source Name",
            "url": "https://yourdomain.com",
            "page": 1,
            "certainty": 0.8676544427871704,
            "content": null
        },
        {
            "type": "url",
            "title": "Infinite Uploads – Your WordPress Media Cloud Library",
            "url": "https://infiniteuploads.com/",
            "page": null,
            "certainty": 0.8670842051506042,
            "content": null
        }
    ],
    "id": "78XvRoyYPcPsKVqoXjEj"
}`

  const example2 = `curl --request PUT 'https://api.docsbot.ai/teams/gk1WCUT9jPnkT0rx0anJ/bots/iQDp1BxiZK2WZovrxhaG/rate/78XvRoyYPcPsKVqoXjEj' \\
  --header 'Content-Type: application/json' \\
  --data-raw '{
      "rating": -1
  }'`

  const response2 = `true`

  return (
    <>
      <a
        type="button"
        className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center justify-end cursor-pointer mt-2"
        onClick={() => setOpen(true)}
      >
        <CogIcon className="h-4 w-4 mr-0.5" aria-hidden="true" />
        API Instructions
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
                  <div className="prose w-full p-6 max-w-full">
                    <h2 className="text-xl font-medium text-gray-900">API Integration</h2>
                    <p>For Question / Answer bots, use the following endpoint:</p>
                    <p>
                      <code>
                        https://api.docsbot.ai/teams/{team.id}/bots/{bot.id}/ask
                      </code>
                    </p>
                    <h3 className="text-lg font-medium text-gray-900">Example Request</h3>

                    <pre>{example1}</pre>
                    <h3 className="text-lg font-medium text-gray-900">Response</h3>
                    <pre>{response1}</pre>

                    <h3 className="text-lg font-medium text-gray-900">Example Rating an Answer</h3>
                    <pre>{example2}</pre>
                    <h3 className="text-lg font-medium text-gray-900">Response</h3>
                    <pre>{response2}</pre>

                    <p>
                      You can view the full API documentation{' '}<Link href="https://api.docsbot.ai/docs" target="_blank" className='underline'>here</Link>.
                    </p>
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
