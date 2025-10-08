import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { StripePricingTable } from '@/components/StripePricing'
import { stripePlan } from '@/utils/helpers'
import LoadingSpinner from '@/components/LoadingSpinner'
import { pricingTiers } from '@/constants/pricing.constants'
import * as cookie from 'cookie'
import { DEALS, DEFAULT_DEAL } from '@/constants/deals.constants'
import SaleLoyalty from '@/components/SaleLoyalty'

export default function Checkout({ team, children, upgrade = false }) {
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [isStripeCustomer, setIsStripeCustomer] = useState(
    !!team.stripeCustomerId &&
      ['active', 'trialing', 'past_due', 'incomplete'].includes(team.stripeSubscriptionStatus)
  )
  const [opening, setOpening] = useState(false)
  const [dealMessage, setDealMessage] = useState(null)

  // Check if current plan is legacy
  const currentPlan = stripePlan(team)
  const isLegacyPlan = pricingTiers.find(tier => tier.id === currentPlan?.id)?.legacy === true
  const isLegacyProPlan = currentPlan?.id === 'pro' && isLegacyPlan

  useEffect(() => {
    if (['past_due', 'incomplete'].includes(team.stripeSubscriptionStatus)) {
      setErrorText(
        'There is a problem with your subscription. Please check your payment method in the billing portal.'
      )
    }
  }, [team.stripeSubscriptionStatus])

  useEffect(() => {
    if (isStripeCustomer && team.stripeSubscriptionCancelAtPeriodEnd) {
      setErrorText('Your subscription is scheduled to cancel at the end of your billing period.')
    }
  }, [team.stripeSubscriptionCancelAtPeriodEnd])

  useEffect(() => {
    if (!isStripeCustomer) {
      const cookies = cookie.parse(document.cookie || '')
      const couponId = cookies['docsbot_coupon']
      if (couponId) {
        setDealMessage(DEALS[couponId]?.message || DEFAULT_DEAL.message)
      }
    }
  }, [isStripeCustomer])

  async function openPortal(options = {}) {
    const { tier, upgrade: upgradeOverride } = options
    const shouldUpgrade = typeof upgradeOverride === 'boolean' ? upgradeOverride : upgrade
    setErrorText(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ upgrade: shouldUpgrade, tier }),
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
        setErrorText('Error ' + response.status + ', please try again.')
        setOpening(false)
      }
    }
    setOpening(false)
  }

  async function renewPlan() {
    setErrorText(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      openPortal()
      return
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
        setOpening(false)
      }
    }
  }

  const Button = () => {
    return (
      <button
        type="button"
        className="text-md inline-flex w-64 items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
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
    )
  }

  return (
    <>
      <Alert title={errorText} type="error" />
      {dealMessage && <Alert title={dealMessage} type="success" />}

      {isLegacyPlan && (
        <div className="mb-6 rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You're on a Legacy Plan
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You're currently on the {currentPlan?.name} plan, which is no longer available to new customers since May, 2025. 
                  While you can continue using this plan <Link href="https://docsbot.ai/2026-plan-pricing-update-faq" target="_blank" className="font-medium underline text-yellow-700 hover:text-yellow-600">for now</Link>, consider upgrading to one of our current plans to access the latest features and better value.{' '}
                  <Link href="/pricing?showLegacy=true" target="_blank" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                    Compare to current plans &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {children ? (
        <>
          <div className="flex justify-center text-center">
            <div className="max-w-2xl">
              {children}
              <Button />
            </div>
          </div>
        </>
      ) : (
        <div className="">
          {!isStripeCustomer && (
            <StripePricingTable team={team} email={user?.email} setErrorText={setErrorText} />
          )}
          {!!team.stripeCustomerId && (
            <div className="flex justify-center text-center">
              {isStripeCustomer ? (
                <div className="flex w-full max-w-5xl flex-col items-center">
                  {isLegacyProPlan && (
                    <div className="mb-10 w-full border-y border-gray-200">
                      <SaleLoyalty
                        team={team}
                        onApplyStandard={() =>
                          openPortal({ tier: 'standard', upgrade: true })
                        }
                        onApplyBusiness={() =>
                          openPortal({ tier: 'business', upgrade: true })
                        }
                        isProcessing={opening}
                        expiresAt="2025-10-22T04:59:00.000Z"
                      />
                    </div>
                  )}
                  {team.stripeSubscriptionCancelAtPeriodEnd && (
                    <div className="mb-6 flex justify-center text-center">
                      <button
                        type="button"
                        className="text-md ring-inside inline-flex w-64 items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 font-medium text-cyan-700 shadow-sm ring-2 ring-cyan-600 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-25"
                        onClick={(e) => {
                          renewPlan()
                        }}
                        disabled={opening}
                      >
                        <CheckCircleIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        Reactivate Plan
                      </button>
                    </div>
                  )}
                  <h3 className="text-3xl font-bold">Manage your Plan</h3>
                  <p className="text-md mb-8 mt-2 text-gray-800 md:mb-16">
                    You are currently on the {stripePlan(team).name} plan. Open your billing portal
                    to change your plan, update payment methods, and download invoices.
                  </p>
                  <Button />
                </div>
              ) : (
                <div className="max-w-2xl">
                  <h3 className="text-3xl font-bold">Billing History</h3>
                  <p className="text-md mb-6 mt-2 text-gray-800 md:mb-16">
                    Open your billing portal to view billing history and download invoices.
                  </p>
                  <Button />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
