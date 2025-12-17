import { Fragment, useEffect, useState } from 'react'
import {
  XMarkIcon,
  LinkIcon,
  ClipboardIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  BoltIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  CodeBracketSquareIcon,
  ShareIcon,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import classNames from '@/utils/classNames'
import SlackLogo from '@/components/SlackLogo'
import HelpScoutLogo from '@/components/HelpScoutLogo'
import OpenAILogo from '@/components/OpenAILogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import Tooltip from '@/components/Tooltip'
import mcpLogo from '@/images/logos/mcp.svg'

// Integration card component for consistent styling
const IntegrationCard = ({ title, icon, children, isNew, minPlan }) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {title}
            {minPlan ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                {minPlan}
              </span>
            ) : (
              isNew && (
                <span className="ml-2 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                  New!
                </span>
              )
            )}
          </h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between px-4 py-5 sm:p-6">
        {children}
      </div>
    </div>
  )
}

const ChatWidgetInfo = ({ bot, openLinksInNewTab }) => {
  return (
    <>
      <p className="text-md text-gray-800">
        Embed a customizable chat widget on your website to give your visitors
        instant access to documentation and support.
      </p>
      <ul className="mt-2 list-disc pl-5 text-gray-800">
        <li>Customize appearance to match your brand</li>
        <li>Configure widget placement and behavior</li>
      </ul>
      <div className="mt-4">
        <Link
          href={`/app/bots/${bot.id}/widget`}
          target={openLinksInNewTab ? "_blank" : undefined}
          className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          <ChatBubbleLeftEllipsisIcon className="mr-2 h-4 w-4" />
          Configure Widget
        </Link>
      </div>
    </>
  )
}

const ShareLinksInfo = ({ team, bot }) => {
  const hasScreenshot = bot.brandAnalysis?.screenshotUrl
  
  return (
    <>
      <p className="text-md text-gray-800">
        Share {hasScreenshot ? 'these public links' : 'this public link'} for people to interact with your bot.
      </p>
      <div className="mt-3 flex flex-col space-y-2">
        <Link
          target="_blank"
          href={`/chat/${team.id}/${bot.id}`}
          onClick={(e) => {
            if (bot.privacy === 'private' || bot.status !== 'ready') {
              e.preventDefault()
            }
          }}
          className={classNames(
            bot.privacy === 'private' || bot.status !== 'ready'
              ? 'cursor-not-allowed opacity-50'
              : '',
            'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
          )}
        >
          <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Chat Page
        </Link>
        {hasScreenshot && (
          <Tooltip content="See and test how your bot might look if embedded on your website">
            <Link
              target="_blank"
              href={`/demo/${team.id}/${bot.id}`}
              onClick={(e) => {
                if (bot.privacy === 'private' || bot.status !== 'ready') {
                  e.preventDefault()
                }
              }}
              className={classNames(
                bot.privacy === 'private' || bot.status !== 'ready'
                  ? 'cursor-not-allowed opacity-50'
                  : '',
                'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
              )}
            >
              <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Demo Page
            </Link>
          </Tooltip>
        )}
      </div>
    </>
  )
}

const SlackInfo = ({
  team,
  bot,
  slackConnection,
  isSlackConnected,
  hasPowerPlan,
  isConnectingSlack,
  handleConnectSlack,
  handleDisconnectSlack,
  setShowUpgrade,
  openLinksInNewTab,
}) => {
  if (!isSlackConnected) {
    return (
      <>
        <div>
          <p className="text-md text-gray-800">
            Connect your Slack workspace to integrate this bot with your paid
            team's Slack channels as an AI Assistant.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
            <li>
              Once you install the DocsBot AI Assistant app, everyone in your
              workspace can start using it right away
            </li>
            <li>
              Interact with our DocsBot AI Assistant in Slack alongside
              channels, or the App Home tab
            </li>
          </ul>
          <div className="mt-4">
            {!hasPowerPlan ? (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <CreditCardIcon
                  className="mr-1.5 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                Upgrade Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectSlack}
                disabled={isConnectingSlack}
                className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConnectingSlack ? (
                  <>
                    <LoadingSpinner small className="mr-3 text-gray-500" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <SlackLogo className="mr-2 h-4 w-4" />
                    Add to Slack
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <Link
          href="https://docsbot.ai/documentation/doc/slack-integration"
          target={openLinksInNewTab ? "_blank" : undefined}
          rel={openLinksInNewTab ? "noopener noreferrer" : undefined}
          className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
        >
          Read documentation
          <ArrowTopRightOnSquareIcon
            className="ml-1 h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </>
    )
  }

  const connectedDate = slackConnection.slackConnectedAt
    ? new Date(slackConnection.slackConnectedAt).toUTCString()
    : 'Unknown date'

  return (
    <>
      <div>
        <div className="flex items-center">
          <CheckCircleIcon
            className="h-5 w-5 text-green-600"
            aria-hidden="true"
          />
          <span className="ml-1 text-sm font-medium text-green-700">
            Connected to {slackConnection.slackTeamName || 'Slack workspace'}
          </span>
        </div>
        {slackConnection.slackBotUserId && (
          <p className="mt-2 text-sm text-gray-600">
            Bot User ID:{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              {slackConnection.slackBotUserId}
            </code>
          </p>
        )}
        {slackConnection.slackTeamId && (
          <p className="mt-1 text-sm text-gray-600">
            Slack Team:{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              {slackConnection.slackTeamId}
            </code>
          </p>
        )}
        <p className="mt-1 text-sm text-gray-600">
          Connected on: {connectedDate}
        </p>
        <p className="mt-4 text-gray-800">
          You can chat with your bot alongside any channel by clicking our icon
          in the top right corner.
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleConnectSlack}
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <SlackLogo className="mr-2 h-4 w-4" />
            Reconnect to Slack
          </button>
          <button
            type="button"
            onClick={handleDisconnectSlack}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-white px-4 py-1 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <XMarkIcon className="mr-1 h-4 w-4" />
            Disconnect
          </button>
        </div>
      </div>
      <Link
        href="https://docsbot.ai/documentation/doc/slack-integration"
        target={openLinksInNewTab ? "_blank" : undefined}
        rel={openLinksInNewTab ? "noopener noreferrer" : undefined}
        className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
      >
        Read documentation
        <ArrowTopRightOnSquareIcon
          className="ml-1 h-4 w-4"
          aria-hidden="true"
        />
      </Link>
    </>
  )
}

const HelpScoutInfo = ({ helpScoutIntegration, subscribedTags, bot, openLinksInNewTab }) => {
  if (!helpScoutIntegration || !helpScoutIntegration?.webhookSecret) {
    return (
      <p className="text-md text-gray-800">
        If you use Help Scout, you can use our replies feature to generate a
        draft/published reply or note to customer support tickets. This can
        save your support staff precious time and guide them by pre-writing
        answers to common issues. Please configure the{' '}
        <Link
          href="/app/api"
          target={openLinksInNewTab ? "_blank" : undefined}
          className="text-cyan-600 underline hover:text-cyan-800"
        >
          Help Scout integration
        </Link>{' '}
        for your team to get started.
      </p>
    )
  }

  return (
    <div>
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
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1 text-sm text-gray-500">
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
        <p className="text-md mt-3">
          You can edit subscribed tags in your{' '}
          <Link
            href="/app/api"
            target={openLinksInNewTab ? "_blank" : undefined}
            className="text-cyan-600 underline hover:text-cyan-800"
          >
            Integrations tab
          </Link>{' '}
        </p>
      </div>
    </div>
  )
}

const MCPIntegrationInfo = ({
  team,
  bot,
  openLinksInNewTab,
  hasStandardPlan,
  setShowUpgrade,
}) => {
  const serverUrl = `https://api.docsbot.ai/teams/${team.id}/bots/${bot.id}/mcp/`
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [mcpClients, setMcpClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)

  const handleCopy = (text, setCopied) => {
    if (!hasStandardPlan) {
      setShowUpgrade(true)
      return
    }
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (hasStandardPlan) {
      setLoadingClients(true)
      fetch(`/api/teams/${team.id}/mcp-oauth/clients`)
        .then((res) => res.json())
        .then((data) => {
          const clients = data.clients || data || []
          // Filter clients that have access to this bot
          const botClients = clients.filter((client) => {
            const botIds = client.bot_ids || client.botIds || []
            return botIds.includes(bot.id)
          })
          setMcpClients(botClients)
        })
        .catch((error) => {
          console.error('Error fetching MCP clients:', error)
        })
        .finally(() => {
          setLoadingClients(false)
        })
    }
  }, [team.id, bot.id, hasStandardPlan])

  if (!hasStandardPlan) {
    return (
      <>
        <p className="text-md text-gray-800">
          Expose this bot as a Model Context Protocol (MCP) server so your
          documentation can be searched and fetched by clients.
        </p>
        <p className="mt-2 text-sm text-gray-800">
          Upgrade to the Standard plan to enable the DocsBot MCP server
          integration.
        </p>
        <div className="mt-3 space-y-3 text-sm text-gray-800">
          <div>
            <span className="font-semibold text-gray-900">MCP server URL</span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={serverUrl}
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 font-mono text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={() => handleCopy(serverUrl, setCopiedEndpoint)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
              >
                <span className="relative h-4 w-4">
                  <ClipboardIcon
                    className="absolute inset-0 h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          Upgrade Plan
        </button>
      </>
    )
  }

  return (
    <>
      <p className="text-md text-gray-800">
        Expose this bot as a Model Context Protocol (MCP) server so
        clients can search and fetch trusted documents from its
        training library.
      </p>
      <div className="mt-3 space-y-3 text-sm text-gray-800">
        <div>
          <span className="font-semibold text-gray-900">MCP server URL</span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value={serverUrl}
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 font-mono text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleCopy(serverUrl, setCopiedEndpoint)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                    copiedEndpoint ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${
                    copiedEndpoint ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
        {bot.privacy === 'private' && (
          <div>
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Authentication is required for private bots. OAuth clients must be authorized 
              through the authorization flow before they can access this bot.
            </p>
          </div>
        )}
        {(loadingClients || mcpClients.length > 0) && (
          <div>
            <span className="font-semibold text-gray-900">Connected MCP Clients</span>
            {loadingClients ? (
              <p className="mt-1 text-sm text-gray-600">Loading...</p>
            ) : (
              <div className="mt-1 max-h-32 overflow-y-auto rounded border border-gray-200 bg-gray-50">
                <ul className="space-y-1 p-1">
                  {mcpClients.map((client) => {
                    // Get display name from redirect_domain if available
                    const redirectDomain = client.redirect_domain
                    const getInterfaceName = (domain) => {
                      if (!domain) return null
                      const domainLower = domain.toLowerCase()
                      const domainMap = {
                        'claude.ai': 'Claude',
                        'anthropic.com': 'Claude',
                        'console.anthropic.com': 'Claude Console',
                        'chatgpt.com': 'ChatGPT',
                        'chat.openai.com': 'ChatGPT',
                        'openai.com': 'ChatGPT',
                        'platform.openai.com': 'OpenAI Platform',
                        'cursor.sh': 'Cursor',
                        'cursor.com': 'Cursor',
                        'continue.dev': 'Continue',
                        'aider.chat': 'Aider',
                        'github.com': 'GitHub',
                        'github.dev': 'GitHub Codespaces',
                        'vscode.dev': 'VS Code',
                        'code.visualstudio.com': 'VS Code',
                      }
                      if (domainMap[domainLower]) return domainMap[domainLower]
                      if (domainLower.includes('claude') || domainLower.includes('anthropic')) return 'Claude'
                      if (domainLower.includes('chatgpt') || domainLower.includes('openai')) return 'ChatGPT'
                      if (domainLower.includes('cursor')) return 'Cursor'
                      if (domainLower.includes('continue')) return 'Continue'
                      if (domainLower.includes('aider')) return 'Aider'
                      return null
                    }
                    const interfaceName = redirectDomain ? getInterfaceName(redirectDomain) : null
                    const displayName = interfaceName || redirectDomain || client.client_id || client.clientId || 'Unknown'
                    const clientId = client.client_id || client.clientId
                    
                    return (
                      <li key={clientId} className="text-sm">
                        <Tooltip content={clientId ? `MCP Client ID: ${clientId}` : 'Unknown Client ID'}>
                          <div className="flex items-center justify-between rounded bg-white px-2 py-1.5 hover:bg-gray-100 cursor-help">
                            <span className="text-xs font-medium text-gray-700">{displayName}</span>
                            {client.authorized_at || client.authorizedAt ? (
                              <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">
                                {new Date((client.authorized_at || client.authorizedAt) * 1000).toLocaleDateString()}
                              </span>
                            ) : null}
                          </div>
                        </Tooltip>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-600">
              Manage all MCP OAuth clients from your{' '}
              <Link href="/app/api" className="text-cyan-600 hover:text-cyan-800 underline">
                API & Integrations settings
              </Link>.
            </p>
          </div>
        )}
      </div>
      <Link
        href="/documentation/developer/mcp-server"
        target={openLinksInNewTab ? '_blank' : undefined}
        className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
      >
        Read Documentation
        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" aria-hidden="true" />
      </Link>
    </>
  )
}

const GPTActionInfo = ({ team, bot, openLinksInNewTab }) => {
  const [copiedSchema, setCopiedSchema] = useState(false)
  const [copiedPrivacy, setCopiedPrivacy] = useState(false)

  const handleCopy = (text, setCopied) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <p className="text-md text-gray-800">
        Give your custom GPTs access to this DocsBot training library with our
        custom action.
      </p>
      <div className="mt-3 space-y-2">
        <div className="text-sm">
          <span className="block font-semibold">OpenAPI Schema URL:</span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value={`https://docsbot.ai/api/teams/${team.id}/bots/${bot.id}/openapi`}
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-6 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() =>
                handleCopy(
                  `https://docsbot.ai/api/teams/${team.id}/bots/${bot.id}/openapi`,
                  setCopiedSchema,
                )
              }
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${copiedSchema ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${copiedSchema ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
        <div className="text-sm">
          <span className="block font-semibold">Privacy Policy URL:</span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value="https://docsbot.ai/legal/privacy-policy"
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() =>
                handleCopy(
                  'https://docsbot.ai/legal/privacy-policy',
                  setCopiedPrivacy,
                )
              }
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${copiedPrivacy ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${copiedPrivacy ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      <Link
        href="https://docsbot.ai/documentation/doc/how-to-create-openai-gpt-chatbots-with-access-to-your-trained-documentation"
        target={openLinksInNewTab ? "_blank" : undefined}
        rel={openLinksInNewTab ? "noopener noreferrer" : undefined}
        className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
      >
        Read documentation
        <ArrowTopRightOnSquareIcon
          className="ml-1 h-4 w-4"
          aria-hidden="true"
        />
      </Link>
    </>
  )
}

const WorkflowAutomationsInfo = ({ team, hasPowerPlan, setShowUpgrade, openLinksInNewTab }) => {
  return (
    <>
      <p className="text-md text-gray-800">
        Connect DocsBot AI to thousands of apps using automation platforms to
        create powerful workflows. Train your bot or use it to respond to
        triggers in your apps like a new message, task, or form submission.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="https://zapier.com/apps/docsbot-ai/integrations"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/zapier.svg"
            alt="Zapier Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          Zapier
        </Link>
        <Link
          href="https://www.make.com/en/hq/app-invitation/e73df823a271deb12baa80178f4429b7"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/make.svg"
            alt="Make Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          Make
        </Link>
        <Link
          href="https://ottokit.com/integrations/docsbot?aff=5abd7bee"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/ottokit.png"
            alt="OttoKit Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          OttoKit
        </Link>
        <Link
          href="https://payments.pabbly.com/api/affurl/RVYZ07kQyUZ0Z1HUKZ1m/CNd76ecbplizUZ1mp?target=9Z2AHyhSldo6KI1Fn"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/pabbly.webp"
            alt="Pabbly Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          Pabbly
        </Link>
        <Link
          href="https://pipedream.com/apps/docsbot-ai"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <span className="mr-2 font-humanist text-green-500">p</span>
          Pipedream
        </Link>
        <Link
          href="https://n8n.io/integrations/docsbot-ai/"
          target="_blank"
          rel="noopener noreferrer"
          className={classNames(
            'col-span-1 inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/n8n.svg"
            alt="n8n Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          n8n
        </Link>
      </div>
      {!hasPowerPlan && (
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          <CreditCardIcon
            className="mr-1.5 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          Upgrade Plan
        </button>
      )}
      <Link
        href="https://docsbot.ai/documentation#integrations"
        target={openLinksInNewTab ? "_blank" : undefined}
        rel={openLinksInNewTab ? "noopener noreferrer" : undefined}
        className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
      >
        Read documentation
        <ArrowTopRightOnSquareIcon
          className="ml-1 h-4 w-4"
          aria-hidden="true"
        />
      </Link>
    </>
  )
}

const APIInfo = ({ team, bot, openLinksInNewTab }) => {
  const [copiedTeamId, setCopiedTeamId] = useState(false)
  const [copiedBotId, setCopiedBotId] = useState(false)

  const handleCopy = (text, setCopied) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <p className="text-md text-gray-800">
        Integrate DocsBot AI with your apps using our powerful chat and admin
        APIs. Use these identifiers with the API for admin and chat
        interactions.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <div className="rounded border border-gray-200 p-2">
          <span className="text-xs font-semibold text-gray-500">Team ID</span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value={team.id}
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleCopy(team.id, setCopiedTeamId)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                    copiedTeamId ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${
                    copiedTeamId ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
        <div className="rounded border border-gray-200 p-2">
          <span className="text-xs font-semibold text-gray-500">Bot ID</span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value={bot.id}
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleCopy(bot.id, setCopiedBotId)}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                    copiedBotId ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${
                    copiedBotId ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Link
            href="/documentation/developer"
            target={openLinksInNewTab ? "_blank" : undefined}
            className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800"
          >
            API Documentation
            <ArrowTopRightOnSquareIcon
              className="ml-1 h-4 w-4"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </>
  )
}

export default function IntegrationsGrid({
  team,
  bot,
  integrations = [],
  compact = false,
  openLinksInNewTab = false,
}) {
  const helpScoutIntegration = integrations?.find((i) => i.id === 'helpscout')
  const [subscribedTags, setSubscribedTags] = useState([])
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isConnectingSlack, setIsConnectingSlack] = useState(false)
  const [slackConnection, setSlackConnection] = useState({
    slackBotUserId: bot.slackBotUserId,
    slackTeamId: bot.slackTeamId,
    slackTeamName: bot.slackTeamName,
    slackConnectedAt: bot.slackConnectedAt,
  })

  const hasPowerPlan = checkPlanPermission(team, 'personal').allowed
  const mcpPlanPermission = checkPlanPermission(team, 'standard')
  const hasStandardPlan = mcpPlanPermission.allowed

  // Check if Slack is connected
  const isSlackConnected =
    slackConnection.slackBotUserId && slackConnection.slackTeamId

  // Add an effect to listen for postMessage events from the Slack OAuth callback window
  useEffect(() => {
    const handlePostMessage = (event) => {
      console.log('Received postMessage event:', event.data)

      // Allow messages from any origin that have our expected format
      if (event.data && typeof event.data === 'object') {
        // Check if the message is a Slack connected message with the expected format
        if (
          event.data.type === 'SLACK_CONNECTED' &&
          event.data.teamId === team.id &&
          event.data.botId === bot.id
        ) {
          console.log(
            'Valid Slack connection message received, updating state',
            event.data,
          )

          // Update the Slack connection state with the new values
          setSlackConnection({
            slackBotUserId: event.data.slackBotUserId,
            slackTeamId: event.data.slackTeamId,
            slackTeamName: event.data.slackTeamName,
            slackConnectedAt: event.data.slackConnectedAt,
          })

          // Also update the connecting state
          setIsConnectingSlack(false)
        }
      }
    }

    // Add event listener for messages
    window.addEventListener('message', handlePostMessage)

    console.log('PostMessage event listener added for Slack integration')

    // Remove event listener on cleanup
    return () => {
      console.log('Removing postMessage event listener')
      window.removeEventListener('message', handlePostMessage)
    }
  }, [team.id, bot.id])

  useEffect(() => {
    if (!helpScoutIntegration || !helpScoutIntegration?.tags) {
      return
    }

    let tags = []
    for (const tag of helpScoutIntegration.tags) {
      const assignedId = tag?.assignedBot
      if (assignedId === bot.id) {
        tags.push(tag)
      }
    }

    setSubscribedTags(tags)
  }, [helpScoutIntegration, bot.id])

  const handleConnectSlack = async () => {
    setIsConnectingSlack(true)

    try {
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/integrations/slack/authorize`,
      )

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.url) {
        const popupFeatures =
          'width=800,height=600,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no'

        const slackWindow = window.open(
          data.url,
          'Connect to Slack',
          popupFeatures,
        )

        if (!slackWindow) {
          throw new Error('Popup was blocked by the browser or failed to open')
        }

        slackWindow.focus()

        // Poll for changes to the window status
        const checkInterval = 1000 // Check every second
        const maxChecks = 300 // Maximum number of checks (5 minutes)
        let checkCount = 0

        const checkIntegrationStatus = setInterval(() => {
          checkCount++

          // Check if we've exceeded the maximum number of checks
          if (checkCount > maxChecks) {
            clearInterval(checkIntegrationStatus)
            setIsConnectingSlack(false)
            console.log('Stopped checking for Slack window - max time exceeded')
          }

          // Check if the window is closed
          if (slackWindow.closed) {
            clearInterval(checkIntegrationStatus)
            setIsConnectingSlack(false)
            console.log('Slack authorization window was closed')

            // The page may be reloaded by the postMessage event listener if successful,
            // but we'll also check the integration status directly after a delay
            setTimeout(async () => {
              try {
                // Check if integration is now connected by fetching fresh bot data
                const statusResponse = await fetch(
                  `/api/teams/${team.id}/bots/${bot.id}`,
                )
                if (statusResponse.ok) {
                  const botData = await statusResponse.json()
                  if (
                    botData.slackBotToken &&
                    botData.slackBotUserId &&
                    botData.slackTeamId
                  ) {
                    console.log(
                      'Slack integration confirmed as connected via API check',
                    )
                    window.location.reload()
                  }
                }
              } catch (statusError) {
                console.error(
                  'Failed to check integration status:',
                  statusError,
                )
              }
            }, 2000)
          }
        }, checkInterval)
      } else {
        throw new Error('No redirect URL returned from the API')
      }
    } catch (error) {
      console.error('Error connecting to Slack:', error)
    } finally {
      setIsConnectingSlack(false)
    }
  }

  const handleDisconnectSlack = async () => {
    try {
      setIsConnectingSlack(true)

      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/integrations/slack/disconnect`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to disconnect Slack')
      }

      // Update local state
      setSlackConnection({
        slackBotUserId: null,
        slackTeamId: null,
        slackTeamName: null,
        slackConnectedAt: null,
      })
    } catch (error) {
      console.error('Error disconnecting Slack:', error)
    } finally {
      setIsConnectingSlack(false)
    }
  }

  return (
    <>
      <div className={`grid grid-cols-1 gap-6 ${compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {/* Chat Widget Card */}
        <IntegrationCard
          title="Chat Widget"
          icon={
            <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-cyan-600" />
          }
        >
          <ChatWidgetInfo bot={bot} openLinksInNewTab={openLinksInNewTab} />
        </IntegrationCard>

        {/* Share Links Card */}
        <IntegrationCard title="Share Links" icon={<ShareIcon className="h-8 w-8" />}>
          <ShareLinksInfo team={team} bot={bot} />
        </IntegrationCard>

        {/* Slack Integration Card */}
        {true && (
          <IntegrationCard
            title="Slack Integration"
            icon={<SlackLogo className="h-8 w-8" />}
            minPlan={
              !checkPlanPermission(team, 'personal', 'slack').allowed
                ? checkPlanPermission(team, 'personal', 'slack').requiredPlanLabel
                : undefined
            }
          >
            <SlackInfo
              team={team}
              bot={bot}
              slackConnection={slackConnection}
              isSlackConnected={isSlackConnected}
              hasPowerPlan={hasPowerPlan}
              isConnectingSlack={isConnectingSlack}
              handleConnectSlack={handleConnectSlack}
              handleDisconnectSlack={handleDisconnectSlack}
              setShowUpgrade={setShowUpgrade}
              openLinksInNewTab={openLinksInNewTab}
            />
          </IntegrationCard>
        )}

        {/* Workflow Automations Card */}
        <IntegrationCard
          title="Workflow Automations"
          icon={<BoltIcon className="h-8 w-8 text-cyan-600" />}
          minPlan={
            !checkPlanPermission(team, 'personal', 'automations').allowed
              ? checkPlanPermission(team, 'personal', 'automations')
                  .requiredPlanLabel
              : undefined
          }
        >
          <WorkflowAutomationsInfo
            team={team}
            hasPowerPlan={hasPowerPlan}
            setShowUpgrade={setShowUpgrade}
            openLinksInNewTab={openLinksInNewTab}
          />
        </IntegrationCard>

        {/* Help Scout Integration Card */}
        <IntegrationCard
          title="Help Scout Replies"
          icon={<HelpScoutLogo className="h-8 w-8 text-[#1292ee]" />}
        >
          <HelpScoutInfo
            helpScoutIntegration={helpScoutIntegration}
            subscribedTags={subscribedTags}
            bot={bot}
            openLinksInNewTab={openLinksInNewTab}
          />
        </IntegrationCard>

        {/* MCP Deep Research Card */}
        <IntegrationCard
          title="MCP Server"
          icon={
            <Image
              src={mcpLogo}
              alt="MCP Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          }
          isNew
          minPlan={!hasStandardPlan ? mcpPlanPermission.requiredPlanLabel : undefined}
        >
          <MCPIntegrationInfo
            team={team}
            bot={bot}
            openLinksInNewTab={openLinksInNewTab}
            hasStandardPlan={hasStandardPlan}
            setShowUpgrade={setShowUpgrade}
          />
        </IntegrationCard>

        {/* ChatGPT Action Card */}
        <IntegrationCard
          title="ChatGPT Custom GPT"
          icon={<OpenAILogo className="h-8 w-8" />}
        >
          <GPTActionInfo team={team} bot={bot} openLinksInNewTab={openLinksInNewTab} />
        </IntegrationCard>

        {/* API Documentation Card */}
        <IntegrationCard
          title="API Documentation"
          icon={<CodeBracketSquareIcon className="h-8 w-8" />}
        >
          <APIInfo team={team} bot={bot} openLinksInNewTab={openLinksInNewTab} />
        </IntegrationCard>
      </div>

      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
    </>
  )
}

