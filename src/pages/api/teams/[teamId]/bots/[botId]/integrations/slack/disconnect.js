import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserEditBot } from '@/utils/function.utils'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { teamId, botId } = req.query

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    //check user is allowed to edit bot or not
    if (!canUserEditBot(team, userId)) {
      return res.status(403).json({
        message: 'You are not allowed to edit this bot.',
      })
    }

    // Update the bot document to remove Slack connection data
    await firestore
      .collection('teams')
      .doc(teamId)
      .collection('bots')
      .doc(botId)
      .update({
        slackBotToken: FieldValue.delete(),
        slackBotUserId: FieldValue.delete(),
        slackTeamId: FieldValue.delete(),
        slackTeamName: FieldValue.delete(),
        slackIsEnterprise: FieldValue.delete(),
        slackEnterpriseId: FieldValue.delete(),
        slackEnterpriseName: FieldValue.delete(),
        slackConnectedAt: FieldValue.delete(),
      })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Slack:', error)
    return res.status(500).json({ message: 'Error disconnecting Slack' })
  }
} 