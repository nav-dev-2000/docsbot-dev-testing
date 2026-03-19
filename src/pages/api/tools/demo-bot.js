import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { QueueSourceIngest } from '@/lib/service'
import { detectRegionFromHeaders } from '@/lib/regionUtils'
import { getURL, isValidURL, sanitizeURL } from '@/utils/helpers'
import {
  createDemoTrialToken,
  normalizeDomainForToken,
} from '@/lib/demoTrialToken'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import { i18n } from '@/constants/strings.constants'
import { crawlAndExtract } from '@/utils/crawlHelpers'
import { checkDemoBotRateLimit, saveDemoBotRecord } from '@/lib/tools'
import crypto from 'crypto'
import { uploadScreenshotToStorage } from '@/utils/crawlHelpers'

const isColorLight = (hexColor) => {
  if (!hexColor) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

const selectBestLogo = (logos, selectedColor) => {
  if (!logos || logos.length === 0) return ''
  
  const isLight = isColorLight(selectedColor)
  
  // Prefer full logos over icons
  const fullLogos = logos.filter(logo => logo.type === 'logo')
  const iconLogos = logos.filter(logo => logo.type === 'icon')
  
  const logosToConsider = fullLogos.length > 0 ? fullLogos : iconLogos
  
  // Try to find a logo that matches the color mode
  if (isLight) {
    // For light colors, prefer dark mode logos (or opaque backgrounds)
    const darkLogo = logosToConsider.find(logo => 
      logo.mode === 'dark' || 
      logo.mode === 'has_opaque_background' ||
      !logo.mode // If no mode specified, try it
    )
    if (darkLogo) return darkLogo.url
  } else {
    // For dark colors, prefer light mode logos (or opaque backgrounds)
    const lightLogo = logosToConsider.find(logo => 
      logo.mode === 'light' || 
      logo.mode === 'has_opaque_background' ||
      !logo.mode // If no mode specified, try it
    )
    if (lightLogo) return lightLogo.url
  }
  
  // Fallback to first available logo of any mode
  return logosToConsider[0]?.url || logos[0]?.url || ''
}


// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = ['iad1', 'hnd1', 'lhr1', 'sfo1', 'syd1', 'bom1', 'fra1']

// Demo team ID from environment variables
const DEMO_TEAM_ID = process.env.NEXT_PUBLIC_DEMO_TEAM_ID

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { siteURL, isDemo } = req.body

    if (!siteURL) {
      return res.status(400).json({ message: 'Missing siteURL parameter' })
    }

    // Sanitize the URL to ensure it has https:// protocol and proper format
    const sanitizedURL = sanitizeURL(siteURL)
    if (!sanitizedURL) {
      return res.status(400).json({ message: 'Invalid siteURL parameter' })
    }

    // Check auth header for INTERNAL_API_KEY if isDemo is true
    if (isDemo) {
      const authHeader = req.headers.authorization
      const expectedKey = process.env.INTERNAL_API_KEY
      
      if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
        return res.status(401).json({ message: 'Unauthorized. Invalid or missing INTERNAL_API_KEY.' })
      }
    } else {
      // Check rate limit for unauthenticated users (when isDemo is false)
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const isRateLimited = await checkDemoBotRateLimit(ip, false)
      if (isRateLimited) {
        return res.status(429).json({ message: `Your IP has been rate limited. You can create one demo bot per day.` })
      }
    }

    if (!DEMO_TEAM_ID) {
      return res.status(500).json({ message: 'Demo team ID not configured. Please set NEXT_PUBLIC_DEMO_TEAM_ID environment variable.' })
    }

    const url = new URL(sanitizedURL)
    const hrefURL = sanitizedURL

    // we cannot generate the bot in hong kong
    if (process.env?.VERCEL_REGION === 'hkg1') {
      return res
        .status(500)
        .json({ message: `Unfortunately this feature is not available in Hong Kong.` })
    }

    try {
      configureFirebaseApp()
      const firestore = getFirestore()

      // 1. Get website HTML, screenshot, and generate bot configuration
      let botConfig
      try {
        botConfig = await crawlAndExtract(hrefURL)
      } catch (error) {
        console.error('Crawl and extract error:', error)
        return res.status(500).json({ message: error.message })
      }


      // 3. Create the bot under demo team (first create to get botId)
      const supportPrompt = PRESET_PROMPTS.CUSTOMER_SUPPORT?.prompt || ''
      
      // Select initial color - prioritize brand data, fall back to AI-detected/default
      let initialColor = '#0ea5e9'
      if (botConfig.colors && botConfig.colors.length > 0) {
        // Use the first primary brand color from brand.dev
        initialColor = botConfig.colors[0].hex
      } else if (botConfig.buttonColor) {
        // Fall back to AI-detected color if brand data not available
        initialColor = botConfig.buttonColor
      }
      
      // Select initial logo based on the chosen color
      let initialLogo = ''
      if (botConfig.logos && botConfig.logos.length > 0) {
        // Select best logo from brand data based on the color
        initialLogo = selectBestLogo(botConfig.logos, initialColor)
      } else if (botConfig.logoUrl) {
        // Fall back to AI-detected logo if brand data not available
        initialLogo = botConfig.logoUrl
      }
      
      // Final fallback for logo if still empty
      if (!initialLogo) {
        initialLogo = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
      }
      
      const initialBotData = {
        name: botConfig.botName,
        description: botConfig.botDescription || '',
        color: initialColor,
        privacy: 'public',
        language: botConfig.language || 'en',
        model: 'gpt-4.1-mini',
        temperature: 0,
        agentPrompt: supportPrompt
          .replace(/{company_name}/g, botConfig.businessName || botConfig.botName || 'your company')
          .replace(/{product_info}/g, botConfig.businessDescription || botConfig.botDescription || '')
          .replace(/{old_prompt}\n/g, '')
          .replace(/{old_prompt}/g, ''),
        labels: {
          firstMessage: botConfig.firstMessage,
          ...i18n[botConfig.language || 'en']?.labels || i18n.en.labels,
        },
        allowedDomains: [],
        icon: '',
        botIcon: '',
        logo: initialLogo,
        branding: true,
        imageUploads: true,
        showButtonLabel: false,
        hideSources: false,
        questions: [],
        glossary: [],
        rateLimitMessages: 10,
        rateLimitSeconds: 60,
        rateLimitIPAllowlist: [],
        recordIP: true,
        classify: true,
        isAgent: true,
        tools: {
          human_escalation: { enabled: true },
          followup_rating: { enabled: true },
        },
        embeddingModel: 'text-embedding-3-small',
        topics: [],
        allowOpenEndedTopics: true,
        signatureKey: crypto.randomBytes(32).toString('hex'),
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending',
        vectorDatabase: 'turbopuffer',
        region: detectRegionFromHeaders(req.headers),
        indexId: 'turbopuffer',
        sourceCount: 0,
        pageCount: 0,
        chunkCount: 0,
        questionCount: 0,
        supportLink: botConfig.supportUrl || `mailto:support@${url.hostname}`,
        widgetType: botConfig.widgetType || 'other',
        brandAnalysis: {
          domain: url.hostname,
          url: hrefURL,
          ...botConfig, // Include all analysis data (colors, logos, screenshotUrl, businessName, businessDescription, etc.)
        }
      }

      const docRef = await firestore
        .collection('teams')
        .doc(DEMO_TEAM_ID)
        .collection('bots')
        .add(initialBotData)

      const botId = docRef.id

      // Upload screenshot to Firebase Storage
      const firebaseScreenshotUrl = await uploadScreenshotToStorage(botConfig.screenshotUrl, DEMO_TEAM_ID, botId)
      
      // Update bot with Firebase screenshot URL if upload was successful
      if (firebaseScreenshotUrl) {
        await docRef.update({
          'brandAnalysis.screenshotUrl': firebaseScreenshotUrl
        })
      }

      // Turbopuffer: no tenant creation needed. Skip createTenant for demo bots.

      // 4. Screenshot URL is already saved in botData above

      // 5. Add URL source immediately
      const sourceData = {
        createdAt: FieldValue.serverTimestamp(),
        type: 'url',
        title: botConfig.name + ' Website',
        url: hrefURL,
        status: 'pending',
        pageCount: 0,
        chunkCount: 0,
        processImages: false,
      }

      const sourceRef = await firestore
        .collection('teams')
        .doc(DEMO_TEAM_ID)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .add(sourceData)

      // Queue source for processing
      await QueueSourceIngest(
        DEMO_TEAM_ID,
        botId,
        sourceRef.id,
        1000, // page limit for demo
        'turbopuffer',
        'url',
        sourceData.title,
        hrefURL,
        null, // no file
        null, // no faqs
      )

      let sourceCount = 1

      // If isDemo is true, also create a sitemap source
      if (isDemo) {
        const sitemapData = {
          createdAt: FieldValue.serverTimestamp(),
          type: 'sitemap',
          title: botConfig.name + ' Sitemap',
          url: hrefURL,
          status: 'pending',
          pageCount: 0,
          chunkCount: 0,
          processImages: false,
        }

        const sitemapRef = await firestore
          .collection('teams')
          .doc(DEMO_TEAM_ID)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .add(sitemapData)

        // Queue sitemap source for processing
        await QueueSourceIngest(
          DEMO_TEAM_ID,
          botId,
          sitemapRef.id,
          100000, // page limit for demo
          'turbopuffer',
          'sitemap',
          sitemapData.title,
          hrefURL,
          null, // no file
          null, // no faqs
        )

        sourceCount = 2
      }

      // Update bot and team counts
      await firestore.runTransaction(async (transaction) => {
        const botRef = firestore
          .collection('teams')
          .doc(DEMO_TEAM_ID)
          .collection('bots')
          .doc(botId)
        
        transaction.update(botRef, {
          sourceCount: sourceCount
        })
      })

      // Save demo bot record for rate limiting (only for unauthenticated users)
      if (!isDemo) {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        await saveDemoBotRecord(ip, sanitizedURL, botId)
      }

      // Return bot details
      let demoRegisterUrl = null
      let demoRegisterPath = null
      const signupDomain = normalizeDomainForToken(url.hostname)
      if (signupDomain) {
        try {
          const dealTag = createDemoTrialToken({ domain: signupDomain })
          const base = getURL()
          demoRegisterPath = `/pilot/${signupDomain}?deal=${encodeURIComponent(dealTag)}`
          demoRegisterUrl = `${base}${demoRegisterPath}`
        } catch (trialLinkError) {
          console.warn('demo-bot: could not build branded demo signup URL', trialLinkError?.message)
        }
      }

      return res.status(201).json({
        ...botConfig,
        demoUrl: `/demo/${DEMO_TEAM_ID}/${botId}`,
        demoRegisterUrl,
        demoRegisterPath,
        screenshotUrl: firebaseScreenshotUrl || botConfig.screenshotUrl, // Use Firebase URL if available, fallback to original
      })

    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: `Failed to create demo bot: ${e.message}` })
    }
  } else {
    return res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  }
}
