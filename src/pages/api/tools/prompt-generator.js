import OpenAI from 'openai'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'

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

    try {
      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chat_completion = await openai.chat.completions.create({
        model: 'gpt-4o',
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
                    type: 'string'
                  },
                  description: 'An array of 1-4 tags that represent the prompt with proper capitalization',
                },
                should_index: {
                  type: 'boolean',
                  description: 'True only if the prompt is generally useful to many people, in English,does not contain PII, is not branded, and is not potentially offensive, about sex, nudity, girlfriends, or NSFW',
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
        while (true) {
          const existingDoc = await firestore
            .collection('prompts')
            .doc(uniqueSlug)
            .get()
          if (!existingDoc.exists) {
            return uniqueSlug
          }
          uniqueSlug = `${baseSlug}-${counter}`
          counter++
        }
      }

      const newId = await checkSlugUniqueness(slug)
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
        .json({ message: `Prompt "${name}" doesn't exist!` })
    }
  }

  res.setHeader('Allow', ['POST', 'GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
