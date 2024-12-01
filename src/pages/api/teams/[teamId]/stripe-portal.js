import { stripe } from '@/utils/stripe'
import { getURL, getNeededStripeProduct } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack, teamOwner } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'

export default async function createCheckoutSession(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  //TODO check if their role has billing access

  if (req.method === 'POST') {
    const { tier, frequency, email } = req.body

    try {
      if (tier) {
        const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
        const price = plans[tier]?.prices?.current?.[frequency]

        if (!price) throw Error('Please select a valid plan.')

        const planLimits = plans[tier]
        if (
          team?.botCount > planLimits.bots ||
          team?.pageCount >= planLimits.pages ||
          team?.questionCount >= planLimits.questions
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

        const neededProducts = getNeededStripeProduct(team)

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
                features: existingConfig.features,
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