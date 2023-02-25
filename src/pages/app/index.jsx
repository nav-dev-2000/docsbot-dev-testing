import Link from 'next/link'
import { useState } from 'react'

import {
  AcademicCapIcon,
  CreditCardIcon,
  ServerStackIcon,
  UsersIcon,
  PhotoIcon,
  CubeTransparentIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import UpgradeNotice from '@/components/UpgradeNotice'
import { stripePlan } from '@/utils/helpers'
import NewBasePanel from '@/components/NewBasePanel'

function Dashboard({ team }) {
  const [errorText, setErrorText] = useState(null)
  const [open, setOpen] = useState(false)

  const cards = [
    {
      name: 'Knowledge Bases',
      href: '/app/bases',
      linkText: 'View all',
      icon: ServerStackIcon,
      stat: team?.baseCount,
    },
    {
      name: 'Sources',
      href: '/app/account',
      linkText: 'Get more',
      icon: CubeTransparentIcon,
      stat: team?.baseCredits,
    },
    {
      name: 'Source Credits',
      href: '/app/account',
      linkText: 'Get more',
      icon: PhotoIcon,
      stat: team?.sourceCredits,
    },
    {
      name: 'Current Plan',
      href: '/app/account',
      linkText: 'Manage',
      icon: CheckBadgeIcon,
      stat: stripePlan(team).name,
    },
  ]

  const actions = [
    {
      title: 'New Base',
      description: 'Train a new knowledge base with your custom documentation and content.',
      href: '/app/bases',
      click: setOpen,
      icon: AcademicCapIcon,
      iconForeground: 'text-cyan-700',
      iconBackground: 'bg-cyan-50',
    },
    {
      title: 'View Bases',
      description: 'Manage, test, and deploy bots for your trained knowledge bases.',
      href: '/app/bases',
      icon: ServerStackIcon,
      iconForeground: 'text-teal-700',
      iconBackground: 'bg-teal-50',
    },
    {
      title: 'Plan & Billing',
      description: 'Manage your plans and billing information in your billing dashboard.',
      href: '/app/account',
      icon: CreditCardIcon,
      iconForeground: 'text-green-700',
      iconBackground: 'bg-green-50',
    },
    {
      title: 'Team Management (coming soon!)',
      description: 'Manage your team members and their roles in your team dashboard.',
      href: '/app/team',
      icon: UsersIcon,
      iconForeground: 'text-yellow-700',
      iconBackground: 'bg-yellow-50',
    },
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <DashboardWrap page="Dashboard">
      <Alert title={errorText} type="error" />
      <UpgradeNotice team={team} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card */}
        {cards.map((card) => (
          <div key={card.name} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{card.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{card.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            {card.href && (
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href={card.href} className="font-medium text-cyan-700 hover:text-cyan-900">
                    {card.linkText}
                    <ArrowRightIcon className="ml-1 -mr-0.5 inline h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 divide-y divide-gray-200 overflow-hidden rounded-lg bg-gray-200 shadow sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0">
        {actions.map((action, actionIdx) => (
          <div
            key={action.title}
            className={classNames(
              actionIdx === 0 ? 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none' : '',
              actionIdx === 1 ? 'sm:rounded-tr-lg' : '',
              actionIdx === actions.length - 2 ? 'sm:rounded-bl-lg' : '',
              actionIdx === actions.length - 1
                ? 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none'
                : '',
              'group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-500'
            )}
          >
            <div>
              <span
                className={classNames(
                  action.iconBackground,
                  action.iconForeground,
                  'inline-flex rounded-lg p-3 ring-4 ring-white'
                )}
              >
                <action.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                {action.click ? (
                  <Link
                    href={action.href}
                    onClick={(e) => {
                      e.preventDefault()
                      action.click(true)
                    }}
                    className="focus:outline-none"
                  >
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </Link>
                ) : (
                  <Link href={action.href} className="focus:outline-none">
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </Link>
                )}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{action.description}</p>
            </div>
            <span
              className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
              aria-hidden="true"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
            </span>
          </div>
        ))}
      </div>

      <NewBasePanel {...{ team, open, setOpen }} />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    /*
    //redirect new users to account page to checkout
    if (data?.props?.team.stripeSubscriptionStatus !== 'active') {
      return {
        redirect: {
          permanent: false,
          destination: '/app/account',
        },
      }
    }
    */
  }

  return data
}

export default Dashboard
