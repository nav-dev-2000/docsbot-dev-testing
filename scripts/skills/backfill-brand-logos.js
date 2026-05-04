#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const LOGO_MODES = new Set(['light', 'dark', 'has_opaque_background'])

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
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

function selectBrandLogoForLightSurface(brand = {}) {
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

function selectBrandIconForLightSurface(brand = {}) {
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

function getCacheEntry(cache, record) {
  return (
    cache.entries?.[record.domain] ||
    cache.entries?.[record.brand?.domain] ||
    cache.entries?.[record.slug] ||
    null
  )
}

function buildIndexRecord(record) {
  return {
    slug: record.slug,
    name: record.name,
    domain: record.domain,
    category: record.category,
    trutoCategory: record.trutoCategory,
    availability: record.availability,
    statusLabel: record.statusLabel,
    h1: record.h1,
    metaTitle: record.metaTitle,
    metaDescription: record.metaDescription,
    intro: record.intro,
    brand: {
      title: record.brand?.title || '',
      domain: record.brand?.domain || '',
      logoUrl: record.brand?.logoUrl || '',
      iconUrl: record.brand?.iconUrl || '',
      preferredLogo: record.brand?.preferredLogo || null,
      preferredIcon: record.brand?.preferredIcon || null,
      primaryColor: record.brand?.primaryColor || '',
      accentColor: record.brand?.accentColor || '',
      backdropUrl: record.brand?.backdropUrl || '',
      cacheStatus: record.brand?.cacheStatus || 'missing',
    },
  }
}

function main() {
  const outDirArgIndex = process.argv.indexOf('--out-dir')
  const outDir =
    outDirArgIndex >= 0 && process.argv[outDirArgIndex + 1]
      ? process.argv[outDirArgIndex + 1]
      : 'src/data/skills'
  const dataDir = path.resolve(process.cwd(), outDir)
  const integrationsDir = path.join(dataDir, 'integrations')
  const cachePath = path.join(dataDir, 'brand-cache.json')
  const indexPath = path.join(dataDir, 'integrations.index.json')
  const cache = readJson(cachePath, { entries: {} })
  const index = readJson(indexPath, null)

  if (!fs.existsSync(integrationsDir)) {
    throw new Error(`Missing integrations directory: ${integrationsDir}`)
  }

  let updated = 0
  let unchanged = 0
  let missingCache = 0
  let missingLogo = 0

  const files = fs.readdirSync(integrationsDir).filter((file) => file.endsWith('.json')).sort()
  const recordsBySlug = new Map()

  files.forEach((file) => {
    const filePath = path.join(integrationsDir, file)
    const record = readJson(filePath, null)
    if (!record?.slug || !record.brand) return

    const cachedBrand = getCacheEntry(cache, record)?.brand
    if (!cachedBrand?.logos?.length) {
      missingCache += 1
      recordsBySlug.set(record.slug, record)
      return
    }

    const logoVariants = cachedBrand.logos.map(normalizeLogoVariant).filter(Boolean)
    const preferredLogo = selectBrandLogoForLightSurface({
      ...record.brand,
      logoVariants,
    })
    const preferredIcon = selectBrandIconForLightSurface({
      ...record.brand,
      logoVariants,
    })

    if (!preferredLogo.url && !preferredIcon.url) {
      missingLogo += 1
      recordsBySlug.set(record.slug, record)
      return
    }

    const nextRecord = {
      ...record,
      brand: {
        ...record.brand,
        logoVariants,
        preferredLogo,
        preferredIcon,
      },
    }

    if (JSON.stringify(nextRecord.brand.logoVariants) !== JSON.stringify(record.brand.logoVariants) ||
      JSON.stringify(nextRecord.brand.preferredLogo) !== JSON.stringify(record.brand.preferredLogo) ||
      JSON.stringify(nextRecord.brand.preferredIcon) !== JSON.stringify(record.brand.preferredIcon)) {
      writeJson(filePath, nextRecord)
      updated += 1
    } else {
      unchanged += 1
    }

    recordsBySlug.set(record.slug, nextRecord)
  })

  if (index?.records?.length) {
    const nextIndex = {
      ...index,
      records: index.records.map((record) => buildIndexRecord(recordsBySlug.get(record.slug) || record)),
    }
    writeJson(indexPath, nextIndex)
  }

  console.log(
    `Backfilled brand logos: ${updated} updated, ${unchanged} unchanged, ${missingCache} missing cache, ${missingLogo} missing logo.`,
  )
}

main()
