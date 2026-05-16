import { describe, expect, it, vi } from 'vitest'

import schema from '../../src/data/industries/v2/schema.json'
import reviewLibrary from '../../src/data/industries/v2/reviews.json'
import landscapingGenerated from '../../src/data/industries/v2/generated/landscaping-services.json'
import {
  aggregateApiUsage,
  buildIndustryPromptPayload,
  buildInstructions,
  buildFaqOutputSchema,
  buildRelatedIndustryCandidates,
  buildIndustryV2Content,
  buildMainContentOutputSchema,
  buildOpenAiOutputSchema,
  calculateApiUsageCost,
  parseArgs,
  parseGeneratedResult,
  parseRetryAfterMs,
  repairGeneratedRecord,
  resolveBackgroundImage,
  selectIndustryRecords,
  FLEX_RETRY_DELAY_MS,
  OPENAI_REQUEST_TIMEOUT_MS,
  validateIndustryPageRecord,
} from '../../scripts/generate-industry-v2-content'

const industries = [
  {
    slug: 'landscaping-services',
    business: 'Landscaping Services',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Landscaping Services',
  },
  {
    slug: 'lawn-care-services',
    business: 'Lawn Care Services',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Lawn Care Services',
  },
  {
    slug: 'arborist',
    business: 'Arborist',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Arborists',
  },
  {
    slug: 'greenhouse-operations',
    business: 'Greenhouse Operations',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Greenhouse Operations',
  },
  {
    slug: 'farm-equipment-sales',
    business: 'Farm Equipment Sales',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Farm Equipment Sales',
  },
  {
    slug: 'extermination-pest-control',
    business: 'Extermination & Pest Control',
    industry: 'Professional Services',
    title: 'AI Chatbots for Extermination & Pest Control',
  },
  {
    slug: 'agriculture-forestry-wildlife',
    business: 'Agriculture Forestry Wildlife',
    industry: 'Agriculture & Forestry/Wildlife',
    title: 'AI Chatbots for Agriculture Forestry Wildlife',
  },
  {
    slug: 'saas-solutions',
    business: 'SaaS Solutions',
    industry: 'Business & Information',
    title: 'AI Chatbots for SaaS Solutions',
  },
]

function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source
  const next = { ...target }
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && target?.[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      next[key] = deepMerge(target[key], value)
    } else {
      next[key] = value
    }
  })
  return next
}

function validRecord(overrides = {}) {
  return deepMerge(JSON.parse(JSON.stringify(landscapingGenerated)), overrides)
}

function validMainRecord(overrides = {}) {
  const record = validRecord(overrides)
  delete record.backgroundImage
  delete record.faq
  delete record.buyerFaqResearch
  return record
}

function validFaqRecord(overrides = {}) {
  const record = validRecord()
  return deepMerge(
    {
      faq: record.faq.map((item) => ({
        ...item,
        sourceIds: item.sourceIds || [],
      })),
      additionalEvidenceSources: [],
    },
    overrides,
  )
}

describe('industry v2 generator helpers', () => {
  it('parses CLI args in the skills-generator style', () => {
    const args = parseArgs([
      '--only',
      'landscaping-services,saas-solutions',
      '--write',
      '--force',
      '--concurrency',
      '2',
      '--limit',
      '1',
    ])

    expect(args.only).toEqual(['landscaping-services', 'saas-solutions'])
    expect(args.write).toBe(true)
    expect(args.dryRun).toBe(false)
    expect(args.force).toBe(true)
    expect(args.concurrency).toBe(2)
    expect(args.limit).toBe(1)
  })

  it('supports explicit parallel API call aliases', () => {
    expect(parseArgs(['--all', '--write', '--parallel', '12']).concurrency).toBe(12)
    expect(parseArgs(['--all', '--write', '--api-concurrency=8']).concurrency).toBe(8)
  })

  it('uses a default background image instead of failing completed GPT output when no industry image is available', async () => {
    const originalUnsplashKey = process.env.UNSPLASH_ACCESS_KEY
    delete process.env.UNSPLASH_ACCESS_KEY
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      await expect(
        resolveBackgroundImage({
          slug: 'ai-consulting',
          business: 'AI Consulting',
          title: 'AI Consulting',
        }),
      ).resolves.toMatchObject({
        url: '/og-main.png',
        alt: 'AI Consulting background image',
        source: 'default-docsbot',
        query: 'AI Consulting',
      })
    } finally {
      warnSpy.mockRestore()
      if (originalUnsplashKey === undefined) {
        delete process.env.UNSPLASH_ACCESS_KEY
      } else {
        process.env.UNSPLASH_ACCESS_KEY = originalUnsplashKey
      }
    }
  })

  it('selects specific industry records by slug', () => {
    expect(selectIndustryRecords(industries, parseArgs(['--only', 'saas-solutions']))).toEqual([
      industries.find((industry) => industry.slug === 'saas-solutions'),
    ])
  })

  it('builds related industry candidates from same category first', () => {
    const candidates = buildRelatedIndustryCandidates(industries[0], industries, 2)
    expect(candidates[0]).toMatchObject({ slug: 'lawn-care-services' })
  })

  it('validates a complete generated record', () => {
    const validation = validateIndustryPageRecord(validRecord(), {
      schema,
      reviewLibrary,
      industries,
    })

    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)
  })

  it('allows FAQ categories with one item for template-level display filtering', () => {
    const record = validRecord({
      faq: validRecord().faq.map((item, index) => ({
        ...item,
        category: index === 0 ? 'Vendor trust' : item.category,
      })),
    })
    const validation = validateIndustryPageRecord(record, {
      schema,
      reviewLibrary,
      industries,
    })

    expect(validation.errors).not.toContain('faq category "Vendor trust" must have at least two FAQs or be omitted')
    expect(validation.valid).toBe(true)
  })

  it('rejects unknown inline evidence source ids', () => {
    const record = validRecord({
      agentUseCases: validRecord().agentUseCases.map((useCase, index) =>
        index === 0
          ? {
              ...useCase,
              sourceIds: ['src-missing-source'],
            }
          : useCase,
      ),
    })
    const validation = validateIndustryPageRecord(record, {
      schema,
      reviewLibrary,
      industries,
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain(
      'agentUseCases[0].sourceIds[0] references unknown evidence source id: src-missing-source',
    )
  })

  it('rejects invalid review ids and related slugs', () => {
    const record = validRecord({
      trustAndProof: {
        ...validRecord().trustAndProof,
        selectedReviewIds: ['missing-review'],
      },
      relatedIndustrySlugs: ['missing-industry'],
    })
    const validation = validateIndustryPageRecord(record, {
      schema,
      reviewLibrary,
      industries,
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        'selectedReviewIds includes unknown id: missing-review',
        'relatedIndustrySlugs includes unknown slug: missing-industry',
      ]),
    )
  })

  it('rejects generated records that rewrite an existing slug', () => {
    const record = validRecord({
      slug: 'landscaping-company',
      pageMeta: {
        ...validRecord().pageMeta,
        canonicalPath: '/industry/landscaping-company',
      },
      generationMeta: {
        ...validRecord().generationMeta,
        sourceIndustrySlug: 'landscaping-services',
      },
    })
    const validation = validateIndustryPageRecord(record, {
      schema,
      reviewLibrary,
      industries,
      expectedSlug: 'landscaping-services',
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toEqual(
      expect.arrayContaining([
        'slug must remain exactly landscaping-services',
        'generationMeta.sourceIndustrySlug must match slug',
      ]),
    )
  })

  it('does not reject generated copy using text-quality heuristics', () => {
    const record = validRecord({
      pageMeta: {
        ...validRecord().pageMeta,
        title: 'AI Chatbots for Landscaping Services',
      },
    })
    const validation = validateIndustryPageRecord(record, {
      schema,
      reviewLibrary,
      industries,
    })

    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('parses and validates model JSON output', () => {
    const result = parseGeneratedResult(JSON.stringify(validRecord()), {
      schema,
      reviewLibrary,
      industries,
    })

    expect(result.valid).toBe(true)
    expect(result.record.slug).toBe('landscaping-services')
  })

  it('parses retry-after values without discarding explicit zero delays', () => {
    expect(parseRetryAfterMs('0')).toBe(0)
    expect(parseRetryAfterMs('2')).toBe(2000)
    expect(parseRetryAfterMs('not a date')).toBeNull()
  })

  it('repairs recoverable model integrity issues without schema retries', () => {
    const record = validRecord({
      slug: 'rewritten-slug',
      pageMeta: {
        ...validRecord().pageMeta,
        canonicalPath: '/industry/rewritten-slug',
      },
      trustAndProof: {
        ...validRecord().trustAndProof,
        selectedReviewIds: ['missing-review', validRecord().trustAndProof.selectedReviewIds[0]],
      },
      relatedIndustrySlugs: ['missing-industry', 'landscaping-services', 'arborist'],
      evidenceSources: [
        validRecord().evidenceSources[0],
        {
          ...validRecord().evidenceSources[0],
          sourceUrl: 'https://duplicate.example.com',
        },
        {
          ...validRecord().evidenceSources[1],
          sourceUrl: 'www.example.com/report',
        },
        {
          ...validRecord().evidenceSources[2],
          sourceUrl: 'not a url',
        },
      ],
      agentUseCases: validRecord().agentUseCases.map((useCase, index) =>
        index === 0
          ? {
              ...useCase,
              sourceIds: ['src-missing-source', validRecord().evidenceSources[0].id],
            }
          : useCase,
      ),
      faq: validRecord().faq.map((item, index) =>
        index === 0
          ? {
              ...item,
              role: 'Unknown buying committee',
              sourceIds: ['src-missing-source'],
            }
          : item,
      ),
      generationMeta: {
        ...validRecord().generationMeta,
        sourceIndustrySlug: 'rewritten-slug',
        sourceUrls: ['www.example.com/report', 'not a url'],
      },
    })

    const repaired = repairGeneratedRecord(record, {
      reviewLibrary,
      industries,
      expectedSlug: 'landscaping-services',
    })

    expect(repaired.slug).toBe('landscaping-services')
    expect(repaired.generationMeta.sourceIndustrySlug).toBe('landscaping-services')
    expect(repaired.pageMeta.canonicalPath).toBe('/industry/landscaping-services')
    expect(repaired.trustAndProof.selectedReviewIds).toEqual([validRecord().trustAndProof.selectedReviewIds[0]])
    expect(repaired.relatedIndustrySlugs).toEqual(['arborist'])
    expect(repaired.evidenceSources.map((source) => source.id)).toEqual([
      validRecord().evidenceSources[0].id,
      validRecord().evidenceSources[1].id,
    ])
    expect(repaired.evidenceSources[1].sourceUrl).toBe('https://www.example.com/report')
    expect(repaired.agentUseCases[0].sourceIds).toEqual([validRecord().evidenceSources[0].id])
    expect(repaired.faq[0].sourceIds).toBeUndefined()
    expect(repaired.faq[0].role).toBe('General buyer')
    expect(repaired.generationMeta.sourceUrls).toEqual(['https://www.example.com/report'])
    expect(validateIndustryPageRecord(repaired, { reviewLibrary, industries, expectedSlug: 'landscaping-services' }).valid).toBe(true)
  })

  it('does not retry OpenAI calls for recoverable integrity repairs', async () => {
    const requests = []
    const badMainRecord = validMainRecord({
      slug: 'rewritten-slug',
      pageMeta: {
        ...validRecord().pageMeta,
        canonicalPath: '/industry/rewritten-slug',
      },
      trustAndProof: {
        ...validRecord().trustAndProof,
        selectedReviewIds: ['missing-review', validRecord().trustAndProof.selectedReviewIds[0]],
      },
      relatedIndustrySlugs: ['missing-industry', 'landscaping-services', 'arborist'],
      generationMeta: {
        ...validRecord().generationMeta,
        sourceIndustrySlug: 'rewritten-slug',
        sourceUrls: ['www.example.com/report', 'not a url'],
      },
    })
    const badFaqRecord = validFaqRecord({
      faq: validFaqRecord().faq.map((item, index) =>
        index === 0
          ? {
              ...item,
              role: 'Unknown buying committee',
              sourceIds: ['src-missing-source'],
            }
          : item,
      ),
      additionalEvidenceSources: [
        {
          ...validRecord().evidenceSources[0],
          id: 'src-extra-faq-source',
          sourceUrl: 'www.example.com/faq-report',
        },
        {
          ...validRecord().evidenceSources[1],
          id: 'src-bad-faq-source',
          sourceUrl: 'not a url',
        },
      ],
    })
    const openaiClient = {
      responses: {
        create: async (nextRequest) => {
          requests.push(nextRequest)
          const isFaq = nextRequest.text.format.name === 'docsbot_industry_v2_buyer_faq'
          return {
            output_text: JSON.stringify(isFaq ? badFaqRecord : badMainRecord),
            usage: {
              input_tokens: 1000,
              output_tokens: 100,
              total_tokens: 1100,
            },
            output: [],
          }
        },
      },
    }

    const args = parseArgs(['--only', 'landscaping-services', '--dry-run', '--force'])
    args.openaiClient = openaiClient
    args.testFlexRetryDelayMs = 0
    const summary = await buildIndustryV2Content(args)

    expect(requests).toHaveLength(2)
    expect(summary.generated).toEqual(['landscaping-services'])
    expect(summary.failed).toEqual([])
  })

  it('uses DocsBot capabilities as prompt context without output feature tags', () => {
    const payload = JSON.parse(
      buildIndustryPromptPayload(industries[0], {
        docsbotContext: 'DocsBot local context',
        reviewLibrary,
        relatedIndustryCandidates: buildRelatedIndustryCandidates(industries[0], industries),
        previousValidationErrors: [],
      }),
    )
    const outputSchema = buildOpenAiOutputSchema(schema)

    expect(payload.docsbotCapabilityContext.map((item) => item.capability)).toEqual(
      expect.arrayContaining([
        'AI Actions, Skills, APIs, and connectors',
        'Internal knowledge agents',
        'Helpdesk ticket intelligence',
        'Presales agents and lead qualification',
        'Booking and scheduling flows',
        'Sales enablement agents',
      ]),
    )
    expect(payload.generationRequirements).toContain(
      'Do not output taxonomy tags or featureTags. Use DocsBot capabilities as generation context for open-ended use-case, role, workflow, source, and outcome text.',
    )
    expect(outputSchema.properties.agentUseCases.items.required).not.toContain('featureTags')
    expect(outputSchema.properties.agentUseCases.items.properties.featureTags).toBeUndefined()
    expect(buildMainContentOutputSchema(schema).properties.faq).toBeUndefined()
    expect(buildMainContentOutputSchema(schema).properties.buyerFaqResearch).toBeUndefined()
    expect(buildFaqOutputSchema(schema).required).toEqual(['faq', 'additionalEvidenceSources'])
    expect(buildFaqOutputSchema(schema).properties.faq.items.properties.icon).toBeUndefined()
    expect(buildFaqOutputSchema(schema).properties.faq.items.properties.sourceIds).toBeDefined()
  })

  it('calculates token and web search costs from response usage', () => {
    const usage = calculateApiUsageCost({
      model: 'gpt-5.5',
      attempt: 1,
      response: {
        usage: {
          input_tokens: 100000,
          output_tokens: 10000,
          total_tokens: 110000,
          input_tokens_details: { cached_tokens: 20000 },
          output_tokens_details: { reasoning_tokens: 1000 },
        },
        output: [{ type: 'web_search_call' }, { type: 'message', content: [] }],
      },
    })

    expect(usage).toMatchObject({
      inputTokens: 100000,
      cachedInputTokens: 20000,
      billableInputTokens: 80000,
      outputTokens: 10000,
      reasoningOutputTokens: 1000,
      totalTokens: 110000,
      webSearchCalls: 1,
      estimatedTokenCostUsd: 0.355,
      estimatedWebSearchCostUsd: 0.01,
      estimatedTotalCostUsd: 0.365,
      serviceTier: 'flex',
      reasoningEffort: 'low',
    })

    expect(aggregateApiUsage([usage]).total.estimatedTotalCostUsd).toBe(0.365)
  })

  it('requests low reasoning and prints per-call cost summaries', async () => {
    const requests = []
    const requestOptions = []
    const openaiClient = {
      responses: {
        create: async (nextRequest, options) => {
          requests.push(nextRequest)
          requestOptions.push(options)
          const isFaq = nextRequest.text.format.name === 'docsbot_industry_v2_buyer_faq'
          return {
            output_text: JSON.stringify(isFaq ? validFaqRecord() : validMainRecord()),
            usage: {
              input_tokens: 100000,
              output_tokens: 10000,
              total_tokens: 110000,
              input_tokens_details: { cached_tokens: 20000 },
              output_tokens_details: { reasoning_tokens: 1000 },
            },
            output: [{ type: 'web_search_call' }],
          }
        },
      },
    }

    const args = parseArgs(['--only', 'landscaping-services', '--dry-run', '--force'])
    args.openaiClient = openaiClient
    args.testFlexRetryDelayMs = 0
    const summary = await buildIndustryV2Content(args)

    expect(requests.map((request) => request.reasoning)).toEqual([{ effort: 'low' }, { effort: 'low' }])
    expect(requests.map((request) => request.service_tier)).toEqual(['flex', 'flex'])
    expect(requestOptions.map((options) => options.timeout)).toEqual([
      OPENAI_REQUEST_TIMEOUT_MS,
      OPENAI_REQUEST_TIMEOUT_MS,
    ])
    expect(summary.apiCalls).toHaveLength(2)
    expect(summary.apiCalls[0]).toMatchObject({
      slug: 'landscaping-services',
      step: 'main-content',
      serviceTier: 'flex',
      estimatedTotalCostUsd: 0.365,
      webSearchCalls: 1,
    })
    expect(summary.apiCalls[1]).toMatchObject({
      slug: 'landscaping-services',
      step: 'faq',
      serviceTier: 'flex',
      estimatedTotalCostUsd: 0.365,
      webSearchCalls: 1,
    })
    expect(summary.estimatedCostUsd.estimatedTotalCostUsd).toBe(0.73)
  })

  it('retries transient flex resource errors with retry-after and long timeout', async () => {
    const requests = []
    const requestOptions = []
    const openaiClient = {
      responses: {
        create: async (nextRequest, options) => {
          requests.push(nextRequest)
          requestOptions.push(options)
          if (requests.length <= 3) {
            const error = new Error('Resource unavailable for flex processing')
            error.status = 429
            error.headers = { 'retry-after': '0' }
            throw error
          }
          const isFaq = nextRequest.text.format.name === 'docsbot_industry_v2_buyer_faq'
          return {
            output_text: JSON.stringify(isFaq ? validFaqRecord() : validMainRecord()),
            usage: {
              input_tokens: 1000,
              output_tokens: 100,
              total_tokens: 1100,
            },
            output: [],
          }
        },
      },
    }

    const args = parseArgs(['--only', 'landscaping-services', '--dry-run', '--force'])
    args.openaiClient = openaiClient
    args.testFlexRetryDelayMs = 0
    const summary = await buildIndustryV2Content(args)

    expect(requests).toHaveLength(5)
    expect(requests.map((request) => request.service_tier)).toEqual(['flex', 'flex', 'flex', 'flex', 'flex'])
    expect(requestOptions.map((options) => options.timeout)).toEqual(Array(5).fill(OPENAI_REQUEST_TIMEOUT_MS))
    expect(summary.generated).toEqual(['landscaping-services'])
    expect(summary.failed).toEqual([])
  })

  it('uses a one-minute minimum delay for flex capacity retries', () => {
    expect(FLEX_RETRY_DELAY_MS).toBe(60000)
  })

  it('model schema may include warnings, but saved schema output does not', async () => {
    const requests = []
    const recordWithWarnings = validMainRecord({
      generationMeta: {
        ...validRecord().generationMeta,
        warnings: ['model-side warning that should not be saved'],
      },
    })
    const openaiClient = {
      responses: {
        create: async (nextRequest) => {
          requests.push(nextRequest)
          const isFaq = nextRequest.text.format.name === 'docsbot_industry_v2_buyer_faq'
          return {
            output_text: JSON.stringify(isFaq ? validFaqRecord() : recordWithWarnings),
            usage: {
              input_tokens: 1000,
              output_tokens: 100,
              total_tokens: 1100,
            },
            output: [],
          }
        },
      },
    }

    const args = parseArgs(['--only', 'landscaping-services', '--dry-run', '--force'])
    args.openaiClient = openaiClient
    const summary = await buildIndustryV2Content(args)

    expect(requests[0].text.format.schema.properties.generationMeta.properties.warnings).toBeDefined()
    expect(schema.properties.generationMeta.properties.warnings).toBeUndefined()
    expect(summary.generated).toEqual(['landscaping-services'])
    expect(summary.apiCalls).toHaveLength(2)
    expect(summary.apiCalls[0].estimatedTotalCostUsd).toBeGreaterThan(0)
  })

  it('documents web search boundaries in the system prompt', () => {
    const instructions = buildInstructions()

    expect(instructions).toContain('Do not use web search for DocsBot product context')
    expect(instructions).toContain('Use web search only for external evidence')
    expect(instructions).toContain('AI Actions')
  })
})
