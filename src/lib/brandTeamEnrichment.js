import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { retrieveBrandByDomain, retrieveBrandByEmail } from '@/utils/crawlHelpers'
import { getTeam } from '@/lib/dbQueries'

/** Matches auto-generated team names: "X's Team" or "X's Team 2" */
const isDefaultTeamName = (name) =>
  typeof name === 'string' &&
  name.trim().length > 0 &&
  /^.+'s Team(\s+\d+)?$/.test(name.trim())

const isColorLight = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return false
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6 && hex.length !== 8) return false
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Selects the best icon URL from brand.dev logos for small square display (e.g. team avatar).
 * Same logic as onboarding.jsx selectBestIconForTeam.
 */
const selectBestIconForTeam = (logos, backgroundColor) => {
  if (!logos || logos.length === 0) return ''
  const iconLogos = logos.filter((logo) => logo.type === 'icon')
  if (iconLogos.length === 0) return ''
  const isLight = isColorLight(backgroundColor)
  const targetMode = isLight ? 'light' : 'dark'
  const matching = iconLogos.find((logo) => logo.mode === targetMode)
  if (matching) return matching.url
  const opaque = iconLogos.find((logo) => logo.mode === 'has_opaque_background')
  if (opaque) return opaque.url
  return iconLogos[0]?.url || ''
}

/**
 * Build team update payload from brand.dev response.
 * Mirrors onboarding first-bot logic: name, logo, colors.
 */
function buildTeamPayloadFromBrand(brand, existingTeam) {
  const payload = {}
  const companyName = (brand?.title || '').trim()

  if (
    isDefaultTeamName(existingTeam?.name) &&
    companyName &&
    companyName.length >= 2 &&
    companyName.length <= 100
  ) {
    payload.name = companyName
  }

  if (!existingTeam?.logo && brand?.logos?.length > 0) {
    const teamIconUrl = selectBestIconForTeam(brand.logos, '#f3f4f6')
    if (teamIconUrl && typeof teamIconUrl === 'string' && teamIconUrl.trim()) {
      payload.logo = teamIconUrl.trim()
    }
  }

  if (brand?.colors?.length > 0) {
    const hexColors = brand.colors
      .map((c) => (typeof c === 'string' ? c : c?.hex))
      .filter((h) => h && /^#[0-9A-Fa-f]{6}$/.test(h))
    if (hexColors.length > 0) {
      payload.colors = hexColors
    }
  }

  return payload
}

/**
 * Extract hostname from URL or domain string.
 */
function extractDomainFromSite(site) {
  if (!site || typeof site !== 'string') return null
  const trimmed = site.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return url.hostname.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

/**
 * Enrich a newly created team with brand data from domain or email.
 * - Tries retrieveBrandByDomain(domain) first if domain is set
 * - If that fails, tries retrieveBrandByEmail(email); 422 (non-business email) is fine, proceed
 * - Updates team with name, logo, colors from brand
 * Does not throw; logs and returns on any failure.
 */
export async function enrichTeamWithBrand(teamId, { domain, email }) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let brand = null
  const domainToTry = extractDomainFromSite(domain)

  if (domainToTry) {
    brand = await retrieveBrandByDomain(domainToTry)
  }

  if (!brand && email) {
    const result = await retrieveBrandByEmail(email)
    if (result.success && result.brand) {
      brand = result.brand
    }
    if (result.httpStatus === 422) {
      // Non-business email, expected - proceed without brand
      return
    }
  }

  if (!brand) return

  const team = await getTeam(teamId)
  if (!team) return

  const payload = buildTeamPayloadFromBrand(brand, team)
  if (Object.keys(payload).length === 0) return

  try {
    await firestore.collection('teams').doc(teamId).update(payload)
  } catch (err) {
    console.warn('Could not enrich team with brand:', err?.message)
  }
}
