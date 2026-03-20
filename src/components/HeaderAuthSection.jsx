import { Fragment, useCallback } from 'react'
import Link from 'next/link'
import { Transition, Menu } from '@headlessui/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { logout } from '@/api/logout'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/router'
import { routePaths } from '@/constants/routePaths.constants'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'

/**
 * Log in / Try Free (logged out) or profile menu with Sign out (logged in).
 * @param {{ showAuthOnMobile?: boolean }} props — when true, logged-out links show on small screens (for minimal pages without a nav drawer).
 */
export default function HeaderAuthSection({ showAuthOnMobile = false }) {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const posthog = usePostHog()
  const logoutUser = useCallback(logout, [])
  const signUserOut = () => {
    signOut(auth).then(() => {
      logoutUser({
        onComplete: () => {
          posthog?.reset()
          router.push(routePaths.ROOT)
        },
      })
    })
  }

  const loggedOutClass = showAuthOnMobile
    ? 'flex items-center space-x-4 sm:space-x-6'
    : 'hidden md:flex md:items-center md:space-x-6'

  return (
    <>
      {user ? (
        <div className="flex items-center">
          <Menu as="div" className="relative ml-3">
            <div>
              <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                <span className="sr-only">Open user menu</span>
                {user?.photoURL ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user?.photoURL}
                    alt={user?.displayName}
                    width={40}
                    height={40}
                  />
                ) : (
                  <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                )}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  <div className="block px-4 py-0 text-sm text-gray-700 ">{user?.displayName}</div>
                </Menu.Item>
                <Menu.Item>
                  <div className="block border-b border-solid border-gray-200 px-4 pb-2 text-sm text-gray-700 ">
                    {user?.email}
                  </div>
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/app"
                      className={clsx(
                        active ? 'bg-gray-100' : '',
                        'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700',
                      )}
                    >
                      Dashboard
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/app/team"
                      className={clsx(
                        active ? 'bg-gray-100' : '',
                        'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700',
                      )}
                    >
                      Manage Team
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/app/account"
                      className={clsx(
                        active ? 'bg-gray-100' : '',
                        'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700',
                      )}
                    >
                      Account
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/#"
                      className={clsx(active ? 'bg-gray-100' : '', 'block p-2 px-4 text-sm text-gray-700')}
                      onClick={signUserOut}
                    >
                      Sign Out
                    </Link>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      ) : (
        <div className={loggedOutClass}>
          <Link
            href="/login"
            className="text-base whitespace-nowrap font-medium text-white hover:text-gray-300"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center whitespace-nowrap rounded-md border border-transparent bg-gray-600 px-6 py-2 text-base font-medium text-white hover:bg-gray-700"
          >
            Try Free
          </Link>
        </div>
      )}
    </>
  )
}
