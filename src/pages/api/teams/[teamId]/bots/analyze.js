import userTeamCheck from '@/lib/userTeamCheck'
import { sanitizeURL } from '@/utils/helpers'
import { crawlAndExtract, uploadScreenshotToStorage } from '@/utils/crawlHelpers'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import { configureFirebaseApp } from '@/config/firebase-server.config'

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
