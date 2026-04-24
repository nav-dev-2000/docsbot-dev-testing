const MAX_JSON_MESSAGE_UNWRAP = 8

/**
 * When APIs stringify nested errors, `message` can be raw JSON like `{"message":"400 …"}`.
 * Unwrap recursively to a plain human-readable string.
 */
export function unwrapJsonMessageString(text, depth = 0) {
  if (depth > MAX_JSON_MESSAGE_UNWRAP || typeof text !== 'string') {
    return typeof text === 'string' ? text : ''
  }
  const t = text.trim()
  if (t.length < 2 || t[0] !== '{') return text
  try {
    const parsed = JSON.parse(t)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const next =
        (typeof parsed.message === 'string' && parsed.message.trim() && parsed.message) ||
        (parsed.error &&
          typeof parsed.error === 'object' &&
          typeof parsed.error.message === 'string' &&
          parsed.error.message.trim() &&
          parsed.error.message) ||
        (typeof parsed.error === 'string' && parsed.error.trim() && parsed.error)
      if (next) {
        return unwrapJsonMessageString(String(next), depth + 1)
      }
    }
  } catch {
    // not JSON — return as-is
  }
  return text
}

/** Best-effort human-readable message from an OpenAI / AI SDK error (avoids dumping full JSON blobs). */
export function openAiErrorMessage(error) {
  if (!error) return ''
  if (typeof error === 'string') return unwrapJsonMessageString(error)

  const candidates = [
    error?.message,
    error?.error?.message,
    error?.data?.error?.message,
    error?.response?.data?.error?.message,
    typeof error?.response?.data === 'object' && error?.response?.data !== null
      ? error.response.data.message
      : null,
    error?.cause?.message,
  ]

  for (const candidate of candidates) {
    if (candidate == null) continue
    const s = unwrapJsonMessageString(String(candidate))
    if (s.trim()) return s
  }

  if (typeof error?.responseBody === 'string' && error.responseBody.trim()) {
    try {
      const parsed = JSON.parse(error.responseBody)
      const nested =
        parsed &&
        typeof parsed === 'object' &&
        parsed.error &&
        typeof parsed.error.message === 'string' &&
        parsed.error.message.trim()
          ? parsed.error.message
          : null
      if (nested) {
        const s = unwrapJsonMessageString(String(nested))
        if (s.trim()) return s
      }
    } catch {
      // ignore
    }
  }

  if (typeof error?.response?.data === 'string') {
    const s = unwrapJsonMessageString(error.response.data)
    if (s.trim()) return s
  }

  try {
    if (typeof error?.toString === 'function') {
      const ts = error.toString()
      if (ts && ts !== '[object Object]') {
        const s = unwrapJsonMessageString(ts)
        if (s.trim()) return s
      }
    }
  } catch {
    // ignore
  }

  try {
    return unwrapJsonMessageString(JSON.stringify(error))
  } catch {
    return String(error)
  }
}
