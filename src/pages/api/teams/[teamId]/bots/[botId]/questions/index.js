import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot, getQuestions } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'

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

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  if (req.method === 'GET') {
    let { page, perPage, ip, rating, escalated, couldAnswer, startTime, endTime } = req.query
    perPage = perPage ? parseInt(perPage) : 50
    page = page ? parseInt(page) : 0
    escalated = typeof escalated === "undefined" ? null : escalated ? ( escalated === 'true' || escalated === '1' ) : false
    couldAnswer = typeof couldAnswer === "undefined" ? null : couldAnswer ? (couldAnswer === 'true' || couldAnswer === '1') : false
    rating = typeof rating === "undefined" ? null : rating ? parseInt(rating) : 0
    try {
      const questions = await getQuestions(team, botId, perPage, page, ip, rating, escalated, couldAnswer, startTime, endTime)
      return res.json(questions)
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
