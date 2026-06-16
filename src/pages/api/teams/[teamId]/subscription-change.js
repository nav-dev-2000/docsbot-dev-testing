import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getInvitesFromTeam, getBots, getTeamSourceTypeIds } from '@/lib/dbQueries'
import { assertSubscriptionPlanChangeAllowed } from '@/utils/planDowngrade'
import { canUserManageBilling } from '@/utils/function.utils'
import { stripe } from '@/utils/stripe'
import {
  findAddOnByPriceId,
  getAddOnPriceId,
  getBaseSubscriptionItem,
  getSubscriptionItemPriceId,
} from '@/utils/billingAddOns'
import { getSubscriptionPaymentAction } from '@/utils/stripeSubscriptionPayment'
import { buildInvoicePreview } from '@/utils/billingPreview'

const formatMoney = (amount = 0, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
    maximumFractionDigits: String(currency).toLowerCase() === 'jpy' ? 0 : 2,
  }).format((amount || 0) / (String(currency).toLowerCase() === 'jpy' ? 1 : 100))

const normalizeFrequency = (frequency, fallbackInterval) => {
  if (frequency === 'annually' || frequency === 'year') return 'annually'
  if (frequency === 'monthly' || frequency === 'month') return 'monthly'
  return fallbackInterval === 'year' ? 'annually' : 'monthly'
}

const resolvePriceId = (plans, tier, frequency, currency) => {
  const plan = plans?.[tier]
  if (!plan?.prices) return null
  const normalizedCurrency = String(currency || '').toUpperCase()
  if (normalizedCurrency && plan.prices[normalizedCurrency]?.[frequency]) {
    return plan.prices[normalizedCurrency][frequency]
  }
  return plan.prices?.current?.[frequency] || null
}

const getSubscriptionItems = (subscription = {}) =>
  Array.isArray(subscription?.items?.data) ? subscription.items.data : []

const buildSubscriptionChange = async ({ team, tier, frequency, currency }) => {
  const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
  const targetFrequency = normalizeFrequency(
    frequency,
    team?.stripeSubscriptionInterval,
  )
  const targetPriceId = resolvePriceId(plans, tier, targetFrequency, currency)
  if (!targetPriceId) throw new Error('Unable to determine the selected plan price.')

  const planLimits = plans[tier]
  if (!planLimits) throw new Error('Please select a valid plan.')

  const bots = await getBots(team)
  const teamInvites = await getInvitesFromTeam(team.id)
  const teamSourceTypes = await getTeamSourceTypeIds(team.id)

  assertSubscriptionPlanChangeAllowed({
    team,
    bots,
    teamInvites,
    teamSourceTypes,
    targetPlanId: tier,
  })

  const subscription = await stripe.subscriptions.retrieve(
    team.stripeSubscriptionId,
    { expand: ['items.data.price'] },
  )
  const baseItem = getBaseSubscriptionItem(subscription, plans)
  if (!baseItem) throw new Error('Unable to locate the base subscription item.')

  const stripeCurrency = String(
    currency || subscription.currency || team.stripeSubscriptionCurrency || 'usd',
  ).toUpperCase()
  const items = [
    {
      id: baseItem.id,
      price: targetPriceId,
      quantity: baseItem.quantity || 1,
    },
  ]

  for (const item of getSubscriptionItems(subscription)) {
    if (item.id === baseItem.id) continue
    const addOn = findAddOnByPriceId(getSubscriptionItemPriceId(item))
    if (!addOn) continue

    const desiredPriceId = getAddOnPriceId(
      addOn.id,
      stripeCurrency,
      targetFrequency,
    )
    if (!desiredPriceId) {
      throw new Error(`${addOn.name} is not configured for this billing interval.`)
    }
    items.push({
      id: item.id,
      price: desiredPriceId,
      quantity: item.quantity || 1,
    })
  }

  return {
    subscription,
    items,
    targetPriceId,
    targetFrequency,
  }
}

const previewSubscriptionChange = async ({ team, tier, frequency, currency }) => {
  const change = await buildSubscriptionChange({ team, tier, frequency, currency })
  const prorationDate = Math.floor(Date.now() / 1000)
  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: team.stripeCustomerId,
    subscription: change.subscription.id,
    subscription_items: change.items,
    subscription_proration_behavior: 'always_invoice',
    subscription_proration_date: prorationDate,
  })
  const invoiceCurrency = invoice.currency || change.subscription.currency || 'usd'
  const preview = buildInvoicePreview({
    invoice,
    currency: invoiceCurrency,
    formatMoney,
  })

  return {
    tier,
    frequency: change.targetFrequency,
    prorationDate,
    currency: invoiceCurrency,
    ...preview,
  }
}

const confirmSubscriptionChange = async ({
  team,
  tier,
  frequency,
  currency,
  prorationDate,
}) => {
  const change = await buildSubscriptionChange({ team, tier, frequency, currency })
  return stripe.subscriptions.update(change.subscription.id, {
    items: change.items,
    payment_behavior: 'pending_if_incomplete',
    proration_behavior: 'always_invoice',
    ...(prorationDate ? { proration_date: prorationDate } : {}),
    expand: ['items.data.price', 'latest_invoice.payment_intent'],
  })
}

export default async function handler(req, res) {
  configureFirebaseApp()

  let check
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { team, userId } = check
  if (!canUserManageBilling(team, userId)) {
    return res.status(403).json({
      message: 'Unauthorized action; please contact your team owner.',
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Invalid HTTP method' })
  }

  if (!team?.stripeCustomerId || !team?.stripeSubscriptionId) {
    return res.status(400).json({ message: 'No active subscription found.' })
  }

  const { action, tier, frequency, currency } = req.body || {}
  if (!tier) {
    return res.status(400).json({ message: 'Please select a valid plan.' })
  }

  try {
    if (action === 'preview') {
      const preview = await previewSubscriptionChange({
        team,
        tier,
        frequency,
        currency,
      })
      return res.status(200).json({ preview })
    }

    if (action === 'confirm') {
      const subscription = await confirmSubscriptionChange({
        team,
        tier,
        frequency,
        currency,
        prorationDate: Number(req.body?.prorationDate) || null,
      })
      const paymentAction = getSubscriptionPaymentAction(subscription)
      if (paymentAction?.requiresPaymentMethod) {
        return res.status(402).json({
          message:
            'Your payment method could not be charged. Please update your payment method and try again.',
          paymentAction,
        })
      }
      if (paymentAction?.requiresAction) {
        return res.status(200).json({ paymentAction })
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ message: 'Invalid subscription change action.' })
  } catch (error) {
    console.log(error)
    return res.status(error?.statusCode || 500).json({
      message: error?.message || 'Unable to update subscription.',
    })
  }
}
