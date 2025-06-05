import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore } from 'firebase-admin/firestore'
import { QueueIntegration } from '@/lib/service'
import { getTeamIntegrations } from '@/lib/dbQueries'
import { canUserModifyTeam } from '@/utils/function.utils'
import { integrationTypes } from '@/constants/integrationTypes.constants'
import { isSuperAdmin, checkPlanPermission } from '@/utils/helpers'

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

  if (req.method === 'GET') {
    // return integrations
    const { type } = req.query

    if (type) {
      // grab integration type
      const integrationType = integrationTypes.find((i) => i.id === type)
      if (!integrationType) {
        return res.status(400).json({ message: 'Invalid integration type.' })
      }

      // return integration
      const integrations =  await getTeamIntegrations(team.id)
      const integration = integrations.find((i) => i.id === type)
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found.' })
      }

      //TODO if integration is pending, check if it's been more than 5 minutes and reset/return error if so

      res.status(200).json({ integration })
    } else {
      // return all integrations
      res.status(200).json({ integrations: await getTeamIntegrations(team.id) })
    }
  } else if (req.method === 'PUT') {
    // sanity check user permissions
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    }

    // must be pro plan or higher
    if (!checkPlanPermission(team, 'pro', 'helpscout').allowed) {
      return res.status(402).json({
        message: 'Please upgrade to the Standard plan or higher to add integrations.',
      })
    }

    const { type, appID, appSecret } = req.body

    // grab integration type
    const integrationType = integrationTypes.find((i) => i.id === type)
    if (!integrationType) {
      return res.status(400).json({ message: 'Invalid integration type.' })
    }

    // validate integration fields
    if (integrationType.fieldAppID && !appID) {
      return res.status(400).json({
        message: 'Please provide an App ID.',
      })
    }

    if (integrationType.fieldAppSecret && !appSecret) {
      return res.status(400).json({
        message: 'Please provide an App secret.',
      })
    }

    try {
      // mark integration as pending
      await firestore.collection('teams').doc(team.id).collection('integrations').doc(type).set({
        type,
        status: 'pending',
        appID,
        appSecret,
      })

      await QueueIntegration(team.id, type, appID, appSecret)
      return res.status(200).json({ newIntegration: {status: 'pending', type} })
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    const { type } = req.body

    // grab integration type
    const integrationType = integrationTypes.find((i) => i.id === type)
    if (!integrationType) {
      return res.status(400).json({ message: 'Invalid integration type.' })
    }

    // remove integration
    try {
      await firestore.collection('teams').doc(team.id).collection('integrations').doc(type).delete()
      return res.status(200).json({ message: 'Integration removed.' })
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  }
}