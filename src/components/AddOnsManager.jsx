import { useEffect, useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import Tooltip from '@/components/Tooltip'
import {
  ADD_ON_IDS,
  getAddOnDisplayPrice,
  getEffectiveAddOns,
  getStripeAddOnsFromEnv,
  isAddOnAvailableForPlan,
} from '@/utils/billingAddOns'
import { stripePlan } from '@/utils/helpers'
import { completeStripePaymentAction } from '@/utils/stripePaymentActionClient'

const RETAINED_CREDIT_TOOLTIP =
  'Unused prorated credit will stay on your account and be applied automatically to future invoices.'

const orderedAddOnIds = [
  ADD_ON_IDS.AI_CREDITS,
  ADD_ON_IDS.BOTS,
  ADD_ON_IDS.SOURCE_PAGES,
  ADD_ON_IDS.TEAM_MEMBERS,
]

export default function AddOnsManager({
  team,
  className = '',
  title = 'Add-ons',
  description = 'Increase selected monthly plan limits without changing plans. Add-ons renew with your billing cycle, and billing changes are prorated.',
  headerCentered = false,
  focusAddOnId = null,
  teamInvites = [],
  onTeamBillingUpdate = null,
  onError = null,
  onSuccess = null,
}) {
  const [openingAddOns, setOpeningAddOns] = useState(false)
  const [addOnQuantities, setAddOnQuantities] = useState({})
  const [addOnPreview, setAddOnPreview] = useState(null)
  const teamPlan = stripePlan(team)
  const addOnCatalog = getStripeAddOnsFromEnv()
  const activeAddOns = getEffectiveAddOns(team)
  const currencyCode = team?.stripeSubscriptionCurrency?.toUpperCase?.() || 'USD'
  const billingInterval =
    team?.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'

  useEffect(() => {
    setAddOnQuantities({
      [ADD_ON_IDS.AI_CREDITS]: activeAddOns.aiCredits?.quantity || 0,
      [ADD_ON_IDS.BOTS]: activeAddOns.bots?.quantity || 0,
      [ADD_ON_IDS.SOURCE_PAGES]: activeAddOns.sourcePages?.quantity || 0,
      [ADD_ON_IDS.TEAM_MEMBERS]: activeAddOns.teamMembers?.quantity || 0,
    })
  }, [
    activeAddOns.aiCredits?.quantity,
    activeAddOns.bots?.quantity,
    activeAddOns.sourcePages?.quantity,
    activeAddOns.teamMembers?.quantity,
  ])

  const formatPrice = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits:
        currencyCode === 'JPY' || Number.isInteger(amount) ? 0 : 2,
    }).format(amount || 0)

  const getCurrentUsageForAddOn = (addOn) => {
    if (addOn?.limitKey === 'questions') return Number(team?.questionCount || 0)
    if (addOn?.limitKey === 'bots') return Number(team?.botCount || 0)
    if (addOn?.limitKey === 'pages') return Number(team?.pageCount || 0)
    if (addOn?.limitKey === 'teamMembers') {
      return Object.keys(team?.roles || {}).length + teamInvites.length
    }
    return 0
  }

  const getBaseLimitForAddOn = (addOn, activeQuantity = 0) =>
    Math.max(
      0,
      Number(teamPlan?.[addOn?.limitKey] || 0) -
        Number(activeQuantity || 0) * Number(addOn?.unit || 0),
    )

  const getMinimumAddOnQuantity = (addOn, activeQuantity = 0) => {
    if (!addOn?.limitKey || !addOn?.unit) return 0
    const currentUsage = getCurrentUsageForAddOn(addOn)
    const baseLimit = getBaseLimitForAddOn(addOn, activeQuantity)
    return Math.max(0, Math.ceil((currentUsage - baseLimit) / addOn.unit))
  }

  const getAddOnUnitName = (addOn, amount = 0) => {
    if (addOn?.limitKey === 'questions') return 'AI credits'
    if (addOn?.limitKey === 'pages') return 'pages'
    if (addOn?.limitKey === 'bots') return amount === 1 ? 'bot' : 'bots'
    if (addOn?.limitKey === 'teamMembers') {
      return amount === 1 ? 'team user' : 'team users'
    }
    return addOn?.unitLabel || 'units'
  }

  const formatAddOnCapacity = (addOn, quantity = 0) => {
    const amount = Number(quantity || 0) * Number(addOn?.unit || 1)
    return `${amount.toLocaleString()} ${getAddOnUnitName(addOn, amount)}`
  }

  const formatAddOnLimitIncrease = (addOn, quantity = 0) => {
    const capacity = formatAddOnCapacity(addOn, quantity)
    return addOn?.limitKey === 'questions'
      ? `${capacity} monthly limit increase`
      : capacity
  }

  const formatAddOnDropdownOption = (
    addOn,
    blockQuantity,
    { priceLabel = null, isCurrent = false } = {},
  ) => {
    if (blockQuantity === 0) return 'None'
    const capacity =
      addOn?.limitKey === 'questions'
        ? `+${formatAddOnLimitIncrease(addOn, blockQuantity)}`
        : formatAddOnCapacity(addOn, blockQuantity)
    const suffix = [
      priceLabel ? `- ${priceLabel}` : null,
      isCurrent ? '(current)' : null,
    ]
      .filter(Boolean)
      .join(' ')
    return suffix ? `${capacity} ${suffix}` : capacity
  }

  const getAddOnBlockOptionLimit = (activeQuantity = 0, minimumQuantity = 0) =>
    Math.min(50, Math.max(10, activeQuantity + 10, minimumQuantity + 5))

  const getAddOnRecurringLabel = (price, interval = 'monthly') =>
    interval === 'annually' ? `${formatPrice(price)}/year` : `${formatPrice(price)}/month`

  const getAddOnById = (addOnId) => addOnCatalog?.[addOnId] || null
  const addOnIsAvailableForPlan = (addOn) =>
    isAddOnAvailableForPlan(addOn, teamPlan)

  const updateAddOnBlockQuantity = (addOnId, value, minQuantity = 0) => {
    const nextQuantity = Math.max(minQuantity, Number(value) || 0)
    setAddOnQuantities((current) => ({
      ...current,
      [addOnId]: nextQuantity,
    }))
  }

  async function previewAddOnQuantity(addOnId, quantity) {
    setOpeningAddOns(true)
    onError?.(null)
    try {
      const response = await fetch(`/api/teams/${team.id}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'previewQuantity', addOnId, quantity }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to preview add-on change.')
      }
      setAddOnPreview({ addOnId, quantity, ...data.preview })
    } catch (error) {
      onError?.(error.message)
    } finally {
      setOpeningAddOns(false)
    }
  }

  async function confirmAddOnQuantity() {
    if (!addOnPreview) return
    setOpeningAddOns(true)
    onError?.(null)
    try {
      const response = await fetch(`/api/teams/${team.id}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmQuantity',
          addOnId: addOnPreview.addOnId,
          quantity: addOnPreview.quantity,
          prorationDate: addOnPreview.prorationDate,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update add-ons.')
      }
      if (data.paymentAction?.requiresAction) {
        await completeStripePaymentAction(data.paymentAction)
      }
      onTeamBillingUpdate?.({
        stripeAddOns: data.stripeAddOns,
        questionLimit: data.questionLimit,
      })
      setAddOnPreview(null)
      onSuccess?.('Add-ons updated.')
    } catch (error) {
      onError?.(error.message)
    } finally {
      setOpeningAddOns(false)
    }
  }

  const addOnIds = focusAddOnId
    ? [focusAddOnId, ...orderedAddOnIds.filter((id) => id !== focusAddOnId)]
    : orderedAddOnIds

  return (
    <div className={className}>
      {addOnPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-950">
              Confirm add-on change
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Review the prorated billing impact before updating your subscription.
            </p>
            <div className="mt-5 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                  New add-on limit increase
                </span>
                <span className="font-semibold text-gray-950">
                  {formatAddOnLimitIncrease(
                    getAddOnById(addOnPreview.addOnId),
                    addOnPreview.nextQuantity,
                  )}
                </span>
              </div>
              {addOnPreview.lines?.length > 0 && (
                <div className="max-h-56 overflow-y-auto border-b border-gray-200 px-4 py-3">
                  <ul className="space-y-3">
                    {addOnPreview.lines.map((line) => (
                      <li
                        key={line.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-gray-600">{line.description}</div>
                          {line.periodLabel && (
                            <div className="mt-0.5 text-xs text-gray-400">
                              {line.periodLabel}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 font-medium text-gray-900">
                          {line.formattedAmount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {addOnPreview.accountCreditApplied > 0 && (
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm">
                  <span className="text-gray-600">Account credit applied</span>
                  <span className="font-medium text-gray-900">
                    -{addOnPreview.formattedAccountCreditApplied}
                  </span>
                </div>
              )}
              {addOnPreview.creditAmount > 0 && (
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-600">
                    Credit kept for future invoices
                    <Tooltip content={RETAINED_CREDIT_TOOLTIP}>
                      <span
                        className="inline-flex cursor-help text-gray-400"
                        aria-label={RETAINED_CREDIT_TOOLTIP}
                      >
                        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Tooltip>
                  </span>
                  <span className="shrink-0 font-medium text-gray-900">
                    {addOnPreview.formattedCreditAmount}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Amount due now</span>
                <span className="font-semibold text-gray-950">
                  {addOnPreview.formattedAmountDue}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddOnPreview(null)}
                disabled={openingAddOns}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-25"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddOnQuantity}
                disabled={openingAddOns}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-25"
              >
                {openingAddOns ? <LoadingSpinner /> : 'Confirm update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={headerCentered ? 'text-center' : ''}>
        <h3 className="text-2xl font-bold">{title}</h3>
        {description && (
          <p className="text-md mt-2 w-full text-gray-800">{description}</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {addOnIds.map((actionId) => {
          const addOn = addOnCatalog[actionId]
          if (!addOn) return null
          const quantity = activeAddOns[actionId]?.quantity || 0
          const availableForPlan = addOnIsAvailableForPlan(addOn)
          const minimumQuantity = getMinimumAddOnQuantity(addOn, quantity)
          const selectedQuantity = addOnQuantities[actionId] ?? quantity
          const belowMinimum = selectedQuantity < minimumQuantity
          const unchanged = selectedQuantity === quantity
          const addOnPrice = getAddOnDisplayPrice(addOn, currencyCode, billingInterval)
          const monthlyEquivalent =
            billingInterval === 'annually' ? addOnPrice / 12 : addOnPrice
          const blockOptionLimit = getAddOnBlockOptionLimit(quantity, minimumQuantity)
          const recurringIntervalLabel = billingInterval === 'annually' ? 'year' : 'month'
          return (
            <div key={addOn.id} className="rounded-lg border border-gray-200 p-4">
              <div>
                <h4 className="font-semibold text-gray-950">{addOn.name}</h4>
                <p className="mt-1 text-sm text-gray-600">{addOn.description}</p>
              </div>
              <p className="mt-4 text-sm text-gray-700">
                <span className="text-2xl font-bold text-gray-950">
                  {formatPrice(monthlyEquivalent)}
                </span>
                <span className="ml-1 text-sm text-gray-600">
                  /month per {addOn.unitLabel}
                </span>
              </p>
              {billingInterval === 'annually' && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatPrice(addOnPrice)} billed annually.
                </p>
              )}
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {addOn?.limitKey === 'questions'
                    ? 'Current monthly limit increase: '
                    : 'Current subscription: '}
                  <span className="font-medium text-gray-900">
                    {quantity > 0
                      ? `${formatAddOnLimitIncrease(addOn, quantity)} (${formatPrice(addOnPrice * quantity)}/${recurringIntervalLabel})`
                      : 'None'}
                  </span>
                </p>
                <label htmlFor={`addon-${actionId}-quantity`} className="sr-only">
                  Adjust add-on
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    id={`addon-${actionId}-quantity`}
                    value={selectedQuantity}
                    disabled={!availableForPlan}
                    onChange={(event) =>
                      updateAddOnBlockQuantity(
                        actionId,
                        event.target.value,
                        minimumQuantity,
                      )
                    }
                    className="block min-w-0 flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                  >
                    {Array.from({ length: blockOptionLimit + 1 }, (_, blockQuantity) => (
                      <option
                        key={blockQuantity}
                        value={blockQuantity}
                        disabled={blockQuantity < minimumQuantity}
                      >
                        {formatAddOnDropdownOption(addOn, blockQuantity, {
                          priceLabel:
                            blockQuantity > 0
                              ? getAddOnRecurringLabel(
                                  addOnPrice * blockQuantity,
                                  billingInterval,
                                )
                              : null,
                          isCurrent: blockQuantity === quantity,
                        })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      previewAddOnQuantity(
                        actionId,
                        addOnQuantities[actionId] ?? quantity,
                      )
                    }
                    disabled={
                      openingAddOns ||
                      belowMinimum ||
                      unchanged ||
                      !availableForPlan
                    }
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    Change
                  </button>
                </div>
                {!availableForPlan && (
                  <p className="mt-2 text-xs text-gray-500">
                    Extra team users are available on Business and Enterprise
                    plans.
                  </p>
                )}
                {minimumQuantity > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {addOn?.limitKey === 'questions'
                      ? `You have already used enough AI credits this month that your account needs at least a ${formatAddOnCapacity(addOn, minimumQuantity)} add-on limit increase. You can reduce it after usage resets at the start of the next calendar month.`
                      : `Your current usage needs at least ${formatAddOnCapacity(addOn, minimumQuantity)} from add-ons. You can't reduce below this until usage drops.`}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
