export const WEBHOOK_EVENT_LEAD_CREATED = 'lead.created'
export const WEBHOOK_EVENT_DEEP_RESEARCH_DONE = 'deep_research.done'
export const WEBHOOK_EVENT_CONVERSATION_ESCALATED = 'conversation.escalated'
export const WEBHOOK_EVENT_CONVERSATION_RATED = 'conversation.rated'
export const WEBHOOK_EVENTS = [
  WEBHOOK_EVENT_LEAD_CREATED,
  WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
  WEBHOOK_EVENT_CONVERSATION_RATED,
]

const toIso = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export const normalizeWebhookEvents = (
  inputEvents = [],
  fallbackEvent = null,
) => {
  if (Array.isArray(inputEvents) && inputEvents.length > 0) {
    return Array.from(
      new Set(inputEvents.filter((event) => WEBHOOK_EVENTS.includes(event))),
    )
  }

  if (fallbackEvent && WEBHOOK_EVENTS.includes(fallbackEvent)) {
    return [fallbackEvent]
  }

  return [WEBHOOK_EVENT_LEAD_CREATED]
}

export const normalizeWebhookDoc = (id, data = {}) => {
  const fallbackEvents = data.event
    ? [data.event]
    : [WEBHOOK_EVENT_LEAD_CREATED]
  const events = normalizeWebhookEvents(data.events, fallbackEvents[0])

  return {
    id,
    label: data.label || null,
    targetUrl: data.targetUrl,
    events,
    status: data.status || 'active',
    source: data.source || 'admin',
    expirationDate: toIso(data.expirationDate),
    lastTriggeredAt: toIso(data.lastTriggeredAt),
    lastResponseStatus: data.lastResponseStatus ?? null,
    lastError: data.lastError || null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  }
}

export const createWebhookPayload = (reqBody = {}, userId, Timestamp) => {
  const now = Timestamp.now()
  const expirationDate = reqBody.expirationDate
    ? Timestamp.fromDate(new Date(reqBody.expirationDate))
    : null

  const events = normalizeWebhookEvents(reqBody.events, reqBody.event)
  return {
    label: reqBody.label || null,
    targetUrl: reqBody.targetUrl,
    events,
    status: reqBody.status || 'active',
    source: reqBody.source || 'admin',
    secret: reqBody.secret || null,
    filters:
      reqBody.filters && typeof reqBody.filters === 'object'
        ? reqBody.filters
        : null,
    expirationDate,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }
}

export const mapWebhookEntries = (webhooksMap = {}) => {
  const entries = Object.entries(webhooksMap || {}).map(([id, data]) =>
    normalizeWebhookDoc(id, data),
  )
  const sorted = entries.sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bDate - aDate
  })
  return Object.fromEntries(sorted.map((w) => [w.id, w]))
}

export const isValidHttpUrl = (input) => {
  try {
    const parsed = new URL(input)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch (error) {
    return false
  }
}

const BLOCKED_WEBHOOK_HOSTNAMES = ['docsbot.ai', 'docsbot.com']

/** Rejects URLs whose hostname contains docsbot.ai or docsbot.com (SSRF protection). */
export const isBlockedWebhookTarget = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return BLOCKED_WEBHOOK_HOSTNAMES.some(
      (blocked) => hostname.includes(blocked.toLowerCase()),
    )
  } catch {
    return true
  }
}
