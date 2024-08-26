import OpenAI from 'openai'
import { YoutubeTranscript } from 'youtube-transcript'
import { lookupYoutubeBlogPost, saveYoutubeBlogPost, checkYoutubeBlogPostRateLimit } from '@/lib/tools'
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

const getVideoId = (url) => {
  if (!url) return null

  // Check if the input is already a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }

  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7] && match[7].length === 11 ? match[7] : null
}

const fetchTranscript = async (videoId) => {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    })
    return transcript.map((item) => item.text).join(' ')
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return null
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { videoUrl } = req.body
      const videoId = getVideoId(videoUrl)

      if (!videoId) {
        return res
          .status(400)
          .json({ message: 'Invalid YouTube URL or video ID.' })
      }

      // check cache
      const cachedData = await lookupYoutubeBlogPost(videoId)
      if (cachedData) {
        return res.status(200).json(cachedData)
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

      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      
      const isRateLimited = await checkYoutubeBlogPostRateLimit(ip, isLoggedIn)
      if (isRateLimited) {
        return res
          .status(429)
          .json({ message: `Your IP has been rate limited.` })
      }

      const transcript = await fetchTranscript(videoId)
      if (!transcript) {
        return res.status(400).json({
          message:
            'Failed to fetch the video transcript. It may not be available in English.',
        })
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chat_completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an experienced SEO copywriter tasked with creating a compelling, informative article based on the provided YouTube video transcript. Your goal is to craft a well-researched, engaging piece that adheres to SEO best practices and ranks high on search engines. Follow these guidelines:\n\n1. Begin with a strong, keyword-rich title that accurately reflects the content and pass it for the `title` property in the JSON response.\n2. Write a brief, engaging introduction that provides context and outlines the significance of the topic.\n3. Structure the article using clear headings and subheadings (H2, H3) to enhance readability and SEO.\n4. Present the main points in a logical, well-organized manner, explaining each point well with essential details.\n5. Use bullet points or numbered lists occassionally where appropriate to improve scannability.\n6. Incorporate relevant keywords naturally throughout the text, maintaining a good flow and readability.\n7. Include critical data, statistics, or quotes from authoritative sources when mentioned in the transcript to add credibility and boost SEO value.\n8. Ensure the content answers questions or solves problems related to the topic, providing value to the reader.\n9. Conclude with a summary that encapsulates the overall essence of the topic, its implications, and relevance.\n10. Add a strong call-to-action with no title as part of the conclusion to encourage reader engagement.\n11. Format the entire output in markdown, using appropriate syntax for headings, lists, and emphasis.\n12. Aim for a length of approximately 1000-1500 words, adjusting as needed based on the complexity of the topic.\n13. Don\'t include any links.\n\nEnsure the article is accessible to a broad audience, avoiding jargon or overly technical language unless necessary. Do not mention that the content is based on a YouTube video.',
          },
          {
            role: 'user',
            content: `Video Transcript:\n\n${transcript}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'blog_post',
            description: 'Creates a blog post based on the video transcript as valid JSON.',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'The main title of the blog post to be used as the H1 title.',
                },
                content: {
                  type: 'string',
                  description: 'The longform markdown-formatted body content of the blog post with NO main H1 title.',
                },
              },
              required: ['title', 'content'],
              additionalProperties: false,
            },
          },
        },
      })

      const responseData = JSON.parse(chat_completion.choices[0].message.content)

      // Save data and send response
      await saveYoutubeBlogPost(ip, videoId, responseData)
      return res.status(200).json(responseData)
    } else if (req.method === 'GET') {
      const { videoId } = req.query

      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ message: 'Invalid video ID.' })
      }

      // check cache
      const cachedData = await lookupYoutubeBlogPost(videoId)
      if (cachedData) {
        return res.status(200).json(cachedData)
      } else {
        return res
          .status(404)
          .json({ message: `Summary for video ${videoId} doesn't exist!` })
      }
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Unexpected error in YouTube blog post generator API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}