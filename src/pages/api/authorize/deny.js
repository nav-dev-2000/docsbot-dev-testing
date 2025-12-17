import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getTeam } from '@/lib/dbQueries'
import { isSuperAdmin } from '@/utils/helpers'

/**
 * Whitelist of trusted MCP client domains
 * These are known legitimate MCP-compatible clients
 */
const TRUSTED_MCP_DOMAINS = [
  'claude.ai',
  'anthropic.com',
  'console.anthropic.com',
  'chatgpt.com',
  'chat.openai.com',
  'openai.com',
  'platform.openai.com',
  'cursor.sh',
  'cursor.com',
  'continue.dev',
  'aider.chat',
  'github.com',
  'github.dev',
  'vscode.dev',
  'code.visualstudio.com',
]

/**
 * Check if a domain is in the trusted MCP domains list
 */
const isTrustedDomain = (domain) => {
  if (!domain) return false
  const domainLower = domain.toLowerCase()
  return TRUSTED_MCP_DOMAINS.some(trusted => {
    return domainLower === trusted || domainLower.endsWith('.' + trusted)
  })
}

/**
 * API endpoint to safely handle OAuth authorization denial.
 * 
 * According to OAuth 2.0 Authorization Framework (RFC 6749) Section 4.1.2.1:
 * - When the user denies the authorization request, the authorization server
 *   redirects the user-agent back to the client with an error response.
 * - The redirect_uri MUST be validated against what was registered for the client_id.
 * 
 * For dynamic client registration (RFC 7591), the redirect_uri should be validated
 * against the client registration stored by the authorization server.
 * 
 * This endpoint implements proper redirect_uri validation to prevent open redirect attacks
 * while supporting legitimate new MCP clients through dynamic client registration.
 */
export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Authenticate user and get their current team
  // This endpoint doesn't have teamId in the path, so we get it from the user's currentTeam
  let userId = null
  let team = null
  try {
    const context = { req, res }
    const { uid } = await getAuthorizedUser(context)
    userId = uid

    // Get user's current team from their user document
    const userRef = await firestore.collection('users').doc(uid).get()
    if (!userRef.exists || !userRef.data().currentTeam) {
      return res.status(403).json({ message: 'User does not have a current team' })
    }

    const teamId = userRef.data().currentTeam
    team = await getTeam(teamId)
    
    if (!team || (!team.roles[uid] && !isSuperAdmin(uid))) {
      return res.status(403).json({ message: 'User does not have access to team' })
    }
  } catch (error) {
    return res.status(403).json({ message: error?.message || 'Authentication failed' })
  }
  const { client_id, redirect_uri, state } = req.body

  if (!client_id || !redirect_uri) {
    return res.status(400).json({ 
      message: 'Missing required parameters: client_id and redirect_uri' 
    })
  }

  try {
    // Extract domain from redirect_uri
    let redirectDomain = null
    try {
      const url = new URL(redirect_uri)
      redirectDomain = url.hostname.toLowerCase()
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = redirect_uri.match(/^(?:https?:\/\/)?([^\/\s]+)/i)
      redirectDomain = match ? match[1].toLowerCase() : null
    }

    if (!redirectDomain) {
      // Invalid redirect_uri format - redirect to safe location
      return res.status(400).json({ 
        message: 'Invalid redirect_uri format',
        safe_redirect: '/app'
      })
    }

    // According to OAuth 2.0 spec (RFC 6749), redirect_uri must be validated against
    // what was registered for the client_id. For dynamic client registration (RFC 7591),
    // the authorization server should validate against the client registration.
    //
    // Priority order:
    // 1. External API validation (source of truth for client registration)
    // 2. Existing tokens validation (client has used this redirect_uri before)
    // 3. Trusted domains whitelist (fallback for known MCP clients if API unavailable)

    let isValidRedirect = false

    // Step 1: Try external API validation first (this is the source of truth)
    // This handles dynamic client registration and new MCP clients properly
    const externalApiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || process.env.BOT_API_URL
    if (externalApiUrl) {
      try {
        const formData = new URLSearchParams()
        formData.append('action', 'deny')
        formData.append('client_id', client_id)
        formData.append('redirect_uri', redirect_uri)
        formData.append('state', state || '')
        formData.append('team_id', team?.id || '')

        const response = await fetch(`${externalApiUrl}/authorize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('External API deny response:', { 
            ok: data.ok, 
            hasRedirectUri: !!data.redirect_uri, 
            redirectUri: data.redirect_uri,
            params: data.params,
            fullData: data
          })
          
          // Use the external API's response if it has redirect_uri and params
          // Even if ok: false, the API may still provide the correct redirect format
          // The API knows the correct format for each client (including Claude)
          if (data.redirect_uri && data.params) {
            // External API provided redirect_uri and params - use them
            // Check if redirect_uri already has query params (API may have formatted it)
            const url = new URL(data.redirect_uri)
            if (url.search && url.search.length > 0) {
              // redirect_uri already has query params - API formatted it correctly
              console.log('Using external API redirect_uri with existing query params')
              return res.status(200).json({
                ok: true,
                redirect_uri: data.redirect_uri,
                params: {} // Empty params since they're already in redirect_uri
              })
            } else {
              // redirect_uri needs params appended
              // Workaround for Claude's non-standard OAuth implementation:
              // Claude's callback handler checks for 'code' parameter first, even on denial
              // If redirect_uri is Claude's and params don't have 'code', add empty 'code'
              let finalParams = { ...data.params }
              const isClaude = redirectDomain && (
                redirectDomain.includes('claude.ai') || 
                redirectDomain.includes('anthropic.com')
              )
              
              if (isClaude && !finalParams.code && finalParams.error === 'access_denied') {
                // Claude expects a 'code' parameter even on denial (non-standard OAuth)
                // Add empty code to satisfy Claude's callback handler
                finalParams.code = ''
                console.log('Added empty code parameter for Claude deny flow')
              }
              
              console.log('Using external API response with redirect_uri and params to append')
              return res.status(200).json({
                ok: true,
                redirect_uri: data.redirect_uri,
                params: finalParams
              })
            }
          } else if (data.redirect_uri) {
            // API provided redirect_uri but no params - use default error params
            console.log('Using external API redirect_uri with default params')
            return res.status(200).json({
              ok: true,
              redirect_uri: data.redirect_uri,
              params: data.params || { error: 'access_denied', state: state || '' }
            })
          } else if (data.params) {
            // API returned params but no redirect_uri - use the original redirect_uri
            console.log('Using external API params with original redirect_uri')
            return res.status(200).json({
              ok: true,
              redirect_uri: redirect_uri,
              params: data.params
            })
          } else {
            console.log('External API response missing redirect_uri and params, falling back to validation')
          }
        } else {
          // Log non-OK responses for debugging
          // Read response body once and try to parse as JSON
          const errorText = await response.text().catch(() => '')
          let errorData = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            // If parsing fails, errorData remains {}
          }
          console.log('External API deny error response:', { status: response.status, body: errorText })
          
          if (response.status === 400 || response.status === 403) {
          // External API explicitly rejected the redirect_uri as invalid
          // Don't fall back to other methods - trust the API's validation
          return res.status(400).json({
            message: errorData.message || 'Invalid redirect_uri for this client_id',
            safe_redirect: '/app'
          })
          }
        }
      } catch (error) {
        console.error('Error validating redirect_uri with external API:', error)
        // Continue to fallback validation methods
      }
    }

    // Step 2: Fallback - Check if this client_id has used this redirect_uri before
    // Query for any existing tokens with this client_id and team_id
    const tokensSnapshot = await firestore
      .collection('mcpOauthTokens')
      .where('team_id', '==', team.id)
      .where('client_id', '==', client_id)
      .limit(1)
      .get()

    if (!tokensSnapshot.empty) {
      // If client has existing tokens, check if redirect_domain matches
      const tokenData = tokensSnapshot.docs[0].data()
      const storedDomain = tokenData.redirect_domain?.toLowerCase()
      
      if (storedDomain && storedDomain === redirectDomain) {
        isValidRedirect = true
      }
    }

    // Step 3: Fallback - Check trusted domains whitelist
    // Only use this if external API is unavailable and no existing tokens
    // This allows known MCP clients to work even if API is temporarily down
    if (!isValidRedirect && tokensSnapshot.empty && isTrustedDomain(redirectDomain)) {
      isValidRedirect = true
    }

    // If validation passed or external API unavailable, construct safe redirect
    if (isValidRedirect) {
      const params = new URLSearchParams({
        error: 'access_denied',
        state: state || '',
      })
      
      const finalUrl = new URL(redirect_uri)
      params.forEach((value, key) => {
        finalUrl.searchParams.append(key, value)
      })

      return res.status(200).json({
        ok: true,
        redirect_uri: finalUrl.toString(),
        params: Object.fromEntries(params)
      })
    }

    // If validation failed, redirect to safe location
    return res.status(400).json({
      message: 'Invalid redirect_uri for this client_id',
      safe_redirect: '/app'
    })

  } catch (error) {
    console.error('Error processing authorization denial:', error)
    return res.status(500).json({ 
      message: 'Error processing authorization denial',
      safe_redirect: '/app'
    })
  }
}
