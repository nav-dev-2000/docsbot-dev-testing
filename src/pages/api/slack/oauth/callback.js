/**
 * Default Slack OAuth callback for App Directory (Marketplace) installs.
 * Set this as the first Redirect URL in your Slack app (e.g. /api/slack/oauth/callback).
 * Slack sends users here when they install from the Marketplace; we exchange the code,
 * store the installation as pending keyed by team.id, then redirect to the app to
 * sign in (if needed) and choose which DocsBot team to connect the workspace to.
 */
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { encryptKey } from '@/lib/encryption'
import { getValidChannelEntries } from '@/lib/slackHelpers'

const PENDING_TTL_MS = 30 * 60 * 1000 // 30 minutes

function redirectToApp(res, path, query = {}) {
  const url = new URL(path, process.env.HOST_URL)
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, String(v))
  })
  res.redirect(302, url.toString())
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code, state, error } = req.query

  if (error) {
    console.error('Slack OAuth error (marketplace callback):', error)
    redirectToApp(res, '/app/slack/connected', { error: error === 'access_denied' ? 'access_denied' : 'oauth_error' })
    return
  }

  if (!code) {
    redirectToApp(res, '/app/slack/connected', { error: 'missing_code' })
    return
  }

  const redirectUri = `${process.env.HOST_URL}/api/slack/oauth/callback`

  let tokenData
  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    tokenData = await tokenResponse.json()
  } catch (err) {
    console.error('Slack OAuth token exchange request failed:', err)
    redirectToApp(res, '/app/slack/connected', { error: 'exchange_failed' })
    return
  }

  if (!tokenData.ok) {
    console.error('Slack OAuth token exchange error:', tokenData.error)
    redirectToApp(res, '/app/slack/connected', { error: tokenData.error || 'exchange_failed' })
    return
  }

  const {
    access_token,
    bot_user_id,
    team: slackTeam,
    enterprise,
    is_enterprise_install,
  } = tokenData

  configureFirebaseApp()
  const firestore = getFirestore()

  const encryptedToken = encryptKey(access_token)
  const workspacePayload = {
    slackBotToken: encryptedToken,
    slackBotUserId: bot_user_id,
    slackTeamId: slackTeam.id,
    slackTeamName: slackTeam.name,
    slackIsEnterprise: is_enterprise_install,
    slackConnectedAt: new Date().toISOString(),
    defaultBotId: null,
    channelBotMap: {},
    ...(enterprise
      ? {
          slackIsEnterprise: true,
          slackEnterpriseId: enterprise.id,
          slackEnterpriseName: enterprise.name,
        }
      : {}),
  }

  const now = Timestamp.now()
  const expiresAt = Timestamp.fromMillis(now.toMillis() + PENDING_TTL_MS)

  await firestore
    .collection('slackInstallPending')
    .doc(slackTeam.id)
    .set({
      ...workspacePayload,
      channelBotMap: Object.fromEntries(getValidChannelEntries(workspacePayload.channelBotMap || {})),
      createdAt: now,
      expiresAt,
    })

  // Pass workspace name in URL so the connected page can show it without a separate API call
  redirectToApp(res, '/app/slack/connected', {
    slack_team_id: slackTeam.id,
    slack_team_name: slackTeam.name || '',
    ...(enterprise?.name ? { slack_enterprise_name: enterprise.name } : {}),
  })
}
