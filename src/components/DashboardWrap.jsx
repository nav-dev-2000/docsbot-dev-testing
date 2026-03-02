import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { Fragment, useState, useEffect, useCallback, useRef } from 'react'
import {
  Bars3BottomLeftIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ServerStackIcon,
  CreditCardIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  UserGroupIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import RobotIcon from '@/components/RobotIcon'
import clsx from 'clsx'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut } from 'firebase/auth'
import { stripePlan } from '@/utils/helpers'
import { logout } from '@/api/logout'
import { auth } from '@/config/firebase-ui.config'
import { routePaths } from '@/constants/routePaths.constants'
import logo from '@/images/docsbot-logo-white.png'
import { NextSeo } from 'next-seo'
import { getUserRole } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import { usePostHog } from 'posthog-js/react'
import Tooltip from '@/components/Tooltip'
import { FEATURE_UPDATES } from '@/constants/featureUpdates.constants'
import * as cookie from 'cookie'
import AnnualSaleBanner from '@/components/AnnualSaleBanner'
import DashboardWizard from '@/components/DashboardWizard'
import YearlyReportNotice from '@/components/YearlyReportNotice'
import Button from '@new-dashboard/Button'
import Sidebar from './new-dashboard/Sidebar'

export default function DashboardWrap({
  page,
  title,
  team,
  fullWidth = false,
  header = null,
  children,
  bot = null,
  bots = null,
  newDashboard: newDashboardProp,
}) {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState('')
  const [dashboardNavigation, setDashboardNavigation] = useState([])
  const [currentPageLink, setCurrentPageLink] = useState('')
  const [newDashboardState, setNewDashboardState] = useState(false)
  const newDashboard = newDashboardProp !== undefined ? newDashboardProp : newDashboardState
  const posthog = usePostHog()
  const logoutUser = useCallback(logout, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedPreference = localStorage.getItem('docsbot-new-dashboard')
    setNewDashboardState(storedPreference === 'true')
  }, [])

  const signUserOut = () => {
    signOut(auth).then(() => {
      logoutUser({
        onComplete: () => {
          posthog?.reset()
          router.push(routePaths.LOGIN)
        },
      })
    })
  }

  // Utility functions for managing preferences cookie (same as Alert.jsx)
  const getPreferences = () => {
    if (typeof window === 'undefined') return {}
    try {
      const cookies = cookie.parse(document.cookie || '')
      const prefsValue = cookies['docsbot-prefs']
      if (!prefsValue) return {}

      // The cookie.parse automatically URL decodes, but let's be explicit about JSON parsing
      const decoded = decodeURIComponent(prefsValue)
      const parsed = JSON.parse(decoded)
      return parsed
    } catch (error) {
      console.error('Failed to parse preferences cookie:', error)
      return {}
    }
  }

  const setPreference = (key, value) => {
    if (typeof window === 'undefined') return
    try {
      const prefs = getPreferences()
      prefs[key] = value
      const expires = new Date()
      expires.setDate(expires.getDate() + 365)
      document.cookie = cookie.serialize(
        'docsbot-prefs',
        JSON.stringify(prefs),
        {
          expires,
          path: '/',
          sameSite: 'lax',
        },
      )
    } catch (error) {
      console.error('Failed to set preference:', error)
    }
  }

  const getLastDismissedDate = () => {
    const prefs = getPreferences()
    return prefs['dismissed-feature-updates'] || null
  }

  const setLastDismissedDate = (date) => {
    setPreference('dismissed-feature-updates', date)
  }

  const sortedUpdates = FEATURE_UPDATES.slice().sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )
  const latestUpdateDate = sortedUpdates[0]?.date
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false)
  const [shouldWiggle, setShouldWiggle] = useState(false)

  useEffect(() => {
    try {
      const lastDismissedDate = getLastDismissedDate()

      // Check if there are any updates newer than the last dismissed date
      if (latestUpdateDate) {
        setHasUnreadUpdates(
          !lastDismissedDate ||
            new Date(latestUpdateDate) > new Date(lastDismissedDate),
        )
      }
    } catch (e) {
      // noop
    }
  }, [latestUpdateDate])

  useEffect(() => {
    if (!hasUnreadUpdates) return
    const intervalId = setInterval(() => {
      setShouldWiggle(true)
      setTimeout(() => setShouldWiggle(false), 1500)
    }, 15000)
    return () => clearInterval(intervalId)
  }, [hasUnreadUpdates])

  const markUpdatesAsRead = () => {
    if (!latestUpdateDate) return
    try {
      setLastDismissedDate(latestUpdateDate)
      setHasUnreadUpdates(false)
    } catch (e) {
      // noop
    }
  }

  useEffect(() => {
    if (posthog && team && router.asPath === '/app') {
      posthog?.group('team', team.id, {
        name: team.name,
        plan: stripePlan(team).name,
      })
    }
  }, [posthog, team, router])

  useEffect(() => {
    if (
      user &&
      team &&
      'Beacon' in window &&
      Beacon !== undefined &&
      typeof Beacon === 'function'
    ) {
      const ident = {
        email: user.email,
      }
      if (user.displayName) {
        ident.name = user.displayName
      }
      if (team) {
        ident.company = team.name
        ident['connected-sites'] =
          `https://docsbot.ai/app/team?switchTeam=${team.id}`
        if (team.stripeSubscriptionPrice && stripePlan(team).name !== 'Free') {
          ident['monthly-price'] = '$' + team.stripeSubscriptionPrice / 100
        }
        ident['storage-plan'] = stripePlan(team).name
        if (team.stripeCustomerId) {
          ident['stripe-customer'] =
            `https://dashboard.stripe.com/customers/${team.stripeCustomerId}`
        }
        if (team.stripeSubscriptionId) {
          ident['stripe-subscription'] =
            `https://dashboard.stripe.com/subscriptions/${team.stripeSubscriptionId}`
        }
      }
      Beacon('identify', ident)
    }
    if (user && team) {
      const role = getUserRole(team, user?.uid)
      setCurrentRole(role)
    }
  }, [user, team])

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: HomeIcon },
    { name: 'Bots', href: '/app/bots', icon: RobotIcon },
    { name: 'Team', href: '/app/team', icon: UsersIcon },
    { name: 'Account', href: '/app/account', icon: CreditCardIcon },
    { name: 'API/Integrations', href: '/app/api', icon: ServerStackIcon },
    //{ name: 'Reports', href: '/app/reports', icon: ChartBarIcon, current: false },
  ]

  useEffect(() => {
    const normalizedRole = currentRole?.toLowerCase()
    if (normalizedRole === 'editor' || normalizedRole === 'viewer' || normalizedRole === 'none') {
      const filteredNavigation = navigation.filter((nav) => {
        const navName = nav.name.toLowerCase()
        if (navName.includes('account') || navName.includes('api')) {
          return false
        }
        if (normalizedRole === 'none' && navName.includes('team')) {
          return false
        }
        return true
      })
      setCurrentPageLink(
        filteredNavigation.find((nav) => nav.name === page)?.href,
      )
      setDashboardNavigation(filteredNavigation)
    } else {
      const finalNavigation = isSuperAdmin(user?.uid)
        ? [
            ...navigation,
            { name: 'Staff Tools', href: '/app/staff', icon: UserGroupIcon },
          ]
        : navigation
      setCurrentPageLink(finalNavigation.find((nav) => nav.name === page)?.href)
      setDashboardNavigation(finalNavigation)
    }
  }, [currentRole, user])

  const userNavigation =
    currentRole?.toLowerCase() === 'none'
      ? []
      : [{ name: 'Account', href: '/app/account' }]

  const pageTitle = `${page} ${title ? ` | ${Array.isArray(title) ? title.join(' | ') : title}` : ''}`

  const Breadcrumbs = ({ title }) => {
    if (!title) return null

    let titles = title
    //if title is not array cast to array
    if (!Array.isArray(title)) {
      titles = [title]
    }

    return (
      <>
        <div className="flex flex-wrap items-center">
          {titles.map((title, index) => (
            <div
              key={index}
              className="flex-inline ml-1 flex items-center lg:ml-2"
            >
              <ChevronRightIcon className="h-3 w-3 flex-shrink-0 text-gray-400 sm:h-4 sm:w-4" />
              <h1 className="ml-1 truncate text-xs font-medium leading-tight text-gray-800 sm:text-sm lg:ml-2 lg:text-xl">
                {title}
              </h1>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <NextSeo
        title={pageTitle}
        description="DocsBot AI Dashboard"
        noindex={true}
      />
      <main>
        <div className="bg-gray-50 md:h-screen md:overflow-hidden md:flex md:flex-row">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            dashboardNavigation={dashboardNavigation}
            page={page}
          />
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col print:!pl-0">
            <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow print:hidden">
              <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex flex-1 justify-between px-4">
                <div className="flex flex-1 items-center">
                  <h1 className="text-md font-semibold text-gray-900 lg:ml-4 lg:text-xl">
                    <Tooltip content={`Go to ${page}`}>
                      <Link
                        href={currentPageLink || '/app'}
                        className="hover:text-gray-500"
                      >
                        {page}
                      </Link>
                    </Tooltip>
                  </h1>
                  <Breadcrumbs title={title} />
                </div>
                <Tooltip content="Switch Team">
                  <Link
                    className="ml-2 flex items-center overflow-hidden text-xs leading-tight text-gray-500 md:text-sm"
                    href={'/app/team'}
                  >
                    <p className="flex items-center overflow-hidden text-xs leading-tight text-gray-500 md:text-sm">
                      {team?.name || ''}
                    </p>
                    <ChevronUpDownIcon
                      className="h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Switch Team</span>
                  </Link>
                </Tooltip>
                <div className="ml-2 flex flex-none items-center md:ml-6">
                  {/* Notifications dropdown */}
                  <Menu as="div" className="relative ml-3">
                    {({ close }) => (
                      <>
                        <div>
                          <Menu.Button
                            className={clsx(
                              'relative rounded-full p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                              shouldWiggle && 'animate-bounce',
                            )}
                            aria-label="Open notifications"
                          >
                            <BellIcon className="h-6 w-6" aria-hidden="true" />
                            {hasUnreadUpdates && (
                              <span className="absolute right-1.5 top-1 inline-flex h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white"></span>
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
                          afterLeave={markUpdatesAsRead}
                        >
                          <Menu.Items className="fixed inset-0 z-50 w-full max-w-none rounded-none flex flex-col bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:absolute md:right-0 md:inset-auto md:z-10 md:mt-2 md:w-96 md:max-w-[92vw] md:rounded-md md:flex-none origin-top-right">
                            <div className="border-b border-gray-200 px-4 pb-2 sticky top-0 bg-gray-50 z-10 flex justify-between items-center">
                              <div>
                                <div className="text-md font-semibold text-gray-700">
                                  What's New
                                </div>
                                <div className="text-xs text-gray-400">
                                  Product updates and improvements
                                </div>
                              </div>
                              <button 
                                className="block md:hidden p-2 text-gray-400 hover:text-gray-600"
                                onClick={close}
                              >
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </div>
                        <div className="flex-1 overflow-y-auto md:max-h-96 md:flex-none">
                          {(() => {
                            const lastDismissedDate = getLastDismissedDate()
                            return sortedUpdates.map((update, idx) => {
                              // An update is unread if there's no dismissed date yet, or if this update is newer than the last dismissed date
                              const isUnread =
                                !lastDismissedDate ||
                                new Date(update.date) >
                                  new Date(lastDismissedDate)

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
                                  <div className="flex items-start justify-between">
                                    <div
                                      className={clsx(
                                        'text-sm font-medium',
                                        isUnread
                                          ? 'text-white'
                                          : 'text-gray-900',
                                      )}
                                    >
                                      {update.title}
                                    </div>
                                    <div
                                      className={clsx(
                                        'ml-3 shrink-0 text-xs',
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
                                      'mt-1 text-sm',
                                      isUnread
                                        ? 'text-cyan-50'
                                        : 'text-gray-600',
                                    )}
                                  >
                                    {update.description}
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2">
                        <span className="sr-only">Open user menu</span>
                        {user?.photoURL ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user?.photoURL}
                            alt={user?.displayName}
                            width={32}
                            height={32}
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
                      <Menu.Items className="z-5 absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>

            {header}

            {!router.pathname.includes('/conversations') &&
              router.pathname !== '/app/account' && (
                <AnnualSaleBanner
                  team={team}
                  user={user}
                  fullWidth={fullWidth}
                />
              )}

            <main className="min-h-0 flex-1 overflow-y-auto">
              <div className="py-4 sm:py-8">
                <div
                  className={clsx(
                    'mx-auto w-full px-4 sm:px-6 md:px-8',
                    fullWidth ? '' : 'max-w-7xl',
                  )}
                >
                  {team &&
                    !newDashboard &&
                    !router.pathname.includes('/conversations') &&
                    !router.pathname.includes('/questions') &&
                    !router.pathname.includes('/research') && (
                      <YearlyReportNotice team={team} />
                    )}
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </main>
      
      {/* Dashboard Wizard for new users */}
      <DashboardWizard team={team} user={user} bot={bot} bots={bots} />
    </>
  )
}
