import crypto from 'crypto'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { isBlockedWebhookTarget, mapWebhookEntries } from '@/lib/webhooks'

const firestore = getFirestore()

export const sendWebhook = async (webhook, payload, signatureKey) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const body = JSON.stringify(payload)
  const headers = {
    'Content-Type': 'application/json',
    'X-DocsBot-Event': payload.event,
  }

  if (signatureKey) {
    const hmac = crypto.createHmac('sha256', signatureKey)
    hmac.update(body)
    headers['X-DocsBot-Signature'] = `sha256=${hmac.digest('hex')}`
  }

  try {
    const response = await fetch(webhook.targetUrl, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return {
      ok: response.ok,
      status: response.status,
      body: await response.text(),
    }
  } catch (error) {
    clearTimeout(timeout)
    return {
      ok: false,
      status: null,
      body: error?.message || 'Unknown delivery error',
    }
  }
}

export const deliverWebhookEvent = async ({
  teamId,
  botId,
  event,
  payload,
  webhookId: targetWebhookId,
}) => {
  const botRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)

  const botSnap = await botRef.get()
  if (!botSnap.exists) {
    return {
      delivered: 0,
      failed: 0,
      deliveries: [],
    }
  }

  const botData = botSnap.data() || {}
  let signatureKey = botData.signatureKey

  if (!signatureKey) {
    signatureKey = crypto.randomBytes(32).toString('hex')
    await botRef.update({ signatureKey })
  }

  const webhookMap = mapWebhookEntries(botData.webhooks)
  let eligibleWebhooks = Object.values(webhookMap).filter(
    (webhook) =>
      webhook.status === 'active' &&
      webhook.events.includes(event) &&
      !isBlockedWebhookTarget(webhook.targetUrl),
  )

  if (targetWebhookId) {
    eligibleWebhooks = eligibleWebhooks.filter(
      (webhook) => webhook.id === targetWebhookId,
    )
  }

  const deliveries = await Promise.all(
    eligibleWebhooks.map(async (webhook) => {
      const result = await sendWebhook(webhook, payload, signatureKey)

      await botRef.update({
        [`webhooks.${webhook.id}.updatedAt`]: Timestamp.now(),
        [`webhooks.${webhook.id}.lastTriggeredAt`]: Timestamp.now(),
        [`webhooks.${webhook.id}.lastResponseStatus`]: result.status,
        [`webhooks.${webhook.id}.lastError`]: result.ok ? null : result.body,
      })

      return {
        webhookId: webhook.id,
        targetUrl: webhook.targetUrl,
        status: result.status,
        ok: result.ok,
        response: result.body?.slice(0, 500),
      }
    }),
  )

  return {
    delivered: deliveries.filter((item) => item.ok).length,
    failed: deliveries.filter((item) => !item.ok).length,
    deliveries,
  }
}
