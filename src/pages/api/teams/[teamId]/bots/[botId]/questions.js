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
    let { page, perPage, ascending, filter } = req.query
    perPage = perPage ? parseInt(perPage) : 50
    page = page ? parseInt(page) : 0
    ascending = ascending ? ( ascending === 'true' || ascending === '1' ) : false
    try {
      const questions = await getQuestions(team, botId, perPage, page, ascending, filter)
      return res.json(questions)
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else if (req.method === 'PUT') {
    let { questionId } = req.query
    const { revised } = req.body

    // save sourceId to question
    try {
      const questionRef = firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('questions').doc(questionId)
      await questionRef.update({ revised })

      return res.json({ message: 'success' })
    } catch (error) {
      console.warn('Error updating document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
