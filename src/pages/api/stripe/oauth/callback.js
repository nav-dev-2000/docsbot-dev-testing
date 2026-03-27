import crypto from 'crypto'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import {
  OBSOLETE_STRIPE_TOOL_METADATA_KEYS,
  STRIPE_OAUTH_CALLBACK_PATH,
  STRIPE_OAUTH_POSTMESSAGE_TYPE,
} from '@/lib/stripeConnect'

const redirectWithParams = (res, url, params) => {
  const target = new URL(url)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      target.searchParams.set(key, String(value))
    }
  })
  res.redirect(target.toString())
}

const parseStripeOAuthState = (state) => {
  try {
    return JSON.parse(
      Buffer.from(String(state || ''), 'base64url').toString('utf8'),
    )
  } catch (_) {
    return null
  }
}

const serializeForInlineScript = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const buildStripeOAuthPopupHtml = ({ success, reason, teamId, botId }) => {
  const message = {
    type: STRIPE_OAUTH_POSTMESSAGE_TYPE,
    success: Boolean(success),
    reason: reason != null ? String(reason) : '',
    teamId: teamId != null ? String(teamId) : '',
    botId: botId != null ? String(botId) : '',
  }
  const payload = serializeForInlineScript(message)
  const title = success ? 'Stripe connected' : 'Stripe connection failed'
  const heading = success ? 'Connected' : 'Something went wrong'
  const headingColor = success ? '#38a169' : '#e53e3e'
  const bodyText = success
    ? 'You can close this window and return to DocsBot.'
    : `${escapeHtml(reason || 'Authorization did not complete.')}. Close this window when you are done — details are in the browser console (F12).`

  const closeScript = success
    ? `
        setTimeout(function () {
          try { window.close(); } catch (e) {}
        }, 400);`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; flex-direction: column; background-color: #1a202c; }
      .message-container { max-width: 520px; text-align: center; padding: 1.5rem; }
      h1 { color: ${headingColor}; font-size: 1.5rem; font-weight: bold; margin: 0 0 1rem; }
      p { color: #d1d5db; margin: 0; font-size: 1rem; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="message-container">
      <h1>${heading}</h1>
      <p>${bodyText.replace(/</g, '&lt;')}</p>
    </div>
    <script>
      (function () {
        var targetOrigin = window.location.origin;
        var message = ${payload};
        function notifyOpener() {
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(message, targetOrigin);
            }
          } catch (e) {
            console.error('[DocsBot Stripe OAuth] postMessage failed', e);
          }
        }
        if (!message.success) {
          console.error('[DocsBot Stripe OAuth] Connection failed', message);
        } else {
          console.info('[DocsBot Stripe OAuth] Connected; notifying opener', { teamId: message.teamId, botId: message.botId });
        }
        notifyOpener();
        window.addEventListener('load', notifyOpener);
        ${closeScript}
      })();
    </script>
  </body>
</html>`
}

/** Sends popup HTML and returns true so callers can return early (avoid double response). */
const sendPopupHtml = (res, options) => {
  res
    .status(200)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .send(buildStripeOAuthPopupHtml(options))
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  configureFirebaseApp()
  const firestore = getFirestore()

  const { code, state, error } = req.query
  const hostUrl = process.env.HOST_URL

  const parsedState = parseStripeOAuthState(state)
  const teamId = parsedState?.t
  const botId = parsedState?.b
  const isPopup = Boolean(parsedState?.p)
  const appUrl = botId
    ? `${hostUrl}/app/bots/${botId}/widget/actions`
    : `${hostUrl}/app/bots`

  const maybePopup = (success, reason) => {
    if (isPopup && teamId && botId) {
      sendPopupHtml(res, { success, reason, teamId, botId })
      return true
    }
    return false
  }

  if (error) {
    console.error('[Stripe OAuth callback] Stripe returned error query param', {
      error,
      teamId,
      botId,
      isPopup,
    })
    if (maybePopup(false, error)) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: error,
    })
  }

  if (!teamId || !botId || !code || !state) {
    console.error('[Stripe OAuth callback] Missing code, state, or target', {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      teamId,
      botId,
    })
    if (maybePopup(false, 'missing_code_state_or_target')) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: 'missing_code_state_or_target',
    })
  }

  const bot = await getBot(teamId, botId, { sanitize: false })
  if (!bot) {
    console.error('[Stripe OAuth callback] Bot not found', { teamId, botId })
    if (maybePopup(false, 'bot_not_found')) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: 'bot_not_found',
    })
  }

  const existingTools = bot?.tools || {}
  const existingStripe = existingTools?.stripe || {}

  const expectedHash = existingStripe?.oauthStateHash
  const expectedExpiry = existingStripe?.oauthStateExpiresAt || 0
  const providedHash = crypto
    .createHash('sha256')
    .update(String(state))
    .digest('hex')

  if (!expectedHash || expectedHash !== providedHash) {
    console.error('[Stripe OAuth callback] State hash mismatch', {
      teamId,
      botId,
      hasExpectedHash: Boolean(expectedHash),
    })
    if (maybePopup(false, 'invalid_state')) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: 'invalid_state',
    })
  }

  if (expectedExpiry < Date.now()) {
    console.error('[Stripe OAuth callback] OAuth state expired', { teamId, botId })
    if (maybePopup(false, 'expired_state')) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: 'expired_state',
    })
  }

  const appSecret =
    process.env.STRIPE_APP_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  const usedDedicatedAppSecret = Boolean(process.env.STRIPE_APP_SECRET_KEY)

  if (!appSecret) {
    console.error('[Stripe OAuth callback] Missing STRIPE_APP_SECRET_KEY / STRIPE_SECRET_KEY')
    if (maybePopup(false, 'missing_app_secret_key')) return
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: 'missing_app_secret_key',
    })
  }

  const redirectUri = `${hostUrl}${STRIPE_OAUTH_CALLBACK_PATH}`

  console.info('[Stripe OAuth callback] Token exchange request', {
    teamId,
    botId,
    redirectUri,
    usedDedicatedAppSecret,
    secretKeyMode: appSecret.startsWith('sk_live')
      ? 'live'
      : appSecret.startsWith('sk_test')
        ? 'test'
        : 'unknown',
  })

  // Stripe Apps OAuth: official examples use only code + grant_type (Basic auth = secret key).
  // See https://docs.stripe.com/stripe-apps/api-authentication/oauth
  const tokenResp = await fetch('https://api.stripe.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${appSecret}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
    }),
  })

  const tokenData = await tokenResp.json()

  if (!tokenResp.ok || tokenData.error) {
    let humanReason = tokenData.error_description
      ? `${tokenData.error}: ${tokenData.error_description}`
      : tokenData.error || 'token_exchange_failed'

    if (tokenData.error === 'invalid_grant' && !usedDedicatedAppSecret) {
      humanReason +=
        ' Set STRIPE_APP_SECRET_KEY to the standard secret key (sk_test_ or sk_live_) from the Stripe account that owns this Stripe App—the same account and mode as STRIPE_APP_CLIENT_ID / the OAuth link. STRIPE_SECRET_KEY is only a fallback and is often a different account (e.g. platform billing).'
    }

    const errDesc = String(tokenData.error_description || '')
    if (
      tokenData.error === 'invalid_grant' &&
      /livemode API key/i.test(errDesc) &&
      /test keys/i.test(errDesc)
    ) {
      humanReason +=
        ' STRIPE_APP_SECRET_KEY is sk_live_… but this authorization code came from test-mode OAuth—set STRIPE_APP_SECRET_KEY (and STRIPE_APP_CLIENT_ID) to test values, or complete install from the live marketplace OAuth link and use sk_live_…'
    }
    if (
      tokenData.error === 'invalid_grant' &&
      /testmode API key/i.test(errDesc) &&
      /live keys/i.test(errDesc)
    ) {
      humanReason +=
        ' STRIPE_APP_SECRET_KEY is sk_test_… but this authorization code came from live-mode OAuth—use sk_live_… and the live client id, or use External test / test OAuth with sk_test_…'
    }
    if (
      tokenData.error === 'invalid_grant' &&
      /does not belong to you/i.test(errDesc)
    ) {
      humanReason +=
        usedDedicatedAppSecret
          ? ' The sk_* used for exchange must be from the same Stripe account that owns STRIPE_APP_CLIENT_ID (the account that uploaded/owns that app in Dashboard → Apps), not a different account’s “billing” test key. If the client id is from another company’s app, only that developer’s keys work—use your own uploaded test app + its test client id and your sk_test, or get the matching app-owner secret. Authorization codes are single-use—click Connect again for a new code.'
          : ''
    }

    let logHint =
      tokenData.error === 'invalid_grant'
        ? 'Usually: (1) sk_test vs sk_live does not match the OAuth link (test vs live), (2) secret key is not from the Stripe account that owns this Stripe App / client_id, (3) code already used (e.g. production callback exchanged it first). Editing localhost in the URL is OK if HOST_URL matches the redirect_uri sent to Stripe.'
        : undefined
    if (/livemode API key/i.test(errDesc) && /test keys/i.test(errDesc)) {
      logHint =
        'OAuth code is test-mode but token exchange used sk_live_ in Basic auth—use sk_test_ for STRIPE_APP_SECRET_KEY (logs: secretKeyMode).'
    }
    if (/testmode API key/i.test(errDesc) && /live keys/i.test(errDesc)) {
      logHint =
        'OAuth code is live-mode but token exchange used sk_test_—use sk_live_ for STRIPE_APP_SECRET_KEY.'
    }
    if (
      tokenData.error === 'invalid_grant' &&
      /does not belong to you/i.test(errDesc) &&
      usedDedicatedAppSecret
    ) {
      logHint =
        'STRIPE_APP_SECRET_KEY must be from the same Stripe account that owns STRIPE_APP_CLIENT_ID (app uploader). Another account’s sk_test causes this; codes are also single-use.'
    }

    console.error('[Stripe OAuth callback] Token exchange failed', {
      ok: tokenResp.ok,
      status: tokenResp.status,
      error: tokenData.error,
      errorDescription: tokenData.error_description,
      teamId,
      botId,
      usedDedicatedAppSecret,
      secretKeyMode: appSecret.startsWith('sk_live')
        ? 'live'
        : appSecret.startsWith('sk_test')
          ? 'test'
          : 'unknown',
      hint: logHint,
    })
    if (maybePopup(false, humanReason)) {
      return
    }
    return redirectWithParams(res, appUrl, {
      stripe_connect: 'error',
      reason: humanReason,
    })
  }

  const stripeUserId = tokenData.stripe_user_id || tokenData.account_id || null
  const accessToken = tokenData.access_token || null

  const nextStripe = {
    ...existingStripe,
    enabled: true,
    accessToken,
    refreshToken: tokenData.refresh_token || null,
    stripeUserId,
    oauthStateHash: null,
    oauthStateExpiresAt: null,
  }
  for (const k of OBSOLETE_STRIPE_TOOL_METADATA_KEYS) {
    delete nextStripe[k]
  }

  await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .set(
      {
        tools: {
          ...existingTools,
          stripe: nextStripe,
        },
      },
      { merge: true },
    )

  console.info('[Stripe OAuth callback] Connected and saved', {
    teamId,
    botId,
    stripeUserId,
    isPopup,
  })

  if (isPopup) {
    sendPopupHtml(res, { success: true, reason: '', teamId, botId })
    return
  }

  return redirectWithParams(res, appUrl, {
    stripe_connect: 'success',
  })
}
