#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const { INDUSTRIES } = require('../src/constants/industries.constants')

const DEFAULT_MODEL = 'gpt-5.5'
const DEFAULT_CONCURRENCY = 3
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'src/data/industries/v2')
const DOCSBOT_CONTEXT_PATH = path.join(DEFAULT_OUT_DIR, 'docsbot-context.md')
const REVIEWS_PATH = path.join(DEFAULT_OUT_DIR, 'reviews.json')
const SCHEMA_PATH = path.join(DEFAULT_OUT_DIR, 'schema.json')
const DEFAULT_REASONING_EFFORT = 'low'
const DEFAULT_SERVICE_TIER = 'flex'
const OPENAI_REQUEST_TIMEOUT_MS = 30 * 60 * 1000
const FLEX_RETRY_DELAY_MS = 60 * 1000
const FLEX_RETRY_LOG_INTERVAL_MS = 10 * 60 * 1000
const FALLBACK_BACKGROUND_IMAGE = '/og-main.png'
const MODEL_PRICING_USD = {
  'gpt-5.5': {
    inputPer1M: 5,
    cachedInputPer1M: 0.5,
    outputPer1M: 30,
    webSearchPer1K: 10,
  },
}

const SYSTEM_PROMPT_PARTS = [
  'Generate structured content for DocsBot industry landing pages.',
  'Ground every recommendation, use case, workflow, and product claim in the provided DocsBot context. Do not invent DocsBot product capabilities.',
  'DocsBot product truth comes only from docsbotContextMarkdown, reviews, and provided local trust/case-study data.',
  'Do not use web search for DocsBot product context, DocsBot features, DocsBot claims, DocsBot reviews, trust signals, case studies, or DocsBot documentation.',
  'Use web search only for external evidence: market trends, support or operations pain points, regulations, buyer behavior, labor/time/cost data, and quantifiable statistics.',
  'Prefer authoritative external sources: government, trade associations, academic institutions, analyst firms, reputable industry publications, and primary reports.',
  'Every external evidence source must include a source title and a real source URL. Do not invent statistics, URLs, sources, integrations, certifications, or customer proof.',
  'Position pages around AI agents, AI support agents, internal knowledge agents, live context, and workflow automation. Chat may be mentioned only where the chat widget or chat interface is specifically relevant.',
  'DocsBot AI Actions can be described as customer-configured live lookups, routing, summaries, record creation, record updates, workflow triggers, and handoffs through Skills, APIs, connectors, or review workflows.',
  'Mention review, permissions, or boundaries only when needed to answer realistic buyer objections about sensitive, regulated, financial, medical, legal, identity, or high-impact workflows.',
  'Avoid repetitive phrases such as "revolutionize", "transform your business", "cutting-edge", and "AI chatbots for".',
  'The H1, meta title, meta description, section headlines, and CTAs must be bespoke to the industry while staying inside the schema constraints. Do not use a fixed title template.',
  'Select reviews only from the provided review enum. Return only JSON matching the strict schema.',
]

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function roundUsd(value) {
  return Math.round((Number(value) || 0) * 1_000_000) / 1_000_000
}

function getNestedNumber(value, pathParts) {
  let current = value
  for (const part of pathParts) {
    if (!current || typeof current !== 'object') return 0
    current = current[part]
  }
  return Number(current) || 0
}

function countResponseItemsByType(value, type) {
  if (!value || typeof value !== 'object') return 0
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countResponseItemsByType(item, type), 0)
  }
  let count = value.type === type ? 1 : 0
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') count += countResponseItemsByType(child, type)
  }
  return count
}

function getModelPricing(model) {
  return MODEL_PRICING_USD[model] || MODEL_PRICING_USD[DEFAULT_MODEL]
}

function getServiceTierPricing(pricing, serviceTier = DEFAULT_SERVICE_TIER) {
  if (serviceTier === 'flex') {
    return {
      ...pricing,
      inputPer1M: pricing.inputPer1M / 2,
      cachedInputPer1M: pricing.cachedInputPer1M / 2,
      outputPer1M: pricing.outputPer1M / 2,
    }
  }
  return pricing
}

function calculateApiUsageCost({ model, response, attempt, step = 'main-content', serviceTier = DEFAULT_SERVICE_TIER }) {
  const pricing = getServiceTierPricing(getModelPricing(model), serviceTier)
  const usage = response?.usage || {}
  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens) || 0
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens) || 0
  const totalTokens = Number(usage.total_tokens) || inputTokens + outputTokens
  const cachedInputTokens =
    getNestedNumber(usage, ['input_tokens_details', 'cached_tokens']) ||
    getNestedNumber(usage, ['prompt_tokens_details', 'cached_tokens'])
  const reasoningOutputTokens =
    getNestedNumber(usage, ['output_tokens_details', 'reasoning_tokens']) ||
    getNestedNumber(usage, ['completion_tokens_details', 'reasoning_tokens'])
  const billableInputTokens = Math.max(inputTokens - cachedInputTokens, 0)
  const webSearchCalls = countResponseItemsByType(response?.output || [], 'web_search_call')
  const estimatedTokenCostUsd = roundUsd(
    (billableInputTokens * pricing.inputPer1M) / 1_000_000 +
      (cachedInputTokens * pricing.cachedInputPer1M) / 1_000_000 +
      (outputTokens * pricing.outputPer1M) / 1_000_000,
  )
  const estimatedWebSearchCostUsd = roundUsd((webSearchCalls * pricing.webSearchPer1K) / 1000)
  const estimatedTotalCostUsd = roundUsd(estimatedTokenCostUsd + estimatedWebSearchCostUsd)

  return {
    step,
    attempt,
    model,
    serviceTier,
    reasoningEffort: DEFAULT_REASONING_EFFORT,
    inputTokens,
    cachedInputTokens,
    billableInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens,
    webSearchCalls,
    estimatedTokenCostUsd,
    estimatedWebSearchCostUsd,
    estimatedTotalCostUsd,
  }
}

function aggregateApiUsage(attempts = []) {
  const total = attempts.reduce(
    (sum, item) => {
      sum.inputTokens += item.inputTokens || 0
      sum.cachedInputTokens += item.cachedInputTokens || 0
      sum.billableInputTokens += item.billableInputTokens || 0
      sum.outputTokens += item.outputTokens || 0
      sum.reasoningOutputTokens += item.reasoningOutputTokens || 0
      sum.totalTokens += item.totalTokens || 0
      sum.webSearchCalls += item.webSearchCalls || 0
      sum.estimatedTokenCostUsd += item.estimatedTokenCostUsd || 0
      sum.estimatedWebSearchCostUsd += item.estimatedWebSearchCostUsd || 0
      sum.estimatedTotalCostUsd += item.estimatedTotalCostUsd || 0
      return sum
    },
    {
      inputTokens: 0,
      cachedInputTokens: 0,
      billableInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0,
      webSearchCalls: 0,
      estimatedTokenCostUsd: 0,
      estimatedWebSearchCostUsd: 0,
      estimatedTotalCostUsd: 0,
    },
  )

  total.estimatedTokenCostUsd = roundUsd(total.estimatedTokenCostUsd)
  total.estimatedWebSearchCostUsd = roundUsd(total.estimatedWebSearchCostUsd)
  total.estimatedTotalCostUsd = roundUsd(total.estimatedTotalCostUsd)
  return { total, attempts }
}

function buildModelCompatibleSchema(schema) {
  const cloned = JSON.parse(JSON.stringify(schema))
  requireAllObjectProperties(cloned)
  const generationMeta = cloned.properties?.generationMeta
  if (generationMeta?.properties?.apiUsage) {
    delete generationMeta.properties.apiUsage
    generationMeta.required = (generationMeta.required || []).filter((field) => field !== 'apiUsage')
  }
  generationMeta.required = generationMeta.required || []
  if (!generationMeta.required.includes('warnings')) {
    generationMeta.required.push('warnings')
  }
  generationMeta.properties.warnings = {
    type: 'array',
    maxItems: 8,
    items: {
      type: 'string',
      minLength: 3,
      description: 'Suggested maximum: about 220 characters; use natural complete phrasing over hard truncation.',
    },
  }
  return cloned
}

function requireAllObjectProperties(node) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'object' && node.properties && node.additionalProperties === false) {
    node.required = Object.keys(node.properties)
  }
  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) value.forEach(requireAllObjectProperties)
    else requireAllObjectProperties(value)
  })
}

function omitTopLevelSchemaFields(schema, fields = []) {
  const cloned = JSON.parse(JSON.stringify(schema))
  fields.forEach((field) => {
    delete cloned.properties[field]
    cloned.required = (cloned.required || []).filter((item) => item !== field)
  })
  return cloned
}

function buildMainContentOutputSchema(schema) {
  return buildModelCompatibleSchema(omitTopLevelSchemaFields(schema, ['backgroundImage', 'faq', 'buyerFaqResearch']))
}

function buildFaqOutputSchema(schema) {
  const additionalEvidenceSources = JSON.parse(JSON.stringify(schema.properties.evidenceSources))
  additionalEvidenceSources.minItems = 0
  additionalEvidenceSources.maxItems = 6
  additionalEvidenceSources.description =
    'New authoritative external sources discovered during FAQ research. Return an empty array when existing industryPageJson.evidenceSources are sufficient.'

  const outputSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['faq', 'additionalEvidenceSources'],
    properties: {
      faq: JSON.parse(JSON.stringify(schema.properties.faq)),
      additionalEvidenceSources,
    },
    $defs: JSON.parse(JSON.stringify(schema.$defs)),
  }
  requireAllObjectProperties(outputSchema)
  return outputSchema
}

function buildOpenAiOutputSchema(schema) {
  return buildModelCompatibleSchema(schema)
}

function loadLocalEnv(files = ['.env.local', '.env']) {
  files.forEach((file) => {
    const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file)
    if (!fs.existsSync(filePath)) return

    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
        if (!match) return
        const [, key, rawValue] = match
        if (process.env[key] !== undefined) return
        process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '')
      })
  })
}

function slugify(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/@/g, ' at ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase()
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    all: false,
    only: [],
    limit: null,
    offset: 0,
    concurrency: DEFAULT_CONCURRENCY,
    dryRun: false,
    write: false,
    force: false,
    missing: false,
    printPrompt: false,
    model: DEFAULT_MODEL,
    outDir: DEFAULT_OUT_DIR,
    openaiClient: null,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]
    const readValue = () => {
      if (arg.includes('=')) return arg.split('=').slice(1).join('=')
      i += 1
      return next
    }

    if (arg === '--all') args.all = true
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--write') args.write = true
    else if (arg === '--force') args.force = true
    else if (arg === '--missing') args.missing = true
    else if (arg === '--print-prompt') args.printPrompt = true
    else if (arg.startsWith('--only')) {
      args.only = String(readValue() || '')
        .split(',')
        .map((value) => slugify(value))
        .filter(Boolean)
    } else if (arg.startsWith('--limit')) {
      args.limit = Number(readValue())
    } else if (arg.startsWith('--offset')) {
      args.offset = Number(readValue()) || 0
    } else if (arg.startsWith('--concurrency') || arg.startsWith('--parallel') || arg.startsWith('--api-concurrency')) {
      args.concurrency = parsePositiveInteger(readValue(), DEFAULT_CONCURRENCY)
    } else if (arg.startsWith('--model')) {
      args.model = readValue() || DEFAULT_MODEL
    } else if (arg.startsWith('--out-dir')) {
      args.outDir = path.resolve(readValue() || DEFAULT_OUT_DIR)
    }
  }

  if (!args.write) args.dryRun = true
  return args
}

function readJsonFile(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function readJsonFileStrict(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(data, null, 2)}\n`)
  fs.renameSync(`${filePath}.tmp`, filePath)
}

function getSchemaPath(outDir = DEFAULT_OUT_DIR) {
  return path.join(outDir, 'schema.json')
}

function getReviewsPath(outDir = DEFAULT_OUT_DIR) {
  return path.join(outDir, 'reviews.json')
}

function getDocsBotContextPath(outDir = DEFAULT_OUT_DIR) {
  return path.join(outDir, 'docsbot-context.md')
}

function getGeneratedDir(outDir = DEFAULT_OUT_DIR) {
  return path.join(outDir, 'generated')
}

function getGeneratedFilePath(slug, outDir = DEFAULT_OUT_DIR) {
  return path.join(getGeneratedDir(outDir), `${slug}.json`)
}

function getIndexPath(outDir = DEFAULT_OUT_DIR) {
  return path.join(outDir, 'generated.index.json')
}

function loadSchema(outDir = DEFAULT_OUT_DIR) {
  return readJsonFileStrict(getSchemaPath(outDir))
}

function loadDocsBotContext(outDir = DEFAULT_OUT_DIR) {
  const contextPath = getDocsBotContextPath(outDir)
  if (!fs.existsSync(contextPath)) {
    throw new Error(`Missing DocsBot context file: ${contextPath}`)
  }
  return fs.readFileSync(contextPath, 'utf8')
}

function loadReviewLibrary(outDir = DEFAULT_OUT_DIR) {
  const reviewsPath = getReviewsPath(outDir)
  const data = readJsonFileStrict(reviewsPath)
  const reviews = Array.isArray(data?.reviews) ? data.reviews : []
  if (!reviews.length) throw new Error(`reviews.json must include reviews[]`)
  return data
}

function selectIndustryRecords(records, args, options = {}) {
  let selected = records

  if (args.only.length) {
    const only = new Set(args.only)
    selected = selected.filter((record) => only.has(record.slug))
  } else if (!args.all) {
    selected = records
  }

  if (args.missing && !args.force && options.validationOptions) {
    selected = selected.filter((record) => !readValidGeneratedRecord(record.slug, options.validationOptions))
  }

  if (args.offset) selected = selected.slice(args.offset)
  if (Number.isFinite(args.limit) && args.limit > 0) selected = selected.slice(0, args.limit)

  return selected
}

function tokenize(value = '') {
  return new Set(
    String(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((part) => part.length > 2),
  )
}

function overlapScore(a, b) {
  const left = tokenize(a)
  const right = tokenize(b)
  let score = 0
  left.forEach((token) => {
    if (right.has(token)) score += 1
  })
  return score
}

function buildRelatedIndustryCandidates(record, allRecords = INDUSTRIES, max = 14) {
  const sameCategory = allRecords
    .filter((item) => item.slug !== record.slug && item.industry === record.industry)
    .map((item) => ({ ...item, score: 10 + overlapScore(record.business, item.business) }))
  const semantic = allRecords
    .filter((item) => item.slug !== record.slug && item.industry !== record.industry)
    .map((item) => ({ ...item, score: overlapScore(`${record.business} ${record.title}`, `${item.business} ${item.title}`) }))
    .filter((item) => item.score > 0)

  return [...sameCategory, ...semantic]
    .sort((a, b) => b.score - a.score || a.business.localeCompare(b.business))
    .slice(0, max)
    .map(({ slug, business, industry, title }) => ({ slug, business, industry, title }))
}

function buildIndustryPromptPayload(record, options) {
  return JSON.stringify(
    {
      industrySeed: {
        slug: record.slug,
        business: record.business,
        industryCategory: record.industry,
        existingTitle: record.title,
        existingIntro: record.mainContentIntro,
        existingSupportSection: record.supportSection,
        existingUsesSection: record.usesSection,
        currentUrl: `https://docsbot.ai/industry/${record.slug}`,
      },
      docsbotContextMarkdown: options.docsbotContext,
      docsbotCapabilityContext: [
        {
          capability: 'Customer support agents',
          useAsContext:
            'Use for website, product, or helpdesk experiences that answer customer/prospect questions from approved sources, learn from ticket history when connected, draft ticket responses, collect details, and escalate when needed.',
        },
        {
          capability: 'Helpdesk ticket intelligence',
          useAsContext:
            'Use for any industry with recurring support tickets. Agents can connect to helpdesk software through customer-configured Skills, APIs, connectors, exports, or workflows to learn from, summarize, route, answer, or draft responses to tickets.',
        },
        {
          capability: 'Presales agents and lead qualification',
          useAsContext:
            'Use for product questions, specification lookups, service fit, custom lead forms, AI qualification instructions, CRM/helpdesk forwarding, and handoffs to sales or support teams.',
        },
        {
          capability: 'Booking and scheduling flows',
          useAsContext:
            'Use when buyers need demos, estimates, consultations, inspections, appointments, or onboarding calls. Agents can collect scheduling intent and use approved scheduling workflows for Calendly, Cal.com, TidyCal, or similar tools when configured.',
        },
        {
          capability: 'Sales enablement agents',
          useAsContext:
            'Use for sales reps, account managers, SDRs, and founders who need prospect research, product/spec answers, CRM context, account summaries, objection handling, proposal support, and drafted emails or responses.',
        },
        {
          capability: 'Internal knowledge agents',
          useAsContext:
            'Use for employee, operations, sales, support, and field-team workflows that retrieve SOPs, policies, procedures, training, product knowledge, sales playbooks, and private company knowledge.',
        },
        {
          capability: 'Documentation and source-grounded answers',
          useAsContext:
            'Use when the industry has manuals, help docs, policies, care guides, product docs, service catalogs, compliance notes, or technical references.',
        },
        {
          capability: 'AI Actions, Skills, APIs, and connectors',
          useAsContext:
            'Use for live lookups, summaries, routing, ticket or task creation, record updates, workflow triggers, and handoffs through customer-configured actions. Mention MCP once where natural as a connectivity option for remote Model Context Protocol servers.',
        },
        {
          capability: 'Escalation and workflow boundaries',
          useAsContext:
            'Use sparingly for sensitive, regulated, financial, medical, legal, identity, safety, high-impact, pricing, contract, or diagnosis decisions where buyers will expect review paths or permission limits.',
        },
        {
          capability: 'Analytics, reporting, and knowledge gaps',
          useAsContext:
            'Use for identifying repeated questions, unanswered topics, content gaps, support trends, and opportunities to improve documentation.',
        },
        {
          capability: 'Widget, API, helpdesk, Slack, Teams, and multilingual deployment',
          useAsContext:
            'Use when explaining where an agent could appear or how teams can access it. Keep specific integrations grounded in DocsBot context.',
        },
        {
          capability: 'Security and governance',
          useAsContext:
            'Use for SOC 2, GDPR-ready governance, permissions, encryption, auditability, and private source handling where buyer trust matters.',
        },
      ],
      reviewEnum: options.reviewLibrary.reviews.map((review) => ({
        id: review.id,
        author: review.author,
        role: review.role,
        company: review.company,
        themes: review.themes,
        bestForIndustryCategories: review.bestForIndustryCategories,
        quote: review.quote,
      })),
      relatedIndustryCandidates: options.relatedIndustryCandidates,
      generationRequirements: [
        'Generate one complete JSON object for this industry only.',
        `The output slug must exactly remain "${record.slug}". Never rewrite, singularize, pluralize, translate, shorten, expand, or SEO-optimize existing slugs.`,
        `The canonicalPath must exactly remain "/industry/${record.slug}".`,
        'Use the existing industry object as a seed, but do not preserve its generic chatbot positioning.',
        'H1, meta title, meta description, section headlines, and CTAs must be dynamic and industry-specific. Do not use a fixed template.',
        'The hero must answer how and why DocsBot AI agents help this industry. hero.proofBullets are product/value bullets about what DocsBot agents can answer, retrieve, qualify, route, summarize, automate, or escalate for this industry.',
        'Do not use hero.proofBullets as industry-stat callouts or generic market facts. Keep external evidence for later sections, FAQs, and evidence-backed inline claims where it supports a specific point.',
        'Every use case must be grounded in the provided DocsBot context, docsbotCapabilityContext, and external industry evidence where relevant.',
        'Do not output taxonomy tags or featureTags. Use DocsBot capabilities as generation context for open-ended use-case, role, workflow, source, and outcome text.',
        'When a schema field asks for an icon, choose one contextually appropriate Heroicon name from the schema enum. Use icons as lightweight visual hints, not as a substitute for precise copy.',
        'Use presales and sales enablement capability context where it fits the industry, especially inside whoItHelps bullets, agentUseCases, customerFacingAgent, internalAgent, docsbotFeatureMapping, and FAQ. Do not force dedicated presales or sales enablement sections when the industry does not need them.',
        'For businessClarity.whoItHelps, write open-ended role content with concrete bullets rather than a simple role/pain/value list.',
        'Mention MCP or Model Context Protocol naturally in at least one output field for SEO, but use it sparingly and do not repeat it across many sections.',
        'Use web search for industry evidence and quantifiable data only. Do not use web search for DocsBot product claims.',
        'At least two agentUseCases should include plausible AI Actions, live context, or third-party tool-call opportunities. Do not over-focus on approvals; mention permissions or review only when the industry context makes it necessary.',
        'Build evidenceSources as a reusable source list for authoritative external data only. Do not write a generic industry research/status section.',
        'Every evidenceSources item must include a stable id, sourceTitle, and sourceUrl. Use ids such as src-landscaping-employment or src-safety-risk.',
        'Attach sourceIds only when the same visible content field includes the sourced statistic, quote, or concrete external claim. The source is not for where an idea came from; it is for backing an inline claim the reader can see.',
        'Bad citation: "Make PPE reminders and equipment checklists searchable" with an OSHA sourceId. Good citation: "OSHA lists equipment, heat, chemical, and driving hazards in landscaping work" with an OSHA sourceId.',
        'Bad citation: "Keep humans responsible for safety-critical judgments" with a fatalities sourceId. Good citation: "The Department of Labor reported 1,072 landscaping and groundskeeping fatalities from 2011-2021" with that sourceId.',
        'Leave sourceIds empty or omit them when the text is a DocsBot use case, recommendation, workflow idea, or product capability rather than an inline sourced claim.',
        'Avoid repetitive citations. A source should usually appear in only one or two highly relevant places, and not every section needs a citation.',
        'Select only review IDs from reviewEnum.',
        'For trustAndProof copy, write public proof language for the industry buyer. Do not explain why a review was selected, call it a relevant proof point, or use internal evaluation language such as "teams evaluating whether".',
        'Select only relatedIndustrySlugs from relatedIndustryCandidates.',
      ],
      previousValidationErrors: options.previousValidationErrors || [],
    },
    null,
    2,
  )
}

function buildFaqPromptPayload(record, options) {
  return JSON.stringify(
    {
      docsbotContextMarkdown: options.docsbotContext,
      industryPageJson: record,
      outputRequirements: [
        'Generate faq only.',
        'Use the completed industryPageJson as the primary context for this industry.',
        'Use the same DocsBot product context as the source of truth for DocsBot capabilities. Do not invent DocsBot features, trust claims, certifications, reviews, or integrations.',
        'Use web search only if additional industry buyer context is needed, such as workflows, software stack, KPIs, compliance concerns, staffing challenges, communication patterns, automation maturity, AI adoption patterns, vendors, tools, or terminology.',
        'The faq array should contain 15-30 polished buyer-facing FAQs suitable for the landing page.',
        'Each FAQ must include question, answer, role, category, and sourceIds.',
        'Use industryPageJson.evidenceSources as the existing source list. FAQ sourceIds may reference existing evidence source ids from that list.',
        'If FAQ research finds a useful authoritative source that is not already in industryPageJson.evidenceSources, add it to additionalEvidenceSources and cite its id from the relevant FAQ answer.',
        'Return additionalEvidenceSources as an empty array when no new FAQ-specific sources are needed. Do not duplicate existing source ids.',
        'Use a role from industryPageJson.businessClarity.whoItHelps.role when relevant. Use "General buyer" only if no role fits.',
        'Use categories from the schema enum. Categories are display metadata; the page template may hide category filters that only have one FAQ.',
        'FAQ answers may use sourceIds from industryPageJson.evidenceSources. Favor backing up answers with a sourced statistic, quote, or concrete external claim when relevant and available.',
        'Use FAQ sourceIds only when the answer text itself includes the sourced stat, quote, or concrete external claim. If the answer is only explaining DocsBot capabilities, workflow fit, implementation guidance, or buyer advice, use an empty sourceIds array.',
        'Do not cite a source merely because it inspired the answer. The visible answer must contain the claim that the source supports.',
        'Questions should sound like sales calls, procurement conversations, implementation meetings, buying committees, and operational reviews.',
        'Avoid generic questions like "What is an AI agent?", "How does AI work?", or "What are the benefits of AI?".',
        'Do not include icons for FAQ items.',
      ],
    },
    null,
    2,
  )
}

function buildInstructions(previousValidationErrors = []) {
  return [
    ...SYSTEM_PROMPT_PARTS,
    previousValidationErrors.length
      ? `The previous attempt failed validation. Fix these issues: ${previousValidationErrors.join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildFaqInstructions(previousValidationErrors = [], industryPageJson = null) {
  return [
    'You are a B2B buyer research analyst and AI-search content strategist.',
    'Your task is to research an industry and generate highly realistic FAQs that actual buyers in that industry would ask when evaluating AI agents and AI automation solutions.',
    'Do NOT generate generic SEO FAQs. Do NOT use People Also Ask, keyword tools, or generic internet lists as primary inputs.',
    'Your goal is to simulate real buyer thinking, decision criteria, concerns, objections, internal politics, implementation anxiety, risk tolerance, and purchase evaluation behavior.',
    'Use the provided DocsBot context for DocsBot capabilities and proof. Do not use web search for DocsBot product facts.',
    industryPageJson ? `<context>${JSON.stringify(industryPageJson)}</context>` : '',
    'Research the industry if needed: company types, operational workflows, buyer responsibilities, software stack, compliance concerns, KPIs, bottlenecks, staffing challenges, communication patterns, automation maturity, AI adoption patterns, common vendors/tools, and terminology.',
    'Use the most relevant buyer roles involved in evaluating AI agents. Consider responsibilities, metrics, incentives, fears, pain points, inefficiencies, budget authority, technical sophistication, implementation concerns, compliance/security concerns, integration requirements, reporting needs, and what success looks like.',
    'Generate realistic buyer questions, nuanced evaluation criteria, implementation concerns, operational objections, vendor comparison questions, ROI questions, trust/risk questions, integration questions, scalability questions, and internal stakeholder concerns.',
    'Use buyer-research thinking internally, but output only page-ready FAQ question/answer objects with role and category metadata.',
    'Return only JSON matching the strict schema.',
    previousValidationErrors.length
      ? `The previous FAQ attempt failed validation. Fix these issues: ${previousValidationErrors.join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function schemaTypeMatches(schemaType, value) {
  const types = Array.isArray(schemaType) ? schemaType : [schemaType]
  return types.some((type) => {
    if (type === 'array') return Array.isArray(value)
    if (type === 'object') return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    if (type === 'null') return value === null
    return typeof value === type
  })
}

function resolveSchemaRef(schema, rootSchema) {
  if (!schema?.$ref || !rootSchema) return schema
  const parts = schema.$ref.replace(/^#\//, '').split('/')
  return parts.reduce((current, part) => current?.[part], rootSchema) || schema
}

function validateAgainstSchema(value, schema, pathLabel = 'record', rootSchema = schema) {
  const errors = []
  if (!schema || typeof schema !== 'object') return errors
  schema = resolveSchemaRef(schema, rootSchema)

  if (schema.type && !schemaTypeMatches(schema.type, value)) {
    errors.push(`${pathLabel} must be ${Array.isArray(schema.type) ? schema.type.join(' or ') : schema.type}`)
    return errors
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pathLabel} must be one of ${schema.enum.join(', ')}`)
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${pathLabel} must be at least ${schema.minLength} characters`)
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${pathLabel} must be at most ${schema.maxLength} characters`)
    }
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
      errors.push(`${pathLabel} must match ${schema.pattern}`)
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${pathLabel} must include at least ${schema.minItems} items`)
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${pathLabel} must include at most ${schema.maxItems} items`)
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items, `${pathLabel}[${index}]`, rootSchema))
      })
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = schema.required || []
    required.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${pathLabel}.${key} is required`)
      }
    })
    if (schema.additionalProperties === false && schema.properties) {
      Object.keys(value).forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          errors.push(`${pathLabel}.${key} is not allowed`)
        }
      })
    }
    Object.entries(schema.properties || {}).forEach(([key, childSchema]) => {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateAgainstSchema(value[key], childSchema, `${pathLabel}.${key}`, rootSchema))
      }
    })
  }

  return errors
}

function collectStrings(value, prefix = '') {
  if (typeof value === 'string') return [{ path: prefix, value }]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${prefix}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectStrings(item, prefix ? `${prefix}.${key}` : key),
    )
  }
  return []
}

function cleanGeneratedCopyValue(value) {
  if (typeof value === 'string') {
    return value.trim().replace(/\s+([,.!?;:])/g, '$1').replace(/[,{;:]\s*$/g, '.')
  }
  if (Array.isArray(value)) return value.map(cleanGeneratedCopyValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanGeneratedCopyValue(item)]))
  }
  return value
}

function stripEmptySourceIds(value) {
  if (Array.isArray(value)) return value.map(stripEmptySourceIds)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, item]) => !(key === 'sourceIds' && Array.isArray(item) && item.length === 0))
        .map(([key, item]) => [key, stripEmptySourceIds(item)]),
    )
  }
  return value
}

function mergeEvidenceSources(existingSources = [], additionalSources = []) {
  const byId = new Map()
  ;[...(existingSources || []), ...(additionalSources || [])].forEach((source) => {
    if (!source?.id || byId.has(source.id)) return
    byId.set(source.id, source)
  })
  return [...byId.values()]
}

function buildBackgroundImageFromLegacyIndustry(record) {
  const query = record.imageSearch || record.business || record.title || record.slug
  if (!record.image) return null
  return {
    url: record.image,
    alt: `${record.business || record.title} background image`,
    source: 'legacy-industry',
    query,
  }
}

async function findUnsplashBackgroundImage(record) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null
  const query = record.imageSearch || record.business || record.title || record.slug
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('per_page', '1')

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  })
  if (!response.ok) {
    throw new Error(`Unsplash image search failed for ${record.slug}: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  const photo = data?.results?.[0]
  if (!photo?.urls?.raw && !photo?.urls?.full && !photo?.urls?.regular) return null
  const baseUrl = photo.urls.raw || photo.urls.full || photo.urls.regular
  const imageUrl = new URL(baseUrl)
  imageUrl.searchParams.set('auto', 'format')
  imageUrl.searchParams.set('fit', 'crop')
  imageUrl.searchParams.set('w', '2830')
  imageUrl.searchParams.set('q', '80')
  imageUrl.searchParams.set('blend', '111827')
  imageUrl.searchParams.set('sat', '-100')
  imageUrl.searchParams.set('exp', '15')
  imageUrl.searchParams.set('blend-mode', 'multiply')
  return {
    url: imageUrl.toString(),
    alt: photo.alt_description || `${record.business || record.title} background image`,
    source: 'unsplash-search',
    query,
  }
}

async function resolveBackgroundImage(record) {
  const legacyImage = buildBackgroundImageFromLegacyIndustry(record)
  if (legacyImage) return legacyImage
  try {
    const searchedImage = await findUnsplashBackgroundImage(record)
    if (searchedImage) return searchedImage
  } catch (error) {
    console.warn(`image fallback: ${record.slug}: ${error.message}`)
  }
  console.warn(`${record.slug}: missing legacy industry image; using default DocsBot background image`)
  return {
    url: FALLBACK_BACKGROUND_IMAGE,
    alt: `${record.business || record.title} background image`,
    source: 'default-docsbot',
    query: record.imageSearch || record.business || record.title || record.slug,
  }
}

function isHttpUrl(value = '') {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(value || '').trim())
}

function repairHttpUrl(value = '') {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (isHttpUrl(trimmed)) return trimmed
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
    const repaired = `https://${trimmed}`
    return isHttpUrl(repaired) ? repaired : ''
  }
  return ''
}

function collectSourceIdPaths(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectSourceIdPaths(item, `${prefix}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      if (key === 'sourceIds' && Array.isArray(item)) {
        return [{ path: nextPrefix, ids: item }]
      }
      return collectSourceIdPaths(item, nextPrefix)
    })
  }
  return []
}

function repairSourceIds(value, validSourceIds) {
  if (Array.isArray(value)) return value.map((item) => repairSourceIds(item, validSourceIds))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => {
          if (key === 'sourceIds' && Array.isArray(item)) {
            const repairedIds = [...new Set(item.filter((id) => validSourceIds.has(id)))]
            return [key, repairedIds]
          }
          return [key, repairSourceIds(item, validSourceIds)]
        })
        .filter(([key, item]) => !(key === 'sourceIds' && Array.isArray(item) && item.length === 0)),
    )
  }
  return value
}

function repairEvidenceSources(sources = []) {
  const seenIds = new Set()
  return (sources || []).flatMap((source) => {
    if (!source?.id || seenIds.has(source.id)) return []
    const sourceUrl = repairHttpUrl(source.sourceUrl)
    if (!sourceUrl) return []
    seenIds.add(source.id)
    return [{ ...source, sourceUrl }]
  })
}

function repairGeneratedRecord(record, options = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record
  const repaired = JSON.parse(JSON.stringify(record))
  const expectedSlug = options.expectedSlug || repaired.slug || repaired.generationMeta?.sourceIndustrySlug
  const reviewIds = new Set((options.reviewLibrary?.reviews || []).map((review) => review.id))
  const industrySlugs = new Set((options.industries || INDUSTRIES).map((industry) => industry.slug))

  if (expectedSlug) repaired.slug = expectedSlug
  repaired.pageMeta = repaired.pageMeta || {}
  if (repaired.slug) repaired.pageMeta.canonicalPath = `/industry/${repaired.slug}`
  repaired.generationMeta = repaired.generationMeta || {}
  if (repaired.slug) repaired.generationMeta.sourceIndustrySlug = repaired.slug
  delete repaired.generationMeta.warnings

  if (repaired.trustAndProof?.selectedReviewIds) {
    repaired.trustAndProof.selectedReviewIds = [
      ...new Set(repaired.trustAndProof.selectedReviewIds.filter((id) => reviewIds.has(id))),
    ]
  }

  if (Array.isArray(repaired.relatedIndustrySlugs)) {
    repaired.relatedIndustrySlugs = [
      ...new Set(repaired.relatedIndustrySlugs.filter((slug) => industrySlugs.has(slug) && slug !== repaired.slug)),
    ]
  }

  repaired.evidenceSources = repairEvidenceSources(repaired.evidenceSources || [])
  const evidenceSourceIds = new Set(repaired.evidenceSources.map((source) => source.id))
  const sourceRepaired = repairSourceIds(repaired, evidenceSourceIds)
  Object.keys(repaired).forEach((key) => delete repaired[key])
  Object.assign(repaired, sourceRepaired)

  if (Array.isArray(repaired.generationMeta?.sourceUrls)) {
    repaired.generationMeta.sourceUrls = [
      ...new Set(repaired.generationMeta.sourceUrls.map(repairHttpUrl).filter(Boolean)),
    ]
  }

  const roleNames = new Set((repaired.businessClarity?.whoItHelps || []).map((role) => role.role).filter(Boolean))
  if (Array.isArray(repaired.faq)) {
    repaired.faq = repaired.faq.map((item) => ({
      ...item,
      role: item.role && (item.role === 'General buyer' || roleNames.has(item.role)) ? item.role : 'General buyer',
    }))
  }

  return stripEmptySourceIds(repaired)
}

function validateIndustryPageRecord(record, options = {}) {
  const reviewIds = new Set((options.reviewLibrary?.reviews || []).map((review) => review.id))
  const industrySlugs = new Set((options.industries || INDUSTRIES).map((industry) => industry.slug))
  const errors = []
  const expectedSlug = options.expectedSlug || record.generationMeta?.sourceIndustrySlug

  if (expectedSlug && record.slug !== expectedSlug) {
    errors.push(`slug must remain exactly ${expectedSlug}`)
  }
  if (record.slug && record.generationMeta?.sourceIndustrySlug && record.slug !== record.generationMeta.sourceIndustrySlug) {
    errors.push('generationMeta.sourceIndustrySlug must match slug')
  }
  if (record.slug && record.pageMeta?.canonicalPath !== `/industry/${record.slug}`) {
    errors.push('pageMeta.canonicalPath must match slug')
  }

  ;(record.trustAndProof?.selectedReviewIds || []).forEach((id) => {
    if (!reviewIds.has(id)) errors.push(`selectedReviewIds includes unknown id: ${id}`)
  })
  ;(record.relatedIndustrySlugs || []).forEach((slug) => {
    if (!industrySlugs.has(slug)) errors.push(`relatedIndustrySlugs includes unknown slug: ${slug}`)
    if (slug === record.slug) errors.push('relatedIndustrySlugs must not include the current slug')
  })
  const evidenceSourceIds = new Set()
  ;(record.evidenceSources || []).forEach((source, index) => {
    if (source.id) {
      if (evidenceSourceIds.has(source.id)) errors.push(`evidenceSources[${index}].id must be unique`)
      evidenceSourceIds.add(source.id)
    }
    if (!isHttpUrl(source.sourceUrl)) errors.push(`evidenceSources[${index}].sourceUrl must be an http(s) URL`)
  })
  collectSourceIdPaths(record).forEach(({ path: sourceIdsPath, ids }) => {
    ids.forEach((sourceId, index) => {
      if (sourceId && !evidenceSourceIds.has(sourceId)) {
        errors.push(`${sourceIdsPath}[${index}] references unknown evidence source id: ${sourceId}`)
      }
    })
  })
  ;(record.generationMeta?.sourceUrls || []).forEach((url, index) => {
    if (!isHttpUrl(url)) errors.push(`generationMeta.sourceUrls[${index}] must be an http(s) URL`)
  })
  const roleNames = new Set((record.businessClarity?.whoItHelps || []).map((role) => role.role).filter(Boolean))
  ;(record.faq || []).forEach((item, index) => {
    if (item.role && item.role !== 'General buyer' && !roleNames.has(item.role)) {
      errors.push(`faq[${index}].role must match a generated role or General buyer`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

function parseGeneratedResult(raw, options = {}) {
  if (!raw || !raw.trim()) {
    return { valid: false, record: null, errors: ['OpenAI returned an empty response'] }
  }

  let parsed
  try {
    parsed = stripEmptySourceIds(cleanGeneratedCopyValue(JSON.parse(raw)))
    parsed = repairGeneratedRecord(parsed, options)
  } catch (error) {
    return { valid: false, record: null, errors: [`OpenAI returned invalid JSON: ${error.message}`] }
  }

  return {
    valid: true,
    record: parsed,
    errors: [],
  }
}

function parseRetryAfterMs(value) {
  if (value === undefined || value === null || value === '') return null
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(value)
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientOpenAiError(error) {
  if (error?.name === 'AbortError') return true
  const status = error?.status || error?.code || error?.response?.status
  if ([408, 409, 429, 500, 502, 503, 504].includes(Number(status))) return true
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('rate limit') ||
    message.includes('resource unavailable') ||
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('temporarily') ||
    message.includes('overloaded') ||
    message.includes('econnreset')
  )
}

function isOpenAiCapacityError(error) {
  const status = Number(error?.status || error?.code || error?.response?.status)
  const message = String(error?.message || '').toLowerCase()
  return status === 429 || message.includes('resource unavailable') || message.includes('too many requests') || message.includes('rate limit')
}

async function getOpenAiClient(args) {
  if (args.openaiClient) return args.openaiClient
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required unless using --print-prompt')
  }
  const OpenAI = require('openai')
  const OpenAIClient = OpenAI.default || OpenAI
  return new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY, timeout: OPENAI_REQUEST_TIMEOUT_MS })
}

async function createOpenAiResponse(openai, request, attempt = 1, state = {}) {
  try {
    return await openai.responses.create(request, { timeout: OPENAI_REQUEST_TIMEOUT_MS })
  } catch (error) {
    if (!isTransientOpenAiError(error)) throw error
    const retryAfterHeaderMs =
      parseRetryAfterMs(error?.headers?.get?.('retry-after')) ??
      parseRetryAfterMs(error?.response?.headers?.['retry-after']) ??
      parseRetryAfterMs(error?.headers?.['retry-after'])
    const shouldRetryUntilAccepted = request?.service_tier === 'flex' && isOpenAiCapacityError(error)
    if (!shouldRetryUntilAccepted && attempt >= 3) throw error

    const flexRetryDelayMs = Object.prototype.hasOwnProperty.call(request || {}, '__testFlexRetryDelayMs')
      ? request.__testFlexRetryDelayMs
      : FLEX_RETRY_DELAY_MS
    const retryAfterMs = shouldRetryUntilAccepted
      ? Math.max(retryAfterHeaderMs ?? 0, flexRetryDelayMs)
      : retryAfterHeaderMs ?? 10000 * attempt

    const now = Date.now()
    if (!state.lastLogAt || now - state.lastLogAt >= FLEX_RETRY_LOG_INTERVAL_MS) {
      const retryMode = shouldRetryUntilAccepted ? 'flex capacity' : 'transient'
      console.warn(`openai ${retryMode} error; retrying in ${Math.ceil(retryAfterMs / 1000)}s`)
      state.lastLogAt = now
    }
    await sleep(retryAfterMs)
    return createOpenAiResponse(openai, request, attempt + 1, state)
  }
}

async function generateIndustryPageWithOpenAi(record, args, options) {
  const openai = await getOpenAiClient(args)
  let lastErrors = []
  const apiUsageAttempts = []

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const payload = buildIndustryPromptPayload(record, {
      ...options,
      previousValidationErrors: lastErrors,
    })

    const request = {
      model: args.model || DEFAULT_MODEL,
      store: false,
      service_tier: DEFAULT_SERVICE_TIER,
      ...(args.openaiClient && args.testFlexRetryDelayMs !== undefined ? { __testFlexRetryDelayMs: args.testFlexRetryDelayMs } : {}),
      reasoning: { effort: DEFAULT_REASONING_EFFORT },
      instructions: buildInstructions(lastErrors),
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: payload }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'docsbot_industry_v2_agent_page',
          strict: true,
          schema: buildMainContentOutputSchema(options.schema),
        },
      },
      max_output_tokens: 12000,
    }

    const response = await createOpenAiResponse(openai, request)
    apiUsageAttempts.push(calculateApiUsageCost({ model: request.model, response, attempt, step: 'main-content', serviceTier: request.service_tier }))
    const raw = response.output_text || ''
    const parseResult = parseGeneratedResult(raw, {
      ...options,
      schema: omitTopLevelSchemaFields(options.schema, ['backgroundImage', 'faq', 'buyerFaqResearch']),
      expectedSlug: record.slug,
    })
    lastErrors = parseResult.errors
    if (parseResult.valid) {
      return {
        record: parseResult.record,
        apiUsage: aggregateApiUsage(apiUsageAttempts),
      }
    }
  }

  throw new Error(`${record.slug}: generation failed validation: ${lastErrors.join('; ')}`)
}

function parseFaqGeneratedResult(raw, options = {}) {
  if (!raw || !raw.trim()) {
    return { valid: false, record: null, errors: ['OpenAI returned an empty FAQ response'] }
  }

  let parsed
  try {
    parsed = cleanGeneratedCopyValue(JSON.parse(raw))
  } catch (error) {
    return { valid: false, record: null, errors: [`OpenAI returned invalid FAQ JSON: ${error.message}`] }
  }

  parsed.additionalEvidenceSources = repairEvidenceSources(parsed.additionalEvidenceSources || [])
  parsed.faq = Array.isArray(parsed.faq) ? parsed.faq : []
  return {
    valid: true,
    record: stripEmptySourceIds(parsed),
    errors: [],
  }
}

async function generateIndustryFaqWithOpenAi(record, args, options) {
  const openai = await getOpenAiClient(args)
  let lastErrors = []
  const apiUsageAttempts = []

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const payload = buildFaqPromptPayload(record, {
      ...options,
      previousValidationErrors: lastErrors,
    })
    const request = {
      model: args.model || DEFAULT_MODEL,
      store: false,
      service_tier: DEFAULT_SERVICE_TIER,
      ...(args.openaiClient && args.testFlexRetryDelayMs !== undefined ? { __testFlexRetryDelayMs: args.testFlexRetryDelayMs } : {}),
      reasoning: { effort: DEFAULT_REASONING_EFFORT },
      instructions: buildFaqInstructions(lastErrors, record),
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: payload }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'docsbot_industry_v2_buyer_faq',
          strict: true,
          schema: buildFaqOutputSchema(options.schema),
        },
      },
      max_output_tokens: 10000,
    }

    const response = await createOpenAiResponse(openai, request)
    apiUsageAttempts.push(calculateApiUsageCost({ model: request.model, response, attempt, step: 'faq', serviceTier: request.service_tier }))
    const parseResult = parseFaqGeneratedResult(response.output_text || '', options)
    lastErrors = parseResult.errors
    if (parseResult.valid) {
      const evidenceSources = mergeEvidenceSources(record.evidenceSources, parseResult.record.additionalEvidenceSources)
      const candidate = repairGeneratedRecord({
        ...record,
        evidenceSources,
        faq: parseResult.record.faq,
      }, {
        ...options,
        expectedSlug: record.slug,
      })
      delete candidate.buyerFaqResearch
      const validation = validateIndustryPageRecord(candidate, {
        ...options,
        expectedSlug: record.slug,
      })
      lastErrors = validation.errors
      if (!validation.valid) continue
      return {
        record: parseResult.record,
        apiUsage: aggregateApiUsage(apiUsageAttempts),
      }
    }
  }

  throw new Error(`${record.slug}: FAQ generation failed validation: ${lastErrors.join('; ')}`)
}

function buildGeneratedIndexRecord(record) {
  return {
    slug: record.slug,
    business: record.business,
    industryCategory: record.industryCategory,
    backgroundImage: record.backgroundImage || null,
    title: record.pageMeta?.title || '',
    headline: record.hero?.headline || '',
    selectedReviewIds: record.trustAndProof?.selectedReviewIds || [],
    generatedAt: record.generationMeta?.generatedAt || null,
    model: record.generationMeta?.model || null,
    apiUsage: record.generationMeta?.apiUsage || null,
    sourceUrls: record.generationMeta?.sourceUrls || [],
  }
}

function readValidGeneratedRecord(slug, options = {}) {
  const filePath = getGeneratedFilePath(slug, options.outDir || DEFAULT_OUT_DIR)
  if (!fs.existsSync(filePath)) return null
  try {
    const record = repairGeneratedRecord(readJsonFileStrict(filePath), {
      ...options,
      expectedSlug: slug,
    })
    const validation = validateIndustryPageRecord(record, { ...options, expectedSlug: slug })
    return validation.valid ? record : null
  } catch {
    return null
  }
}

function readAllValidGeneratedRecords(options = {}) {
  const generatedDir = getGeneratedDir(options.outDir || DEFAULT_OUT_DIR)
  if (!fs.existsSync(generatedDir)) return []
  return fs
    .readdirSync(generatedDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readValidGeneratedRecord(file.replace(/\.json$/, ''), options))
    .filter(Boolean)
}

function writeGeneratedIndex({ outDir, model, records, generatedAt }) {
  const existing = readAllValidGeneratedRecords({
    outDir,
    schema: loadSchema(outDir),
    reviewLibrary: loadReviewLibrary(outDir),
    industries: INDUSTRIES,
  })
  const bySlug = new Map(existing.map((record) => [record.slug, record]))
  records.forEach((record) => bySlug.set(record.slug, record))
  const indexRecords = [...bySlug.values()]
    .sort((a, b) => a.industryCategory.localeCompare(b.industryCategory) || a.business.localeCompare(b.business))
    .map(buildGeneratedIndexRecord)

  writeJsonFile(getIndexPath(outDir), {
    version: 1,
    generatedAt,
    model,
    count: indexRecords.length,
    records: indexRecords,
  })
}

function printPrompt(args) {
  const schema = loadSchema(args.outDir)
  const reviewLibrary = loadReviewLibrary(args.outDir)
  const docsbotContext = loadDocsBotContext(args.outDir)
  const record = selectIndustryRecords(INDUSTRIES, args)[0] || INDUSTRIES[0]
  const payload = buildIndustryPromptPayload(record, {
    schema,
    reviewLibrary,
    docsbotContext,
    relatedIndustryCandidates: buildRelatedIndustryCandidates(record),
    previousValidationErrors: [],
  })

  console.log('=== industry v2: instructions ===\n')
  console.log(buildInstructions())
  console.log('\n=== industry v2: user payload ===\n')
  console.log(payload)
}

async function runWithConcurrency(items, concurrency, worker) {
  const limit = Math.max(1, Math.min(Number(concurrency) || DEFAULT_CONCURRENCY, items.length || 1))
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      await worker(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()))
}

async function buildIndustryV2Content(args = parseArgs()) {
  const schema = loadSchema(args.outDir)
  const reviewLibrary = loadReviewLibrary(args.outDir)
  const docsbotContext = loadDocsBotContext(args.outDir)
  const validationOptions = { outDir: args.outDir, schema, reviewLibrary, industries: INDUSTRIES }
  const selectedRecords = selectIndustryRecords(INDUSTRIES, args, { validationOptions })
  const generatedAt = new Date().toISOString()
  const summary = {
    selected: selectedRecords.length,
    concurrency: args.concurrency,
    reused: [],
    generated: [],
    skipped: [],
    failed: [],
    apiCalls: [],
    estimatedCostUsd: aggregateApiUsage([]).total,
    dryRun: args.dryRun,
    outDir: args.outDir,
  }
  const generatedRecords = []

  if (!selectedRecords.length) {
    throw new Error(args.only.length ? `No matching industries for --only=${args.only.join(',')}` : 'No industries selected')
  }

  await runWithConcurrency(selectedRecords, args.concurrency, async (record) => {
    const existing = !args.force ? readValidGeneratedRecord(record.slug, validationOptions) : null
    if (existing) {
      console.log(`reuse: ${record.business}`)
      summary.reused.push(record.slug)
      generatedRecords.push(existing)
      if (args.write) writeGeneratedIndex({ outDir: args.outDir, model: args.model, records: generatedRecords, generatedAt })
      return
    }

    if (args.missing && existing) {
      summary.skipped.push(record.slug)
      return
    }

    try {
      const relatedIndustryCandidates = buildRelatedIndustryCandidates(record, INDUSTRIES)
      console.log(`${args.dryRun ? 'dry-run openai' : 'openai'}: ${record.business}`)
      const result = await generateIndustryPageWithOpenAi(record, args, {
        schema,
        reviewLibrary,
        docsbotContext,
        relatedIndustryCandidates,
        industries: INDUSTRIES,
        expectedSlug: record.slug,
        outDir: args.outDir,
      })
      const generated = result.record
      generated.backgroundImage = await resolveBackgroundImage(record)
      console.log(`${args.dryRun ? 'dry-run faq' : 'faq'}: ${record.business}`)
      const faqResult = await generateIndustryFaqWithOpenAi(generated, args, {
        schema,
        reviewLibrary,
        docsbotContext,
        relatedIndustryCandidates,
        industries: INDUSTRIES,
        expectedSlug: record.slug,
        outDir: args.outDir,
      })
      generated.evidenceSources = mergeEvidenceSources(generated.evidenceSources, faqResult.record.additionalEvidenceSources)
      generated.faq = faqResult.record.faq
      delete generated.buyerFaqResearch
      generated.generationMeta.sourceUrls = [
        ...new Set([
          ...(generated.generationMeta?.sourceUrls || []),
          ...(faqResult.record.additionalEvidenceSources || []).map((source) => source.sourceUrl).filter(Boolean),
        ]),
      ]
      const combinedApiUsage = aggregateApiUsage([...result.apiUsage.attempts, ...faqResult.apiUsage.attempts])

      combinedApiUsage.attempts.forEach((attemptUsage) => {
        summary.apiCalls.push({
          slug: record.slug,
          ...attemptUsage,
        })
      })
      summary.estimatedCostUsd = aggregateApiUsage(summary.apiCalls).total

      generated.generationMeta = {
        ...generated.generationMeta,
        model: args.model,
        generatedAt: generated.generationMeta?.generatedAt || new Date().toISOString(),
        sourceIndustrySlug: record.slug,
        apiUsage: combinedApiUsage,
      }
      Object.assign(generated, repairGeneratedRecord(generated, validationOptions))

      const validation = validateIndustryPageRecord(generated, validationOptions)
      if (!validation.valid) {
        throw new Error(validation.errors.join('; '))
      }

      summary.generated.push(record.slug)
      generatedRecords.push(generated)

      if (args.write) {
        writeJsonFile(getGeneratedFilePath(record.slug, args.outDir), generated)
        writeGeneratedIndex({ outDir: args.outDir, model: args.model, records: generatedRecords, generatedAt })
      } else {
        console.log(
          JSON.stringify(
            {
              slug: generated.slug,
              title: generated.pageMeta.title,
              headline: generated.hero.headline,
              selectedReviewIds: generated.trustAndProof.selectedReviewIds,
              sourceUrls: generated.generationMeta.sourceUrls,
              apiUsage: generated.generationMeta.apiUsage,
            },
            null,
            2,
          ),
        )
      }
    } catch (error) {
      console.warn(`failed: ${record.slug}: ${error.message}`)
      summary.failed.push({ slug: record.slug, error: error.message })
    }
  })

  if (args.write) {
    writeGeneratedIndex({ outDir: args.outDir, model: args.model, records: generatedRecords, generatedAt })
  }

  return summary
}

async function main() {
  loadLocalEnv()
  const args = parseArgs()
  if (args.printPrompt) {
    printPrompt(args)
    return
  }
  const summary = await buildIndustryV2Content(args)
  console.log(JSON.stringify(summary, null, 2))
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  aggregateApiUsage,
  buildGeneratedIndexRecord,
  buildFaqInstructions,
  buildFaqOutputSchema,
  buildFaqPromptPayload,
  buildIndustryPromptPayload,
  buildIndustryV2Content,
  buildInstructions,
  buildMainContentOutputSchema,
  buildOpenAiOutputSchema,
  buildBackgroundImageFromLegacyIndustry,
  buildRelatedIndustryCandidates,
  calculateApiUsageCost,
  cleanGeneratedCopyValue,
  loadDocsBotContext,
  loadLocalEnv,
  loadReviewLibrary,
  loadSchema,
  parseArgs,
  parseFaqGeneratedResult,
  parseGeneratedResult,
  parseRetryAfterMs,
  repairGeneratedRecord,
  resolveBackgroundImage,
  selectIndustryRecords,
  slugify,
  FLEX_RETRY_DELAY_MS,
  OPENAI_REQUEST_TIMEOUT_MS,
  validateAgainstSchema,
  validateIndustryPageRecord,
  writeGeneratedIndex,
}
