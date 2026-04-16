/**
 * Server-only: validates webhook target URLs before Firestore writes.
 * Kept separate from `@/lib/webhooks` so client bundles (e.g. WebhooksContent) never pull in `node:dns`.
 */

import {
  isBlockedWebhookTarget,
  isValidHttpUrl,
} from '@/lib/webhooks'
import { validateOutboundFetchUrl } from '@/utils/outboundUrlValidation'

/**
 * @param {string} targetUrl
 * @returns {Promise<{ ok: true, normalizedUrl: string } | { ok: false, message: string }>}
 */
export async function validateWebhookTargetUrlForSave(targetUrl) {
  if (!targetUrl || !isValidHttpUrl(targetUrl)) {
    return { ok: false, message: 'A valid targetUrl is required.' }
  }
  if (isBlockedWebhookTarget(targetUrl)) {
    return {
      ok: false,
      message: 'Webhook targetUrl cannot point to docsbot.ai or docsbot.com.',
    }
  }
  const outbound = await validateOutboundFetchUrl(targetUrl)
  if (!outbound.valid) {
    return { ok: false, message: outbound.error }
  }
  return { ok: true, normalizedUrl: outbound.normalizedUrl }
}
