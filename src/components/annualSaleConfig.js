import { stripePlan } from '@/utils/helpers'

export const getAnnualSalePersonaMessage = (team) => {
  // Promo ended: keep logic for future reuse, but disable messaging.
  return null

  if (!team) return null
  const planId = stripePlan(team)?.id || ''
  const isLegacyPro = planId === 'pro'
  const isLegacyHobby = planId === 'hobby'
  const isCanceled = team?.stripeSubscriptionStatus === 'canceled'
  const isNeverPaid =
    planId === 'free' && !team?.stripeCustomerId && !team?.stripeSubscriptionId

  if (isCanceled) {
    return 'Welcome back — DocsBot is better than ever. 34% off annual plans.'
  }
  if (isLegacyPro) {
    return 'Legacy Pro retires soon — lock in $99/mo for a year before your plan transitions.'
  }
  if (isLegacyHobby) {
    return 'Ready to scale? Upgrade to Personal — 34% off for 12 months.'
  }
  if (isNeverPaid) {
    return 'Upgrade to DocsBot Premium — 34% off annual plans. Best offer of 2026.'
  }
  return null
}

export const ANNUAL_SALE_CONFIG = {
  id: 'annual-2026',
  message: '34% off annual plans applied.',
  forceAnnualInUpgrade: true,
  getUpgradeMessage: (team) => {
    return getAnnualSalePersonaMessage(team) || '34% off annual plans applied.'
  },
  getCheckoutMessage: (team) => {
    return getAnnualSalePersonaMessage(team) || '34% off annual plans applied.'
  },
  annualTotals: {
    personal: { USD: 387, JPY: 59500, EUR: 387, GBP: 333, AUD: 648 },
    standard: { USD: 1188, JPY: 174496, EUR: 1069, GBP: 912, AUD: 1900 },
    business: { USD: 3967, JPY: 604500, EUR: 3900, GBP: 3370, AUD: 6480 },
  },
}
