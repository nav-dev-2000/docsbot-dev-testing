import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBot, getSource } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
  const { team } = check
  const { botId, sourceId } = req.query

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error?.message })
  }

  if (req.method === 'PUT') {
    return res.status(400).json({ message: 'Source update not implemented' })
  } else if (req.method === 'DELETE') {
    //fail if bot is indexing
    if (['indexing'].includes(bot.status)) {
      return res
        .status(409)
        .json({ message: 'Bot is currently indexing, you can delete sources later.' })
    }

    //delete source from db
    try {
      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('sources').doc(sourceId).delete()

      //track custom prompt
      try {
        bentoTrack(userId, 'deleteSource')
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Source deleted successfully' })
    } catch (error) {
      console.warn('Error deleting source doc:', error)
      return res.status(500).json({ message: error?.message })
    }
    
  } else if (req.method === 'GET') {
    try {
      const source = await getSource(team, bot, sourceId)
      if (source) {
        return res.json(source)
      } else {
        return res.status(404).json({ message: "sourceId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
