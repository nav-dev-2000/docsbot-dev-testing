import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  buildDemoTrialCookieValue,
  createDemoTrialToken,
  normalizeDomainForToken,
  verifyDemoDealTag,
  verifyDemoTrialToken,
  getDemoTrialOfferDeadlineFromCookie,
} from '@/lib/demoTrialToken'

describe('demoTrialToken (short HMAC tag)', () => {
  beforeEach(() => {
    process.env.DEMO_TRIAL_SIGNING_KEY = 'test-demo-trial-secret'
  })

  afterEach(() => {
    delete process.env.DEMO_TRIAL_SIGNING_KEY
    delete process.env.INTERNAL_API_KEY
  })

  it('createDemoTrialToken returns 6 lowercase hex chars', () => {
    const tag = createDemoTrialToken({ domain: 'kinsta.com' })
    expect(tag).toMatch(/^[0-9a-f]{6}$/)
  })

  it('verifyDemoDealTag accepts matching tag for domain', () => {
    const tag = createDemoTrialToken({ domain: 'kinsta.com' })
    expect(verifyDemoDealTag(tag, 'kinsta.com')).toBe(true)
    expect(verifyDemoDealTag(tag, 'Kinsta.COM')).toBe(true)
  })

  it('verifyDemoDealTag rejects wrong tag', () => {
    const tag = createDemoTrialToken({ domain: 'kinsta.com' })
    const wrong = tag === '000000' ? '000001' : '000000'
    expect(verifyDemoDealTag(wrong, 'kinsta.com')).toBe(false)
  })

  it('cookie round-trip with exp (3-part)', () => {
    const domain = normalizeDomainForToken('Example.COM')
    expect(domain).toBe('example.com')
    const tag = createDemoTrialToken({ domain })
    const exp = Math.floor(Date.now() / 1000) + 3600
    const cookieVal = buildDemoTrialCookieValue(domain, tag, exp)
    expect(verifyDemoTrialToken(cookieVal)).toEqual({
      domain: 'example.com',
      expiresAtSec: exp,
    })
  })

  it('rejects expired 3-part cookie', () => {
    const tag = createDemoTrialToken({ domain: 'example.com' })
    const exp = Math.floor(Date.now() / 1000) - 60
    const cookieVal = buildDemoTrialCookieValue('example.com', tag, exp)
    expect(verifyDemoTrialToken(cookieVal)).toBeNull()
  })

  it('legacy 2-part domain|tag still verifies', () => {
    const tag = createDemoTrialToken({ domain: 'example.com' })
    expect(verifyDemoTrialToken(`example.com|${tag}`)).toEqual({
      domain: 'example.com',
    })
  })

  it('verifyDemoTrialToken returns null for cookie without pipe', () => {
    const tag = createDemoTrialToken({ domain: 'kinsta.com' })
    expect(verifyDemoTrialToken(tag)).toBeNull()
  })

  it('getDemoTrialOfferDeadlineFromCookie reads exp from 3-part value', () => {
    const exp = Math.floor(Date.now() / 1000) + 7200
    const tag = createDemoTrialToken({ domain: 'acme.com' })
    const raw = buildDemoTrialCookieValue('acme.com', tag, exp)
    const d = getDemoTrialOfferDeadlineFromCookie(raw)
    expect(d).toBeInstanceOf(Date)
    expect(Math.floor(d.getTime() / 1000)).toBe(exp)
  })

  it('falls back to INTERNAL_API_KEY when DEMO_TRIAL_SIGNING_KEY unset', () => {
    delete process.env.DEMO_TRIAL_SIGNING_KEY
    process.env.INTERNAL_API_KEY = 'internal-fallback'
    const tag = createDemoTrialToken({ domain: 'example.com' })
    expect(verifyDemoDealTag(tag, 'example.com')).toBe(true)
  })
})
