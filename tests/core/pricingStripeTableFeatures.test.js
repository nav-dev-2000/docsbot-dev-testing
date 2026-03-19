import { describe, expect, it } from 'vitest'
import { pricingTiers } from '@/constants/pricing.constants'
import {
  formatStripeTableFeatureLabel,
  getDifferentiatingFeatures,
  getVisibleStripePricingTiers,
} from '@/utils/pricingStripeTableFeatures'

describe('pricingStripeTableFeatures', () => {
  it('getVisibleStripePricingTiers excludes legacy and showInStripe false', () => {
    const visible = getVisibleStripePricingTiers(pricingTiers)
    expect(visible.every((t) => !t.legacy && t.showInStripe !== false)).toBe(
      true,
    )
    expect(visible.some((t) => t.id === 'free')).toBe(false)
  })

  it('Business tier rows match core limits first, then formatted labels', () => {
    const visible = getVisibleStripePricingTiers(pricingTiers)
    const idx = visible.findIndex((t) => t.id === 'business')
    expect(idx).toBeGreaterThanOrEqual(0)
    const rows = getDifferentiatingFeatures(visible[idx], idx, visible)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0][0]).toBe('docsBots')
    const firstLabel = formatStripeTableFeatureLabel(rows[0][0], rows[0][1])
    expect(firstLabel).toMatch(/DocsBots/)
  })

  it('formatStripeTableFeatureLabel mirrors Stripe table rules', () => {
    expect(formatStripeTableFeatureLabel('docsBots', 5)).toBe('5 DocsBots')
    expect(formatStripeTableFeatureLabel('botLifetime', 'Unlimited')).toBe(
      'Bot lifetime: Unlimited',
    )
    expect(formatStripeTableFeatureLabel('slackIntegration', true)).toBe(
      'Slack integration',
    )
  })
})
