import { createHash } from 'crypto'

export const SKILLS_SANDBOX_SESSION_ID = 'builder'
const MAX_SANDBOX_ID_LENGTH = 63
const HASH_LENGTH = 12
const SANDBOX_FETCH_RETRY_DELAYS_MS = [750, 1500]
const SANDBOX_FETCH_TIMEOUT_BUFFER_MS = 15000
const SANDBOX_FETCH_MIN_TIMEOUT_MS = 30000
const READABLE_SEGMENT_LENGTHS = {
  team: 10,
  bot: 10,
  skill: 15,
}

function normalizeSandboxSegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildSkillSandboxId(teamId, botId, skillName) {
  const normalized = {
    team: normalizeSandboxSegment(teamId) || 'team',
    bot: normalizeSandboxSegment(botId) || 'bot',
    skill: normalizeSandboxSegment(skillName) || 'skill',
  }

  const readableId = `skill-${normalized.team}-${normalized.bot}-${normalized.skill}`
  if (readableId.length <= MAX_SANDBOX_ID_LENGTH) {
    return readableId
  }

  const hash = createHash('sha256')
    .update(JSON.stringify([teamId, botId, skillName]))
    .digest('hex')
    .slice(0, HASH_LENGTH)

  return [
    'skill',
    normalized.team.slice(0, READABLE_SEGMENT_LENGTHS.team) || 'team',
    normalized.bot.slice(0, READABLE_SEGMENT_LENGTHS.bot) || 'bot',
    normalized.skill.slice(0, READABLE_SEGMENT_LENGTHS.skill) || 'skill',
    hash,
  ].join('-')
}

export function getSkillsSandboxConfig() {
  const baseUrl = process.env.SKILLS_SANDBOX_URL
  const token = process.env.SKILLS_SANDBOX_TOKEN

  if (!baseUrl || !token) {
    return null
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
  }
}

function buildSandboxAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetrySandboxFetch(error) {
  const message = String(error?.message || '')
  return /fetch failed|network|socket/i.test(message)
}

function getSandboxFetchTimeoutMs(timeoutMs) {
  const requestedTimeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? Number(timeoutMs) : 0

  return Math.max(
    SANDBOX_FETCH_MIN_TIMEOUT_MS,
    requestedTimeout + SANDBOX_FETCH_TIMEOUT_BUFFER_MS,
  )
}

function createSandboxFetchController(timeoutMs) {
  const controller = new AbortController()
  const fetchTimeoutMs = getSandboxFetchTimeoutMs(timeoutMs)

  const timer = setTimeout(() => {
    controller.abort(
      new Error(
        `Sandbox worker request timed out after ${fetchTimeoutMs}ms before a complete response was received.`,
      ),
    )
  }, fetchTimeoutMs)

  return {
    controller,
    signal: controller.signal,
    fetchTimeoutMs,
    clear() {
      clearTimeout(timer)
    },
  }
}

function mergeAbortSignals(...signals) {
  const activeSignals = signals.filter(Boolean)
  if (activeSignals.length <= 1) {
    return activeSignals[0]
  }

  if (typeof AbortSignal?.any === 'function') {
    return AbortSignal.any(activeSignals)
  }

  const controller = new AbortController()
  const abort = (signal) => {
    if (controller.signal.aborted) return
    controller.abort(signal?.reason || new Error('Operation aborted.'))
  }

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort(signal)
      break
    }
    signal.addEventListener('abort', () => abort(signal), { once: true })
  }

  return controller.signal
}

export async function executeSkillSandboxCommands({
  teamId,
  botId,
  skillName,
  commands,
  timeoutMs,
  maxOutputLength,
  abortSignal,
}) {
  const config = getSkillsSandboxConfig()
  if (!config) {
    throw new Error(
      'Skills sandbox is not configured. Set SKILLS_SANDBOX_URL and SKILLS_SANDBOX_TOKEN.',
    )
  }

  const requestBody = {
    teamId,
    botId,
    skillName,
    sandboxId: buildSkillSandboxId(teamId, botId, skillName),
    sessionId: SKILLS_SANDBOX_SESSION_ID,
    commands,
    timeoutMs,
    maxOutputLength,
  }

  let response
  let lastError
  for (let attempt = 0; attempt <= SANDBOX_FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    const fetchController = createSandboxFetchController(timeoutMs)
    try {
      response = await fetch(`${config.baseUrl}/exec`, {
        method: 'POST',
        headers: buildSandboxAuthHeaders(config.token),
        body: JSON.stringify(requestBody),
        signal: mergeAbortSignals(abortSignal, fetchController.signal),
      })
      break
    } catch (error) {
      lastError = error
      if (
        attempt === SANDBOX_FETCH_RETRY_DELAYS_MS.length ||
        !shouldRetrySandboxFetch(error)
      ) {
        throw error
      }
      await sleep(SANDBOX_FETCH_RETRY_DELAYS_MS[attempt])
    } finally {
      fetchController.clear()
    }
  }

  if (!response) {
    throw lastError || new Error('Sandbox execution failed before a response was received.')
  }

  const payload = await response.json().catch(() => ({
    message: 'Invalid sandbox response.',
  }))

  if (!response.ok) {
    throw new Error(payload?.message || `Sandbox execution failed with status ${response.status}.`)
  }

  if (!Array.isArray(payload?.output)) {
    throw new Error('Sandbox response did not include command output.')
  }

  return {
    sandboxId: payload.sandboxId || buildSkillSandboxId(teamId, botId, skillName),
    sessionId: payload.sessionId || SKILLS_SANDBOX_SESSION_ID,
    output: payload.output,
  }
}

export async function resetSkillSandbox({ teamId, botId, skillName }) {
  const config = getSkillsSandboxConfig()
  if (!config) {
    throw new Error(
      'Skills sandbox is not configured. Set SKILLS_SANDBOX_URL and SKILLS_SANDBOX_TOKEN.',
    )
  }

  const sandboxId = buildSkillSandboxId(teamId, botId, skillName)
  const response = await fetch(`${config.baseUrl}/reset`, {
    method: 'POST',
    headers: buildSandboxAuthHeaders(config.token),
    body: JSON.stringify({ sandboxId }),
  })

  const payload = await response.json().catch(() => ({
    message: 'Invalid sandbox reset response.',
  }))

  if (!response.ok) {
    throw new Error(payload?.message || `Sandbox reset failed with status ${response.status}.`)
  }

  return {
    ok: Boolean(payload?.ok),
    sandboxId: payload?.sandboxId || sandboxId,
  }
}

export async function applySkillSandboxPatch({
  teamId,
  botId,
  skillName,
  callId,
  operation,
  abortSignal,
}) {
  const config = getSkillsSandboxConfig()
  if (!config) {
    throw new Error(
      'Skills sandbox is not configured. Set SKILLS_SANDBOX_URL and SKILLS_SANDBOX_TOKEN.',
    )
  }

  const requestBody = {
    teamId,
    botId,
    skillName,
    sandboxId: buildSkillSandboxId(teamId, botId, skillName),
    sessionId: SKILLS_SANDBOX_SESSION_ID,
    callId,
    operation,
  }

  const fetchController = createSandboxFetchController(15000)
  let response
  try {
    response = await fetch(`${config.baseUrl}/apply-patch`, {
      method: 'POST',
      headers: buildSandboxAuthHeaders(config.token),
      body: JSON.stringify(requestBody),
      signal: mergeAbortSignals(abortSignal, fetchController.signal),
    })
  } finally {
    fetchController.clear()
  }

  const payload = await response.json().catch(() => ({
    message: 'Invalid sandbox patch response.',
  }))

  if (!response.ok) {
    throw new Error(payload?.message || `Sandbox patch failed with status ${response.status}.`)
  }

  if (!payload || typeof payload.status !== 'string') {
    throw new Error('Sandbox patch response did not include a valid status.')
  }

  return {
    status: payload.status,
    output: payload.output,
  }
}
