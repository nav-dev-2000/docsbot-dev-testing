import userTeamCheck from '@/lib/userTeamCheck'
import { sanitizeURL } from '@/utils/helpers'
import { crawlAndExtract, uploadScreenshotToStorage } from '@/utils/crawlHelpers'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import { configureFirebaseApp } from '@/config/firebase-server.config'

// Blocked domains - popular consumer sites that aren't business websites
const BLOCKED_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'linkedin.com',
  'reddit.com',
  'pinterest.com',
  'snapchat.com',
  'whatsapp.com',
  'telegram.org',
  'discord.com',
  'twitch.tv',
  'netflix.com',
  'amazon.com',
  'ebay.com',
  'wikipedia.org',
  'github.com',
  'stackoverflow.com',
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'msn.com',
  'live.com',
]

/**
 * Validates that a URL is safe for server-side requests and appropriate for business use
 * Blocks: IP addresses, localhost, private networks, and consumer sites
 */
const isBusinessUrlValid = (urlString) => {
  try {
    const url = new URL(urlString)
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed.' }
    }
    
    const hostname = url.hostname.toLowerCase()
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || 
        hostname === '0.0.0.0' ||
        hostname.match(/^127\.\d+\.\d+\.\d+$/)) {
      return { valid: false, error: 'Localhost URLs are not allowed.' }
    }
    
    // Block all IPv4 addresses (including public IPs)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    if (hostname.match(ipv4Regex)) {
      return { valid: false, error: 'IP addresses are not allowed. Please use a domain name.' }
    }
    
    // Block IPv6 addresses
    if (hostname.includes(':') || hostname.match(/^\[[\da-f:]+\]$/i)) {
      return { valid: false, error: 'IP addresses are not allowed. Please use a domain name.' }
    }
    
    // Block private IP ranges (additional check)
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number)
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (AWS metadata)
      if (a === 10 || 
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 169 && b === 254)) {
        return { valid: false, error: 'Private network addresses are not allowed.' }
      }
    }
    
    // Block popular consumer domains
    for (const blockedDomain of BLOCKED_DOMAINS) {
      if (hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`)) {
        return { 
          valid: false, 
          error: `${blockedDomain} is not allowed. Please enter your business website URL.` 
        }
      }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

/**
 * Performs a quick HEAD request to validate the URL is accessible
 * Uses a short timeout to fail fast
 */
const validateUrlAccessibility = async (urlString) => {
  const makeRequest = async (method) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    try {
      return await fetch(urlString, {
        method,
        signal: controller.signal,
        redirect: 'manual', // Don't auto-follow redirects
        headers: {
          'User-Agent': 'DocsBot-Validator/1.0',
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const validateResponse = (response) => {
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (location) {
        // Validate redirect target is also safe
        const redirectValidation = isBusinessUrlValid(
          location.startsWith('http') ? location : new URL(location, urlString).href
        )
        if (!redirectValidation.valid) {
          return { valid: false, error: 'Website redirects to an invalid or blocked URL.' }
        }
      }
    }

    // Accept 2xx and 3xx status codes
    if (response.status >= 200 && response.status < 400) {
      return { valid: true }
    }

    return {
      valid: false,
      error: `Website returned ${response.status} error. Please check the URL.`
    }
  }

  try {
    const headResponse = await makeRequest('HEAD')

    if ([403, 405].includes(headResponse.status)) {
      const getResponse = await makeRequest('GET')
      return validateResponse(getResponse)
    }

    return validateResponse(headResponse)
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        valid: false,
        error: 'Website took too long to respond. Please check the URL.'
      }
    }
    return {
      valid: false,
      error: 'Unable to reach website. Please verify the URL is correct and accessible.'
    }
  }
}

export default async function handler(req, res) {
  configureFirebaseApp()
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  }

  // Check if user has access to the team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check

  if (!canUserCreateDeleteBot(team, userId)) {
    return res.status(403).json({ message: 'You are not allowed to create bot.' })
  }

  if (process.env?.VERCEL_REGION === 'hkg1') {
    return res
      .status(500)
      .json({ message: 'Unfortunately this feature is not available in Hong Kong.' })
  }

  const { siteURL, metadata } = req.body || {}

  if (!siteURL) {
    return res.status(400).json({ message: 'Missing siteURL parameter' })
  }

  const sanitizedURL = sanitizeURL(siteURL)

  if (!sanitizedURL) {
    return res.status(400).json({ message: 'Invalid siteURL parameter' })
  }

  // Validate URL for security and business use
  const businessValidation = isBusinessUrlValid(sanitizedURL)
  if (!businessValidation.valid) {
    return res.status(400).json({ message: businessValidation.error })
  }

  // Quick HEAD request to validate URL is accessible
  const accessibilityValidation = await validateUrlAccessibility(sanitizedURL)
  if (!accessibilityValidation.valid) {
    return res.status(400).json({ message: accessibilityValidation.error })
  }

  try {
    const botConfig = await crawlAndExtract(sanitizedURL, metadata)

    const url = new URL(sanitizedURL)

    // Upload screenshot to Firebase Storage (without botId since bot hasn't been created yet)
    let firebaseScreenshotUrl = botConfig.screenshotUrl
    if (botConfig.screenshotUrl) {
      const uploadedUrl = await uploadScreenshotToStorage(botConfig.screenshotUrl, team.id, null)
      if (uploadedUrl) {
        firebaseScreenshotUrl = uploadedUrl
      }
    }

    return res.status(200).json({
      ...botConfig,
      screenshotUrl: firebaseScreenshotUrl,
      url: sanitizedURL,
      domain: url.hostname,
    })
  } catch (error) {
    console.error('Error analyzing website for onboarding:', error)
    return res.status(500).json({ message: error?.message || 'Failed to analyze website.' })
  }
}
