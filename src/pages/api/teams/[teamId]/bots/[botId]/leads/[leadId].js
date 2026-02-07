import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
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
  const { botId, leadId } = req.query

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting bot:', error)
    return res.status(500).json({ message: error })
  }

  if (!canUserEditBot(team, userId, bot)) {
    return res.status(403).json({ message: 'User does not have permission to delete leads' })
  }

  if (req.method === 'DELETE') {
    try {
      const leadRef = firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('leads')
        .doc(leadId)

      await leadRef.delete()
      return res.json({ message: 'success' })
    } catch (error) {
      console.warn('Error deleting lead document:', error)
      return res.status(500).json({ message: error?.message || 'Failed to delete lead' })
    }
  }

  return res.status(400).json({ message: 'Invalid HTTP method' })
}
