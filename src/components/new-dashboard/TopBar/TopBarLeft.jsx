import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import Tooltip from '@/components/Tooltip'

const Tag = ({ status, className, ...props }) => {
    let label, dotColor

    switch (status) {
        case 'ready':
            label = 'Ready'
            dotColor = 'bg-green-600'
            break
        case 'pending':
            label = 'Awaiting Sources'
            dotColor = 'bg-yellow-500'
            break
        case 'indexing':
            label = 'Copying'
            dotColor = 'bg-blue-500'
            break
        case 'failed':
            label = 'Sync Failed'
            dotColor = 'bg-red-500'
            break
        case 'queued':
            label = 'Queued'
            dotColor = 'bg-gray-500'
            break
        default:
            label = 'Unknown'
            dotColor = 'bg-gray-600'
            break
    }

    return (
        <Tooltip content={label}>
            <span
                className={clsx(
                    'inline-block size-2 shrink-0 rounded-full',
                    dotColor,
                    className,
                )}
                aria-hidden="true"
                {...props}
            />
        </Tooltip>
    )
}

const TopBarLeft = ({ bot, bots, wizardId }) => {
    const router = useRouter()
    const [isNavigating, setIsNavigating] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const showSearch = bots && bots.length > 5

    useEffect(() => {
        const handleRouteStart = (url) => {
            if (url?.includes('/app/bots/')) {
                setIsNavigating(true)
            }
        }
        const handleRouteEnd = () => setIsNavigating(false)

        router.events.on('routeChangeStart', handleRouteStart)
        router.events.on('routeChangeComplete', handleRouteEnd)
        router.events.on('routeChangeError', handleRouteEnd)

        return () => {
            router.events.off('routeChangeStart', handleRouteStart)
            router.events.off('routeChangeComplete', handleRouteEnd)
            router.events.off('routeChangeError', handleRouteEnd)
        }
    }, [router.events])

    useEffect(() => {
        if (!showSearch && searchTerm) {
            setSearchTerm('')
        }
    }, [showSearch, searchTerm])

    const normalizedSearch = showSearch ? searchTerm.trim().toLowerCase() : ''
    const filteredBots = bots
        ? bots.filter((entry) => {
              if (!normalizedSearch) {
                  return true
              }

              return (entry?.name || '')
                  .toLowerCase()
                  .includes(normalizedSearch)
          })
        : []
    const menuMaxHeightClass = showSearch ? 'max-h-[224px]' : 'max-h-[200px]'

    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex gap-2 font-semibold text-gray-400">
                <li className="hidden md:block">
                    <Link
                        href="/app/bots"
                        className="flex flex-row items-center gap-2 hover:text-cyan-600"
                    >
                        All Bots
                    </Link>
                </li>

                <li className="hidden md:block" aria-hidden="true">
                    /
                </li>

                {(!bots || bots.length <= 1) && (
                    <li>
                        <h1
                            className="flex flex-row items-center gap-2 text-gray-800"
                            data-wizard={wizardId}
                        >
                            {bot?.name || 'Undefined Bot'}
                            {bot?.status && (
                                <Tag status={bot?.status} aria-hidden="true" />
                            )}
                            {isNavigating && (
                                <LoadingSpinner
                                    small
                                    className="text-cyan-600"
                                />
                            )}
                        </h1>
                    </li>
                )}

                {bots && bots.length > 1 && (
                    <li>
                        <h1>
                            <Menu as="div" className="relative">
                                <Menu.Button
                                    data-wizard={wizardId}
                                    disabled={isNavigating}
                                    className={clsx(
                                        'flex flex-row items-center gap-2 text-gray-800 hover:text-cyan-600',
                                        {
                                            'cursor-not-allowed opacity-60':
                                                isNavigating,
                                        },
                                    )}
                                >
                                    <span className="flex flex-row items-center gap-2">
                                        {bot?.name || 'Undefined Bot'}
                                        {bot?.status && (
                                            <Tag
                                                status={bot?.status}
                                                aria-hidden="true"
                                            />
                                        )}
                                        {isNavigating && (
                                            <LoadingSpinner
                                                small
                                                className="text-cyan-600"
                                            />
                                        )}
                                    </span>

                                    <ChevronUpDownIcon className="size-4" />
                                </Menu.Button>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items
                                        className={clsx(
                                            'absolute left-0 z-50 md:z-[100] mt-2 w-full min-w-[240px] origin-top-left overflow-y-auto border border-gray-200 rounded-2xl bg-white font-normal shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none',
                                            menuMaxHeightClass,
                                            {
                                                'pointer-events-none opacity-60':
                                                    isNavigating,
                                            },
                                        )}
                                    >
                                        <div className="py-1">
                                            {showSearch && (
                                                <div className="sticky top-0 z-10 mb-2 bg-white px-3 py-2">
                                                    <label
                                                        className="sr-only"
                                                        htmlFor="bot-search"
                                                    >
                                                        Search bots
                                                    </label>
                                                    <input
                                                        id="bot-search"
                                                        type="search"
                                                        value={searchTerm}
                                                        disabled={isNavigating}
                                                        onChange={(event) =>
                                                            setSearchTerm(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Search bots"
                                                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                                                    />
                                                </div>
                                            )}
                                            {filteredBots.map((b) => {
                                                const isCurrent =
                                                    b.id === bot?.id
                                                const href = {
                                                    pathname: router.pathname,
                                                    query: {
                                                        ...router.query,
                                                        botId: b.id,
                                                    },
                                                }

                                                return (
                                                    <Menu.Item key={b.id}>
                                                        {({ active }) => (
                                                            <Link
                                                                href={href}
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        isCurrent
                                                                    ) {
                                                                        event.preventDefault()
                                                                    }
                                                                }}
                                                                className={clsx(
                                                                    'block px-4 py-2 text-sm',
                                                                    {
                                                                        ['text-gray-800']:
                                                                            !isCurrent,
                                                                        ['pointer-events-none bg-cyan-50 font-semibold text-cyan-600']:
                                                                            isCurrent,
                                                                        ['bg-gray-100']:
                                                                            active,
                                                                    },
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        {b.name}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        )}
                                                    </Menu.Item>
                                                )
                                            })}
                                            {filteredBots.length === 0 && (
                                                <div className="px-4 py-2 text-sm text-gray-500">
                                                    No bots match your search
                                                </div>
                                            )}
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </h1>
                    </li>
                )}
            </ol>
        </nav>
    )
}

export default TopBarLeft
