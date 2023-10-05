import { stripe } from '@/utils/stripe'
import { getURL } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack, teamOwner } from '@/lib/bento'

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
    try {

      if (!team.stripeCustomerId) throw Error('No Customer ID found.')

      /*
      const { url } = await stripe.checkout.sessions.create({
        success_url: `${getURL()}/app/account`,
        cancel_url: `${getURL()}/app/account`,
        line_items: [
          {price: 'price_1MhLooDdpfaJ8tM4FYXi4osM', quantity: 1},
        ],
        customer: team.stripeCustomerId,
        mode: 'subscription',
      });
      */

      const { url } = await stripe.billingPortal.sessions.create({
        customer: team.stripeCustomerId,
        return_url: `${getURL()}/app/account`,
      })

      try {
        bentoTrack(userId, 'track', {
          type: 'openBillingPortal',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.json({ url })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
