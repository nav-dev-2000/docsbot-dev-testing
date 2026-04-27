import React, { forwardRef } from 'react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const NotificationsMenu = forwardRef(
    ({ close, getLastDismissedDate, sortedUpdates, ...props }, ref) => {
        const lastDismissedDate = getLastDismissedDate()

        return (
            <Menu.Items
                ref={ref}
                {...props}
                className={clsx(
                    'w-full md:w-96 max-w-none md:max-w-[92vw] overflow-hidden',
                    'md:absolute fixed z-50 md:z-[100] inset-0 md:inset-auto origin-top-right md:right-0',
                    'flex md:flex-none flex-col md:mt-2 ring-1 ring-black ring-opacity-5 rounded-none md:rounded-md',
                    'bg-white shadow-lg focus:outline-none',
                    props.className,
                )}
                data-component="notifications-menu"
            >
                <div
                    className={clsx(
                        'sticky top-0 z-10',
                        'flex items-center justify-between px-4 py-4 border-b border-gray-200',
                        'bg-gray-100',
                    )}
                >
                    <div>
                        <div className="text-md font-semibold text-gray-700">
                            What's New
                        </div>
                        <div className="text-xs text-gray-400">
                            Product updates and improvements
                        </div>
                    </div>
                    <button
                        className="block p-2 text-gray-400 hover:text-gray-600 md:hidden"
                        onClick={close}
                    >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="md:max-h-96 overflow-y-auto flex-1 md:flex-none">
                    {sortedUpdates.map((update, idx) => {
                        // An update is unread if there's no dismissed date yet, or if this update is newer than the last dismissed date
                        const isUnread =
                            !lastDismissedDate ||
                            new Date(update.date) > new Date(lastDismissedDate)

                        return (
                            <div
                                key={idx}
                                className={clsx(
                                    'px-4 py-3',
                                    isUnread
                                        ? 'bg-cyan-600 text-white'
                                        : 'hover:bg-gray-50',
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className={clsx(
                                            'min-w-0 flex-1 whitespace-normal break-words text-sm font-medium',
                                            isUnread
                                                ? 'text-white'
                                                : 'text-gray-900',
                                        )}
                                    >
                                        {update.title}
                                    </div>
                                    <div
                                        className={clsx(
                                            'shrink-0 text-xs',
                                            isUnread
                                                ? 'text-cyan-100'
                                                : 'text-gray-400',
                                        )}
                                    >
                                        {update.date}
                                    </div>
                                </div>
                                <div
                                    className={clsx(
                                        'mt-1 whitespace-normal break-words text-sm',
                                        isUnread ? 'text-cyan-50' : 'text-gray-600',
                                    )}
                                >
                                    {update.description}
                                    {update.href ? (
                                        <>
                                            {' '}
                                            <Link
                                                href={update.href}
                                                className={clsx(
                                                    'inline-flex items-center font-medium',
                                                    'hover:underline underline-offset-2',
                                                    isUnread
                                                        ? 'text-cyan-100'
                                                        : 'text-cyan-700',
                                                )}
                                                target={
                                                    update.href.startsWith('/')
                                                        ? undefined
                                                        : '_blank'
                                                }
                                                rel={
                                                    update.href.startsWith('/')
                                                        ? undefined
                                                        : 'noreferrer noopener'
                                                }
                                                prefetch={false}
                                                onClick={close}
                                            >
                                                Details
                                                <span aria-hidden="true" className="ml-0">
                                                    &rarr;
                                                </span>
                                            </Link>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Menu.Items>
        )
    },
)

NotificationsMenu.displayName = 'NotificationsMenu'

export default NotificationsMenu
