/**
 * RFC 9110 HTTP field names: `field-name = token`, `token = 1*tchar`
 * tchar = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "."
 *       / "^" / "_" / "`" / "|" / "~" / DIGIT / ALPHA
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110#name-fields
 */
export const HTTP_FIELD_NAME_MAX_LENGTH = 255

const RFC9110_TCHAR = /^[!#$%&'*+\-.0-9A-Z^_`a-z|~-]+$/

/**
 * @param {string} name Trimming should be done by the caller; empty strings are invalid.
 * @returns {boolean}
 */
export function isValidHttpFieldName(name) {
  if (typeof name !== 'string' || !name) return false
  if (name.length > HTTP_FIELD_NAME_MAX_LENGTH) return false
  return RFC9110_TCHAR.test(name)
}

/**
 * @param {string} name Invalid header name to quote in the message (e.g. after trim)
 * @returns {string}
 */
export function invalidHttpFieldNameMessage(name) {
  return `Header name must be a valid RFC 9110 field name (letters, digits, and ! # $ % & ' * + - . ^ _ \` | ~), up to ${HTTP_FIELD_NAME_MAX_LENGTH} characters. Invalid: ${JSON.stringify(name)}`
}
