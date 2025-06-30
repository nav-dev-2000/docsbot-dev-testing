import OpenAI from 'openai'
import {
  lookupYoutubeData,
  saveYoutubeData,
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
    /(?:youtube.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu.be\/)([^"&?\/\s]{11})/i,
  )
  if (matchId && matchId.length) {
    return matchId[1]
  }

  return null // Add this line
}

const PROMPTS = {
  summary: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant that summarizes YouTube videos based on their subtitles. Provide a concise summary, extract key points, and use the provided metadata.',
      },
      {
        role: 'user',
        content: `Summarize the following YouTube video subtitles. Provide a brief summary, list all the key points, and use the provided metadata:\n\nMetadata: {{metadata}}\n\nSubtitles:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'youtube_summary',
        description: 'Creates a summary of the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
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
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'summary', 'keyPoints', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  // Add more types here as needed
  quotes: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `# IDENTITY and PURPOSE
You extract surprising, insightful, and interesting information from a YouTube video transcript.

Take a step back and think step-by-step about how to achieve the best possible results by following these instructions:

- Extract 10 to 30 of the most surprising, insightful, and/or interesting quotes from the transcript.
- Use the exact quote text from the input.
- Write each quote as exactly 15 words.
- Do not repeat ideas or quotes.
- Do not start items with the same opening words.
- Ensure you follow ALL these instructions when creating your output.`,
      },
      {
        role: 'user',
        content: `Extract quotes from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'quote_extractor',
        description:
          'Extracts insightful quotes from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            quotes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description:
                      'An insightful quote from the video, exactly 15 words long with no quotation marks around it.',
                  },
                  context: {
                    type: 'string',
                    description:
                      'A 1-3 sentence description of the context in which the quote is referring to.',
                  },
                },
                required: ['text', 'context'],
                additionalProperties: false,
              },
              description:
                'List of 10 to 30 insightful quotes from the video with their context',
            },
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'quotes', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  ideas: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `# IDENTITY and PURPOSE
You extract surprising, insightful, and interesting information from a YouTube video transcript.

You take in the transcript of a YouTube video as an input and output JSON according to the schema.

Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Extract 20 to 50 of the most surprising, insightful, and/or interesting ideas from the input in an array called 'ideas'. If there are less than 50 then collect all of them. Make sure you extract at least 20.

- Extract 10 to 20 of the best insights from the input and from a combination of the raw input and the 'ideas' above into an array called 'insights'. These 'insights' should be fewer, more refined, more insightful, and more abstracted versions of the best ideas in the content.

# OUTPUT INSTRUCTIONS

- Only output text, no Markdown.
- Write the 'ideas' as exactly 15 words.
- Extract at least 25 'ideas' from the content.
- Do not give warnings or notes; only output the requested arrays.
- Do not repeat ideas, quotes, facts, or resources.
- Do not start items with the same opening words.
- Ensure you follow ALL these instructions when creating your output.`,
      },
      {
        role: 'user',
        content: `Extract ideas and insights from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'idea_extractor',
        description:
          'Extracts ideas and insights from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            ideas: {
              type: 'array',
              items: {
                type: 'string',
                description: 'An idea from the video, exactly 15 words long',
              },
              description: 'List of 20 to 50 ideas from the video',
            },
            insights: {
              type: 'array',
              items: {
                type: 'string',
                description: 'A refined insight from the video',
              },
              description: 'List of 10 to 20 refined insights from the video',
            },
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'ideas', 'insights', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  recommendations: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `# IDENTITY and PURPOSE

You extract surprising, insightful, and interesting information from text content. 

You take in transcript of a video as an input and output a object.

Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Extract the most potent takeaway and recommendation into a propery called takeaway. This should be a 15-word sentence that captures the most important essence of the content.

- Extract the 15 to 30 of the most surprising, insightful, and/or interesting recommendations that can be collected from the content into a section called recommendations.

# OUTPUT INSTRUCTIONS

- Only output text, no Markdown.
- Write the recommendations as exactly 15 words.
- Do not give warnings or notes; only output the requested sections.
- Do not repeat ideas, quotes, facts, or resources.
- Do not start items with the same opening words.
- Ensure you follow ALL these instructions when creating your output.`,
      },
      {
        role: 'user',
        content: `Extract recommendations from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recommendation_extractor',
        description:
          'Extracts recommendations from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            one_sentence_takeaway: {
              type: 'string',
              description:
                'A 15-word sentence capturing the most important essence of the content',
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'string',
                description:
                  'A recommendation from the video, exactly 15 words long',
              },
              description:
                'List of 15 to 30 surprising, insightful, and/or interesting recommendations from the video',
            },
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'one_sentence_takeaway', 'recommendations', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  faq: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `# IDENTITY and PURPOSE

You extract surprising, insightful, and interesting information from text content. 

You take in transcript of a video as an input and output a object.

Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Extract the most potent takeaway and recommendation into a property called takeaway. This should be a 15-word sentence that captures the most important essence of the content.

- Extract the 15 to 30 of the most surprising, insightful, and/or interesting questions and answers that can be collected from the content into a section called faqs.

# OUTPUT INSTRUCTIONS

- Only output text, no Markdown.
- Write the questions and answers as concisely as possible.
- Do not give warnings or notes; only output the requested sections.
- Do not repeat ideas, quotes, facts, or resources.
- Do not start items with the same opening words.
- Ensure you follow ALL these instructions when creating your output.`,
      },
      {
        role: 'user',
        content: `Extract FAQs from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'faq_extractor',
        description:
          'Extracts FAQs from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            one_sentence_takeaway: {
              type: 'string',
              description:
                'A 15-word sentence capturing the most important essence of the content. For example, if the question was "What is the main purpose of the tutorial?", the takeaway would be "The main purpose of the tutorial is...".',
            },
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: 'An insightful question from the video',
                  },
                  answer: {
                    type: 'string',
                    description: 'The answer to the question',
                  },
                },
                required: ['question', 'answer'],
                minItems: 15,
                maxItems: 30,
                additionalProperties: false,
              },
              description:
                'List of 15 to 30 surprising, insightful, and/or interesting FAQs from the video',
            },
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'one_sentence_takeaway', 'faqs', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  quiz: {
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `# IDENTITY and PURPOSE

You are an expert quiz generator that creates 10+ engaging multiple choice questions from video content.

You take in a transcript of a video as input and output a quiz with questions, answer choices, and explanations.

Take a step back and think step-by-step about how to achieve the best possible results by following these steps:

# STEPS

1. Carefully analyze the video transcript to identify key concepts, facts, and insights that would make good quiz questions
2. For each concept, create a clear and focused multiple choice question
3. Generate 4 answer choices for each question:
   - One correct answer that is clearly accurate
   - Three incorrect but plausible distractors 
4. Write a detailed explanation for why the correct answer is right and why the others are wrong
5. Review to ensure questions test understanding rather than just recall

# OUTPUT INSTRUCTIONS

- Create 10-15 high quality multiple choice questions
- Write clear, unambiguous questions that test comprehension
- Make all answer choices similar in length and style
- Ensure distractors are plausible but clearly incorrect
- Provide thorough explanations for correct answers
- Vary question types (facts, concepts, applications)
- Do not repeat content across questions
- Use proper grammar and professional language
- Test different levels of learning and understanding
- You must output at least 10 (ten) questions! DO NOT OUTPUT LESS THAN 10 QUESTIONS!`,
      },
      {
        role: 'user',
        content: `Extract FAQs from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'multiple_choice_quiz',
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            questions: {
              type: 'array',
              description: 'A list of exactly 10 questions for the quiz.',
              items: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: 'The text of the question being asked.',
                  },
                  options: {
                    type: 'array',
                    description: 'A list of four possible answer options.',
                    items: {
                      type: 'object',
                      properties: {
                        answer: {
                          type: 'string',
                          description: 'A possible answer for this question.',
                        },
                        is_answer: {
                          type: 'boolean',
                          description: 'Indicates if this answer choice is the correct answer.',
                        },
                        reason: {
                          type: 'string',
                          description: 'The reasoning or explanation for why this answer choice is correct or incorrect.',
                        },
                      },
                      required: ['answer', 'is_answer', 'reason'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['question', 'options'],
                additionalProperties: false,
              },
              minItems: 10,
              maxItems: 15,
            },
            is_ai: {
              type: 'boolean',
              description: 'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['questions', 'short_title', 'is_ai'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  },
  moments: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying viral moments and highlights in video content. Your task is to pinpoint exact moments that elicit a strong "wow" response from viewers.

GOALS:
- Identify moments in the content likely to generate a "wow" reaction from the audience.
- Focus on moments of surprise, novelty, deep insight, immense value, or profound wisdom.
- Highlight content that could potentially go viral or be shared widely.

STEPS:
- Analyze the content thoroughly, considering different perspectives.
- Extract moments likely to cause a wow reaction and describe their impact.
- Identify the type of wow-factor present (e.g., surprise, novelty, insight, value, wisdom).
- Summarize each wow moment concisely, emphasizing its viral potential.

OUTPUT:
Provide the output as a JSON object with the following structure:

- Ensure no repetition of ideas or descriptions across moments.
- Focus on the most impactful and shareable content.
- Provide 3-5 viral moments in your response.`,
      },
      {
        role: 'user',
        content: `Identify viral moments and highlights from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'viral_moment_extractor',
        description:
          'Extracts viral moments from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            viral_moments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description:
                      'A brief description of the viral moment and why it stands out',
                  },
                  wow_factor: {
                    type: 'string',
                    description:
                      'The type of wow-factor present (e.g., Surprise, Novelty, Insight, Value, Wisdom)',
                  },
                  viral_potential: {
                    type: 'string',
                    description:
                      'An explanation of why this moment could go viral',
                  },
                  virality_rating: {
                    type: 'integer',
                    description:
                      'A rating of the viral potential of the moment, from 1 to 5 (5 being the highest potential)',
                  },
                },
                required: [
                  'description',
                  'wow_factor',
                  'viral_potential',
                  'virality_rating',
                ],
                additionalProperties: false,
              },
            },
            is_ai: {
              type: 'boolean',
              description:
                'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'viral_moments', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
  tweets: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a savvy social media content creator specializing in extracting thought-provoking, viral-worthy Tweets from long-form content. Your expertise lies in distilling complex ideas into bite-sized, shareable tweets that resonate with a wide audience. You focus on topics that are most likely to be shared and go viral.

Your task is to analyze the given video transcript and create 10-15 tweet-worthy posts based on the content. Each tweet should be 280 characters or less, including emojis and hashtags. Each tweet should have a relevant emoji somewhere in the content and end with 1-2 pertinent hashtags. Aim for a mix of thought-provoking questions, bold statements, and actionable insights.

Vary your sentence structures and opening phrases to maintain interest. Avoid repetition of ideas or phrasing across tweets.

# EXAMPLE OUTPUT

- 🧠 Neuroplasticity isn't just for kids! Your brain can form new connections at any age. Keep learning, stay curious, and watch your mind evolve. #NeverStopGrowing #BrainPower

- AI isn't replacing humans, it's augmenting us. 🤖 The future belongs to those who learn to dance with algorithms, not fear them. #AICollaboration #FutureOfWork

- The most successful people have one thing in common: they never stop reading 📚. Your next big idea could be hiding in the pages of a book. What are you reading today? #ReadToLead`,
      },
      {
        role: 'user',
        content: `Generate tweet-worthy posts from the following YouTube video transcript:\n\nMetadata: {{metadata}}\n\nTranscript:\n{{subtitles}}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'tweet_generator',
        description: 'Generates tweet-worthy posts from the video transcript as valid JSON.',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            short_title: {
              type: 'string',
              description: 'A concise title of the video, 5 words or less',
            },
            tweets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description: 'The tweet content, including emojis and hashtags',
                  },
                  creative_name: {
                    type: 'string',
                    description: 'A unique 2-3 word name that relates to the tweet content',
                  },
                  creative_handle: {
                    type: 'string',
                    description: 'A unique Twitter-style handle based on the creative_name, prefixed with @',
                  },
                  virality_potential: {
                    type: 'integer',
                    description: 'A rating of the viral potential of the tweet, from 1 to 100',
                  },
                },
                required: ['content', 'creative_name', 'creative_handle', 'virality_potential'],
                additionalProperties: false,
              },
            },
            is_ai: {
              type: 'boolean',
              description: 'Whether the topic is related to AI, while not discussing a chatbot building or AI customer support platform.',
            },
          },
          required: ['short_title', 'tweets', 'is_ai'],
          additionalProperties: false,
        },
      },
    },
  },
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
      const { videoUrl, type } = req.body
      const videoId = getVideoId(videoUrl)

      if (!videoId) {
        return res
          .status(400)
          .json({ message: 'Invalid YouTube URL or video ID.' })
      }

      if (!type || !PROMPTS[type]) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing type parameter.' })
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
      const cachedData = await lookupYoutubeData(videoId, type)
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

      const chatParams = getChatParams(type, {
        metadata,
        subtitles,
      })
      const chat_completion = await openai.chat.completions.create(chatParams)

      const responseData = JSON.parse(
        chat_completion.choices[0].message.content,
      )

      await saveYoutubeData(ip, videoId, type, metadata.title, responseData)
      return res.status(200).json({
        ...responseData,
        videoId, // Add videoId to the response
      })
    } else if (req.method === 'GET') {
      const { videoId, type } = req.query

      if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ message: 'Invalid video ID.' })
      }

      if (!type || !PROMPTS[type]) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing type parameter.' })
      }

      // check cache
      const cachedData = await lookupYoutubeData(videoId, type)
      if (cachedData) {
        return res.status(200).json(cachedData)
      } else {
        return res.status(404).json({
          message: `Data for video ${videoId} and type ${type} doesn't exist!`,
        })
      }
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
