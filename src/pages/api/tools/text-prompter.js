import OpenAI from 'openai'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = [
  'iad1',
  'hnd1',
  'lhr1',
  'sfo1',
  'syd1',
  'bom1',
  'fra1',
]


const PROMPTS = {
  humanize: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Transform AI-generated content into human-like text that can bypass AI detection systems.

Retain the essence and accuracy of the original text while adjusting the language to appear more naturally written by a human. Focus on word choice, sentence structure, and tone.

# Steps

1. **Review the Original Text:** Analyze the provided AI-generated content to understand the key points and overall message.
2. **Transform the Language:** Rephrase and modify the text to mimic human writing styles. Pay attention to:
   - Using varied sentence structures
   - Incorporating contractions and casual language where appropriate
   - Ensuring sentences flow naturally
3. **Review for Coherence:** Ensure the transformed text maintains coherence, logical flow, and accurately conveys the intended message.

# Output Format

- Provide the revised text in a clear, readable format.
- Preserve the original text basic structure and layout.
- Only ouput markdown if the original text is markdown.

# Notes

- Do not make extreme changes that could alter the original meaning.
- Aim for a balance between human-like text and preservation of original content integrity.`,
      },
      {
        role: 'user',
        content: `Original Text:\n{{input}}`,
      },
    ],
  },
  // Add more types here as needed
}

const getChatParams = (type, params) => {
  if (!PROMPTS[type]) {
    throw new Error(`Invalid chat parameter type: ${type}`)
  }

  const replacePlaceholders = (content, params) => {
    return Object.entries(params).reduce((acc, [key, value]) => {
      return acc.replace(
        new RegExp(`{{${key}}}`, 'g'),
        typeof value === 'object' ? JSON.stringify(value) : value,
      )
    }, content)
  }

  const chatParams = { ...PROMPTS[type] }
  chatParams.messages = chatParams.messages.map((msg) => ({
    ...msg,
    content: replacePlaceholders(msg.content, params),
  }))

  return chatParams
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { type, input, tone } = req.body

      if (!type || !PROMPTS[type]) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing type parameter.' })
      }

      if (type === 'humanize') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res.status(400).json({ message: 'Invalid or missing input parameter.' })
        }

        if (input.length > 10000) {
          return res.status(400).json({ message: 'Input is too long. Maximum length is 10000 characters.' })
        }
      }

      //validate other type params here

      // check if user is logged in or has a valid API key
      let user
      let isLoggedIn = false
      try {
        user = await getAuthorizedUser({ req })
        isLoggedIn = true
      } catch (error) {
        // User is not logged in and doesn't have a valid API key
      }

      // check rate limit
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const isRateLimited = await checkPromptRateLimit(ip, isLoggedIn)
      if (isRateLimited) {
        return res
          .status(429)
          .json({ message: `Your IP has been rate limited.` })
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chatParams = getChatParams(type, {
        input,
      })
      const chat_completion = await openai.chat.completions.create(chatParams)

      const responseData = chat_completion.choices[0].message.content

      const tokenUsage = chat_completion.usage.total_tokens
      console.log(`Token usage for this request: ${tokenUsage}`)

      await addPrompt(ip, type, {})
      return res.status(200).json(responseData)
    } else {
      return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Unexpected error in YouTube summarizer API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}
