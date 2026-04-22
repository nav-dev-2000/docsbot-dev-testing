export const WEB_SEARCH_COMPATIBLE_MODELS_LABEL =
  'GPT-4o, GPT-4.1, or GPT-5+ family models'

export const DEFAULT_WEB_SEARCH_MODEL = 'gpt-5.4-nano'
export const WEB_SEARCH_ALLOWED_DOMAINS_MAX = 20

export const formatDomainListInputText = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ',') : ''

export const isWebSearchCompatibleModel = (model) => {
  const normalizedModel =
    typeof model === 'string' && model.trim()
      ? model.trim()
      : DEFAULT_WEB_SEARCH_MODEL

  return (
    normalizedModel === 'gpt-4.1-mini' ||
    normalizedModel === 'gpt-4.1' ||
    normalizedModel === 'gpt-4o-mini' ||
    normalizedModel === 'gpt-4o' ||
    normalizedModel.startsWith('gpt-5')
  )
}

export const formatWebSearchModelLabel = (model) => {
  const normalizedModel =
    typeof model === 'string' && model.trim()
      ? model.trim()
      : DEFAULT_WEB_SEARCH_MODEL

  return normalizedModel
    .replace(/^gpt-/, 'GPT-')
    .replace(/-mini$/i, ' mini')
    .replace(/-nano$/i, ' nano')
}

const normalizeWebSearchDomain = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''

  const rawHost = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^\*\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .replace(/\.$/, '')

  if (!rawHost || rawHost.includes(' ')) return ''
  if (!/^[a-z0-9.-]+$/.test(rawHost)) return ''
  if (!rawHost.includes('.')) return ''

  return rawHost
}

export const normalizeWebSearchAllowedDomains = (value) => {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? formatDomainListInputText(value).split(',')
      : []

  const seen = new Set()
  const normalized = []

  for (const entry of items) {
    const nextDomain = normalizeWebSearchDomain(entry)
    if (!nextDomain || seen.has(nextDomain)) continue
    seen.add(nextDomain)
    normalized.push(nextDomain)
    if (normalized.length >= WEB_SEARCH_ALLOWED_DOMAINS_MAX) {
      break
    }
  }

  return normalized
}
