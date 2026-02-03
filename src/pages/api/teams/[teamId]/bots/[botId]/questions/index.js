import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot, getQuestions } from '@/lib/dbQueries'
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
      message: 'You are not allowed to view questions in this bot.',
    })
  }

  if (req.method === 'GET') {
    let { page, perPage, ip, rating, escalated, couldAnswer, startDate, endDate, startTime, endTime } = req.query
    if (!startDate && !endDate) {
      // make sure we respect old 'startTime' and 'endTime' params
      startDate = startTime
      endDate = endTime
    }
    perPage = perPage ? parseInt(perPage) : 50
    page = page ? parseInt(page) : 0
    escalated = typeof escalated === "undefined" ? null : escalated ? ( escalated === 'true' || escalated === '1' ) : false
    couldAnswer = typeof couldAnswer === "undefined" ? null : couldAnswer ? (couldAnswer === 'true' || couldAnswer === '1') : false
    rating = typeof rating === "undefined" ? null : rating ? parseInt(rating) : 0
    try {
      const questions = await getQuestions(team, botId, perPage, page, ip, rating, escalated, couldAnswer, startDate, endDate)
      return res.json(questions)
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
