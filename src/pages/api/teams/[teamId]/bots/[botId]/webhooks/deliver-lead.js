import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore } from 'firebase-admin/firestore'
import { canUserManageIntegrations } from '@/utils/function.utils'
import { WEBHOOK_EVENT_LEAD_CREATED } from '@/lib/webhooks'
import { deliverWebhookEvent } from '@/lib/webhookDelivery'

const firestore = getFirestore()

const TEST_LEAD_PAYLOAD = {
  id: 'test_lead_sample',
  createdAt: new Date().toISOString(),
  updatedAt: null,
  metadata: {
    name: 'Test User',
    email: 'test@example.com',
    company: 'Acme Corp',
  },
  ip: null,
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
  const { leadId, webhookId } = req.body || {}

  const bot = await getBot(team.id, botId)
  if (!bot) {
    return res.status(404).json({ message: "botId doesn't exist." })
  }

  if (!canUserManageIntegrations(team, userId, bot)) {
    return res.status(403).json({
      message: 'You are not allowed to deliver lead webhooks for this bot.',
    })
  }

  let payload

  if (leadId) {
    const leadRef = firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('leads')
      .doc(leadId)

    const leadSnap = await leadRef.get()
    if (!leadSnap.exists) {
      return res.status(404).json({ message: 'Lead not found.' })
    }

    const leadData = leadSnap.data() || {}
    const createdAt =
      typeof leadData?.createdAt?.toDate === 'function'
        ? leadData.createdAt.toDate().toISOString()
        : null
    const updatedAt =
      typeof leadData?.updatedAt?.toDate === 'function'
        ? leadData.updatedAt.toDate().toISOString()
        : null

    payload = {
      event: WEBHOOK_EVENT_LEAD_CREATED,
      botId,
      teamId: team.id,
      lead: {
        id: leadSnap.id,
        createdAt,
        updatedAt,
        metadata: leadData.metadata || {},
        ip: leadData.ip || null,
      },
    }
  } else {
    payload = {
      event: WEBHOOK_EVENT_LEAD_CREATED,
      botId,
      teamId: team.id,
      lead: TEST_LEAD_PAYLOAD,
    }
  }

  const result = await deliverWebhookEvent({
    teamId: team.id,
    botId,
    event: WEBHOOK_EVENT_LEAD_CREATED,
    payload,
    webhookId,
  })

  return res.status(200).json(result)
}
