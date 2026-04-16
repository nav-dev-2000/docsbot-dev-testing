import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import McpServerList from '@/components/McpServerList'
import Workspace from '@new-dashboard/Workspace'
import Alert from '@/components/Alert'
import ModalCheckout from '@/components/ModalCheckout'
import { checkPlanPermission } from '@/utils/helpers'

const ConfigureMcpConnectors = ({ team, bot, setBot }) => {
    const router = useRouter()
    const [mcpServers, setMcpServers] = useState(bot?.mcpServers || [])
    const [isUpdating, setIsUpdating] = useState(false)
    const [errorText, setErrorText] = useState(null)
    const [showUpgrade, setShowUpgrade] = useState(false)

    useEffect(() => {
        setMcpServers(bot?.mcpServers || [])
    }, [bot?.id, bot?.mcpServers])

    useEffect(() => {
        if (!router.isReady) return
        const { mcp_oauth, mcp_oauth_error, ...rest } = router.query
        if (mcp_oauth !== 'error') return

        const raw =
            typeof mcp_oauth_error === 'string'
                ? mcp_oauth_error
                : Array.isArray(mcp_oauth_error)
                  ? mcp_oauth_error[0]
                  : ''
        const message =
            raw && String(raw).trim()
                ? String(raw)
                : 'Authorization was cancelled or could not be completed.'
        setErrorText(message)

        router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }, [router.isReady, router.query.mcp_oauth, router.query.mcp_oauth_error, router])

    const sortedMcpServers = useMemo(() => {
        return [...mcpServers].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
    }, [mcpServers])

    const mcpEntryPermission = useMemo(
        () => checkPlanPermission(team, 'personal', 'mcpServers'),
        [team],
    )

    const handleMcpSave = async (updatedServers) => {
        try {
            setIsUpdating(true)
            setErrorText(null)
            // API call to update bot with new mcpServers
            const urlParams = ['teams', team.id, 'bots', bot.id]
            const apiPath = '/api/' + urlParams.join('/')
            
            const response = await fetch(apiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mcpServers: updatedServers }),
            })

            if (!response.ok) {
                 const data = await response.json()
                 throw new Error(data.message || 'Failed to update bot')
            }
            
            setMcpServers(updatedServers)
            // Update parent bot state if available
            if (setBot) {
                setBot(prev => ({ ...prev, mcpServers: updatedServers }))
            }
        } catch (err) {
            console.error(err)
            setErrorText(err.message || 'Something went wrong, please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div
            id="page-configure-mcp-connections"
            className="h-full overflow-y-auto px-6"
        >
            <ModalCheckout
                team={team}
                open={showUpgrade}
                setOpen={setShowUpgrade}
            />
            <div className="flex flex-col gap-4 py-4">
                <Workspace.Header
                    title={
                        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                            MCP Connections
                            {!mcpEntryPermission.allowed ? (
                                <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                    {mcpEntryPermission.requiredPlanLabel}
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    New!
                                </span>
                            )}
                        </span>
                    }
                    description={
                        <>
                            Connect remote Model Context Protocol (MCP) servers to give your bot access to external tools and data from all your services. After you connect servers, deploy them as actions on the{' '}
                            <Link
                                href={`/app/bots/${bot.id}/widget/actions`}
                                shallow
                                className="text-cyan-700 underline hover:text-cyan-900"
                            >
                                chat widget Actions tab
                            </Link>{' '}
                            so visitors can use them in the widget.
                        </>
                    }
                />

                <div id="form-wrapper" className="flex flex-col gap-4">
                    <Alert title={errorText} type="error" />
                    
                    <div className="border-2 border-gray-200 rounded-lg p-2">
                        <div className="p-2">
                            <McpServerList
                                mcpServers={sortedMcpServers}
                                onChange={handleMcpSave}
                                disabled={isUpdating}
                                teamId={team.id}
                                botId={bot.id}
                                team={team}
                                onRequireUpgrade={() => setShowUpgrade(true)}
                                refreshServerUrl={router.query.mcp_server_url}
                                minimal={false}
                                botIsPublic={bot?.privacy === 'public'}
                                showMcpWidgetToggle={Boolean(bot?.isAgent)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfigureMcpConnectors
