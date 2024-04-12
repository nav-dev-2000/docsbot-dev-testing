import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  EyeIcon,
  EyeSlashIcon,
  LifebuoyIcon,
  ShareIcon,
  XMarkIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import classNames from '@/utils/classNames'
import openAILogo from '@/images/logos/openai-logo.svg'
import Image from 'next/image'

export default function ModalAPI({ team, bot, integrations }) {
  const [open, setOpen] = useState(false)
  const helpScoutIntegration = integrations.find((i) => i.id === 'helpscout')
  const [subscribedTags, setSubscribedTags] = useState([])

  useEffect(() => {
    if (!helpScoutIntegration || !helpScoutIntegration?.tags) {
      return
    }

    // scrape tags for tags assigned to this bot
    let tags = []
    for (const tag of helpScoutIntegration.tags) {
      const assignedId = tag?.assignedBot
      if (assignedId === bot.id) {
        tags.push(tag)
      }
    }

    setSubscribedTags(tags)
  }, [helpScoutIntegration])
  
  const HelpScoutInfo = () => {
    if (!helpScoutIntegration || !helpScoutIntegration.webhookSecret) {
      return (
        <p className="text-md mt-2 text-gray-800">
          If you use HelpScout, you can use our Auto-drafts feature to generate a draft reply to
          customer support tickets. This can save your support staff precious time and guide them by
          pre-writing answers to common issues. Please configure the{' '}
          <Link href="/app/api" className="underline">
            HelpScout integration
          </Link>{' '}
          to get started.
        </p>
      )
    }

    return (
      <div className="mt-2">
        <div className="text-gray-800">
          {subscribedTags.length > 0 ? (
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                  >
                    Assigned Tag
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribedTags.map((tag) => {
                  return (
                    <tr
                      key={tag.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="text-sm px-3 py-1 text-gray-500">
                        {tag.name}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <pre className="black text-sm font-medium text-gray-700">
              This bot is not subscribed to any helpscout tags
            </pre>
          )}
          <p className="text-md">
            You can edit subscribed tags in your{' '}
            <Link href="/app/api" className="underline">
              Integrations tab
            </Link>{' '}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <a
        type="button"
        className="mt-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
        onClick={() => setOpen(true)}
      >
        <ShareIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
        Sharing & API
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
                    <h3 className="text-2xl font-bold">Share Links</h3>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      You can share the following public links for people to interact with your bot
                      if it is public.
                    </p>
                    <div className="mt-4 flex justify-start space-x-4">
                      <Link
                        target="_blank"
                        type="button"
                        className={classNames(
                          bot.privacy === 'private' || bot.status !== 'ready'
                            ? 'cursor-not-allowed opacity-50'
                            : '',
                          'flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                        href={`/chat/${team.id}/${bot.id}`}
                        onClick={(e) => {
                          if (bot.privacy === 'private' || bot.status !== 'ready') {
                            e.preventDefault()
                          }
                        }}
                        title="Sharable link"
                      >
                        <PaperClipIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                        Chat Page
                      </Link>
                      <Link
                        target="_blank"
                        type="button"
                        className={classNames(
                          bot.privacy === 'private' || bot.status !== 'ready'
                            ? 'cursor-not-allowed opacity-50'
                            : '',
                          'flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                        href={`/ask/${team.id}/${bot.id}`}
                        onClick={(e) => {
                          if (bot.privacy === 'private' || bot.status !== 'ready') {
                            e.preventDefault()
                          }
                        }}
                        title="Sharable link"
                      >
                        <PaperClipIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                        Q/A Page
                      </Link>
                    </div>

                    <div className="flex items-end justify-between">
                      <h3 className="mt-8 text-2xl font-bold">ChatGPT Action</h3>
                      <Image src={openAILogo} alt="OpenAI logo" width={65} height={45} />
                    </div>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      If you are building a custom GPT for ChatGPT Plus, you can give it access to
                      this DocsBot training library with our custom action. In the{' '}
                      <Link
                        href="https://chat.openai.com/gpts/editor"
                        target="_blank"
                        className="text-cyan-800 underline"
                      >
                        GPT builder
                      </Link>{' '}
                      under the "Configure" tab click "Add Actions", then "Import OpenAPI schema",
                      paste the following url, then click "Load":
                    </p>
                    <h4 className="mt-4 text-lg font-bold">ChatGPT OpenAPI Schema</h4>
                    <pre className="block">
                      https://docsbot.ai/api/teams/{team.id}/bots/{bot.id}/openapi
                    </pre>
                    
                    <h4 className="mt-4 text-lg font-bold">Privacy Policy URL</h4>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      To publish your GPT to the public, you will need to enter this privacy policy
                      url in the Action:
                    </p>
                    <pre className="block">https://docsbot.ai/legal/privacy-policy</pre>
                    <p className="text-md mt-4 text-justify text-gray-800">
                      If this DocsBot is private, you will need to enter your{' '}
                      <Link href="/app/api" className="text-cyan-800 underline">
                        DocsBot API key
                      </Link>{' '}
                      in your Action's "Authentication" tab. For more information, please <Link href="https://docsbot.ai/documentation/doc/how-to-create-openai-gpt-chatbots-with-access-to-your-trained-documentation" className="text-cyan-800 underline">read our full documentation</Link> for this integration.
                    </p>

                    <h3 className="mt-8 text-2xl font-bold">API Documentation</h3>
                    <p className="text-md mt-2 text-justify text-gray-800">
                      You can find the full{' '}
                      <Link href="/documentation/developer" className="text-cyan-800 underline">
                        DocsBot API documentation here
                      </Link>
                      . You will use the Team ID and Bot ID below for the admin API and chat APIs
                      for this bot.
                    </p>

                    <div className="flex">
                      <div className="w-full lg:w-1/2">
                        <h3 className="mt-8 text-xl font-bold">Team ID</h3>
                        <pre className="block">{team.id}</pre>
                      </div>
                      <div className="w-full lg:w-1/2">
                        <h3 className="mt-8 text-xl font-bold">Bot ID</h3>
                        <pre className="block">{bot.id}</pre>
                      </div>
                    </div>

                    <h2 className="mt-8 text-2xl font-bold">HelpScout Auto-drafts</h2>
                    <HelpScoutInfo />
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
