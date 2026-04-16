import { describe, expect, it } from 'vitest'

import {
  isIpPublic,
  validateOutboundFetchUrl,
  validateOutboundFetchUrlSync,
} from '@/utils/outboundUrlValidation'

describe('validateOutboundFetchUrlSync', () => {
  it('accepts https URLs with public hostnames', () => {
    const r = validateOutboundFetchUrlSync('https://example.com/path?q=1')
    expect(r.valid).toBe(true)
    if (r.valid) {
      expect(r.normalizedUrl).toContain('example.com')
    }
  })

  it('rejects non-http(s) protocols', () => {
    const r = validateOutboundFetchUrlSync('ftp://example.com/')
    expect(r.valid).toBe(false)
  })

  it('rejects loopback IPv4', () => {
    expect(validateOutboundFetchUrlSync('http://127.0.0.1/').valid).toBe(false)
    expect(validateOutboundFetchUrlSync('http://127.42.13.7/').valid).toBe(false)
  })

  it('rejects link-local and metadata-style IPv4', () => {
    expect(validateOutboundFetchUrlSync('http://169.254.169.254/').valid).toBe(false)
  })

  it('rejects RFC1918 IPv4', () => {
    expect(validateOutboundFetchUrlSync('https://10.0.0.1/').valid).toBe(false)
    expect(validateOutboundFetchUrlSync('https://192.168.0.1/').valid).toBe(false)
  })

  it('rejects URLs with embedded credentials', () => {
    const r = validateOutboundFetchUrlSync('https://user:pass@example.com/')
    expect(r.valid).toBe(false)
  })

  it('rejects localhost hostname', () => {
    expect(validateOutboundFetchUrlSync('http://localhost:8080/').valid).toBe(false)
  })

  it('rejects .internal and .local hostnames', () => {
    expect(validateOutboundFetchUrlSync('https://app.corp.internal/').valid).toBe(false)
    expect(validateOutboundFetchUrlSync('http://foo.local/').valid).toBe(false)
  })

  it('rejects kubernetes service hostnames', () => {
    expect(
      validateOutboundFetchUrlSync('http://api.default.svc.cluster.local/').valid,
    ).toBe(false)
  })
})

describe('isIpPublic', () => {
  it('marks common public IPv4 as public', () => {
    expect(isIpPublic('8.8.8.8')).toBe(true)
    expect(isIpPublic('1.1.1.1')).toBe(true)
  })

  it('marks private IPv4 as non-public', () => {
    expect(isIpPublic('10.0.0.1')).toBe(false)
    expect(isIpPublic('127.0.0.1')).toBe(false)
  })

  it('marks IPv6 loopback and ULA as non-public', () => {
    expect(isIpPublic('::1')).toBe(false)
    expect(isIpPublic('fd00::1')).toBe(false)
  })
})

describe('validateOutboundFetchUrl (async, DNS)', () => {
  it('still rejects blocked literals before DNS', async () => {
    const r = await validateOutboundFetchUrl('https://127.0.0.1/')
    expect(r.valid).toBe(false)
  })

  it('resolves a well-known public hostname to public IPs', async () => {
    const r = await validateOutboundFetchUrl('https://example.com/')
    expect(r.valid).toBe(true)
  })
})
