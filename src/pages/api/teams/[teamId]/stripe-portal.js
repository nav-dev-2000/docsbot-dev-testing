import { stripe } from '@/utils/stripe'
import { getURL, getNeededStripeProduct } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import { getInvitesFromTeam } from '@/lib/dbQueries'
import * as cookie from 'cookie'
import { canUserManageBilling } from '@/utils/function.utils'

export default async function createCheckoutSession(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  if (!canUserManageBilling(team, userId)) {
    return res.status(403).json({
      message: 'Unauthorized action; please contact your team owner.',
    })
  }

  if (req.method === 'POST') {
    const { tier, frequency, email, upgrade } = req.body

    try {
      if (tier && !upgrade) {
        const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
        const price = plans[tier]?.prices?.current?.[frequency]
        const teamInvites = await getInvitesFromTeam(team.id)

        if (!price) throw Error('Please select a valid plan.')

        const planLimits = plans[tier]
        if (
          team?.botCount > planLimits.bots ||
          team?.pageCount >= planLimits.pages ||
          team?.questionCount >= planLimits.questions ||
          Object.keys(team?.roles || {}).length + teamInvites.length > planLimits.teamMembers
        ) {
          throw Error('This plan does not fit your current usage.')
        }

        const params = {
          success_url: `${getURL()}/app/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getURL()}/app/account`,
          line_items: [{ price, quantity: 1 }],
          client_reference_id: team.id,
          allow_promotion_codes: true,
          mode: 'subscription',
        }
        const cookies = cookie.parse(req.headers.cookie || '')
        const couponId = cookies['docsbot_coupon']
        const hasSubscription =
          team.stripeCustomerId &&
          ['active', 'trialing', 'past_due', 'incomplete'].includes(
            team.stripeSubscriptionStatus
          )
        if (team.stripeCustomerId) {
          params.customer = team.stripeCustomerId
        } else {
          params.tax_id_collection = { enabled: true }
          params.customer_email = email
          if (team.canTrial) {
            params.subscription_data = {
              trial_period_days: 14,
            }
          }
        }
        if (couponId && !hasSubscription) {
          delete params.allow_promotion_codes
          if (couponId === 'paul-higgins') {
            params.subscription_data = {
              ...(params.subscription_data || {}),
              trial_period_days: 30,
            }
          } else {
            params.discounts = [{ coupon: couponId }]
          }
        }

        //cyber monday
        /*
        if (frequency === 'annually') {
          delete params.allow_promotion_codes
          params.discounts = [{coupon: '5BvogbZc'}] //41% off
        } else {
          delete params.allow_promotion_codes
          params.discounts = [{coupon: '6kMHwH8t'}] //25% off
        }
        */

        const { url } = await stripe.checkout.sessions.create(params)

        try {
          bentoTrack(userId, 'track', {
            type: 'openCheckout',
            tier,
            frequency,
          })
          phTrack(userId, 'Checkout Started', {
            tier,
            frequency,
          }, team.id)
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      } else {
        if (!team.stripeCustomerId) throw Error('No Customer ID found.')

        const { data } = await stripe.billingPortal.configurations.list({
          expand: ['data.features.subscription_update.products'],
          active: true,
          is_default: false,
          limit: 100,
        })

        const teamInvites = await getInvitesFromTeam(team.id)
        const neededProducts = getNeededStripeProduct(team, teamInvites)

        const sanitizeSubscriptionUpdateFeatures = (features) => {
          if (!features?.subscription_update) return features
          const subscriptionFeatures = features.subscription_update
          if (
            subscriptionFeatures.billing_cycle_anchor === '' ||
            subscriptionFeatures.billing_cycle_anchor === null
          ) {
            delete subscriptionFeatures.billing_cycle_anchor
          }
          return features
        }

        // If upgrading to a specific tier, validate the target tier can support current usage
        if (upgrade && tier) {
          const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
          const interval = team.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
          const targetPriceId = plans?.[tier]?.prices?.current?.[interval]
          
          if (targetPriceId) {
            const allPrices = neededProducts.flat()
            if (!allPrices.includes(targetPriceId)) {
              throw Error('Your current usage exceeds the limits of your current and selected plan. Please select a higher tier plan to upgrade to.')
            }
          }
        }

        //This command will disable non-default portal configs: stripe billing_portal configurations list --active=true --is-default=false | jq -r '.data[].id' | xargs -I {} stripe billing_portal configurations update {} --active=false

        const getConfigId = async (currentConfigs, neededProducts) => {
          let configId = ''
          if (neededProducts) {
            currentConfigs.map((item) => {
              if (
                item?.features?.subscription_update?.products?.length === neededProducts?.length
              ) {
                const isPriceAvailable = item?.features?.subscription_update?.products
                  ?.map((product, index) => {
                    return product.prices?.every((item) => neededProducts?.flat().includes(item))
                  })
                  .every((value) => value === true)
                if (isPriceAvailable) {
                  configId = item.id
                }
              }
            })
            if (!configId) {
              const { data } = await stripe.billingPortal.configurations.list({
                expand: ['data.features.subscription_update.products', 'data.business_profile'],
                is_default: true,
              })
              let existingConfig = JSON.parse(JSON.stringify(data[0]))
              const newProducts = []
              existingConfig.features?.subscription_update?.products.map((product) => {
                if (neededProducts.flat()?.includes(product.prices[0])) {
                  if (
                    product?.adjustable_quantity &&
                    (product.adjustable_quantity.maximum === null ||
                      product.adjustable_quantity.maximum === '')
                  ) {
                    product.adjustable_quantity = { enabled: false }
                  }
                  newProducts.push(product)
                }
              })
              if (newProducts.length) {
                existingConfig.features.subscription_update.products = newProducts
              }
              const newConfig = await stripe.billingPortal.configurations?.create({
                business_profile: {
                  privacy_policy_url: 'https://docsbot.ai/legal/privacy-policy',
                  terms_of_service_url: 'https://docsbot.ai/legal/terms-of-service',
                },
                features: sanitizeSubscriptionUpdateFeatures(existingConfig.features),
              })
              configId = newConfig?.id
              console.log('New portal config created', configId)
            } else {
              console.log('Existing portal config found', configId)
            }
          }
          return configId
        }

        const configId = await getConfigId(data, neededProducts)

        let sessionConfig = {
          customer: team.stripeCustomerId,
          return_url: `${getURL()}/app/account`,
        }
        if (configId) {
          sessionConfig['configuration'] = configId
        }
        if (upgrade) {
          if (!team.stripeSubscriptionId) {
            throw Error('No subscription found for upgrade.')
          }

          if (tier) { //loyalty discount sale
            const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId)
            const subscriptionItem = subscription?.items?.data?.[0]

            if (!subscriptionItem) {
              throw Error('Unable to locate subscription item for upgrade.')
            }

            const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
            const interval = team.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
            const targetPriceId = plans?.[tier]?.prices?.current?.[interval]

            if (!targetPriceId) {
              throw Error('Unable to determine upgrade price.')
            }

            let loyaltyCoupons;
            if (process.env.NODE_ENV !== 'development') {
              loyaltyCoupons = {
                standard: { month: 'R3YT5qyO' },
                business: { month: '0L0eu61M', year: '6Clm8zIr' },
              }
            } else {
              loyaltyCoupons = {
                standard: { month: '0uJbTqYQ' },
                business: { month: 'mnS353ze', year: 'MdcbxKHm' },
              }
            }

            const coupon = loyaltyCoupons?.[tier]?.[team.stripeSubscriptionInterval]

            const flowData = {
              type: 'subscription_update_confirm',
              subscription_update_confirm: {
                subscription: team.stripeSubscriptionId,
                items: [
                  {
                    id: subscriptionItem.id,
                    price: targetPriceId,
                    quantity: subscriptionItem.quantity || 1,
                  },
                ],
              },
            }

            if (coupon) {
              flowData.subscription_update_confirm.discounts = [{ coupon }]
            }

            sessionConfig['flow_data'] = flowData
          } else {
            sessionConfig['flow_data'] = {
              type: 'subscription_update',
              subscription_update: {
                subscription: team.stripeSubscriptionId,
              },
            }
          }
        }
        const { url } = await stripe.billingPortal.sessions.create(sessionConfig)

        try {
          bentoTrack(userId, 'track', {
            type: 'openBillingPortal',
          })
          
          phTrack(userId, 'Billing Portal Opened', {}, team.id)
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      }
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else if (req.method === 'DELETE') {
    if (!team.stripeCustomerId || !team.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found.' })
    }

    const { reason, details } = req.body

    try {
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: {
          feedback: reason,
          comment: details,
        },
      })

      try {
        bentoTrack(userId, 'track', {
          type: 'cancelSubscription',
        })
        
        phTrack(userId, 'Subscription Canceled', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Subscription canceled' })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else if (req.method === 'PUT') {
    if (!team.stripeCustomerId || !team.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found.' })
    }

    try {
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        cancel_at_period_end: false,
      })

      try {
        bentoTrack(userId, 'track', {
          type: 'renewedSubscription',
        })
        
        phTrack(userId, 'Subscription Renewed', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Subscription renewed' })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}