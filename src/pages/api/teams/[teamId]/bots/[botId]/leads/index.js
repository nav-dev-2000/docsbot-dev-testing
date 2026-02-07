import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot, getLeads } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserViewBot } from '@/utils/function.utils'

export default async function handler(req, res) {
  configureFirebaseApp()

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
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  if (!canUserViewBot(team, bot, userId)) {
    return res.status(403).json({
      message: 'You are not allowed to view leads in this bot.',
    })
  }

  if (req.method === 'GET') {
    let { page, perPage, startDate, endDate, startTime, endTime } = req.query
    if (!startDate && !endDate) {
      startDate = startTime
      endDate = endTime
    }
    perPage = perPage ? parseInt(perPage) : 50
    page = page ? parseInt(page) : 0

    try {
      const leads = await getLeads(team, botId, perPage, page, startDate, endDate)
      return res.json(leads)
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error.message })
    }
  }

  return res.status(400).json({ message: 'Invalid HTTP method' })
}
