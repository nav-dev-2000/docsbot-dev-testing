import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { encryptKey } from '@/lib/encryption'
import jwt from 'jsonwebtoken'

// Helper function to generate consistent HTML responses with our Message component styling
const generateMessageHtml = (variant, title, message, closeButtonText = 'Close Window', additionalScript = '') => {
  // Define colors based on variant
  const colors = {
    success: {
      headingColor: '#38a169', // text-green-500
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    error: {
      headingColor: '#e53e3e', // text-red-500
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    warning: {
      headingColor: '#ecc94b', // text-yellow-500
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    },
    info: {
      headingColor: '#4299e1', // text-blue-500
      buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      buttonHover: 'hover:from-teal-600 hover:to-cyan-700',
      buttonFocus: 'focus-visible:outline-cyan-600',
    }
  };

  const style = colors[variant] || colors.info;

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
            background-color: #1a202c; /* bg-gray-900 */
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
            color: #d1d5db; /* text-gray-300 */
            margin-top: 1.5rem;
            font-size: 1rem;
            line-height: 1.75;
          }
          .close-button { 
            margin-top: 2.5rem; 
            background: linear-gradient(to right, #0d9488, #0891b2); /* from-teal-500 to-cyan-600 */
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
            background: linear-gradient(to right, #0f766e, #0e7490); /* from-teal-600 to-cyan-700 */
          }
          .close-button:focus-visible {
            outline: 2px solid #0891b2; /* outline-cyan-600 */
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
  `;
};

export default async function handler(req, res) {
  // Only handle GET requests for OAuth callbacks
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  configureFirebaseApp()
  const firestore = getFirestore()
  
  try {
    // Extract parameters from the query string
    const { code, state, error, teamId, botId } = req.query
    
    // Validate state parameter to prevent CSRF attacks
    // State should be in format: teamId_botId_randomString
    const stateParts = state.split('_')
    if (stateParts.length < 3 || stateParts[0] !== teamId || stateParts[1] !== botId) {
      console.error('Invalid state parameter:', state)
      return res.status(400).json({ message: 'Invalid state parameter' })
    }
    
    // Retrieve the bot document to verify the state and get the code verifier
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

    // Handle OAuth errors
    if (error) {
      console.error('Slack OAuth error:', error)
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        generateMessageHtml('error', 'Connection Error', `There was an error connecting to Slack: ${error}`)
      )
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        generateMessageHtml('error', 'Invalid Request', 'Missing required parameters.')
      )
    }
    
    // Parse state parameter to get teamId and botId
    if (stateParts.length < 3) {
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.')
      )
    }
    
    if (botData.slackState !== state) {
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        generateMessageHtml('error', 'Invalid State', 'The authentication state is not valid.')
      )
    }
    
    // Exchange the authorization code for tokens using the Slack OAuth v2 token endpoint
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    const redirectUri = `${process.env.HOST_URL}/api/teams/${teamId}/bots/${botId}/integrations/slack/callback`
    const codeVerifier = botData.slackCodeVerifier
    
    // Make the OAuth v2 token exchange request
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code'
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.ok) {
      console.error('Slack OAuth token exchange error:', tokenData.error)
      return res.status(400).setHeader('Content-Type', 'text/html').send(
        generateMessageHtml('error', 'Token Exchange Error', `Failed to exchange authorization code for tokens: ${tokenData.error}`)
      )
    }
    
    // Extract the access token, bot info, and team info
    const { access_token, bot_user_id, app_id, team, enterprise, is_enterprise_install } = tokenData
    console.log('tokenData', tokenData)

    // Check if this Slack team is already connected to a different bot
    const existingBotQuery = await firestore
      .collectionGroup('bots')
      .where('slackTeamId', '==', team.id)
      .get()

    if (!existingBotQuery.empty) {
      const otherBots = existingBotQuery.docs
        .filter(doc => doc.id !== botId)
        .map(doc => {
          const data = doc.data()
          return `"${data.name}"`
        })

      if (otherBots.length > 0) {
        return res.status(400).setHeader('Content-Type', 'text/html').send(
          generateMessageHtml(
            'error',
            'Team Already Connected',
            `This Slack team (${team.name}) is already connected to the following bot: ${otherBots.join(', ')}. Only one bot can be connected to a Slack team at a time. Please either disconnect the existing connection or delete the bot before connecting to a new bot.`
          )
        )
      }
    }

    // Store the encrypted access token and related information in Firestore
    const encryptedToken = encryptKey(access_token)
    
    await botRef.set({
      slackBotToken: encryptedToken,
      slackBotUserId: bot_user_id,
      slackTeamId: team.id,
      slackTeamName: team.name,
      slackIsEnterprise: is_enterprise_install,
      ...(enterprise ? {
        slackIsEnterprise: true,
        slackEnterpriseId: enterprise.id,
        slackEnterpriseName: enterprise.name,
      } : {}),
      slackConnectedAt: new Date().toISOString(),
      // Remove the code verifier and state as they're no longer needed
      slackCodeVerifier: FieldValue.delete(),
      slackState: FieldValue.delete(),
    }, { merge: true })
    
    // Return a success response with a script to notify the opener window
    const additionalScript = `
      <script>
        // Function to send message and close window
        function sendMessageAndClose() {
          try {
            const message = { 
              type: 'SLACK_CONNECTED', 
              botId: '${botId}', 
              teamId: '${teamId}',
              slackConnectedAt: '${new Date().toISOString()}',
              slackBotUserId: '${bot_user_id}',
              slackTeamId: '${team.id}',
              slackTeamName: '${team.name}'
            };
            
            // First attempt sending message to opener
            if (window.opener) {
              console.log('Sending postMessage to opener:', message);
              window.opener.postMessage(message, '*');
              
              // Wait a short delay to ensure message has time to be sent
              setTimeout(() => {
                window.close();
              }, 300);
            } else {
              console.error('No opener window found');
              window.close();
            }
          } catch (err) {
            console.error('Error sending message:', err);
            window.close();
          }
        }
        
        // Try to send message on page load as well
        window.onload = function() {
          try {
            const message = { 
              type: 'SLACK_CONNECTED', 
              botId: '${botId}', 
              teamId: '${teamId}',
              slackConnectedAt: '${new Date().toISOString()}',
              slackBotUserId: '${bot_user_id}',
              slackTeamId: '${team.id}',
              slackTeamName: '${team.name}'
            };
            
            if (window.opener) {
              console.log('Sending onload postMessage to opener:', message);
              window.opener.postMessage(message, '*');
              
              // Don't auto-close, let user click the button instead
              // This ensures they see the success message
            } else {
              console.error('No opener window found on page load');
            }
          } catch (err) {
            console.error('Error in onload message handler:', err);
          }
        }
      </script>
    `;
    
    return res.status(200).setHeader('Content-Type', 'text/html').send(
      generateMessageHtml(
        'success', 
        'Connection Successful', 
        `Your bot has been successfully connected to Slack team ${team.name}! Click the button below to close this window and return to the app.`,
        'Close Window & Complete Setup',
        additionalScript
      )
    )
    
  } catch (error) {
    console.error('Error in Slack OAuth callback:', error)
    return res.status(500).setHeader('Content-Type', 'text/html').send(
      generateMessageHtml('error', 'Server Error', 'An unexpected error occurred while connecting to Slack.')
    )
  }
} 