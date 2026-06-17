import clsx from 'clsx'
import { currencies } from '@/constants/pricing.constants'
import {
  ADD_ON_IDS,
  getAddOnDisplayPrice,
  getStripeAddOnsFromEnv,
} from '@/utils/billingAddOns'

const orderedAddOnIds = [
  ADD_ON_IDS.AI_CREDITS,
  ADD_ON_IDS.BOTS,
  ADD_ON_IDS.SOURCE_PAGES,
  ADD_ON_IDS.TEAM_MEMBERS,
]

const normalizeInterval = (interval) =>
  interval === 'year' || interval === 'annually' ? 'annually' : 'monthly'

const formatPrice = (amount, currencyCode) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits:
      currencyCode === 'JPY' || Number.isInteger(amount) ? 0 : 2,
  }).format(amount || 0)

export default function AddOnsPricingSummary({
  currency = 'USD',
  interval = 'monthly',
  className = '',
  dark = false,
  compact = false,
}) {
  const addOns = getStripeAddOnsFromEnv()
  const normalizedInterval = normalizeInterval(interval)
  const currencyCode = currencies[currency] ? currency : 'USD'
  const suffix = normalizedInterval === 'annually' ? '/yr' : '/mo'
  const supportingText =
    normalizedInterval === 'annually'
      ? 'Annual add-ons increase selected plan limits and are billed yearly at the 12-month equivalent.'
      : 'Monthly add-ons increase selected plan limits and renew with your monthly plan.'

  return (
    <section
      className={clsx(
        dark
          ? ''
          : 'rounded-lg border border-gray-200 bg-white p-6',
        className,
      )}
    >
      <div>
        <div
          className={clsx(
            'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
            compact && 'sm:items-center',
          )}
        >
          <div>
            <h2
              className={clsx(
                compact ? 'text-xl' : 'text-2xl',
                'font-bold',
                dark ? 'text-white' : 'text-gray-950',
              )}
            >
              Add-ons
            </h2>
            <p className={clsx('mt-1 text-sm', dark ? 'text-gray-300' : 'text-gray-600')}>
              {supportingText}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orderedAddOnIds.map((addOnId) => {
            const addOn = addOns[addOnId]
            if (!addOn) return null
            const price = getAddOnDisplayPrice(addOn, currencyCode, normalizedInterval)
            const monthlyEquivalent =
              normalizedInterval === 'annually' ? price / 12 : price
            const availabilityNote =
              addOnId === ADD_ON_IDS.TEAM_MEMBERS
                ? 'Business and Enterprise plans only.'
                : null
            const usageNote =
              addOnId === ADD_ON_IDS.AI_CREDITS
                ? 'Automatically raise your monthly AI credit limit when you run out.'
                : null

            return dark ? (
              <div
                key={addOn.id}
                className="grid rounded-[2rem] shadow-[inset_0_0_2px_1px_#ffffff4d] ring-1 ring-white/10"
              >
                <div className="grid rounded-[2rem] p-2 shadow-md shadow-black/5">
                  <div className="rounded-3xl bg-white p-4 text-gray-950 shadow-2xl ring-1 ring-black/5">
                    <h3 className="font-semibold text-gray-950">{addOn.name}</h3>
                    <p className="mt-1 min-h-10 text-sm text-gray-600">{addOn.description}</p>
                    <div className="mt-4">
                      {normalizedInterval === 'annually' ? (
                        <>
                          <div>
                            <span className="text-2xl font-bold text-gray-950">
                              {formatPrice(monthlyEquivalent, currencyCode)}
                            </span>
                            <span className="ml-1 text-sm font-medium text-gray-600">/month</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            ({formatPrice(price, currencyCode)}/yr)
                          </p>
                        </>
                      ) : (
                        <div>
                          <span className="text-2xl font-bold text-gray-950">
                            {formatPrice(price, currencyCode)}
                          </span>
                          <span className="ml-1 text-sm font-medium text-gray-600">{suffix}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Per {addOn.unitLabel}
                    </p>
                    {availabilityNote && (
                      <p className="mt-1.5 text-[11px] leading-4 text-gray-500">
                        {availabilityNote}
                      </p>
                    )}
                    {usageNote && (
                      <p className="mt-1.5 text-[11px] leading-4 text-gray-500">
                        {usageNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={addOn.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-950">{addOn.name}</h3>
                <p className="mt-1 min-h-10 text-sm text-gray-600">{addOn.description}</p>
                <div className="mt-4">
                  {normalizedInterval === 'annually' ? (
                    <>
                      <div>
                        <span className="text-2xl font-bold text-gray-950">
                          {formatPrice(monthlyEquivalent, currencyCode)}
                        </span>
                        <span className="ml-1 text-sm font-medium text-gray-600">/month</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        ({formatPrice(price, currencyCode)}/yr)
                      </p>
                    </>
                  ) : (
                    <div>
                      <span className="text-2xl font-bold text-gray-950">
                        {formatPrice(price, currencyCode)}
                      </span>
                      <span className="ml-1 text-sm font-medium text-gray-600">{suffix}</span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Per {addOn.unitLabel}
                </p>
                {availabilityNote && (
                  <p className="mt-1.5 text-[11px] leading-4 text-gray-500">
                    {availabilityNote}
                  </p>
                )}
                {usageNote && (
                  <p className="mt-1.5 text-[11px] leading-4 text-gray-500">
                    {usageNote}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
