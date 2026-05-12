import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  LinkIcon,
  ClipboardIcon,
  ClipboardDocumentIcon,
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
import { getBotIdFromChannelMapping, getChannelDisplayName, getValidChannelEntries } from '@/lib/slackHelpers'
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

const ChatWidgetInfo = ({ bot, openLinksInNewTab, newDashboard, onConfigureClick }) => {
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
        {newDashboard ? (
          <button
            onClick={onConfigureClick}
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <ChatBubbleLeftEllipsisIcon className="mr-2 h-4 w-4" />
            Configure Widget
          </button>
        ) : (
          <Link
            href={`/app/bots/${bot.id}/widget/design`}
            target={openLinksInNewTab ? "_blank" : undefined}
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <ChatBubbleLeftEllipsisIcon className="mr-2 h-4 w-4" />
            Configure Widget
          </Link>
        )}
      </div>
    </>
  )
}

const ShareLinksInfo = ({ team, bot }) => {
  const hasScreenshot = bot.brandAnalysis?.screenshotUrl

  return (
    <>
      <p className="text-md text-gray-800">
        Share {hasScreenshot ? 'these public links' : 'this public link'} for
        people to interact with your bot.
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
              <ArrowTopRightOnSquareIcon
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
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
  botSlackMappings,
  isSlackConnected,
  hasPowerPlan,
  canModifyTeam,
  setShowUpgrade,
  openLinksInNewTab,
}) => {
  if (!isSlackConnected) {
    return (
      <>
        <div>
          <p className="text-md text-gray-800">
            Connect your bot to Slack to answer questions directly in your workspace channels. Slack is managed at the team level.
          </p>
          {!hasPowerPlan && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                Upgrade Plan
              </button>
            </div>
          )}
          <div className="mt-4">
            <Link
              href="/app/api#slack-settings"
              className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              <SlackLogo className="mr-2 h-4 w-4" />
              {canModifyTeam ? 'Manage Slack in Team settings' : 'View Team settings'}
            </Link>
            <div className="mt-3 flex justify-end">
              <Link
                href="https://docsbot.ai/documentation/doc/slack-integration"
                target={openLinksInNewTab ? '_blank' : undefined}
                rel={openLinksInNewTab ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800"
              >
                Read documentation
                <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div>
        <p className="text-md text-gray-800">
          Your team has Slack connected. Here&apos;s where this bot answers questions:
        </p>
        {botSlackMappings.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {botSlackMappings.map(({ workspaceName, isDefaultForWorkspace, channelEntries }) => (
              <li key={workspaceName} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{workspaceName}</span>
                {isDefaultForWorkspace && (
                  <span className="ml-2 inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800">
                    Default
                  </span>
                )}
                {channelEntries.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    Channels: <code className="rounded bg-gray-200 px-1">{channelEntries.map((c) => c.channelName).join(', ')}</code>
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            This bot isn&apos;t assigned to any workspace or channel yet. To use it in Slack, set it as the default or assign it to specific channels in Team settings.
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/app/api#slack-settings"
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <SlackLogo className="mr-2 h-4 w-4" />
            Configure Slack Integration
          </Link>
        </div>
      </div>
      <Link
        href="https://docsbot.ai/documentation/doc/slack-integration"
        target={openLinksInNewTab ? '_blank' : undefined}
        rel={openLinksInNewTab ? 'noopener noreferrer' : undefined}
        className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
      >
        Read documentation
        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" aria-hidden="true" />
      </Link>
    </>
  )
}

const HelpScoutInfo = ({
  helpScoutIntegration,
  subscribedTags,
  defaultMailboxes,
  bot,
  openLinksInNewTab,
}) => {
  if (!helpScoutIntegration || !helpScoutIntegration?.webhookSecret) {
    return (
      <p className="text-md text-gray-800">
        If you use Help Scout, you can use our replies feature to generate a
        draft/published reply or note to customer support tickets. This can save
        your support staff precious time and guide them by pre-writing answers
        to common issues. Please configure the{' '}
        <Link
          href="/app/api"
          target={openLinksInNewTab ? '_blank' : undefined}
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
          <p className="text-sm font-medium text-gray-700">
            This bot is not subscribed to any Help Scout tags.
          </p>
        )}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-900">
            Default mailboxes
          </p>
          {defaultMailboxes.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {defaultMailboxes.map((mailbox) => (
                <li key={mailbox.id} className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {mailbox.name}
                  </span>
                  <span className="text-gray-400">{mailbox.slug}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              This bot is not assigned as a default mailbox listener.
            </p>
          )}
        </div>
        <p className="text-md mt-3">
          You can edit subscribed tags in your{' '}
          <Link
            href="/app/api"
            target={openLinksInNewTab ? '_blank' : undefined}
            className="text-cyan-600 underline hover:text-cyan-800"
          >
            Integrations tab
          </Link>{' '}
        </p>
      </div>
    </div>
  )
}

const WebhooksInfo = ({ bot, openLinksInNewTab }) => {
  return (
    <>
      <p className="text-md text-gray-800">
        Send event-based notifications to Zapier or any endpoint using REST
        hooks.
      </p>
      <ul className="mt-2 list-disc pl-5 text-gray-800">
        <li>
          Events include <code>lead.created</code>,{' '}
          <code>deep_research.done</code>, <code>conversation.escalated</code>,
          and <code>conversation.rated</code>
        </li>
        <li>Compatible with Zapier Subscribe/Unsubscribe flow</li>
        <li>Supports multiple webhook events per subscription</li>
      </ul>
      <div className="mt-4">
        <Link
          href={`/app/bots/${bot.id}/configure/webhooks`}
          shallow={!openLinksInNewTab}
          target={openLinksInNewTab ? '_blank' : undefined}
          className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Manage Webhooks
        </Link>
      </div>
    </>
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
  const questionHistoryServerUrl = `https://api.docsbot.ai/teams/${team.id}/bots/${bot.id}/questions/mcp/`
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [copiedQuestionHistoryEndpoint, setCopiedQuestionHistoryEndpoint] =
    useState(false)
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
        .then((res) => {
          if (!res.ok) {
            return res.json().then((errorData) => {
              throw new Error(
                errorData.message || `HTTP error! status: ${res.status}`,
              )
            })
          }
          return res.json()
        })
        .then((data) => {
          // Ensure clients is always an array
          // Check if data.clients exists and is an array, otherwise default to empty array
          const clients = Array.isArray(data?.clients) ? data.clients : []
          // Filter clients that have access to this bot
          const botClients = clients.filter((client) => {
            const botIds = client.bot_ids || client.botIds || []
            return botIds.includes(bot.id)
          })
          setMcpClients(botClients)
        })
        .catch((error) => {
          console.error('Error fetching MCP clients:', error)
          // Set empty array on error to prevent UI issues
          setMcpClients([])
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
          <div>
            <span className="font-semibold text-gray-900">
              Question History MCP URL
            </span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={questionHistoryServerUrl}
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 font-mono text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={() =>
                  handleCopy(
                    questionHistoryServerUrl,
                    setCopiedQuestionHistoryEndpoint,
                  )
                }
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
            <p className="mt-1 text-xs text-gray-600">
              Requires Standard plan with at least 5,000 logged questions.
            </p>
          </div>
        </div>
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
      </>
    )
  }

  return (
    <>
      <p className="text-md text-gray-800">
        Expose this bot as a Model Context Protocol (MCP) server so clients can
        search and fetch trusted documents from its training library and
        question history.
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
                    copiedEndpoint
                      ? 'scale-0 opacity-0'
                      : 'scale-100 opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${
                    copiedEndpoint
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
        <div>
          <span className="font-semibold text-gray-900">
            Question History MCP URL
          </span>
          <div className="relative mt-1">
            <input
              type="text"
              readOnly
              value={questionHistoryServerUrl}
              onClick={(e) => e.target.select()}
              className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 font-mono text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
            />
            <button
              onClick={() =>
                handleCopy(
                  questionHistoryServerUrl,
                  setCopiedQuestionHistoryEndpoint,
                )
              }
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <span className="relative h-4 w-4">
                <ClipboardIcon
                  className={`absolute inset-0 h-4 w-4 transition-all duration-200 ${
                    copiedQuestionHistoryEndpoint
                      ? 'scale-0 opacity-0'
                      : 'scale-100 opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <CheckIcon
                  className={`absolute inset-0 h-4 w-4 text-green-500 transition-all duration-200 ${
                    copiedQuestionHistoryEndpoint
                      ? 'scale-100 opacity-100'
                      : 'scale-0 opacity-0'
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
              <strong>Note:</strong> Private bots always require authentication
              for both MCP endpoints. OAuth clients must be authorized through
              the authorization flow before they can access this bot.
            </p>
          </div>
        )}
        {(loadingClients || mcpClients.length > 0) && (
          <div>
            <span className="font-semibold text-gray-900">
              Connected MCP Clients
            </span>
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
                      if (
                        domainLower.includes('claude') ||
                        domainLower.includes('anthropic')
                      )
                        return 'Claude'
                      if (
                        domainLower.includes('chatgpt') ||
                        domainLower.includes('openai')
                      )
                        return 'ChatGPT'
                      if (domainLower.includes('cursor')) return 'Cursor'
                      if (domainLower.includes('continue')) return 'Continue'
                      if (domainLower.includes('aider')) return 'Aider'
                      return null
                    }
                    const interfaceName = redirectDomain
                      ? getInterfaceName(redirectDomain)
                      : null
                    const displayName =
                      interfaceName ||
                      redirectDomain ||
                      client.client_id ||
                      client.clientId ||
                      'Unknown'
                    const clientId = client.client_id || client.clientId

                    return (
                      <li key={clientId} className="text-sm">
                        <Tooltip
                          content={
                            clientId
                              ? `MCP Client ID: ${clientId}`
                              : 'Unknown Client ID'
                          }
                        >
                          <div className="flex cursor-help items-center justify-between rounded bg-white px-2 py-1.5 hover:bg-gray-100">
                            <span className="text-xs font-medium text-gray-700">
                              {displayName}
                            </span>
                            {client.authorized_at || client.authorizedAt ? (
                              <span className="ml-2 whitespace-nowrap text-[10px] text-gray-400">
                                {new Date(
                                  (client.authorized_at ||
                                    client.authorizedAt) * 1000,
                                ).toLocaleDateString()}
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
              <Link
                href="/app/api"
                className="text-cyan-600 underline hover:text-cyan-800"
              >
                API & Integrations settings
              </Link>
              .
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
        <ArrowTopRightOnSquareIcon
          className="ml-1 h-4 w-4"
          aria-hidden="true"
        />
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
        target={openLinksInNewTab ? '_blank' : undefined}
        rel={openLinksInNewTab ? 'noopener noreferrer' : undefined}
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

const WorkflowAutomationsInfo = ({
  team,
  hasPowerPlan,
  setShowUpgrade,
  openLinksInNewTab,
}) => {
  return (
    <>
      <p className="text-md text-gray-800">
        Connect DocsBot to thousands of apps using automation platforms to
        create powerful workflows. Train your bot or use it to respond to
        triggers in your apps like a new message, task, or form submission.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="https://zapier.com/apps/docsbot-ai/integrations"
          target="_blank"
          rel="noopener"
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
          rel="noopener"
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
          rel="noopener"
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
          rel="noopener"
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
          rel="noopener"
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
          rel="noopener"
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
        <Link
          href="https://viasocket.com/integrations/docsbot"
          target="_blank"
          rel="noopener"
          className={classNames(
            'inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            !hasPowerPlan
              ? 'pointer-events-none cursor-not-allowed opacity-50'
              : '',
          )}
        >
          <Image
            src="/images/logo-timeline/viasocket.png"
            alt="viaSocket Logo"
            width={16}
            height={16}
            className="mr-2"
          />
          viaSocket
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
        target={openLinksInNewTab ? '_blank' : undefined}
        rel={openLinksInNewTab ? 'noopener noreferrer' : undefined}
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
        Integrate DocsBot with your apps using our powerful chat and admin
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
            target={openLinksInNewTab ? '_blank' : undefined}
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
  newDashboard = false,
  canModifyTeam = false,
}) {
  const helpScoutIntegration = integrations?.find((i) => i.id === 'helpscout')
  const slackIntegration = integrations?.find((i) => i.id === 'slack')
  const [subscribedTags, setSubscribedTags] = useState([])
  const [defaultMailboxes, setDefaultMailboxes] = useState([])
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Workspace-level Slack: use team.slackWorkspaceIds for list, integrations/slack.workspaces for details
  const workspaces = slackIntegration?.workspaces || {}
  const workspaceIds = Array.isArray(team?.slackWorkspaceIds) && team.slackWorkspaceIds.length > 0
    ? team.slackWorkspaceIds
    : Object.keys(workspaces)
  const connectedWorkspaces = workspaceIds
    .map((id) => [id, workspaces[id]])
    .filter(([, ws]) => ws && ws?.slackTeamId)
  const hasLegacySlack = bot.slackTeamId && bot.slackTeamName
  const isSlackConnected = connectedWorkspaces.length > 0 || hasLegacySlack

  // Build read-only mappings: which workspaces/channels this bot is default for
  let botSlackMappings = connectedWorkspaces
    .map(([workspaceId, ws]) => {
      const isDefaultForWorkspace = ws?.defaultBotId === bot.id || (hasLegacySlack && ws?.slackTeamId === bot.slackTeamId)
      const channelEntries = getValidChannelEntries(ws?.channelBotMap || {})
        .filter(([, mapping]) => getBotIdFromChannelMapping(mapping) === bot.id)
        .map(([chId, mapping]) => ({ channelId: chId, channelName: getChannelDisplayName(chId, mapping) }))
      if (!isDefaultForWorkspace && channelEntries.length === 0) return null
      return {
        workspaceName: ws?.slackTeamName || `Workspace ${workspaceId}`,
        isDefaultForWorkspace,
        channelEntries,
      }
    })
    .filter(Boolean)
  if (hasLegacySlack && botSlackMappings.length === 0) {
    botSlackMappings = [{ workspaceName: bot.slackTeamName || 'Slack workspace', isDefaultForWorkspace: true, channelEntries: [] }]
  }
  const [showWidgetModal, setShowWidgetModal] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedIframe, setCopiedIframe] = useState(false)

  const hasPowerPlan = checkPlanPermission(team, 'personal').allowed
  const mcpPlanPermission = checkPlanPermission(team, 'standard')
  const hasStandardPlan = mcpPlanPermission.allowed

  useEffect(() => {
    if (!helpScoutIntegration || !helpScoutIntegration?.tags) {
      setSubscribedTags([])
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

  useEffect(() => {
    if (
      !helpScoutIntegration ||
      !helpScoutIntegration?.mailboxes ||
      !helpScoutIntegration?.assignedMailboxes
    ) {
      setDefaultMailboxes([])
      return
    }

    const assignedMailboxIds = new Set(
      Object.entries(helpScoutIntegration.assignedMailboxes)
        .filter(([, assignedBotId]) => assignedBotId === bot.id)
        .map(([mailboxId]) => String(mailboxId)),
    )

    const assignedMailboxes = helpScoutIntegration.mailboxes.filter((mailbox) =>
      assignedMailboxIds.has(String(mailbox.id)),
    )

    setDefaultMailboxes(assignedMailboxes)
  }, [helpScoutIntegration, bot.id])

  return (
    <>
      <div
        className={`grid grid-cols-1 gap-6 ${compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
      >
        {/* Chat Widget Card */}
        <IntegrationCard
          title="Chat Widget"
          icon={
            <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-cyan-600" />
          }
        >
          <ChatWidgetInfo
            bot={bot}
            openLinksInNewTab={openLinksInNewTab}
            newDashboard={newDashboard}
            onConfigureClick={() => setShowWidgetModal(true)}
          />
        </IntegrationCard>

        {/* Share Links Card */}
        <IntegrationCard
          title="Share Links"
          icon={<ShareIcon className="h-8 w-8" />}
        >
          <ShareLinksInfo team={team} bot={bot} />
        </IntegrationCard>

        {/* Slack Integration Card */}
        {true && (
          <IntegrationCard
            title="Slack Integration"
            icon={<SlackLogo className="h-8 w-8" />}
            minPlan={
              !checkPlanPermission(team, 'personal', 'slack').allowed
                ? checkPlanPermission(team, 'personal', 'slack')
                    .requiredPlanLabel
                : undefined
            }
          >
            <SlackInfo
              team={team}
              bot={bot}
              botSlackMappings={botSlackMappings}
              isSlackConnected={isSlackConnected}
              hasPowerPlan={hasPowerPlan}
              canModifyTeam={canModifyTeam}
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
            defaultMailboxes={defaultMailboxes}
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
          minPlan={
            !hasStandardPlan ? mcpPlanPermission.requiredPlanLabel : undefined
          }
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
          <GPTActionInfo
            team={team}
            bot={bot}
            openLinksInNewTab={openLinksInNewTab}
          />
        </IntegrationCard>

        {/* Webhooks Card */}
        <IntegrationCard
          title="Webhooks"
          icon={<LinkIcon className="h-8 w-8 text-cyan-600" />}
        >
          <WebhooksInfo bot={bot} openLinksInNewTab={openLinksInNewTab} />
        </IntegrationCard>

        {/* API Documentation Card */}
        <IntegrationCard
          title="API Documentation"
          icon={<CodeBracketSquareIcon className="h-8 w-8" />}
        >
          <APIInfo
            team={team}
            bot={bot}
            openLinksInNewTab={openLinksInNewTab}
          />
        </IntegrationCard>
      </div>

      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />

      <Transition.Root show={showWidgetModal} as={Fragment}>
        <Dialog as="div" className="relative z-modal" onClose={setShowWidgetModal}>
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

          <div className="fixed inset-0 z-modal overflow-y-auto">
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setShowWidgetModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="p-8">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">
                      Configure Chat Widget
                    </h2>
                    <p className="mb-6 text-sm text-gray-600">
                      Embed this DocsBot as a floating widget on your website by adding the script below, or use the iframe embed for a fixed position.
                    </p>

                    <div className="space-y-6">
                      {/* Script Embed */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-900">Script Embed</label>
                          <button
                            onClick={() => {
                              const embed = `<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};</script>\n<script type="text/javascript">\n  DocsBotAI.init({id: "${team.id}/${bot.id}"});\n</script>`
                              navigator.clipboard.writeText(embed)
                              setCopiedEmbed(true)
                              setTimeout(() => setCopiedEmbed(false), 2000)
                            }}
                            className="text-xs font-medium text-cyan-600 hover:text-cyan-500 flex items-center"
                          >
                            {copiedEmbed ? <><CheckIcon className="mr-1 h-3 w-3" /> Copied!</> : <><ClipboardDocumentIcon className="mr-1 h-3 w-3" /> Copy script</>}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-gray-800 p-3 text-[10px] text-gray-100 font-mono leading-relaxed">
                          {`<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};</script>\n<script type="text/javascript">\n  DocsBotAI.init({id: "${team.id}/${bot.id}"});\n</script>`}
                        </pre>
                      </div>

                      {/* iFrame Embed */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-semibold text-gray-900">iFrame Embed</label>
                          <button
                            onClick={() => {
                              const iframe = `<iframe src="https://docsbot.ai/iframe/${team.id}/${bot.id}" width="600" height="650" frameborder="0" allowtransparency="true" scrolling="no" allow="microphone; camera"></iframe>`
                              navigator.clipboard.writeText(iframe)
                              setCopiedIframe(true)
                              setTimeout(() => setCopiedIframe(false), 2000)
                            }}
                            className="text-xs font-medium text-cyan-600 hover:text-cyan-500 flex items-center"
                          >
                            {copiedIframe ? <><CheckIcon className="mr-1 h-3 w-3" /> Copied!</> : <><ClipboardDocumentIcon className="mr-1 h-3 w-3" /> Copy iframe</>}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-md bg-gray-800 p-3 text-[10px] text-gray-100 font-mono leading-relaxed">
                          {`<iframe src="https://docsbot.ai/iframe/${team.id}/${bot.id}" width="600" height="650" frameborder="0" allowtransparency="true" scrolling="no" allow="microphone; camera"></iframe>`}
                        </pre>
                      </div>

                      <div className="mt-8 border-t border-gray-100 pt-6">
                        <Link
                          href={`/app/bots/${bot.id}/widget/design`}
                          className="flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
                        >
                          Customize Widget Appearance
                        </Link>
                      </div>
                    </div>
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
