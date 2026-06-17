import { getAuth } from 'firebase-admin/auth'
import { stripe } from '@/utils/stripe'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()
const auth = getAuth()
import { stripePlan } from '@/utils/helpers'
import {
  collectAddOnsFromSubscription,
  getAddOnConfig,
  getBaseSubscriptionItem,
  isAddOnPriceId,
  mergeStripeAddOns,
  normalizeAddOnQuantity,
  subscriptionItems,
} from '@/utils/billingAddOns'
import { IncomingWebhook } from '@slack/webhook'
import { bentoTrack, teamOwner } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import { getTeam, getUser, getTeamEmail } from '@/lib/dbQueries'

// Stripe requires the raw body to construct the event.
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

const relevantEvents = new Set([
  'invoice.paid',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'radar.early_fraud_warning.created',
])
const staffTeamIds = new Set(['ZrbLG98bbxZ9EFqiPvyl', 'FVasEcNLTWpySb5ZNlF3'])
const publicPlanSlugs = new Set([
  'free',
  'hobby',
  'personal',
  'standard',
  'business',
  'enterprise',
])

const normalizePlanSlug = (plan = {}) => {
  if (publicPlanSlugs.has(plan?.id)) return plan.id
  if (plan?.id?.startsWith?.('enterprise')) return 'enterprise'
  if (plan?.name?.toLowerCase?.().includes('enterprise')) return 'enterprise'
  return plan?.id || 'free'
}

const getResolvedWebhookPlan = ({ planId, status, team }) => stripePlan({
  ...team,
  stripeSubscriptionPlan: planId,
  stripeSubscriptionStatus: status,
})

const applyResolvedPlanFields = (updateData, { planId, status, teamId, team }) => {
  const resolvedPlan = getResolvedWebhookPlan({ planId, status, team })
  updateData.plan = normalizePlanSlug(resolvedPlan)

  if (!staffTeamIds.has(teamId)) {
    updateData.questionLimit = resolvedPlan.questions
  }
}

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

const slackWebhookOptions = {
  username: 'DocsBot-AI',
  icon_url: 'https://docsbot.ai/apple-touch-icon.png',
  channel: '#signups',
}

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL?.trim()
const slack = slackWebhookUrl
  ? new IncomingWebhook(slackWebhookUrl, slackWebhookOptions)
  : { send: async () => {} }

const getChangedAddOns = ({ existingAddOns, previousItems, subscription }) => {
  const previousAddOns = existingAddOns
    ? mergeStripeAddOns(existingAddOns, {})
    : previousItems
      ? collectAddOnsFromSubscription({
          id: subscription.id,
          status: subscription.status,
          items: { data: previousItems },
        })
      : null
  if (!previousAddOns) return []

  const currentAddOns = collectAddOnsFromSubscription(subscription)
  const currentItems = subscriptionItems(subscription)
  for (const [addOnId, previousAddOn] of Object.entries(previousAddOns)) {
    if (!previousAddOn?.itemId || currentAddOns[addOnId]?.quantity) continue

    const matchingItem = currentItems.find((item) => item.id === previousAddOn.itemId)
    if (!matchingItem) continue

    currentAddOns[addOnId] = {
      ...currentAddOns[addOnId],
      quantity: normalizeAddOnQuantity(matchingItem.quantity),
      subscriptionId: subscription.id || previousAddOn.subscriptionId || null,
      itemId: matchingItem.id,
      status: subscription.status || previousAddOn.status || null,
    }
  }

  return Object.entries(currentAddOns)
    .filter(([addOnId, current]) => {
      const previous = previousAddOns[addOnId]
      return previous && previous.quantity !== current.quantity
    })
    .map(([addOnId, current]) => ({
      id: addOnId,
      name: getAddOnConfig(addOnId)?.name || addOnId,
      previousQuantity: previousAddOns[addOnId]?.quantity || 0,
      quantity: current.quantity || 0,
    }))
}

const notifySlackAddOnChanges = async ({ changedAddOns, teamObj, teamLink, ownerEmail }) => {
  if (!changedAddOns.length) return

  await slack.send({
    attachments: [
      {
        fallback: `DocsBot add-ons changed for ${teamObj.name}`,
        color: '#0891b2',
        title: 'DocsBot Subscription Add-Ons Changed',
        fields: [
          {
            title: 'Customer Email',
            value: `${ownerEmail}`,
            short: true,
          },
          {
            title: 'Team',
            value: `<${teamLink}|${teamObj.name}>`,
            short: false,
          },
          {
            title: 'Changes',
            value: changedAddOns
              .map((addOn) => `${addOn.name}: ${addOn.previousQuantity} -> ${addOn.quantity}`)
              .join('\n'),
            short: false,
          },
        ],
      },
    ],
  })
}

const isAddOnOnlySubscription = (subscription) => {
  const items = subscription?.items?.data || []
  return items.length > 0 && items.every((item) => isAddOnPriceId(item?.price?.id || item?.plan?.id))
}

const disableAddOnsForInactiveBase = async ({ transaction, teamsCollection, teamId, team }) => {
  const status = team?.stripeSubscriptionStatus
  if (['active', 'trialing', 'past_due'].includes(status)) return

  const stripeAddOns = mergeStripeAddOns(team?.stripeAddOns, {})
  for (const addOnId of Object.keys(stripeAddOns)) {
    stripeAddOns[addOnId] = {
      ...stripeAddOns[addOnId],
      status: 'base_inactive',
    }
  }

  await transaction.update(teamsCollection.doc(teamId), {
    stripeAddOns,
    questionLimit: stripePlan({ ...team, stripeAddOns }).questions,
  })
}

const syncAddOnItemsToBaseInterval = async ({ subscription }) => {
  return subscription
}

const webhookHandler = async (req, res) => {
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? process.env.STRIPE_WEBHOOK_SECRET
    let event = null

    try {
      if (!sig || !webhookSecret) return
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
    } catch (err) {
      console.log(`❌ Error message: ${err.message}`)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            await firestore.runTransaction(async (transaction) => {
              const subscription = event.data.object
              const teamsCollection = firestore.collection('teams')
              const configuredPlans =
                process?.env?.NEXT_PUBLIC_STRIPE_PLANS &&
                JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)

              // get team by customer id
              let teamsRef = await transaction.get(
                teamsCollection.where('stripeCustomerId', '==', subscription.customer)
              )

              // fallback to subscription id if customer lookup fails (e.g. async checkout flows)
              if (teamsRef.empty) {
                teamsRef = await transaction.get(
                  teamsCollection.where('stripeSubscriptionId', '==', subscription.id)
                )

                if (teamsRef.empty) {
                  console.log(
                    `❌ Team not found for customer ${subscription.customer} or subscription ${subscription.id}`
                  )
                  return
                }
              }

              const teamId = teamsRef.docs[0].id
              const teamLink = `https://docsbot.ai/app/team?switchTeam=${teamId}`
              const teamObj = { id: teamId, ...teamsRef.docs[0].data() }

              if (isAddOnOnlySubscription(subscription)) {
                console.log(
                  `Ignoring add-on-only subscription ${subscription.id} for team ${teamId}; add-ons must be attached to the base subscription.`,
                )
                return
              }

              //multi-price subscriptions don't have plan on subscription object
              // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
              let plan = subscription.plan
              if (!plan && subscription.items?.data) {
                plan = findConfiguredPlan(subscription.items.data, configuredPlans)
              }
              if (!plan) {
                const baseItem = getBaseSubscriptionItem(subscription, configuredPlans)
                plan = baseItem?.plan || baseItem?.price
              }
              const syncedSubscription = await syncAddOnItemsToBaseInterval({
                subscription,
                plan,
                team: teamObj,
              })

              const previousItems = event.data.previous_attributes?.items?.data
              const previousPlan = previousItems
                ? findConfiguredPlan(previousItems, configuredPlans)
                : null
              const changedAddOns = getChangedAddOns({
                existingAddOns: teamObj?.stripeAddOns,
                previousItems,
                subscription: syncedSubscription,
              })

              // save subscription to team
              const updateData = {
                stripeSubscriptionId: subscription.id,
                stripeSubscriptionStatus: syncedSubscription.status,
                stripeSubscriptionProduct: plan.product,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionPrice: plan.amount,
                stripeSubscriptionCurrency: syncedSubscription.currency,
                stripeSubscriptionInterval: plan.interval,
                stripeSubscriptionCancelAtPeriodEnd: syncedSubscription.cancel_at_period_end,
                stripeSubscriptionQuantity:
                  syncedSubscription.quantity || syncedSubscription.items.data[0].quantity,
                stripeSubscriptionCancelFeedback:
                  syncedSubscription.cancellation_details.feedback,
                stripeSubscriptionCancelComment:
                  syncedSubscription.cancellation_details.comment,
              }

              applyResolvedPlanFields(updateData, {
                planId: plan.id,
                status: subscription.status,
                teamId,
                team: teamObj,
              })
              updateData.stripeAddOns = mergeStripeAddOns(
                teamObj?.stripeAddOns,
                collectAddOnsFromSubscription(syncedSubscription),
              )
              updateData.questionLimit = stripePlan({
                ...teamObj,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionStatus: syncedSubscription.status,
                stripeAddOns: updateData.stripeAddOns,
              }).questions

              await transaction.update(teamsCollection.doc(teamId), updateData)
              await disableAddOnsForInactiveBase({
                transaction,
                teamsCollection,
                teamId,
                team: { ...teamObj, ...updateData },
              })
              console.log(`🔔 Subscription updated for team ${teamId}`)

              //if changing plan
              if (
                previousPlan?.id &&
                previousPlan.id !== plan.id
              ) {
                const ownerEmail = await getTeamEmail(teamObj)

                // Send the Slack notification
                try {
                  await slack.send({
                    attachments: [
                      {
                        fallback: `DocsBot plan changed!`,
                        color: '#0891b2',
                        title: 'DocsBot Subscription Plan Changed',
                        text: `Old plan ${stripePlan(teamObj).name}`,
                        fields: [
                          {
                            title: 'Customer Email',
                            value: `${ownerEmail}`,
                            short: true,
                          },
                          {
                            title: 'Team',
                            value: `<${teamLink}|${teamObj.name}>`,
                            short: false,
                          },
                          {
                            title: 'Old Amount',
                            value: `${
                              previousPlan.currency == 'jpy'
                                ? previousPlan.amount
                                : previousPlan.amount / 100
                            } ${previousPlan.currency.toUpperCase()} ${
                              previousPlan.interval
                            }ly`,
                            short: true,
                          },
                          {
                            title: 'New Amount',
                            value: `${
                              plan.currency == 'jpy'
                                ? plan.amount
                                : plan.amount / 100
                            } ${plan.currency.toUpperCase()} ${
                              plan.interval
                            }ly`,
                            short: true,
                          },
                        ],
                      },
                    ],
                  })
                } catch (e) {
                  console.error(e)
                }
              }

              if (changedAddOns.length) {
                const ownerEmail = await getTeamEmail(teamObj)

                try {
                  await notifySlackAddOnChanges({
                    changedAddOns,
                    teamObj,
                    teamLink,
                    ownerEmail,
                  })
                } catch (e) {
                  console.error(e)
                }
              }

              /*
              //if scheduled to cancel
              if (
                event.data.previous_attributes?.cancel_at_period_end === false &&
                subscription.cancel_at_period_end
              ) {
                // Send the Slack notification
                try {
                  await slack.send({
                    attachments: [
                      {
                        fallback: `DocsBot cancellation!`,
                        color: '#d10014',
                        title: 'DocsBot Subscription Cancelled',
                        text: `${stripePlan(teamObj).name} x ${subscription.quantity}`,
                        fields: [
                          {
                            title: 'Team',
                            value: `${teamObj.name}`,
                            short: true,
                          },
                          {
                            title: 'Amount',
                            value: `$${(subscription.plan.amount * subscription.quantity) / 100} ${
                              subscription.plan.currency
                            } ${subscription.plan.interval}ly`,
                            short: true,
                          },
                        ],
                      },
                    ],
                  })
                } catch (e) {
                  console.error(e)
                }
              }
              */

              //if cancel feedback added
              if (
                event.data.previous_attributes?.cancellation_details?.feedback === null &&
                subscription.cancel_at_period_end
              ) {
                // grab owner email
                let owner = await getTeamEmail(teamObj);
                // Send the Slack notification
                try {
                  await slack.send({
                    attachments: [
                      {
                        fallback: `DocsBot cancellation!`,
                        color: '#d10014',
                        title: 'DocsBot Subscription Cancelled!',
                        fields: [
                          {
                            title: 'Email',
                            value: `${owner}`,
                            short: true,
                          },
                          {
                            title: 'Team',
                            value: `<${teamLink}|${teamObj.name}>`,
                            short: true,
                          },
                          {
                            title: 'Amount',
                            value: `${
                              plan.currency == 'jpy'
                                ? plan.amount
                                : plan.amount / 100
                            } ${plan.currency.toUpperCase()} ${
                              plan.interval
                            }ly`,
                            short: true,
                          },
                          {
                            title: 'Reason',
                            value: `${subscription.cancellation_details.feedback || ''} ${
                              subscription.cancellation_details.comment || ''
                            }`,
                            short: false,
                          },
                        ],
                      },
                    ],
                  })
                } catch (e) {
                  console.error(e)
                }
                try {
                  bentoTrack(teamOwner(teamObj), 'track', {
                    type: 'subscriptionCancelled',
                    details: {
                      reason: subscription.cancellation_details.feedback || '',
                      comment: subscription.cancellation_details.comment || '',
                    },
                  })
                  phTrack(teamOwner(teamObj), 'Subscription Canceled', {
                    'Cancel Reason': subscription.cancellation_details.feedback || '',
                    'Cancel Comment': subscription.cancellation_details.comment || '',
                  }, teamObj.id)
                } catch (e) {
                  console.log('Error sending bento track', e)
                }
              }
            })

            break
          case 'checkout.session.completed':
            await firestore.runTransaction(async (transaction) => {
              const checkoutSession = event.data.object

              if (checkoutSession.mode === 'subscription') {
                // Retrieve the Checkout Session with expand
                const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
                  expand: ['subscription'],
                })

                const teamId = checkoutSession.client_reference_id
                const teamSnapshot = await transaction.get(
                  firestore.collection('teams').doc(teamId),
                )
                const checkoutTeam = teamSnapshot?.exists
                  ? { id: teamId, ...teamSnapshot.data() }
                  : { id: teamId }

                if (isAddOnOnlySubscription(session.subscription)) {
                  console.log(
                    `Ignoring add-on-only checkout subscription ${session.subscription.id} for team ${teamId}; add-ons must be attached to the base subscription.`,
                  )
                  return
                }

                //multi-price subscriptions don't have plan on subscription object
                // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
                let plan = session.subscription.plan
                if (!plan && session.subscription.items?.data) {
                  let plans = null
                  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
                    plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
                  }
                  plan = findConfiguredPlan(session.subscription.items.data, plans)
                  
                  // Fallback to first item if no match found in configured plans
                  if (!plan) {
                    const baseItem = getBaseSubscriptionItem(session.subscription, plans)
                    plan = baseItem?.plan || baseItem?.price || session.subscription.items.data[0].plan
                  }
                }
                const syncedSubscription = await syncAddOnItemsToBaseInterval({
                  subscription: session.subscription,
                  plan,
                  team: checkoutTeam,
                })

                // save subscription to team
                const updateData = {
                  stripeCustomerId: session.customer,
                  stripeSubscriptionId: syncedSubscription.id,
                  stripeSubscriptionStatus: syncedSubscription.status,
                  stripeSubscriptionProduct: plan.product,
                  stripeSubscriptionPlan: plan.id,
                  stripeSubscriptionPrice: plan.amount,
                  stripeSubscriptionCurrency: syncedSubscription.currency,
                  stripeSubscriptionInterval: plan.interval,
                  stripeSubscriptionCancelAtPeriodEnd: syncedSubscription.cancel_at_period_end,
                  stripeSubscriptionQuantity:
                    syncedSubscription.quantity || syncedSubscription.items.data[0].quantity,
                }
                applyResolvedPlanFields(updateData, {
                  planId: plan.id,
                  status: syncedSubscription.status,
                  teamId,
                  team: checkoutTeam,
                })
                updateData.stripeAddOns = mergeStripeAddOns(
                  checkoutTeam?.stripeAddOns,
                  collectAddOnsFromSubscription(syncedSubscription),
                )
                updateData.questionLimit = stripePlan({
                  ...checkoutTeam,
                  stripeSubscriptionPlan: plan.id,
                  stripeSubscriptionStatus: syncedSubscription.status,
                  stripeAddOns: updateData.stripeAddOns,
                }).questions
                await transaction.update(firestore.collection('teams').doc(teamId), updateData)

                //add teamid to stripe customer metadata
                await stripe.customers.update(session.customer, {
                  metadata: { teamId: checkoutSession.client_reference_id },
                })

                console.log(
                  `🔔 Subscription created for team ${teamId}`
                )

                //get plan name with a mock team object
                const planName = stripePlan({
                  stripeSubscriptionStatus: session.subscription.status,
                  stripeSubscriptionPlan: plan.id,
                  stripeSubscriptionProduct: plan.product,
                }).name

                // Send the Slack notification
                try {
                  const team = await getTeam(teamId)
                  const teamLink = `https://docsbot.ai/app/team?switchTeam=${teamId}`
                  phTrack(teamOwner(team), 'Subscribed', {
                    plan: planName,
                    amount:
                      session.currency == 'jpy' ? session.amount_total : session.amount_total / 100,
                    currency: session.currency,
                    interval: plan.interval,
                  }, team.id)

                  await slack.send({
                    attachments: [
                      {
                        fallback: `New DocsBot signup by ${session.customer_details.name} (${
                          session.customer_details.email
                        }) to ${planName} for ${
                          session.currency == 'jpy'
                            ? session.amount_total
                            : session.amount_total / 100
                        } ${session.currency.toUpperCase()} ${
                          plan.interval
                        }ly!`,
                        color: '#0891b2',
                        title: 'New DocsBot Subscription Signup',
                        text: `${planName}`,
                        fields: [
                          {
                            title: 'Customer',
                            value: `${session.customer_details.name} (${session.customer_details.email})`,
                            short: true,
                          },
                          {
                            title: 'Team',
                            value: `<${teamLink}|${team?.name || teamId}>`,
                            short: true,
                          },
                          {
                            title: 'Amount',
                            value: `${
                              session.currency == 'jpy'
                                ? session.amount_total
                                : session.amount_total / 100
                            } ${session.currency.toUpperCase()} ${
                              plan.interval
                            }ly`,
                            short: true,
                          },
                        ],
                      },
                    ],
                  })
                } catch (e) {
                  console.error(e)
                }
              }
            })
            break
          case 'invoice.paid':
            await firestore.runTransaction(async (transaction) => {
              const invoice = event.data.object
              const teamsCollection = firestore.collection('teams')

              //get team by customer id
              let teamsRef2 = await transaction.get(
                teamsCollection.where('stripeCustomerId', '==', invoice.customer)
              )

              if (teamsRef2.empty && invoice.subscription) {
                teamsRef2 = await transaction.get(
                  teamsCollection.where('stripeSubscriptionId', '==', invoice.subscription)
                )
              }

              if (teamsRef2.empty) {
                throw new Error('No matching team found')
              }

              const team = { id: teamsRef2.docs[0].id, ...teamsRef2.docs[0].data() }

              //expand invoice to get subscription
              const invoiceWithSubscription = await stripe.invoices.retrieve(invoice.id, {
                expand: ['subscription'],
              })

              if (isAddOnOnlySubscription(invoiceWithSubscription.subscription)) {
                console.log(
                  `Ignoring add-on-only invoice subscription ${invoiceWithSubscription.subscription.id} for team ${team.id}; add-ons must be attached to the base subscription.`,
                )
                return
              }

              //multi-price subscriptions don't have plan on subscription object
              // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
              let plan = invoiceWithSubscription.subscription.plan
              if (!plan && invoiceWithSubscription.subscription.items?.data) {
                let plans = null
                if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
                  plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
                }
                plan = findConfiguredPlan(
                  invoiceWithSubscription.subscription.items.data,
                  plans,
                )
                
                // Fallback to first item if no match found in configured plans
              if (!plan) {
                  const baseItem = getBaseSubscriptionItem(
                    invoiceWithSubscription.subscription,
                    plans,
                  )
                  plan =
                    baseItem?.plan ||
                    baseItem?.price ||
                    invoiceWithSubscription.subscription.items.data[0].plan
                }
              }
              const syncedSubscription = await syncAddOnItemsToBaseInterval({
                subscription: invoiceWithSubscription.subscription,
                plan,
                team,
              })

              //save subscription to team in case this comes before updated webhook
              const updateData = {
                stripeSubscriptionId: syncedSubscription.id,
                stripeSubscriptionStatus: syncedSubscription.status,
                stripeSubscriptionProduct: plan.product,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionPrice: plan.amount,
                stripeSubscriptionCurrency: syncedSubscription.currency,
                stripeSubscriptionInterval: plan.interval,
                stripeSubscriptionCancelAtPeriodEnd:
                  syncedSubscription.cancel_at_period_end,
                stripeSubscriptionQuantity: syncedSubscription.quantity,
              }
              applyResolvedPlanFields(updateData, {
                planId: plan.id,
                status: syncedSubscription.status,
                teamId: team.id,
                team,
              })
              updateData.stripeAddOns = mergeStripeAddOns(
                team?.stripeAddOns,
                collectAddOnsFromSubscription(syncedSubscription),
              )
              updateData.questionLimit = stripePlan({
                ...team,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionStatus: syncedSubscription.status,
                stripeAddOns: updateData.stripeAddOns,
              }).questions

              await transaction.update(teamsCollection.doc(team.id), updateData)

              try {
                bentoTrack(teamOwner(team), 'trackPurchase', {
                  purchaseDetails: {
                    unique: { key: invoice.id },
                    value: { amount: invoice.amount_paid, currency: invoice.currency },
                  },
                  cart: {
                    abandoned_checkout_url: 'https://docsbot.ai/app/account',
                    items: [
                      {
                        product_id: invoiceWithSubscription.lines.data[0].price.id,
                        product_sku: invoiceWithSubscription.lines.data[0].price.product,
                        product_name: invoiceWithSubscription.lines.data[0].description,
                        product_price: invoiceWithSubscription.lines.data[0].price.unit_amount,
                        quantity: invoiceWithSubscription.lines.data[0].quantity,
                      },
                    ],
                  },
                })
                phTrack(teamOwner(team), 'Subscription Payment', {
                  plan: plan.name,
                  amount: invoice.amount_paid,
                  currency: invoice.currency,
                  interval: plan.interval,
                  subscriptionId: invoiceWithSubscription.subscription.id,
                  customerId: invoice.customer,
                }, team.id)
              } catch (e) {
                console.log('Error sending bento track', e)
              }
            })
            break
          case 'radar.early_fraud_warning.created':
            try {
              const earlyFraudWarning = event.data.object
              const paymentIntentId = earlyFraudWarning.payment_intent
              
              // Get the payment intent to find the customer
              const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
              const customerId = paymentIntent.customer
              
              if (!customerId) {
                console.log(`❌ No customer found for payment intent ${paymentIntentId}`)
                break
              }
              
              // Refund the payment immediately
              await stripe.refunds.create({
                payment_intent: paymentIntentId,
              })
              console.log(`✅ Refunded payment for payment intent ${paymentIntentId}`)
              
              // Find the team associated with this customer
              const teamsRef = await firestore.collection('teams').where('stripeCustomerId', '==', customerId).get()
              
              if (teamsRef.empty) {
                console.log(`❌ No team found for customer ${customerId}`)
                break
              }
              
              const teamId = teamsRef.docs[0].id
              const teamLink = `https://docsbot.ai/app/team?switchTeam=${teamId}`
              const teamData = teamsRef.docs[0].data()
              
              // Cancel the subscription immediately
              if (teamData.stripeSubscriptionId) {
                await stripe.subscriptions.cancel(teamData.stripeSubscriptionId, {
                  invoice_now: false,
                  prorate: false,
                })
                
                // Update the team record
                await firestore.collection('teams').doc(teamId).update({
                  stripeSubscriptionStatus: 'canceled',
                  stripeSubscriptionCancelAtPeriodEnd: false,
                })
                
                console.log(`✅ Canceled subscription ${teamData.stripeSubscriptionId} for team ${teamId} due to fraud warning`)
                
                // Send notification to Slack
                try {
                  const owner = await getTeamEmail({ id: teamId, ...teamData })
                  
                  await slack.send({
                    attachments: [
                      {
                        fallback: `Fraud warning detected!`,
                        color: '#d10014',
                        title: 'Early Fraud Warning - Action Taken',
                        fields: [
                          {
                            title: 'Email',
                            value: `${owner}`,
                            short: true,
                          },
                          {
                            title: 'Team',
                            value: `<${teamLink}|${teamData.name}>`,
                            short: true,
                          },
                          {
                            title: 'Payment Intent',
                            value: paymentIntentId,
                            short: false,
                          },
                          {
                            title: 'Actions Taken',
                            value: 'Payment refunded and subscription canceled',
                            short: false,
                          },
                        ],
                      },
                    ],
                  })
                } catch (e) {
                  console.error('Error sending Slack notification:', e)
                }
              } else {
                console.log(`❌ No subscription found for team ${teamId}`)
              }
            } catch (error) {
              console.error('Error handling early fraud warning:', error)
            }
            break
          default:
            throw new Error('Unhandled relevant event!')
        }
      } catch (error) {
        console.log(error)
        return res.status(400).send('Webhook error: ' + error?.message + '\n' + error?.stack)
      }
    }

    res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default webhookHandler
