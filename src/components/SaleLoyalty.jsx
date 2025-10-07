import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useMemo } from 'react'
import { usePostHog } from 'posthog-js/react'
import { currencies, pricingTiers } from '@/constants/pricing.constants'

const Countdown = dynamic(() => import('react-countdown'), {
  ssr: false,
  loading: () => <span className="text-md font-bold text-cyan-600">Ends soon</span>,
})

const FULL_COMPARISON_KEY = 'full-comparison'

const featuresMap = {
  standard: [
    'Deeper conversation analytics & summaries',
    'Integrated ticket escalation',
    'Customer screenshot uploads',
    '+5,000 source pages',
    '+5,000 messages/month',
    '+2 staff accounts',
  ],
  business: [
    '10x higher bot, page, message limits',
    'Conversation topic reports',
    'Conversation sentiment analysis',
    'AI question reports',
    'Rate limiting',
    'Priority support',
    'SOC 2 Type II security',
    'One-on-one AI strategy call with our CEO'
  ],
}

const currencyLocales = {
  USD: 'en-US',
  JPY: 'ja-JP',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AUD: 'en-AU',
}

const LOYALTY_DISCOUNTED_MONTHLY = {
  standard: {
    USD: 124,
    JPY: 18333,
    EUR: 112,
    GBP: 96,
    AUD: 200,
  },
  business: {
    USD: 299,
    JPY: 46000,
    EUR: 292,
    GBP: 255,
    AUD: 490,
  },
}

const pricingTierLookup = pricingTiers.reduce((accumulator, tier) => {
  if (tier?.id) {
    accumulator[tier.id] = tier
  }
  return accumulator
}, {})

const getTierMonthlyPrice = (tierId, currencyCode) => {
  const tier = pricingTierLookup[tierId]
  if (!tier) {
    return 0
  }

  const price = tier.price?.[currencyCode]?.monthly
  if (typeof price === 'number') {
    return price
  }

  const fallback = tier.price?.USD?.monthly
  return typeof fallback === 'number' ? fallback : 0
}

const getDiscountedMonthlyPrice = (tierId, currencyCode) => {
  const tierPricing = LOYALTY_DISCOUNTED_MONTHLY[tierId] ?? {}
  const price = tierPricing[currencyCode]

  if (typeof price === 'number') {
    return price
  }

  const fallback = tierPricing.USD
  return typeof fallback === 'number' ? fallback : 0
}

const formatCurrency = (value, currencyCode) => {
  const numericValue = Number(value)
  const safeNumber = Number.isFinite(numericValue) ? numericValue : 0
  const locale = currencyLocales[currencyCode]
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeNumber)
  } catch (error) {
    const fallbackSymbol = currencies[currencyCode]?.symbol ?? '$'
    return `${fallbackSymbol}${safeNumber.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }
}

const STANDARD_ANNUAL_SAVINGS = {
  USD: 300,
  JPY: 44000,
  EUR: 276,
  GBP: 228,
  AUD: 480,
}

const BUSINESS_ANNUAL_SAVINGS = {
  USD: 2400,
  JPY: 360000,
  EUR: 2400,
  GBP: 2040,
  AUD: 3936,
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function CountdownTicker({ deadline }) {
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return <span>Ends soon</span>
  }

  return (
    <Countdown
      date={deadline}
      renderer={({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
          return <span className="text-lg font-semibold text-cyan-600">Offer ended</span>
        }

        const pad = (value) => value.toString().padStart(2, '0')

        return (
          <span className="text-md font-bold text-cyan-600">
            {pad(days)}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
          </span>
        )
      }}
    />
  )
}

export default function SaleLoyalty({
  team,
  onApplyStandard,
  onApplyBusiness,
  isProcessing = false,
  expiresAt,
}) {
  const posthog = usePostHog()
  const currencyCode = useMemo(() => {
    const code = team?.stripeSubscriptionCurrency?.toUpperCase()
    return code && currencies[code] ? code : 'USD'
  }, [team?.stripeSubscriptionCurrency])

  const standardAnnualSavings = STANDARD_ANNUAL_SAVINGS[currencyCode] ?? STANDARD_ANNUAL_SAVINGS.USD
  const businessAnnualSavings = BUSINESS_ANNUAL_SAVINGS[currencyCode] ?? BUSINESS_ANNUAL_SAVINGS.USD

  const fallbackDate = useMemo(() => new Date('2025-10-22T04:59:00.000Z'), [])
  const countdownDate = useMemo(() => {
    if (expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime())) {
      return expiresAt
    }
    if (typeof expiresAt === 'string') {
      const parsed = new Date(expiresAt)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return fallbackDate
  }, [expiresAt, fallbackDate])

  const formattedStandardSavings = useMemo(
    () => formatCurrency(standardAnnualSavings, currencyCode),
    [currencyCode, standardAnnualSavings],
  )

  const formattedBusinessSavings = useMemo(
    () => formatCurrency(businessAnnualSavings, currencyCode),
    [currencyCode, businessAnnualSavings],
  )

  const standardMonthlyPrice = useMemo(
    () => getTierMonthlyPrice('standard', currencyCode),
    [currencyCode],
  )

  const businessMonthlyPrice = useMemo(
    () => getTierMonthlyPrice('business', currencyCode),
    [currencyCode],
  )

  const discountedStandardMonthly = useMemo(
    () => getDiscountedMonthlyPrice('standard', currencyCode),
    [currencyCode],
  )

  const discountedBusinessMonthly = useMemo(
    () => getDiscountedMonthlyPrice('business', currencyCode),
    [currencyCode],
  )

  const tiers = useMemo(() => [
    {
      name: 'Upgrade to Standard',
      id: 'tier-standard',
      oldMonthlyPrice: formatCurrency(standardMonthlyPrice, currencyCode),
      newMonthlyPrice: formatCurrency(discountedStandardMonthly, currencyCode),
      priceSuffix: '/month',
      creditLabel: formattedStandardSavings,
      description: 'Best for internal knowledge sharing',
      features: [...featuresMap.standard, FULL_COMPARISON_KEY],
      featured: false,
      onApply: onApplyStandard,
    },
    {
      name: 'Upgrade to Business',
      id: 'tier-business',
      oldMonthlyPrice: formatCurrency(businessMonthlyPrice, currencyCode),
      newMonthlyPrice: formatCurrency(discountedBusinessMonthly, currencyCode),
      priceSuffix: '/month',
      creditLabel: formattedBusinessSavings,
      description: 'For external support and improving CSAT',
      features: [...featuresMap.business, FULL_COMPARISON_KEY],
      featured: true,
      onApply: onApplyBusiness,
    },
  ], [
    businessMonthlyPrice,
    currencyCode,
    discountedBusinessMonthly,
    discountedStandardMonthly,
    formattedBusinessSavings,
    formattedStandardSavings,
    onApplyBusiness,
    onApplyStandard,
    standardMonthlyPrice,
  ])

  return (
    <div className="relative isolate bg-white px-6 py-6 sm:py-12 lg:px-8 border-y border-gray-200">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-cyan-200 via-cyan-300 to-cyan-400 opacity-30"
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-xl font-semibold leading-7 text-cyan-600"> Credit expires in&nbsp;
        <CountdownTicker deadline={countdownDate} /></h2>
        <p className="mt-2 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
          Save up to {formattedBusinessSavings} this year on DocsBot
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-4xl text-pretty text-center text-lg font-medium text-gray-600 sm:text-xl">
      <strong>DocsBot <Link href="https://docsbot.ai/2026-plan-pricing-update-faq" target="_blank" className="text-cyan-700 underline">prices are changing</Link> on March 1, 2026.</strong> Your loyalty offer is ready. Upgrade early to unlock more features, higher limits, and 12 months of savings.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'relative bg-gray-900 shadow-2xl' : 'bg-white/60 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-bl-3xl lg:rounded-tr-none'
                  : 'sm:rounded-t-none lg:rounded-bl-none lg:rounded-tr-3xl',
              'rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10',
            )}
          >
            <h3
              id={tier.id}
              className={classNames(
                tier.featured ? 'text-cyan-400' : 'text-cyan-600',
                'text-base font-semibold leading-7 uppercase text-left',
              )}
            >
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? 'text-gray-300' : 'text-gray-500',
                  'text-2xl leading-6 line-through',
                )}
              >
                {tier.oldMonthlyPrice}
              </span>
              <span
                className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900',
                  'text-4xl font-semibold tracking-tight',
                )}
              >
                {tier.newMonthlyPrice}
              </span>
              <span
                className={classNames(
                  tier.featured ? 'text-gray-400' : 'text-gray-500',
                  'text-base font-semibold leading-6',
                )}
              >
                {tier.priceSuffix}
              </span>
            </p>
            <p
              className={classNames(
                tier.featured ? 'text-cyan-400' : 'text-cyan-600',
                'mt-2 text-sm font-semibold tracking-wide',
              )}
            >
              After {tier.creditLabel} loyalty credit
            </p>
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600',
                'mt-4 space-y-3 text-base leading-6 sm:mt-6',
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  {feature === FULL_COMPARISON_KEY ? (
                    <div className="pl-8">
                      <Link
                        href="/pricing?showLegacy=true"
                        target="_blank"
                        className={classNames(
                          tier.featured ? 'text-cyan-400' : 'text-cyan-600',
                          'underline decoration-cyan-400 underline-offset-4',
                        )}
                      >
                        Full comparison <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <CheckIcon
                        aria-hidden="true"
                        className={classNames(
                          tier.featured ? 'text-cyan-400' : 'text-cyan-700',
                          'h-6 w-5 flex-none',
                        )}
                      />
                      {feature}
                    </>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                posthog?.capture('Loyalty Offer Tier Selected', {
                  tier_id: tier.id,
                  tier_name: tier.name,
                  currency: currencyCode,
                  team_id: team?.id,
                })
                tier.onApply?.()
              }}
              disabled={isProcessing}
              className={classNames(
                tier.featured
                  ? 'bg-cyan-600 bg-animation text-white shadow-sm hover:bg-cyan-500 focus-visible:outline-cyan-500'
                  : 'text-cyan-600 ring-2 ring-inset ring-cyan-600 hover:ring-cyan-800 focus-visible:outline-cyan-600',
                'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10 disabled:cursor-not-allowed disabled:opacity-60 w-full',
              )}
            >
              {isProcessing ? 'Opening portal…' : `Apply ${tier.creditLabel} Credit`}
            </button>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-3xl text-center text-md text-gray-500">
        <p>
          Available exclusively for legacy Pro members.{' '}
          <Link href="/pricing?showLegacy=true" target="_blank" className="font-semibold text-cyan-600 underline">
            View full plan comparison
          </Link> or the <Link href="https://docsbot.ai/2026-plan-pricing-update-faq" target="_blank" className="font-semibold text-cyan-600 underline">FAQ</Link>.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          Credit must be applied by October 21, 2025, 11:59pm CST.
        </p>
      </div>
    </div>
  )
}

