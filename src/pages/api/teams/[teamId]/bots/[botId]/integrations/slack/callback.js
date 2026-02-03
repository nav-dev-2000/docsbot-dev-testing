import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { canUserManageIntegrations } from '@/utils/function.utils'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { team, userId } = check
  const { teamId, botId } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    if (!canUserManageIntegrations(team, userId, bot)) {
      return res.status(403).json({
        message: 'You are not allowed to manage integrations for this bot.',
      })
    }

    // Placeholder: In a real implementation, verify state, exchange code for token, store fields
    // We simply redirect back to bot settings page
    return res.redirect(302, `/app/bots/${botId}/widget`)
  } catch (error) {
    console.error('Slack callback error:', error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
} 