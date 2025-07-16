import OpenAI from 'openai'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'
import { clearCloudflareCache } from '@/lib/cloudflare'

configureFirebaseApp()
const firestore = getFirestore()

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

const META_PROMPT = `
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions: Encourage reasoning steps before any conclusions are reached.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible.
- Access to Knowledge: Make sure the prompt reflects that when answering questions, you will be provided context to answer the question truthfully and accurately.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection.
- Output Format: Explicitly state the most appropriate output format, in detail.

The final prompt you output should adhere to the following structure. Do not include any additional commentary, only output the completed system prompt.

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]
`.trim()

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { input } = req.body

    if (!input) {
      return res.status(400).json({ message: 'Missing input parameter' })
    }

    // Check if user is logged in or has a valid API key
    let user
    let isLoggedIn = false
    let isSuperAdmin = false
    try {
      user = await getAuthorizedUser({ req })
      isSuperAdmin = isSuperAdmin(user.uid)
      isLoggedIn = true
    } catch (error) {
      // User is not logged in and doesn't have a valid API key
    }

    // Check rate limit
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const isRateLimited = await checkPromptRateLimit(ip, 'prompt', isLoggedIn)
    if (isRateLimited && !isSuperAdmin) {
      return res.status(429).json({ message: `Your IP has been rate limited.` })
    }

    // Check if we're in the Hong Kong region
    if (process.env?.VERCEL_REGION === 'hkg1') {
      return res.status(500).json({
        message: `Unfortunately this feature is not available in Hong Kong.`,
      })
    }

    // Define forbidden words that should cause rejection
    const forbidden_words = [
      'sexual',
      'tit',
      'tits',
      'titties',
      'titty',
      'tittyfuck',
      'tittyfucker',
      'cum',
      'cumshot',
      'cumshots',
      'cumming',
      'porn',
      'nude',
      'naked',
      'xxx',
      'hentai',
      'aviator',
      '1win',
      'blox',
      'bloxfruits',
      'milf',
      'pussy',
      'betika',
      '91 club',
      '91club',
      'gift card',
      'color prediction',
      'quotex',
      'betting',
      'casino',
      'slot machine',
      'bdsm',
      'bondage',
      'fetish',
      'kink',
      'game hack',
      'mating',
      'code generator',
      'lottery',
      'quatex',
      'bukkake',
      'bank statement',
      'femdom',
      '1xbet',
      'tiranga',
      'pornhub',
      'redtube',
      'xvideos',
      'youporn',
      'xhamster',
      'xnxx',
      'robux',
      'roblox',
      'aimbot',
      'cheat',
      'cheater',
      'cheats',
      'scam',
      'receipt',
      'cheats',
      'spanking',
      'spank',
      'spanked',
      'cuckold',
      'cuckolded',
      'futa',
      'futanari',
      'girlfriend',
      'boyfriend',
      'girlfriends',
      'boyfriends',
      'otp',
      'otpcode',
      'seed phrase',
      'sexting',
      'sext',
      'amateur',
      'anal',
      'analannie',
      'analsex',
      'areola',
      'aroused',
      'assfuck',
      'assfucker',
      'asslick',
      'asslicker',
      'asslover',
      'assmunch',
      'assmuncher',
      'asspacker',
      'asspirate',
      'asswhore',
      'asswipe',
      'backdoor',
      'barelylegal',
      'beatoff',
      'beat-off',
      'beatyourmeat',
      'bestiality',
      'biatch',
      'bicurious',
      'bisexual',
      'bi-sexual',
      'bitchslap',
      'blowjob',
      'bondage',
      'boner',
      'boob',
      'boobies',
      'boobs',
      'brothel',
      'butt',
      'buttbang',
      'buttfuck',
      'buttfucker',
      'buttmunch',
      'buttpirate',
      'buttplug',
      'cameltoe',
      'carpetmuncher',
      'clit',
      'clitoris',
      'cock',
      'cockblock',
      'cocklicker',
      'cocklover',
      'cockrider',
      'cocksucker',
      'cocksucking',
      'cocktease',
      'coitus',
      'condom',
      'cunnilingus',
      'cum',
      'cumbubble',
      'cumfest',
      'cumjockey',
      'cumming',
      'cumquat',
      'cumshot',
      'deepthroat',
      'dildo',
      'doggiestyle',
      'doggystyle',
      'escort',
      'erotic',
      'erection',
      'fellatio',
      'fingerfuck',
      'fister',
      'fisting',
      'fuck',
      'fuckable',
      'fucked',
      'fucker',
      'fuckface',
      'fucking',
      'gangbang',
      'handjob',
      'hardon',
      'hooker',
      'incest',
      'intercourse',
      'jackoff',
      'jerkoff',
      'jizz',
      'lesbo',
      'lesbian',
      'livesex',
      'masturbate',
      'masturbation',
      'milf',
      'muff',
      'naked',
      'nymph',
      'oral sex',
      'orgasm',
      'orgy',
      'phone sex',
      'playboy',
      'porn',
      'porno',
      'pornography',
      'prostitute',
      'pussy',
      'rimjob',
      'semen',
      'sexed',
      'sexing',
      'sextoy',
      'sexual',
      'sexually',
      'slut',
      'scam',
      'threesome',
      'tit',
      'titfuck',
      'titjob',
      'tits',
      'twat',
      'upskirt',
      'vibrator',
      'virginbreaker',
      'wank',
      'wanker',
      'xxx',
      'abbo',
      'abo',
      'alligatorbait',
      'beaner',
      'chink',
      'coon',
      'dago',
      'darkie',
      'dyke',
      'fag',
      'faggot',
      'gook',
      'honkey',
      'jigaboo',
      'kike',
      'mulatto',
      'nigger',
      'porchmonkey',
      'raghead',
      'spic',
      'wetback',
      'white trash',
      'wigger',
      'zipperhead',
      'wop',
      'USDT'
    ]

    // Function to check if text contains any forbidden words (with word boundaries)
    const containsForbiddenWords = (text) => {
      if (!text) return false
      const lowerText = text.toLowerCase()
      return forbidden_words.some((word) => {
        // Create a regex with word boundaries to match whole words only
        const regex = new RegExp(`\\b${word}\\b`, 'i')
        return regex.test(lowerText)
      })
    }

    // Check the input for forbidden content before calling OpenAI
    if (containsForbiddenWords(input)) {
      return res.status(400).json({
        message:
          'Your request contains inappropriate content that violates our content policy and cannot be processed.',
      })
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chat_completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: META_PROMPT },
          { role: 'user', content: `Task, Goal, or Current Prompt:\n${input}` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'prompt',
            description: 'Extracts the full prompt and metadata as valid JSON.',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description:
                    'The full generated prompt text according to the instructions, no JSON or metadata.',
                },
                name: {
                  type: 'string',
                  description:
                    'A short, descriptive name for the prompt. 2-4 words.',
                },
                short_description: {
                  type: 'string',
                  description:
                    'A brief description of what the prompt does. One sentence.',
                },
                icon: {
                  type: 'string',
                  enum: [
                    'AcademicCapIcon',
                    'AdjustmentsHorizontalIcon',
                    'ArchiveBoxIcon',
                    'ArrowTrendingUpIcon',
                    'ArrowPathRoundedSquareIcon',
                    'AtSymbolIcon',
                    'BanknotesIcon',
                    'BeakerIcon',
                    'BoltIcon',
                    'BellIcon',
                    'BookOpenIcon',
                    'BookmarkIcon',
                    'BriefcaseIcon',
                    'BuildingLibraryIcon',
                    'BuildingOffice2Icon',
                    'BuildingStorefrontIcon',
                    'BugAntIcon',
                    'CakeIcon',
                    'CalculatorIcon',
                    'CalendarIcon',
                    'CameraIcon',
                    'ChartBarIcon',
                    'ChartPieIcon',
                    'ChatBubbleLeftIcon',
                    'CheckCircleIcon',
                    'CloudIcon',
                    'ClockIcon',
                    'CodeBracketIcon',
                    'CogIcon',
                    'CommandLineIcon',
                    'ComputerDesktopIcon',
                    'CpuChipIcon',
                    'CreditCardIcon',
                    'CubeIcon',
                    'DevicePhoneMobileIcon',
                    'DocumentTextIcon',
                    'EnvelopeIcon',
                    'ExclamationCircleIcon',
                    'EyeIcon',
                    'FaceSmileIcon',
                    'FilmIcon',
                    'FingerPrintIcon',
                    'FireIcon',
                    'FlagIcon',
                    'FolderIcon',
                    'GiftIcon',
                    'GlobeAltIcon',
                    'GlobeAsiaAustraliaIcon',
                    'HandRaisedIcon',
                    'HashtagIcon',
                    'HeartIcon',
                    'HomeIcon',
                    'HomeModernIcon',
                    'IdentificationIcon',
                    'InformationCircleIcon',
                    'KeyIcon',
                    'LanguageIcon',
                    'LightBulbIcon',
                    'LinkIcon',
                    'ListBulletIcon',
                    'LockClosedIcon',
                    'MagnifyingGlassIcon',
                    'MapPinIcon',
                    'MegaphoneIcon',
                    'MicrophoneIcon',
                    'MoonIcon',
                    'NewspaperIcon',
                    'PaintBrushIcon',
                    'PaperAirplaneIcon',
                    'PencilIcon',
                    'PhoneIcon',
                    'PhotoIcon',
                    'PlayIcon',
                    'PresentationChartBarIcon',
                    'PrinterIcon',
                    'PuzzlePieceIcon',
                    'RadioIcon',
                    'RectangleGroupIcon',
                    'RocketLaunchIcon',
                    'ScaleIcon',
                    'ScissorsIcon',
                    'ServerIcon',
                    'ShieldCheckIcon',
                    'ShoppingBagIcon',
                    'ShoppingCartIcon',
                    'SignalIcon',
                    'SparklesIcon',
                    'SpeakerWaveIcon',
                    'StarIcon',
                    'SunIcon',
                    'TicketIcon',
                    'TrashIcon',
                    'TrophyIcon',
                    'TruckIcon',
                    'TvIcon',
                    'UserCircleIcon',
                    'UserGroupIcon',
                    'VideoCameraIcon',
                    'WalletIcon',
                    'WifiIcon',
                    'WrenchIcon',
                  ],
                  description: 'An icon best representing the prompt',
                },
                category: {
                  type: 'string',
                  enum: Object.keys(PROMPT_CATEGORIES),
                  description: 'The most relevant category for the prompt',
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description:
                    'An array of 1-4 tags that represent the prompt with proper capitalization',
                },
                should_index: {
                  type: 'boolean',
                  description:
                    'True only if the prompt would be generally useful for work, school, or businesses, in English, does not contain any Personally Identifiable Information (persons name, birthdate, email, phone, address, ID numbers, etc), is not branded, and is not potentially offensive, about sex, nudity, girlfriends, or NSFW. Set False if about gambling, Aviator, Blox, 1win, scam bots, gift cards, or other potentially harmful content.',
                },
              },
              required: [
                'prompt',
                'name',
                'short_description',
                'icon',
                'category',
                'tags',
                'should_index',
              ],
              additionalProperties: false,
            },
          },
        },
      })

      const responseData = JSON.parse(
        chat_completion.choices[0]?.message?.content,
      )

      // Check if the response data contains any forbidden words
      if (responseData) {
        // Convert the entire responseData object to a string for checking
        const jsonString = JSON.stringify(responseData)

        // Check if any forbidden words are in the JSON string
        if (containsForbiddenWords(jsonString)) {
          responseData.should_index = false
        }
      }

      // Convert name to a URL slug
      const slugify = (str) => {
        return str
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      let slug = slugify(responseData.name)

      // Check if the slug already exists and make it unique if necessary
      const checkSlugUniqueness = async (baseSlug) => {
        let uniqueSlug = baseSlug
        let counter = 1
        let isDuplicate = false

        while (true) {
          const existingDoc = await firestore
            .collection('prompts')
            .doc(uniqueSlug)
            .get()
          if (!existingDoc.exists) {
            return { uniqueSlug, isDuplicate }
          }
          // If we had to modify the slug, it means the original was a duplicate
          isDuplicate = true
          uniqueSlug = `${baseSlug}-${counter}`
          counter++
        }
      }

      const { uniqueSlug: newId, isDuplicate } = await checkSlugUniqueness(slug)

      // Override should_index to false if it's a duplicate
      if (isDuplicate) {
        responseData.should_index = false
      }

      // Double-check should_index with GPT-4o-mini if it's currently set to true
      if (responseData.should_index) {
        try {
          // Function to verify if content should be indexed using GPT-4o-mini
          const verifyContentShouldBeIndexed = async (content) => {
            const VERIFICATION_PROMPT = `
You are a content moderator tasked with determining if the following prompt content should be publicly indexed in a library of prompts.

Evaluate if the content meets ALL of these criteria:
1. Is generally useful for work, school, or business professionals
2. Is in English language
3. Does NOT contain any Personally Identifiable Information (PII) such as personnames, birthdates, email addresses, phone numbers, addresses, IDs, etc
4. Is NOT branded or promoting a specific product/service
5. Is NOT potentially offensive, harmful, or inappropriate
6. Does NOT relate to adult content, gambling, trading, scams, hacking, or illegal activities
7. Does NOT contain content about sex, nudity, dating, relationships, girlfriends, BDSM, or other adult or NSFW material
8. Does NOT relate to gambling, betting, casinos, lotteries, trading, or similar activities
9. Does NOT involve hacks, cheats, or exploits for games or systems
10. Does NOT involve generating fake documents, statements, or credentials
11. Does NOT involve potentially criminal activities in any jurisdiction
12. Does NOT involve fake receipts, bills, invoices, or other financial documents

Content to evaluate:
${JSON.stringify({
  name: content.name,
  short_description: content.short_description,
  prompt: content.prompt,
  tags: content.tags,
})}
`.trim()

            const verification = await openai.chat.completions.create({
              model: 'gpt-4.1-nano',
              messages: [{ role: 'system', content: VERIFICATION_PROMPT }],
              temperature: 0,
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'classification',
                  description: 'Classifies the content',
                  strict: true,
                  schema: {
                    type: 'object',
                    properties: {
                      reason: {
                        type: 'string',
                        description:
                          'A short explanation of why the content should or should not be indexed',
                      },
                      shouldIndex: {
                        type: 'boolean',
                        description:
                          'True ONLY if the content meets ALL criteria for indexing, otherwise false',
                      },
                    },
                    required: ['reason', 'shouldIndex'],
                    additionalProperties: false,
                  },
                },
              },
            })

            try {
              const parsedResponse = JSON.parse(
                verification.choices[0]?.message?.content ||
                  '{"shouldIndex":false}',
              )

              console.log('Second check shouldBeIndexed', parsedResponse)
              return parsedResponse.shouldIndex === true
            } catch (parseError) {
              console.error('Error parsing verification response:', parseError)
              return false
            }
          }

          // Verify if the content should be indexed
          const shouldBeIndexed =
            await verifyContentShouldBeIndexed(responseData)

          // Override should_index based on the verification result
          responseData.should_index = shouldBeIndexed
        } catch (verificationError) {
          console.error('Error during content verification:', verificationError)
          // If verification fails, err on the side of caution and set should_index to false
          responseData.should_index = false
        }
      }

      // Save prompt to database
      await addPrompt(ip, 'prompt', responseData, newId)

      responseData.slug = newId

      return res.status(200).json(responseData)
    } catch (e) {
      console.error(e)
      return res
        .status(500)
        .json({ message: `Failed to generate prompt: ${e}` })
    }
  } else if (req.method === 'GET') {
    const { slug } = req.query

    // Check cache
    const cachedPrompt = await getPrompt(slug)
    if (cachedPrompt) {
      return res.status(200).json(cachedPrompt)
    } else {
      return res
        .status(404)
        .json({ message: `Prompt "${slug}" doesn't exist!` })
    }
  } else if (req.method === 'DELETE') {
    let { slug, category } = req.query

    if (!slug) {
      return res.status(400).json({ message: 'Missing slug parameter' })
    }

    try {
      // Check if user is a super admin
      let user = null
      try {
        user = await getAuthorizedUser({ req })
        
        if (!isSuperAdmin(user.uid)) {
          return res.status(403).json({ message: 'Unauthorized: Only super admins can delete prompts' })
        }
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Authentication required' })
      }

      // Get the prompt to make sure it exists
      let tags = []
      try {
        const prompt = await getPrompt(slug)
        if (prompt) {
          // Delete the prompt from the database
          await firestore.collection('prompts').doc(slug).delete()

          // Revalidate related ISR paths to clear the cache
          category = prompt.category
          tags = prompt.tags
        }
      } catch (error) {
        console.warning('Prompt fetch error, continuing...', error)
      }

      // Clear Cloudflare cache for prompt pages
      const urlsToPurge = [
        `https://docsbot.ai/prompts/${category}/${slug}`,
        `https://docsbot.ai/prompts/${category}`,
        `https://docsbot.ai/prompts`,
      ]

      // Add tag URLs to purge if present
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          urlsToPurge.push(`https://docsbot.ai/prompts/tags?tag=${encodeURIComponent(tag)}`)
        })
      }

      // Use the cloudflare helper to clear the cache
      try {
        const cloudflareClearResult = await clearCloudflareCache(null, null, urlsToPurge)
        console.log(`Cloudflare cache cleared: ${cloudflareClearResult ? 'success' : 'failed'}`)
        await new Promise(resolve => setTimeout(resolve, 20000))
      } catch (cloudflareError) {
        console.error('Error clearing Cloudflare cache:', cloudflareError)
        // Continue even if Cloudflare purge fails
      }

      const pathsToRevalidate = [
        `/prompts/${category}/${slug}`,  // The prompt page itself
        `/prompts/${category}`,          // The category listing page
        '/prompts',                      // The main prompts listing page
      ]

      // If the prompt has tags, also revalidate the tag pages
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          pathsToRevalidate.push(`/prompts/tags?tag=${encodeURIComponent(tag)}`)
        })
      }

      // Revalidate each path
      await Promise.all(pathsToRevalidate.map(async (path) => {
        try {
          await res.revalidate(path)
          console.log(`Revalidated: ${path}`)
        } catch (error) {
          console.error(`Failed to revalidate path ${path}:`, error)
          // Continue with other revalidations even if one fails
        }
      }))

      // Use the cloudflare helper to clear the cache
      try {
        const cloudflareClearResult = await clearCloudflareCache(null, null, urlsToPurge)
        console.log(`Cloudflare cache cleared: ${cloudflareClearResult ? 'success' : 'failed'}`)
      } catch (cloudflareError) {
        console.error('Error clearing Cloudflare cache:', cloudflareError)
        // Continue even if Cloudflare purge fails
      }

      return res.status(200).json({ 
        message: 'Prompt deleted successfully',
        revalidatedPaths: pathsToRevalidate
      })
    } catch (error) {
      console.error('Error deleting prompt:', error)
      return res.status(500).json({ message: `Failed to delete prompt: ${error.message}` })
    }
  }

  res.setHeader('Allow', ['POST', 'GET', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
