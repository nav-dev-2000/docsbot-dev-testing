import crypto from 'crypto'

/** Short tag = first 6 hex chars of HMAC-SHA256(secret, domain). Cookie uses 7-day max-age + exp in value. */
const TAG_HEX_LEN = 6

export const DEMO_TRIAL_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60

const getSigningKey = () =>
  process.env.DEMO_TRIAL_SIGNING_KEY || process.env.INTERNAL_API_KEY || ''

const timingSafeEqualHex6 = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

export function demoDealTagForDomain(domain) {
  const key = getSigningKey()
  if (!key) return null
  const normalized = normalizeDomainForToken(domain)
  if (!normalized) return null
  return crypto
    .createHmac('sha256', key)
    .update(normalized)
    .digest('hex')
    .slice(0, TAG_HEX_LEN)
    .toLowerCase()
}

/**
 * @param {{ domain: string }} opts
 * @returns {string} 6 lowercase hex characters
 */
export function createDemoTrialToken({ domain }) {
  const tag = demoDealTagForDomain(domain)
  if (!tag) {
    const key = getSigningKey()
    if (!key) {
      throw new Error('DEMO_TRIAL_SIGNING_KEY or INTERNAL_API_KEY must be set to create demo trial tokens')
    }
    throw new Error('Invalid domain for demo trial token')
  }
  return tag
}

/**
 * Verify ?deal= tag matches the path domain (first 6 hex chars of HMAC).
 */
/**
 * Client-only helper: deadline for countdown from `docsbot_demo_trial` cookie (domain|tag|exp).
 * @param {string | undefined} rawCookieValue
 * @returns {Date | null}
 */
export function getDemoTrialOfferDeadlineFromCookie(rawCookieValue) {
  if (!rawCookieValue || typeof rawCookieValue !== 'string') return null
  const parts = rawCookieValue.split('|')
  if (parts.length !== 3) return null
  const exp = Number(parts[2])
  if (!Number.isFinite(exp)) return null
  const ms = exp * 1000
  if (ms <= Date.now()) return null
  return new Date(ms)
}

export function verifyDemoDealTag(tag, domain) {
  const expected = demoDealTagForDomain(domain)
  if (!expected) return false
  const t = typeof tag === 'string' ? tag.trim().toLowerCase() : ''
  if (!/^[0-9a-f]{6}$/.test(t)) return false
  return timingSafeEqualHex6(t, expected)
}

/**
 * Cookie value: `{domain}|{tag}|{expiresAtUnixSec}` so the client countdown matches server expiry.
 * @param {string} domain
 * @param {string} tag
 * @param {number} expiresAtSec - Unix seconds when the offer/cookie period ends
 */
export function buildDemoTrialCookieValue(domain, tag, expiresAtSec) {
  const normalized = normalizeDomainForToken(domain)
  if (!normalized) return null
  const t = typeof tag === 'string' ? tag.trim().toLowerCase() : ''
  if (!/^[0-9a-f]{6}$/.test(t)) return null
  const exp =
    typeof expiresAtSec === 'number' && Number.isFinite(expiresAtSec)
      ? Math.floor(expiresAtSec)
      : null
  if (exp == null) return null
  return `${normalized}|${t}|${exp}`
}

/**
 * @param {string | undefined | null} cookieValue
 * @returns {{ domain: string, expiresAtSec?: number } | null}
 */
export function verifyDemoTrialToken(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null
  const key = getSigningKey()
  if (!key) return null

  const parts = cookieValue.split('|')
  if (parts.length === 3) {
    const exp = Number(parts[2])
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    const domainRaw = parts[0]
    const tag = parts[1].trim().toLowerCase()
    const normalized = normalizeDomainForToken(domainRaw)
    if (!normalized || !/^[0-9a-f]{6}$/.test(tag)) return null
    const expected = demoDealTagForDomain(normalized)
    if (!expected || !timingSafeEqualHex6(tag, expected)) return null
    return { domain: normalized, expiresAtSec: exp }
  }

  if (parts.length === 2) {
    const domainRaw = parts[0]
    const tag = parts[1].trim().toLowerCase()
    const normalized = normalizeDomainForToken(domainRaw)
    if (!normalized || !/^[0-9a-f]{6}$/.test(tag)) return null
    const expected = demoDealTagForDomain(normalized)
    if (!expected || !timingSafeEqualHex6(tag, expected)) return null
    return { domain: normalized }
  }

  return null
}

/**
 * Normalize hostname for token payload (lowercase, no leading www., no path).
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeDomainForToken(input) {
  if (!input || typeof input !== 'string') return null
  let s = input.trim().toLowerCase()
  if (!s) return null

  if (s.includes('://')) {
    try {
      s = new URL(s).hostname
    } catch {
      return null
    }
  } else {
    s = s.split('/')[0].split(':')[0]
  }

  s = s.replace(/^www\./, '')
  if (!s || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return null
  return s
}
