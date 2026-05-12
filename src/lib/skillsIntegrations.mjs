import fs from 'fs'
import path from 'path'

import { SKILL_INTEGRATION_SLUG_PATTERN } from './skillsIntegrationPaths.mjs'

export {
  SKILL_CATEGORY_SLUG_PATTERN,
  SKILL_INTEGRATION_SLUG_PATTERN,
  getSkillIntegrationPath,
  resolveSkillCategoryNameFromSlug,
  skillCategorySlug,
} from './skillsIntegrationPaths.mjs'

export const DEFAULT_SKILLS_DATA_DIR = path.join(process.cwd(), 'src/data/skills')
export function mapSkillIntegrationToLibraryCard(record) {
  if (!record) return null

  return {
    slug: record.slug,
    name: record.name,
    domain: record.domain,
    category: record.category,
    availability: record.availability,
    description: record.metaDescription,
    brand: {
      logoUrl: record.brand.logoUrl,
      iconUrl: record.brand.iconUrl,
      preferredLogo: record.brand.preferredLogo || null,
      preferredIcon: record.brand.preferredIcon || null,
      primaryColor: record.brand.primaryColor,
      accentColor: record.brand.accentColor,
    },
  }
}
const LOGO_MODES = new Set(['light', 'dark', 'has_opaque_background'])

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function normalizeLogoVariant(logo) {
  if (!logo?.url) return null

  return {
    url: logo.url,
    type: logo.type === 'icon' ? 'icon' : 'logo',
    mode: LOGO_MODES.has(logo.mode) ? logo.mode : 'unknown',
    width: logo.resolution?.width || logo.width || null,
    height: logo.resolution?.height || logo.height || null,
    aspectRatio: logo.resolution?.aspect_ratio || logo.aspectRatio || null,
  }
}

function scoreLogoForLightSurface(logo) {
  let score = 0

  if (logo.type === 'logo') score += 100
  if (logo.type === 'icon') score += 10
  if (logo.mode === 'light') score += 40
  if (logo.mode === 'has_opaque_background') score += 28
  if (logo.mode === 'dark') score += 18
  if ((logo.aspectRatio || 0) > 1.5) score += 12
  if ((logo.aspectRatio || 0) > 3) score += 8

  return score
}

function scoreIconForLightSurface(logo) {
  let score = 0

  if (logo.type === 'icon') score += 100
  if (logo.type === 'logo') score += 10
  if (logo.mode === 'light') score += 40
  if (logo.mode === 'has_opaque_background') score += 28
  if (logo.mode === 'dark') score += 18
  if ((logo.aspectRatio || 0) >= 0.75 && (logo.aspectRatio || 0) <= 1.5) score += 14

  return score
}

export function selectBrandLogoForLightSurface(brand = {}) {
  const variants = (brand.logoVariants || [])
    .map(normalizeLogoVariant)
    .filter(Boolean)
    .sort((a, b) => scoreLogoForLightSurface(b) - scoreLogoForLightSurface(a))

  return (
    variants[0] || {
      url: brand.logoUrl || brand.iconUrl || '',
      type: brand.logoUrl ? 'logo' : 'icon',
      mode: 'unknown',
      width: null,
      height: null,
      aspectRatio: null,
    }
  )
}

export function selectBrandIconForLightSurface(brand = {}) {
  const variants = (brand.logoVariants || [])
    .map(normalizeLogoVariant)
    .filter(Boolean)
    .sort((a, b) => scoreIconForLightSurface(b) - scoreIconForLightSurface(a))

  return (
    variants[0] || {
      url: brand.iconUrl || brand.logoUrl || '',
      type: brand.iconUrl ? 'icon' : 'logo',
      mode: 'unknown',
      width: null,
      height: null,
      aspectRatio: null,
    }
  )
}

export function isUsableBrand(brand) {
  return Boolean(
    brand &&
      brand.cacheStatus === 'ok' &&
      (brand.logoUrl || brand.iconUrl) &&
      (brand.title || brand.domain),
  )
}

export function isPageReadySkillRecord(record) {
  return Boolean(
    record &&
      SKILL_INTEGRATION_SLUG_PATTERN.test(record.slug || '') &&
      record.name &&
      record.category &&
      record.h1 &&
      record.metaTitle &&
      record.metaDescription &&
      record.intro &&
      isUsableBrand(record.brand),
  )
}

export function isPageReadySkillDetail(record) {
  return Boolean(
    isPageReadySkillRecord(record) &&
      Array.isArray(record.supportUseCases) &&
      record.supportUseCases.length &&
      Array.isArray(record.internalUseCases) &&
      record.internalUseCases.length &&
      Array.isArray(record.whatYouCanBuild) &&
      record.whatYouCanBuild.length &&
      Array.isArray(record.howItWorks) &&
      record.howItWorks.length &&
      Array.isArray(record.faq) &&
      record.faq.length,
  )
}

export function getSkillsIndex({ dataDir = DEFAULT_SKILLS_DATA_DIR } = {}) {
  return readJson(path.join(dataDir, 'integrations.index.json'), {
    generatedAt: null,
    sourceUrl: '',
    count: 0,
    records: [],
  })
}

export function getSkillsIndexRecords(options = {}) {
  const index = getSkillsIndex(options)
  return (index.records || [])
    .filter(isPageReadySkillRecord)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}

export function getSkillIntegrationBySlug(slug, options = {}) {
  if (!SKILL_INTEGRATION_SLUG_PATTERN.test(slug || '')) return null

  const dataDir = options.dataDir || DEFAULT_SKILLS_DATA_DIR
  const record = readJson(path.join(dataDir, 'integrations', `${slug}.json`), null)
  return isPageReadySkillDetail(record) ? record : null
}

export function getSkillCategoryCounts(records = []) {
  return Object.entries(
    records.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1
      return acc
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function getRelatedSkills(record, records = [], limit = 6) {
  if (!record) return []

  const bySlug = new Map(records.map((item) => [item.slug, item]))
  const related = []

  ;(record.relatedSlugs || []).forEach((slug) => {
    const item = bySlug.get(slug)
    if (item && item.slug !== record.slug && !related.find((hit) => hit.slug === item.slug)) {
      related.push(item)
    }
  })

  records
    .filter((item) => item.slug !== record.slug && item.category === record.category)
    .forEach((item) => {
      if (related.length < limit && !related.find((hit) => hit.slug === item.slug)) {
        related.push(item)
      }
    })

  if (related.length < limit) {
    records
      .filter((item) => item.slug !== record.slug)
      .forEach((item) => {
        if (related.length < limit && !related.find((hit) => hit.slug === item.slug)) {
          related.push(item)
        }
      })
  }

  return related.slice(0, limit)
}
