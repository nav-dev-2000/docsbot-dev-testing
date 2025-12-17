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
  ClipboardIcon,
  CheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon,
  CodeBracketSquareIcon, 
  ShareIcon 
} from '@heroicons/react/24/solid'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getUser, getBots, getTeamIntegrations, getMcpOAuthClients } from '@/lib/dbQueries'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import ModalOpenAI from '@/components/ModalOpenAI'
import { getUserRole } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'
import APIIntegration from '@/components/integrations/helpscout'
import LoadingSpinner from '@/components/LoadingSpinner'
import SlackLogo from '@/components/SlackLogo'
import OpenAILogo from '@/components/OpenAILogo'
import Image from 'next/image'
import mcpLogo from '@/images/logos/mcp.svg'

// Helper function to get friendly interface name from domain (shared with authorize.jsx)
const getInterfaceName = (domain) => {
  if (!domain) return null
  
  const domainLower = domain.toLowerCase()
  
  // Map common MCP-supporting domains to friendly names
  const domainMap = {
    // Anthropic/Claude
    'claude.ai': 'Claude',
    'anthropic.com': 'Claude',
    'console.anthropic.com': 'Claude Console',
    
    // OpenAI/ChatGPT
    'chatgpt.com': 'ChatGPT',
    'chat.openai.com': 'ChatGPT',
    'openai.com': 'ChatGPT',
    'platform.openai.com': 'OpenAI Platform',
    
    // Cursor IDE
    'cursor.sh': 'Cursor',
    'cursor.com': 'Cursor',
    
    // Continue.dev
    'continue.dev': 'Continue',
    
    // Aider
    'aider.chat': 'Aider',
    
    // Other common MCP clients
    'github.com': 'GitHub',
    'github.dev': 'GitHub Codespaces',
    'vscode.dev': 'VS Code',
    'code.visualstudio.com': 'VS Code',
  }
  
  // Check exact match first
  if (domainMap[domainLower]) {
    return domainMap[domainLower]
  }
  
  // Check if domain contains known patterns
  if (domainLower.includes('claude') || domainLower.includes('anthropic')) {
    return 'Claude'
  }
  if (domainLower.includes('chatgpt') || domainLower.includes('openai')) {
    return 'ChatGPT'
  }
  if (domainLower.includes('cursor')) {
    return 'Cursor'
  }
  if (domainLower.includes('continue')) {
    return 'Continue'
  }
  if (domainLower.includes('aider')) {
    return 'Aider'
  }
  
  // Return null if no friendly name found (will use domain as fallback)
  return null
}

function Api({ user, team, bots, integrations: initialIntegrations, mcpClients: initialMcpClients = [] }) {
  const [errorText, setErrorText] = useState(null)
  const [open, setOpen] = useState(false)
  const [openRemoveModal, setOpenRemoveModal] = useState(false)
  const [apiKey, setApiKey] = useState(user.apiKey || 'No Key')
  const [copyMessage, setCopyMessage] = useState(null)
  const [allowApiRemove, setAllowApiRemove] = useState(team.openAIKey ? true : false)
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const defaultModel = checkPlanPermission(team, 'hobby').allowed ? 'GPT-5 mini' : 'GPT-5 nano';
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [isCopyableApiKey, setIsCopyableApiKey] = useState(false)
  const [mcpClients, setMcpClients] = useState(initialMcpClients)

  const handleCopyApiKey = () => {
    if (
      !isCopyableApiKey ||
      !apiKey ||
      apiKey === 'No Key' ||
      typeof navigator === 'undefined' ||
      !navigator.clipboard
    ) {
      return
    }

    navigator.clipboard.writeText(apiKey)
    setCopiedApiKey(true)
    setTimeout(() => setCopiedApiKey(false), 2000)
  }

  const handleRevokeMcpAccess = async (clientId) => {
    if (!confirm('Are you sure you want to revoke access for this MCP client? This will immediately disconnect all bots from this client.')) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${team.id}/mcp-oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId }),
      })

      if (response.ok) {
        // Refresh the page to get updated data
        window.location.reload()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setErrorText(errorData.message || 'Failed to revoke MCP OAuth access')
      }
    } catch (error) {
      console.error('Error revoking MCP access:', error)
      setErrorText('Failed to revoke MCP OAuth access')
    }
  }

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
      setCopiedApiKey(false)
      setIsCopyableApiKey(true)
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
    <DashboardWrap page="API/Integrations" team={team} bots={bots}>
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
            {team.supportsGPT4 && team.openAIKey ? (
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {isCopyableApiKey ? (
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  onClick={(e) => e.target.select()}
                  className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  disabled={!isCopyableApiKey}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
                  aria-label="Copy DocsBot API key"
                >
                  <span className="relative h-4 w-4">
                    <ClipboardIcon
                      className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${copiedApiKey ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                      aria-hidden="true"
                    />
                    <CheckIcon
                      className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${copiedApiKey ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </div>
            ) : (
              <pre className="block">{apiKey}</pre>
            )}
            <div className="flex items-center gap-2">
              <a
                type="button"
                className="flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
                onClick={() => {
                  updateKey()
                }}
              >
                <ArrowPathIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
                Change
              </a>
            </div>
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
              <Image
                src={mcpLogo}
                alt="MCP Logo"
                width={20}
                height={20}
                className="mr-2 h-5 w-5"
              />
              <h4 className="text-lg font-medium">MCP Server</h4>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Expose your bot as a Model Context Protocol server for MCP-compatible clients like Claude and ChatGPT.
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

      {checkPlanPermission(team, 'standard').allowed ? (
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">MCP OAuth Clients</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            Manage MCP (Model Context Protocol) OAuth clients that have been authorized to access your bots. 
            You can revoke access for any client at any time.
          </p>
        
        {mcpClients.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No MCP OAuth clients have been authorized yet. When an MCP client requests access to your bots, 
            they will appear here.
          </p>
        ) : (
          <div className="mt-4">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Client ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Authorized Bots
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Authorized At
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {mcpClients.map((client) => {
                    const authorizedBots = client.bot_ids || client.botIds || []
                    const botNames = authorizedBots
                      .map((botId) => {
                        const bot = bots.find((b) => b.id === botId)
                        return bot ? bot.name || `Bot ${botId}` : `Bot ${botId}`
                      })
                      .join(', ')

                    // Get display name from redirect_domain if available
                    const redirectDomain = client.redirect_domain
                    const interfaceName = redirectDomain ? getInterfaceName(redirectDomain) : null
                    const displayName = interfaceName || redirectDomain || client.client_id || client.clientId || 'Unknown'

                    return (
                      <tr key={client.client_id || client.clientId}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          <div className="flex flex-col">
                            <span className="font-semibold">{displayName}</span>
                            {redirectDomain && displayName !== redirectDomain && (
                              <span className="text-xs text-gray-500 mt-0.5">{redirectDomain}</span>
                            )}
                            {client.client_id && displayName !== client.client_id && (
                              <span className="text-xs font-mono text-gray-400 mt-0.5">{client.client_id}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {authorizedBots.length > 0 ? (
                            <div className="max-w-md">
                              <span className="block truncate" title={botNames}>
                                {botNames || `${authorizedBots.length} bot(s)`}
                              </span>
                              {authorizedBots.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {authorizedBots.length} bot{authorizedBots.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No bots</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {client.authorized_at || client.authorizedAt
                            ? new Date((client.authorized_at || client.authorizedAt) * 1000).toLocaleDateString()
                            : 'Unknown'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleRevokeMcpAccess(client.client_id || client.clientId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Revoke access</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      ) : (
        <div className="mt-8 rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">MCP OAuth Clients</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            MCP OAuth is only available on the Standard plan or higher. Please upgrade your plan to manage MCP OAuth clients.
          </p>
        </div>
      )}

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

    // Fetch MCP OAuth clients server-side (only for owners/admins)
    if (role === 'owner' || role === 'admin') {
      try {
        data.props.mcpClients = await getMcpOAuthClients(data.props.team.id)
        console.log('MCP OAuth Clients from Firestore (SSR):', {
          teamId: data.props.team.id,
          uniqueClients: data.props.mcpClients.length,
        })
      } catch (error) {
        console.error('Error fetching MCP OAuth clients:', {
          error: error.message,
          stack: error.stack,
        })
        data.props.mcpClients = []
      }
    } else {
      data.props.mcpClients = []
    }
  }

  return data
}

export default Api
