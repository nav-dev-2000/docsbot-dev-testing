import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  buildIntegrationIndexRecord,
  buildIntegrationRecord,
  cleanGeneratedMetadata,
  defaultGeneratedMetadata,
  findTextMaxLengthPaths,
  generateMetadataWithOpenAi,
  isTransientBrandError,
  isUsableBrand,
  mapTrutoCategoryToSkillCategory,
  mergeManualIntegrations,
  metadataJsonSchema,
  normalizeBrandForPage,
  normalizeDomain,
  parseTrutoIntegrations,
  parseGeneratedMetadataResult,
  parseRetryAfterMs,
  resolveDomain,
  selectRecords,
  shouldFallbackBrandLookupByName,
  shouldFetchBrandCacheEntry,
  slugify,
  validateGeneratedCopyQuality,
  validateFaqSearchIntent,
  validateIntegrationRecord,
  validateWrittenIntegrationData,
  writeSplitIntegrationData,
} from '../../scripts/skills/generate-skills-integrations'

const sampleHtml = `
  <a href="/integrations/detail/zendesk/" class="integration-card" data-category="Helpdesk">
    <div class="integration-card-row">
      <img src="https://files-public.truto.one/zendesk" alt="" width="20" height="20" loading="lazy" class="integration-card-icon">
      <span class="integration-card-label">Zendesk</span>
    </div>
    <div class="integration-card-meta">
      <span class="integration-card-category">Helpdesk</span>
    </div>
  </a>
  <a href="/integrations/detail/clearbooks/" class="integration-card" data-category="Accounting">
    <div class="integration-card-row">
      <span class="integration-card-label">ClearBooks</span>
    </div>
    <div class="integration-card-meta">
      <span class="integration-card-category">Accounting</span>
      <span class="integration-badge integration-badge-request">Built on request</span>
    </div>
  </a>
  <a href="/integrations/detail/blackline/" class="integration-card" data-category="Accounting">
    <div class="integration-card-row">
      <span class="integration-card-label">BlackLine</span>
      <span class="integration-badge integration-badge-beta">Beta</span>
    </div>
    <div class="integration-card-meta">
      <span class="integration-card-category">Accounting</span>
    </div>
  </a>
`

describe('skills integration generator helpers', () => {
  it('normalizes integration slugs', () => {
    expect(slugify('Dropbox - Business')).toBe('dropbox-business')
    expect(slugify('Sage Business Cloud Accounting')).toBe(
      'sage-business-cloud-accounting',
    )
    expect(slugify('Monday.com')).toBe('monday-com')
    expect(slugify('Dropbox Sign (HelloSign)')).toBe('dropbox-sign-hellosign')
  })

  it('parses Truto integration cards from rendered HTML', () => {
    const records = parseTrutoIntegrations(sampleHtml)

    expect(records).toHaveLength(3)
    expect(records[0]).toMatchObject({
      slug: 'zendesk',
      name: 'Zendesk',
      trutoCategory: 'Helpdesk',
      trutoDetailUrl: 'https://truto.one/integrations/detail/zendesk/',
      trutoIconUrl: 'https://files-public.truto.one/zendesk',
      statusLabel: 'Available',
    })
    expect(records[1]).toMatchObject({
      slug: 'clearbooks',
      statusLabel: 'Built on request',
    })
    expect(records[2]).toMatchObject({
      slug: 'blackline',
      statusLabel: 'Beta',
    })
  })

  it('maps Truto categories to DocsBot skill categories', () => {
    expect(mapTrutoCategoryToSkillCategory('Helpdesk')).toBe('Customer Support')
    expect(mapTrutoCategoryToSkillCategory('Payment Gateway')).toBe(
      'Payments & Billing',
    )
    expect(mapTrutoCategoryToSkillCategory('Unknown')).toBe('Automation')
  })

  it('merges manually seeded WordPress plugin integrations into the process list', () => {
    const records = mergeManualIntegrations(parseTrutoIntegrations(sampleHtml))
    const slugs = records.map((record) => record.slug)

    expect(slugs).toEqual(
      expect.arrayContaining([
        'easy-digital-downloads',
        'freemius',
        'memberpress',
        'paid-memberships-pro',
        'restrict-content-pro',
        'surecart',
      ]),
    )
    expect(resolveDomain({ slug: 'easy-digital-downloads' })).toBe(
      'easydigitaldownloads.com',
    )
    expect(resolveDomain({ slug: 'freemius' })).toBe('freemius.com')
  })

  it('resolves domains with overrides before guessing', () => {
    expect(resolveDomain({ slug: 'monday-com' })).toBe('monday.com')
    expect(resolveDomain({ slug: 'monday-com-scim' })).toBe('monday.com')
    expect(resolveDomain({ slug: 'help-scout' })).toBe('helpscout.com')
    expect(resolveDomain({ slug: 'unknown-product' })).toBe('unknown-product.com')
    expect(normalizeDomain('https://www.example.com/path')).toBe('example.com')
  })

  it('selects a mixed pilot sample when requested', () => {
    const records = [
      { slug: 'akoya' },
      { slug: 'zendesk' },
      { slug: 'slack' },
      { slug: 'moneybird' },
    ]

    expect(selectRecords(records, { sample: 'mixed', limit: 3 })).toEqual([
      { slug: 'zendesk' },
      { slug: 'slack' },
      { slug: 'moneybird' },
    ])
  })

  it('normalizes successful brand.dev data for page use', () => {
    const brand = normalizeBrandForPage({
      domain: 'www.example.com',
      title: 'Example',
      description: 'Example description',
      slogan: 'Example slogan',
      colors: [
        { hex: '#111111', name: 'Black' },
        { hex: '#22CCAA', name: 'Accent' },
      ],
      logos: [
        { url: 'https://cdn.example.com/icon.svg', type: 'icon', mode: 'dark' },
        { url: 'https://cdn.example.com/logo.svg', type: 'logo', mode: 'light' },
      ],
      backdrops: [{ url: 'https://cdn.example.com/header.jpg' }],
      industries: ['Software'],
      links: { pricing: 'https://example.com/pricing' },
    })

    expect(brand).toMatchObject({
      cacheStatus: 'ok',
      domain: 'example.com',
      logoUrl: 'https://cdn.example.com/logo.svg',
      iconUrl: 'https://cdn.example.com/icon.svg',
      primaryColor: '#111111',
      accentColor: '#22CCAA',
      backdropUrl: 'https://cdn.example.com/header.jpg',
      industries: ['Software'],
    })
  })

  it('normalizes failed brand cache entries without breaking final records', () => {
    const brand = normalizeBrandForPage({
      isError: true,
      status: 404,
      message: 'Not found',
    })

    expect(brand).toMatchObject({
      cacheStatus: 'error',
      logoUrl: '',
      primaryColor: '',
    })
  })

  it('distinguishes usable brand data from missing or transient brand errors', () => {
    expect(isUsableBrand({ title: 'Slack', domain: 'slack.com' })).toBe(true)
    expect(isUsableBrand({ isError: true, status: 404 })).toBe(false)
    expect(isTransientBrandError({ isError: true, status: 429 })).toBe(true)
    expect(isTransientBrandError({ isError: true, status: 0 })).toBe(true)
    expect(isTransientBrandError({ isError: true, status: 404 })).toBe(false)
  })

  it('parses retry-after headers for rate-limited brand lookups', () => {
    expect(parseRetryAfterMs('2')).toBe(2000)
    expect(parseRetryAfterMs('bad-value')).toBe(0)
  })

  it('falls back to company-name brand lookup only for permanent domain misses', () => {
    expect(
      shouldFallbackBrandLookupByName({
        status: 400,
        message: 'Domain branding not present (DNS resolution failed)',
      }),
    ).toBe(true)
    expect(
      shouldFallbackBrandLookupByName({
        status: 404,
        message: 'Brand not found for domain',
      }),
    ).toBe(true)
    expect(
      shouldFallbackBrandLookupByName({
        status: 429,
        message: 'Rate limit exceeded',
      }),
    ).toBe(false)
  })

  it('reuses successful and failed brand-cache entries unless refresh is requested', () => {
    expect(
      shouldFetchBrandCacheEntry({
        brand: {
          domain: 'zendesk.com',
          title: 'Zendesk',
        },
      }),
    ).toBe(false)
    expect(
      shouldFetchBrandCacheEntry({
        brand: {
          isError: true,
          status: 404,
        },
      }),
    ).toBe(true)
    expect(shouldFetchBrandCacheEntry(null)).toBe(true)
    expect(
      shouldFetchBrandCacheEntry(
        {
          brand: {
            isError: true,
            status: 429,
          },
        },
      ),
    ).toBe(true)
    expect(
      shouldFetchBrandCacheEntry({
        lookupMethod: 'domain_then_name',
        brand: {
          isError: true,
          status: 404,
        },
      }),
    ).toBe(false)
  })

  it('builds and validates a final integration record', () => {
    const record = buildIntegrationRecord(
      {
        slug: 'zendesk',
        name: 'Zendesk',
        trutoCategory: 'Helpdesk',
        statusLabel: 'Available',
      },
      {
        domain: 'zendesk.com',
        brand: {
          domain: 'zendesk.com',
          title: 'Zendesk',
          description: 'Customer service software',
          colors: [{ hex: '#03363D', name: 'Green' }],
          logos: [{ url: 'https://example.com/logo.svg', type: 'logo' }],
        },
      },
    )

    expect(record).toMatchObject({
      slug: 'zendesk',
      category: 'Customer Support',
      availability: 'install',
      brand: {
        cacheStatus: 'ok',
        primaryColor: '#03363D',
      },
    })
    expect(validateIntegrationRecord(record)).toEqual({ valid: true, errors: [] })
  })

  it('builds a lightweight index record without full landing page arrays', () => {
    const record = buildIntegrationRecord(
      {
        slug: 'slack',
        name: 'Slack',
        trutoCategory: 'IM',
        statusLabel: 'Available',
      },
      {
        domain: 'slack.com',
        brand: {
          domain: 'slack.com',
          title: 'Slack',
          colors: [{ hex: '#34c4f3', name: 'Blue' }],
          logos: [{ url: 'https://example.com/slack.svg', type: 'logo' }],
        },
      },
    )

    const indexRecord = buildIntegrationIndexRecord(record)

    expect(indexRecord).toMatchObject({
      slug: 'slack',
      name: 'Slack',
      category: 'Communications',
      brand: {
        title: 'Slack',
        logoUrl: 'https://example.com/slack.svg',
        primaryColor: '#34c4f3',
      },
    })
    expect(indexRecord.supportUseCases).toBeUndefined()
    expect(indexRecord.faq).toBeUndefined()
  })

  it('writes one JSON file per integration plus a lightweight index', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-integrations-'))
    const records = [
      buildIntegrationRecord({
        slug: 'zendesk',
        name: 'Zendesk',
        trutoCategory: 'Helpdesk',
        statusLabel: 'Available',
      }),
      buildIntegrationRecord({
        slug: 'slack',
        name: 'Slack',
        trutoCategory: 'IM',
        statusLabel: 'Available',
      }),
    ]

    writeSplitIntegrationData({
      outDir,
      records,
      sourceUrl: 'https://truto.one/integrations',
      generatedAt: '2026-05-01T00:00:00.000Z',
    })

    const index = JSON.parse(
      fs.readFileSync(path.join(outDir, 'integrations.index.json'), 'utf8'),
    )
    const zendesk = JSON.parse(
      fs.readFileSync(path.join(outDir, 'integrations/zendesk.json'), 'utf8'),
    )

    expect(index).toMatchObject({
      count: 2,
      records: [
        { slug: 'slack', category: 'Communications' },
        { slug: 'zendesk', category: 'Customer Support' },
      ],
    })
    expect(index.records[0].faq).toBeUndefined()
    expect(zendesk).toMatchObject({
      slug: 'zendesk',
      faq: expect.any(Array),
      supportUseCases: expect.any(Array),
    })
    expect(fs.existsSync(path.join(outDir, 'integrations/slack.json'))).toBe(true)
    expect(
      validateWrittenIntegrationData({
        indexPath: path.join(outDir, 'integrations.index.json'),
        integrationsDir: path.join(outDir, 'integrations'),
      }),
    ).toEqual({ valid: true, errors: [] })
  })

  it('reports final written JSON files that cannot be parsed', () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-integrations-'))
    fs.mkdirSync(path.join(outDir, 'integrations'), { recursive: true })
    fs.writeFileSync(path.join(outDir, 'integrations.index.json'), '{"records":[]}')
    fs.writeFileSync(path.join(outDir, 'integrations/broken.json'), '{bad json')

    const validation = validateWrittenIntegrationData({
      indexPath: path.join(outDir, 'integrations.index.json'),
      integrationsDir: path.join(outDir, 'integrations'),
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toEqual([
      expect.stringContaining('broken.json could not be parsed'),
    ])
  })

  it('reports invalid final records', () => {
    const validation = validateIntegrationRecord({
      slug: '',
      category: 'Nope',
      supportUseCases: [],
      internalUseCases: [],
      whatYouCanBuild: [],
      howItWorks: [],
      faq: [],
      relatedSlugs: [],
    })

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain('slug is required')
    expect(validation.errors).toContain(
      'category must be one of the DocsBot skill categories',
    )
  })

  it('flags malformed generated copy that passes JSON parsing', () => {
    const errors = validateGeneratedCopyQuality({
      h1: 'Zendesk AI Skill',
      metaTitle: 'Zendesk AI Skill for DocsBot',
      metaDescription: 'Build a DocsBot Skill for Zendesk,',
      intro: 'Use this skill for support workflows.',
      supportUseCases: [
        'Help identify missing information before escalation\",\"Suggest broken copy',
        "Add an internal note to a ticket.','Trigger an approved escalation.'],'internalUseCases':['Employees can chat with an agent.",
      ],
      internalUseCases: [],
      whatYouCanBuild: ['MoveaVeryLongSuspiciousConcatenatedTokenWithoutSpacesInCopy'],
      howItWorks: [],
      faq: [],
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        'metaDescription ends with dangling punctuation',
        'supportUseCases[0] contains escaped or embedded JSON fragments',
        'supportUseCases[1] contains escaped or embedded JSON fragments',
        'whatYouCanBuild[0] contains a suspiciously long token',
      ]),
    )
  })

  it('reports malformed final metadata JSON before building records', () => {
    const record = {
      slug: 'zendesk',
      name: 'Zendesk',
      trutoCategory: 'Helpdesk',
      statusLabel: 'Available',
    }

    expect(parseGeneratedMetadataResult('{bad json', record, null)).toMatchObject({
      valid: false,
      metadata: null,
      errors: [expect.stringContaining('OpenAI returned invalid JSON for zendesk')],
    })
  })

  it('retries OpenAI metadata generation when final JSON parsing fails', async () => {
    const record = {
      slug: 'zendesk',
      name: 'Zendesk',
      trutoCategory: 'Helpdesk',
      statusLabel: 'Available',
    }
    const validMetadata = defaultGeneratedMetadata(record)
    let calls = 0
    const openaiClient = {
      responses: {
        create: async () => {
          calls += 1
          return {
            output_text: calls === 1 ? '{bad json' : JSON.stringify(validMetadata),
          }
        },
      },
    }

    const result = await generateMetadataWithOpenAi(record, null, { openaiClient })

    expect(calls).toBe(2)
    expect(result).toMatchObject({
      h1: 'Zendesk AI Agent Skill',
      category: 'Customer Support',
    })
  })

  it('cleans obvious dangling punctuation in generated metadata', () => {
    const cleaned = cleanGeneratedMetadata({
      metaDescription: 'Build an AI support agent for Slack,',
      faq: [
        {
          question: 'How can an AI agent use Slack?',
          answer: 'It can summarize channels and trigger approved workflows:',
        },
      ],
    })

    expect(cleaned).toEqual({
      metaDescription: 'Build an AI support agent for Slack.',
      faq: [
        {
          question: 'How can an AI agent use Slack?',
          answer: 'It can summarize channels and trigger approved workflows.',
        },
      ],
    })
  })

  it('rejects FAQs about whether a skill exists or is prebuilt', () => {
    const errors = validateFaqSearchIntent([
      {
        question: 'Is this Slack skill prebuilt in DocsBot?',
        answer: 'Bad question shape.',
      },
      {
        question: 'How can I build an AI agent that uses Slack for support handoffs?',
        answer: 'Good question shape.',
      },
    ])

    expect(errors).toEqual([
      'faq[0].question asks about product availability instead of search intent',
    ])
  })

  it('does not hard cap generated text fields in the strict schema', () => {
    expect(findTextMaxLengthPaths(metadataJsonSchema())).toEqual([])
  })
})
