import React, { forwardRef } from 'react'
import { Menu } from '@headlessui/react'
import Link from 'next/link'
import clsx from 'clsx'

const ProfileMenu = forwardRef(
    ({ user, userNavigation, signUserOut, ...props }, ref) => {
        return (
            <Menu.Items
                ref={ref}
                {...props}
                className={clsx(
                    'z-20 absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
                    props.className,
                )}
                data-component="profile-menu"
            >
                <div className="px-4 py-2 text-sm">
                    <div className="mb-1 text-base font-medium leading-none text-gray-600">
                        {user?.displayName}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400">
                        {user?.email}
                    </div>
                </div>
                {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                        {({ active }) => (
                            <Link
                                href={item.href}
                                className={clsx(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700',
                                )}
                            >
                                {item.name}
                            </Link>
                        )}
                    </Menu.Item>
                ))}
                <Menu.Item>
                    {({ active }) => (
                        <a
                            type="button"
                            href="#"
                            className={clsx(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700',
                            )}
                            onClick={signUserOut}
                        >
                            Logout
                        </a>
                    )}
                </Menu.Item>
            </Menu.Items>
        )
    },
)

ProfileMenu.displayName = 'ProfileMenu'

export default ProfileMenu
