const TAB_DEFAULTS = {
  analytics: 'reports',
  configure: 'sources',
  widget: 'design',
}

const VALID_CONTROLS = {
  analytics: ['reports', 'questions', 'conversations'],
  configure: ['instructions', 'system', 'sources', 'webhooks', 'search', 'glossary', 'questions'],
  widget: ['design', 'content', 'actions', 'deploy'],
}

const TOP_LEVEL_TABS = ['chat', 'research', 'leads', 'search', 'deploy']

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

  if (VALID_CONTROLS[first]) {
    const control = parts[1] && VALID_CONTROLS[first].includes(parts[1])
      ? parts[1]
      : TAB_DEFAULTS[first]

    const result = { tab: first, control }

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

module.exports = { slugToTabControl, tabControlToPath, TAB_DEFAULTS, VALID_CONTROLS, TOP_LEVEL_TABS }
