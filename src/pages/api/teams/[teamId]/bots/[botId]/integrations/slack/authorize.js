import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserEditBot } from '@/utils/function.utils'
import crypto from 'crypto'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { teamId, botId } = req.query

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    //check user is allowed to edit bot or not
    if (!canUserEditBot(team, userId)) {
      return res.status(403).json({
        message: 'You are not allowed to edit this bot.',
      })
    }

    // Generate a code verifier for PKCE
    const codeVerifier = crypto.randomBytes(64).toString('hex')
    
    // Generate a code challenge from the verifier
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    // Generate a random state parameter for security
    const state = `${teamId}_${botId}_${crypto.randomBytes(16).toString('hex')}`
    
    // Define scopes needed for the Slack bot
    const scopes = [
      'assistant:write',
      'channels:join',
      'im:history',
      'channels:history',
      'groups:history',
      'chat:write',
      'users:read',
      'users:read.email',
    ]

    // Store the PKCE code verifier and state in Firestore for verification during the callback
    await firestore
      .collection('teams')
      .doc(teamId)
      .collection('bots')
      .doc(botId)
      .set({
        slackCodeVerifier: codeVerifier,
        slackState: state,
      }, { merge: true })

    // Build the authorization URL for OAuth v2
    const redirectUri = `${process.env.HOST_URL}/api/teams/${teamId}/bots/${botId}/integrations/slack/callback`
    
    const authUrl = new URL('https://slack.com/oauth/v2/authorize')
    authUrl.searchParams.append('client_id', process.env.SLACK_CLIENT_ID)
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('user_scope', '') // Can add user-level scopes if needed
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')

    return res.status(200).json({ url: authUrl.toString() })
  } catch (error) {
    console.error('Error generating Slack authorization URL:', error)
    return res.status(500).json({ message: 'Error generating authorization URL' })
  }
} 