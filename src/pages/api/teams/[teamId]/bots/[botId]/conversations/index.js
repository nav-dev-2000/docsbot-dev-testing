import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot, getConversations } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserViewBot } from '@/utils/function.utils'

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
  const { botId } = req.query

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  // Check per-bot permission to view bot
  if (!canUserViewBot(team, bot, userId)) {
    return res.status(403).json({
      message: 'You are not allowed to view conversations in this bot.',
    })
  }

  if (req.method === 'GET') {
    let { page, perPage, ip, resolved, escalated } = req.query
    perPage = perPage ? parseInt(perPage) : 25
    page = page ? parseInt(page) : 0
    escalated = typeof escalated === "undefined" ? null : escalated ? (escalated === 'true' || escalated === '1') : false
    resolved = typeof resolved === "undefined" ? null : resolved ? (resolved === 'true' || resolved === '1') : false

    try {
      const conversations = await getConversations(team, botId, perPage, page, ip, resolved, escalated)
      return res.json(conversations)
    } catch (error) {
      console.warn('Error getting conversations:', error)
      return res.status(500).json({ message: error.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
} 