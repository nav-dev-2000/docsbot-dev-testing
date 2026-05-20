import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getBots } from '@/lib/dbQueries'
import { useEffect, useMemo, useState } from 'react'
import Alert from '@/components/Alert'
import Head from 'next/head'
import docsbotLogo from '@/images/docsbot-logo.png'
import Image from 'next/image'
import Link from 'next/link'
import { checkPlanPermission } from '@/utils/helpers'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'

// Helper function to safely extract domain from redirect_uri
const getDomainFromUri = (uri) => {
  if (!uri) return null
  
  try {
    // Handle both http:// and https:// URLs
    let urlString = uri
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      urlString = `https://${uri}`
    }
    
    const url = new URL(urlString)
    return url.hostname
  } catch (error) {
    // If URL parsing fails, try to extract domain manually
    try {
      const match = uri.match(/^(?:https?:\/\/)?([^\/\s]+)/)
      return match ? match[1] : null
    } catch (e) {
      return null
    }
  }
}

// Helper function to get friendly interface name from domain
const getInterfaceName = (domain) => {
  if (!domain) return null
  
  const domainLower = domain.toLowerCase()
  
  // Map common MCP-supporting domains to friendly names
  const domainMap = {
    // Anthropic/Claude
    'claude.ai': 'Claude',
    'anthropic.com': 'Claude',
    'console.anthropic.com': 'Claude Console',
    
    // OpenAI/ChatGPT
    'chatgpt.com': 'ChatGPT',
    'chat.openai.com': 'ChatGPT',
    'openai.com': 'ChatGPT',
    'platform.openai.com': 'OpenAI Platform',
    
    // Cursor IDE
    'cursor.sh': 'Cursor',
    'cursor.com': 'Cursor',
    
    // Continue.dev
    'continue.dev': 'Continue',
    
    // Aider
    'aider.chat': 'Aider',
    
    // Other common MCP clients
    'github.com': 'GitHub',
    'github.dev': 'GitHub Codespaces',
    'vscode.dev': 'VS Code',
    'code.visualstudio.com': 'VS Code',
  }
  
  // Check exact match first
  if (domainMap[domainLower]) {
    return domainMap[domainLower]
  }
  
  // Check if domain contains known patterns
  if (domainLower.includes('claude') || domainLower.includes('anthropic')) {
    return 'Claude'
  }
  if (domainLower.includes('chatgpt') || domainLower.includes('openai')) {
    return 'ChatGPT'
  }
  if (domainLower.includes('cursor')) {
    return 'Cursor'
  }
  if (domainLower.includes('continue')) {
    return 'Continue'
  }
  if (domainLower.includes('aider')) {
    return 'Aider'
  }
  
  // Return null if no friendly name found (will use domain as fallback)
  return null
}

// Helper function to safely append query parameters to a redirect URI
// Handles cases where redirect_uri may already contain query parameters
const appendQueryParams = (redirectUri, params) => {
  try {
    const url = new URL(redirectUri)
    // Append each parameter from the params object/URLSearchParams
    if (params instanceof URLSearchParams) {
      params.forEach((value, key) => {
        url.searchParams.append(key, value)
      })
    } else if (typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    return url.toString()
  } catch (error) {
    // Fallback to string concatenation if URL parsing fails
    // This should rarely happen with valid redirect URIs
    const separator = redirectUri.includes('?') ? '&' : '?'
    const queryString = params instanceof URLSearchParams 
      ? params.toString() 
      : new URLSearchParams(params).toString()
    return `${redirectUri}${separator}${queryString}`
  }
}

export default function Authorize({ user, team, bots, queryParams = {}, error }) {
  const [errorText, setErrorText] = useState(error)
  const [loading, setLoading] = useState(false)
  const [selectedBot, setSelectedBot] = useState(null)
  const [search, setSearch] = useState('')
  
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    resource,
    bot_id,
    bot_ids,
  } = queryParams

  const sortedBots = useMemo(() => {
    return [...(bots || [])].sort((a, b) => {
      const aName = String(a?.name || `Bot ${a?.id || ''}`).toLowerCase()
      const bName = String(b?.name || `Bot ${b?.id || ''}`).toLowerCase()
      return aName.localeCompare(bName)
    })
  }, [bots])

  const filteredBots = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedBots
    return sortedBots.filter((bot) => {
      const name = String(bot?.name || '').toLowerCase()
      const id = String(bot?.id || '').toLowerCase()
      return name.includes(q) || id.includes(q)
    })
  }, [search, sortedBots])

  useEffect(() => {
    if (!sortedBots.length || selectedBot) return

    const resourceText = typeof resource === 'string' ? resource : ''
    const match = resourceText.match(/\/bots\/([^/]+)/)
    const resourceBotId = match ? match[1] : null
    const explicitBotId = typeof bot_id === 'string' ? bot_id : null
    const explicitBotIds = typeof bot_ids === 'string' ? bot_ids.split(',')[0]?.trim() : null
    const preferredBotId = explicitBotId || explicitBotIds || resourceBotId

    if (preferredBotId) {
      const preferredBot = sortedBots.find((bot) => bot.id === preferredBotId)
      if (preferredBot) {
        setSelectedBot(preferredBot)
        return
      }
    }

    if (sortedBots.length === 1) {
      setSelectedBot(sortedBots[0])
    }
  }, [bot_id, bot_ids, resource, selectedBot, sortedBots])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Alert type="error" title={error} />
      </div>
    )
  }

  // Extract domain from redirect_uri safely
  const domain = getDomainFromUri(redirect_uri)
  const interfaceName = getInterfaceName(domain)
  // Use friendly name if available, otherwise use domain as fallback
  const displayName = interfaceName || domain || 'Unknown Application'

  const handleDeny = async () => {
    setLoading(true)
    setErrorText(null)

    try {
      const response = await fetch('/api/authorize/deny', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id,
          redirect_uri,
          state,
        }),
      })

      const data = await response.json()
      
      if (data.ok && data.redirect_uri) {
        // Server validated redirect_uri - safe to redirect
        // Use params from API response if available, otherwise use OAuth standard error format
        const params = data.params || {
          error: 'access_denied',
          state: state || '',
        }
        
        // Check if redirect_uri already has query parameters
        // If it does, the external API may have already formatted it correctly
        const url = new URL(data.redirect_uri)
        if (url.search && url.search.length > 0) {
          // redirect_uri already has query params - use it as-is
          // The external API knows the correct format for each client
          console.log('Using redirect_uri with existing query params:', data.redirect_uri)
          window.location.href = data.redirect_uri
        } else {
          // Append params to redirect_uri
          const finalUrl = appendQueryParams(data.redirect_uri, params)
          console.log('Appending params to redirect_uri:', { redirect_uri: data.redirect_uri, params, finalUrl })
          window.location.href = finalUrl
        }
      } else {
        // Validation failed - redirect to safe location
        const safeRedirect = data.safe_redirect || '/app'
        setErrorText(data.message || 'Invalid redirect URI. Redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = safeRedirect
        }, 2000)
      }
    } catch (err) {
      console.error('Error processing denial:', err)
      setErrorText('Failed to process authorization denial. Redirecting to dashboard...')
      setTimeout(() => {
        window.location.href = '/app'
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setLoading(true)
    setErrorText(null)

    const formData = new URLSearchParams()
    formData.append('action', 'approve')
    formData.append('client_id', client_id)
    formData.append('redirect_uri', redirect_uri)
    formData.append('scope', scope || '')
    formData.append('state', state || '')
    formData.append('code_challenge', code_challenge || '')
    formData.append('resource', resource || '')
    formData.append('team_id', team?.id || '')
    formData.append('bot_ids', selectedBot?.id || '')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BOT_API_URL}/authorize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      )

      const data = await response.json()
      if (data.ok) {
        const params = new URLSearchParams(data.params)
        const finalUrl = appendQueryParams(redirect_uri, params)
        window.location.href = finalUrl
      } else {
        setErrorText(data.error || 'An error occurred during authorization.')
        setLoading(false)
      }
    } catch (err) {
      setErrorText('Failed to connect to the authorization server.')
      setLoading(false)
    }
  }



  return (
    <>
      <Head>
        <title>Authorize MCP Server Access - DocsBot</title>
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-2">
        <div className="w-full max-w-md">
          <div className="mb-4 flex justify-center">
               <Image src={docsbotLogo} alt="DocsBot Logo" width={100} height={100} className="h-10 w-auto" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Authorize MCP Server Access
              </h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{displayName}</span>
              {client_id && (
                <> (<span className="font-mono text-xs">{client_id}</span>)</>
              )}
              {' '}wants to connect to your DocsBot account for read-only access to your knowledge bases.
            </p>

            <div className="mt-1">
              <Listbox value={selectedBot} onChange={setSelectedBot}>
                <Label className="block text-sm font-semibold text-gray-700">
                  Select the bot this application can access:
                </Label>
                <div className="relative mt-2">
                  <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-600 sm:text-sm/6">
                    <span className="col-start-1 row-start-1 truncate pr-6">
                      {selectedBot ? (selectedBot?.name || `Bot ${selectedBot?.id}`) : '-- Select a bot --'}
                    </span>
                    <ChevronUpDownIcon
                      aria-hidden="true"
                      className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                  </ListboxButton>

                  <ListboxOptions
                    transition
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-1 outline-black/5 data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                  >
                    <div className="px-2 pb-2">
                      <input
                        id="bot-search"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search bots..."
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                    {filteredBots.map((bot) => (
                      <ListboxOption
                        key={bot.id}
                        value={bot}
                        className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-cyan-600 data-[focus]:text-white data-[focus]:outline-none"
                      >
                        <span className="block truncate font-normal group-data-[selected]:font-semibold">
                          {bot?.name || `Bot ${bot?.id}`}
                        </span>

                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyan-600 group-[:not([data-selected])]:hidden group-data-[focus]:text-white">
                          <CheckIcon aria-hidden="true" className="size-5" />
                        </span>
                      </ListboxOption>
                    ))}
                    {filteredBots.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No bots match your search.
                      </div>
                    )}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500">
                This will allow the MCP server to read and search your selected knowledge bases. 
                You can revoke access anytime from your{' '}
                <Link href="/app/api" className="text-cyan-600 hover:text-cyan-500 underline">
                  account settings
                </Link>.
              </p>
            </div>

            {errorText && (
              <div className="mt-4">
                <Alert type="error" title={errorText} />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={handleDeny}
                disabled={loading}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loading || !selectedBot}
                className="w-full rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Allow Access'}
              </button>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/app"
                className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


export const getServerSideProps = async (context) => {
  const authData = await getAuthorizedUserCurrentTeam(context)

  if (!authData.props) {
    // Not authenticated, middleware should have redirected
    return authData
  }

  const {
    client_id,
    redirect_uri,
  } = context.query

  if (!client_id || !redirect_uri) {
    return {
      props: {
        error: 'Missing required parameters: client_id and redirect_uri.',
      },
    }
  }

  const { user, team, userId } = authData.props

  // Check if team has Standard plan or higher (required for MCP OAuth)
  const mcpPlanPermission = checkPlanPermission(team, 'standard')
  if (!mcpPlanPermission.allowed) {
    return {
      props: {
        error: `MCP OAuth is only available on the ${mcpPlanPermission.requiredPlanLabel} plan or higher. Please upgrade your plan to use this feature.`,
      },
    }
  }

  const sanitizedUser = user
    ? {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      }
    : null

  const bots = await getBots(team)

  return {
    props: {
      ...authData.props,
      user: sanitizedUser,
      team,
      bots,
      queryParams: context.query,
    },
  }
}
