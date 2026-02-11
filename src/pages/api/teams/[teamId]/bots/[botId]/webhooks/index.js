import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { canUserManageIntegrations } from '@/utils/function.utils'
import {
  createWebhookPayload,
  isBlockedWebhookTarget,
  isValidHttpUrl,
  mapWebhookEntries,
  WEBHOOK_EVENT_LEAD_CREATED,
  WEBHOOK_EVENTS,
  normalizeWebhookEvents,
} from '@/lib/webhooks'

const firestore = getFirestore()

export default async function handler(req, res) {
  configureFirebaseApp()

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
    if (!bot) return res.status(404).json({ message: "botId doesn't exist." })
  } catch (error) {
    return res
      .status(500)
      .json({ message: error?.message || 'Unable to load bot.' })
  }

  if (!canUserManageIntegrations(team, userId, bot)) {
    return res
      .status(403)
      .json({ message: 'You are not allowed to manage webhooks for this bot.' })
  }

  const botRef = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)

  if (req.method === 'GET') {
    const webhooks = Object.values(bot.webhooks || {})
    return res.status(200).json({ webhooks })
  }

  if (req.method === 'POST') {
    const {
      targetUrl,
      event = WEBHOOK_EVENT_LEAD_CREATED,
      events: inputEvents,
      expirationDate,
    } = req.body || {}
    const events = normalizeWebhookEvents(inputEvents, event)

    if (!targetUrl || !isValidHttpUrl(targetUrl)) {
      return res.status(400).json({ message: 'A valid targetUrl is required.' })
    }
    if (isBlockedWebhookTarget(targetUrl)) {
      return res.status(400).json({
        message:
          'Webhook targetUrl cannot point to docsbot.ai or docsbot.com.',
      })
    }

    if (
      !events.length ||
      events.some((item) => !WEBHOOK_EVENTS.includes(item))
    ) {
      return res.status(400).json({
        message: `Unsupported event. Use one of: ${WEBHOOK_EVENTS.join(', ')}.`,
      })
    }

    if (expirationDate && Number.isNaN(new Date(expirationDate).getTime())) {
      return res
        .status(400)
        .json({ message: 'expirationDate must be a valid ISO-8601 date.' })
    }

    const webhookId = botRef.collection('_').doc().id
    const payload = createWebhookPayload(
      { ...req.body, events },
      userId,
      Timestamp,
    )

    await botRef.update({
      [`webhooks.${webhookId}`]: payload,
      updatedAt: Timestamp.now(),
    })

    const webhook = Object.values(
      mapWebhookEntries({ [webhookId]: payload }),
    )[0]

    return res.status(201).json(webhook)
  }

  return res.status(400).json({ message: 'Invalid HTTP method' })
}
