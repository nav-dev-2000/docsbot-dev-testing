import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WrenchScrewdriverIcon,
  LockClosedIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ServerStackIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import CompanyLogo from '@/components/CompanyLogo'
import ModalMcpServer from '@/components/ModalMcpServer'
import ModalConfirmDelete from '@/components/ModalConfirmDelete'
import FieldToggle from '@/components/FieldToggle'
import Tooltip from '@/components/Tooltip'
import { useRouter } from 'next/router'
import { checkPlanPermission, getDomainFromUrl, getMcpServerSlotLimit } from '@/utils/helpers'

export default function McpServerList({
  mcpServers,
  onChange,
  disabled,
  teamId,
  botId,
  team,
  onRequireUpgrade,
  refreshServerUrl,
  minimal = false,
  botIsPublic = false,
  /** When true, show Add to widget / Remove from widget for connected servers (agent bots). */
  showMcpWidgetToggle = false,
}) {
  const mcpSlotLimit = team ? getMcpServerSlotLimit(team) : Number.POSITIVE_INFINITY
  const mcpSlotsFull =
    Number.isFinite(mcpSlotLimit) && (mcpServers?.length || 0) >= mcpSlotLimit
  const cannotAddDueToPlan =
    Boolean(team) && (mcpSlotLimit === 0 || mcpSlotsFull)
  const router = useRouter()
  const hasAutoRefreshedForUrlRef = useRef(null)
  const [editingServer, setEditingServer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false)
  const [serverToDelete, setServerToDelete] = useState(null)
  const [expandedServers, setExpandedServers] = useState({})
  const [refreshingServer, setRefreshingServer] = useState(null)
  const [disconnectingServer, setDisconnectingServer] = useState(null)
  const [serverErrors, setServerErrors] = useState({})
  const [isConfirmDisconnectModalOpen, setIsConfirmDisconnectModalOpen] = useState(false)
  const [serverToDisconnect, setServerToDisconnect] = useState(null)

  useEffect(() => {
    if (!refreshServerUrl || !mcpServers?.length) return
    const serverToRefresh = mcpServers.find(s => s.serverUrl === refreshServerUrl)
    if (!serverToRefresh || refreshingServer) return
    // Only auto-refresh once per OAuth return (avoid re-running when mcpServers updates after discover)
    if (hasAutoRefreshedForUrlRef.current === refreshServerUrl) return
    hasAutoRefreshedForUrlRef.current = refreshServerUrl
    // Clear OAuth query params so the effect doesn't re-trigger and URL stays clean
    if (router.replace) {
      const { mcp_server_url, mcp_oauth, mcp_server_id, ...rest } = router.query
      if (mcp_server_url != null || mcp_oauth != null || mcp_server_id != null) {
        router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
      }
    }
    handleRefreshTools(serverToRefresh)
  }, [refreshServerUrl, mcpServers])

  const toggleExpand = (serverId) => {
    const server = mcpServers.find((s) => s.id === serverId)
    const toolList = server?.tools || []
    const toolsTotal = toolList.length
    const toolsEnabled = toolList.filter((t) => t.enabled).length
    if (toolsTotal > 0 && toolsEnabled === 0) {
      setExpandedServers((prev) => ({ ...prev, [serverId]: true }))
      return
    }
    setExpandedServers((prev) => ({
      ...prev,
      [serverId]: !prev[serverId],
    }))
  }

  const handleRefreshTools = async (server, serversList) => {
    const list = serversList ?? mcpServers

    if (!teamId || !botId) return
    setRefreshingServer(server.id)
    
    // Clear previous errors
    setServerErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[server.id]
      return newErrors
    })

    // Set isConnecting to true at the start of the process
    onChange(list.map((s) =>
      s.id === server.id ? { ...s, isConnecting: true, isConnected: null } : s
    ))

    try {
      const response = await fetch(`/api/teams/${teamId}/bots/${botId}/mcp/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl: server.serverUrl,
        }),
      })

      const data = await response.json().catch(() => ({}))

      // Handle OAuth-protected servers
      if (data.requiresOAuth && data.authMetadata) {
        // Initiate DCR + OAuth flow
        onChange(list.map((s) =>
          s.id === server.id ? { ...s, requiresOAuth: true } : s
        ))

        try {
          const registerResponse = await fetch(`/api/teams/${teamId}/bots/${botId}/mcp-external-oauth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serverUrl: server.serverUrl,
              authMetadata: data.authMetadata,
              // Optional manual DCR credentials (used when provided by the user in the modal).
              oauthClientId: server.oauthClientId || undefined,
              oauthClientSecret: server.oauthClientSecret || undefined,
            }),
          })

          if (!registerResponse.ok) {
            const errData = await registerResponse.json().catch(() => ({}))
            throw new Error(errData.message || 'OAuth registration failed')
          }

          const { authorizationUrl } = await registerResponse.json()
          // Redirect user to the authorization server
          window.location.href = authorizationUrl
          return // Page will redirect, no need to continue
        } catch (oauthError) {
          console.error('OAuth flow error:', oauthError)
          onChange(list.map((s) =>
            s.id === server.id ? { ...s, isConnecting: false} : s
          ))
          setServerErrors(prev => ({ ...prev, [server.id]: 'OAuth authentication failed: ' + oauthError.message }))
          return
        } finally {
          setRefreshingServer(null)
        }
      }

      // Handle re-authentication required (expired/revoked token)
      if (response.status === 401 && data.requiresReauth) {
        setServerErrors(prev => ({ ...prev, [server.id]: 'OAuth token expired or was revoked. Please connect again to re-authenticate.' }))
        onChange(list.map((s) =>
          s.id === server.id ? { ...s, isConnecting: false, isConnected: false, tokenExpired: true } : s
        ))
        setRefreshingServer(null)
        return
      }

      // Handle servers that require an API key / header auth instead of OAuth
      if (response.status === 401 && data.requiresAuth && data.authHint === 'api_key_header') {
        setServerErrors(prev => ({
          ...prev,
          [server.id]:
            'This MCP server requires authentication headers. Open Edit server → Custom Authentication (advanced) and add the required request headers, then try connect again.',
        }))
        onChange(list.map((s) =>
          s.id === server.id ? { ...s, isConnecting: false, isConnected: null } : s
        ))
        setRefreshingServer(null)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tools')
      }

      // Update the server with the new tools
      const newServers = list.map((s) => {
        if (s.id === server.id) {
          // Merge existing enabled states if tool exists
          const existingToolsMap = new Map((s.tools || []).map(t => [t.name, t]))
          const defaultEnabledForNewTool = !botIsPublic
          const newTools = data.tools.map(tool => ({
            ...tool,
            enabled: existingToolsMap.has(tool.name)
              ? existingToolsMap.get(tool.name).enabled
              : defaultEnabledForNewTool,
          }))
          return {
            ...s,
            tools: newTools,
            isConnected: true,
            isConnecting: false,
            tokenExpired: false,
          }
        }
        return s
      })
      onChange(newServers)

      // Also expand the tools section for this server to show the new tools
      setExpandedServers((prev) => ({
        ...prev,
        [server.id]: true,
      }))

    } catch (error) {
      console.error('Error refreshing tools:', error)
      setServerErrors(prev => ({ ...prev, [server.id]: 'Failed to connect: ' + error.message }))
      onChange(list.map((s) =>
        s.id === server.id ? { ...s, isConnecting: false, isConnected: null } : s
      ))
    } finally {
      setRefreshingServer(null)
    }
  }

  const handleDisconnect = (server) => {
    setServerToDisconnect(server)
    setIsConfirmDisconnectModalOpen(true)
  }

  const handleConfirmDisconnect = async () => {
    if (!serverToDisconnect || !teamId || !botId) return
    const server = serverToDisconnect
    
    // Clear errors
    setServerErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[server.id]
      return newErrors
    })

    setDisconnectingServer(server.id)

    try {
      const response = await fetch(`/api/teams/${teamId}/bots/${botId}/mcp-external-oauth/register`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: server.serverUrl })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to disconnect')
      }

      // Update state to disconnected
      onChange(mcpServers.map((s) =>
        s.id === server.id ? {
          ...s,
          isConnected: false,
          isConnecting: false,
          enabled: false,
          tools: [] // Clear tools on disconnect
        } : s
      ))

    } catch (error) {
      console.error('Error disconnecting:', error)
      onChange(mcpServers.map((s) =>
        s.id === server.id ? { ...s, isConnecting: false } : s
      ))
      setServerErrors(prev => ({ ...prev, [server.id]: 'Failed to disconnect: ' + error.message }))
    } finally {
      setDisconnectingServer(null)
      setIsConfirmDisconnectModalOpen(false)
      setServerToDisconnect(null)
    }
  }

  const handleToolToggle = (serverId, toolName, enabled) => {
    const newServers = mcpServers.map((s) => {
      if (s.id === serverId) {
        const newTools = s.tools?.map((t) =>
          t.name === toolName ? { ...t, enabled } : t
        )
        return { ...s, tools: newTools }
      }
      return s
    })
    onChange(newServers)
  }

  const handleSetAllToolsEnabled = (serverId, enabled) => {
    const newServers = mcpServers.map((s) => {
      if (s.id !== serverId) return s
      const newTools = (s.tools || []).map((t) => ({ ...t, enabled }))
      return { ...s, tools: newTools }
    })
    onChange(newServers)
  }

  const handleToggleMcpWidget = (server) => {
    if (disabled) return
    if (refreshingServer === server.id || disconnectingServer === server.id) return
    const nextEnabled = !server.enabled
    if (nextEnabled) {
      const enabledToolCount = (server.tools || []).filter((t) => t.enabled)
        .length
      if (enabledToolCount === 0) return
      const planCheck = team
        ? checkPlanPermission(team, 'personal', 'mcpServers')
        : { allowed: true }
      if (!planCheck.allowed) {
        onRequireUpgrade?.()
        return
      }
    }
    onChange(
      mcpServers.map((s) =>
        s.id === server.id ? { ...s, enabled: nextEnabled } : s,
      ),
    )
  }

  const handleAdd = () => {
    if (disabled) return
    if (cannotAddDueToPlan) {
      onRequireUpgrade?.()
      return
    }
    setEditingServer(null)
    setIsModalOpen(true)
  }

  const handleEdit = (server) => {
    setEditingServer(server)
    setIsModalOpen(true)
  }

  const handleDelete = (serverId) => {
    setServerToDelete(serverId)
    setIsConfirmDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    const newServers = mcpServers.filter((s) => s.id !== serverToDelete)
    onChange(newServers)
    setIsConfirmDeleteModalOpen(false)
    setServerToDelete(null)
  }

  const handleSaveServer = (server) => {
    let newServers
    let addedServer = null
    if (editingServer) {
      newServers = mcpServers.map((s) => (s.id === server.id ? server : s))
    } else {
      if (cannotAddDueToPlan) {
        onRequireUpgrade?.()
        return
      }
      addedServer = { ...server, id: uuidv4() }
      newServers = [...mcpServers, addedServer]
    }
    onChange(newServers)
    setIsModalOpen(false)
    if (addedServer) {
      handleRefreshTools(addedServer, newServers)
    }
  }

  const renderConnectionActions = (server) => {
    if (server.isConnecting) {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 rounded-md bg-yellow-50 px-2.5 py-2 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
          <svg className="h-3 w-3 animate-spin text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </span>
      )
    }

    if (disconnectingServer === server.id) {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-400/30">
          <svg className="h-3 w-3 animate-spin text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Disconnecting...
        </span>
      )
    }

    if (server.isConnected && !server.tokenExpired) {
      const enabledToolCount = (server.tools || []).filter((t) => t.enabled)
        .length
      const cannotAddToWidgetWithoutTools =
        !server.enabled && enabledToolCount === 0
      const addToWidgetButton = (
        <button
          type="button"
          onClick={() => handleToggleMcpWidget(server)}
          disabled={
            disabled ||
            refreshingServer === server.id ||
            disconnectingServer === server.id ||
            cannotAddToWidgetWithoutTools
          }
          className={
            server.enabled
              ? 'inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50'
              : 'inline-flex items-center justify-center gap-1.5 rounded-md border border-cyan-600/40 bg-cyan-600 px-2.5 py-1 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-50'
          }
        >
          <ChatBubbleLeftRightIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
          {server.enabled ? 'Remove from widget' : 'Add to widget'}
        </button>
      )
      return (
        <>
          <button
            onClick={() => handleDisconnect(server)}
            disabled={disabled || refreshingServer === server.id || disconnectingServer === server.id}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-sm font-medium text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20 disabled:opacity-50"
          >
            <ArrowRightOnRectangleIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            Disconnect
          </button>
          <button
            onClick={() => handleRefreshTools(server)}
            disabled={disabled || refreshingServer === server.id || disconnectingServer === server.id}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700/50 bg-slate-800/80 px-2.5 py-1 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/80 disabled:opacity-50"
          >
            <ArrowPathIcon className={`-ml-0.5 h-4 w-4 ${refreshingServer === server.id ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshingServer === server.id ? 'Refreshing...' : 'Refresh'}
          </button>
          {showMcpWidgetToggle ? (
            cannotAddToWidgetWithoutTools ? (
              <Tooltip
                content="Enable at least one tool before adding this server to the widget."
                zIndex={1000001}
              >
                <span className="inline-flex cursor-help">{addToWidgetButton}</span>
              </Tooltip>
            ) : (
              addToWidgetButton
            )
          ) : null}
        </>
      )
    }

    if (server.requiresOAuth && server.tokenExpired) {
      return (
        <button
          onClick={() => handleRefreshTools(server)}
          disabled={disabled || refreshingServer === server.id || disconnectingServer === server.id}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-200 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ml-0.5 h-4 w-4 ${refreshingServer === server.id ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshingServer === server.id ? 'Connecting...' : 'Reconnect'}
        </button>
      )
    }

    return (
      <button
        onClick={() => handleRefreshTools(server)}
        disabled={disabled || refreshingServer === server.id || disconnectingServer === server.id}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1 text-sm font-semibold text-white transition-all hover:bg-cyan-500 disabled:opacity-50"
      >
        <ArrowPathIcon className={`-ml-0.5 h-4 w-4 ${refreshingServer === server.id ? 'animate-spin' : ''}`} aria-hidden="true" />
        {refreshingServer === server.id ? 'Connecting...' : 'Connect'}
      </button>
    )
  }

  return (
    <div className="space-y-4" data-version="mcp-server-list-v2">
      <div className={`flex justify-between items-center ${minimal ? 'justify-end' : ''}`}>
        {!minimal && <h2 className="text-lg font-medium text-gray-900">Configured MCP Servers</h2>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-50"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:block">
            Add MCP Server
          </span>
          <span className="block sm:hidden">
            Add
          </span>
        </button>
      </div>

      {team && mcpSlotLimit === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Remote MCP connectors are available on the{' '}
          <span className="font-semibold">Personal</span> plan or higher.
        </div>
      ) : null}

      {mcpServers?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">No MCP servers configured.</p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-500 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Add your first server
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {mcpServers.map((server) => {
            const toolList = server.tools || []
            const toolsTotal = toolList.length
            const toolsEnabled = toolList.filter((t) => t.enabled).length
            const needsToolEnable =
              toolsTotal > 0 && toolsEnabled === 0
            const toolsSectionExpanded =
              needsToolEnable || Boolean(expandedServers[server.id])
            return (
            <li
              key={server.id}
              className="group bg-white border-2  border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-cyan-400 hover:border-2  transition-all duration-200"
            >
              <div className="flex flex-col gap-4">
                {/* LEFT SECTION */}
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                    {(() => {
                      const domain = getDomainFromUrl(server.serverUrl)
                      return domain ? (
                        <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                          <CompanyLogo
                            domain={domain}
                            className="size-6 object-contain"
                            alt=""
                          />
                        </span>
                      ) : (
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                          <ServerStackIcon className="size-5 text-gray-400" />
                        </span>
                      )
                    })()}
                    <p className="truncate text-base font-semibold text-gray-900">{server.serverLabel}</p>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => handleEdit(server)}
                        disabled={disabled}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        disabled={disabled}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {server?.requiresOAuth && server.isConnected && (
                      <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1.5 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-600/20" title="Authorization Configured">
                        <LockClosedIcon className="mr-1 h-3 w-3" />
                        Auth
                      </span>
                    )}

                    {server.isConnected && !server.isConnecting && !server.tokenExpired && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full  animate-ping rounded-full bg-emerald-900 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        Connected
                      </span>
                    )}
                  </div>

                  {/* URL */}

                  <p className="mt-2 block text-sm text-cyan-600 items-center gap-2">
                    {server.serverUrl}
                  </p>

                  {/* Description */}
                  {server.serverDescription && (
                    <p className="mt-1 text-sm text-gray-400 leading-relaxed line-clamp-2">
                      {server.serverDescription}
                    </p>
                  )}

                  {/* Error Message */}
                  {serverErrors[server.id] && (
                    <div className="mt-3 rounded-md bg-red-50 p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                          <div className="mt-1 text-sm text-red-700 break-words">
                            <p>{serverErrors[server.id]}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Token expired notice */}
                  {server.tokenExpired && !serverErrors[server.id] && (
                    <div className="mt-3 rounded-md bg-amber-50 p-3 border border-amber-200">
                      <p className="text-sm text-amber-800">
                        Token expired. Click <strong>Reconnect</strong> to sign in again and use these tools.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              <div className={`mt-3 flex justify-start gap-2`}>
                {renderConnectionActions(server)}
              </div>

              {/* Tools Section */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                {toolsTotal > 0 ? (
                  <p
                    className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                      needsToolEnable
                        ? 'border-red-200 bg-red-50 text-red-900'
                        : botIsPublic
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                    role="status"
                  >
                    {needsToolEnable ? (
                      <>
                        {botIsPublic ? (
                          <>
                            <span className="font-semibold">This bot is public.</span>{' '}
                            Only enable the tools that public users should have access to!{' '}
                          </>
                        ) : (
                          <>
                            For better results, only enable the minimal safe tools your bot
                            needs.{' '}
                          </>
                        )}
                        <span className="font-semibold">Enable at least one tool.</span>
                      </>
                    ) : botIsPublic ? (
                      <>
                        <span className="font-semibold">This bot is public.</span>{' '}
                        Only enable the tools that public users should have access to!
                      </>
                    ) : (
                      'For better results, only enable the minimal safe tools your bot needs.'
                    )}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(server.id)}
                    className={`group flex min-w-0 items-center text-sm font-medium transition-colors ${
                      needsToolEnable
                        ? 'text-red-700 hover:text-red-800'
                        : 'text-gray-500 hover:text-cyan-600'
                    }`}
                  >
                    <WrenchScrewdriverIcon
                      className={`mr-2 h-4 w-4 shrink-0 ${
                        needsToolEnable
                          ? 'text-red-500 group-hover:text-red-600'
                          : 'text-gray-400 group-hover:text-cyan-500'
                      }`}
                    />
                    <span>
                      {needsToolEnable
                        ? 'Enable at least one tool'
                        : `${toolsEnabled}/${toolsTotal} Tools Enabled`}
                    </span>
                    {toolsSectionExpanded ? (
                      <ChevronUpIcon
                        className={`ml-2 h-4 w-4 shrink-0 ${
                          needsToolEnable
                            ? 'text-red-400 group-hover:text-red-500'
                            : 'text-gray-400 group-hover:text-cyan-500'
                        }`}
                      />
                    ) : (
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 text-gray-400 group-hover:text-cyan-500" />
                    )}
                  </button>
                  {server.tools && server.tools.length > 0 ? (
                    <div
                      className="flex flex-wrap items-center gap-2"
                      role="group"
                      aria-label="Set all tools on or off"
                    >
                      <button
                        type="button"
                        onClick={() => handleSetAllToolsEnabled(server.id, true)}
                        disabled={disabled || botIsPublic}
                        title={botIsPublic ? 'Public bots cannot enable all tools at once. Enable tools individually.' : undefined}
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Enable all
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllToolsEnabled(server.id, false)}
                        disabled={disabled}
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Disable all
                      </button>
                    </div>
                  ) : null}
                </div>

                {toolsSectionExpanded && (
                  <div className="mt-3 space-y-3 pl-1">
                    {server.tools && server.tools.length > 0 ? (
                      server.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-start justify-between gap-3 border-b border-gray-50 py-2 last:border-0"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                            {tool.description && (
                              <p className="mt-0.5 text-xs text-gray-500">{tool.description}</p>
                            )}
                          </div>
                          <FieldToggle
                            enabled={tool.enabled}
                            setEnabled={(enabled) => handleToolToggle(server.id, tool.name, enabled)}
                            size="sm"
                            disabled={disabled}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-4 text-center">
                        <p className="text-sm text-gray-500">No tools discovered.</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Tools are automatically fetched when the server is connected.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
            )
          })}
        </ul>
      )}

      <ModalMcpServer
        open={isModalOpen}
        setOpen={setIsModalOpen}
        server={editingServer}
        onSave={handleSaveServer}
        teamId={teamId}
        botId={botId}
      />

      <ModalConfirmDelete
        open={isConfirmDeleteModalOpen}
        setOpen={setIsConfirmDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete MCP Server"
        message={`Are you sure you want to delete ${serverToDelete ? mcpServers.find(s => s.id === serverToDelete)?.serverLabel : 'this MCP server'}? This action cannot be undone.`}
      />

      <ModalConfirmDelete
        open={isConfirmDisconnectModalOpen}
        setOpen={setIsConfirmDisconnectModalOpen}
        onConfirm={handleConfirmDisconnect}
        title="Disconnect MCP Server"
        message={`Are you sure you want to disconnect ${serverToDisconnect?.serverLabel || 'this server'}? This will remove the OAuth tokens and clear cached tools.`}
        confirmText="Disconnect"
      />
    </div>
  )
}
