import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
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
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  // Check per-bot permission to view bot
  if (!canUserViewBot(team, bot, userId)) {
    return res.status(403).json({
      message: 'You are not allowed to view research jobs in this bot.',
    })
  }

  if (req.method === 'GET') {
    let { page, perPage } = req.query
    perPage = perPage ? parseInt(perPage) : 25
    page = page ? parseInt(page) : 0

    try {
      const baseRef = firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('research')

      // Fetch all documents and filter out deleted in memory
      // (Firestore doesn't support != queries on the same field with orderBy)
      const snapshot = await baseRef
        .orderBy('createdAt', 'desc')
        .get()

      // Filter out documents with status "deleted" (failed tasks are still shown)
      const allJobs = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            jobId: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            completedAt: data.completedAt?.toDate?.() || data.completedAt,
          }
        })
        .filter((job) => job.status !== 'deleted')

      // Count total (excluding deleted)
      const totalCount = allJobs.length

      // Paginate the filtered results
      const startIndex = page * perPage
      const endIndex = startIndex + perPage
      const jobs = allJobs.slice(startIndex, endIndex)

      return res.json({
        jobs,
        pagination: {
          perPage,
          page,
          viewableCount: totalCount,
          totalCount,
          hasMorePages: (page + 1) * perPage < totalCount,
        },
      })
    } catch (error) {
      console.warn('Error getting research tasks:', error)
      return res.status(500).json({ message: error.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}

 