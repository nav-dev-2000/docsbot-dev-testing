import { stripe } from '@/utils/stripe'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()
import { stripePlan, bookPlan, portraitPlan } from '@/utils/helpers'
import { IncomingWebhook } from '@slack/webhook'
import { bentoTrack, teamOwner } from '@/lib/bento'
import { storyPurchase } from '@/lib/storyFunctions'
import { portraitPurchase } from '@/lib/portraitFunctions'
import { getBook, getTeam, getPortrait } from '@/lib/dbQueries'

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
])

//add Slack webhook
const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL, {
  username: 'DocsBot-AI-Base',
  icon_url: 'https://infiniteuploads.com/wp-content/uploads/2022/09/docsbot-icon-1.png',
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
            const subscription = event.data.object
            //get team by customer id
            const teamsRef = await firestore
              .collection('teams')
              .where('stripeCustomerId', '==', subscription.customer)
              .get()
            if (teamsRef.empty) {
              console.log(`❌ Team not found for customer ${subscription.customer}`)
              break
            }
            const teamId = teamsRef.docs[0].id
            const teamObj = { id: teamId, ...teamsRef.docs[0].data() }

            //save subscription to team
            const baseRef = firestore.collection('teams').doc(teamId).set(
              {
                stripeSubscriptionId: subscription.id,
                stripeSubscriptionStatus: subscription.status,
                stripeSubscriptionPlan: subscription.plan.id,
                stripeSubscriptionPrice: subscription.plan.amount,
                stripeSubscriptionCurrency: subscription.plan.currency,
                stripeSubscriptionInterval: subscription.plan.interval,
                stripeSubscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
                stripeSubscriptionQuantity: subscription.quantity,
              },
              { merge: true }
            )
            console.log(`🔔 Subscription updated for team ${teamId}`)

            //if scheduled to cancel
            if (
              event.data.previous_attributes?.cancel_at_period_end === false &&
              subscription.cancel_at_period_end
            ) {
              // Send the Slack notification
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

              try {
                bentoTrack(teamOwner(teamObj), 'track', {
                  type: 'subscriptionCancelled',
                })
              } catch (e) {
                console.log('Error sending bento track', e)
              }
            }

            break
          case 'checkout.session.completed':
            const checkoutSession = event.data.object

            if (checkoutSession.mode === 'subscription') {
              // Retrieve the Checkout Session with expand
              const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
                expand: ['subscription'],
              })
              //save subscription to team
              await firestore.collection('teams').doc(checkoutSession.client_reference_id).set(
                {
                  stripeCustomerId: session.customer,
                  stripeSubscriptionId: session.subscription.id,
                  stripeSubscriptionStatus: session.subscription.status,
                  stripeSubscriptionPlan: session.subscription.plan.id,
                  stripeSubscriptionPrice: session.subscription.plan.amount,
                  stripeSubscriptionCurrency: session.subscription.plan.currency,
                  stripeSubscriptionInterval: session.subscription.plan.interval,
                  stripeSubscriptionCancelAtPeriodEnd: session.subscription.cancel_at_period_end,
                  stripeSubscriptionQuantity: session.subscription.quantity,
                },
                { merge: true }
              )

              //add teamid to stripe customer metadata
              await stripe.customers.update(session.customer, {
                metadata: { teamId: checkoutSession.client_reference_id },
              })

              console.log(`🔔 Subscription created for team ${checkoutSession.client_reference_id}`)

              //get plan name with a mock team object
              const planName = stripePlan({
                stripeSubscriptionStatus: session.subscription.status,
                stripeSubscriptionPlan: session.subscription.plan.id,
              }).name

              // Send the Slack notification
              await slack.send({
                attachments: [
                  {
                    fallback: `New DocsBot AI signup by ${session.customer_details.name} (${
                      session.customer_details.email
                    }) to ${planName} x${session.subscription.quantity} for $${
                      session.amount_total / 100
                    } ${session.currency} ${session.subscription.plan.interval}ly!`,
                    color: '#57a35d',
                    title: 'New DocsBot AI Subscription Signup',
                    text: `${planName} x ${session.subscription.quantity}`,
                    fields: [
                      {
                        title: 'Customer',
                        value: `${session.customer_details.name} (${session.customer_details.email})`,
                        short: true,
                      },
                      {
                        title: 'Amount',
                        value: `$${session.amount_total / 100} ${session.currency} ${
                          session.subscription.plan.interval
                        }ly`,
                        short: true,
                      },
                    ],
                  },
                ],
              })
            } else if (checkoutSession.mode === 'payment') {
              // Retrieve the Checkout Session with expand
              const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
                expand: ['line_items'],
              })

              if (checkoutSession.client_reference_id) {
                //get team by customer id
                const team = await getTeam(checkoutSession.client_reference_id)
                if (!team) {
                  const book = await getBook(checkoutSession.client_reference_id)
                  const portrait = await getPortrait(checkoutSession.client_reference_id)
                  if (book) {
                    //enable imagePackage for book
                    await firestore.collection('books').doc(book.id).update({
                      imagePackage: true,
                    })

                    // Send the Slack notification
                    await slack.send({
                      attachments: [
                        {
                          fallback: `New DocsBot AI storybook checkout by ${
                            session.customer_details.name
                          } (${session.customer_details.email}) to ${
                            session.line_items.data[0].description
                          } x${session.line_items.data[0].quantity} for $${
                            session.line_items.data[0].amount_total / 100
                          } ${session.line_items.data[0].currency} one-time!`,
                          color: '#57a35d',
                          title: 'New DocsBot AI Storybook Checkout',
                          text: `${session.line_items.data[0].description} x ${session.line_items.data[0].quantity}`,
                          fields: [
                            {
                              title: 'Customer',
                              value: `${session.customer_details.name} (${session.customer_details.email})`,
                              short: true,
                            },
                            {
                              title: 'Amount',
                              value: `$${session.amount_total / 100} ${session.currency} one-time`,
                              short: true,
                            },
                          ],
                        },
                      ],
                    })
                    console.log(`🔔 Image package enabled for book ${book.id}`)
                  } else if (portrait) {
                    //enable imagePackage for book
                    await firestore.collection('portraits').doc(portrait.id).update({
                      imagePackage: true,
                    })

                    // Send the Slack notification
                    await slack.send({
                      attachments: [
                        {
                          fallback: `New DocsBot AI portrait checkout by ${
                            session.customer_details.name
                          } (${session.customer_details.email}) to ${
                            session.line_items.data[0].description
                          } x${session.line_items.data[0].quantity} for $${
                            session.line_items.data[0].amount_total / 100
                          } ${session.line_items.data[0].currency} one-time!`,
                          color: '#57a35d',
                          title: 'New DocsBot AI Portrait Checkout',
                          text: `${session.line_items.data[0].description} x ${session.line_items.data[0].quantity}`,
                          fields: [
                            {
                              title: 'Customer',
                              value: `${session.customer_details.name} (${session.customer_details.email})`,
                              short: true,
                            },
                            {
                              title: 'Amount',
                              value: `$${session.amount_total / 100} ${session.currency} one-time`,
                              short: true,
                            },
                          ],
                        },
                      ],
                    })
                    console.log(`🔔 Image package enabled for portrait ${portrait.id}`)
                  } else {
                    console.log(`❌ Team not found for checkout session ${checkoutSession.id}`)
                    break
                  }
                } else {
                  //update baseCredits for team
                  const planSources = 80 //todo: get from plan metadata
                  const baseCredits =
                    (team.baseCredits || 0) + session.line_items.data[0].quantity
                  const sourceCredits =
                    (team.sourceCredits || 0) + session.line_items.data[0].quantity * planSources
                  await firestore
                    .collection('teams')
                    .doc(checkoutSession.client_reference_id)
                    .update({ baseCredits, sourceCredits })
                  console.log(
                    `🔔 Base quota updated for team ${team.id} to ${baseCredits}, source quota to ${sourceCredits}`
                  )

                  // Send the Slack notification
                  await slack.send({
                    attachments: [
                      {
                        fallback: `New DocsBot AI checkout by ${session.customer_details.name} (${
                          session.customer_details.email
                        }) to ${session.line_items.data[0].description} x${
                          session.line_items.data[0].quantity
                        } for $${session.line_items.data[0].amount_total / 100} ${
                          session.line_items.data[0].currency
                        } one-time!`,
                        color: '#57a35d',
                        title: 'New DocsBot AI Checkout',
                        text: `${session.line_items.data[0].description} x ${session.line_items.data[0].quantity}`,
                        fields: [
                          {
                            title: 'Customer',
                            value: `${session.customer_details.name} (${session.customer_details.email})`,
                            short: true,
                          },
                          {
                            title: 'Amount',
                            value: `$${session.amount_total / 100} ${session.currency} one-time`,
                            short: true,
                          },
                          {
                            title: 'Base Credits',
                            value: `+${session.line_items.data[0].quantity} (new balance: ${baseCredits})`,
                            short: true,
                          },
                          {
                            title: 'Source Credits',
                            value: `+${
                              session.line_items.data[0].quantity * planSources
                            } (new balance: ${sourceCredits})`,
                            short: true,
                          },
                        ],
                      },
                    ],
                  })
                }
              } else {
                const tempObj = { stripe: session }
                if (bookPlan(tempObj)) {
                  //this is a storybook checkout
                  await storyPurchase(session)
                } else if (portraitPlan(tempObj)) {
                  await portraitPurchase(session)
                } else {
                  console.log(`❌ No product found for checkout session ${checkoutSession.id}`)
                }
              }

              try {
                bentoTrack(null, 'trackPurchase', {
                  email: session.customer_details.email,
                  purchaseDetails: {
                    unique: { key: checkoutSession.id },
                    value: {
                      amount: session.amount_total,
                      currency: session.currency,
                    },
                  },
                  cart: {
                    abandoned_checkout_url: 'https://docsbot.ai/app/account',
                    items: [
                      {
                        product_id: session.line_items.data[0].price.id,
                        product_sku: session.line_items.data[0].price.product,
                        product_name: session.line_items.data[0].description,
                        product_price: session.line_items.data[0].price.unit_amount,
                        quantity: session.line_items.data[0].quantity,
                      },
                    ],
                  },
                })
              } catch (e) {
                console.log('Bento error', e)
              }
            }
            break
          case 'invoice.paid':
            const invoice = event.data.object
            //get team by customer id
            const teamsRef2 = await firestore
              .collection('teams')
              .where('stripeCustomerId', '==', invoice.customer)
              .get()
            if (teamsRef2.empty) {
              throw new Error('No matching team found')
            }
            const team = { id: teamsRef2.docs[0].id, ...teamsRef2.docs[0].data() }

            //expand invoice to get subscription
            const invoiceWithSubscription = await stripe.invoices.retrieve(invoice.id, {
              expand: ['subscription'],
            })

            //save subscription to team in case this comes before updated webhook
            await firestore.collection('teams').doc(team.id).set(
              {
                stripeSubscriptionId: invoiceWithSubscription.subscription.id,
                stripeSubscriptionStatus: invoiceWithSubscription.subscription.status,
                stripeSubscriptionPlan: invoiceWithSubscription.subscription.plan.id,
                stripeSubscriptionPrice: invoiceWithSubscription.subscription.plan.amount,
                stripeSubscriptionCurrency: invoiceWithSubscription.subscription.plan.currency,
                stripeSubscriptionInterval: invoiceWithSubscription.subscription.plan.interval,
                stripeSubscriptionCancelAtPeriodEnd:
                  invoiceWithSubscription.subscription.cancel_at_period_end,
                stripeSubscriptionQuantity: invoiceWithSubscription.subscription.quantity,
              },
              { merge: true }
            )

            //get new team data
            let newTeam = null
            const teamsRef3 = await firestore.collection('teams').doc(team.id).get()
            if (!teamsRef3.empty) {
              newTeam = { id: teamsRef3.id, ...teamsRef3.data() }
            }

            //update baseCredits for team
            const baseCredits =
              stripePlan(newTeam).baseCredits * invoiceWithSubscription.subscription.quantity
            const sourceCredits =
              stripePlan(newTeam).sourceCredits * invoiceWithSubscription.subscription.quantity
            await firestore
              .collection('teams')
              .doc(team.id)
              .set({ baseCredits, sourceCredits }, { merge: true })
            console.log(
              `🔔 Base quota updated for team ${team.id} to ${baseCredits}, source quota to ${sourceCredits}`
            )

            try {
              bentoTrack(teamOwner(newTeam), 'trackPurchase', {
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
            } catch (e) {
              console.log('Error sending bento track', e)
            }

            break

          default:
            throw new Error('Unhandled relevant event!')
        }
      } catch (error) {
        console.log(error)
        return res.status(400).send('Webhook error: "Webhook handler failed. View logs."')
      }
    }

    res.json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default webhookHandler
