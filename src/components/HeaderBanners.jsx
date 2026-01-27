import { MegaphoneIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import SaleLoyalty, { CountdownTicker, LOYALTY_SALE_DEADLINE, getLoyaltyEventLabel } from '@/components/SaleLoyalty'
import { checkPlanPermission, stripePlan } from '@/utils/helpers'
import { canUserManageBilling } from '@/utils/function.utils'
import { currencies } from '@/constants/pricing.constants'
import news from '/public/latest-news.json'
import clsx from 'clsx'
import { isBannerDismissed, setBannerPreference } from '@/utils/bannerPreferences'

const Countdown = dynamic(() => import('react-countdown'), {
  ssr: false,
  loading: () => <span className="text-white">Loading...</span>,
})

const BUSINESS_ANNUAL_SAVINGS = {
  USD: 2400,
  JPY: 360000,
  EUR: 2400,
  GBP: 2040,
  AUD: 3936,
}

const formatSavings = (amount, currencyCode) => {
  const currencySymbol = currencies[currencyCode]?.symbol ?? '$'
  return `${currencySymbol}${amount.toLocaleString()}`
}

export function HeaderBanner() {
  if (!news) return null

  return (
    <div className="bg-animation flex items-center justify-center gap-x-2 px-6 py-2 sm:px-3.5">
      <SparklesIcon className="h-5 w-5 text-white" aria-hidden="true" />
      <p className="text-md leading-6 text-white">
        <Link href={news.link}>
          <strong className="font-semibold">NEW</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          <span dangerouslySetInnerHTML={{ __html: news.title }} />
          &nbsp;
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
    </div>
  )
}

export function HeaderBannerSale({ team }) {
  const [isClient, setIsClient] = useState(false)

  return null;

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (team && checkPlanPermission(team, 'hobby').allowed) {
    return null
  }

  return (
    <div className="bg-animation flex items-center justify-center gap-x-6 px-6 py-2.5 sm:px-3.5">
      <div className="flex flex-col items-center lg:flex-row flex-wrap sm:items-center gap-x-4 gap-y-2 pb-2 lg:pb-0">
        <p className="text-lg leading-6 text-white text-center xl:text-left">
          <strong className="font-semibold">Save 25-50% for Cyber Monday!</strong>
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          Lock-in an amazing price for any new plan. Ends in{' '}
          {isClient ? (
            <Countdown date={new Date('2024-12-03T00:00:00-08:00')} renderer={DayCounter} />
          ) : (
            <span className="text-white">Loading...</span>
          )}!
        </p>
        <Link
          href="/register?redirect=/app/account"
          className="flex-none rounded-full bg-gray-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Act now <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  )
}

export function BannerSale() {
  return null;
}

export function DayCounter({ days, hours, minutes, seconds, completed }) {
  if (completed) {
    return <span className="text-white">today!</span>
  } else {
    return (
      <span className="text-white">
        {days}d {hours}h {minutes}m {seconds}s
      </span>
    )
  }
}

// Self-contained Loyalty Banner Component - Remove this entire section when promotion ends
export function LoyaltyBanner({ team, user, fullWidth = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState(null)
  const [isDismissed, setIsDismissed] = useState(false)

  const deadline = useMemo(() => new Date(LOYALTY_SALE_DEADLINE), [])
  const loyaltyEventLabel = useMemo(() => getLoyaltyEventLabel(), [])
  const isSaleExpired = deadline && deadline.getTime() <= Date.now()
  
  const dismissKey = 'loyalty-banner-2025-business'

  const currentPlan = useMemo(() => {
    if (!team) return null
    return stripePlan(team)
  }, [team])

  const isProPlan = useMemo(() => currentPlan?.id === 'pro', [currentPlan?.id])

  const isStandardPlan = useMemo(() => currentPlan?.id === 'standard', [currentPlan?.id])

  const isStripeCustomer = useMemo(() => {
    if (!team?.stripeCustomerId) return false
    const status = team?.stripeSubscriptionStatus
    return ['active', 'trialing', 'past_due', 'incomplete'].includes(status)
  }, [team?.stripeCustomerId, team?.stripeSubscriptionStatus])

  const canManageBilling = useMemo(() => {
    if (!team || !user?.uid) return false
    return canUserManageBilling(team, user.uid)
  }, [team, user?.uid])

  const showOffer = Boolean(
    team &&
    canManageBilling &&
    isStripeCustomer &&
    (isProPlan || isStandardPlan)
  )

  const maxSavings = useMemo(() => {
    const currencyCode = team?.stripeSubscriptionCurrency?.toUpperCase()
    const validCurrency = currencyCode && currencies[currencyCode] ? currencyCode : 'USD'
    const amount = BUSINESS_ANNUAL_SAVINGS[validCurrency] ?? BUSINESS_ANNUAL_SAVINGS.USD
    return formatSavings(amount, validCurrency)
  }, [team?.stripeSubscriptionCurrency])

  const handleOpenModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (isApplying) return
    setIsModalOpen(false)
    setError(null)
  }

  const applyCredit = useCallback(
    async (tierId) => {
      if (!team?.id) return
      setError(null)
      setIsApplying(true)
      try {
        const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: tierId, upgrade: true }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.message || 'Something went wrong, please try again.')
        }

        const data = await response.json()
        if (data?.url) {
          window.location.href = data.url
          return
        }

        throw new Error('Unable to open billing portal. Please try again.')
      } catch (err) {
        setError(err?.message || 'Something went wrong, please try again.')
      } finally {
        setIsApplying(false)
      }
    },
    [team?.id],
  )

  const handleApplyBusiness = useCallback(() => applyCredit('business'), [applyCredit])

  const handleDismiss = (e) => {
    e.stopPropagation()
    setIsDismissed(true)
    setBannerPreference(`dismissed-${dismissKey}`, true, 7) // 7 days
  }

  useEffect(() => {
    // Check if loyalty banner was dismissed
    if (isBannerDismissed(dismissKey)) {
      setIsDismissed(true)
    }
  }, [dismissKey])

  useEffect(() => {
    if (!showOffer && isModalOpen) {
      setIsModalOpen(false)
      setIsApplying(false)
      setError(null)
    }
  }, [showOffer, isModalOpen])

  if (!showOffer) return null
  if (isSaleExpired) return null

  // Once intermediate alert is dismissed, show loyalty banner (if not dismissed)
  if (isDismissed) return null

  return (
    <>
      <div className="pt-4">
        <div className={clsx('mx-auto px-4 sm:px-6 md:px-8', fullWidth ? '' : 'max-w-7xl')}>
          <div className="relative">
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex w-full items-center justify-start gap-3 rounded-lg bg-animation px-4 py-2 text-left text-white shadow-lg transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-4 xl:justify-center"
            >
              <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <MegaphoneIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-0.5 text-sm sm:text-base xl:flex-none xl:flex-row xl:items-center xl:gap-2">
                <span className="font-semibold">
                  {loyaltyEventLabel} loyalty credit available: Save up to {maxSavings} this year
                </span>
                <span className="hidden xl:inline">—</span>
                <span className="text-xs sm:text-sm">
                  Expires <CountdownTicker deadline={deadline} className="font-semibold text-white" />
                </span>
              </div>
              <span className="inline-flex flex-shrink-0 items-center rounded-md bg-white px-3 py-1 text-xs font-semibold text-cyan-600 shadow-sm sm:px-4 sm:text-sm">
                View offer
              </span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-2 top-2 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
              aria-label="Dismiss banner"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 -translate-y-8 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 -translate-y-8 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none">
                  <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
                    <button
                      type="button"
                      className="rounded-full p-2 text-gray-400 transition hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onClick={handleCloseModal}
                      disabled={isApplying}
                    >
                      <span className="sr-only">Close loyalty modal</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {error && (
                    <div className="px-6 pt-6 sm:px-8">
                      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    </div>
                  )}

                  <div className="px-0 pb-6 pt-6 sm:pb-8 sm:pt-8">
                    <SaleLoyalty
                      team={team}
                      onApplyBusiness={handleApplyBusiness}
                      isProcessing={isApplying}
                      expiresAt={new Date(LOYALTY_SALE_DEADLINE)}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
// End of Loyalty Banner Component
