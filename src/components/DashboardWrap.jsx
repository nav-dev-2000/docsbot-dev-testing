import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Bars3BottomLeftIcon,
  HomeIcon,
  UsersIcon,
  ServerStackIcon,
  CreditCardIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import RobotIcon from '@/components/RobotIcon'
import clsx from 'clsx'
import { Disclosure } from '@headlessui/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { stripePlan } from '@/utils/helpers'
import { auth } from '@/config/firebase-ui.config'
import { routePaths } from '@/constants/routePaths.constants'
import { NextSeo } from 'next-seo'
import { getUserRole } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import Tooltip from '@/components/Tooltip'
import AnnualSaleBanner from '@/components/AnnualSaleBanner'
import DashboardWizard from '@/components/DashboardWizard'
import YearlyReportNotice from '@/components/YearlyReportNotice'
import Sidebar from './new-dashboard/Sidebar'
import TeamsSelector from './new-dashboard/TeamsSelector'
import Notifications from './new-dashboard/Notifications'
import Profile from './new-dashboard/Profile'

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedPreference = localStorage.getItem('docsbot-new-dashboard')
    setNewDashboardState(storedPreference === 'true')
  }, [])

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
        description="DocsBot Dashboard"
        noindex={true}
      />
      <main>
        <div className="bg-gray-50 md:h-screen md:overflow-hidden md:flex md:flex-row">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            dashboardNavigation={dashboardNavigation}
            page={page}
            team={team}
          />
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col print:!pl-0">
            {/* START: Header */}
            <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow print:hidden">
              <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex flex-1 items-center justify-between px-4">
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
                <TeamsSelector team={team} className="hidden sm:block ml-2 self-center" />
                <div className="ml-2 flex flex-none items-center md:ml-6">
                  <Notifications className="ml-3" />
                  <Profile className="ml-3" />
                </div>
              </div>
            </div>
            {/* END: Header */}

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
                      <YearlyReportNotice team={team} user={user} />
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
