import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot, getSourceCountsByStatus } from '@/lib/dbQueries'
import { canUserViewBot } from '@/utils/function.utils'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  configureFirebaseApp()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { team } = check
  const { botId } = req.query

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error?.message })
  }

  if (!canUserViewBot(team, bot, check.userId)) {
    return res.status(403).json({
      message: 'You are not allowed to view sources in this bot.',
    })
  }

  try {
    const counts = await getSourceCountsByStatus(team.id, bot.id)
    return res.json(counts)
  } catch (e) {
    return res.status(500).json({ message: e?.message })
  }
}
