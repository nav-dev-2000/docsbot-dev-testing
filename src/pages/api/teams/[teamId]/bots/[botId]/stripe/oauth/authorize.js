import crypto from 'crypto'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import {
  OBSOLETE_STRIPE_TOOL_METADATA_KEYS,
  STRIPE_OAUTH_CALLBACK_PATH,
  getStripeAppsMarketplaceOAuthScopeParam,
} from '@/lib/stripeConnect'

const STATE_TTL_MS = 1000 * 60 * 10

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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

  const clientId =
    process.env.STRIPE_APP_CLIENT_ID || process.env.STRIPE_APP_ID
  const hostUrl = process.env.HOST_URL

  if (!hostUrl) {
    return res.status(500).json({
      message: 'Stripe OAuth is not configured. Missing HOST_URL.',
    })
  }

  if (!clientId) {
    return res.status(500).json({
      message:
        'STRIPE_APP_CLIENT_ID is required. Get it from Stripe Dashboard → Apps → your app.',
    })
  }

  let bot
  try {
    bot = await getBot(team.id, botId, { sanitize: false })
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }

  if (!bot) {
    return res.status(404).json({ message: 'Bot not found' })
  }

  if (!canUserManageBotSettings(team, userId, bot)) {
    return res.status(403).json({ message: 'You are not allowed to edit this bot.' })
  }

  if (!isSuperAdmin(userId)) {
    return res.status(403).json({
      message:
        'Stripe billing support connection is temporarily limited to DocsBot staff accounts.',
    })
  }

  let popup = false
  if (req.body && typeof req.body === 'object' && req.body !== null) {
    popup = Boolean(req.body.popup)
  }

  const scopeParam = getStripeAppsMarketplaceOAuthScopeParam()

  const stateNonce = crypto.randomBytes(24).toString('hex')
  const statePayload = {
    n: stateNonce,
    t: team.id,
    b: botId,
    ...(popup ? { p: 1 } : {}),
  }
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url')
  const stateHash = crypto.createHash('sha256').update(state).digest('hex')
  const redirectUri = `${hostUrl}${STRIPE_OAUTH_CALLBACK_PATH}`

  const existingTools = bot?.tools || {}
  const existingStripe = existingTools?.stripe || {}

  const pendingStripe = {
    ...existingStripe,
    oauthStateHash: stateHash,
    oauthStateExpiresAt: Date.now() + STATE_TTL_MS,
  }
  for (const k of OBSOLETE_STRIPE_TOOL_METADATA_KEYS) {
    delete pendingStripe[k]
  }

  await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .set(
      {
        tools: {
          ...existingTools,
          stripe: pendingStripe,
        },
      },
      { merge: true },
    )

  const authUrl = new URL(
    process.env.STRIPE_APP_OAUTH_URL ||
      'https://marketplace.stripe.com/oauth/v2/authorize',
  )
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', scopeParam)

  return res.status(200).json({
    url: authUrl.toString(),
  })
}
