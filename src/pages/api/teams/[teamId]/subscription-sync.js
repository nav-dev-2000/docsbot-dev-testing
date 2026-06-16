import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserManageBilling } from '@/utils/function.utils'
import { syncTeamBillingFromStripe } from '@/utils/billingSubscriptionSync'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Invalid HTTP method' })
  }

  configureFirebaseApp()

  let check
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(error?.statusCode || 403).json({ message: error?.message })
  }

  const { team, userId } = check
  if (!canUserManageBilling(team, userId)) {
    return res.status(403).json({
      message: 'Unauthorized action; please contact your team owner.',
    })
  }

  try {
    const teamBilling = await syncTeamBillingFromStripe({
      team,
      subscriptionId: req.body?.subscriptionId || team?.stripeSubscriptionId,
    })

    if (!teamBilling) {
      return res.status(200).json({ teamBilling: null, skipped: true })
    }

    await getFirestore().collection('teams').doc(team.id).update(teamBilling)

    return res.status(200).json({ teamBilling })
  } catch (error) {
    console.log(error)
    return res
      .status(error?.statusCode || 500)
      .json({ message: error?.message || 'Unable to sync subscription billing.' })
  }
}
