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
- Only output the humanized text.

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
  paraphrase: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Rephrase and reword the provided text for essays, articles, emails, and different types of documents. I can optionally specify a tone to guide the rewording.

# Steps

1. **Input:** Provide the text to be reworded and specify the tone if desired (e.g., formal, informal, persuasive).
2. **Analysis:** Understand the context and purpose of the text.
3. **Rewording:** Transform the text while maintaining the original meaning, enhancing clarity and flow.
4. **Tone Adjustment:** Modify the style to fit the specified tone if provided.

# Output Format
- The rephrased text should a similar length to the original and reflect the chosen tone if specified.
- Only output the rephrased text, no labels or headings.

# Examples

1. **Original Text:** "I need the report by tomorrow."
 **Tone:** Formal
 **Output:** "Could you please provide the report by tomorrow?"

2. **Original Text:** "I had a fantastic time at the conference and learned a lot."
 **Tone:** Informal
 **Output:** "Had a great time at the conference and picked up a lot of new info!"

# Notes
- Ensure that the rephrased text captures the essence of the original.
- Tailor the text to the specified tone without altering key information.
- Don't add new formatting or markdown that isn't in the original.`,
      },
      {
        role: 'user',
        content: `Tone: {{tone}}\nOriginal Text:\n{{input}}`,
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

  //console.log(chatParams)
  return chatParams
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { type, input, tone } = req.body

      if (!type || !PROMPTS[type]) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing `type` parameter.' })
      }

      if (type === 'humanize') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing input parameter.' })
        }

        if (input.length > 10000) {
          return res
            .status(400)
            .json({
              message: 'Input is too long. Maximum length is 10000 characters.',
            })
        }
      }

      if (type === 'paraphrase') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing input parameter.' })
        }

        if (input.length > 10000) {
          return res
            .status(400)
            .json({
              message: 'Input is too long. Maximum length is 10000 characters.',
            })
        }

        if (tone && typeof tone !== 'string') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing tone parameter.' })
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
      const isRateLimited = await checkPromptRateLimit(ip, type, isLoggedIn)
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
        tone,
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
