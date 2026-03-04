import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { encryptKey } from '@/lib/encryption'
import { getValidChannelEntries } from '@/lib/slackHelpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

const generateMessageHtml = (variant, title, message, closeButtonText = 'Close Window', additionalScript = '') => {
  const colors = {
    success: { headingColor: '#38a169' },
    error: { headingColor: '#e53e3e' },
    warning: { headingColor: '#ecc94b' },
    info: { headingColor: '#4299e1' },
  }
  const style = colors[variant] || colors.info

  return `
    <html>
      <head>
        <title>Slack Connection ${variant === 'success' ? 'Successful' : 'Error'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background-color: #1a202c; }
          .message-container { max-width: 500px; text-align: center; }
          h1 { color: ${style.headingColor}; font-size: 1.875rem; font-weight: bold; margin-top: 1rem; }
          p { color: #d1d5db; margin-top: 1.5rem; font-size: 1rem; }
          .close-button { margin-top: 2.5rem; background: linear-gradient(to right, #0d9488, #0891b2); color: white; border: none; padding: 0.625rem 0.875rem; border-radius: 0.375rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
          .close-button:hover { background: linear-gradient(to right, #0f766e, #0e7490); }
        </style>
        ${additionalScript}
      </head>
      <body>
        <div class="message-container">
          <h1>${title}</h1>
          <p>${message}</p>
          <button class="close-button" onclick="sendMessageAndClose()">${closeButtonText}</button>
        </div>
      </body>
    </html>
  `
}

const sendHtml = (res, status, html) => {
  res.status(status).setHeader('Content-Type', 'text/html').send(html)
}

const serializeForInlineScript = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { team, userId } = check
  const { code, state, error, teamId, after_connect: rawAfterConnect } = req.query
  const afterConnect = Array.isArray(rawAfterConnect) ? rawAfterConnect[0] || '' : rawAfterConnect || ''

  configureFirebaseApp()
  const firestore = getFirestore()

  try {
    // Only team admins/owners can connect Slack
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({
        message: 'Only team admins can connect Slack. Please contact your team owner.',
      })
    }

    if (error) {
      console.error('Slack OAuth error:', error)
      return sendHtml(
        res,
        400,
        generateMessageHtml('error', 'Connection Error', `There was an error connecting to Slack: ${error}`),
      )
    }

    if (!code || !state) {
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid Request', 'Missing required parameters.'))
    }

    const stateParts = state.split('_')
    if (stateParts.length < 3 || stateParts[0] !== teamId) {
      console.error('Invalid state parameter:', state)
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.'))
    }

    const integrationRef = firestore
      .collection('teams')
      .doc(teamId)
      .collection('integrations')
      .doc('slack')

    const integrationDoc = await integrationRef.get()
    const integrationData = integrationDoc.data() || {}
    const pending = integrationData.slackOAuthPending

    if (!pending || pending.state !== state) {
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.'))
    }

    const defaultBotId = pending.defaultBotId || null

    // If defaultBotId provided, verify the bot exists
    if (defaultBotId) {
      const bot = await getBot(team.id, defaultBotId)
      if (!bot) {
        return sendHtml(res, 400, generateMessageHtml('error', 'Invalid Bot', 'The selected default bot was not found.'))
      }
    }

    const codeVerifier = pending.codeVerifier

    const redirectUriUrl = new URL(`${process.env.HOST_URL}/api/teams/${teamId}/integrations/slack/callback`)
    if (afterConnect) {
      redirectUriUrl.searchParams.set('after_connect', afterConnect)
    }
    const redirectUri = redirectUriUrl.toString()

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.ok) {
      console.error('Slack OAuth token exchange error:', tokenData.error)
      return sendHtml(
        res,
        400,
        generateMessageHtml('error', 'Token Exchange Error', `Failed to exchange authorization code for tokens: ${tokenData.error}`),
      )
    }

    const { access_token, bot_user_id, team: slackTeam, enterprise, is_enterprise_install } = tokenData

    const encryptedToken = encryptKey(access_token)

    const existingWorkspace = integrationData.workspaces?.[slackTeam.id] || {}
    const workspaceUpdate = {
      slackBotToken: encryptedToken,
      slackBotUserId: bot_user_id,
      slackTeamId: slackTeam.id,
      slackTeamName: slackTeam.name,
      slackIsEnterprise: is_enterprise_install,
      slackConnectedAt: new Date().toISOString(),
      defaultBotId: defaultBotId || existingWorkspace.defaultBotId || null,
      channelBotMap: Object.fromEntries(getValidChannelEntries(existingWorkspace.channelBotMap || {})),
      ...(enterprise
        ? {
            slackIsEnterprise: true,
            slackEnterpriseId: enterprise.id,
            slackEnterpriseName: enterprise.name,
          }
        : {}),
    }

    await integrationRef.set(
      {
        workspaces: {
          ...(integrationData.workspaces || {}),
          [slackTeam.id]: workspaceUpdate,
        },
        slackOAuthPending: FieldValue.delete(),
      },
      { merge: true },
    )

    // Update team.slackWorkspaceIds for lookup/listing
    const teamRef = firestore.collection('teams').doc(teamId)
    const teamDoc = await teamRef.get()
    const teamData = teamDoc.data() || {}
    const existingIds = teamData.slackWorkspaceIds || []
    if (!existingIds.includes(slackTeam.id)) {
      await teamRef.update({
        slackWorkspaceIds: FieldValue.arrayUnion(slackTeam.id),
      })
    }

    const postMessagePayload = serializeForInlineScript({
      type: 'SLACK_CONNECTED',
      teamId,
      slackConnectedAt: new Date().toISOString(),
      slackBotUserId: bot_user_id,
      slackTeamId: slackTeam.id,
      slackTeamName: slackTeam.name,
      afterConnect,
      teamSlackSettingsPath: '/app/api#slack-settings',
    })

    const additionalScript = `
      <script>
        function sendMessageAndClose() {
          try {
            const message = ${postMessagePayload};
            if (window.opener) {
              window.opener.postMessage(message, '*');
              setTimeout(() => { window.close(); }, 300);
            } else {
              window.close();
            }
          } catch (err) {
            console.error('Error sending message:', err);
            window.close();
          }
        }
        window.onload = function() {
          try {
            const message = ${postMessagePayload};
            if (window.opener) {
              window.opener.postMessage(message, '*');
            }
          } catch (err) {}
        }
      </script>
    `

    const wasReconnect = !!existingWorkspace?.slackTeamId
    const message = wasReconnect
      ? `Slack workspace ${slackTeam.name} has been reconnected. Credentials and default bot updated; channel assignments unchanged.`
      : `Slack workspace ${slackTeam.name} is now connected. Configure default bot and routing in Team settings.`

    return sendHtml(
      res,
      200,
      generateMessageHtml(
        'success',
        wasReconnect ? 'Reconnection Successful' : 'Connection Successful',
        message,
        'Close Window & Complete Setup',
        additionalScript,
      ),
    )
  } catch (err) {
    console.error('Error in Slack OAuth callback:', err)
    return sendHtml(res, 500, generateMessageHtml('error', 'Server Error', 'An unexpected error occurred while connecting to Slack.'))
  }
}
