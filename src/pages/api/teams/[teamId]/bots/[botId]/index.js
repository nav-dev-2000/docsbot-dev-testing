import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { mpTrack } from '@/lib/mixpanel'
import { deleteBot } from '@/lib/apiFunctions'
import { validateBotParams } from '@/lib/apiFunctions'
import { canUserEditBot, canUserCreateDeleteBot } from '@/utils/function.utils'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'PUT') {
    //check user is allowed to edit bot or not
    if (!canUserEditBot(team, userId)) {
      return res.status(402).json({
        message: 'You are not allowed to edit this bot.',
      })
    }
    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' })
      }

      let botData = {}
      try {
        botData = await validateBotParams(req, team, userId, true, bot)
      } catch (error) {
        return res.status(400).json({ message: error?.message })
      }

      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).update(botData)

      try {
        bentoTrack(userId, 'track', {
          type: 'updateBot',
          botName: botData.name || bot.name,
        })
        mpTrack(userId, 'Updated Bot', {
          'Bot name': botData.name || bot.name,
          ip: req.headers['x-forwarded-for'],
        })
      } catch (e) {
        console.log('Error sending tracking', e)
      }

      return res.status(200).json(await getBot(team.id, botId))
    } catch (error) {
      console.warn('Error:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    //check user is allowed to delete bot or not
    if (!canUserCreateDeleteBot(team, userId)) {
      return res.status(402).json({
        message: 'You are not allowed to delete bot.',
      })
    }
    try {
      const deleteResult = await deleteBot(team.id, botId)
      if (!deleteResult) {
        return res.status(404).json({ message: 'Bot not found' })
      }

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBot',
        })
        mpTrack(userId, 'Deleted Bot', { ip: req.headers['x-forwarded-for'] })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Bot deleted' })
    } catch (error) {
      console.warn('Error deleting bot:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    try {
      const bot = await getBot(team.id, botId)
      if (bot) {
        return res.json(bot)
      } else {
        // doc.data() will be undefined in this case
        return res.status(404).json({ message: "botId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
