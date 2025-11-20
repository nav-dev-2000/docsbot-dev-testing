import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useEffect, useMemo, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { currencies, pricingTiers } from '@/constants/pricing.constants'
import { RadioGroup } from '@headlessui/react'

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
    'Deep Research Agent',
    'MCP server',
    'Up to 10x higher bot, page, message limits',
    'Conversation topic reports',
    'Conversation sentiment analysis',
    'AI question reports',
    'Rate limiting',
    'Priority support',
    'SOC 2 Type II security',
    'One-on-one AI strategy call with our CEO',
  ],
}

const currencyLocales = {
  USD: 'en-US',
  JPY: 'ja-JP',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AUD: 'en-AU',
}

export const LOYALTY_SALE_DEADLINE = '2025-12-02T15:00:00.000Z'
const CYBER_MONDAY_LABEL_SWITCH_UTC = Date.UTC(2025, 10, 29, 0, 0, 0) // 2025-11-29T00:00:00Z

export const getLoyaltyEventLabel = () =>
  Date.now() >= CYBER_MONDAY_LABEL_SWITCH_UTC ? 'Cyber Monday' : 'Black Friday'

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

export function CountdownTicker({ deadline, className }) {
  const defaultClassName = 'text-md font-bold text-cyan-600'
  const effectiveClassName = className || defaultClassName

  if (!deadline || Number.isNaN(deadline.getTime())) {
    return <span className={effectiveClassName}>Ends soon</span>
  }

  return (
    <Countdown
      date={deadline}
      renderer={({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
          return <span className={effectiveClassName}>Offer ended</span>
        }

        const pad = (value) => value.toString().padStart(2, '0')

        return (
          <span className={effectiveClassName}>
            {pad(days)}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
          </span>
        )
      }}
    />
  )
}

export default function SaleLoyalty({
  team,
  onApplyBusiness,
  isProcessing = false,
  expiresAt,
}) {
  const posthog = usePostHog()
  const defaultCurrency = useMemo(() => {
    const code = team?.stripeSubscriptionCurrency?.toUpperCase()
    return code && currencies[code] ? code : 'USD'
  }, [team?.stripeSubscriptionCurrency])
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency)

  useEffect(() => {
    setCurrencyCode(defaultCurrency)
  }, [defaultCurrency])

  const businessAnnualSavings = BUSINESS_ANNUAL_SAVINGS[currencyCode] ?? BUSINESS_ANNUAL_SAVINGS.USD

  const fallbackDate = useMemo(() => new Date(LOYALTY_SALE_DEADLINE), [])
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

  const formattedBusinessSavings = useMemo(
    () => formatCurrency(businessAnnualSavings, currencyCode),
    [currencyCode, businessAnnualSavings],
  )

  const businessMonthlyPrice = useMemo(
    () => getTierMonthlyPrice('business', currencyCode),
    [currencyCode],
  )

  const discountedBusinessMonthly = useMemo(
    () => getDiscountedMonthlyPrice('business', currencyCode),
    [currencyCode],
  )

  const loyaltyEventLabel = useMemo(() => getLoyaltyEventLabel(), [])
  const isSaleExpired = countdownDate && countdownDate.getTime() <= Date.now()

  const tiers = useMemo(() => [
    {
      name: 'Upgrade to Business',
      id: 'tier-business',
      oldMonthlyPrice: formatCurrency(businessMonthlyPrice, currencyCode),
      newMonthlyPrice: formatCurrency(discountedBusinessMonthly, currencyCode),
      priceSuffix: '/month',
      creditLabel: formattedBusinessSavings,
      description: 'Unlock Deep Research + MCP for external support teams',
      features: [...featuresMap.business, FULL_COMPARISON_KEY],
      featured: true,
      onApply: onApplyBusiness,
    },
  ], [
    businessMonthlyPrice,
    currencyCode,
    discountedBusinessMonthly,
    formattedBusinessSavings,
    onApplyBusiness,
  ])

  if (isSaleExpired) {
    return null
  }

  const isSingleTier = tiers.length === 1

  return (
    <div className="relative isolate bg-white px-6 py-6 sm:py-12 lg:px-8">
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
        <strong>The DocsBot {loyaltyEventLabel} loyalty offer is live.</strong>{' '}
        Upgrade to Business with an unparalleled offer to unlock more features, higher limits, and 12 months of savings.
      </p>
      <div className="mx-auto mt-8 max-w-4xl sm:mt-10">
        <div className="flex justify-center">
          <RadioGroup
            value={currencyCode}
            onChange={setCurrencyCode}
            className="grid grid-cols-5 gap-x-1 rounded-md bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">Currency</RadioGroup.Label>
            {Object.keys(currencies).map((option) => (
              <RadioGroup.Option
                key={option}
                value={option}
                className={({ checked }) =>
                  classNames(
                    checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-md px-2.5 py-1'
                  )
                }
              >
                <span>
                  {currencies[option].symbol} {currencies[option].label}
                </span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
      </div>
      <div
        className={classNames(
          'mx-auto mt-6 sm:mt-10',
          isSingleTier
            ? 'max-w-4xl'
            : 'grid max-w-lg grid-cols-1 items-center gap-y-6 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2',
        )}
      >
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              'w-full',
              tier.featured ? 'relative bg-white shadow-2xl' : 'bg-white/60 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-bl-3xl lg:rounded-tr-none'
                  : 'sm:rounded-t-none lg:rounded-bl-none lg:rounded-tr-3xl',
              'rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10',
            )}
          >
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3
                id={tier.id}
                className={classNames(
                  tier.featured ? 'text-cyan-600' : 'text-cyan-600',
                  'text-base font-semibold leading-7 uppercase text-left',
                )}
              >
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-x-2 text-left sm:justify-end sm:text-right">
                <span
                  className={classNames(
                    tier.featured ? 'text-gray-500' : 'text-gray-500',
                    'text-2xl leading-6 line-through',
                  )}
                >
                  {tier.oldMonthlyPrice}
                </span>
                <span
                  className={classNames(
                    tier.featured ? 'text-gray-900' : 'text-gray-900',
                    'text-4xl font-semibold tracking-tight',
                  )}
                >
                  {tier.newMonthlyPrice}
                </span>
                <span
                  className={classNames(
                    tier.featured ? 'text-gray-500' : 'text-gray-500',
                    'text-base font-semibold leading-6',
                  )}
                >
                  {tier.priceSuffix}
                </span>
              </div>
            </div>
            <p
              className={classNames(
                tier.featured ? 'text-cyan-600' : 'text-cyan-600',
                'mt-2 text-sm font-semibold tracking-wide text-right',
              )}
            >
              After {tier.creditLabel} loyalty credit
            </p>
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-600' : 'text-gray-600',
                'mt-4 grid grid-cols-1 gap-3 text-base leading-6 sm:mt-6 sm:grid-cols-2',
              )}
            >
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className={classNames(
                    'flex gap-x-3',
                    feature === FULL_COMPARISON_KEY && 'col-span-1 sm:col-span-2',
                  )}
                >
                  {feature === FULL_COMPARISON_KEY ? (
                    <div className="flex w-full justify-end pr-2 sm:pr-4">
                      <Link
                        href="/pricing?showLegacy=true"
                        target="_blank"
                        className={classNames(
                          tier.featured ? 'text-cyan-600' : 'text-cyan-600',
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
                          tier.featured ? 'text-cyan-700' : 'text-cyan-700',
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
          Available exclusively for Legacy Pro and Standard members.{' '}
          <Link href="/pricing" target="_blank" className="font-semibold text-cyan-600 underline">
            View full plan comparison
          </Link>.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          Credit must be applied by December 2, 2025, 9:00am CST.
        </p>
      </div>
    </div>
  )
}

