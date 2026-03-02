import React, { forwardRef } from 'react'
import { Menu } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const NotificationsButton = forwardRef(
    ({ shouldWiggle, hasUnreadUpdates, isActive = false, ...props }, ref) => {
        return (
            <Menu.Button
                ref={ref}
                {...props}
                className={clsx(
                    'relative flex size-8 items-center justify-center rounded-full transition',
                    'ring-offset-2 !outline-none shadow-none',
                    {
                        ['bg-cyan-100 ring-1 ring-cyan-600 text-cyan-600']: isActive,
                        ['bg-white text-gray-500 hover:ring-1 hover:ring-cyan-500 hover:text-cyan-500']: !isActive,
                    },
                    shouldWiggle && 'animate-bounce',
                    props.className,
                )}
                aria-label={isActive ? 'Close notifications' : 'Open notifications'}
                data-component="notifications-button"
            >
                <BellIcon className="size-5" aria-hidden="true" />
                {hasUnreadUpdates && (
                    <span className="absolute right-1.5 top-1 inline-flex h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />
                )}
            </Menu.Button>
        )
    },
)

NotificationsButton.displayName = 'NotificationsButton'

export default NotificationsButton
