import OpenAI from 'openai'
import {
  lookupYoutubeBlogPost,
  saveYoutubeBlogPost,
  checkYoutubeBlogPostRateLimit,
  fetchYoutubeSubtitles,
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
    /(?:youtube.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu.be\/)([^"&?\/\s]{11})/i
  )
  if (matchId && matchId.length) {
    return matchId[1]
  }

  return null // Add this line
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

      // Fetch subtitles and metadata
      let subtitlesResult
      try {
        subtitlesResult = await fetchYoutubeSubtitles(videoId)
        if (!subtitlesResult.subtitles) {
          return res.status(400).json({
            message: `Sorry, this video does not appear to have subtitles. Please try another.`,
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

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chat_completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `You are an experienced SEO copywriter tasked with creating a compelling, informative article based on the provided YouTube video transcript. Your goal is to craft a well-researched, engaging piece that adheres to SEO best practices and ranks high on search engines. Follow these guidelines:

1. Begin with a strong, keyword-rich title that accurately reflects the content and pass it for the 'title' property in the JSON response (don't use the same title as the metadata).
2. Write a brief, engaging introduction that provides context and outlines the significance of the topic.
3. Structure the article using clear headings and subheadings (H2, H3) to enhance readability and SEO.
4. Present the main points in a logical, well-organized manner, explaining each point well with essential details.
5. Use bullet points or numbered lists occassionally where appropriate to improve scannability.
6. Incorporate relevant keywords naturally throughout the text, maintaining a good flow and readability.
7. Include critical data, statistics, or quotes from authoritative sources when mentioned in the transcript to add credibility and boost SEO value.8. Ensure the content answers questions or solves problems related to the topic, providing value to the reader.
9. Conclude with a summary that encapsulates the overall essence of the topic, its implications, and relevance.
10. Add a strong call-to-action with no title as part of the conclusion to encourage reader engagement.
11. Format the entire output in markdown, using appropriate syntax for headings, lists, and emphasis.
12. Aim for a length of approximately 1000-1500 words, adjusting as needed based on the complexity of the topic.

Ensure the article is accessible to a broad audience, avoiding jargon or overly technical language unless necessary. Do not mention that the content is based on a YouTube video.

If the article is related to AI, you can naturally insert one inline link to any relevant urls from the following list:
https://docsbot.ai/ (AI chatbot builder for customer support/service)
https://docsbot.ai/article/finetune-your-bots-answers
https://docsbot.ai/article/the-benefits-of-ai-in-automating-pre-sales-and-customer-support
https://docsbot.ai/article/sorry-but-customers-dont-read-your-documentation
https://docsbot.ai/article/announcing-notion-google-docs-and-intercom-integrations
https://docsbot.ai/article/train-your-ai-chatbots-to-respond-with-images
https://docsbot.ai/article/achieving-the-perfect-chatbot-answer-the-science-of-hybrid-search
https://docsbot.ai/article/a-beginners-guide-to-fine-tuning-your-ai-support-bot
https://docsbot.ai/article/query-to-clarity-introducing-hybrid-search-and-contextual-questions
https://docsbot.ai/article/how-to-serve-global-customers-with-multilingual-ai-support\
https://docsbot.ai/article/custom-training-chatbots-insights-from-our-ai-expert
https://docsbot.ai/article/transforming-customer-support-data-into-actionable-reports-with-ai\
https://docsbot.ai/article/building-an-ai-retention-bot-to-combat-customer-churn
https://docsbot.ai/article/chat-smarter-with-research-mode-and-our-new-search-tool
https://docsbot.ai/article/recycling-content-by-utilizing-docsbot-ai
https://docsbot.ai/article/using-ai-for-marketing-personalization
https://docsbot.ai/article/will-generative-ai-replace-search-engines-and-seo
https://docsbot.ai/article/enterprise-concerns-with-ai-chatbot-deployment
https://docsbot.ai/article/docsbot-for-content-creation
https://docsbot.ai/article/you-shouldnt-build-your-own-ai-support-bot
https://docsbot.ai/article/chatbots-for-everyone-openais-gpts-and-their-limitations
https://docsbot.ai/article/impact-and-advancements-in-ai-chatbots-in-business
https://docsbot.ai/article/the-best-ai-chatbot-builders
https://docsbot.ai/article/the-future-of-jobs-with-ai
https://docsbot.ai/article/using-ai-chatbot-uis-for-product-onboarding
https://docsbot.ai/article/improving-customer-service-jobs-with-ai
https://docsbot.ai/article/semantic-vector-search-for-your-website
https://docsbot.ai/article/enhanced-rag-search-with-the-relativescorefusion-algorithm
https://docsbot.ai/article/rag-context-distracted-by-irrelevant-information
https://docsbot.ai/article/20-best-ai-chatbot-practices
https://docsbot.ai/article/ai-chatbot-customer-engagement
https://docsbot.ai/article/improve-your-chatbot-performance-with-answer-classification
https://docsbot.ai/article/advanced-rag-techniques-multiquery-and-rank-fusion
https://docsbot.ai/article/implementing-ai-in-small-businesses
https://docsbot.ai/article/introducing-gpt-4o-faster-cheaper-and-smarter-ai-chatbots
https://docsbot.ai/article/evaluating-llama-3-a-comprehensive-analysis-of-its-performance
https://docsbot.ai/article/ai-chatbot-terminology
https://docsbot.ai/article/ai-helpdesk-assistants
https://docsbot.ai/article/agent-assist-take-your-help-scout-support-to-the-next-level-with-docsbot
https://docsbot.ai/article/ai-will-not-replace-jobs-someone-who-knows-ai-will
https://docsbot.ai/article/enterprise-llm-use-cases
https://docsbot.ai/article/docsbot-gpt-4o-mini-revolutionizing-customer-support-with-affordable-ai
https://docsbot.ai/article/unlock-the-power-of-ai-mastering-prompting-techniques-with-docsbt
https://docsbot.ai/article/how-to-build-an-faq-bot-for-customer-employee-support
https://docsbot.ai/article/the-11-best-free-chatgpt-alternatives
https://docsbot.ai/article/make-mad-money-as-an-ai-consultant
https://docsbot.ai/article/openais-structured-outputs-accurate-and-useful-responses-for-chatbots
https://docsbot.ai/article/mastering-ai-chatbots
https://docsbot.ai/article/docsbot-for-internal-knowledge-base
https://docsbot.ai/article/sonys-nuro-hikari-revolutionizing-customer-support-with-docsbots-ai-powered-chatbot
https://docsbot.ai/article/a-new-era-of-ai-reasoning-openais-o1-preview-and-o1-mini-models
https://docsbot.ai/article/the-perfect-prompt-6-essential-components-for-creating-effective-ai-prompts
https://docsbot.ai/article/unlock-the-power-of-youtube-with-docsbot-ais-new-training-source-chat-with-your-videos
https://docsbot.ai/article/exploring-llama-3-2-a-landmark-update-with-vision-capabilities
https://docsbot.ai/article/groundhog-day-no-more-let-ai-save-you-from-repetitive-customer-support`,
          },
          {
            role: 'user',
            content: `Create a blog post based on the following YouTube video subtitles and metadata:\n\nMetadata: ${JSON.stringify(metadata)}\n\nSubtitles:\n${subtitles}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'blog_post',
            description:
              'Creates a blog post based on the video transcript as valid JSON.',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description:
                    'The main title of the blog post to be used as the H1 title.',
                },
                seo_meta_description: {
                  type: 'string',
                  description: 'A short SEO-optimizedmeta description for the blog post.',
                },
                content: {
                  type: 'string',
                  description:
                    'The longform markdown-formatted body content of the blog post with NO main H1 title. The first line should be the introductory paragraph with no heading. 1000-1500 words.',
                },
                is_ai: {
                  type: 'boolean',
                  description: 'Wether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
                },
              },
              required: ['title', 'seo_meta_description', 'content', 'is_ai'],
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

      // Save data and send response
      await saveYoutubeBlogPost(ip, videoId, blogPostData)
      return res.status(200).json({ id: videoId, ...blogPostData })
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