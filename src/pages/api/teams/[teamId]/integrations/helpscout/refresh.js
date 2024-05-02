import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore } from 'firebase-admin/firestore'
import { QueueIntegration } from '@/lib/service'
import { getTeamIntegrations } from '@/lib/dbQueries'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import { stripePlan } from '@/utils/helpers'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  const integrations =  await getTeamIntegrations(team.id)
  const helpscout = integrations.find((i) => i.id === 'helpscout')

  if (!helpscout) {
    return res.status(403).json({ message: "No Help Scout integration set!"})
  }

  if (req.method === 'POST') {
    // sanity check user permissions
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    }

    // must be pro plan or higher
    if (stripePlan(team).bots < 10) {
      return res.status(402).json({
        message: 'Please upgrade to the Power plan or higher to add integrations.',
      })
    }

    try {
      // mark integration as pending
      const ref = firestore.collection('teams').doc(team.id).collection('integrations').doc('helpscout')
      await ref.update({
        status: 'pending',
      })

      await QueueIntegration(team.id, 'helpscout', helpscout.appID, helpscout.appSecret)
      return res.status(200).json({ newIntegration: {status: 'pending', type: 'helpscout'} })
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  }
}