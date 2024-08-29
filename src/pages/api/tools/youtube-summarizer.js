import OpenAI from 'openai'
import {
  lookupYoutubeSummary,
  saveYoutubeSummary,
  checkYoutubeRateLimit,
  fetchYoutubeSubtitles, // Add this import
} from '@/lib/tools'
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

  const matchId = url.match(
    /(?:youtube.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu.be\/)([^"&?\/\s]{11})/i
  )
  if (matchId && matchId.length) {
    return matchId[1]
  }

  return null // Add this line
}

// Remove the fetchTranscript function as it's no longer needed

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

      // Fetch subtitles and metadata
      let subtitlesResult
      try {
        subtitlesResult = await fetchYoutubeSubtitles(videoId)
        if (!subtitlesResult.subtitles) {
          return res.status(400).json({
            message: `Failed to fetch the video subtitles.`,
          })
        }
      } catch (error) {
        console.error('Error fetching YouTube subtitles:', error)
        return res.status(400).json({
          message: `An error occurred while fetching the video subtitles: ${error.message}`,
        })
      }

      const { metadata, subtitles } = subtitlesResult

      // check cache
      const cachedData = await lookupYoutubeSummary(videoId)
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

      // check rate limit
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const isRateLimited = await checkYoutubeRateLimit(ip, isLoggedIn)
      if (isRateLimited) {
        return res
          .status(429)
          .json({ message: `Your IP has been rate limited.` })
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chat_completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that summarizes YouTube videos based on their subtitles. Provide a concise summary, extract key points, and use the provided metadata.',
          },
          {
            role: 'user',
            content: `Summarize the following YouTube video subtitles. Provide a brief summary, list all the key points, and use the provided metadata:\n\nMetadata: ${JSON.stringify(metadata)}\n\nSubtitles:\n${subtitles}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'youtube_summary',
            description:
              'Creates a summary of the video transcript as valid JSON.',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'A concise summary of the video content',
                },
                keyPoints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      point: {
                        type: 'string',
                        description: 'A key point from the video',
                      },
                      summary: {
                        type: 'string',
                        description:
                          'A one paragraph detailed summary of the key point',
                      },
                    },
                    required: ['point', 'summary'],
                    additionalProperties: false,
                  },
                  description:
                    'List of key points from the video in order with detailed summaries',
                },
              },
              required: ['summary', 'keyPoints'],
              additionalProperties: false,
            },
          },
        },
      })

      const responseData = JSON.parse(
        chat_completion.choices[0].message.content,
      )

      // Combine the blog post data with the metadata, letting responseData overwrite metadata
      const blogPostData = {
        ...metadata,
        ...responseData,
      }

      await saveYoutubeSummary(ip, videoId, blogPostData)
      return res.status(200).json(blogPostData)
    } else if (req.method === 'GET') {
      const { videoId } = req.query

      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ message: 'Invalid video ID.' })
      }

      // check cache
      const cachedData = await lookupYoutubeSummary(videoId)
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
    console.error('Unexpected error in YouTube summarizer API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}
