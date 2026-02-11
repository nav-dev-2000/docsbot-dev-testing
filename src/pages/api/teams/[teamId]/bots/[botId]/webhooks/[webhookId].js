import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { canUserManageIntegrations } from '@/utils/function.utils'
import {
  isBlockedWebhookTarget,
  isValidHttpUrl,
  normalizeWebhookDoc,
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
  const { botId, webhookId } = req.query

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

  const normalizedWebhook = bot.webhooks?.[webhookId]
  if (!normalizedWebhook) {
    return res.status(404).json({ message: 'Webhook not found.' })
  }

  if (req.method === 'GET') {
    return res.status(200).json(normalizedWebhook)
  }

  if (req.method === 'PATCH') {
    const rawWebhooks = (await botRef.get()).data()?.webhooks || {}
    const rawWebhook = rawWebhooks[webhookId]
    if (!rawWebhook) {
      return res.status(404).json({ message: 'Webhook not found.' })
    }

    const {
      label,
      status,
      targetUrl,
      expirationDate,
      events: inputEvents,
    } = req.body || {}
    const updates = { updatedAt: Timestamp.now() }

    if (label !== undefined) updates.label = label || null

    if (status !== undefined) {
      if (!['active', 'paused'].includes(status)) {
        return res
          .status(400)
          .json({ message: 'status must be active or paused.' })
      }
      updates.status = status
    }

    if (targetUrl !== undefined) {
      if (!isValidHttpUrl(targetUrl)) {
        return res
          .status(400)
          .json({ message: 'targetUrl must be a valid URL.' })
      }
      if (isBlockedWebhookTarget(targetUrl)) {
        return res.status(400).json({
          message:
            'Webhook targetUrl cannot point to docsbot.ai or docsbot.com.',
        })
      }
      updates.targetUrl = targetUrl
    }

    if (inputEvents !== undefined) {
      const events = normalizeWebhookEvents(inputEvents)
      if (
        !events.length ||
        events.some((item) => !WEBHOOK_EVENTS.includes(item))
      ) {
        return res.status(400).json({
          message: `Unsupported event. Use one of: ${WEBHOOK_EVENTS.join(', ')}.`,
        })
      }
      updates.events = events
    }

    if (expirationDate !== undefined) {
      if (expirationDate === null || expirationDate === '') {
        updates.expirationDate = null
      } else if (Number.isNaN(new Date(expirationDate).getTime())) {
        return res
          .status(400)
          .json({ message: 'expirationDate must be a valid ISO-8601 date.' })
      } else {
        updates.expirationDate = Timestamp.fromDate(new Date(expirationDate))
      }
    }

    const mergedWebhook = {
      ...rawWebhook,
      ...updates,
      updatedAt: Timestamp.now(),
    }

    await botRef.update({
      [`webhooks.${webhookId}`]: mergedWebhook,
      updatedAt: Timestamp.now(),
    })

    return res.status(200).json(normalizeWebhookDoc(webhookId, mergedWebhook))
  }

  if (req.method === 'DELETE') {
    await botRef.update({
      [`webhooks.${webhookId}`]: FieldValue.delete(),
      updatedAt: Timestamp.now(),
    })
    return res.status(200).json({ message: 'success', id: webhookId })
  }

  return res.status(400).json({ message: 'Invalid HTTP method' })
}
