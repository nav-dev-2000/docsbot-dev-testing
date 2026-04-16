import crypto from 'crypto'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { getBot } from '@/lib/dbQueries'
import { validateOutboundFetchUrl } from '@/utils/outboundUrlValidation'

/**
 * Generate a cryptographically secure random string for PKCE and state.
 */
function generateRandomString(length = 64) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

/**
 * Generate PKCE code challenge from verifier using S256.
 */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * MCP External OAuth — Dynamic Client Registration + Authorization URL builder
 *
 * POST body: { serverUrl, authMetadata }
 *   - serverUrl: the MCP server URL
 *   - authMetadata: the OAuth authorization server metadata (from discover.js)
 *
 * Returns: { authorizationUrl } — the URL to redirect the user to
 */
export function resolveMcpOauthClientCredentials({
  manualClientId,
  manualClientSecret,
  existingData,
}) {
  const hasManualClientId =
    typeof manualClientId === 'string' && manualClientId.trim().length > 0
  const hasManualClientSecret =
    typeof manualClientSecret === 'string' &&
    manualClientSecret.trim().length > 0

  return {
    hasManualClientId,
    hasManualClientSecret,
    clientId: hasManualClientId
      ? manualClientId.trim()
      : existingData?.client_id || null,
    // Preserve previously stored secret unless caller explicitly provides a new non-empty one.
    clientSecret: hasManualClientSecret
      ? manualClientSecret
      : existingData?.client_secret || null,
  }
}

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  // Handle DELETE (Disconnect)
  if (req.method === 'DELETE') {
    const { serverUrl } = req.body
    if (!serverUrl) {
      return res.status(400).json({ message: 'serverUrl is required' })
    }

    try {
      const bot = await getBot(team.id, botId)
      if (!bot) return res.status(404).json({ message: 'Bot not found' })

      if (!canUserManageBotSettings(team, userId, bot)) {
        return res.status(403).json({ message: 'You are not allowed to manage this bot.' })
      }

      const normalizedServerUrl = serverUrl.replace(/\/+$/, '')
      const serverUrlHash = Buffer.from(normalizedServerUrl).toString('base64url')

      await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('mcpExternalOAuth')
        .doc(serverUrlHash)
        .delete()

      return res.status(200).json({ message: 'Disconnected successfully' })
    } catch (error) {
      console.error('Error disconnecting OAuth:', error)
      return res.status(500).json({ message: 'Error disconnecting' })
    }
  }

  // Handle POST (Register/Auth URL)
  const { serverUrl, authMetadata, oauthClientId: manualClientId, oauthClientSecret: manualClientSecret } = req.body

  if (!serverUrl || !authMetadata) {
    return res.status(400).json({ message: 'serverUrl and authMetadata are required' })
  }

  if (!authMetadata.authorization_endpoint || !authMetadata.token_endpoint) {
    return res.status(400).json({ message: 'authMetadata must include authorization_endpoint and token_endpoint' })
  }

  const authorizationCheck = await validateOutboundFetchUrl(
    authMetadata.authorization_endpoint,
  )
  if (!authorizationCheck.valid) {
    return res.status(400).json({ message: authorizationCheck.error })
  }
  const tokenEndpointCheck = await validateOutboundFetchUrl(authMetadata.token_endpoint)
  if (!tokenEndpointCheck.valid) {
    return res.status(400).json({ message: tokenEndpointCheck.error })
  }

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    if (!canUserManageBotSettings(team, userId, bot)) {
      return res.status(403).json({ message: 'You are not allowed to manage this bot.' })
    }

    // Use environment variable or request headers to determine the site URL
    const envSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https')
    const siteUrl = envSiteUrl || `${proto}://${req.headers.host}`
    const callbackUrl = `${siteUrl}/api/mcp-external-oauth/callback`

    // Normalize server URL (remove trailing slash)
    const normalizedServerUrl = serverUrl.replace(/\/+$/, '')
    const serverUrlHash = Buffer.from(normalizedServerUrl).toString('base64url')

    // Check if we already have a client registration for this server
    const oauthDocRef = firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('mcpExternalOAuth')
      .doc(serverUrlHash)
    const existingDoc = await oauthDocRef.get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const {
      clientId: resolvedClientId,
      clientSecret: resolvedClientSecret,
      hasManualClientId,
      hasManualClientSecret,
    } = resolveMcpOauthClientCredentials({
      manualClientId,
      manualClientSecret,
      existingData,
    })

    let clientId = resolvedClientId
    let clientSecret = resolvedClientSecret
    let storedRedirectUri = existingData.redirect_uri || null

    // Step 1: Dynamic Client Registration
    // Force re-registration if the callback URL has changed and we are using DCR (not manual)
    const needsReregistration =
      clientId &&
      storedRedirectUri &&
      storedRedirectUri !== callbackUrl &&
      !hasManualClientId

    if ((!clientId || needsReregistration) && authMetadata.registration_endpoint && !manualClientId) {
      const registrationCheck = await validateOutboundFetchUrl(
        authMetadata.registration_endpoint,
      )
      if (!registrationCheck.valid) {
        return res.status(400).json({ message: registrationCheck.error })
      }
      console.log(needsReregistration ? 'Callback URL mismatch detected. Re-registering...' : 'Initiating DCR...')
      try {
        // Pick the best auth method from metadata if available
        // RFC 7591 default is client_secret_basic
        let authMethod = 'client_secret_basic'
        if (authMetadata.token_endpoint_auth_methods_supported) {
          const supported = authMetadata.token_endpoint_auth_methods_supported
          if (supported.includes('client_secret_basic')) {
            authMethod = 'client_secret_basic'
          } else if (supported.includes('client_secret_post')) {
            authMethod = 'client_secret_post'
          } else if (supported.includes('none')) {
            authMethod = 'none'
          }
        }

        let registrationPayload = {
          client_name: 'DocsBot AI',
          client_uri: siteUrl,
          redirect_uris: [callbackUrl],
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'client_secret_post',
        }

        if (authMetadata.scopes_supported) {
          registrationPayload.scope = authMetadata.scopes_supported.join(' ')
        }

        const regResponse = await fetch(authMetadata.registration_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationPayload),
        })

        // Read response body correctly
        const text = await regResponse.text()

        console.log('OAuth registration status:', regResponse.status)
        console.log('OAuth registration response:', text)

        if (!regResponse.ok) {
          let hint = ''

          if (text.includes('allowlist')) {
            hint = ' Note: This server may require developer allowlisting.'
          }

          return res.status(502).json({
            message: 'Dynamic Client Registration failed.' + hint,
            detail: text
          })
        }

        const regData = JSON.parse(text)

        console.log('DocsBot DCR Response:', regData)

        if (!regData.client_id) {
          throw new Error('DCR response missing client_id')
        }

        clientId = regData.client_id
        clientSecret = regData.client_secret || null

        // If the server returned a different redirect URI or a specific one, we MUST use it
        const finalRedirectUri = (regData.redirect_uris && regData.redirect_uris.length > 0)
          ? regData.redirect_uris[0]
          : callbackUrl

        // Store the client registration
        await oauthDocRef.set({
          serverUrl: normalizedServerUrl,
          botId,
          client_id: clientId,
          client_secret: clientSecret,
          registration_endpoint: authMetadata.registration_endpoint,
          authorization_endpoint: authMetadata.authorization_endpoint,
          token_endpoint: authMetadata.token_endpoint,
          issuer: authMetadata.issuer || null,
          scopes_supported: authMetadata.scopes_supported || null,
          redirect_uri: finalRedirectUri,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true })
      } catch (e) {
        console.error('Error during DCR:', e)
        return res.status(502).json({ message: 'Error during Dynamic Client Registration: ' + e.message })
      }
    } else if (clientId && !existingDoc.exists) {
      // If we have manual credentials but no doc, create it
      await oauthDocRef.set({
        serverUrl: normalizedServerUrl,
        botId,
        client_id: clientId,
        client_secret: clientSecret,
        registration_endpoint: authMetadata.registration_endpoint || null,
        authorization_endpoint: authMetadata.authorization_endpoint,
        token_endpoint: authMetadata.token_endpoint,
        redirect_uri: callbackUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } else if (clientId && existingDoc.exists && hasManualClientId) {
      // When a user edits MCP settings later, keep existing secrets unless they intentionally provide a new one.
      const manualCredentialUpdate = {
        client_id: clientId,
        updatedAt: new Date().toISOString(),
      }
      if (hasManualClientSecret) {
        manualCredentialUpdate.client_secret = clientSecret
      }
      await oauthDocRef.set(manualCredentialUpdate, { merge: true })
    } else if (!clientId) {
      return res.status(400).json({
        message: 'Authorization server does not support Dynamic Client Registration and no client credentials were provided.',
      })
    }

    // Fetch refreshed data (in case redirect_uri changed)
    const freshDoc = await oauthDocRef.get()
    const oauthData = freshDoc.data()
    clientId = oauthData.client_id
    const activeRedirectUri = oauthData.redirect_uri || callbackUrl

    // Step 2: Generate PKCE values and state
    const codeVerifier = generateRandomString(64)
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Encode teamId and botId into the state for easier lookup (backup for collectionGroup)
    const stateValue = generateRandomString(16)
    const state = `${stateValue}:${team.id}:${botId}`

    // Store state and code_verifier for the callback
    await oauthDocRef.update({
      state,
      botId,
      code_verifier: codeVerifier,
      authorization_endpoint: authMetadata.authorization_endpoint,
      token_endpoint: authMetadata.token_endpoint,
      redirect_uri: activeRedirectUri,
      updatedAt: new Date().toISOString(),
    })

    // Step 3: Build authorization URL
    const authUrl = new URL(authMetadata.authorization_endpoint)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', activeRedirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    // Add scope if supported
    if (authMetadata.scopes_supported?.length > 0) {
      authUrl.searchParams.set('scope', authMetadata.scopes_supported.join(' '))
    }

    return res.status(200).json({
      authorizationUrl: authUrl.toString(),
    })

  } catch (error) {
    console.error('Error in MCP external OAuth register:', error)
    return res.status(500).json({ message: 'Error initiating OAuth flow' })
  }
}
