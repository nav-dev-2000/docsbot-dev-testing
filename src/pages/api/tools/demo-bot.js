import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getBot } from '@/lib/dbQueries'
import { createTenant } from '@/lib/weaviate'
import { QueueSourceIngest } from '@/lib/service'
import { isValidURL } from '@/utils/helpers'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import { crawlAndExtract } from '@/utils/crawlHelpers'
import { checkDemoBotRateLimit, saveDemoBotRecord } from '@/lib/tools'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'


// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = ['iad1', 'hnd1', 'lhr1', 'sfo1', 'syd1', 'bom1', 'fra1']

// Demo team ID from environment variables
const DEMO_TEAM_ID = process.env.NEXT_PUBLIC_DEMO_TEAM_ID


const uploadScreenshotToStorage = async (screenshotUrl, teamId, botId) => {
  try {
    // Download the screenshot from Jina AI
    const response = await fetch(screenshotUrl)
    if (!response.ok) {
      throw new Error(`Failed to download screenshot: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Generate unique filename
    const uuid = uuidv4()
    const filepath = `teams/${teamId}/bots/${botId}/images/${uuid}_screenshot.png`
    
    // Upload to Firebase Storage
    const storage = getStorage()
    const bucket = storage.bucket(`gs://${firebaseConfig.storageBucket}`)
    const file = bucket.file(filepath)
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      },
    })
    
    // Return public URL - use staging environment for development
    const publicUrl = process.env.NODE_ENV === 'development' 
      ? `https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/${encodeURIComponent(filepath)}?alt=media`
      : `https://cdn.docsbot.ai/${encodeURIComponent(filepath)}?alt=media`
    return publicUrl
  } catch (error) {
    console.error('Error uploading screenshot to storage:', error)
    return null
  }
}


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { siteURL, isDemo } = req.body

    if (!siteURL || !isValidURL(siteURL)) {
      return res.status(400).json({ message: 'Invalid or missing siteURL parameter' })
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

    const url = new URL(siteURL)
    const hrefURL = `${url.protocol}//${url.hostname}/`

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
      const initialBotData = {
        name: botConfig.name,
        description: botConfig.description || '',
        color: botConfig.buttonColor || '',
        privacy: 'public',
        language: 'en',
        model: 'gpt-4.1-mini',
        temperature: 0,
        agentPrompt: supportPrompt
          .replace(/{company_name}/g, botConfig.name || 'your company')
          .replace(/{product_info}/g, botConfig.description || '')
          .replace(/{old_prompt}\n/g, '')
          .replace(/{old_prompt}/g, ''),
        labels: {
          firstMessage: botConfig.firstMessage,
        },
        allowedDomains: [],
        icon: '',
        botIcon: '',
        logo: botConfig.logoUrl || `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`,
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
        indexId: 'TenantDocument',
        sourceCount: 0,
        pageCount: 0,
        chunkCount: 0,
        questionCount: 0,
        supportLink: botConfig.supportUrl || `mailto:support@${url.hostname}`,
        screenshotUrl: botConfig.screenshotUrl // Temporary, will be updated
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
          screenshotUrl: firebaseScreenshotUrl
        })
      }

      try {
        // Create Weaviate tenant for the bot
        const demoTeam = { id: DEMO_TEAM_ID }
        await createTenant(demoTeam, botId)
      } catch (error) {
        console.error('Error creating bot DB', error)
        // Delete bot object if tenant creation fails
        await docRef.delete()
        return res
          .status(500)
          .json({
            message: 'Error creating bot database. Please try again or contact support.',
          })
      }

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
        'TenantDocument',
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
          'TenantDocument',
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
        await saveDemoBotRecord(ip, siteURL, botId)
      }

      // Return bot details
      const createdBot = await getBot(DEMO_TEAM_ID, botId)
      return res.status(201).json({
        ...botConfig,
        demoUrl: `/demo/${botId}`,
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
