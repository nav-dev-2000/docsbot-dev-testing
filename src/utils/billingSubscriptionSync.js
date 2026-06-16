import { stripe } from '@/utils/stripe'
import { stripePlan } from '@/utils/helpers'
import {
  collectAddOnsFromSubscription,
  getBaseSubscriptionItem,
  isAddOnPriceId,
  mergeStripeAddOns,
} from '@/utils/billingAddOns'

const staffTeamIds = new Set(['ZrbLG98bbxZ9EFqiPvyl', 'FVasEcNLTWpySb5ZNlF3'])
const publicPlanSlugs = new Set([
  'free',
  'hobby',
  'personal',
  'standard',
  'business',
  'enterprise',
])

const collectStripePriceIds = (value) => {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStripePriceIds(item))
  }
  if (typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectStripePriceIds(item))
  }
  return []
}

const collectCurrentStripePriceIds = (prices = {}) => {
  const currencyPrices = Object.entries(prices)
    .filter(([key]) => /^[A-Z]{3}$/.test(key))
    .flatMap(([, value]) => collectStripePriceIds(value))

  return [
    ...collectStripePriceIds(prices.current),
    ...currencyPrices,
  ]
}

const configuredPlanPriceIds = (configuredPlan = {}) => {
  const prices = configuredPlan.prices || {}
  const versions = Array.isArray(prices.versions) ? prices.versions : []
  return [
    ...collectCurrentStripePriceIds(prices),
    ...versions.flatMap((version) => collectStripePriceIds(version?.prices)),
    ...collectStripePriceIds(prices.old),
  ]
}

const findConfiguredPlan = (items, configuredPlans) => {
  if (!items?.length) return null

  for (const item of items) {
    const itemPlan = item.plan || item.price

    if (configuredPlans) {
      for (const planKey in configuredPlans) {
        const configuredPlan = configuredPlans[planKey]

        if (configuredPlanPriceIds(configuredPlan).includes(itemPlan.id)) {
          return itemPlan
        }
      }
    }
  }

  return items[0]?.plan ?? null
}

const getConfiguredPlans = () => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
  } catch (error) {
    console.warn('Unable to parse NEXT_PUBLIC_STRIPE_PLANS', error)
    return {}
  }
}

const normalizePlanSlug = (plan = {}) => {
  if (publicPlanSlugs.has(plan?.id)) return plan.id
  if (plan?.id?.startsWith?.('enterprise')) return 'enterprise'
  if (plan?.name?.toLowerCase?.().includes('enterprise')) return 'enterprise'
  return plan?.id || 'free'
}

export const isAddOnOnlySubscription = (subscription = {}) => {
  const items = subscription?.items?.data || []
  return (
    items.length > 0 &&
    items.every((item) => isAddOnPriceId(item?.price?.id || item?.plan?.id))
  )
}

export const resolveSubscriptionPlan = (subscription = {}, configuredPlans = getConfiguredPlans()) => {
  let plan = subscription.plan
  if (!plan && subscription.items?.data) {
    plan = findConfiguredPlan(subscription.items.data, configuredPlans)
  }
  if (!plan) {
    const baseItem = getBaseSubscriptionItem(subscription, configuredPlans)
    plan = baseItem?.plan || baseItem?.price
  }
  return plan || null
}

export const buildTeamBillingUpdate = ({ team, subscription }) => {
  if (!team?.id || !subscription?.id) return null
  if (isAddOnOnlySubscription(subscription)) return null

  const plan = resolveSubscriptionPlan(subscription)
  if (!plan?.id) return null

  const stripeAddOns = mergeStripeAddOns(
    team?.stripeAddOns,
    collectAddOnsFromSubscription(subscription),
  )
  const mergedTeam = {
    ...team,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionPlan: plan.id,
    stripeSubscriptionStatus: subscription.status,
    stripeSubscriptionCurrency: subscription.currency,
    stripeSubscriptionInterval: plan.interval,
    stripeAddOns,
  }
  const resolvedPlan = stripePlan(mergedTeam)

  const updateData = {
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status,
    stripeSubscriptionProduct: plan.product,
    stripeSubscriptionPlan: plan.id,
    stripeSubscriptionPrice: plan.amount,
    stripeSubscriptionCurrency: subscription.currency,
    stripeSubscriptionInterval: plan.interval,
    stripeSubscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
    stripeSubscriptionQuantity:
      subscription.quantity || subscription.items?.data?.[0]?.quantity,
    stripeAddOns,
    plan: normalizePlanSlug(resolvedPlan),
  }

  if (!staffTeamIds.has(team.id)) {
    updateData.questionLimit = resolvedPlan.questions
  }

  return updateData
}

export const syncTeamBillingFromStripe = async ({
  team,
  subscriptionId = team?.stripeSubscriptionId,
}) => {
  if (!subscriptionId) return null

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  })

  return buildTeamBillingUpdate({ team, subscription })
}
