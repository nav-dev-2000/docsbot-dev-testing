import { stripe } from '@/utils/stripe'
import { getURL } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack, teamOwner } from '@/lib/bento'
import { mpTrack } from '@/lib/mixpanel'

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
        if (team?.botCount >= planLimits.bots || team?.pageCount >= planLimits.pages || team?.questionCount >= planLimits.questions) {
          throw Error('This plan does not fit your current usage.')
        }
        
        const params = {
          success_url: `${getURL()}/app/account`,
          cancel_url: `${getURL()}/app/account`,
          line_items: [{ price, quantity: 1 }],
          client_reference_id: team.id,
          allow_promotion_codes: true,
          mode: 'subscription',
        }
        if (team.stripeCustomerId) {
          params.customer = team.stripeCustomerId
        } else {
          params.customer_email = email
        }

        const { url } = await stripe.checkout.sessions.create(params)

        try {
          bentoTrack(userId, 'track', {
            type: 'openCheckout',
            tier,
            frequency
          })
          mpTrack(userId, 'Started checkout', {
            ip: req.headers['x-forwarded-for'],
            tier,
            frequency
          })
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      } else {
        if (!team.stripeCustomerId) throw Error('No Customer ID found.')

        //TODO set a specific portal config to prevent downgrading to incompatible plans

        const { url } = await stripe.billingPortal.sessions.create({
          customer: team.stripeCustomerId,
          return_url: `${getURL()}/app/account`,
        })

        try {
          bentoTrack(userId, 'track', {
            type: 'openBillingPortal',
          })
          mpTrack(userId, 'Opened Billing Portal', { ip: req.headers['x-forwarded-for'] })
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      }
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
