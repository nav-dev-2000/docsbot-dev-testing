import { describe, expect, it } from 'vitest'
import { isValidHttpFieldName } from '@/lib/httpFieldName'

describe('httpFieldName (RFC 9110 field-name / token)', () => {
  it('accepts common header tokens', () => {
    expect(isValidHttpFieldName('Accept')).toBe(true)
    expect(isValidHttpFieldName('X-API-Key')).toBe(true)
    expect(isValidHttpFieldName('CF-Access-Client-Id')).toBe(true)
    expect(isValidHttpFieldName('!#$%&*+-.^_`|~')).toBe(true)
  })

  it('rejects empty, spaces, and non-token characters', () => {
    expect(isValidHttpFieldName('')).toBe(false)
    expect(isValidHttpFieldName('X Bad')).toBe(false)
    expect(isValidHttpFieldName('a:b')).toBe(false)
    expect(isValidHttpFieldName('a/')).toBe(false)
  })
})
