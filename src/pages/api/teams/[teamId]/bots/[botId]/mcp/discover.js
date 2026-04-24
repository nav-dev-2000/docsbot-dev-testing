import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { getBot } from '@/lib/dbQueries'
import { validateOutboundFetchUrl } from '@/utils/outboundUrlValidation'
import { isValidHttpFieldName } from '@/lib/httpFieldName'

export async function fetchOutbound(urlString, init = {}) {
  const v = await validateOutboundFetchUrl(urlString)
  if (!v.valid) {
    const err = new Error(v.error)
    err.code = 'OUTBOUND_BLOCKED'
    throw err
  }
  return fetch(v.normalizedUrl, init)
}

/**
 * customHeaders (API keys, etc.) are only for the user-configured MCP server. Metadata
 * fetches to other origins, or to URLs taken from 401/JSON (WWW-Authenticate,
 * resource documents), must not receive them, or a malicious endpoint could exfiltrate secrets.
 * Only send custom headers to outbound requests whose origin matches the MCP server URL.
 */
export function extraHeadersForSameOriginMcp(mcpUrlString, targetUrlString, extraHeaders) {
  if (!extraHeaders || typeof extraHeaders !== 'object') {
    return {}
  }
  try {
    if (new URL(mcpUrlString).origin === new URL(targetUrlString).origin) {
      return { ...extraHeaders }
    }
  } catch {
    // ignore
  }
  return {}
}

async function parseMcpToolsResponse(response) {
  const raw = await response.text()
  let data
  const match = raw.match(/data:\s*(\{.*\})/s)

  if (match) {
    try {
      data = JSON.parse(match[1])
    } catch (e) {
      throw new Error('Error parsing MCP tools SSE data')
    }
  } else {
    try {
      data = JSON.parse(raw)
    } catch (e) {
      console.error('Failed to parse MCP response as JSON or SSE:', raw)
      throw new Error('Error discovering MCP tools: Invalid response format')
    }
  }

  if (data.result && data.result.tools) {
    const dataTools = data.result.tools.map(t => ({
      name: t.name,
      description: t.description,
    }))
    return dataTools
  }

  throw new Error('Error discovering MCP tools')
}

// Fallback using the official MCP client, mirroring your working Python MCP example.
// Uses SSEClientTransport against the MCP server URL and lists tools via listTools().
// The bearer token should be provided via NOTION_MCP_TOKEN env var; do not hard-code it.
async function fallbackMcpToolsList(serverUrl, authHeader) {
  try {
    const botApiBase = process.env.NEXT_PUBLIC_BOT_API_URL
    const internalApiKey = process.env.INTERNAL_API_KEY
    if (!botApiBase || !internalApiKey) {
      return null
    }
    const response = await fetch(`${botApiBase}/internal/mcp/tools/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${internalApiKey}`,
      },
      body: JSON.stringify({
        server_url: serverUrl,
        server_token: authHeader,
      }),
    })
    if (response.ok) {
      const data = await response.json()
      return data?.tools?.map(t => ({
        name: t.name,
        description: t.description,
      })) || []
    }
    return null
  }
  catch (e) {
    console.error('Error in MCP client fallback tools/list:', e)
    return null
  }
}

function extractRootDomain(hostname) {
  const parts = (hostname || '').split('.').filter(Boolean)
  if (parts.length <= 2) return parts.join('.')
  return parts.slice(-2).join('.')
}

function parseWwwAuthenticateForOAuthHeaderEndpoints(wwwAuthHeader) {
  if (!wwwAuthHeader) return null

  const quotedAuthUri =
    wwwAuthHeader.match(/authorization_uri="([^"]+)"/i)?.[1] ||
    wwwAuthHeader.match(/authorization_endpoint="([^"]+)"/i)?.[1]
  const quotedTokenUri =
    wwwAuthHeader.match(/token_uri="([^"]+)"/i)?.[1] ||
    wwwAuthHeader.match(/token_endpoint="([^"]+)"/i)?.[1]

  if (!quotedAuthUri && !quotedTokenUri) return null

  return {
    authorization_endpoint: quotedAuthUri || null,
    token_endpoint: quotedTokenUri || null
  }
}

async function discoverOAuthMetadataByDomainHeuristics(mcpUrl, url, extraHeaders = {}) {
  const baseUrl = `${url.protocol}//${url.host}`
  const rootDomain = extractRootDomain(url.hostname)
  const rootBaseUrl = rootDomain ? `${url.protocol}//${rootDomain}` : null
  const authSubdomain = rootDomain ? `${url.protocol}//auth.${rootDomain}` : null

  // 1) Try well-known metadata on related domains.
  // Many MCP deployments host auth on auth.<root-domain> or <root-domain>.
  const wellKnownCandidates = [
    { base: baseUrl, pathPrefix: '' },
    ...(rootBaseUrl && rootBaseUrl !== baseUrl ? [{ base: rootBaseUrl, pathPrefix: '' }] : []),
    ...(authSubdomain ? [{ base: authSubdomain, pathPrefix: '' }] : []),
  ]

  for (const candidate of wellKnownCandidates) {
    const rfcMeta = await fetchAuthServerMetadata(
      mcpUrl,
      candidate.base,
      candidate.pathPrefix,
      extraHeaders,
    )
    if (rfcMeta) return rfcMeta
    const oidcMeta = await fetchOidcMetadata(mcpUrl, candidate.base, extraHeaders)
    if (oidcMeta) return oidcMeta
  }

  return null
}

/**
 * Attempt to discover OAuth authorization server metadata.
 * Follows MCP OAuth spec:
 *   1. Check WWW-Authenticate header for resource_metadata URL
 *   2. Try /.well-known/oauth-authorization-server (RFC 8414)
 *   3. Try /.well-known/openid-configuration (OIDC fallback)
 */
async function discoverOAuthMetadata(serverUrl, extraHeaders = {}) {
  const url = new URL(serverUrl)

  // Step 1: Send a request to the MCP server and check for 401 + WWW-Authenticate
  try {
    const probeResponse = await fetchOutbound(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...extraHeaders,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    })

    if (probeResponse.status === 401) {
      const wwwAuth = probeResponse.headers.get('www-authenticate') || ''

      // Some servers include direct authorization/token endpoints in WWW-Authenticate.
      const headerEndpoints = parseWwwAuthenticateForOAuthHeaderEndpoints(wwwAuth)
      if (headerEndpoints?.authorization_endpoint && headerEndpoints?.token_endpoint) {
        return { ...headerEndpoints, required_oauth: true }
      }

      // Look for resource_metadata="..." in the WWW-Authenticate header
      const rmMatch = wwwAuth.match(/resource_metadata="([^"]+)"/)
      if (rmMatch) {
        try {
          // Never forward custom headers: URL is server-controlled (may be another origin).
          const rmResponse = await fetchOutbound(rmMatch[1], {
            headers: {
              Accept: 'application/json',
            },
          })
          if (rmResponse.ok) {
            const resourceMeta = await rmResponse.json()
            // Resource metadata should point to the authorization server
            if (resourceMeta.authorization_servers?.length > 0) {
              const authServerUrl = resourceMeta.authorization_servers[0]
              // Fetch the auth server's own metadata (URL is from remote JSON, not custom headers)
              const asMeta = await fetchAuthServerMetadata(
                serverUrl,
                String(authServerUrl),
                '',
                {},
              )
              if (asMeta) {
                return { ...asMeta, resource_metadata: resourceMeta }
              }
            }
          }
        } catch (e) {
          if (e.code !== 'OUTBOUND_BLOCKED') {
            console.error('Error fetching resource_metadata:', e.message)
          }
        }
      }

      // Step 2: Try RFC 8414 .well-known at the server's origin
      const baseUrl = `${url.protocol}//${url.host}`
      const rfcMeta = await fetchAuthServerMetadata(serverUrl, baseUrl, '', extraHeaders)
      if (rfcMeta) return rfcMeta

      // Step 3: Try path-nested .well-known (for servers at subpaths)
      if (url.pathname && url.pathname !== '/') {
        const pathBase = url.pathname.replace(/\/+$/, '')
        const pathMeta = await fetchAuthServerMetadata(
          serverUrl,
          baseUrl,
          pathBase,
          extraHeaders,
        )
        if (pathMeta) return pathMeta
      }

      // Step 4: OIDC fallback
      const oidcMeta = await fetchOidcMetadata(serverUrl, baseUrl, extraHeaders)
      if (oidcMeta) return oidcMeta

      // Step 5: Domain heuristics fallback (e.g. mcp.calendly.com -> auth.calendly.com)
      const heuristicMeta = await discoverOAuthMetadataByDomainHeuristics(
        serverUrl,
        url,
        extraHeaders,
      )
      if (heuristicMeta) return heuristicMeta

      // 401 but no metadata found
      return { requiresAuth: true, noMetadata: true }
    }

    // Not a 401, server doesn't require OAuth
    return null
  } catch (e) {
    if (e.code === 'OUTBOUND_BLOCKED') {
      return null
    }
    console.error('Error probing MCP server for OAuth:', e.message)
    return null
  }
}

/**
 * Fetch OAuth Authorization Server Metadata (RFC 8414)
 */
async function fetchAuthServerMetadata(
  mcpUrl,
  targetBase,
  pathPrefix = '',
  extraHeaders = {},
) {
  const wellKnownUrl = pathPrefix
    ? `${targetBase}/.well-known/oauth-authorization-server${pathPrefix}`
    : `${targetBase}/.well-known/oauth-authorization-server`

  try {
    const response = await fetchOutbound(wellKnownUrl, {
      headers: {
        ...extraHeadersForSameOriginMcp(mcpUrl, wellKnownUrl, extraHeaders),
      },
    })
    if (response.ok) {
      const metadata = await response.json()
      if (metadata.authorization_endpoint && metadata.token_endpoint) {
        return metadata
      }
    }
  } catch (e) {
    if (e.code === 'OUTBOUND_BLOCKED') {
      return null
    }
    console.error(`Error fetching ${wellKnownUrl}:`, e.message)
  }
  return null
}

/**
 * Fetch OIDC Discovery metadata (fallback)
 */
async function fetchOidcMetadata(mcpUrl, targetBase, extraHeaders = {}) {
  const oidcUrl = `${targetBase}/.well-known/openid-configuration`
  try {
    const response = await fetchOutbound(oidcUrl, {
      headers: {
        ...extraHeadersForSameOriginMcp(mcpUrl, oidcUrl, extraHeaders),
      },
    })
    if (response.ok) {
      const metadata = await response.json()
      if (metadata.authorization_endpoint && metadata.token_endpoint) {
        return metadata
      }
    }
  } catch (e) {
    if (e.code === 'OUTBOUND_BLOCKED') {
      return null
    }
    console.error('Error fetching OIDC metadata:', e.message)
  }
  return null
}

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (req.method !== 'POST') {
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
  const { serverUrl } = req.body

  if (!serverUrl) {
    return res.status(400).json({ message: 'Server URL is required' })
  }

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    if (!canUserManageBotSettings(team, userId, bot)) {
      return res.status(403).json({ message: 'You are not allowed to manage this bot.' })
    }

    // Determine the Authorization header to use
    let authHeader = null

    // Normalize server URL (remove trailing slash) — hash key stays stable for existing OAuth docs
    const normalizedServerUrl = serverUrl.replace(/\/+$/, '')
    const matchingServer = Array.isArray(bot?.mcpServers)
      ? bot.mcpServers.find((server) => {
          const candidateUrl = typeof server?.serverUrl === 'string'
            ? server.serverUrl.replace(/\/+$/, '')
            : ''
          return candidateUrl === normalizedServerUrl
        })
      : null

    const customHeaders = {}
    if (
      matchingServer?.customHeaders &&
      typeof matchingServer.customHeaders === 'object' &&
      !Array.isArray(matchingServer.customHeaders)
    ) {
      Object.entries(matchingServer.customHeaders).forEach(([rawKey, rawValue]) => {
        const key = typeof rawKey === 'string' ? rawKey.trim() : ''
        if (!key || !isValidHttpFieldName(key)) return
        customHeaders[key] = rawValue == null ? '' : String(rawValue)
      })
    }
    const outboundCheck = await validateOutboundFetchUrl(normalizedServerUrl)
    if (!outboundCheck.valid) {
      return res.status(400).json({ message: outboundCheck.error })
    }
    const safeServerUrl = outboundCheck.normalizedUrl
    const serverUrlHash = Buffer.from(normalizedServerUrl).toString('base64url')
    
    // Check for stored OAuth tokens
    const oauthDocRef = firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('mcpExternalOAuth')
      .doc(serverUrlHash)
    const oauthDoc = await oauthDocRef.get()

    if (oauthDoc.exists) {
      const oauthData = oauthDoc.data()
      if (oauthData.access_token) {
        // Check if token is expired
        if (oauthData.expires_at && Date.now() > oauthData.expires_at) {
          // Try to refresh
          if (oauthData.refresh_token && oauthData.token_endpoint) {
            try {
              const refreshParams = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: oauthData.refresh_token,
                client_id: oauthData.client_id,
              })
              if (oauthData.client_secret) {
                refreshParams.append('client_secret', oauthData.client_secret)
              }
              const tokenEndpointCheck = await validateOutboundFetchUrl(
                oauthData.token_endpoint,
              )
              if (!tokenEndpointCheck.valid) {
                console.warn(
                  'Blocked OAuth token_endpoint for refresh:',
                  tokenEndpointCheck.error,
                )
              } else {
                const refreshResponse = await fetch(tokenEndpointCheck.normalizedUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: refreshParams.toString(),
                })
                if (refreshResponse.ok) {
                  const tokenData = await refreshResponse.json()
                  const updatedData = {
                    access_token: tokenData.access_token,
                    expires_at: tokenData.expires_in
                      ? Date.now() + tokenData.expires_in * 1000
                      : null,
                    updatedAt: new Date().toISOString(),
                  }
                  if (tokenData.refresh_token) {
                    updatedData.refresh_token = tokenData.refresh_token
                  }
                  await oauthDocRef.update(updatedData)
                  authHeader = `Bearer ${tokenData.access_token}`
                } else if (refreshResponse.status === 400 || refreshResponse.status === 401) {
                  // Token revoked or invalid
                  console.warn('Refresh token rejected, deleting credentials:', refreshResponse.status)
                  await oauthDocRef.delete()
                  // Force user to re-authenticate
                  authHeader = null // This will trigger the probe for requiresAuth
                } else {
                  console.error('Refresh token failed with status:', refreshResponse.status)
                }
              }
            } catch (e) {
              console.error('Error refreshing OAuth token:', e.message)
            }
          }
        } else {
          authHeader = `Bearer ${oauthData.access_token}`
        }
      }
    }

    // If no stored token and no manual header, probe for OAuth requirement
    if (!authHeader) {
      const oauthMeta = await discoverOAuthMetadata(safeServerUrl, customHeaders)
      if (oauthMeta) {
        if (oauthMeta.noMetadata) {
          return res.status(401).json({
            message:
              'Server requires authentication but no OAuth metadata was found. This MCP server most likely expects an API key or token in a request header (for example an "Authorization: Bearer &lt;token&gt;" header). Please configure the required header on the server side or in your MCP client settings.',
            requiresAuth: true,
            authHint: 'api_key_header',
          })
        }
        // Server requires OAuth — return metadata so frontend can initiate flow
        return res.status(200).json({
          requiresOAuth: true,
          authMetadata: {
            issuer: oauthMeta.issuer,
            authorization_endpoint: oauthMeta.authorization_endpoint,
            token_endpoint: oauthMeta.token_endpoint,
            registration_endpoint: oauthMeta.registration_endpoint,
            scopes_supported: oauthMeta.scopes_supported,
            response_types_supported: oauthMeta.response_types_supported,
            grant_types_supported: oauthMeta.grant_types_supported,
            code_challenge_methods_supported: oauthMeta.code_challenge_methods_supported,
            client_id_metadata_document_supported: oauthMeta.client_id_metadata_document_supported,
          },
        })
      }
    }

    // Prepare request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...customHeaders,
    }

    if (authHeader) {
      requestHeaders['Authorization'] = authHeader
    }
    const response = await fetch(safeServerUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    })

    if (response.status === 401) {
      // Even with our token, got 401 — token might be revoked
      if (oauthDoc.exists) {
        // Clear the stored token so user can re-auth
        await oauthDocRef.delete()
        return res.status(401).json({
          message: 'Stored OAuth token was rejected. Please re-authenticate.',
          requiresReauth: true,
        })
      }
      return res.status(401).json({
        message: 'Server requires authentication.',
        requiresAuth: true,
      })
    }

    try {
      const tools = await parseMcpToolsResponse(response)
      return res.status(200).json({
        message: 'MCP tools discovered successfully',
        tools,
      })
    } catch (parseError) {
      console.error('Primary MCP tools/list parse failed, trying fallback:', parseError.message)

      // Fallback path similar to your Python client that works
      const fallbackTools = await fallbackMcpToolsList(safeServerUrl, authHeader)
      if (fallbackTools && fallbackTools.length) {
        return res.status(200).json({
          message: 'MCP tools discovered successfully (fallback)',
          tools: fallbackTools,
        })
      }

      return res.status(500).json({ message: parseError.message })
    }

  } catch (error) {
    console.error('Error discovering MCP tools with SDK:', error)
    return res.status(500).json({ message: 'Error discovering MCP tools' })
  }
}
