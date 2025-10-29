import userTeamCheck from '@/lib/userTeamCheck'
import { sanitizeURL } from '@/utils/helpers'
import { crawlAndExtract, uploadScreenshotToStorage } from '@/utils/crawlHelpers'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { validateBusinessUrl } from '@/utils/websiteValidation'

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
        const redirectValidation = validateBusinessUrl(
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
  const businessValidation = validateBusinessUrl(sanitizedURL)
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
