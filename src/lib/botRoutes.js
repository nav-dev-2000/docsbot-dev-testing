const TAB_DEFAULTS = {
  analytics: 'reports',
  configure: 'sources',
  widget: 'design',
}

const VALID_CONTROLS = {
  analytics: ['reports', 'questions', 'conversations'],
  configure: [
    'instructions',
    'system',
    'sources',
    'search',
    'glossary',
    'questions',
    'mcp-connections',
    'skills',
    'webhooks',
  ],
  widget: ['design', 'content', 'actions', 'deploy'],
}

const TOP_LEVEL_TABS = ['chat', 'research', 'leads', 'deploy']

/** Skill document id segment under /configure/skills/:id (matches API slug rules). */
const CONFIGURE_SKILLS_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const CONFIGURE_SKILLS_SLUG_MAX_LENGTH = 64

function parseConfigureSkillsPathSegment(raw) {
  if (raw == null) return null
  let decoded
  try {
    decoded = decodeURIComponent(String(raw).trim())
  } catch {
    return null
  }
  if (
    !decoded ||
    decoded.length > CONFIGURE_SKILLS_SLUG_MAX_LENGTH ||
    !CONFIGURE_SKILLS_SLUG_PATTERN.test(decoded)
  ) {
    return null
  }
  return decoded
}

/**
 * Read the configure/skills/:skillId segment from a full app path (e.g. router.asPath).
 * Use when router.query.slug lags behind the visible URL so we do not drop the skill segment.
 */
function parseSkillIdFromBotAppAsPath(asPath) {
  const clean = String(asPath || '').split('?')[0]
  const match = clean.match(/\/configure\/skills\/([^/?#]+)/)
  if (!match) return null
  return parseConfigureSkillsPathSegment(match[1])
}

/**
 * Parse tab/control/skill from the visible `/app/bots/:botId/...` path.
 * Useful when `router.query.slug` temporarily lags behind `router.asPath`.
 */
function parseBotTabControlFromAsPath(asPath) {
  const clean = String(asPath || '').split('?')[0]
  const parts = clean.split('/').filter(Boolean)
  const botsIndex = parts.indexOf('bots')
  if (botsIndex === -1) return { tab: 'chat', control: null }

  // /app/bots/:botId/<...slug>
  const slug = parts.slice(botsIndex + 2)
  return slugToTabControl(slug)
}

/**
 * Convert a catch-all slug array into { tab, control, questionId }.
 * [] → chat, ['analytics'] → analytics/reports, etc.
 */
function slugToTabControl(slug) {
  const parts = Array.isArray(slug) ? slug : []

  if (parts.length === 0) return { tab: 'chat', control: null }

  const first = parts[0]

  if (TOP_LEVEL_TABS.includes(first)) {
    return { tab: first, control: null }
  }

  // Search is only under configure; redirect /search to /configure/search
  if (first === 'search') {
    return { tab: 'configure', control: 'search' }
  }

  if (VALID_CONTROLS[first]) {
    const control = parts[1] && VALID_CONTROLS[first].includes(parts[1])
      ? parts[1]
      : TAB_DEFAULTS[first]

    const result = { tab: first, control }

    if (first === 'configure' && control === 'skills' && parts[2]) {
      const skillId = parseConfigureSkillsPathSegment(parts[2])
      if (skillId) {
        result.skillId = skillId
      }
    }

    if (first === 'analytics' && control === 'questions' && parts[2]) {
      result.questionId = parts[2]
    }

    if (first === 'analytics' && control === 'reports' && parts[2] === 'print') {
      result.print = true
    }

    return result
  }

  return { tab: 'chat', control: null }
}

/**
 * Build a path string for the given bot, tab, control, and options.
 */
function tabControlToPath(botId, tab, control, options = {}) {
  const base = `/app/bots/${botId}`

  if (!tab || tab === 'chat') return base

  if (TOP_LEVEL_TABS.includes(tab)) {
    let path = `${base}/${tab}`
    if (tab === 'research' && options.jobId) {
      path += `?jobId=${options.jobId}`
    }
    return path
  }

  const defaultControl = TAB_DEFAULTS[tab]
  const effectiveControl = control || defaultControl

  let path = `${base}/${tab}`
  if (effectiveControl) {
    path += `/${effectiveControl}`
  }

  if (tab === 'configure' && effectiveControl === 'skills' && options.skillId) {
    const sid = parseConfigureSkillsPathSegment(options.skillId)
    if (sid) {
      path += `/${encodeURIComponent(sid)}`
    }
  }

  if (tab === 'analytics' && effectiveControl === 'questions' && options.questionId) {
    path += `/${options.questionId}`
  }

  if (tab === 'analytics' && effectiveControl === 'reports' && options.print) {
    path += '/print'
    if (options.month) {
      path += `?month=${options.month}`
    }
    return path
  }

  if (tab === 'analytics' && effectiveControl === 'conversations' && options.conversationId) {
    path += `?conversationId=${options.conversationId}`
  }

  return path
}

module.exports = {
  slugToTabControl,
  tabControlToPath,
  TAB_DEFAULTS,
  VALID_CONTROLS,
  TOP_LEVEL_TABS,
  parseSkillIdFromBotAppAsPath,
  parseBotTabControlFromAsPath,
}
