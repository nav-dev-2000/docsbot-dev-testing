import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getTeam } from '@/lib/dbQueries'
import { stripe } from '@/utils/stripe'
import { canUserManageBilling } from '@/utils/function.utils'
import { stripePlan } from '@/utils/helpers'
import {
  ADD_ON_IDS,
  collectAddOnsFromSubscription,
  findSubscriptionAddOnItem,
  getAddOnConfig,
  getAddOnPriceId,
  getEffectiveAddOns,
  getTeamAddOnsForRequestedQuantity,
  isAutoIncreaseAiCreditsEnabled,
  isAddOnAvailableForPlan,
  mergeStripeAddOns,
  normalizeAddOnQuantity,
} from '@/utils/billingAddOns'
import {
  getAccountCreditApplied,
  getPreviewLines,
  getPreviewTotals,
} from '@/utils/billingPreview'
import { getSubscriptionPaymentAction } from '@/utils/stripeSubscriptionPayment'

const ACTIVE_BASE_STATUSES = new Set(['active', 'trialing', 'past_due'])
const AUTO_INCREASE_LOCK_TTL_MS = 5 * 60 * 1000

const isInternalRequest = (req) => {
  const configuredKey = process.env.INTERNAL_API_KEY
  if (!configuredKey) return false
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${configuredKey}`
}

const getAuthenticatedTeam = async (req, res) => {
  if (isInternalRequest(req)) {
    const team = await getTeam(req.query.teamId)
    if (!team) throw new Error('Team not found.')
    return { userId: null, team, internal: true }
  }

  const check = await userTeamCheck(req, res)
  if (!canUserManageBilling(check.team, check.userId)) {
    const error = new Error('Unauthorized action; please contact your team owner.')
    error.statusCode = 403
    throw error
  }
  return { ...check, internal: false }
}

const ensurePaidBaseSubscription = (team) => {
  if (
    !team?.stripeCustomerId ||
    !team?.stripeSubscriptionId ||
    !ACTIVE_BASE_STATUSES.has(team?.stripeSubscriptionStatus)
  ) {
    throw new Error('An active paid subscription is required to manage add-ons.')
  }
  if (team?.stripeSubscriptionCancelAtPeriodEnd) {
    const error = new Error(
      'Add-ons cannot be changed while your subscription is scheduled to cancel.',
    )
    error.statusCode = 400
    throw error
  }
}

const getTeamCurrency = (team) =>
  String(team?.stripeSubscriptionCurrency || 'usd').toUpperCase()

const getTeamBillingInterval = (team) =>
  team?.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'

const ensureAddOnIsAvailableForPlan = (team, addOn) => {
  if (!isAddOnAvailableForPlan(addOn, stripePlan(team))) {
    const error = new Error(
      `${addOn.name} is only available on Business and Enterprise plans.`,
    )
    error.statusCode = 400
    throw error
  }
}

const getUsageForLimitKey = (team, limitKey) => {
  if (limitKey === 'questions') return Number(team?.questionCount || 0)
  if (limitKey === 'bots') return Number(team?.botCount || 0)
  if (limitKey === 'pages') return Number(team?.pageCount || 0)
  return 0
}

const getTeamMemberUsage = async (team) => {
  const inviteSnapshot = await getFirestore()
    .collection('invites')
    .where('teamId', '==', team.id)
    .get()
  return Object.keys(team?.roles || {}).length + inviteSnapshot.size
}

const ensureAddOnQuantitySupportsCurrentUsage = async ({
  team,
  addOnId,
  quantity,
}) => {
  const addOn = getAddOnConfig(addOnId)
  if (!addOn?.limitKey) return

  const stripeAddOns = mergeStripeAddOns(team?.stripeAddOns, {})
  stripeAddOns[addOnId] = {
    ...(stripeAddOns[addOnId] || {}),
    quantity: normalizeAddOnQuantity(quantity),
    subscriptionId: team.stripeSubscriptionId,
  }

  const effectivePlan = stripePlan({ ...team, stripeAddOns })
  const currentUsage =
    addOn.limitKey === 'teamMembers'
      ? await getTeamMemberUsage(team)
      : getUsageForLimitKey(team, addOn.limitKey)
  const nextLimit = Number(effectivePlan?.[addOn.limitKey] || 0)
  if (currentUsage > nextLimit) {
    const resetNote =
      addOn.limitKey === 'questions'
        ? ' AI credit usage resets at the start of each calendar month.'
        : ''
    const error = new Error(
      `Current ${addOn.name.toLowerCase()} usage is ${currentUsage.toLocaleString()}, so this add-on can only be reduced to a quantity that keeps at least ${currentUsage.toLocaleString()} available.${resetNote}`,
    )
    error.statusCode = 400
    throw error
  }
}

const updateTeamAddOns = async ({ team, subscription }) => {
  const firestore = getFirestore()
  const incoming = collectAddOnsFromSubscription(subscription)
  const stripeAddOns = mergeStripeAddOns(team?.stripeAddOns, incoming)
  for (const [addOnId, addOn] of Object.entries(stripeAddOns)) {
    if (addOn.subscriptionId === subscription.id && !incoming[addOnId]) {
      stripeAddOns[addOnId] = {
        ...addOn,
        quantity: 0,
        itemId: null,
        status: subscription.status || null,
      }
    }
  }
  const effectivePlan = stripePlan({ ...team, stripeAddOns })
  const updateData = {
    stripeAddOns,
    questionLimit: effectivePlan.questions,
  }

  await firestore.collection('teams').doc(team.id).update(updateData)
  return updateData
}

const getRequestedTeamAddOnUpdate = ({ team, addOnId, quantity }) => {
  const stripeAddOns = getTeamAddOnsForRequestedQuantity({
    team,
    addOnId,
    quantity,
  })
  const effectivePlan = stripePlan({ ...team, stripeAddOns })
  return {
    stripeAddOns,
    questionLimit: effectivePlan.questions,
  }
}

const clearAutoIncreaseLock = async (teamId) => {
  await getFirestore().collection('teams').doc(teamId).update({
    aiCreditAutoIncreaseLock: FieldValue.delete(),
  })
}

const timestampToMillis = (value) => {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value === 'number') return value
  if (typeof value.seconds === 'number') return value.seconds * 1000
  return 0
}

const acquireAutoIncreaseLock = async (teamId) => {
  const firestore = getFirestore()
  const teamRef = firestore.collection('teams').doc(teamId)
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(teamRef)
    if (!snapshot.exists) {
      const error = new Error('Team not found.')
      error.statusCode = 404
      throw error
    }

    const currentTeam = { id: teamId, ...snapshot.data() }
    ensurePaidBaseSubscription(currentTeam)

    if (!isAutoIncreaseAiCreditsEnabled(currentTeam)) {
      return { skipped: true, reason: 'disabled' }
    }

    const plan = stripePlan(currentTeam)
    if (Number(currentTeam?.questionCount || 0) < Number(plan?.questions || 0)) {
      return { skipped: true, reason: 'credits_available' }
    }

    const lock = currentTeam?.aiCreditAutoIncreaseLock
    if (
      lock?.status === 'processing' &&
      timestampToMillis(lock?.expiresAt) > Date.now()
    ) {
      return {
        processing: true,
        targetQuantity: lock.targetQuantity,
        idempotencyKey: lock.idempotencyKey,
      }
    }

    const currentQuantity =
      getEffectiveAddOns(currentTeam)?.[ADD_ON_IDS.AI_CREDITS]?.quantity || 0
    const targetQuantity = currentQuantity + 1
    const idempotencyKey = `auto-ai-credits-${teamId}-${targetQuantity}`

    transaction.update(teamRef, {
      aiCreditAutoIncreaseLock: {
        status: 'processing',
        addOnId: ADD_ON_IDS.AI_CREDITS,
        targetQuantity,
        idempotencyKey,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + AUTO_INCREASE_LOCK_TTL_MS),
      },
    })

    return {
      team: currentTeam,
      targetQuantity,
      idempotencyKey,
    }
  })
}

const getAddOnSubscriptionUpdate = async ({ team, subscriptionId, addOnId, quantity }) => {
  await ensureAddOnQuantitySupportsCurrentUsage({ team, addOnId, quantity })

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const addOnItem = findSubscriptionAddOnItem(subscription, addOnId)
  const priceId = getAddOnPriceId(
    addOnId,
    getTeamCurrency(team),
    getTeamBillingInterval(team),
  )
  if (!priceId) throw new Error('Add-on price is not configured.')

  const nextQuantity = normalizeAddOnQuantity(quantity)
  const item =
    addOnItem
      ? nextQuantity === 0
        ? { id: addOnItem.id, deleted: true }
        : { id: addOnItem.id, price: priceId, quantity: nextQuantity }
      : nextQuantity === 0
        ? null
        : { price: priceId, quantity: nextQuantity }

  return {
    subscription,
    addOnItem,
    item,
    nextQuantity,
    priceId,
  }
}

const updateSubscriptionAddOnQuantity = async ({
  team,
  subscriptionId,
  addOnId,
  quantity,
  prorationDate = null,
  idempotencyKey = null,
}) => {
  const { subscription, addOnItem, item, nextQuantity } = await getAddOnSubscriptionUpdate({
    team,
    subscriptionId,
    addOnId,
    quantity,
  })

  if (!addOnItem && nextQuantity === 0) {
    return subscription
  }
  if (!item) return subscription

  return stripe.subscriptions.update(
    subscription.id,
    {
      items: [item],
      payment_behavior: 'pending_if_incomplete',
      proration_behavior: 'always_invoice',
      ...(prorationDate ? { proration_date: prorationDate } : {}),
      expand: ['items.data.price', 'latest_invoice.payment_intent'],
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  )
}

const formatMoney = (amount = 0, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
    maximumFractionDigits: String(currency).toLowerCase() === 'jpy' ? 0 : 2,
  }).format((amount || 0) / (String(currency).toLowerCase() === 'jpy' ? 1 : 100))

const previewSubscriptionAddOnQuantity = async ({
  team,
  subscriptionId,
  addOnId,
  quantity,
}) => {
  const { subscription, item, nextQuantity } = await getAddOnSubscriptionUpdate({
    team,
    subscriptionId,
    addOnId,
    quantity,
  })

  if (!item) {
    return {
      nextQuantity,
      prorationDate: Math.floor(Date.now() / 1000),
      currency: subscription.currency || team?.stripeSubscriptionCurrency || 'usd',
      amountDue: 0,
      total: 0,
      subtotal: 0,
      lines: [],
    }
  }

  const prorationDate = Math.floor(Date.now() / 1000)
  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: team.stripeCustomerId,
    subscription: subscription.id,
    subscription_items: [item],
    subscription_proration_behavior: 'always_invoice',
    subscription_proration_date: prorationDate,
  })
  const currency = invoice.currency || subscription.currency || 'usd'
  const lines = getPreviewLines({
    lines: invoice.lines?.data || [],
    currency,
    formatMoney,
  })
  const previewTotals = getPreviewTotals(lines)
  const accountCreditApplied = getAccountCreditApplied(invoice)

  return {
    nextQuantity,
    prorationDate,
    currency,
    amountDue: invoice.amount_due,
    total: invoice.total,
    subtotal: invoice.subtotal,
    invoiceAmountDue: invoice.amount_due,
    startingBalance: invoice.starting_balance,
    endingBalance: invoice.ending_balance,
    accountCreditApplied,
    previewLinesTotal: previewTotals.total,
    creditAmount: previewTotals.creditAmount,
    formattedAmountDue: formatMoney(invoice.amount_due, currency),
    formattedInvoiceAmountDue: formatMoney(invoice.amount_due, currency),
    formattedAccountCreditApplied: formatMoney(accountCreditApplied, currency),
    formattedPreviewLinesTotal: formatMoney(previewTotals.total, currency),
    formattedCreditAmount: formatMoney(previewTotals.creditAmount, currency),
    formattedTotal: formatMoney(invoice.total, currency),
    formattedSubtotal: formatMoney(invoice.subtotal, currency),
    lines,
  }
}

const getCurrentQuantity = (team, addOnId) =>
  getEffectiveAddOns(team)?.[addOnId]?.quantity || 0

export default async function handler(req, res) {
  configureFirebaseApp()

  let auth
  try {
    auth = await getAuthenticatedTeam(req, res)
  } catch (error) {
    return res.status(error?.statusCode || 403).json({ message: error?.message })
  }

  const { team } = auth

  try {
    if (req.method === 'PATCH') {
      await getFirestore().collection('teams').doc(team.id).update({
        autoIncreaseAiCredits: Boolean(req.body?.autoIncreaseAiCredits),
      })
      return res.status(200).json({
        autoIncreaseAiCredits: Boolean(req.body?.autoIncreaseAiCredits),
      })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Invalid HTTP method' })
    }

    ensurePaidBaseSubscription(team)

    const action = req.body?.action || 'manage'
    const addOnId =
      action === 'autoIncreaseAiCredits'
        ? ADD_ON_IDS.AI_CREDITS
        : req.body?.addOnId || ADD_ON_IDS.AI_CREDITS
    const addOn = getAddOnConfig(addOnId)
    if (!addOn) throw new Error('Invalid add-on selected.')
    ensureAddOnIsAvailableForPlan(team, addOn)

    if (action === 'autoIncreaseAiCredits') {
      const lock = await acquireAutoIncreaseLock(team.id)
      if (lock?.skipped) {
        return res.status(200).json(lock)
      }
      if (lock?.processing) {
        return res.status(202).json({
          processing: true,
          reason: 'already_processing',
        })
      }
      try {
        const subscription = await updateSubscriptionAddOnQuantity({
          team: lock.team,
          subscriptionId: lock.team.stripeSubscriptionId,
          addOnId: ADD_ON_IDS.AI_CREDITS,
          quantity: lock.targetQuantity,
          idempotencyKey: lock.idempotencyKey,
        })
        const updateData = await updateTeamAddOns({ team: lock.team, subscription })
        await clearAutoIncreaseLock(team.id)
        return res.status(200).json({
          stripeAddOns: updateData.stripeAddOns,
          questionLimit: updateData.questionLimit,
        })
      } catch (error) {
        await clearAutoIncreaseLock(team.id)
        throw error
      }
    }

    if (action === 'increment') {
      const quantity = getCurrentQuantity(team, addOnId) + 1
      const subscription = await updateSubscriptionAddOnQuantity({
        team,
        subscriptionId: team.stripeSubscriptionId,
        addOnId,
        quantity,
      })
      const updateData = await updateTeamAddOns({ team, subscription })
      return res.status(200).json({
        stripeAddOns: updateData.stripeAddOns,
        questionLimit: updateData.questionLimit,
      })
    }

    if (action === 'previewQuantity') {
      const preview = await previewSubscriptionAddOnQuantity({
        team,
        subscriptionId: team.stripeSubscriptionId,
        addOnId,
        quantity: req.body?.quantity,
      })
      return res.status(200).json({ preview })
    }

    if (action === 'confirmQuantity') {
      const subscription = await updateSubscriptionAddOnQuantity({
        team,
        subscriptionId: team.stripeSubscriptionId,
        addOnId,
        quantity: req.body?.quantity,
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
        return res.status(200).json({
          paymentAction,
          ...getRequestedTeamAddOnUpdate({
            team,
            addOnId,
            quantity: req.body?.quantity,
          }),
        })
      }
      const updateData = await updateTeamAddOns({ team, subscription })
      return res.status(200).json({
        stripeAddOns: updateData.stripeAddOns,
        questionLimit: updateData.questionLimit,
      })
    }

    return res.status(400).json({ message: 'Invalid add-on action.' })
  } catch (error) {
    console.log(error)
    return res
      .status(error?.statusCode || 500)
      .json({ message: error?.message || 'Unable to manage add-ons.' })
  }
}
