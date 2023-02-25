import { Fragment, useCallback } from 'react'
import Link from 'next/link'
import { Popover, Transition, Menu } from '@headlessui/react'
import clsx from 'clsx'
import Image from 'next/image'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { logout } from '@/api/logout'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/router'
import { routePaths } from '@/constants/routePaths.constants'
import { NAVIGATION } from '@/constants/navigation.constants'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function MobileNavLink({ href, children }) {
  return (
    <Popover.Button as={Link} href={href} className="block w-full p-2">
      {children}
    </Popover.Button>
  )
}

function MobileNavIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx('origin-center transition', open && 'scale-90 opacity-0')}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx('origin-center transition', !open && 'scale-90 opacity-0')}
      />
    </svg>
  )
}

function MobileNavigation() {
  const [user] = useAuthState(auth)

  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center [&:not(:focus-visible)]:focus:outline-none"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            as="div"
            className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5"
          >
            {NAVIGATION.map((item) => (
              <MobileNavLink key={item.title} href={item.url}>{item.title}</MobileNavLink>
            ))}
            {!user && (
              <>
                <hr className="m-2 border-slate-300/40" />
                <MobileNavLink href="/login">Sign in</MobileNavLink>
              </>
            )}
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export function Header() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const logoutUser = useCallback(logout, [])
  const signUserOut = () => {
    signOut(auth).then(() => {
      logoutUser({
        onComplete: () => {
          router.push(routePaths.ROOT)
        },
      })
    })
  }

  return (
    <header className="py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="/#" aria-label="Home">
              <Logo className="h-18 w-auto" />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
            {NAVIGATION.map((item) => (
              <NavLink key={item.title} href={item.url}>{item.title}</NavLink>
            ))}
            </div>
          </div>
          {user ? (
            <div className="flex items-center">
              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="sr-only">Open user menu</span>
                    {user?.photoURL ? (
                      <Image
                        className="h-10 w-10 rounded-full"
                        src={user?.photoURL}
                        alt={user?.displayName}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
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
                      <div className="block px-4 py-0 text-sm text-gray-700 ">
                        {user?.displayName}
                      </div>
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
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700'
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
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700'
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
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block border-b border-solid border-gray-200 px-4 py-2 text-sm text-gray-700'
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
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'block p-2 px-4 text-sm text-gray-700'
                          )}
                          onClick={signUserOut}
                        >
                          Sign Out
                        </Link>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
              <div className="-mr-1 ml-4 md:hidden">
                <MobileNavigation />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-x-5 md:gap-x-8">
              <div className="hidden md:block">
                <NavLink href="/login">Sign in</NavLink>
              </div>
              <Button href="/register" color="blue">
                <span>
                  Get started <span className="hidden lg:inline">today</span>
                </span>
              </Button>
              <div className="-mr-1 md:hidden">
                <MobileNavigation />
              </div>
            </div>
          )}
        </nav>
      </Container>
    </header>
  )
}
