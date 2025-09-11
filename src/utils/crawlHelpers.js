/**
 * Helper functions for crawling and extracting content from websites
 */

// Function to extract visual elements (images, colors) and widget information from HTML content for LLM context
export const extractElementsForLLM = (htmlContent) => {
  if (!htmlContent) return { text: '', visualElements: '' }
  
  const visualElements = []
  const widgetInfo = []
  
  // Extract HTML image tags (including self-closing and with attributes) - exclude data URLs
  const imgTags = htmlContent.match(/<img[^>]*\/?>/gi) || []
  imgTags.forEach(tag => {
    // Skip image tags with data URLs
    if (!tag.match(/src\s*=\s*["']data:image/i)) {
      visualElements.push(`Image tag: ${tag}`)
    }
  })
  
  // Extract button elements (including input buttons) - they often contain color/styling classes
  const buttonTags = htmlContent.match(/<(?:button|input[^>]*type=["']button["']|input[^>]*type=["']submit["'])[^>]*>/gi) || []
  buttonTags.forEach(tag => visualElements.push(`Button element: ${tag}`))
  
  // Extract image URLs (various formats)
  // Match common image extensions in URLs
  const imageUrls = htmlContent.match(/https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff?)(?:\?[^\s<>"']*)?/gi) || []
  imageUrls.forEach(url => visualElements.push(`Image URL: ${url}`))
  
  // Skip data URLs as they are not useful for LLM context
  
  // Extract CSS background-image properties
  const backgroundImages = htmlContent.match(/background-image\s*:\s*url\([^)]+\)/gi) || []
  backgroundImages.forEach(bg => visualElements.push(`Background image: ${bg}`))
  
  // Extract hex color codes (3, 6, or 8 digits)
  const hexColors = htmlContent.match(/#[0-9A-Fa-f]{3,8}\b/g) || []
  hexColors.forEach(color => visualElements.push(`Hex color: ${color}`))
  
  // Extract RGB/RGBA color values
  const rgbColors = htmlContent.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/gi) || []
  rgbColors.forEach(color => visualElements.push(`RGB color: ${color}`))
  
  // Extract HSL/HSLA color values
  const hslColors = htmlContent.match(/hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)/gi) || []
  hslColors.forEach(color => visualElements.push(`HSL color: ${color}`))
  
  // Extract CSS color keywords in style attributes (common ones)
  const colorKeywords = htmlContent.match(/\b(?:color|background-color|border-color)\s*:\s*(?:red|blue|green|yellow|black|white|gray|grey|purple|orange|pink|brown|cyan|magenta|lime|navy|teal|olive|maroon|silver|gold|transparent|inherit|initial|unset)\b/gi) || []
  colorKeywords.forEach(color => visualElements.push(`CSS color: ${color}`))
  
  // Search for widget embed codes and scripts
  // Help Scout beacon
  if (htmlContent.includes('window.Beacon') || htmlContent.includes('helpscout')) {
    widgetInfo.push('Widget detected: Help Scout')
  }
  
  // Zendesk classic widget
  if (htmlContent.includes('static.zdassets.com/') || htmlContent.includes('ze-snippet')) {
    widgetInfo.push('Widget detected: Zendesk')
  }
  
  // Freshdesk widget
  if (htmlContent.includes('widget.freshworks.com') || htmlContent.includes('FreshworksWidget') || htmlContent.includes('fwSettings')) {
    widgetInfo.push('Widget detected: Freshdesk')
  }
  
  // Intercom widget
  if (htmlContent.includes('intercomSettings') || htmlContent.includes('window.Intercom')) {
    widgetInfo.push('Widget detected: Intercom')
  }
  
  // HubSpot widget
  if (htmlContent.includes('js.hs-scripts.com') || htmlContent.includes('hs-script-loader')) {
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
    url
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
      height: 1920
    }
  }

  console.log(`Taking screenshot of ${url} with Jina AI (attempt ${retryCount + 1}/3)`)
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    const response = await fetch(jinaUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Engine': 'browser',
        'X-Return-Format': 'screenshot'
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseData = await response.json()
    console.log('Jina AI Response:', responseData)
    
    if (response.ok && responseData.data && responseData.data.screenshotUrl) {
      // Return the full Jina AI response data along with screenshot URL
      return {
        full: responseData.data.screenshotUrl,
        jinaData: responseData.data // Include full Jina AI data for LLM context
      }
    }
    
    // If response is not ok or missing data, throw error to trigger retry
    throw new Error(`Jina AI request failed: ${response.status} ${response.statusText}`)
    
  } catch (e) {
    console.error(`Screenshot attempt ${retryCount + 1} failed:`, e.message)
    
    // Retry up to 2 times (3 total attempts)
    if (retryCount < 2) {
      console.log(`Retrying screenshot capture in 2 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
      return getURLScreenCap(url, retryCount + 1)
    }
    
    console.error('All screenshot attempts failed')
    return null
  }
}

/**
 * Crawls and extracts content from a URL, then generates bot configuration using OpenAI
 * @param {string} url - The URL to crawl
 * @returns {Promise<Object>} - Object containing bot config schema and screenshot URL
 */
export const crawlAndExtract = async (url) => {
  const [content, screenCaptures] = await Promise.all([
    scrapeURL(url),
    getURLScreenCap(url),
  ])

  if (!content) {
    throw new Error(`Failed to scrape ${url}! Are you sure it's a valid URL?`)
  }

  if (!screenCaptures) {
    throw new Error(`Failed to get screen capture of ${url}! Are you sure it's a valid URL?`)
  }

  const visualElements = extractElementsForLLM(content)

  // Generate bot configuration using OpenAI
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY_TOOLS'],
  })

  let chat_completion = null
  try {
    chat_completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content:
            "Analyze the provided website content, screenshot, and metadata to create a custom chatbot configuration. Generate a compelling bot name, description, and visual customizations that would work well for this specific website. Use the website metadata (title, description, og:image, etc.) to better understand the brand and purpose. Look for logos, brand colors, and support/contact information. The bot should feel like it belongs to this website and can help visitors with questions about their products, services, or content. Additionally, analyze the ELEMENTS section to detect any support widgets (Help Scout, Zendesk, Freshdesk, Intercom, HubSpot) and classify the widgetType accordingly. If no common widgets are detected, use 'other'. Finally, detect the primary language of the website content and return the closest matching language code from the available options: en, jp, ar, zh, zh_tw, cs, da, nl, fil, fi, fr, de, el, he, hi, hu, id, it, ko, no, pl, pt, ro, ru, sr, es, sw, sv, th, tr. If the language cannot be determined or doesn't match any of these options, default to 'en'.",
        },
        {
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
        },
        { role: 'user', content: `<WEBSITE_METADATA>${JSON.stringify(screenCaptures.jinaData, null, 2)}</WEBSITE_METADATA><ELEMENTS>${visualElements}</ELEMENTS>` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'bot_config',
          description: 'Generates chatbot configuration based on website analysis.',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Catchy bot name (e.g., "ProductName Assistant", "CompanyName Helper")',
              },
              description: {
                type: 'string',
                description: 'Brief description of what the bot can help with (max 200 chars)',
              },
              firstMessage: {
                type: 'string',
                description: 'The first message the bot will show inviting the user to start a conversation, no em dash or new line characters',
              },
              supportUrl: {
                type: 'string',
                description: 'URL to contact or suppport/help page if found, otherwise empty string',
              },
              logoUrl: {
                type: 'string',
                description: 'Full logo image URL if found in METADATA or ELEMENTS. Prefer a full logo url, if not found, use the largest png/jpg/webp/gif favicon url (no .ico), otherwise just give an empty string. Do NOT use an og (open graph) image url.',
              },
              buttonColor: {
                type: 'string',
                description: 'Brand-matching button color that contrasts with the background color of the website as hex color code. This will be used for the chat widget floating button color so must match overall website color pallete but contrast with the background color.',
                pattern: '^#[0-9A-Fa-f]{6}$'
              },
              widgetType: {
                type: 'string',
                enum: ['helpscout', 'zendesk', 'freshdesk', 'intercom', 'hubspot', 'other'],
                description: 'The type of support widget detected on the website, or "other" if none of the common widgets are found'
              },
              language: {
                type: 'string',
                enum: ['en', 'jp', 'ar', 'zh', 'zh_tw', 'cs', 'da', 'nl', 'fil', 'fi', 'fr', 'de', 'el', 'he', 'hi', 'hu', 'id', 'it', 'ko', 'no', 'pl', 'pt', 'ro', 'ru', 'sr', 'es', 'sw', 'sv', 'th', 'tr'],
                description: 'The primary language of the website content, detected from the website text and metadata'
              },
            },
            required: ['name', 'description', 'firstMessage', 'supportUrl', 'logoUrl', 'buttonColor', 'widgetType', 'language'],
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

  if (!botConfig?.name || !botConfig?.description || !botConfig?.language) {
    throw new Error('Invalid bot configuration from OpenAI. Please try again.')
  }

  return {
    ...botConfig,
    screenshotUrl: screenCaptures.full
  }
}
