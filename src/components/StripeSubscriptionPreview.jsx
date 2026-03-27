import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxOpen,
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faClock,
} from '@fortawesome/free-solid-svg-icons'

const formatCurrency = (amount, currency) => {
  if (amount === undefined || amount === null) return ''
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'usd',
  }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

/** Maps Stripe invoice/subscription status enum to `stripeStatus*` label keys. */
const stripeStatusLabel = (status, labels) => {
  if (!status || typeof status !== 'string') return ''
  const camel = status.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
  const key = `stripeStatus${camel.charAt(0).toUpperCase() + camel.slice(1)}`
  const translated = labels[key]
  if (translated) return translated
  return status.replace(/_/g, ' ')
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'open':
    case 'past_due':
    case 'past_due_unresolved':
    case 'unpaid':
    case 'incomplete':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'void':
    case 'uncollectible':
    case 'canceled':
    case 'incomplete_expired':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'draft':
    case 'trialing':
    case 'paused':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'active':
      return faCheckCircle
    case 'open':
    case 'past_due':
    case 'past_due_unresolved':
    case 'unpaid':
    case 'incomplete':
      return faExclamationCircle
    case 'void':
    case 'uncollectible':
    case 'canceled':
    case 'incomplete_expired':
      return faTimesCircle
    default:
      return faClock
  }
}

/** Sample subscription shown in dashboard/widget previews when Stripe recent billing is enabled. */
export const DEMO_STRIPE_SUBSCRIPTION_FOR_PREVIEW = {
  id: 'sub_preview_demo',
  status: 'active',
  currentPeriodStartAt: '2025-02-01T12:00:00.000Z',
  currentPeriodEndAt: '2025-03-01T12:00:00.000Z',
  currency: 'usd',
  cancelAtPeriodEnd: false,
  items: [
    {
      planName: 'Pro',
      quantity: 1,
      unitAmount: 4900,
      recurringInterval: 'month',
      recurringIntervalCount: 1,
      currency: 'usd',
    },
  ],
}

function SubscriptionItem({ subscription, labels }) {
  const startDate = formatDate(subscription.currentPeriodStartAt)
  const endDate = formatDate(subscription.currentPeriodEndAt)
  let periodText = ''
  if (startDate && endDate) {
    periodText = `${startDate} - ${endDate}`
  } else if (endDate) {
    periodText = endDate
  } else if (startDate) {
    periodText = startDate
  }

  let totalAmount = 0
  let mainInterval = null
  let mainIntervalCount = 1
  let currency = subscription.currency || 'usd'
  let hasValidAmount = false

  if (subscription.items && subscription.items.length > 0) {
    subscription.items.forEach((item) => {
      if (item.unitAmount != null) {
        totalAmount += (item.unitAmount / 100) * (item.quantity || 1)
        hasValidAmount = true
      }
      if (!mainInterval && item.recurringInterval) {
        mainInterval = item.recurringInterval
        mainIntervalCount = item.recurringIntervalCount || 1
      }
      if (item.currency) {
        currency = item.currency
      }
    })
  }

  let intervalStr = ''
  if (mainInterval) {
    if (mainIntervalCount === 1) {
      const intervalLabel =
        labels[`stripeInterval${mainInterval.charAt(0).toUpperCase() + mainInterval.slice(1)}`]
      intervalStr = `/${intervalLabel || mainInterval}`
    } else {
      const intervalLabelPlural =
        labels[`stripeInterval${mainInterval.charAt(0).toUpperCase() + mainInterval.slice(1)}s`]
      intervalStr = ` / ${mainIntervalCount} ${intervalLabelPlural || `${mainInterval}s`}`
    }
  }

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <FontAwesomeIcon icon={faBoxOpen} className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-sm font-semibold text-slate-800 sm:text-base">
              {labels.stripeSubscription}
            </span>
          </div>
          <span
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(subscription.status)}`}
          >
            <FontAwesomeIcon icon={getStatusIcon(subscription.status)} className="h-3 w-3" />
            <span>{stripeStatusLabel(subscription.status, labels)}</span>
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
          {periodText && (
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <span className="block truncate text-xs text-slate-400">{labels.stripeCurrentPeriod}</span>
              <span className="block truncate font-medium text-slate-800">{periodText}</span>
            </div>
          )}
          {subscription.trialEndAt && (
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <span className="block truncate text-xs text-slate-400">{labels.stripeTrialEnds}</span>
              <span className="block truncate font-medium text-slate-800">
                {formatDate(subscription.trialEndAt)}
                {subscription.trialDaysRemaining != null && (
                  <span className="ml-1 font-normal text-slate-500">
                    (
                    {subscription.trialDaysRemaining}{' '}
                    {subscription.trialDaysRemaining === 1
                      ? labels.stripeTrialDayLeft
                      : labels.stripeTrialDaysLeft}
                    )
                  </span>
                )}
              </span>
            </div>
          )}
          {hasValidAmount && (
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <span className="block truncate text-xs text-slate-400">{labels.stripeAmount}</span>
              <span className="block truncate font-medium text-slate-800">
                {formatCurrency(totalAmount, currency)}
                {intervalStr}
              </span>
            </div>
          )}
          {subscription.cancelAtPeriodEnd && (
            <div className="col-span-2">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <FontAwesomeIcon icon={faExclamationCircle} className="h-3 w-3 shrink-0" />
                <span className="truncate">{labels.stripeCancelsAtPeriodEnd}</span>
              </span>
            </div>
          )}
        </div>

        {subscription.items && subscription.items.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="space-y-2">
              {subscription.items.map((item, idx) => {
                const itemAmount = item.unitAmount != null ? item.unitAmount / 100 : null
                return (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-800">
                        {item.planName || labels.stripeItem}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {labels.stripeQty}: {item.quantity}
                      </span>
                    </div>
                    {itemAmount !== null && (
                      <div className="shrink-0 whitespace-nowrap font-medium text-slate-800">
                        {formatCurrency(itemAmount, item.currency || currency)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Subscription card matching widget Stripe billing styles, for dashboard/onboarding previews.
 * `labels` should be the widget label set for the selected locale (e.g. from `i18n[locale].labels`).
 */
export function StripeSubscriptionDemoCard({ labels, subscription = DEMO_STRIPE_SUBSCRIPTION_FOR_PREVIEW }) {
  const safe = labels && typeof labels === 'object' ? labels : {}
  return (
    <div className="w-full min-w-0 max-w-full flex flex-col gap-2">
      <SubscriptionItem subscription={subscription} labels={safe} />
    </div>
  )
}
