import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { encryptKey } from '@/lib/encryption'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { canUserManageIntegrations } from '@/utils/function.utils'

// Helper function to generate consistent HTML responses with our Message component styling
const generateMessageHtml = (variant, title, message, closeButtonText = 'Close Window', additionalScript = '') => {
  const colors = {
    success: {
      headingColor: '#38a169',
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    error: {
      headingColor: '#e53e3e',
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    warning: {
      headingColor: '#ecc94b',
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    info: {
      headingColor: '#4299e1',
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
  }

  const style = colors[variant] || colors.info

  return `
    <html>
      <head>
        <title>Slack Connection ${variant === 'success' ? 'Successful' : 'Error'}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            flex-direction: column;
            background-color: #1a202c;
          }
          .message-container { 
            max-width: 500px; 
            text-align: center; 
          }
          h1 { 
            color: ${style.headingColor}; 
            font-size: 1.875rem;
            font-weight: bold;
            line-height: 1.25;
            margin-top: 1rem;
          }
          p {
            color: #d1d5db;
            margin-top: 1.5rem;
            font-size: 1rem;
            line-height: 1.75;
          }
          .close-button { 
            margin-top: 2.5rem; 
            background: linear-gradient(to right, #0d9488, #0891b2);
            color: white; 
            border: none; 
            padding: 0.625rem 0.875rem; 
            border-radius: 0.375rem; 
            cursor: pointer;
            font-weight: 600;
            font-size: 0.875rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: background 0.2s ease;
          }
          .close-button:hover {
            background: linear-gradient(to right, #0f766e, #0e7490);
          }
          .close-button:focus-visible {
            outline: 2px solid #0891b2;
            outline-offset: 2px;
          }
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
  const { code, state, error, teamId, botId } = req.query

  configureFirebaseApp()
  const firestore = getFirestore()

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    if (!canUserManageIntegrations(team, userId, bot)) {
      return res.status(403).json({
        message: 'You are not allowed to manage integrations for this bot.',
      })
    }

    // Handle OAuth errors from Slack
    if (error) {
      console.error('Slack OAuth error:', error)
      return sendHtml(
        res,
        400,
        generateMessageHtml('error', 'Connection Error', `There was an error connecting to Slack: ${error}`),
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid Request', 'Missing required parameters.'))
    }

    // Validate state parameter to prevent CSRF attacks
    const stateParts = state.split('_')
    if (stateParts.length < 3 || stateParts[0] !== teamId || stateParts[1] !== botId) {
      console.error('Invalid state parameter:', state)
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.'))
    }

    const botRef = firestore
      .collection('teams')
      .doc(teamId)
      .collection('bots')
      .doc(botId)

    const botDoc = await botRef.get()
    if (!botDoc.exists) {
      console.error('Bot not found:', botId)
      return res.status(404).json({ message: 'Bot not found' })
    }

    const botData = botDoc.data()

    if (botData.slackState !== state) {
      return sendHtml(res, 400, generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.'))
    }

    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${process.env.HOST_URL}/api/teams/${teamId}/bots/${botId}/integrations/slack/callback`
    const codeVerifier = botData.slackCodeVerifier

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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

    // Check if this Slack team is already connected to a different bot
    const existingBotQuery = await firestore
      .collectionGroup('bots')
      .where('slackTeamId', '==', slackTeam.id)
      .get()

    if (!existingBotQuery.empty) {
      const otherBots = existingBotQuery.docs
        .filter((doc) => doc.id !== botId)
        .map((doc) => {
          const data = doc.data()
          return `"${data.name}"`
        })

      if (otherBots.length > 0) {
        return sendHtml(
          res,
          400,
          generateMessageHtml(
            'error',
            'Team Already Connected',
            `This Slack team (${slackTeam.name}) is already connected to the following bot: ${otherBots.join(', ')}. Only one bot can be connected to a Slack team at a time. Please either disconnect the existing connection or delete the bot before connecting to a new bot.`,
          ),
        )
      }
    }

    const encryptedToken = encryptKey(access_token)

    await botRef.set(
      {
        slackBotToken: encryptedToken,
        slackBotUserId: bot_user_id,
        slackTeamId: slackTeam.id,
        slackTeamName: slackTeam.name,
        slackIsEnterprise: is_enterprise_install,
        ...(enterprise
          ? {
              slackIsEnterprise: true,
              slackEnterpriseId: enterprise.id,
              slackEnterpriseName: enterprise.name,
            }
          : {}),
        slackConnectedAt: new Date().toISOString(),
        slackCodeVerifier: FieldValue.delete(),
        slackState: FieldValue.delete(),
      },
      { merge: true },
    )

    const additionalScript = `
      <script>
        function sendMessageAndClose() {
          try {
            const message = { 
              type: 'SLACK_CONNECTED', 
              botId: '${botId}', 
              teamId: '${teamId}',
              slackConnectedAt: '${new Date().toISOString()}',
              slackBotUserId: '${bot_user_id}',
              slackTeamId: '${slackTeam.id}',
              slackTeamName: '${slackTeam.name}'
            };
            
            if (window.opener) {
              console.log('Sending postMessage to opener:', message);
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
            const message = { 
              type: 'SLACK_CONNECTED', 
              botId: '${botId}', 
              teamId: '${teamId}',
              slackConnectedAt: '${new Date().toISOString()}',
              slackBotUserId: '${bot_user_id}',
              slackTeamId: '${slackTeam.id}',
              slackTeamName: '${slackTeam.name}'
            };
            
            if (window.opener) {
              console.log('Sending onload postMessage to opener:', message);
              window.opener.postMessage(message, '*');
            }
          } catch (err) {
            console.error('Error in onload message handler:', err);
          }
        }
      </script>
    `

    return sendHtml(
      res,
      200,
      generateMessageHtml(
        'success',
        'Connection Successful',
        `Your bot has been successfully connected to Slack team ${slackTeam.name}! Click the button below to close this window and return to the app.`,
        'Close Window & Complete Setup',
        additionalScript,
      ),
    )
  } catch (err) {
    console.error('Error in Slack OAuth callback:', err)
    return sendHtml(res, 500, generateMessageHtml('error', 'Server Error', 'An unexpected error occurred while connecting to Slack.'))
  }
}
