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
]

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { image } = req.body

      if (!image) {
        return res.status(400).json({ message: 'Invalid image data.' })
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
        return res
          .status(429)
          .json({ message: `Your IP has been rate limited.` })
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract and return only the text content from this image with line breaks. Do not include any descriptions or explanations.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      })

      const extractedText = response.choices[0].message.content.trim()

      // Log token usage
      console.log('Token usage:', response.usage)

      // Save the extracted text to the database
      await saveImage(ip, 'text', { text: extractedText })

      return res.status(200).json({ text: extractedText })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Unexpected error in image description generator API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}
