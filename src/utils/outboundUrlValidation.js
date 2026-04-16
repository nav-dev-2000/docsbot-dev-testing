/**
 * Server-side outbound URL checks to reduce SSRF when the app fetches user-influenced URLs.
 * Uses hostname literal checks, common private IPv4/IPv6 ranges, and DNS resolution
 * (all A/AAAA records must be public) to mitigate DNS rebinding to loopback/private IPs.
 */

import dns from 'node:dns/promises'
import net from 'node:net'

export const MAX_OUTBOUND_URL_LENGTH = 8192

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.local',
  '.internal',
  '.localhost',
  '.lan',
  '.corp',
  '.home.arpa',
  '.svc.cluster.local',
]

const BLOCKED_HOSTNAMES_EXACT = new Set([
  'localhost',
  'metadata.google.internal',
  'kubernetes',
])

const PROTOCOL_ERROR = 'Only http and https URLs are allowed.'
const AUTH_IN_URL_ERROR = 'URLs with embedded credentials are not allowed.'
const LENGTH_ERROR = 'URL is too long.'
const PARSE_ERROR = 'Invalid URL.'
const BLOCKED_HOST_ERROR = 'Host is not allowed for outbound requests.'
const BLOCKED_ADDRESS_ERROR =
  'Address is not allowed for outbound requests (private or reserved network).'
const DNS_ERROR = 'Host could not be resolved or resolves to a non-public address.'

/**
 * @param {string} urlString
 * @returns {{ valid: true, normalizedUrl: string } | { valid: false, error: string }}
 */
export function validateOutboundFetchUrlSync(urlString) {
  if (urlString == null || typeof urlString !== 'string') {
    return { valid: false, error: PARSE_ERROR }
  }
  const trimmed = urlString.trim()
  if (!trimmed) {
    return { valid: false, error: PARSE_ERROR }
  }
  if (trimmed.length > MAX_OUTBOUND_URL_LENGTH) {
    return { valid: false, error: LENGTH_ERROR }
  }

  let url
  try {
    url = new URL(trimmed)
  } catch {
    return { valid: false, error: PARSE_ERROR }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { valid: false, error: PROTOCOL_ERROR }
  }

  if (url.username || url.password) {
    return { valid: false, error: AUTH_IN_URL_ERROR }
  }

  const hostname = url.hostname.toLowerCase()

  if (BLOCKED_HOSTNAMES_EXACT.has(hostname)) {
    return { valid: false, error: BLOCKED_HOST_ERROR }
  }

  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (hostname === suffix.slice(1) || hostname.endsWith(suffix)) {
      return { valid: false, error: BLOCKED_HOST_ERROR }
    }
  }

  const ipVersion = net.isIP(hostname)
  if (ipVersion === 4) {
    return isPublicIPv4String(hostname)
      ? { valid: true, normalizedUrl: url.toString() }
      : { valid: false, error: BLOCKED_ADDRESS_ERROR }
  }
  if (ipVersion === 6) {
    return isPublicIPv6String(hostname)
      ? { valid: true, normalizedUrl: url.toString() }
      : { valid: false, error: BLOCKED_ADDRESS_ERROR }
  }

  return { valid: true, normalizedUrl: url.toString() }
}

/**
 * Same as sync validation, then ensures hostname (when not a literal IP) resolves only to public IPs.
 *
 * @param {string} urlString
 * @returns {Promise<{ valid: true, normalizedUrl: string } | { valid: false, error: string }>}
 */
export async function validateOutboundFetchUrl(urlString) {
  const sync = validateOutboundFetchUrlSync(urlString)
  if (!sync.valid) {
    return sync
  }

  let hostname
  try {
    hostname = new URL(sync.normalizedUrl).hostname
  } catch {
    return { valid: false, error: PARSE_ERROR }
  }

  if (net.isIP(hostname)) {
    return sync
  }

  try {
    const v4 = await dns.resolve4(hostname).catch(() => [])
    const v6 = await dns.resolve6(hostname).catch(() => [])
    const addresses = [...v4, ...v6]
    if (addresses.length === 0) {
      return { valid: false, error: DNS_ERROR }
    }
    for (const addr of addresses) {
      if (!isIpPublic(addr)) {
        return { valid: false, error: DNS_ERROR }
      }
    }
  } catch {
    return { valid: false, error: DNS_ERROR }
  }

  return sync
}

/**
 * @param {string} ip
 */
export function isIpPublic(ip) {
  if (!ip || typeof ip !== 'string') return false
  const v = net.isIP(ip)
  if (v === 4) return isPublicIPv4String(ip)
  if (v === 6) return isPublicIPv6String(ip)
  return false
}

function isPublicIPv4String(ip) {
  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return false
  }
  const [a, b] = parts

  if (a === 0) return false
  if (a === 10) return false
  if (a === 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 192 && b === 0 && parts[2] === 0) return false
  if (a === 192 && b === 0 && parts[2] === 2) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  if (a === 198 && b === 51 && parts[2] === 100) return false
  if (a === 203 && b === 0 && parts[2] === 113) return false
  if (a >= 224 && a <= 239) return false
  if (a >= 240) return false

  return true
}

function isPublicIPv6String(ip) {
  const lower = ip.toLowerCase()
  if (lower === '::1') return false

  const first = lower.split(':')[0]
  const hextet = first ? parseInt(first, 16) : 0
  if (!Number.isFinite(hextet)) return false

  if (hextet >= 0xfe80 && hextet <= 0xfebf) return false
  if (hextet >= 0xfc00 && hextet <= 0xfdff) return false
  if (hextet >= 0xff00) return false

  const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (mapped) {
    return isPublicIPv4String(mapped[1])
  }

  return true
}
