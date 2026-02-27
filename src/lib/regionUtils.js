/**
 * EU country codes (ISO 3166-1 alpha-2) for region detection.
 * Used to map Cloudflare cf-ipcountry to "eu" vs "us".
 */
const EU_COUNTRY_CODES = new Set([
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  'GB', // United Kingdom
  'IS', // Iceland (EEA)
  'LI', // Liechtenstein (EEA)
  'NO', // Norway (EEA)
  'CH', // Switzerland
])

/**
 * Detects user region from Cloudflare headers.
 * @param {Record<string, string|string[]|undefined>} headers - Request headers
 * @returns {'US'|'EU'} - 'EU' for European countries, 'US' otherwise (default)
 */
export function detectRegionFromHeaders(headers) {
  const country = headers['cf-ipcountry']
  const code = Array.isArray(country) ? country[0] : country
  const upper = code ? String(code).toUpperCase() : ''
  return EU_COUNTRY_CODES.has(upper) ? 'EU' : 'US'
}
