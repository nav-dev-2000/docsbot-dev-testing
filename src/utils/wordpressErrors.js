const RECOVERABLE_WORDPRESS_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'ERR_INVALID_URL',
  'UND_ERR_ABORTED',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
])

const RECOVERABLE_WORDPRESS_MESSAGE_FRAGMENTS = [
  'is not valid json',
  'unexpected token <',
  'network',
  'fetch',
  'terminated',
  'abort',
  'aborted',
  'socket',
  'timed out',
  'timeout',
  'failed to parse url',
  'invalid url',
  'unknown post type',
]

function getErrorChain(error) {
  const errors = []
  const seen = new Set()
  let current = error

  while (current && !seen.has(current)) {
    errors.push(current)
    seen.add(current)
    current = current.cause
  }

  return errors
}

export function getRecoverableWordPressErrorDetails(error) {
  const errors = getErrorChain(error)
  const messages = errors
    .map((entry) => (typeof entry?.message === 'string' ? entry.message : ''))
    .filter(Boolean)
  const lowerMessages = messages.map((message) => message.toLowerCase())
  const codes = errors
    .map((entry) => (typeof entry?.code === 'string' ? entry.code : ''))
    .filter(Boolean)
  const statusCode =
    error?.status ||
    error?.response?.status ||
    errors.find((entry) => entry?.response?.status)?.response?.status

  const isRecoverableWordPressError =
    error instanceof SyntaxError ||
    statusCode === 429 ||
    (typeof statusCode === 'number' && statusCode >= 500) ||
    codes.some((code) => RECOVERABLE_WORDPRESS_CODES.has(code)) ||
    lowerMessages.some((message) =>
      RECOVERABLE_WORDPRESS_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))
    )

  return {
    codes,
    messages,
    statusCode,
    isRecoverableWordPressError,
  }
}
