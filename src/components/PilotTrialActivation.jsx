import { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import { auth } from '@/config/firebase-ui.config'
import LoadingSpinner from '@/components/LoadingSpinner'
import { frequencies, currencies, pricingTiers } from '@/constants/pricing.constants'
import {
  formatStripeTableFeatureLabel,
  getDifferentiatingFeatures,
  getVisibleStripePricingTiers,
} from '@/utils/pricingStripeTableFeatures'

const visibleStripeTiers = getVisibleStripePricingTiers(pricingTiers)
const businessTierIndex = visibleStripeTiers.findIndex((t) => t.id === 'business')
const businessStripeFeatureTuples =
  businessTierIndex >= 0
    ? getDifferentiatingFeatures(
        visibleStripeTiers[businessTierIndex],
        businessTierIndex,
        visibleStripeTiers,
      )
    : []

const businessTier = visibleStripeTiers[businessTierIndex] || null

/**
 * Shared pilot trial activation UI with currency picker and monthly/annual switch.
 * Defaults to annual view. Used on /app/activate and /app/account when docsbot_demo_trial cookie is set.
 */
export default function PilotTrialActivation({
  team,
  canManageBilling,
  setErrorText,
  compact = false,
}) {
  const [user] = useAuthState(auth)
  const [opening, setOpening] = useState(false)
  const [frequency, setFrequency] = useState(
    () => frequencies.find((f) => f.value === 'annually') || frequencies[0]
  )
  const [currency, setCurrency] = useState(
    team?.stripeSubscriptionCurrency?.toUpperCase?.() || 'USD'
  )

  const startTrial = async () => {
    setErrorText?.(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: 'business',
        frequency: frequency.value,
        currency,
        email: user?.email,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      window.location.href = data.url
      return
    }

    try {
      const data = await response.json()
      setErrorText?.(data.message || 'Something went wrong, please try again.')
    } catch (err) {
      setErrorText?.('Error starting trial. Please try again.')
    }
    setOpening(false)
  }

  const annualTotal =
    businessTier?.price?.[currency]?.[frequency.value] ??
    businessTier?.price?.USD?.annually
  const monthlyEquivalent = annualTotal / 12

  return (
    <div
      className={clsx(
        'rounded-2xl border border-cyan-100 bg-white shadow',
        compact ? 'p-6' : 'p-10'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
          <SparklesIcon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-600">
            Pilot
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Activate Pilot</h2>
          <p className="mt-1 text-lg font-medium text-gray-700">
            Unlock your 14-day business plan pilot.
          </p>
        </div>
      </div>

      <p className="mt-4 text-lg text-gray-700">
        Your invite is ready. Start the Business plan pilot to explore the full
        analytics suite, premium integrations, and enterprise-grade controls.
      </p>

      {/* Frequency toggle + "two months free" + Currency picker side by side */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <RadioGroup
            value={frequency}
            onChange={setFrequency}
            className="grid grid-cols-2 gap-x-1 rounded-lg bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">
              Payment frequency
            </RadioGroup.Label>
            {frequencies.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option}
                className={({ checked }) =>
                  clsx(
                    checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-lg px-8 py-2'
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
          <p className="text-sm text-gray-600">
            Two months free with annual plans!
          </p>
        </div>
        <RadioGroup
          value={currency}
          onChange={setCurrency}
          className="grid grid-cols-5 gap-x-1 rounded-md bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
        >
          <RadioGroup.Label className="sr-only">Currency</RadioGroup.Label>
          {Object.keys(currencies).map((option) => (
            <RadioGroup.Option
              key={option}
              value={option}
              className={({ checked }) =>
                clsx(
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

      {/* Price display */}
      {businessTier && (
        <div className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-center">
          {frequency.value === 'monthly' ? (
            <p className="text-lg font-semibold text-gray-800">
              <span className="text-cyan-600">14 days free</span>
              {', then '}
              {currencies[currency].symbol}
              {businessTier.price[currency]?.monthly?.toFixed(0) ?? '499'}
              <span className="text-gray-600">/month</span>
            </p>
          ) : (
            <p className="text-lg font-semibold text-gray-800">
              <span className="text-cyan-600">14 days free</span>
              {', then '}
              {currencies[currency].symbol}
              {monthlyEquivalent.toFixed(0)}
              <span className="text-gray-600">/month</span>
              <span className="ml-1 text-sm text-gray-500">
                ({currencies[currency].symbol}
                {annualTotal.toFixed(0)}/year)
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {businessStripeFeatureTuples.map(([key, value]) => {
          const label = formatStripeTableFeatureLabel(key, value)
          if (!label) return null
          return (
            <div key={key} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                <CheckIcon className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium text-gray-800">{label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={startTrial}
          disabled={opening || !canManageBilling}
        >
          {opening ? (
            <LoadingSpinner />
          ) : (
            <span>Start My Free Trial</span>
          )}
        </button>
        <p className="text-sm text-gray-500">
          Downgrade or cancel anytime during the 14-day trial.
        </p>
      </div>
    </div>
  )
}
