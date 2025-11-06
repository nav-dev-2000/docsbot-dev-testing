import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // AuthZ: ensure user can access this team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { team } = check
  const { botId, jobId } = req.query

  // Validate bot exists; also needed for bot.signature when cancelling
  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting bot:', error)
    return res.status(500).json({ message: error?.message || 'Error' })
  }

  const docRef = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .collection('research')
    .doc(jobId)

  if (req.method === 'GET') {
    try {
      const snap = await docRef.get()
      if (!snap.exists) {
        return res.status(404).json({ message: 'Job not found' })
      }
      const data = snap.data() || {}
      return res.json({
        jobId: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
        completedAt: data.completedAt?.toDate?.() || data.completedAt || null,
        cancelledAt: data.deletedAt?.toDate?.() || data.cancelledAt || null,
      })
    } catch (error) {
      console.warn('Error getting job:', error)
      return res.status(500).json({ message: error?.message || 'Error' })
    }
  }

  if (req.method === 'DELETE') {
    // First, try to cancel the external task; ignore non-200 errors
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${botId}/research/${jobId}`
      await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + bot.signature,
        },
      })
    } catch (err) {
      console.warn('Error cancelling external research task:', err)
    }

    // Soft delete: update status to "deleted" instead of actually deleting
    try {
      await docRef.update({
        status: 'deleted',
        cancelledAt: new Date(),
      })
      return res.json({ ok: true })
    } catch (error) {
      console.warn('Error soft deleting job:', error)
      return res.status(500).json({ message: error?.message || 'Error' })
    }
  }

  return res.status(400).json({ message: 'Invalid HTTP method' })
}


