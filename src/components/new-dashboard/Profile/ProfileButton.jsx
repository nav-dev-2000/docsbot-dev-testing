import React, { forwardRef, useState, useEffect } from 'react'
import { Menu } from '@headlessui/react'
import clsx from 'clsx'

const ProfileButton = forwardRef(({ user, ...props }, ref) => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => setIsMounted(true), [])

    const showAvatar = isMounted && user?.photoURL

    return (
        <Menu.Button
            ref={ref}
            {...props}
            className={clsx(
                'flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                props.className,
            )}
            data-component="profile-button"
        >
            <span className="sr-only">Open user menu</span>
            {showAvatar ? (
                <img
                    className="h-8 w-8 rounded-full"
                    src={user.photoURL}
                    alt={user?.displayName}
                    width={32}
                    height={32}
                />
            ) : (
                <span className="inline-block h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                    <svg
                        className="h-full w-full text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </span>
            )}
        </Menu.Button>
    )
})

ProfileButton.displayName = 'ProfileButton'

export default ProfileButton
