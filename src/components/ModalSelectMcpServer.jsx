import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    XMarkIcon,
    ServerStackIcon,
    PlusIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import CompanyLogo from '@/components/CompanyLogo'
import Tooltip from '@/components/Tooltip'
import { useRouter } from 'next/router'
import { countEnabledMcpTools, getDomainFromUrl } from '@/utils/helpers'

export default function ModalSelectMcpServer({
    bot,
    mcpServers = [],
    open,
    setOpen,
    enabledServerIds = [],
    onEnableServer,
}) {
    const router = useRouter()
    const [search, setSearch] = useState('')

    const filteredServers = useMemo(() => {
        const normalizedQuery = search.trim().toLowerCase()
        if (!normalizedQuery) return mcpServers

        return mcpServers.filter((server) => {
            const label = (server.serverLabel || '').toLowerCase()
            const domain = getDomainFromUrl(server.serverUrl).toLowerCase()
            return (
                label.includes(normalizedQuery) ||
                domain.includes(normalizedQuery)
            )
        })
    }, [mcpServers, search])

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-modal" onClose={setOpen}>
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white w-full max-w-md px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-base font-semibold leading-6 text-gray-900"
                                        >
                                            Add Server
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <label htmlFor="mcp-server-search" className="sr-only block text-sm font-medium text-gray-700">
                                                Search MCP servers
                                            </label>
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="mcp-server-search"
                                                    type="text"
                                                    value={search}
                                                    onChange={(e) =>
                                                        setSearch(e.target.value)
                                                    }
                                                    placeholder="Search"
                                                    className="w-full rounded-lg border-1 border-gray-300 py-1 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 w-full max-h-96 overflow-y-auto space-y-2">
                                            {mcpServers.length === 0? (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    No connected MCP servers available.
                                                </p>
                                            ) : filteredServers.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    No MCP servers match your search.
                                                </p>
                                            ) : (
                                                filteredServers.map((server) => {
                                                    const isEnabled = enabledServerIds.includes(server.id)
                                                    const domain = getDomainFromUrl(server.serverUrl)
                                                    const enabledTools = countEnabledMcpTools(server)
                                                    const noToolsEnabled = enabledTools === 0
                                                    const isRowDisabled = isEnabled || noToolsEnabled

                                                    const rowButton = (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!isRowDisabled) {
                                                                    onEnableServer(server.id)
                                                                }
                                                            }}
                                                            disabled={isRowDisabled}
                                                            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 ${
                                                                isEnabled
                                                                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                                                                    : noToolsEnabled
                                                                      ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                                                                      : 'border-gray-200 bg-white transition-all hover:border-cyan-500 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                {domain ? (
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
                                                                )}
                                                                <span className="min-w-0 truncate text-left text-sm font-medium text-gray-900">
                                                                    {server.serverLabel}
                                                                </span>
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                <span className="text-xs tabular-nums text-gray-500">
                                                                    {enabledTools === 1
                                                                        ? '1 Tool'
                                                                        : `${enabledTools} Tools`}
                                                                </span>
                                                                {isEnabled ? (
                                                                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                                                        Added
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </button>
                                                    )

                                                    return (
                                                        <div key={server.id} className="w-full">
                                                            {noToolsEnabled && !isEnabled ? (
                                                                <Tooltip
                                                                    content="Enable at least one tool for this server under Configure → MCP Connections before adding it to the widget."
                                                                    placement="top"
                                                                    zIndex={1000001}
                                                                >
                                                                    <span className="block w-full">{rowButton}</span>
                                                                </Tooltip>
                                                            ) : (
                                                                rowButton
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                        
                                        <div className="mt-2 flex flex-row items-stretch gap-2 border-t border-gray-100 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOpen(false)
                                                    if (bot?.id) {
                                                        router.push(`/app/bots/${bot.id}/configure/mcp-connections`)
                                                    } else {
                                                        router.push('/app/bots')
                                                    }
                                                }}
                                                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-100"
                                            >
                                                <PlusIcon className="h-5 w-5 shrink-0" />
                                                Register a new MCP server
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOpen(false)}
                                                className="shrink-0 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
