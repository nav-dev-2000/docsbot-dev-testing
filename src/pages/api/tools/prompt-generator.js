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
    const blockedCountries = new Set(['IN', 'PK', 'BD', 'LK'])
    const countryHeader = req.headers['cf-ipcountry']
    const countryCode = Array.isArray(countryHeader)
      ? countryHeader[0]?.toUpperCase()
      : typeof countryHeader === 'string'
        ? countryHeader.toUpperCase()
        : undefined
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

    if (countryCode && blockedCountries.has(countryCode)) {
      await phTrack(distinctId, 'Prompt Blocked', {
        reason: 'region_restriction',
        tool: 'prompt-generator',
        country: countryCode,
      })

      return res.status(403).json({
        message: `The prompt generator is not available in your country.`,
      })
    }

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
  'chastity','cheat','cheater','cheats','chicken road','chink','cinema','clit','clitoris','cock','cockblock','cocklicker','cocklover',
  'cockrider','cocksucker','cocksucking','cocktease','code generator','color prediction','condom','coon',
  'coitus','coupon','crypto','cuckold','cuckolded','cum','cumbubble','cumfest','cumjockey','cumquat','cumming',
  'cumshot','cumshots','cunnilingus','darkie','dago','debit card generator','deepthroat','dildo','discount code',
  'doggiestyle','doggystyle','downloader','dyke','erotic','erection','escort','fake','fag','faggot','facial','fellatio','femboy','femdom',
  'fetish','fingerfuck','fister','fisting','flipkart','fuck','fuckable','fucked','fucker','fuckface','fucking','futa',
  'futanari','gangbang','gift card','girlfriend','girlfriends','gook','hack','hacking','handjob','hardon','hentai',
  'honkey','hooker','incest','indian','instant loan','intercourse','jackoff','jackpot','jerkoff','jigaboo','jizz',
  'kamasutra','kalyan','kike','kink','lesbian','lesbo','loan approval','livesex','lottery','lucky draw','ludo',
  'masturbate','masturbation','mating','milf','mines','mulatto','muff','naked','nigger','nude','nymph','onlyfans',
  'oral sex','orgasm','orgy','otp','otpcode','pan card','passport','pawan','pawan kalyan','payPal free','phone sex','playboy',
  'porn','pornhub','porno','pornography','predictions','prediction','pregnant','prostitute','promo code','pussy',
  'quatex','quotex','raghead','receipt','redeem','redemption','redtube','rimjob','roblox','robux','roleplay','rolex','roulette','rummy',
  'scam','screenshot','seed phrase','semen','sexed','sexing','sext','sexting','sextoy','sexual','sexually','sexy','slut',
  'slot machine','son','spank','spanked','spanking','spic','spin','spanking','stake','sugar baby','sugar daddy',
  'tits','tit','titfuck','titjob','tiranga','titty','titties','tittyfuck','tittyfucker','teen patti',
  'threesome','titfuck','twat','uncensor','uncensored','upskirt','usdt','vibrator','venmo free','virginbreaker','voucher','wank',
  'wanker','webcam','wetback','white trash','wigger','wop','xhamster','xnxx','xvideos','xxx','youporn',
  'zipperhead','asmr','aunty','BDSM','airdrop','ada','bnb','binance','binance free','bitcoin','btc','cardano','claim tokens','coinbase free',
  'crypto faucet','crypto giveaway','dai','defi','dex','doge','dogecoin','daughter','eth','ethereum','father','free bitcoin','gainzalgo',
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

    // Hard-block patterns that correlate strongly with sketchy / irrelevant traffic.
    // Keep this conservative: false positives cost less than brand damage here.
    const SKETCHY_REGEXES = [
      /\b(delta|executor)\b/i,
      /\bkey\b.{0,40}\b(generator|gen|maker)\b/i,
      /\b(payment|transaction|balance)\b.{0,40}\bscreenshot\b/i,
      /\b(gpay|fampay|paytm|phonepe)\b/i,
      /\b(roblox|robux|free\s*fire|bgmi|blox\s*fruits)\b/i,
      /\b(betting|casino|roulette|lottery|trading\s*signals?|0\s*dte|binary\s*options?)\b/i,
      /\b(fake|forged)\b.{0,60}\b(receipt|invoice|statement|id|certificate)\b/i,
      /\b(crack|serial|license\s*key)\b/i,
    ]

    const normalizeText = (s) => (s || '').toString().toLowerCase()

    // Check the input for forbidden content before calling OpenAI
    const inputLower = (input || '').toString().toLowerCase()
    const inputIsSketchy = containsForbiddenWords(inputLower) || SKETCHY_REGEXES.some((re) => re.test(inputLower))

    if (inputIsSketchy) {
      await phTrack(distinctId, 'Prompt Blocked', {
        reason: 'forbidden_input',
        tool: 'prompt-generator',
      })
      return res.status(400).json({
        message:
          'Your request contains inappropriate content that violates our policy and cannot be processed. Our prompt generator is only for business use cases.',
      })
    }

    const openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY_TOOLS'],
    })

    // Early duplicate detection: embed user input and check cosine similarity against existing prompts
    try {
      console.log('[prompt-generator] duplicate check: embedding input')
      const inputEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: input.slice(0, 8000),
        dimensions: 512,
      })
      const inputEmbedding = inputEmbeddingResponse.data?.[0]?.embedding

      if (Array.isArray(inputEmbedding) && inputEmbedding.length > 0) {
        const DUPLICATE_DISTANCE_THRESHOLD = 0.25

        const dupQuery = firestore
          .collection('prompts')
          .findNearest({
            vectorField: 'embedding_512',
            queryVector: FieldValue.vector(inputEmbedding),
            limit: 5,
            distanceMeasure: 'COSINE',
            distanceThreshold: 0.25,
            distanceResultField: 'vector_distance',
          })

        const dupSnapshot = await dupQuery.get()

        if (!dupSnapshot.empty) {
          const candidates = dupSnapshot.docs.map((doc) => ({
            slug: doc.id,
            name: doc.data().name,
            distance: doc.data().vector_distance,
            cosineSimilarity: doc.data().vector_distance != null ? 1 - doc.data().vector_distance : null,
          }))
          console.log('[prompt-generator] duplicate check: nearest candidates', candidates)

          const match = dupSnapshot.docs[0]
          const matchDistance = match.data().vector_distance

          if (matchDistance != null && matchDistance <= DUPLICATE_DISTANCE_THRESHOLD) {
            const matchData = match.data()
            const matchSlug = match.id
            const matchCategory = matchData.category

            console.log('[prompt-generator] duplicate check: redirecting to existing prompt', {
              matchSlug,
              matchCategory,
              distance: matchDistance,
              cosineSimilarity: 1 - matchDistance,
            })

            await phTrack(distinctId, 'Prompt Duplicate Redirect', {
              tool: 'prompt-generator',
              matchSlug,
              matchCategory,
              distance: matchDistance,
            })

            return res.status(200).json({
              slug: matchSlug,
              category: matchCategory,
              duplicate: true,
              name: matchData.name,
              short_description: matchData.short_description,
            })
          } else {
            console.log('[prompt-generator] duplicate check: closest match below threshold', {
              slug: match.id,
              name: match.data().name,
              distance: matchDistance,
              cosineSimilarity: matchDistance != null ? 1 - matchDistance : null,
              requiredDistance: DUPLICATE_DISTANCE_THRESHOLD,
            })
          }
        } else {
          console.log('[prompt-generator] duplicate check: no matches within search range')
        }
      } else {
        console.log('[prompt-generator] duplicate check: embedding failed, skipping')
      }
    } catch (dupErr) {
      console.error('[prompt-generator] duplicate check failed:', dupErr)
    }

    try {

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
                should_index: {
                  type: 'boolean',
                  description:
                    'True ONLY if useful in business/professional/educational contexts, professional English tone, no PII/NSFW/scams/gambling/exploits. Otherwise false.',
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
              },
              required: [
                'prompt',
                'should_index',
                'name',
                'short_description',
                'icon',
                'category',
                'tags',
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
      const firstPassShouldIndex = responseData?.should_index === true

      console.log('[prompt-generator] index: first model', {
        should_index: responseData?.should_index,
        name: responseData?.name,
      })

      // Check if the response data contains any forbidden words
      if (responseData) {
        // Convert the entire responseData object to a string for checking
        const jsonString = JSON.stringify(responseData)

        // Check if any forbidden words are in the JSON string
        if (containsForbiddenWords(jsonString)) {
          responseData.should_index = false
          notIndexReason = 'response_forbidden_content'
          console.log('[prompt-generator] index: NOT indexed — response_forbidden_content')
        }
      }

      if (responseData) {
        const combined = [
          responseData?.name,
          responseData?.short_description,
          responseData?.prompt,
          Array.isArray(responseData?.tags) ? responseData.tags.join(' ') : '',
        ].join('\n')
        const normalized = normalizeText(combined)

        if (containsForbiddenWords(normalized)) {
          responseData.should_index = false
          notIndexReason = notIndexReason || 'forbidden_words'
          console.log('[prompt-generator] index: NOT indexed — forbidden_words in name/description/prompt/tags')
        }
        for (const re of SKETCHY_REGEXES) {
          if (re.test(normalized)) {
            responseData.should_index = false
            notIndexReason = notIndexReason || 'sketchy_pattern'
            console.log('[prompt-generator] index: NOT indexed — sketchy_pattern matched')
            break
          }
        }
      }

      if (typeof responseData?.should_index !== 'boolean') {
        responseData.should_index = false
        notIndexReason = notIndexReason || 'model_missing_should_index'
        console.log('[prompt-generator] index: NOT indexed — model_missing_should_index')
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
        console.log('[prompt-generator] index: NOT indexed — duplicate_slug', { slug })
      }

      if (!firstPassShouldIndex || !responseData.should_index) {
        console.log('[prompt-generator] index: classifier skipped', {
          firstPassShouldIndex,
          should_index: responseData.should_index,
          notIndexReason,
        })
      }

      // Double-check should_index with a stronger model only when the first pass opted in.
      if (firstPassShouldIndex && responseData.should_index) {
        console.log('[prompt-generator] Running classifier (first pass opted in)')
        try {
          // Create embedding early for semantic search (reused later if indexing)
          let queryEmbedding = null
          try {
            if (
              typeof responseData?.name === 'string' &&
              typeof responseData?.short_description === 'string'
            ) {
              const embeddingInput = `${responseData.name} — ${responseData.short_description}`
              const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: embeddingInput,
                dimensions: 512,
              })
              queryEmbedding =
                embeddingResponse.data?.[0]?.embedding || null
            }
          } catch (embedErr) {
            console.error('Embedding for semantic search failed:', embedErr)
          }

          // Firestore semantic search: find 5 closest existing prompts to avoid duplicates
          let similarPromptsXml = ''
          if (Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
            try {
              const nearestQuery = firestore
                .collection('prompts')
                .findNearest(
                  'embedding_512',
                  FieldValue.vector(queryEmbedding),
                  {
                    limit: 5,
                    distanceMeasure: 'COSINE',
                  },
                )
              const nearestSnapshot = await nearestQuery.get()
              const similarPrompts =
                nearestSnapshot?.docs?.map((doc) => {
                  const d = doc.data()
                  return {
                    name: d.name || '',
                    short_description: d.short_description || '',
                  }
                }) || []
              console.log('[prompt-generator] semantic search results', {
                query: `${responseData.name} — ${responseData.short_description}`,
                count: similarPrompts.length,
                similarPrompts,
              })
              if (similarPrompts.length > 0) {
                similarPromptsXml = `
<similar_existing_prompts>
The following prompts are already in the library (closest semantic matches). Do NOT index if the new prompt is too similar to any of these—avoid duplicates.
${similarPrompts
  .map(
    (p, i) =>
      `  <prompt rank="${i + 1}">
    <name>${(p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
    <description>${(p.short_description || '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</description>
  </prompt>`,
  )
  .join('\n')}
</similar_existing_prompts>`
              }
            } catch (searchErr) {
              console.error('[prompt-generator] Firestore semantic search failed:', searchErr)
            }
          } else {
            console.log('[prompt-generator] semantic search: skipped (no embedding or empty results)')
          }

          // Function to verify if content should be indexed using a stronger verifier model
          const verifyContentShouldBeIndexed = async (content) => {
            const VERIFICATION_PROMPT = `
You are a content moderator tasked with determining if the following prompt should be publicly indexed in a professional prompt library.

Return a strict JSON classification with:
- shouldIndex: boolean
- reason: enum string (see below)
- confidence: number 0..1

Guiding principle:
Would someone working in a business, professional, or educational setting reasonably search for and use this prompt?
- If yes → shouldIndex = true.
- If no → shouldIndex = false.

Hard disallowed examples (always shouldIndex=false):
- Key generators, executors, unlocks, cracks (e.g. "delta executor key generator", "executor key", "keygen")
- "payment/transaction failure screenshot" style prompts (e.g. gpay/fampay transaction screenshot)
- Trading signals, pocket option, betting/gambling

A prompt is shouldIndex=true only if it meets ALL criteria:

1) Business/Professional relevance
- Clearly useful in workplace/education contexts (support, internal knowledge/HR, docs, research, business writing).
- Personal life, games, hobbies, entertainment, dating, or roleplay → false.

2) Language & professionalism
- Must be English.
- Must be professional/educational tone.

3) Privacy & neutrality
- No PII.
- Not promoting a specific product/company.
- No political/religious agendas.

4) Safety & appropriateness
- No NSFW/romantic content.
- No scams/codes/cracks/exploits.
- No gambling/betting/lotteries/speculative trading/options trading/cryptocurrency.
- No hacking/cheats/system exploits.
- No fake/fraudulent documents/screenshots (IDs, invoices, receipts, statements).
- No illegal activity (weapons, drugs, self-harm, etc.).

5) Duplicate check (CRITICAL — apply strictly):
- If similar_existing_prompts are provided below, compare the new prompt to each one.
- Reject (shouldIndex=false, reason=duplicate_too_similar) if the new prompt:
  - Serves the same core purpose or use case as any existing prompt.
  - Covers substantially overlapping scope (e.g. both are "email writing" or "code review").
  - Is a minor variation (different wording, slightly different angle) of an existing prompt.
  - Would be redundant for a user who already has the existing prompt.
- Only index if the new prompt adds clearly distinct value: a different domain, a meaningfully different workflow, or a genuinely novel angle not covered by any existing prompt.
- When in doubt, reject. Prefer a smaller, non-redundant library over near-duplicates for SEO strength.
${similarPromptsXml}

Reason enum (pick the best single reason):
- professional_ok
- duplicate_too_similar
- non_professional
- non_english
- contains_pii
- scam_or_keygen
- gambling_or_trading
- hacking_or_exploit
- fraudulent_document
- nsfw_or_romance
- political_or_religious
- other
`.trim()

            const userContent = `Prompt content to evaluate:
                  ${JSON.stringify({
                    name: content.name,
                    short_description: content.short_description,
                    prompt: content.prompt,
                    tags: content.tags,
                  })}`

            console.log('[prompt-generator] classify prompt (full):', {
              systemPrompt: VERIFICATION_PROMPT,
              userContent,
            })

            const verification = await openai.chat.completions.create({
              model: 'gpt-5-mini',
              reasoning_effort: 'medium',
              messages: [
                { role: 'system', content: VERIFICATION_PROMPT },
                { role: 'user', content: userContent },
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
                      reason: {
                        type: 'string',
                        enum: [
                          'professional_ok',
                          'duplicate_too_similar',
                          'non_professional',
                          'non_english',
                          'contains_pii',
                          'scam_or_keygen',
                          'gambling_or_trading',
                          'hacking_or_exploit',
                          'fraudulent_document',
                          'nsfw_or_romance',
                          'political_or_religious',
                          'other',
                        ],
                        description:
                          'Primary reason for the decision. Use professional_ok only when shouldIndex=true.',
                      },
                      confidence: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Confidence in the classification, 0..1',
                      },
                    },
                    required: ['shouldIndex', 'reason', 'confidence'],
                    additionalProperties: false,
                  },
                },
              },
            })

            try {
              const parsedResponse = JSON.parse(
                verification.choices[0]?.message?.content ||
                  '{"shouldIndex":false,"reason":"other","confidence":0}',
              )

              return {
                shouldIndex: parsedResponse.shouldIndex === true,
                reason: parsedResponse.reason || 'other',
                confidence:
                  typeof parsedResponse.confidence === 'number'
                    ? parsedResponse.confidence
                    : 0,
              }
            } catch (parseError) {
              console.error('Error parsing verification response:', parseError)
              return { shouldIndex: false, reason: 'other', confidence: 0 }
            }
          }

          // Verify if the content should be indexed
          const verificationResult =
            await verifyContentShouldBeIndexed(responseData)

          console.log('[prompt-generator] Classifier output:', verificationResult)

          // Override should_index based on the verification result
          responseData.should_index = verificationResult?.shouldIndex === true
          if (!responseData.should_index) {
            notIndexReason =
              notIndexReason ||
              (verificationResult?.reason
                ? `verification_${verificationResult.reason}`
                : 'verification_result_false')
            console.log('[prompt-generator] index: NOT indexed — classifier rejected', {
              reason: verificationResult?.reason,
              confidence: verificationResult?.confidence,
            })
          } else {
            console.log('[prompt-generator] index: classifier approved', {
              reason: verificationResult?.reason,
              confidence: verificationResult?.confidence,
            })
          }
          if (responseData.should_index && Array.isArray(queryEmbedding)) {
            // Reuse embedding for save (avoid second API call)
            responseData._queryEmbedding = queryEmbedding
          }
        } catch (verificationError) {
          console.error('[prompt-generator] index: verification_error', verificationError)
          // If verification fails, err on the side of caution and set should_index to false
          responseData.should_index = false
          notIndexReason = notIndexReason || 'verification_error'
        }
      }

      if (!responseData.should_index && !notIndexReason) {
        notIndexReason = firstPassShouldIndex
          ? 'model_overridden_false'
          : 'model_first_pass_false'
        console.log('[prompt-generator] index: NOT indexed — fallback reason', {
          notIndexReason,
        })
      }

      if (!responseData.should_index) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + 60)
        responseData.expires_at = expirationDate.toISOString()
        responseData.should_index_reason = notIndexReason
      }

      if (responseData.should_index) {
        try {
          if (
            typeof responseData?.name !== 'string' ||
            typeof responseData?.short_description !== 'string'
          ) {
            throw new Error('Missing name or short_description for embedding')
          }
          // Reuse embedding from classifier semantic search if available
          if (Array.isArray(responseData._queryEmbedding)) {
            responseData.embedding_512 = responseData._queryEmbedding
            delete responseData._queryEmbedding
          } else {
            const embeddingInput = `${responseData.name} — ${responseData.short_description}`
            const embeddingResponse = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: embeddingInput,
              dimensions: 512,
            })
            responseData.embedding_512 =
              embeddingResponse.data?.[0]?.embedding || null
          }
          if (!Array.isArray(responseData.embedding_512)) {
            throw new Error('Invalid embedding response')
          }
        } catch (embeddingError) {
          console.error('[prompt-generator] index: NOT indexed — embedding_error', embeddingError)
          responseData.should_index = false
          notIndexReason = notIndexReason || 'embedding_error'
          const expirationDate = new Date()
          expirationDate.setDate(expirationDate.getDate() + 60)
          responseData.expires_at = expirationDate.toISOString()
          responseData.should_index_reason = notIndexReason
          responseData.embedding_512 = null
        }
      }

      // Save prompt to database
      await addPrompt(ip, 'prompt', responseData, newId)

      responseData.slug = newId

      console.log('[prompt-generator] index: final decision', {
        should_index: responseData.should_index,
        slug: newId,
        notIndexReason: responseData.should_index ? null : (notIndexReason || responseData.should_index_reason),
      })

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
            : {
                reason:
                  responseData.should_index_reason ||
                  notIndexReason ||
                  'model_decision',
              }),
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
