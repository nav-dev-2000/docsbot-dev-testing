import OpenAI from 'openai'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'
import { clearCloudflareCache } from '@/lib/cloudflare'
import { phTrack } from '@/lib/posthog'

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
    const forwardedFor = req.headers['x-forwarded-for']
    const fallbackIp = req.socket?.remoteAddress || req.connection?.remoteAddress
    const normalizeIp = (value) => {
      if (!value) return 'anonymous'
      if (Array.isArray(value)) {
        return value[0] || 'anonymous'
      }
      if (typeof value === 'string') {
        return value.split(',')[0].trim() || 'anonymous'
      }
      return 'anonymous'
    }

    const ip = normalizeIp(forwardedFor || fallbackIp)

    if (!input) {
      return res.status(400).json({ message: 'Missing input parameter' })
    }

    // Check if user is logged in or has a valid API key
    let user
    let isLoggedIn = false
    let userIsSuperAdmin = false
    try {
      user = await getAuthorizedUser({ req })
      userIsSuperAdmin = isSuperAdmin(user.uid)
      isLoggedIn = true
    } catch (error) {
      // User is not logged in and doesn't have a valid API key
    }

    // Check rate limit
    const isRateLimited = await checkPromptRateLimit(ip, 'prompt', {
      isLoggedIn,
      userId: user?.uid,
    })
    if (isRateLimited && !userIsSuperAdmin) {
      return res.status(429).json({ message: `Your IP has been rate limited.` })
    }

    const distinctId = user?.uid || ip || 'anonymous'

    // Check if we're in the Hong Kong region
    if (process.env?.VERCEL_REGION === 'hkg1') {
      return res.status(500).json({
        message: `Unfortunately this feature is not available in Hong Kong.`,
      })
    }

    // Define forbidden words that should cause rejection
    const FORBIDDEN_WORDS = [
  '1win','1xbet','91 club','91club','abbo','abo','aadhaar','aadhar','aimbot','african','alligatorbait','amateur',
  'amazon','anal','analannie','analsex','anime','apple','areola','aroused','assfuck','assfucker','asslick','asslicker','asslover',
  'assmunch','assmuncher','asspacker','asspirate','asswhore','asswipe','aviator','backdoor','barelylegal','bangladesh','bangladeshi',
  'bank','bank statement','beaner','beat-off','beatoff','beatyourmeat','bet365','betfair','betika','betting',
  'bestiality','bgmi','bi-sexual','biatch','bicurious','bisexual','bitchslap','blox','bloxfruits','blowjob',
  'boner','boob','boobies','boobs','bondage','brothel','bukkake','butt','buttbang','buttfuck','buttfucker',
  'buttmunch','buttpirate','buttplug','cameltoe','camgirl','camsex','carpetmuncher','casino','cashapp free',
  'chastity','cheat','cheater','cheats','chicken road','chink','clit','clitoris','cock','cockblock','cocklicker','cocklover',
  'cockrider','cocksucker','cocksucking','cocktease','code generator','color prediction','condom','coon',
  'coitus','coupon','crypto','cuckold','cuckolded','cum','cumbubble','cumfest','cumjockey','cumquat','cumming',
  'cumshot','cumshots','cunnilingus','darkie','dago','debit card generator','deepthroat','dildo','discount code',
  'doggiestyle','doggystyle','downloader','dyke','erotic','erection','escort','fake','fag','faggot','facial','fellatio','femboy','femdom',
  'fetish','fingerfuck','fister','fisting','flipkart','fuck','fuckable','fucked','fucker','fuckface','fucking','futa',
  'futanari','gangbang','gift card','girlfriend','girlfriends','gook','hack','hacking','handjob','hardon','hentai',
  'honkey','hooker','incest','indian','instant loan','intercourse','jackoff','jackpot','jerkoff','jigaboo','jizz',
  'kamasutra','kike','kink','lesbian','lesbo','loan approval','livesex','lottery','lucky draw','ludo',
  'masturbate','masturbation','mating','milf','mines','mulatto','muff','naked','nigger','nude','nymph','onlyfans',
  'oral sex','orgasm','orgy','otp','otpcode','pan card','passport','payPal free','phone sex','playboy',
  'porn','pornhub','porno','pornography','predictions','prediction','pregnant','prostitute','promo code','pussy',
  'quatex','quotex','raghead','receipt','redeem','redemption','redtube','rimjob','roblox','robux','roleplay','rolex','roulette','rummy',
  'scam','screenshot','seed phrase','semen','sexed','sexing','sext','sexting','sextoy','sexual','sexually','sexy','slut',
  'slot machine','son','spank','spanked','spanking','spic','spin','spanking','stake','sugar baby','sugar daddy',
  'tits','tit','titfuck','titjob','tiranga','titty','titties','tittyfuck','tittyfucker','teen patti',
  'threesome','titfuck','twat','uncensor','uncensored','upskirt','usdt','vibrator','venmo free','virginbreaker','voucher','wank',
  'wanker','webcam','wetback','white trash','wigger','wop','xhamster','xnxx','xvideos','xxx','youporn',
  'zipperhead','asmr','aunty','BDSM','airdrop','ada','bnb','binance','binance free','bitcoin','btc','cardano','claim tokens','coinbase free',
  'crypto faucet','crypto giveaway','dai','defi','dex','doge','dogecoin','daughter','eth','ethereum','father','free bitcoin',
  'free crypto','free usdt','hash rate','ico','initial coin offering','litecoin','ltc','metamask','metaverse coin',
  'mining rig','phantom wallet','polkadot','presale','private key','pump signal','recover wallet','ripple',
  'seed phrase','shiba inu','shib','signal group','sol','solana','staking','token sale','tron','trust wallet',
  'trx','unlock wallet','usdc','wallet seed','xrp','yield farming'
];


    // Function to check if text contains any forbidden words (with word boundaries)
    const containsForbiddenWords = (text) => {
      if (!text) return false
      const lowerText = text.toLowerCase()
      return FORBIDDEN_WORDS.some((word) => {
        // Create a regex with word boundaries to match whole words only
        const regex = new RegExp(`\\b${word}\\b`, 'i')
        return regex.test(lowerText)
      })
    }

    // Check the input for forbidden content before calling OpenAI
    if (containsForbiddenWords(input)) {
      await phTrack(distinctId, 'Prompt Blocked', {
        reason: 'forbidden_input',
        tool: 'prompt-generator',
      })
      return res.status(400).json({
        message:
          'Your request contains inappropriate content that violates our policy and cannot be processed. Our prompt generator is only for business use cases.',
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
                    'Would someone working in a business, professional, or educational setting reasonably search for and use this prompt? Set to true only if the prompt is clearly business, workplace, educational, or professional (not personal, games, hobbies, entertainment, religion, politics, dating, lifestyle, or creative roleplay); written in English with a professional tone; contains no PII, product promotions, or political/religious agendas; and avoids unsafe or inappropriate content (adult, scams, gambling, hacking, fake documents, redeem/coupon codes, violence, drugs, or illegal activity). Otherwise, it is false.',
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
      let notIndexReason = null

      // Check if the response data contains any forbidden words
      if (responseData) {
        // Convert the entire responseData object to a string for checking
        const jsonString = JSON.stringify(responseData)

        // Check if any forbidden words are in the JSON string
        if (containsForbiddenWords(jsonString)) {
          responseData.should_index = false
          notIndexReason = 'response_forbidden_content'
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
        notIndexReason = notIndexReason || 'duplicate_slug'
      }

      // Double-check should_index with GPT-4o-mini if it's currently set to true
      if (responseData.should_index) {
        try {
          // Function to verify if content should be indexed using GPT-4o-mini
          const verifyContentShouldBeIndexed = async (content) => {
            const VERIFICATION_PROMPT = `
You are a content moderator tasked with determining if the following prompt should be publicly indexed in a professional prompt library.  

The guiding principle is:  
Would someone working in a business, professional, or educational setting reasonably search for and use this prompt?  
- If yes → shouldIndex = true.  
- If no → shouldIndex = false.  

A prompt is **shouldIndex = true** only if it meets ALL of the following criteria:  

### 1. Business/Professional Relevance  
- Must be clearly useful in a business, workplace, educational, or professional context.  
- Acceptable categories include:  
  - Customer support, help desks, FAQs, ticket deflection.  
  - Internal knowledge access (HR, onboarding, sales, operations, training).  
  - Research over technical, academic, or regulatory documentation.  
  - Business communication, management, productivity, planning, reporting, analysis.  
  - Professional writing (emails, reports, proposals, policies, training material).  
- Prompts primarily about personal life, games, hobbies, entertainment, religion, politics, dating, lifestyle, or creative roleplay are **shouldIndex = false**.  

### 2. Language & Professionalism  
- Must be in English.  
- Must use professional or educational tone (not memes, slang, or casual roleplay).  

### 3. Privacy & Neutrality  
- Must NOT contain Personally Identifiable Information (PII) such as names, phone numbers, emails, addresses, or IDs.  
- Must NOT promote or advertise a specific product, service, or company.  
- Must NOT promote religious, spiritual, or political agendas.  

### 4. Safety & Appropriateness  
- Must NOT be offensive, unsafe, or inappropriate.  
- Must NOT involve adult, NSFW, or romantic content of any kind (sex, nudity, fetishes, chastity, dating, erotic roleplay).  
- Must NOT involve scams, vouchers, coupons, codes, cracks, or exploits.  
- Must NOT involve gambling, betting, lotteries, or speculative trading.  
- Must NOT involve hacking, cheats, or system exploits.  
- Must NOT involve generating fake or fraudulent documents (IDs, invoices, receipts, credentials, statements).  
- Must NOT involve criminal, violent, or illegal activities in any jurisdiction, including weapons, drugs, or self-harm.  

---

### Classification  
- If the content meets all criteria and would appeal to a professional/business/educational user → classify as **shouldIndex = true**.  
- If the content fails any criterion or is not clearly business/professional → classify as **shouldIndex = false**.  
`.trim()

            const verification = await openai.chat.completions.create({
              model: 'gpt-5-nano',
              messages: [
                { role: 'system', content: VERIFICATION_PROMPT },
                { role: 'user', content: `Prompt content to evaluate:
                  ${JSON.stringify({
                    name: content.name,
                    short_description: content.short_description,
                    prompt: content.prompt,
                    tags: content.tags,
                  })}` },
              ],
              store: true,
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'classification',
                  description: 'Classifies the content',
                  strict: true,
                  schema: {
                    type: 'object',
                    properties: {
                      shouldIndex: {
                        type: 'boolean',
                        description:
                          'True ONLY if the prompt content meets ALL criteria for indexing, otherwise false',
                      },
                    },
                    required: ['shouldIndex'],
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
          if (!shouldBeIndexed) {
            notIndexReason = notIndexReason || 'verification_result_false'
          }
        } catch (verificationError) {
          console.error('Error during content verification:', verificationError)
          // If verification fails, err on the side of caution and set should_index to false
          responseData.should_index = false
          notIndexReason = notIndexReason || 'verification_error'
        }
      }

      // Save prompt to database
      await addPrompt(ip, 'prompt', responseData, newId)

      responseData.slug = newId

      await phTrack(
        distinctId,
        responseData.should_index ? 'Prompt Indexed' : 'Prompt Not Indexed',
        {
          slug: newId,
          name: responseData.name,
          category: responseData.category,
          should_index: responseData.should_index,
          ...(responseData.tags && { tags: responseData.tags }),
          ...(responseData.should_index
            ? {}
            : { reason: notIndexReason || 'model_decision' }),
        },
      )

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
