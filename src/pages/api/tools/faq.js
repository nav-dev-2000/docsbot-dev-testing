import { Configuration, OpenAIApi } from 'openai'
import { lookupFAQs, saveFAQs, checkFAQsRateLimit } from '@/lib/faqs'

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = ['iad1', 'hnd1', 'lhr1', 'sfo1', 'syd1', 'bom1', 'fra1'];

const scrapeURL = async (url) => {
  const endpoint = `https://scrapedown.docsbot.workers.dev/?url=${encodeURIComponent(
    url
  )}&markdown=true&extract=false`
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

const getURLScreenCap = async (url) => {
  const endpoint = `https://docsbot-screenshot.docsbot.workers.dev/?url=${encodeURIComponent(url)}`
  console.log(endpoint)
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  try {
    const data = await response.json()
    console.log(data)
    if (response.ok) {
      return data
    }
  } catch (e) {
    console.error(e)
  }

  return null
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { siteURL } = req.body
    const url = new URL(siteURL)
    // we can't use url.href because it includes the path, query and other annoyances
    const hrefURL = `${url.protocol}//${url.hostname}/`

    // check cache
    const cachedData = await lookupFAQs(hrefURL)
    if (cachedData) {
      return res
        .status(200)
        .json({
          faqs: cachedData.FAQs,
          summary: cachedData.summary,
          screenCap: cachedData.screenCap,
          thumbnail: cachedData.thumbnail,
        })
    }

    // check rate limit
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const isRateLimited = await checkFAQsRateLimit(ip)
    if (isRateLimited) {
      return res.status(429).json({ message: `Your IP has been rate limited.` })
    }

    // we cannot generate the FAQs in hong kong, see: https://vercel.com/changelog/openai-will-not-support-the-hong-kong-region-hkg1-for-functions
    // btw, preferredRegion should help prevent this from being ran in an edge function in the hong kong aws region unless there's an outage in all of our preferred regions (very highly unlikely)
    if (process.env?.VERCEL_REGION === 'hkg1') {
      return res
        .status(500)
        .json({ message: `Unfortunately this feature is not available in Hong Kong.` })
    }

    try {
      const [content, screenCaptures] = await Promise.all([
        scrapeURL(hrefURL),
        getURLScreenCap(hrefURL),
      ])

      if (!content) {
        return res
          .status(500)
          .json({ message: `Failed to scrape ${siteURL}! Are you sure it's a valid URL?` })
      }

      if (!screenCaptures) {
        return res
          .status(500)
          .json({
            message: `Failed to get screen capture of ${siteURL}! Are you sure it's a valid URL?`,
          })
      }

      // generate FAQs
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      })
      const openai = new OpenAIApi(configuration)

      let chat_completion = null
      try {
        chat_completion = await openai.createChatCompletion({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'Generate a comprehensive list of at least 10 FAQs for the following webpage that addresses common customer queries and concerns written in the primary language of the site\'s content. Begin by identifying the most frequently asked questions by customers, drawing from customer service interactions, social media inquiries, and feedback forms. Ensure the questions cover a broad range of topics, including product features, usage instructions, troubleshooting, pricing, availability, and support services. Write clear and concise answers for each question, providing helpful and accurate information. Include any relevant tips, best practices, or additional resources that could assist the customer. Organize the FAQs in a logical order, grouping similar topics together for easy navigation. Conclude with a section for any additional support options available, such as customer service contact information or links to more detailed resources.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: "Here's a screen capture of the target webpage" },
                {
                  type: 'image_url',
                  image_url: {
                    url: screenCaptures.full,
                  },
                },
              ],
            },
            { role: 'user', content: `${content}` },
          ],
          functions: [
            {
              name: 'faq_list',
              description: 'Extracts the frequently asked questions as valid JSON.',
              parameters: {
                type: 'object',
                properties: {
                  faqs: {
                    type: 'array',
                    description: 'Array of each question and answer.',
                    items: {
                      type: 'object',
                      properties: {
                        question: {
                          type: 'string',
                          description: 'Plaintext question.',
                        },
                        answer: {
                          type: 'string',
                          description: 'Answer formatted in markdown.',
                        },
                      },
                    },
                  },
                  summary: {
                    type: 'string',
                    description: "Summary of the site's content.",
                  },
                },
              },
              required: ['faqs'],
            },
          ],
          function_call: { name: 'faq_list' },
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Failed to connect to OpenAI. Please try again.' })
      }

      // parse response
      let responseData = null
      try {
        responseData = JSON.parse(chat_completion.data.choices[0].message.function_call.arguments)
      } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Invalid JSON response from OpenAI. Please try again.' })
      }

      if (!responseData?.faqs || !responseData?.summary) {
        return res.status(500).json({ message: 'Invalid response from OpenAI. Please try again.' })
      }

      // save data && send response
      await saveFAQs(
        ip,
        hrefURL,
        screenCaptures.full,
        screenCaptures.thumbnail,
        responseData.summary,
        responseData.faqs
      )
      return res
        .status(200)
        .json({
          faqs: responseData.faqs,
          summary: responseData.summary,
          screenCap: screenCaptures.full,
          thumbnail: screenCaptures.thumbnail,
        })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: `Failed to gen ${e}` })
    }
  } else if (req.method === 'GET') {
    const { siteURL } = req.query

    // check cache
    const cachedData = await lookupFAQs(siteURL)
    if (cachedData) {
      return res
        .status(200)
        .json({
          faqs: cachedData.FAQs,
          summary: cachedData.summary,
          screenCap: cachedData.screenCap,
          thumbnail: cachedData.thumbnail,
        })
    } else {
      return res.status(404).json({ message: `${siteURL} doesn't exist!` })
    }
  }
}
