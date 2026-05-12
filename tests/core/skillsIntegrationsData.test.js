import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  getRelatedSkills,
  getSkillCategoryCounts,
  getSkillIntegrationBySlug,
  getSkillsIndexRecords,
  isPageReadySkillDetail,
  isPageReadySkillRecord,
  selectBrandLogoForLightSurface,
} from '@/lib/skillsIntegrations.mjs'

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

const brand = {
  cacheStatus: 'ok',
  title: 'Zendesk',
  domain: 'zendesk.com',
  logoUrl: 'https://example.com/logo.svg',
  iconUrl: 'https://example.com/icon.svg',
  primaryColor: '#123456',
  accentColor: '#abcdef',
}

function record(overrides = {}) {
  return {
    slug: 'zendesk',
    name: 'Zendesk',
    domain: 'zendesk.com',
    category: 'Customer Support',
    trutoCategory: 'Helpdesk',
    availability: 'build',
    statusLabel: 'Available',
    h1: 'Build Zendesk AI Agents',
    metaTitle: 'Build Zendesk AI Agents with DocsBot',
    metaDescription: 'Build secure AI agents that work with Zendesk for support and internal workflows.',
    intro: 'Create a DocsBot Skill for Zendesk so your agent can answer questions and take safe action.',
    supportUseCases: ['Look up ticket status for a customer.'],
    internalUseCases: ['Summarize Zendesk tickets for employees.'],
    whatYouCanBuild: ['A ticket lookup assistant.'],
    howItWorks: [{ title: 'Describe it', description: 'Skill Builder designs and tests the Skill.' }],
    faq: [{ question: 'How can I build a Zendesk AI agent?', answer: 'Use DocsBot Skill Builder.' }],
    relatedSlugs: [],
    brand,
    ...overrides,
  }
}

describe('skills integration data helpers', () => {
  it('filters index records to page-ready branded records', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-data-'))
    writeJson(path.join(dataDir, 'integrations.index.json'), {
      records: [
        record(),
        record({ slug: 'missing-brand', name: 'Missing Brand', brand: { cacheStatus: 'error' } }),
      ],
    })

    const records = getSkillsIndexRecords({ dataDir })

    expect(records).toHaveLength(1)
    expect(records[0].slug).toBe('zendesk')
  })

  it('loads detail records by slug only when the final shape is complete', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-data-'))
    writeJson(path.join(dataDir, 'integrations/zendesk.json'), record())
    writeJson(path.join(dataDir, 'integrations/broken.json'), record({ slug: 'broken', faq: [] }))

    expect(getSkillIntegrationBySlug('zendesk', { dataDir })).toMatchObject({ slug: 'zendesk' })
    expect(getSkillIntegrationBySlug('broken', { dataDir })).toBeNull()
    expect(getSkillIntegrationBySlug('../zendesk', { dataDir })).toBeNull()
  })

  it('loads embedded logo variants without reading brand cache at build time', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-data-'))
    writeJson(
      path.join(dataDir, 'integrations/zendesk.json'),
      record({
        brand: {
          ...brand,
          logoVariants: [
            {
              url: 'https://example.com/light-logo.png',
              mode: 'light',
              type: 'logo',
              width: 300,
              height: 50,
              aspectRatio: 6,
            },
          ],
          preferredLogo: {
            url: 'https://example.com/light-logo.png',
            mode: 'light',
            type: 'logo',
            width: 300,
            height: 50,
            aspectRatio: 6,
          },
        },
      }),
    )

    const detail = getSkillIntegrationBySlug('zendesk', { dataDir })

    expect(detail.brand.logoVariants).toHaveLength(1)
    expect(detail.brand.preferredLogo).toMatchObject({
      url: 'https://example.com/light-logo.png',
      mode: 'light',
      type: 'logo',
    })
  })

  it('prefers logo assets over icons even when the logo requires a dark surface', () => {
    expect(
      selectBrandLogoForLightSurface({
        logoUrl: 'https://example.com/fallback.png',
        logoVariants: [
          {
            url: 'https://example.com/icon.jpg',
            mode: 'has_opaque_background',
            type: 'icon',
            aspectRatio: 1,
          },
          {
            url: 'https://example.com/dark-logo.png',
            mode: 'dark',
            type: 'logo',
            aspectRatio: 6,
          },
        ],
      }),
    ).toMatchObject({
      url: 'https://example.com/dark-logo.png',
      mode: 'dark',
      type: 'logo',
    })
  })

  it('counts categories and resolves related skills with fallback behavior', () => {
    const records = [
      record(),
      record({ slug: 'freshdesk', name: 'Freshdesk' }),
      record({ slug: 'slack', name: 'Slack', category: 'Communications' }),
    ]

    expect(getSkillCategoryCounts(records)).toEqual([
      { name: 'Customer Support', count: 2 },
      { name: 'Communications', count: 1 },
    ])

    expect(
      getRelatedSkills(record({ relatedSlugs: ['slack'] }), records).map((item) => item.slug),
    ).toEqual(['slack', 'freshdesk'])
  })

  it('identifies page-ready index and detail records', () => {
    expect(isPageReadySkillRecord(record())).toBe(true)
    expect(isPageReadySkillDetail(record())).toBe(true)
    expect(isPageReadySkillRecord(record({ brand: { cacheStatus: 'error' } }))).toBe(false)
    expect(isPageReadySkillDetail(record({ howItWorks: [] }))).toBe(false)
  })
})
