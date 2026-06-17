import { describe, expect, it } from 'vitest'
import {
  getEligibleLowerPlanOptions,
  getPlanDowngradeLosses,
  getSubscriptionPlanChangeBlockers,
} from '@/utils/planDowngrade'

const configuredPlans = {
  personal: {
    bots: 1,
    pages: 5000,
    questions: 5000,
    teamMembers: 1,
    actionsLimit: 3,
  },
  standard: {
    bots: 3,
    pages: 15000,
    questions: 15000,
    teamMembers: 5,
    actionsLimit: 8,
  },
  business: {
    bots: 10,
    pages: 100000,
    questions: 60000,
    teamMembers: 10,
    actionsLimit: 12,
  },
}

describe('planDowngrade', () => {
  it('blocks lower plans when usage exceeds target limits', () => {
    const blockers = getSubscriptionPlanChangeBlockers({
      team: {
        stripeSubscriptionPlan: 'standard',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {},
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner', user2: 'member', user3: 'member' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      targetPlanId: 'personal',
      configuredPlans,
    })

    expect(blockers.some((reason) => reason.includes('team members'))).toBe(true)
  })

  it('allows lower plans when team-user add-ons cover current members', () => {
    const blockers = getSubscriptionPlanChangeBlockers({
      team: {
        stripeSubscriptionPlan: 'standard',
        stripeSubscriptionId: 'sub_123',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          teamMembers: {
            quantity: 2,
            subscriptionId: 'sub_123',
            status: 'active',
          },
        },
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner', user2: 'member', user3: 'member' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      targetPlanId: 'personal',
      configuredPlans,
    })

    expect(blockers.some((reason) => reason.includes('team members'))).toBe(false)
  })

  it('blocks downgrades below business while team-user add-ons are active', () => {
    const blockers = getSubscriptionPlanChangeBlockers({
      team: {
        stripeSubscriptionPlan: 'standard',
        stripeSubscriptionId: 'sub_123',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          teamMembers: {
            quantity: 1,
            subscriptionId: 'sub_123',
            status: 'active',
          },
        },
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      targetPlanId: 'personal',
      configuredPlans,
    })

    expect(blockers).toContain('Extra team users require Business or higher')

    const standardBlockers = getSubscriptionPlanChangeBlockers({
      team: {
        stripeSubscriptionPlan: 'business',
        stripeSubscriptionId: 'sub_123',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          teamMembers: {
            quantity: 1,
            subscriptionId: 'sub_123',
            status: 'active',
          },
        },
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      targetPlanId: 'standard',
      configuredPlans,
    })

    expect(standardBlockers).toContain('Extra team users require Business or higher')
  })

  it('lists full plan feature differences for downgrade messaging', () => {
    const losses = getPlanDowngradeLosses({
      currentPlanId: 'standard',
      targetPlanId: 'personal',
    })

    expect(losses.length).toBeGreaterThan(0)
    expect(losses.some((loss) => loss.label === 'Team users')).toBe(true)
    expect(
      losses.some(
        (loss) =>
          loss.type === 'feature' &&
          loss.label === 'Stripe billing support actions',
      ),
    ).toBe(true)
  })

  it('returns lower plans from highest to lowest for existing subscriptions without add-ons', () => {
    const options = getEligibleLowerPlanOptions({
      team: {
        plan: {
          id: 'standard',
          name: 'Standard',
          bots: 3,
          pages: 15000,
          questions: 15000,
          teamMembers: 5,
        },
        stripeSubscriptionId: 'sub_123',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {},
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      configuredPlans,
    })

    expect(options.map((tier) => tier.id)).toEqual(['personal'])
  })

  it('defaults business downgrades to standard before lower eligible plans', () => {
    const options = getEligibleLowerPlanOptions({
      team: {
        plan: {
          id: 'business',
          name: 'Business',
          bots: 10,
          pages: 100000,
          questions: 60000,
          teamMembers: 10,
        },
        stripeSubscriptionId: 'sub_123',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {},
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
      configuredPlans,
    })

    expect(options.map((tier) => tier.id)).toEqual(['standard', 'personal'])
  })

  it('returns no lower plans without an active subscription', () => {
    const options = getEligibleLowerPlanOptions({
      team: {
        stripeSubscriptionPlan: 'standard',
        stripeAddOns: {},
        botCount: 1,
        pageCount: 100,
        questionCount: 100,
        roles: { user1: 'owner' },
      },
      bots: [],
      teamInvites: [],
      teamSourceTypes: [],
    })

    expect(options).toEqual([])
  })
})
