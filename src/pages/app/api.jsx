import Link from 'next/link'
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  ArrowPathIcon, 
  PencilIcon, 
  XMarkIcon, 
  TrashIcon, 
  ChatBubbleLeftEllipsisIcon,
  BoltIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon,
  CodeBracketSquareIcon, 
  ShareIcon 
} from '@heroicons/react/24/solid'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getUser, getBots, getTeamIntegrations } from '@/lib/dbQueries'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import ModalOpenAI from '@/components/ModalOpenAI'
import { getUserRole } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'
import APIIntegration from '@/components/integrations/helpscout'
import LoadingSpinner from '@/components/LoadingSpinner'
import SlackLogo from '@/components/SlackLogo'
import OpenAILogo from '@/components/OpenAILogo'

function Api({ user, team, bots, integrations: initialIntegrations }) {
  const [errorText, setErrorText] = useState(null)
  const [open, setOpen] = useState(false)
  const [openRemoveModal, setOpenRemoveModal] = useState(false)
  const [apiKey, setApiKey] = useState(user.apiKey || 'No Key')
  const [copyMessage, setCopyMessage] = useState(null)
  const [allowApiRemove, setAllowApiRemove] = useState(team.openAIKey ? true : false)
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const defaultModel = checkPlanPermission(team, 'hobby').allowed ? 'GPT-5 mini' : 'GPT-5 nano';

  const updateKey = async () => {
    setErrorText('')

    const urlParams = ['users', user.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey: true }),
    })
    if (response.ok) {
      const data = await response.json()
      setApiKey(data.apiKey)
      setCopyMessage('Copy this key now, you will not be able to view it again.')
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const RemoveKeyModal = () => {
    const [isProcessing, setProcessing] = useState(false)

    const removeKey = async () => {
      setProcessing(true)
      const urlParams = ['teams', team.id]
      const apiPath = '/api/' + urlParams.join('/')

      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openAIKey: false }),
      })
      if (response.ok) {
        const data = await response.json()
        team.openAIKey = data.openAIKey
        setAllowApiRemove(false)
      } else {
        try {
          const data = await response.json()
          setErrorText(data.message || 'Something went wrong, please try again.')
        } catch (e) {
          setErrorText('Error ' + response.status + ', please try again.')
        }
      }

      setProcessing(false)
    }

    return (
      <Transition.Root show={openRemoveModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpenRemoveModal}>
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
                <Dialog.Panel className="relative transform rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                  <h3 className="inline-flex text-2xl font-bold">Remove API Key</h3>
                  <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpenRemoveModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="light mt-4 overflow-visible">
                    <p>
                      Are you sure you want to remove your OpenAI API key?
                    </p>
                    <Alert title={`All bots will be moved to the included ${defaultModel} model!`} type="error" />
                  </div>
                  <div className="mt-6 flex w-full flex-shrink-0 items-end justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-75"
                      onClick={() => {
                        removeKey()
                        setOpenRemoveModal(false)
                      }}
                    >
                      {isProcessing ? (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        <TrashIcon className="mr-2 h-4 w-4" />
                      )}
                      Remove
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  return (
    <DashboardWrap page="API/Integrations" team={team}>
      <Alert title={errorText} type="error" />
      <ModalOpenAI
        {...{
          team,
          open,
          setOpen,
          onKey: (key) => {
            team.openAIKey = key.substring(0, 3) + '...' + key.substring(47, 51)
            setAllowApiRemove(true)
          },
        }}
      />
      <RemoveKeyModal />

      <div className="rounded-lg bg-white p-8 shadow">
        <h3 className="text-2xl font-bold">{team.AzureDeploymentBase && 'Azure '}OpenAI API Key</h3>

        {team.AzureDeploymentBase ? (
          <>
            <p className="text-md mt-2 text-justify text-gray-800">
              Your team is configured to use an Azure custom endpoint. You should enter your Azure
              API key here.{' '}
              <Link
                className="text-cyan-800 underline"
                href="https://learn.microsoft.com/en-us/azure/ai-services/openai/quickstart?tabs=command-line%2Cpython-new&pivots=programming-language-python#retrieve-key-and-endpoint"
                target="_blank"
              >
                Get my Azure key
              </Link>
              . To change your deployment settings, please contact support.
            </p>
            <ul>
              <li className="text-md mt-2 text-justify text-gray-800">
                <strong>Endpoint:</strong> {team.AzureDeploymentBase}
              </li>
              <li className="text-md mt-2 text-justify text-gray-800">
                <strong>Chat Deployment Name:</strong> {team.AzureDeploymentName}
              </li>
              <li className="text-md mt-2 text-justify text-gray-800">
                <strong>Embeddings Deployment Name:</strong> {team.AzureDeploymentNameEmbed}
              </li>
            </ul>
          </>
        ) : (
          <p className="text-md mt-2 text-justify text-gray-800">
            You can add or update your OpenAI API key here. You must have an OpenAI account on at least Tier 1 ($5 credit added) for DocsBot to use more advanced models like GPT-5 & GPT-4o/4.1. <Link href="https://help.openai.com/en/articles/10910291-api-organization-verification" target="_blank" className="underline hover:text-gray-800">Organization verification</Link> is required for GPT-5 and o3/o4. {' '}
            <Link
              className="text-cyan-800 underline"
              href="https://platform.openai.com/api-keys"
              target="_blank"
            >
              Get my OpenAI key
            </Link>
            .
          </p>
        )}
        <div className="mt-4 flex justify-between">
          <div>
            <div className="mt-4 flex items-center justify-start">
              <pre className="">{team.openAIKey}</pre>
              <a
                type="button"
                className="ml-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
                onClick={() => {
                  setOpen(true)
                }}
              >
                <PencilIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
                {team.openAIKey ? 'Edit' : 'Add'}
              </a>
              {allowApiRemove && (
                <a
                  type="button"
                  className="ml-2 flex cursor-pointer items-center justify-end text-sm font-medium text-red-500 hover:text-red-900"
                  onClick={() => {
                    setOpenRemoveModal(true)
                  }}
                >
                  <TrashIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
                  {'Remove'}
                </a>
              )}
            </div>
            {team.supportsGPT4 ? (
              <p className="mt-4 text-sm italic">GPT-5 Support Enabled</p>
            ) : (
              <>
                <Link
                  className="mt-4 block text-sm underline hover:text-gray-500"
                  href="https://platform.openai.com/docs/guides/rate-limits#usage-tiers"
                  target="_blank"
                >
                  GPT-5 access details
                </Link>
                <p className="mt-1 text-xs italic">
                  Optional - Once you've added at least $5 credit to OpenAI update your OpenAI API key to unlock other models
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {(team.weaviateUrl && team.weaviateApiKey) && (
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Custom Training DB</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            Your team is configured to use a custom vector database for your training data.
          </p>
          <div className="mt-4 flex items-center justify-start">
            <pre className="block">{team.weaviateUrl}</pre>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">DocsBot API Key</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can get your DocsBot API key here that can be used for the admin API and querying
            private bots. This key is is tied to your user account and can be used to access all teams
            that you have a role for.
          </p>
          <div className="mt-4 flex items-center justify-start">
            <pre className="block">{apiKey}</pre>
            <a
              type="button"
              className="ml-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
              onClick={() => {
                updateKey()
              }}
            >
              <ArrowPathIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
              Change
            </a>
          </div>
          <p className="mt-1 text-justify text-sm text-gray-800">{copyMessage}</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">API Documentation</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can find the full{' '}
            <Link href="/documentation/developer" className="text-cyan-800 underline">
              DocsBot API documentation here
            </Link>
            . You can use the API key above to access the admin API and query private bots. You will
            use the team ID below for the admin API and chat APIs.
          </p>
          <h3 className="mt-8 text-xl font-bold">Team ID</h3>
          <pre className="block">{team.id}</pre>
        </div>
      </div>

      <h2 className="mt-12 text-3xl font-bold">
        Integrations
      </h2>

      <div className="mt-8 rounded-lg bg-white p-8 shadow">
        <h3 className="text-2xl font-bold">Bot Integrations</h3>
        <p className="text-md mt-2 text-justify text-gray-800">
          DocsBot AI offers several powerful integrations that can be configured for each of your bots:
        </p>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <ChatBubbleLeftEllipsisIcon className="mr-2 h-5 w-5 text-cyan-600" />
              <h4 className="text-lg font-medium">Chat Widget</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Embed a customizable chat widget on your website for instant documentation access.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <ShareIcon className="mr-2 h-5 w-5" />
              <h4 className="text-lg font-medium">Share Links</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Create public links for people to interact with your bot through chat or Q/A pages.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <SlackLogo className="mr-2 h-5 w-5" />
              <h4 className="text-lg font-medium">Slack</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Connect your bot to Slack to answer questions directly in your workspace channels.
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <BoltIcon className="mr-2 h-5 w-5 text-cyan-600" />
              <h4 className="text-lg font-medium">Workflow Automations</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Connect to Zapier, Make, OttoKit and other automation platforms.
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <CodeBracketSquareIcon className="mr-2 h-5 w-5 text-cyan-600" />
              <h4 className="text-lg font-medium">API</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Access bot functionality programmatically through our comprehensive REST API endpoints.
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <OpenAILogo className="mr-2 h-5 w-5" />
              <h4 className="text-lg font-medium">ChatGPT Custom GPT</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Give your custom GPTs access to your DocsBot training library with our custom action.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-md text-gray-800">
            To configure these integrations for a specific bot, go to your{' '}
            <Link href="/app/bots" className="text-cyan-600 hover:text-cyan-800">
              Bots page
            </Link>{' '}
            and click the <span className="font-medium">Integrations & Sharing</span> button for the bot you want to set up.
          </p>
        </div>
      </div>

      <APIIntegration {...{ team, integrations, bots, setErrorText }} />

    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  // get user data
  data.props.user = await getUser(data.props.userId)
  data.props.integrations = await getTeamIntegrations(data.props.team.id)
  data.props.bots = await getBots(data.props.team)

  if (data?.props?.team) {
    const role = getUserRole(data.props.team, data.props.userId)

    // redirect non-owners to dashboard
    if (role === 'viewer' || role === 'editor') {
      return {
        redirect: {
          destination: '/app',
          permanent: false,
        },
      }
    }
  }

  return data
}

export default Api
