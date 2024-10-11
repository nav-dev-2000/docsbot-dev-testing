import OpenAI from 'openai'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { saveImage, checkImageRateLimit } from '@/lib/tools'

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = [
  'iad1',
  'hnd1',
  'lhr1',
  'sfo1',
  'syd1',
  'bom1',
  'fra1',
  'bom1',
]

const PROMPTS = {
  description: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please provide a detailed description for this image. Do not start the description with anything like "The image shows" or "This image depicts". Respond with Markdown.',
          },
          {
            type: 'image_url',
            image_url: {
              url: '{{image_url}}',
            },
        },
      ],
    },
  ],
  
  caption: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please provide a 1-2 sentence {{vibe}} caption for this image. The caption should be engaging, suitable for social media use, and be raw text with no emojis or hashtags. Return only the caption text without quotes.',
        },
        {
          type: 'image_url',
          image_url: {
            url: '{{image_url}}',
          },
        },
      ],
    },
  ],
  
  text: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract and return only the exact text content from this image, preserving spacing and line breaks using raw text without markdown formatting. Do not include any descriptions or explanations. If there is no text, return a message saying "No text found in image".',
        },
        {
          type: 'image_url',
          image_url: {
            url: '{{image_url}}',
          },
        },
      ],
    },
  ],

  markdown: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract and return the exact text content and formatting from this image using markdown to preserve layout like tables, lists, headers, etc. For tables, use Github flavored markdown with proper | delimiters for columns and rows. Nesting is ok. Do not include any descriptions or explanations. If there is no text, return a message saying "No text found in image".',
        },
        {
          type: 'image_url',
          image_url: {
            url: '{{image_url}}',
          },
        },
      ],
    },
  ],
  faq: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Create a list of 5-20 questions and answers based on the content of this image. Format the output as markdown with H3 headings for questions and paragraphs for answers. Do not add a title, only the FAQs. Ensure the FAQs are relevant, informative, and cover key aspects of the image content. If there is no relevant content for FAQs, return a message saying "Unable to generate FAQs from this image". Example:\n\n### What is the main subject of the image?\nThe main subject of the image is a large oak tree in a grassy field.\n\n### What time of day does the image appear to be taken?\nThe image appears to be taken during a sunny afternoon, with bright natural lighting.'
        },
        {
          type: 'image_url',
          image_url: {
            url: '{{image_url}}',
          },
        },
      ],
    },
  ],

  // Add more types here as needed
}

const getChatParams = (type, params) => {
  if (!PROMPTS[type]) {
    throw new Error(`Invalid chat parameter type: ${type}`)
  }

  const replacePlaceholders = (content, params) => {
    return content.map(item => {
      if (item.type === 'image_url') {
        return {
          ...item,
          image_url: {
            url: params.image_url,
          },
        }
      }
      if (item.type === 'text') {
        return {
          ...item,
          text: item.text.replace(/{{(\w+)}}/g, (match, key) => params[key] || match),
        }
      }
      return item
    })
  }

  let chatMessages = PROMPTS[type]
  chatMessages = chatMessages.map((msg) => ({
    ...msg,
    content: replacePlaceholders(msg.content, params),
  }))

  return chatMessages
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { image, type = 'description', vibe = 'fun' } = req.body

      if (!image) {
        return res.status(400).json({ message: 'Invalid image data.' })
      }

      if (!PROMPTS[type]) {
        return res.status(400).json({ message: 'Invalid type parameter.' })
      }

      // check if user is logged in or has a valid API key
      let user
      let isLoggedIn = false
      try {
        user = await getAuthorizedUser({ req })
        isLoggedIn = true
      } catch (error) {
        // User is not logged in and doesn't have a valid API key
      }

      // Check rate limit
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const isRateLimited = await checkImageRateLimit(ip, isLoggedIn)
      if (isRateLimited) {
        return res.status(429).json({
          message: `Your IP has been rate limited. Register for a free account to increase your daily limit.`,
        })
      }

      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env['OPENROUTER_TOOLS_API_KEY'],
        defaultHeaders: {
          'HTTP-Referer': 'https://docsbot.ai', // Optional, for including your app on openrouter.ai rankings.
          'X-Title': 'DocsBot', // Optional. Shows in rankings on openrouter.ai.
        },
      })

      const chatMessages = getChatParams(type, {
        image_url: `data:image/jpeg;base64,${image}`,
        vibe,
      })

      const response = await openai.chat.completions.create({
        messages: chatMessages,
        models: [/*'meta-llama/llama-3.2-11b-vision-instruct:free', */'google/gemini-flash-1.5-8b', 'meta-llama/llama-3.2-11b-vision-instruct', 'google/gemini-flash-1.5'],
        route: 'fallback',
      })

      let result = response.choices[0].message.content.trim()

      // Remove wrapping quotes if present
      const quoteChars = ['"', "'", '`'];
      for (const char of quoteChars) {
        if (result.startsWith(char) && result.endsWith(char)) {
          result = result.slice(1, -1);
          break;
        }
      }

      // Log token usage
      console.log('Token usage:', response.usage)

      // Combine result with additional arguments
      let combinedResult = { result };
      
      // Loop through all request body parameters
      for (const [key, value] of Object.entries(req.body)) {
        // Skip 'type' and 'image' keys
        if (key !== 'type' && key !== 'image') {
          combinedResult[key] = value;
        }
      }
      // Save the result to the database
      await saveImage(ip, type, combinedResult)

      return res.status(200).json(result)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Unexpected error in image analysis API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}
