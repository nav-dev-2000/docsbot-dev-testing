import { describe, expect, it } from 'vitest'

import {
  parseDocsbotCouponCookie,
  DEAL_COUPON_COOKIE_MAX_AGE_SEC,
} from '@/utils/couponCookie.utils'

describe('parseDocsbotCouponCookie', () => {
  it('parses legacy coupon id only', () => {
    expect(parseDocsbotCouponCookie('paul-higgins')).toEqual({
      couponId: 'paul-higgins',
      expiresAtSec: null,
    })
  })

  it('parses coupon id with expiry', () => {
    expect(parseDocsbotCouponCookie('summer-sale|1735689600')).toEqual({
      couponId: 'summer-sale',
      expiresAtSec: 1735689600,
    })
  })

  it('handles empty input', () => {
    expect(parseDocsbotCouponCookie('')).toEqual({
      couponId: null,
      expiresAtSec: null,
    })
  })

  it('exports 7-day max age constant', () => {
    expect(DEAL_COUPON_COOKIE_MAX_AGE_SEC).toBe(7 * 24 * 60 * 60)
  })
})
