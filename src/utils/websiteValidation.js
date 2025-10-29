const BLOCKED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'whatsapp.com',
  'telegram.org',
  'discord.com',
  'reddit.com',
  'pinterest.com',
  'snapchat.com',
  'linkedin.com',
  'line.me',
  'mixi.jp',
  'ameblo.jp',
  'pixiv.net',
  'nicovideo.jp',
  'weibo.com',
  'qq.com',
  'vk.com',
  'ok.ru',
  'mail.ru',
  'weixin.qq.com',
  'twitch.tv',
  'google.com',
  'bing.com',
  'baidu.com',
  'yahoo.com',
  'yahoo.co.jp',
  'yandex.ru',
  'duckduckgo.com',
  'gmail.com',
  'outlook.com',
  'msn.com',
  'aol.com',
  'docomo.ne.jp',
  'ezweb.ne.jp',
  'softbank.ne.jp',
  'i.softbank.jp',
  'wikipedia.org',
  'quora.com',
  'stackoverflow.com',
  'github.com',
  'medium.com',
  'apple.com',
  'microsoft.com',
  'xbox.com',
  'office.com',
  'icloud.com',
  'zoom.us',
  'amazon.com',
  'ebay.com',
  'walmart.com',
  'target.com',
  'costco.com',
  'bestbuy.com',
  'homedepot.com',
  'ikea.com',
  'etsy.com',
  'shein.com',
  'temu.com',
  'aliexpress.com',
  'alibaba.com',
  'taobao.com',
  'jd.com',
  'shopify.com',
  'airbnb.com',
  'booking.com',
  'expedia.com',
  'tripadvisor.com',
  'agoda.com',
  'hotels.com',
  'trivago.com',
  'kayak.com',
  'uber.com',
  'doordash.com',
  'paypal.com',
  'venmo.com',
  'cash.app',
  'coinbase.com',
  'robinhood.com',
  'fidelity.com',
  'schwab.com',
  'vanguard.com',
  'etrade.com',
  'tdameritrade.com',
  'americanexpress.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'capitalone.com',
  'citibank.com',
  'cnn.com',
  'nytimes.com',
  'bbc.com',
  'foxnews.com',
  'washingtonpost.com',
  'wsj.com',
  'theguardian.com',
  'reuters.com',
  'forbes.com',
  'cnbc.com',
  'netflix.com',
  'primevideo.com',
  'hulu.com',
  'disneyplus.com',
  'max.com',
  'peacocktv.com',
  'paramountplus.com',
  'spotify.com',
]

const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//

export const WEBSITE_PATH_WARNING_COPY =
  "Please enter your main website domain (e.g., https://example.com) rather than a specific page. You'll be able to select which pages to index in the next step."

export const ensureUrlHasProtocol = (value = '') => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return PROTOCOL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
}

const isPrivateIpv4 = (octets) => {
  const [a, b] = octets.map(Number)
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  return false
}

const BLOCKED_DOMAIN_ERROR =
  'Please enter your business website URL.'
const INVALID_DOMAIN_ERROR =
  'Invalid domain format. Please use a valid domain name.'
const LOCALHOST_ERROR = 'Localhost URLs are not allowed.'
const IP_ADDRESS_ERROR =
  'IP addresses are not allowed. Please use a domain name.'
const PRIVATE_NETWORK_ERROR = 'Private network addresses are not allowed.'
const AUTH_IN_URL_ERROR =
  'URLs with authentication credentials are not allowed.'
const PROTOCOL_ERROR = 'Only HTTP and HTTPS URLs are allowed.'
const INVALID_URL_ERROR =
  'Enter a valid URL, e.g. https://example.com'

export const validateBusinessUrl = (urlString) => {
  let url
  try {
    url = new URL(urlString)
  } catch {
    return { valid: false, error: INVALID_URL_ERROR }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: PROTOCOL_ERROR }
  }

  if (url.username || url.password) {
    return { valid: false, error: AUTH_IN_URL_ERROR }
  }

  const hostname = url.hostname.toLowerCase()

  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    /^127\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return { valid: false, error: LOCALHOST_ERROR }
  }

  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const ipv6Regex = /^\[[\da-f:]+\]$/i
  const isIpv4 = ipv4Regex.test(hostname)
  const isIpv6 = hostname.includes(':') || ipv6Regex.test(hostname)

  if (isIpv4 || isIpv6) {
    return { valid: false, error: IP_ADDRESS_ERROR }
  }

  const ipv4Match = hostname.match(ipv4Regex)
  if (ipv4Match && isPrivateIpv4(ipv4Match.slice(1))) {
    return { valid: false, error: PRIVATE_NETWORK_ERROR }
  }

  const domainParts = hostname.split('.')
  if (domainParts.length < 2 || domainParts.some((part) => !part)) {
    return { valid: false, error: INVALID_DOMAIN_ERROR }
  }

  for (const blockedDomain of BLOCKED_DOMAINS) {
    if (
      hostname === blockedDomain ||
      hostname.endsWith(`.${blockedDomain}`)
    ) {
      return {
        valid: false,
        error: `${blockedDomain} is not allowed. ${BLOCKED_DOMAIN_ERROR}`,
      }
    }
  }

  return { valid: true, normalizedUrl: url.toString() }
}

export const shouldWarnAboutUrlPath = (value) => {
  if (!value) return false
  let url
  try {
    url = value instanceof URL ? value : new URL(ensureUrlHasProtocol(value))
  } catch {
    return false
  }

  const pathSegments = url.pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter((segment) => segment.length > 0)
  const hasQueryParams = url.search.length > 0
  const hasSingleLongSegment =
    pathSegments.length === 1 && pathSegments[0].length > 8

  return (
    pathSegments.length > 1 || hasQueryParams || hasSingleLongSegment
  )
}

export const validateWebsiteInput = (value) => {
  if (!value || !value.trim()) {
    return {
      valid: false,
      error: INVALID_URL_ERROR,
    }
  }

  const withProtocol = ensureUrlHasProtocol(value)
  const businessValidation = validateBusinessUrl(withProtocol)

  if (!businessValidation.valid) {
    return businessValidation
  }

  const url = new URL(withProtocol)

  return {
    valid: true,
    normalizedUrl: withProtocol,
    hasPathWarning: shouldWarnAboutUrlPath(url),
    hostname: url.hostname.toLowerCase(),
  }
}

export const usageTypeToPromptKey = (usageType) => {
  if (!usageType) return null
  switch (usageType) {
    case 'support':
      return 'CUSTOMER_SUPPORT'
    case 'internal':
    case 'research':
      return 'AI_AGENT'
    case 'content':
      return 'COPYWRITER'
    default:
      return null
  }
}

export const isBlockedDomain = (hostname = '') => {
  const normalized = hostname.toLowerCase()
  return BLOCKED_DOMAINS.some(
    (domain) =>
      normalized === domain || normalized.endsWith(`.${domain}`),
  )
}

