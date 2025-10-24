import { v4 as uuidv4 } from 'uuid'
import { getStorage } from 'firebase-admin/storage'
import { firebaseConfig } from '@/config/firebase-ui.config'

/**
 * Helper functions for crawling and extracting content from websites
 */
export const uploadScreenshotToStorage = async (screenshotUrl, teamId, botId = null) => {
  try {
    // Download the screenshot from Jina AI
    const response = await fetch(screenshotUrl)
    if (!response.ok) {
      throw new Error(`Failed to download screenshot: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Generate unique filename
    const uuid = uuidv4()
    let filepath = null
    if (botId) {
      filepath = `teams/${teamId}/bots/${botId}/images/${uuid}_screenshot.png`
    } else {
      filepath = `teams/${teamId}/images/${uuid}_screenshot.png`
    }
    
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

// Function to extract visual elements (images, colors) and widget information from HTML content for LLM context
export const extractElementsForLLM = (htmlContent) => {
  if (!htmlContent) return { text: '', visualElements: '' }

  const visualElements = []
  const widgetInfo = []

  // Extract HTML image tags (including self-closing and with attributes) - exclude data URLs
  const imgTags = htmlContent.match(/<img[^>]*\/?>/gi) || []
  imgTags.forEach((tag) => {
    // Skip image tags with data URLs
    if (!tag.match(/src\s*=\s*["']data:image/i)) {
      visualElements.push(`Image tag: ${tag}`)
    }
  })

  // Extract button elements (including input buttons) - they often contain color/styling classes
  const buttonTags =
    htmlContent.match(
      /<(?:button|input[^>]*type=["']button["']|input[^>]*type=["']submit["'])[^>]*>/gi,
    ) || []
  buttonTags.forEach((tag) => visualElements.push(`Button element: ${tag}`))

  // Extract image URLs (various formats)
  // Match common image extensions in URLs
  const imageUrls =
    htmlContent.match(
      /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff?)(?:\?[^\s<>"']*)?/gi,
    ) || []
  imageUrls.forEach((url) => visualElements.push(`Image URL: ${url}`))

  // Skip data URLs as they are not useful for LLM context

  // Extract CSS background-image properties
  const backgroundImages =
    htmlContent.match(/background-image\s*:\s*url\([^)]+\)/gi) || []
  backgroundImages.forEach((bg) =>
    visualElements.push(`Background image: ${bg}`),
  )

  // Extract hex color codes (3, 6, or 8 digits)
  const hexColors = htmlContent.match(/#[0-9A-Fa-f]{3,8}\b/g) || []
  hexColors.forEach((color) => visualElements.push(`Hex color: ${color}`))

  // Extract RGB/RGBA color values
  const rgbColors =
    htmlContent.match(
      /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/gi,
    ) || []
  rgbColors.forEach((color) => visualElements.push(`RGB color: ${color}`))

  // Extract HSL/HSLA color values
  const hslColors =
    htmlContent.match(
      /hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)/gi,
    ) || []
  hslColors.forEach((color) => visualElements.push(`HSL color: ${color}`))

  // Extract CSS color keywords in style attributes (common ones)
  const colorKeywords =
    htmlContent.match(
      /\b(?:color|background-color|border-color)\s*:\s*(?:red|blue|green|yellow|black|white|gray|grey|purple|orange|pink|brown|cyan|magenta|lime|navy|teal|olive|maroon|silver|gold|transparent|inherit|initial|unset)\b/gi,
    ) || []
  colorKeywords.forEach((color) => visualElements.push(`CSS color: ${color}`))

  // Search for widget embed codes and scripts
  // Help Scout beacon
  if (
    htmlContent.includes('window.Beacon') ||
    htmlContent.includes('helpscout')
  ) {
    widgetInfo.push('Widget detected: Help Scout')
  }

  // Zendesk classic widget
  if (
    htmlContent.includes('static.zdassets.com/') ||
    htmlContent.includes('ze-snippet')
  ) {
    widgetInfo.push('Widget detected: Zendesk')
  }

  // Freshdesk widget
  if (
    htmlContent.includes('widget.freshworks.com') ||
    htmlContent.includes('FreshworksWidget') ||
    htmlContent.includes('fwSettings')
  ) {
    widgetInfo.push('Widget detected: Freshdesk')
  }

  // Intercom widget
  if (
    htmlContent.includes('intercomSettings') ||
    htmlContent.includes('window.Intercom')
  ) {
    widgetInfo.push('Widget detected: Intercom')
  }

  // HubSpot widget
  if (
    htmlContent.includes('js.hs-scripts.com') ||
    htmlContent.includes('hs-script-loader')
  ) {
    widgetInfo.push('Widget detected: HubSpot')
  }

  // Remove duplicates from visual elements
  let uniqueVisualElements = [...new Set(visualElements)]

  // Combine visual elements and widget info
  const allElements = [...uniqueVisualElements, ...widgetInfo]
  const result = allElements.join('\n')

  return result
}

/**
 * Scrapes a URL and returns the content
 * @param {string} url - The URL to scrape
 * @returns {Promise<string|null>} - The scraped content or null if failed
 */
export const scrapeURL = async (url) => {
  const endpoint = `https://scrapedown.docsbot.workers.dev/?url=${encodeURIComponent(
    url,
  )}&markdown=false&extract=false`
  console.log(endpoint)
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  try {
    const data = await response.json()
    if (response.ok) {
      return data?.page.content || `## Failed to scrape ${url}!`
    }
  } catch (e) {
    console.error(e)
  }

  return null
}

/**
 * Retrieves brand information by domain using brand.dev API
 * @param {string} domain - The domain to retrieve brand data for
 * @returns {Promise<Object|null>} - Brand data object or null if failed
 */
export const retrieveBrandByDomain = async (domain) => {
  const API_KEY = process.env.BRANDDEV_API_KEY

  if (!API_KEY) {
    console.warn('BRANDDEV_API_KEY not set, skipping brand retrieval')
    return null
  }

  try {
    console.log(`Retrieving brand data for domain: ${domain}`)
    const url = `https://api.brand.dev/v1/brand/retrieve?domain=${encodeURIComponent(domain)}`

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data && data.status === 'ok') {
        console.log(`Brand data retrieved successfully for ${domain}`)
        return data.brand
      }
    }

    return null
  } catch (error) {
    console.error('Error retrieving brand data:', error.message)
    return null
  }
}

/**
 * Takes a screenshot of a URL using Jina AI
 * @param {string} url - The URL to capture
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<Object|null>} - Object with screenshot URL and metadata, or null if failed
 */
export const getURLScreenCap = async (url, retryCount = 0) => {
  const jinaUrl = 'https://r.jina.ai/'
  const data = {
    url: url,
    viewport: {
      width: 1920,
      height: 1920,
    },
  }

  console.log(
    `Taking screenshot of ${url} with Jina AI (attempt ${retryCount + 1}/3)`,
  )

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    const response = await fetch(jinaUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Engine': 'browser',
        'X-Return-Format': 'screenshot',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseData = await response.json()
    console.log('Jina AI Response:', responseData)

    if (response.ok && responseData.data && responseData.data.screenshotUrl) {
      // Return the full Jina AI response data along with screenshot URL
      return {
        full: responseData.data.screenshotUrl,
        jinaData: responseData.data, // Include full Jina AI data for LLM context
      }
    }

    // If response is not ok or missing data, throw error to trigger retry
    throw new Error(
      `Jina AI request failed: ${response.status} ${response.statusText}`,
    )
  } catch (e) {
    console.error(`Screenshot attempt ${retryCount + 1} failed:`, e.message)

    // Retry up to 2 times (3 total attempts)
    if (retryCount < 2) {
      console.log(`Retrying screenshot capture in 1 seconds...`)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 2 seconds before retry
      return getURLScreenCap(url, retryCount + 1)
    }

    console.error('All screenshot attempts failed')
    return null
  }
}

/**
 * Crawls and extracts content from a URL, then generates bot configuration using OpenAI
 * @param {string} url - The URL to crawl
 * @param {Object} metadata - Optional metadata (e.g., usage type) to guide configuration
 * @returns {Promise<Object>} - Flat object containing:
 *   - businessName: Name of the business (from AI analysis)
 *   - businessDescription: Description of the business (from AI analysis)
 *   - botName: Generated bot name (from AI analysis)
 *   - botDescription: Generated bot description (from AI analysis)
 *   - firstMessage: Generated first message for the bot (from AI analysis)
 *   - supportUrl: Support/contact URL if found (from AI analysis)
 *   - logoUrl: Logo URL from AI analysis (fallback if no brand data)
 *   - buttonColor: Brand color from AI analysis (fallback if no brand data)
 *   - widgetType: Detected widget type (helpscout, zendesk, freshdesk, intercom, hubspot, or other)
 *   - language: Detected language code (en, jp, ar, zh, etc.)
 *   - screenshotUrl: URL of the screenshot taken by Jina AI
 *   - domain: Domain name from brand.dev API (if available)
 *   - title: Brand title from brand.dev API (if available)
 *   - description: Brand description from brand.dev API (if available)
 *   - slogan: Brand slogan from brand.dev API (if available)
 *   - colors: Array of {hex, name} brand colors from brand.dev API (if available)
 *   - logos: Array of {url, mode, colors, resolution, type} brand logos from brand.dev API (if available)
 *   - backdrops: Array of backdrop images from brand.dev API (if available)
 *   - address: {city, country, country_code, state_province, postal_code} from brand.dev API (if available)
 *   - socials: Array of {type, url} social media links from brand.dev API (if available)
 *   - stock: Stock information from brand.dev API (if available)
 *   - is_nsfw: Boolean NSFW flag from brand.dev API (if available)
 *   - industries: Industry classifications from brand.dev API (if available)
 *   - links: {careers, terms, contact, privacy, blog, pricing} from brand.dev API (if available)
 * 
 * This response should be stored in bot.brandAnalysis along with domain and url fields
 */
export const crawlAndExtract = async (url, metadata = {}) => {
  // Extract domain from URL for brand API
  let domain = ''
  try {
    domain = new URL(url).hostname
  } catch (_) {
    // fallback: try to extract after '://'
    const match = url.match(/:\/\/([^/]+)/)
    if (match) domain = match[1]
  }

  // Run scraping, screenshot, and brand API in parallel
  const [content, screenCaptures, brandData] = await Promise.all([
    scrapeURL(url),
    getURLScreenCap(url),
    domain ? retrieveBrandByDomain(domain) : Promise.resolve(null),
  ])

  // Check if we have at least SOME data to work with
  if (!content && !screenCaptures) {
    throw new Error(
      `We couldn't access ${url}. Please check that the URL is correct and the website is publicly accessible. If the site has strict bot protection, just enter a bot name instead.`
    )
  }

  // If scraping failed but we have screenshot, log a warning and continue
  if (!content) {
    console.warn(`Scraping failed for ${url}, but continuing with screenshot and brand data`)
  }

  // If screenshot failed but we have content, log a warning and continue
  if (!screenCaptures) {
    console.warn(`Screenshot capture failed for ${url}, but continuing with scraped content and brand data`)
  }

  const visualElements = content ? extractElementsForLLM(content) : ''

  // Generate bot configuration using OpenAI
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY_TOOLS'],
  })

  const usageMetadata =
    metadata && Object.keys(metadata).length > 0
      ? JSON.stringify(metadata, null, 2)
      : null

  // Filter out logos, backdrops, and colors from brandData for LLM context
  const brandDataForLLM = brandData
    ? Object.fromEntries(
        Object.entries(brandData).filter(
          ([key]) => !['logos', 'backdrops', 'colors'].includes(key),
        ),
      )
    : null

  // Build messages array conditionally based on available data
  const messages = [
    {
      role: 'system',
      content:
        "Analyze the provided business website content, screenshot, metadata, and any onboarding guidance to create a custom chatbot configuration. Generate a compelling bot name, description, and visual customizations that would work well for this specific website. If BRAND_DATA is provided, prioritize using that data for brand information (description, slogan, etc.) as it comes from a specialized brand API. Otherwise, use the website metadata (title, description, og:image, etc.) to understand the brand and purpose. Look for logos, brand colors, and support/contact information. The bot should feel like it belongs to this website and can help visitors with questions about their products, services, or content. Additionally, analyze the ELEMENTS section to detect any support widgets (Help Scout, Zendesk, Freshdesk, Intercom, HubSpot) and classify the widgetType accordingly. If no common widgets are detected, use 'other'. Finally, detect the primary language of the website content and return the closest matching language code from the available options: en, jp, ar, zh, zh_tw, cs, da, nl, fil, fi, fr, de, el, he, hi, hu, id, it, ko, no, pl, pt, ro, ru, sr, es, sw, sv, th, tr. If the language cannot be determined or doesn't match any of these options, default to 'en'. Align the configuration with any provided usage metadata describing the intended assistant behavior.",
    },
  ]

  // Add screenshot if available
  if (screenCaptures?.full) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: "Here's a screenshot of the website:" },
        {
          type: 'image_url',
          image_url: {
            url: screenCaptures.full,
          },
        },
      ],
    })
  }

  // Build metadata content string
  let metadataContent = ''
  if (screenCaptures?.jinaData) {
    metadataContent += `<WEBSITE_METADATA>${JSON.stringify(screenCaptures.jinaData, null, 2)}</WEBSITE_METADATA>`
  }
  if (visualElements) {
    metadataContent += `<ELEMENTS>${visualElements}</ELEMENTS>`
  }
  if (brandDataForLLM) {
    metadataContent += `<BRAND_DATA>${JSON.stringify(brandDataForLLM, null, 2)}</BRAND_DATA>`
  }
  if (usageMetadata) {
    metadataContent += `<ONBOARDING_METADATA>${usageMetadata}</ONBOARDING_METADATA>`
  }

  // Add metadata content message
  if (metadataContent) {
    messages.push({
      role: 'user',
      content: metadataContent,
    })
  }

  let chat_completion = null
  try {
    chat_completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bot_config',
          description:
            'Generates chatbot configuration based on website analysis.',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              businessName: {
                type: 'string',
                description:
                  'The name of the business, extracted from the website metadata or content',
              },
              businessDescription: {
                type: 'string',
                description:
                  "Short description of the business and it's products or services, that would be helpful for the bot to know to understand the business better and perform its tasks, summarized from the website metadata and content",
              },
              botName: {
                type: 'string',
                description:
                  'Catchy bot name (e.g., "ProductName Assistant", "CompanyName Helper")',
              },
              botDescription: {
                type: 'string',
                description:
                  'Brief description of what the bot can help with (max 200 chars)',
              },
              firstMessage: {
                type: 'string',
                description:
                  'The first message the bot will show inviting the user to start a conversation, no long/em dash or new line characters',
              },
              supportUrl: {
                type: 'string',
                description:
                  'URL to contact or suppport/help page if found, otherwise empty string',
              },
              logoUrl: {
                type: 'string',
                description:
                  'Full logo image URL if found in METADATA or ELEMENTS. Prefer a full logo url, no icon, and preferably the white/light version of the logo that contrasts with a dark background, otherwise just give an empty string. Do NOT use an og (open graph) image url.',
              },
              buttonColor: {
                type: 'string',
                description:
                  'Brand-matching button color that contrasts with the background color of the website as hex color code. This will be used for the chat widget floating button color so must match overall website color pallete but contrast with the background color.' + (brandData?.colors?.length ? ' It should be a distinct color hue (not a copy) from one of these brand colors (cases sensitive): ' + brandData.colors.map(color => color.hex).join(', ') + '.' : ''),
                pattern: '^#[0-9A-Fa-f]{6}$',
              },
              widgetType: {
                type: 'string',
                enum: [
                  'helpscout',
                  'zendesk',
                  'freshdesk',
                  'intercom',
                  'hubspot',
                  'other',
                ],
                description:
                  'The type of support widget detected on the website, or "other" if none of the common widgets are found',
              },
              language: {
                type: 'string',
                enum: [
                  'en',
                  'jp',
                  'ar',
                  'zh',
                  'zh_tw',
                  'cs',
                  'da',
                  'nl',
                  'fil',
                  'fi',
                  'fr',
                  'de',
                  'el',
                  'he',
                  'hi',
                  'hu',
                  'id',
                  'it',
                  'ko',
                  'no',
                  'pl',
                  'pt',
                  'ro',
                  'ru',
                  'sr',
                  'es',
                  'sw',
                  'sv',
                  'th',
                  'tr',
                ],
                description:
                  'The primary language of the website content, detected from the website text and metadata',
              },
            },
            required: [
              'businessName',
              'businessDescription',
              'botName',
              'botDescription',
              'firstMessage',
              'supportUrl',
              'logoUrl',
              'buttonColor',
              'widgetType',
              'language',
            ],
            additionalProperties: false,
          },
        },
      },
    })
  } catch (error) {
    console.error(error)
    throw new Error('Failed to connect to OpenAI. Please try again.')
  }

  // Parse response
  let botConfig = null
  try {
    const message = chat_completion.choices[0]?.message
    console.log(message)
    if (message?.content) {
      botConfig = JSON.parse(message.content)
    } else {
      console.error(message.refusal)
      throw new Error(message.refusal)
    }
  } catch (error) {
    console.error(error)
    throw new Error('Invalid JSON response from OpenAI. Please try again.')
  }

  if (!botConfig?.botName || !botConfig?.botDescription || !botConfig?.language) {
    throw new Error('Invalid bot configuration from OpenAI. Please try again.')
  }

  // If no logoUrl, use Google Favicons API to get the favicon URL for the domain
  if (!botConfig.logoUrl || botConfig.logoUrl.trim() === '') {
    try {
      // Get domain (strips protocol)
      let domain = ''
      try {
        domain = new URL(url).hostname
      } catch (_) {
        // fallback: try to extract after '://'
        const match = url.match(/:\/\/([^/]+)/)
        if (match) domain = match[1]
      }
      if (domain) {
        botConfig.logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      }
      // else leave as empty string
    } catch (error) {
      // Ignore favicon fallback errors, leave logoUrl as empty string
      // (fail silently)
    }
  }

  // Merge buttonColor into colors array if unique and if brandData exists
  if (brandData && botConfig.buttonColor) {
    const colors = brandData.colors || []
    const buttonColorHex = botConfig.buttonColor.toLowerCase()
    
    // Check if buttonColor already exists in colors array
    const colorExists = colors.some(
      (color) => color.hex && color.hex.toLowerCase() === buttonColorHex,
    )
    
    if (!colorExists) {
      brandData.colors = [
        ...colors,
        { hex: botConfig.buttonColor, name: 'Button Color' },
      ]
    }
  }

  // Add logoUrl to logos array if it exists and is not empty
  /*
  if (brandData && botConfig.logoUrl && botConfig.logoUrl.trim() !== '') {
    const logos = brandData.logos || []
    brandData.logos = [
      ...logos,
      {
        url: botConfig.logoUrl,
        type: 'logo',
        mode: 'unknown',
        colors: [],
        resolution: 'unknown',
      },
    ]
  }
  */

  // Return flat object with screenshot and brand data merged at top level
  return {
    ...botConfig,
    ...(screenCaptures?.full ? { screenshotUrl: screenCaptures.full } : {}),
    // Merge brand data properties at top level (colors, logos, socials, etc.)
    ...(brandData || {}),
  }
}
