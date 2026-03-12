import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadHelpers = async () => import('@/utils/helpers')

describe('helpers.js billing and scheduling logic', () => {
  const originalPlans = process.env.NEXT_PUBLIC_STRIPE_PLANS

  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_STRIPE_PLANS = JSON.stringify({
      personal: {
        name: 'Personal',
        bots: 5,
        pages: 500,
        questions: 1000,
        teamMembers: 3,
        scheduleInterval: 'weekly',
        researchTasks: { monthly: 10 },
        prices: {
          current: {
            monthly: 'price_personal_monthly',
            annually: 'price_personal_yearly',
          },
          old: ['price_personal_legacy'],
        },
      },
      business: {
        name: 'Business',
        bots: 100,
        pages: 100000,
        questions: 1000000,
        teamMembers: 100,
        scheduleInterval: 'daily',
        researchTasks: 50,
        prices: {
          current: {
            monthly: 'price_business_monthly',
            annually: 'price_business_yearly',
          },
        },
      },
    })
  })

  afterEach(() => {
    if (originalPlans === undefined) {
      delete process.env.NEXT_PUBLIC_STRIPE_PLANS
      return
    }
    process.env.NEXT_PUBLIC_STRIPE_PLANS = originalPlans
  })

  it('resolves explicit team plan objects and Stripe price mappings', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        plan: {
          id: 'pro',
          name: 'Pro',
          researchTasks: '25',
        },
      }),
    ).toMatchObject({
      id: 'pro',
      name: 'Pro',
      researchTasks: 25,
    })

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_personal_monthly',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'personal',
      name: 'Personal',
      researchTasks: 25,
    })

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_personal_legacy',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'personal',
      name: 'Personal',
    })
  })

  it('falls back to free for inactive subscriptions and staff for special teams', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_business_monthly',
        stripeSubscriptionStatus: 'canceled',
      }),
    ).toMatchObject({
      id: 'free',
      name: 'Free',
      researchTasks: 0,
    })

    expect(
      stripePlan({
        id: 'ZrbLG98bbxZ9EFqiPvyl',
      }),
    ).toMatchObject({
      id: 'staff',
      scheduleInterval: 'daily',
      researchTasks: 1000,
    })
  })

  it('computes required plan levels with grandfathering rules', async () => {
    const { getRequiredPlanLevel, PLAN_LEVELS } = await loadHelpers()

    expect(
      getRequiredPlanLevel(
        { createdAt: '2025-03-01T00:00:00Z' },
        'personal',
      ),
    ).toBe(PLAN_LEVELS.hobby)

    expect(
      getRequiredPlanLevel(
        { createdAt: '2025-05-01T00:00:00Z' },
        'pro',
        'helpscout',
      ),
    ).toBe(PLAN_LEVELS.personal)

    expect(
      getRequiredPlanLevel(
        { createdAt: '2025-05-01T00:00:00Z' },
        'business',
        'branding',
      ),
    ).toBe(PLAN_LEVELS.pro)
  })

  it('checks plan permissions and labels correctly', async () => {
    const { checkPlanPermission } = await loadHelpers()

    expect(
      checkPlanPermission(
        {
          stripeSubscriptionPlan: 'price_personal_monthly',
          stripeSubscriptionStatus: 'active',
        },
        'hobby',
      ),
    ).toEqual({
      allowed: true,
      requiredPlanLabel: 'Personal',
    })

    expect(
      checkPlanPermission(
        {
          stripeSubscriptionPlan: 'price_personal_monthly',
          stripeSubscriptionStatus: 'active',
        },
        'business',
      ),
    ).toEqual({
      allowed: false,
      requiredPlanLabel: 'Business',
    })
  })

  it('enforces source scheduling limits by plan interval', async () => {
    const { checkSourceScheduledFromInterval } = await loadHelpers()

    const scheduled = checkSourceScheduledFromInterval(
      {
        stripeSubscriptionPlan: 'price_business_monthly',
        stripeSubscriptionStatus: 'active',
        createdAt: { seconds: Math.floor(new Date('2024-06-01T00:00:00Z').getTime() / 1000) },
      },
      'daily',
    )
    expect(scheduled).toBeInstanceOf(Date)

    expect(() =>
      checkSourceScheduledFromInterval(
        {
          stripeSubscriptionPlan: 'price_personal_monthly',
          stripeSubscriptionStatus: 'active',
        },
        'daily',
      ),
    ).toThrow('The schedule interval for this plan is limited to weekly.')

    expect(() =>
      checkSourceScheduledFromInterval(
        {
          stripeSubscriptionStatus: 'canceled',
        },
        'weekly',
      ),
    ).toThrow(
      'Scheduled refreshes are currently only available to paid plans. Please upgrade your plan to use this feature.',
    )
  })
})
