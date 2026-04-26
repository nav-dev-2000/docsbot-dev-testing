function maybeParseJsonString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

export function buildScopeKey(teamId, botId, skillName) {
  return `${teamId}:${botId}:${skillName}`
}

function collectScopeKeys(value, keys = new Set(), seen = new WeakSet()) {
  if (value == null) return keys

  if (typeof value === 'string') {
    const parsed = maybeParseJsonString(value)
    if (parsed) {
      collectScopeKeys(parsed, keys, seen)
    }
    return keys
  }

  if (typeof value !== 'object') return keys
  if (seen.has(value)) return keys
  seen.add(value)

  if (typeof value.scope_key === 'string' && value.scope_key.trim()) {
    keys.add(value.scope_key.trim())
  }

  if (Array.isArray(value.scope_keys)) {
    value.scope_keys.forEach((item) => {
      if (typeof item === 'string' && item.trim()) keys.add(item.trim())
    })
  }

  Object.values(value).forEach((child) => {
    collectScopeKeys(child, keys, seen)
  })

  return keys
}

export function eventMatchesScopeKey(event, scopeKey) {
  const requested = String(scopeKey || '').trim()
  if (!requested) return true
  return collectScopeKeys(event).has(requested)
}

function getStructuredSource(event) {
  return event && typeof event === 'object' && event.source && typeof event.source === 'object'
    ? event.source
    : null
}

function formatDuration(durationMs) {
  return Number.isFinite(durationMs) && durationMs >= 0 ? `${Math.round(durationMs)} ms` : null
}

function buildEntryId(event, source, index) {
  return (
    source?.session_id ||
    event?.$metadata?.id ||
    event?.$workers?.event?.request?.path ||
    `runtime-log-${index}`
  ) + `:${source?.event || 'event'}:${index}`
}

export function normalizeRuntimeEvent(event, index) {
  const source = getStructuredSource(event)
  if (!source) return null

  const eventName = typeof source.event === 'string' ? source.event.trim() : ''
  const timestamp = Number(event?.timestamp) || Date.now()
  const durationMs = Number.isFinite(source.duration_ms) ? Number(source.duration_ms) : null
  const error = typeof source.error === 'string' && source.error.trim() ? source.error.trim() : null

  if (eventName === 'call_skill_function') {
    const functionName =
      typeof source.function_name === 'string' && source.function_name.trim()
        ? source.function_name.trim()
        : 'Skill function'
    const ok = source.outcome === 'ok'
    return {
      id: buildEntryId(event, source, index),
      timestamp,
      kind: 'function_call',
      status: ok ? 'success' : 'error',
      title: ok ? 'Ran function' : 'Function failed',
      summary: `${functionName} ${ok ? 'completed' : 'failed'}${durationMs != null ? ` in ${formatDuration(durationMs)}` : ''}.`,
      error,
      functionName,
      durationMs,
      logCount: Number.isFinite(source.log_count) ? Number(source.log_count) : null,
      sessionId: typeof source.session_id === 'string' ? source.session_id : null,
      input: source.input,
      output: source.output,
    }
  }

  if (eventName === 'skills_execute') {
    const ok = source.outcome === 'ok'
    return {
      id: buildEntryId(event, source, index),
      timestamp,
      kind: 'workflow',
      status: ok ? 'success' : 'error',
      title: ok ? 'Executed workflow' : 'Workflow failed',
      summary: `Skill workflow ${ok ? 'completed' : 'failed'}${durationMs != null ? ` in ${formatDuration(durationMs)}` : ''}.`,
      error,
      durationMs,
      logCount: Number.isFinite(source.log_count) ? Number(source.log_count) : null,
      sessionId: typeof source.session_id === 'string' ? source.session_id : null,
      input: source.input,
      output: source.output,
    }
  }

  if (eventName === 'outbound_redirect_chain') {
    const redirectCount = Number.isFinite(source.redirect_count)
      ? Number(source.redirect_count)
      : Array.isArray(source.chain)
        ? source.chain.length
        : null
    const finalStatus = Number.isFinite(source.final_status) ? Number(source.final_status) : null
    return {
      id: buildEntryId(event, source, index),
      timestamp,
      kind: 'outbound_redirect_chain',
      status: finalStatus && finalStatus >= 400 ? 'error' : 'success',
      title: 'Outbound redirect followed',
      summary: `${redirectCount === 1 ? '1 redirect was' : `${redirectCount ?? 'Multiple'} redirects were`} followed for an outbound request${finalStatus ? `, ending with HTTP ${finalStatus}` : ''}.`,
      redirectChain: {
        redirectCount,
        initialUrl: typeof source.initial_url === 'string' ? source.initial_url : null,
        finalUrl: typeof source.final_url === 'string' ? source.final_url : null,
        finalStatus,
        chain: Array.isArray(source.chain)
          ? source.chain.map((hop) => ({
              status: Number.isFinite(hop?.status) ? Number(hop.status) : null,
              method: typeof hop?.method === 'string' ? hop.method : null,
              requestUrl: typeof hop?.requestUrl === 'string' ? hop.requestUrl : null,
              location: typeof hop?.location === 'string' ? hop.location : null,
            }))
          : [],
        templateValueShapes: Array.isArray(source.template_value_shapes)
          ? source.template_value_shapes.map((shape) => ({
              key: typeof shape?.key === 'string' ? shape.key : null,
              length: Number.isFinite(shape?.length) ? Number(shape.length) : null,
              slashCount: Number.isFinite(shape?.slashCount) ? Number(shape.slashCount) : null,
              segmentCount: Number.isFinite(shape?.segmentCount) ? Number(shape.segmentCount) : null,
              startsWithHttpScheme:
                typeof shape?.startsWithHttpScheme === 'boolean' ? shape.startsWithHttpScheme : null,
              hasWhitespace: typeof shape?.hasWhitespace === 'boolean' ? shape.hasWhitespace : null,
            }))
          : [],
      },
    }
  }

  if (eventName === 'session_error') {
    const pathname = typeof source.pathname === 'string' ? source.pathname.trim() : ''
    if (pathname !== '/call-function' && pathname !== '/execute') {
      return null
    }

    const isFunctionError = pathname === '/call-function'
    const functionName =
      typeof source.function_name === 'string' && source.function_name.trim()
        ? source.function_name.trim()
        : null
    return {
      id: buildEntryId(event, source, index),
      timestamp,
      kind: isFunctionError ? 'function_error' : 'workflow_error',
      status: 'error',
      title: isFunctionError ? 'Function run failed' : 'Workflow failed',
      summary: isFunctionError
        ? `${functionName || 'A skill function'} failed before it returned a result.`
        : 'A skill workflow failed before it returned a result.',
      error,
      durationMs,
      sessionId: typeof source.session_id === 'string' ? source.session_id : null,
      functionName,
      input: source.input,
      output: source.output,
    }
  }

  return null
}
