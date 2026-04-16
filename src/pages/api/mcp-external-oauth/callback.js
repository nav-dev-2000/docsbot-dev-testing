import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { validateOutboundFetchUrl } from '@/utils/outboundUrlValidation'

/**
 * MCP External OAuth — Unified Callback handler
 *
 * This endpoint is a fixed redirect_uri (non-dynamic path).
 * It uses the 'state' parameter to look up the correct team and bot context.
 */
export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code, state, error, error_description } = req.query

  if (error) {
    console.error('OAuth callback error:', error, error_description)

    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https')
    const siteUrl = envSiteUrl || `${proto}://${req.headers.host}`

    let teamIdFromState = null
    let botIdFromState = null
    if (state && String(state).includes(':')) {
      const parts = String(state).split(':')
      if (parts.length === 3) {
        teamIdFromState = parts[1]
        botIdFromState = parts[2]
      }
    }

    if (botIdFromState) {
      const actionsPageUrl = `${siteUrl}/app/bots/${botIdFromState}/configure/mcp-connections`
      const errorUrl = new URL(actionsPageUrl)
      errorUrl.searchParams.set('mcp_oauth', 'error')
      errorUrl.searchParams.set('mcp_oauth_error', String(error_description || error))

      // Clear pending PKCE/state so the user can start Connect again without stale state
      if (teamIdFromState && state) {
        try {
          let oauthDoc = null
          const stateQuery = await firestore
            .collection('teams')
            .doc(teamIdFromState)
            .collection('bots')
            .doc(botIdFromState)
            .collection('mcpExternalOAuth')
            .where('state', '==', state)
            .limit(1)
            .get()

          if (!stateQuery.empty) {
            oauthDoc = stateQuery.docs[0]
          } else {
            const fallbackQuery = await firestore
              .collectionGroup('mcpExternalOAuth')
              .where('state', '==', state)
              .limit(1)
              .get()
            if (!fallbackQuery.empty) {
              oauthDoc = fallbackQuery.docs[0]
            }
          }

          if (oauthDoc) {
            await oauthDoc.ref.update({
              state: null,
              code_verifier: null,
              updatedAt: new Date().toISOString(),
            })
          }
        } catch (cleanupErr) {
          console.error('OAuth callback: could not clear state after error', cleanupErr)
        }
      }

      return res.redirect(303, errorUrl.toString())
    }

    return res.status(400).send(`OAuth Error: ${error_description || error}. Please close this window and try again.`)
  }

  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state')
  }

  try {
    // Parse context from state if available (format: randomHash:teamId:botId)
    let teamIdFromState = null
    let botIdFromState = null
    if (state.includes(':')) {
      const parts = state.split(':')
      if (parts.length === 3) {
        teamIdFromState = parts[1]
        botIdFromState = parts[2]
      }
    }

    let oauthDoc = null
    if (teamIdFromState) {
      // Direct lookup is faster and doesn't need collectionGroup index
      const stateQuery = await firestore
        .collection('teams')
        .doc(teamIdFromState)
        .collection('bots')
        .doc(botIdFromState)
        .collection('mcpExternalOAuth')
        .where('state', '==', state)
        .limit(1)
        .get()
      
      if (!stateQuery.empty) {
        oauthDoc = stateQuery.docs[0]
      }
    }

    // Fallback to collectionGroup if direct lookup failed
    if (!oauthDoc) {
      const stateQuery = await firestore
        .collectionGroup('mcpExternalOAuth')
        .where('state', '==', state)
        .limit(1)
        .get()

      if (!stateQuery.empty) {
        oauthDoc = stateQuery.docs[0]
      }
    }

    if (!oauthDoc) {
      console.error('OAuth callback: no matching state found')
      return res.status(400).send('Invalid state parameter or session expired. Please try again.')
    }

    const oauthData = oauthDoc.data()
    const teamId = teamIdFromState || oauthDoc.ref.parent.parent.id
    const botId = botIdFromState || oauthData.botId

    if (!botId) {
       return res.status(400).send('Missing bot context in stored OAuth state.')
    }

    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const proto = req.headers['x-forwarded-proto'] || (req.headers.host.includes('localhost') ? 'http' : 'https')
    const siteUrl = envSiteUrl || `${proto}://${req.headers.host}`
    const actionsPageUrl = `${siteUrl}/app/bots/${botId}/configure/mcp-connections`

    // Exchange authorization code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthData.redirect_uri, // Must match what was sent in authorize request
      client_id: oauthData.client_id,
      code_verifier: oauthData.code_verifier,
    })

    if (oauthData.client_secret) {
      tokenParams.append('client_secret', oauthData.client_secret)
    }

    const tokenUrlCheck = await validateOutboundFetchUrl(oauthData.token_endpoint)
    if (!tokenUrlCheck.valid) {
      console.error('OAuth callback: blocked token_endpoint', tokenUrlCheck.error)
      return res.status(400).send(
        'Invalid OAuth token endpoint configuration. Please disconnect and try again.',
      )
    }

    const tokenResponse = await fetch(tokenUrlCheck.normalizedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errBody)
      const errorUrl = new URL(actionsPageUrl)
      errorUrl.searchParams.set('mcp_oauth', 'error')
      errorUrl.searchParams.set('mcp_oauth_error', 'Token exchange failed')
      return res.redirect(303, errorUrl.toString())
    }

    const tokenData = await tokenResponse.json()

    // Store the tokens
    await oauthDoc.ref.update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : null,
      scope: tokenData.scope || null,
      state: null,
      code_verifier: null,
      updatedAt: new Date().toISOString(),
    })

    // Redirect back to the actions page with success
    const successUrl = new URL(actionsPageUrl)
    successUrl.searchParams.set('mcp_oauth', 'success')
    successUrl.searchParams.set('mcp_server_url', oauthData.serverUrl)
    successUrl.searchParams.set('mcp_server_id', oauthDoc.id)
    return res.redirect(303, successUrl.toString(), { force: true })

  } catch (error) {
    console.error('Error in unified OAuth callback:', error)
    return res.status(500).send('Unexpected error during authentication. Please try again.')
  }
}
