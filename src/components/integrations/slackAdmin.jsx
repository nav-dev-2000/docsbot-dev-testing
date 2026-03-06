import { useEffect, useState } from 'react'
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, LinkSlashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import {
  getSlackIntegration,
  updateSlackIntegration,
  getBotsForSlackWorkspace,
  deleteSlackWorkspace,
} from '@/services/teams'
import SlackLogo from '@/components/SlackLogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import { checkPlanPermission } from '@/utils/helpers'
import { getBotIdFromChannelMapping, getChannelDisplayName, getValidChannelEntries } from '@/lib/slackHelpers'

export default function SlackAdminIntegration({ team, bots, setErrorText }) {
  const [slackConfig, setSlackConfig] = useState({ workspaces: {} })
  const [workspaceBots, setWorkspaceBots] = useState({})
  const [workspaceEdits, setWorkspaceEdits] = useState({})
  const [connectDefaultBotId, setConnectDefaultBotId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState({})
  const [isDisconnecting, setIsDisconnecting] = useState({})
  const [isConnectingSlack, setIsConnectingSlack] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState({})
  const [successText, setSuccessText] = useState('')

  useEffect(() => {
    const loadSlackSettings = async () => {
      try {
        setIsLoading(true)
        const [integrationData, botsData] = await Promise.all([
          getSlackIntegration(team.id),
          getBotsForSlackWorkspace(team.id),
        ])

        const connectedBots = botsData?.bots || []
        const botsByWorkspace = connectedBots.reduce((acc, bot) => {
          if (!bot?.slackTeamId) return acc
          if (!acc[bot.slackTeamId]) acc[bot.slackTeamId] = []
          const teamBot = bots.find((b) => b.id === bot.id)
          acc[bot.slackTeamId].push({ ...bot, name: teamBot?.name || bot.name || bot.id })
          return acc
        }, {})

        const mergedWorkspaces = {
          ...(integrationData?.workspaces || {}),
        }

        Object.keys(botsByWorkspace).forEach((workspaceId) => {
          if (!mergedWorkspaces[workspaceId]) {
            mergedWorkspaces[workspaceId] = {}
          }
        })

        setWorkspaceBots(botsByWorkspace)
        setSlackConfig({ workspaces: mergedWorkspaces })
      } catch (error) {
        setErrorText(error?.message || 'Failed to load Slack integration settings.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSlackSettings()
  }, [team.id, bots, setErrorText])

  // Use team.slackWorkspaceIds for workspace list; fallback to workspaces keys for backward compatibility
  const workspaceIds = Array.from(
    new Set([
      ...(Array.isArray(team?.slackWorkspaceIds) ? team.slackWorkspaceIds : []),
      ...Object.keys(slackConfig.workspaces || {}),
    ]),
  ).filter(Boolean)

  const saveWorkspaceSettings = async (workspaceId) => {
    if (!workspaceId) return

    setSuccessText('')
    setIsSaving((prev) => ({ ...prev, [workspaceId]: true }))

    const wsConfig = slackConfig.workspaces?.[workspaceId] || {}
    const defaultBotId = workspaceEdits[workspaceId]?.defaultBotId ?? wsConfig.defaultBotId ?? bots[0]?.id ?? ''
    const channelBotMap = Object.fromEntries(getValidChannelEntries(wsConfig.channelBotMap || {}))
    const adminsOnly = workspaceEdits[workspaceId]?.adminsOnly ?? wsConfig.adminsOnly ?? false

    try {
      const updated = await updateSlackIntegration(team.id, {
        workspaces: {
          [workspaceId]: {
            defaultBotId: defaultBotId || undefined,
            channelBotMap,
            adminsOnly,
          },
        },
      })

      setSlackConfig((prev) => ({
        workspaces: {
          ...prev.workspaces,
          ...(updated?.workspaces || {}),
        },
      }))
      setWorkspaceEdits((prev) => {
        const next = { ...prev }
        delete next[workspaceId]
        return next
      })
      setSuccessText('Slack workspace settings saved.')
    } catch (error) {
      setErrorText(error?.message || 'Failed to save Slack workspace settings.')
    } finally {
      setIsSaving((prev) => ({ ...prev, [workspaceId]: false }))
    }
  }

  const handleDisconnectWorkspace = async (workspaceId) => {
    if (!workspaceId) return
    const wsName = workspaceBots?.[workspaceId]?.[0]?.slackTeamName || workspaceId
    if (!confirm(`Disconnect Slack workspace "${wsName}"? This will remove the connection for all bots.`)) {
      return
    }
    setSuccessText('')
    setIsDisconnecting((prev) => ({ ...prev, [workspaceId]: true }))
    try {
      const updated = await deleteSlackWorkspace(team.id, workspaceId)
      setSlackConfig({ workspaces: updated?.workspaces || {} })
      setWorkspaceBots((prev) => {
        const next = { ...prev }
        delete next[workspaceId]
        return next
      })
      setWorkspaceEdits((prev) => {
        const next = { ...prev }
        delete next[workspaceId]
        return next
      })
      setSuccessText('Slack workspace disconnected.')
    } catch (err) {
      setErrorText(err?.message || 'Failed to disconnect workspace.')
    } finally {
      setIsDisconnecting((prev) => ({ ...prev, [workspaceId]: false }))
    }
  }

  const handleReconnectWorkspace = async (workspaceId) => {
    const wsConfig = slackConfig.workspaces?.[workspaceId] || {}
    const defaultBotId = workspaceEdits[workspaceId]?.defaultBotId ?? wsConfig.defaultBotId ?? workspaceBots?.[workspaceId]?.[0]?.id ?? ''
    setIsReconnecting((prev) => ({ ...prev, [workspaceId]: true }))
    setSuccessText('')
    try {
      const params = new URLSearchParams({ afterConnect: 'team_slack_settings' })
      if (defaultBotId) params.set('defaultBotId', defaultBotId)
      const res = await fetch(`/api/teams/${team.id}/integrations/slack/authorize?${params}`)
      if (!res.ok) throw new Error('Failed to get authorization URL')
      const { url } = await res.json()
      const popup = window.open(url, 'Reconnect Slack', 'width=800,height=600,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no')
      if (!popup) throw new Error('Popup was blocked')
      popup.focus()
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsReconnecting((prev) => ({ ...prev, [workspaceId]: false }))
          window.location.reload()
        }
      }, 500)
    } catch (err) {
      setErrorText(err?.message || 'Failed to reconnect')
      setIsReconnecting((prev) => ({ ...prev, [workspaceId]: false }))
    }
  }

  const handleDeleteChannelMapping = async (workspaceId, channelId) => {
    const wsConfig = slackConfig.workspaces?.[workspaceId] || {}
    const validEntries = getValidChannelEntries(wsConfig.channelBotMap || {}).filter(([chId]) => chId !== channelId)
    const channelBotMap = Object.fromEntries(validEntries)

    setSuccessText('')
    setIsSaving((prev) => ({ ...prev, [workspaceId]: true }))

    try {
      const updated = await updateSlackIntegration(team.id, {
        workspaces: {
          [workspaceId]: {
            defaultBotId: wsConfig.defaultBotId,
            channelBotMap,
          },
        },
      })

      setSlackConfig((prev) => ({
        workspaces: {
          ...prev.workspaces,
          ...(updated?.workspaces || {}),
        },
      }))
      setSuccessText('Channel override removed.')
    } catch (error) {
      setErrorText(error?.message || 'Failed to remove channel override.')
    } finally {
      setIsSaving((prev) => ({ ...prev, [workspaceId]: false }))
    }
  }

  const getBotName = (botId) => bots.find((b) => b.id === botId)?.name || botId

  const BotSelect = ({ workspaceId, className }) => {
    const wsConfig = slackConfig.workspaces?.[workspaceId] || {}
    const value = workspaceEdits[workspaceId]?.defaultBotId ?? wsConfig.defaultBotId ?? bots[0]?.id ?? ''

    return (
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value
          setWorkspaceEdits((prev) => ({
            ...prev,
            [workspaceId]: { ...prev[workspaceId], defaultBotId: v },
          }))
        }}
        className={`block h-9 w-full rounded-md border border-gray-300 px-3 py-0 text-sm leading-9 focus:border-cyan-500 focus:ring-cyan-500 ${className || ''}`}
      >
        {bots.map((bot) => (
          <option key={bot.id} value={bot.id}>
            {bot.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div id="slack-settings" className="mt-8 rounded-lg bg-white p-8 shadow">
      <h3 className="mb-2 flex items-center text-2xl font-bold">
        <SlackLogo className="mr-2 h-7 w-7" />
        Slack Integration
      </h3>
      <p className="mt-2 text-sm text-gray-700">
        Here you can connect a new Slack workspace and choose which bot answers by default. If you would like to associate multiple bots with a workspace, use <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/docsbot</code> in any channel to switch which bot answers there. See our{' '}
        <Link
          href="https://docsbot.ai/documentation/doc/slack-integration"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800"
        >
          Instructions
          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
        .
      </p>

      {successText && <p className="mt-3 text-sm text-green-700">{successText}</p>}

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-500">Loading Slack settings…</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Connect to Slack - same grid as workspaces, distinct styling */}
          <div className="rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/30 p-5">
            <h4 className="text-sm font-semibold text-gray-900">Connect to Slack</h4>
            <p className="mt-1 text-sm text-gray-600">
              Add a new Slack workspace and select the default bot to answer questions in that workspace.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="block text-xs font-medium text-gray-700">Default bot</label>
                <select
                  value={connectDefaultBotId}
                  onChange={(e) => setConnectDefaultBotId(e.target.value)}
                  className="mt-1 block h-9 w-full rounded-md border border-gray-300 px-3 py-0 text-sm leading-9 focus:border-cyan-500 focus:ring-cyan-500"
                >
                  <option value="">Select default bot</option>
                  {bots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              </div>
              {!checkPlanPermission(team, 'personal', 'slack').allowed ? (
                <span className="flex h-9 items-center text-sm text-amber-600">
                  {checkPlanPermission(team, 'personal', 'slack').requiredPlanLabel} required
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setIsConnectingSlack(true)
                    setSuccessText('')
                    try {
                      const params = new URLSearchParams({ afterConnect: 'team_slack_settings' })
                      if (connectDefaultBotId) params.set('defaultBotId', connectDefaultBotId)
                      const res = await fetch(
                        `/api/teams/${team.id}/integrations/slack/authorize?${params}`,
                      )
                      if (!res.ok) throw new Error('Failed to get authorization URL')
                      const { url } = await res.json()
                      const popup = window.open(
                        url,
                        'Connect to Slack',
                        'width=800,height=600,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no',
                      )
                      if (!popup) throw new Error('Popup was blocked')
                      popup.focus()
                      const checkClosed = setInterval(() => {
                        if (popup.closed) {
                          clearInterval(checkClosed)
                          setIsConnectingSlack(false)
                          window.location.reload()
                        }
                      }, 500)
                    } catch (err) {
                      setErrorText(err?.message || 'Failed to connect Slack')
                      setIsConnectingSlack(false)
                    }
                  }}
                  disabled={isConnectingSlack || !connectDefaultBotId}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {isConnectingSlack ? (
                    <>
                      <LoadingSpinner small className="mr-2 text-white" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <SlackLogo className="mr-2 h-4 w-4" />
                      Connect to Slack
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {workspaceIds.map((workspaceId) => {
            const wsConfig = slackConfig.workspaces?.[workspaceId] || {}
            const channelEntries = getValidChannelEntries(wsConfig.channelBotMap || {})
            const wsName = workspaceBots?.[workspaceId]?.[0]?.slackTeamName || `Workspace ${workspaceId}`

            return (
              <div
                key={workspaceId}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{wsName}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReconnectWorkspace(workspaceId)}
                      disabled={isReconnecting[workspaceId] || !checkPlanPermission(team, 'personal', 'slack').allowed}
                      className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800 disabled:opacity-50"
                    >
                      {isReconnecting[workspaceId] ? (
                        <>
                          <LoadingSpinner small className="mr-1.5" />
                          Reconnecting…
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="mr-1.5 h-4 w-4" />
                          Reconnect
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDisconnectWorkspace(workspaceId)}
                      disabled={isDisconnecting[workspaceId]}
                      className="inline-flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <LinkSlashIcon className="mr-1.5 h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default bot</label>
                    <div className="mt-1">
                      <BotSelect workspaceId={workspaceId} />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-5 items-center">
                      <input
                        id={`admins-only-${workspaceId}`}
                        type="checkbox"
                        checked={workspaceEdits[workspaceId]?.adminsOnly ?? wsConfig.adminsOnly ?? false}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setWorkspaceEdits((prev) => ({
                            ...prev,
                            [workspaceId]: { ...prev[workspaceId], adminsOnly: checked },
                          }))
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`admins-only-${workspaceId}`} className="text-sm font-medium text-gray-700">
                        Only workspace admins can change bot (e.g. use /docsbot or switch bot)
                      </label>
                      <p className="mt-0.5 text-xs text-gray-500">
                        When on, only Slack workspace admins and owners can run /docsbot or switch bots; others will see a message to ask an admin.
                      </p>
                    </div>
                  </div>

                  {channelEntries.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Channel overrides</label>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Set via <code className="rounded bg-gray-200 px-1">/docsbot</code> in Slack. Delete below to remove.
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {channelEntries.map(([channelId, mapping]) => {
                          const botId = getBotIdFromChannelMapping(mapping)
                          const channelDisplay = getChannelDisplayName(channelId, mapping)
                          return (
                          <li
                            key={channelId}
                            className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          >
                            <span className="text-gray-600">
                              <span className="font-medium text-gray-700">{channelDisplay}</span>
                              <span className="mx-2">→</span>
                              {getBotName(botId)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteChannelMapping(workspaceId, channelId)}
                              disabled={isSaving[workspaceId]}
                              className="rounded text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              ✕
                            </button>
                          </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveWorkspaceSettings(workspaceId)}
                      disabled={isSaving[workspaceId]}
                      className="inline-flex rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-60"
                    >
                      {isSaving[workspaceId] ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
