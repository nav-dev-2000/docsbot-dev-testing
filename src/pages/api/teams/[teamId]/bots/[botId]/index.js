import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import { deleteBot } from '@/lib/apiFunctions'
import { validateBotParams } from '@/lib/apiFunctions'
import { canUserCreateDeleteBot, canUserEditBot, canUserManageBotSettings, canUserViewBot } from '@/utils/function.utils'
import { clearCloudflareCache } from '@/lib/cloudflare'
import { isBotSourcesFrozen } from '@/lib/maintenance'

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
    // fetch bot first
    let bot
    try {
      bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' })
      }
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }

    const canManageSettings = canUserManageBotSettings(team, userId, bot)
    const canEditPrompt = canUserEditBot(team, userId, bot)
    const promptFields = ['customPrompt', 'agentPrompt', 'helpscoutPrompt']
    const bodyKeys = Object.keys(req.body || {})

    if (!canManageSettings) {
      if (!canEditPrompt) {
        return res.status(403).json({
          message: 'You are not allowed to edit this bot.',
        })
      }

      const disallowedKeys = bodyKeys.filter((key) => !promptFields.includes(key))
      if (disallowedKeys.length > 0) {
        return res.status(403).json({
          message: 'You are only allowed to edit bot prompts.',
        })
      }

      req = { ...req, body: Object.fromEntries(promptFields.map((key) => [key, req.body[key]])) }
    }
    try {
      let botData = {}
      try {
        botData = await validateBotParams(req, team, userId, true, bot)
      } catch (error) {
        return res.status(400).json({ message: error?.message })
      }

      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).update(botData)

      // Clear Cloudflare cache after updating the bot (asynchronously)
      await clearCloudflareCache(team.id, botId);

      try {
        bentoTrack(userId, 'track', {
          type: 'updateBot',
          botName: botData.name || bot.name,
        })
        phTrack(userId, 'Bot Updated', {
          'Bot name': botData.name || bot.name,
        }, team.id)
      } catch (e) {
        console.log('Error sending tracking', e)
      }

      return res.status(200).json(await getBot(team.id, botId))
    } catch (error) {
      console.warn('Error:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    //check user is allowed to delete bot or not (team-level permission)
    if (!canUserCreateDeleteBot(team, userId)) {
      return res.status(403).json({
        message: 'You are not allowed to delete bot.',
      })
    }
    const bot = await getBot(team.id, botId)
    if (bot && isBotSourcesFrozen(bot)) {
      return res.status(503).json({
        message: 'This bot is undergoing short maintenance. Please try again later.',
      })
    }
    try {
      const deleteResult = await deleteBot(team.id, botId)
      if (!deleteResult) {
        return res.status(404).json({ message: 'Bot not found' })
      }

      // Clear Cloudflare cache after deleting the bot (asynchronously)
      await clearCloudflareCache(team.id, botId);

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBot',
        })
        
        phTrack(userId, 'Bot Deleted', {}, team.id)
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
      if (!bot) {
        return res.status(404).json({ message: "botId doesn't exist." })
      }
      
      // Check per-bot permission to view bot
      if (!canUserViewBot(team, bot, userId)) {
        return res.status(403).json({
          message: 'You are not allowed to view this bot.',
        })
      }
      
      return res.json(bot)
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
