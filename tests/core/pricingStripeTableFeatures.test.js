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
    expect(formatStripeTableFeatureLabel('messagesPerMonth', '15k')).toBe(
      'AI Credits / month: 15k',
    )
    expect(formatStripeTableFeatureLabel('slackIntegration', true)).toBe(
      'Slack integration',
    )
  })

  it('places actions per bot directly after AI credits in compact plan rows', () => {
    const visible = getVisibleStripePricingTiers(pricingTiers)
    const idx = visible.findIndex((t) => t.id === 'standard')
    const keys = getDifferentiatingFeatures(visible[idx], idx, visible).map(
      ([key]) => key,
    )

    expect(keys).toContain('messagesPerMonth')
    expect(keys).toContain('actionsLimit')
    expect(keys.indexOf('actionsLimit')).toBe(
      keys.indexOf('messagesPerMonth') + 1,
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
    expect(pro?.features.bookingActions).toBe(false)
    expect(standard?.features.bookingActions).toBe(true)
    expect(business?.features.bookingActions).toBe(true)
  })

  it('includes Skills and merged custom action button tiers', () => {
    expect(featureDefinitions.actionsLimit).toEqual({
      label: 'Actions per bot',
      category: 'actions',
    })
    expect(featureDefinitions.docsBotSkills).toEqual({
      label: 'Skills — build, validate, and publish',
      category: 'actions',
    })
    expect(featureDefinitions.customActionButtons).toEqual({
      label: 'Custom action buttons',
      category: 'actions',
    })
    expect(featureDefinitions.customButtons).toBeUndefined()
    expect(featureDefinitions.multipleCustomButtons).toBeUndefined()

    const free = pricingTiers.find((tier) => tier.id === 'free')
    const hobby = pricingTiers.find((tier) => tier.id === 'hobby')
    const personal = pricingTiers.find((tier) => tier.id === 'personal')
    const pro = pricingTiers.find((tier) => tier.id === 'pro')
    const standard = pricingTiers.find((tier) => tier.id === 'standard')
    const business = pricingTiers.find((tier) => tier.id === 'business')

    expect(free?.features.docsBotSkills).toBe(false)
    expect(hobby?.features.docsBotSkills).toBe(false)
    expect(personal?.features.actionsLimit).toBe(3)
    expect(personal?.features.docsBotSkills).toBe(false)
    expect(pro?.features.docsBotSkills).toBe(false)
    expect(pro?.features.actionsLimit).toBe(0)
    expect(standard?.features.actionsLimit).toBe(8)
    expect(standard?.features.docsBotSkills).toBe(true)
    expect(business?.features.actionsLimit).toBe(12)
    expect(business?.features.docsBotSkills).toBe(true)

    expect(free?.features.customActionButtons).toBe(false)
    expect(personal?.features.customActionButtons).toBe(true)
    expect(pro?.features.customActionButtons).toBe(false)
    expect(standard?.features.customActionButtons).toBe(true)
  })

  it('never lists hidden compact rows in the compact differentiating list (top cards / Stripe)', () => {
    const visible = getVisibleStripePricingTiers(pricingTiers)
    for (let i = 0; i < visible.length; i++) {
      const keys = getDifferentiatingFeatures(visible[i], i, visible).map(
        ([k]) => k,
      )
      expect(keys).not.toContain('mcpServer')
      expect(keys).not.toContain('researchTasks')
    }
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
