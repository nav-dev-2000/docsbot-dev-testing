import { describe, expect, it } from 'vitest'
import { featureDefinitions, pricingTiers } from '@/constants/pricing.constants'
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

  it('includes scheduling tools in the pricing table at Personal and above', () => {
    expect(featureDefinitions.bookingActions).toEqual({
      label: 'Scheduling tools — Calendly, Cal.com, TidyCal',
      category: 'actions',
    })

    const free = pricingTiers.find((tier) => tier.id === 'free')
    const hobby = pricingTiers.find((tier) => tier.id === 'hobby')
    const personal = pricingTiers.find((tier) => tier.id === 'personal')
    const pro = pricingTiers.find((tier) => tier.id === 'pro')
    const standard = pricingTiers.find((tier) => tier.id === 'standard')
    const business = pricingTiers.find((tier) => tier.id === 'business')

    expect(free?.features.bookingActions).toBe(false)
    expect(hobby?.features.bookingActions).toBe(false)
    expect(personal?.features.bookingActions).toBe(true)
    expect(pro?.features.bookingActions).toBe(true)
    expect(standard?.features.bookingActions).toBe(true)
    expect(business?.features.bookingActions).toBe(true)
  })

  it('includes web search domain allowlist on Business only', () => {
    expect(featureDefinitions.webSearchAllowedDomains).toEqual({
      label: 'Web search domain allowlist',
      category: 'actions',
    })

    const free = pricingTiers.find((tier) => tier.id === 'free')
    const standard = pricingTiers.find((tier) => tier.id === 'standard')
    const business = pricingTiers.find((tier) => tier.id === 'business')

    expect(free?.features.webSearchAllowedDomains).toBe(false)
    expect(standard?.features.webSearchAllowedDomains).toBe(false)
    expect(standard?.features.webSearch).toBe(true)
    expect(business?.features.webSearchAllowedDomains).toBe(true)
  })
})
