import Link from 'next/link'
import { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { updateEmail } from 'firebase/auth'
import { auth } from '@/config/firebase-ui.config'
import {
  ServerStackIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { stripePlan } from '@/utils/helpers'
import Checkout from '@/components/Checkout'
import ModalDeleteAccount from '@/components/ModalDeleteAccount'

function Account({ team }) {
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [newEmail, setNewEmail] = useState('')

  const cards = [
    {
      name: 'Current Plan',
      href: false,
      linkText: 'Manage',
      icon: CheckBadgeIcon,
      stat: stripePlan(team).name,
    },
    {
      name: 'Bot Limit',
      href: false,
      linkText: 'View all',
      icon: ServerStackIcon,
      stat: stripePlan(team).bots,
    },
    {
      name: 'Source Limit',
      href: false,
      linkText: 'Get more',
      icon: DocumentTextIcon,
      stat: stripePlan(team).sources,
    },
    {
      name: 'Page Limit',
      href: false,
      linkText: 'Get more',
      icon: Square3Stack3DIcon,
      stat: stripePlan(team).pages,
    },
    {
      name: 'Question Limit',
      href: false,
      linkText: 'Get more',
      icon: QuestionMarkCircleIcon,
      stat: stripePlan(team).questions,
    },
  ]
  console.log(stripePlan(team))
  return (
    <DashboardWrap page="Account">
      <Alert title={errorText} type="error" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="mt-6 rounded-lg bg-white p-8 shadow">
        <Checkout team={team} />
      </div>

      <div className="mt-6 md:grid md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Update your email address</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can update your email address here. This will update your email address for all of
            your teams.
          </p>
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
              New Email
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="email"
                  id="team_id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Email"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  updateEmail(auth.currentUser, newEmail)
                    .then(() => {
                      alert('Email updated successfully')
                    })
                    .catch((error) => {
                      setErrorText(
                        error.message +
                          " If you havn't recently logged in to your account, you may need log out then back in to change your email address for security reasons."
                      )
                    })
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Delete Team Account</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can delete your team account here. This will delete all of your bots, sources, questions, keys, any other data, and remove all team members. This action cannot be undone and you should cancel any subscriptions before deleting your team account.
          </p>
          <div className="mt-5 flex justify-end">
          <ModalDeleteAccount team={team} />
        </div>
        </div>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = getAuthorizedUserCurrentTeam

export default Account
