import Link from 'next/link'
import { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { updateEmail } from "firebase/auth";
import { auth } from '@/config/firebase-ui.config'
import {
  PhotoIcon,
  CubeTransparentIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ReceiptRefundIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { StripePricingTableBaseh, StripePricingTableRecharge } from '@/components/StripePricing'
import { stripePlan } from '@/utils/helpers'
import LoadingSpinner from '@/components/LoadingSpinner'

function Account({ team }) {
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [isStripeCustomer, setIsStripeCustomer] = useState(!!team.stripeCustomerId)
  const [opening, setOpening] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  async function openPortal() {
    setErrorText(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user?.accessToken}`,
      },
    })
    if (response.ok) {
      const data = await response.json()
      const { url } = data
      //redirect to url
      window.location.href = url
      return
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText(response.statusText + ', please try again.')
        setOpening(false)
      }
    }
    setOpening(false)
  }

  const cards = [
    {
      name: 'Current Plan',
      href: false,
      linkText: 'Manage',
      icon: CheckBadgeIcon,
      stat: stripePlan(team).name,
    },
    {
      name: 'Base Credits',
      href: false,
      linkText: 'Get more',
      icon: CubeTransparentIcon,
      stat: team?.baseCredits,
    },
    {
      name: 'Source Credits',
      href: false,
      linkText: 'Get more',
      icon: PhotoIcon,
      stat: team?.sourceCredits,
    },
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  return (
    <DashboardWrap page="Account">
      <Alert title={errorText} type="error" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
        {!isStripeCustomer && <StripePricingTableBaseh teamId={team?.id} email={user?.email} />}
        {isStripeCustomer && (
          <div className="grid grid-cols-1 md:grid-cols-2 items-start justify-between gap-x-16 gap-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold">Manage your Plan</h3>
              <p className="mt-2 text-md text-gray-800 text-justify">
                You are currently on the {stripePlan(team).name} plan. Open our billing portal to
                change your plan, update payment methods, download invoices, or cancel your
                subscription.
              </p>
              <button
                type="button"
                className="mt-8 md:mt-16 w-3/4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 text-md font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
                onClick={openPortal}
                disabled={opening}
              >
                {opening ? (
                  <LoadingSpinner />
                ) : (
                  <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                )}
                Billing Portal
              </button>
            </div>
            <div className="">
              <StripePricingTableRecharge teamId={team?.id} email={user?.email} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-white p-8 shadow">
        <h3 className="text-3xl font-bold">Update your email address</h3>
        <p className="mt-2 text-md text-gray-800 text-justify">
          You can update your email address here. This will update your email address for all of your teams.
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
                  updateEmail(auth.currentUser,newEmail).then(() => {
                    alert('Email updated successfully')
                  }).catch((error) => {
                    setErrorText(error.message)
                  });
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                Update
              </button>
            </div>
          </div>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = getAuthorizedUserCurrentTeam

export default Account
