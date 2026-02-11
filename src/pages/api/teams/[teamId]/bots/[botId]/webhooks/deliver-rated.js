import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserManageIntegrations } from '@/utils/function.utils'
import { WEBHOOK_EVENT_CONVERSATION_RATED } from '@/lib/webhooks'
import { deliverWebhookEvent } from '@/lib/webhookDelivery'

const now = new Date().toISOString()

const TEST_RATED_PAYLOAD = {
  event: WEBHOOK_EVENT_CONVERSATION_RATED,
  conversation: {
    id: 'conv_sample_001',
    createdAt: '2026-02-10T15:12:44.000000',
    updatedAt: '2026-02-11T18:45:22.000000',
    metadata: {
      email: 'user@example.com',
      plan: 'pro',
    },
    ip: 'a1b2c3d4e5f6...',
    ratedAt: now,
    rating: 1,
    answerId: 'ans_321',
    resolved: 'confirmed',
    escalated: 'none',
  },
}

export default async function handler(req, res) {
  configureFirebaseApp()

  if (req.method !== 'POST') {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check
  const { botId } = req.query
  const { webhookId } = req.body || {}

  const bot = await getBot(team.id, botId)
  if (!bot) {
    return res.status(404).json({ message: "botId doesn't exist." })
  }

  if (!canUserManageIntegrations(team, userId, bot)) {
    return res.status(403).json({
      message:
        'You are not allowed to deliver conversation webhooks for this bot.',
    })
  }

  const payload = {
    ...TEST_RATED_PAYLOAD,
    teamId: team.id,
    botId,
  }

  const result = await deliverWebhookEvent({
    teamId: team.id,
    botId,
    event: WEBHOOK_EVENT_CONVERSATION_RATED,
    payload,
    webhookId,
  })

  return res.status(200).json(result)
}
