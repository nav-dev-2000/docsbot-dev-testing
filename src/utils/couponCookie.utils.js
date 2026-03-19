/** Match demo-trial invite window: coupon cookie max-age and embedded `exp` use the same duration. */
export const DEAL_COUPON_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60

/**
 * `docsbot_coupon` cookie value is either `couponId` (legacy) or `couponId|expiresAtUnixSec`.
 * @param {string | undefined} raw
 * @returns {{ couponId: string | null, expiresAtSec: number | null }}
 */
export function parseDocsbotCouponCookie(raw) {
  if (!raw || typeof raw !== 'string') {
    return { couponId: null, expiresAtSec: null }
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return { couponId: null, expiresAtSec: null }
  }
  const pipe = trimmed.indexOf('|')
  if (pipe === -1) {
    return { couponId: trimmed, expiresAtSec: null }
  }
  const couponId = trimmed.slice(0, pipe).trim()
  const exp = Number(trimmed.slice(pipe + 1))
  return {
    couponId: couponId || null,
    expiresAtSec: Number.isFinite(exp) ? exp : null,
  }
}
