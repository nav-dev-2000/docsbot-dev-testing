import { getAuth } from 'firebase-admin/auth'
import { stripe } from '@/utils/stripe'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()
const auth = getAuth()
import { stripePlan } from '@/utils/helpers'
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

//add Slack webhook
const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL, {
  username: 'DocsBot-AI',
  icon_url: 'https://docsbot.ai/apple-touch-icon.png',
  channel: '#signups',
})

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
              const teamObj = { id: teamId, ...teamsRef.docs[0].data() }

              //multi-price subscriptions don't have plan on subscription object
              // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
              let plan = subscription.plan
              if (!plan && subscription.items?.data) {
                if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
                  const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
                  
                  // Look through all subscription items to find the one that matches our configured plans
                  for (const item of subscription.items.data) {
                    const itemPlan = item.plan
                    // Check if this price ID exists in our configured plans
                    for (const planKey in plans) {
                      const configuredPlan = plans[planKey]
                      // Check current prices
                      for (const frequency in configuredPlan.prices.current) {
                        if (configuredPlan.prices.current[frequency] === itemPlan.id) {
                          plan = itemPlan
                          break
                        }
                      }
                      // Check old prices if no match found in current
                      if (!plan && configuredPlan.prices.old) {
                        for (const oldPrice of configuredPlan.prices.old) {
                          if (oldPrice === itemPlan.id) {
                            plan = itemPlan
                            break
                          }
                        }
                      }
                      if (plan) break
                    }
                    if (plan) break
                  }
                }
                
                // Fallback to first item if no match found in configured plans
                if (!plan) {
                  plan = subscription.items.data[0].plan
                }
              }

              // save subscription to team
              const updateData = {
                stripeSubscriptionId: subscription.id,
                stripeSubscriptionStatus: subscription.status,
                stripeSubscriptionProduct: plan.product,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionPrice: plan.amount,
                stripeSubscriptionCurrency: subscription.currency,
                stripeSubscriptionInterval: plan.interval,
                stripeSubscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
                stripeSubscriptionQuantity: subscription.quantity || subscription.items.data[0].quantity,
                stripeSubscriptionCancelFeedback: subscription.cancellation_details.feedback,
                stripeSubscriptionCancelComment: subscription.cancellation_details.comment,
              }

              await transaction.update(teamsCollection.doc(teamId), updateData)
              console.log(`🔔 Subscription updated for team ${teamId}`)

              // we also save the questionLimit to the team object as well
              // Only update question limit for non-staff teams
              if (
                'ZrbLG98bbxZ9EFqiPvyl' !== teamId &&
                'FVasEcNLTWpySb5ZNlF3' !== teamId
              ) {
                const questionLimit = stripePlan({stripeSubscriptionPlan: plan.id, stripeSubscriptionStatus: subscription.status}).questions
                await transaction.update(firestore.collection('teams').doc(teamId), {
                  questionLimit,
                })
              }

              //if changing plan
              if (
                event.data.previous_attributes?.items?.data[0]?.plan?.id &&
                event.data.previous_attributes?.items?.data[0]?.plan?.id !== plan.id
              ) {
                // Send the Slack notification
                try {
                  await slack.send({
                    attachments: [
                      {
                        fallback: `DocsBot AI plan changed!`,
                        color: '#0891b2',
                        title: 'DocsBot AI Subscription Plan Changed',
                        text: `Old plan ${stripePlan(teamObj).name}`,
                        fields: [
                          {
                            title: 'Team',
                            value: `${teamObj.name}`,
                            short: false,
                          },
                          {
                            title: 'Old Amount',
                            value: `${
                              event.data.previous_attributes.items.data[0].plan.currency == 'jpy'
                                ? event.data.previous_attributes.items.data[0].plan.amount
                                : event.data.previous_attributes.items.data[0].plan.amount / 100
                            } ${event.data.previous_attributes.items.data[0].plan.currency.toUpperCase()} ${
                              event.data.previous_attributes.items.data[0].plan.interval
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
                        fallback: `DocsBot AI cancellation!`,
                        color: '#d10014',
                        title: 'DocsBot AI Subscription Cancelled',
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
                        fallback: `DocsBot AI cancellation!`,
                        color: '#d10014',
                        title: 'DocsBot AI Subscription Cancelled!',
                        fields: [
                          {
                            title: 'Email',
                            value: `${owner}`,
                            short: true,
                          },
                          {
                            title: 'Team',
                            value: `${teamObj.name}`,
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

                //multi-price subscriptions don't have plan on subscription object
                // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
                let plan = session.subscription.plan
                if (!plan && session.subscription.items?.data) {
                  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
                    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
                    
                    // Look through all subscription items to find the one that matches our configured plans
                    for (const item of session.subscription.items.data) {
                      const itemPlan = item.plan
                      // Check if this price ID exists in our configured plans
                      for (const planKey in plans) {
                        const configuredPlan = plans[planKey]
                        // Check current prices
                        for (const frequency in configuredPlan.prices.current) {
                          if (configuredPlan.prices.current[frequency] === itemPlan.id) {
                            plan = itemPlan
                            break
                          }
                        }
                        // Check old prices if no match found in current
                        if (!plan && configuredPlan.prices.old) {
                          for (const oldPrice of configuredPlan.prices.old) {
                            if (oldPrice === itemPlan.id) {
                              plan = itemPlan
                              break
                            }
                          }
                        }
                        if (plan) break
                      }
                      if (plan) break
                    }
                  }
                  
                  // Fallback to first item if no match found in configured plans
                  if (!plan) {
                    plan = session.subscription.items.data[0].plan
                  }
                }

                // save subscription to team
                await transaction.update(
                  firestore.collection('teams').doc(checkoutSession.client_reference_id),
                  {
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription.id,
                    stripeSubscriptionStatus: session.subscription.status,
                    stripeSubscriptionProduct: plan.product,
                    stripeSubscriptionPlan: plan.id,
                    stripeSubscriptionPrice: plan.amount,
                    stripeSubscriptionCurrency: session.currency,
                    stripeSubscriptionInterval: plan.interval,
                    stripeSubscriptionCancelAtPeriodEnd: session.subscription.cancel_at_period_end,
                    stripeSubscriptionQuantity: session.subscription.quantity || session.subscription.items.data[0].quantity,
                  }
                )

                //add teamid to stripe customer metadata
                await stripe.customers.update(session.customer, {
                  metadata: { teamId: checkoutSession.client_reference_id },
                })

                console.log(
                  `🔔 Subscription created for team ${checkoutSession.client_reference_id}`
                )

                //get plan name with a mock team object
                const planName = stripePlan({
                  stripeSubscriptionStatus: session.subscription.status,
                  stripeSubscriptionPlan: plan.id,
                  stripeSubscriptionProduct: plan.product,
                }).name

                // Send the Slack notification
                try {
                  const team = await getTeam(checkoutSession.client_reference_id)
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
                        fallback: `New DocsBot AI signup by ${session.customer_details.name} (${
                          session.customer_details.email
                        }) to ${planName} for ${
                          session.currency == 'jpy'
                            ? session.amount_total
                            : session.amount_total / 100
                        } ${session.currency.toUpperCase()} ${
                          plan.interval
                        }ly!`,
                        color: '#0891b2',
                        title: 'New DocsBot AI Subscription Signup',
                        text: `${planName}`,
                        fields: [
                          {
                            title: 'Customer',
                            value: `${session.customer_details.name} (${session.customer_details.email})`,
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

              //multi-price subscriptions don't have plan on subscription object
              // Find the plan that matches our NEXT_PUBLIC_STRIPE_PLANS environment variable
              let plan = invoiceWithSubscription.subscription.plan
              if (!plan && invoiceWithSubscription.subscription.items?.data) {
                if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
                  const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
                  
                  // Look through all subscription items to find the one that matches our configured plans
                  for (const item of invoiceWithSubscription.subscription.items.data) {
                    const itemPlan = item.plan
                    // Check if this price ID exists in our configured plans
                    for (const planKey in plans) {
                      const configuredPlan = plans[planKey]
                      // Check current prices
                      for (const frequency in configuredPlan.prices.current) {
                        if (configuredPlan.prices.current[frequency] === itemPlan.id) {
                          plan = itemPlan
                          break
                        }
                      }
                      // Check old prices if no match found in current
                      if (!plan && configuredPlan.prices.old) {
                        for (const oldPrice of configuredPlan.prices.old) {
                          if (oldPrice === itemPlan.id) {
                            plan = itemPlan
                            break
                          }
                        }
                      }
                      if (plan) break
                    }
                    if (plan) break
                  }
                }
                
                // Fallback to first item if no match found in configured plans
                if (!plan) {
                  plan = invoiceWithSubscription.subscription.items.data[0].plan
                }
              }

              //save subscription to team in case this comes before updated webhook
              const updateData = {
                stripeSubscriptionId: invoiceWithSubscription.subscription.id,
                stripeSubscriptionStatus: invoiceWithSubscription.subscription.status,
                stripeSubscriptionProduct: plan.product,
                stripeSubscriptionPlan: plan.id,
                stripeSubscriptionPrice: plan.amount,
                stripeSubscriptionCurrency: invoiceWithSubscription.subscription.currency,
                stripeSubscriptionInterval: plan.interval,
                stripeSubscriptionCancelAtPeriodEnd:
                  invoiceWithSubscription.subscription.cancel_at_period_end,
                stripeSubscriptionQuantity: invoiceWithSubscription.subscription.quantity,
              }

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
                            value: `${teamData.name}`,
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
