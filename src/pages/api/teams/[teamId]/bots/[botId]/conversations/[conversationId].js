import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot, getConversation } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserEditBot } from '@/utils/function.utils'

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
  const { botId, conversationId } = req.query

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  if (req.method === 'GET') {
    try {
      const conversation = await getConversation(team.id, botId, conversationId)
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" })
      }

      return res.json(conversation)
    } catch (error) {
      console.warn('Error getting conversation:', error)
      return res.status(500).json({ message: 'Failed to fetch conversation' })
    }
  } else if (req.method === 'DELETE') {
    if (!canUserEditBot(team, userId)) {
      return res.status(403).json({ message: 'User does not have permission to delete conversations' })
    }
    
    try {
      const conversationRef = firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('conversations')
        .doc(conversationId)

      await conversationRef.delete()

      return res.json({ message: 'success' })
    } catch (error) {
      console.warn('Error deleting conversation:', error)
      return res.status(500).json({ message: 'Failed to delete conversation' })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
} 