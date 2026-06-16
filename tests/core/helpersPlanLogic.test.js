import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadHelpers = async () => import('@/utils/helpers')

describe('helpers.js billing and scheduling logic', () => {
  const originalPlans = process.env.NEXT_PUBLIC_STRIPE_PLANS
  const originalAddOns = process.env.NEXT_PUBLIC_STRIPE_ADDONS

  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_STRIPE_PLANS = JSON.stringify({
      personal: {
        name: 'Personal',
        bots: 1,
        pages: 5000,
        questions: 5000,
        teamMembers: 1,
        actionsLimit: 3,
        scheduleInterval: 'weekly',
        prices: {
          current: {
            monthly: 'price_personal_monthly',
            annually: 'price_personal_yearly',
          },
          EUR: {
            monthly: 'price_personal_eur_monthly',
            annually: 'price_personal_eur_yearly',
          },
          old: ['price_personal_legacy'],
        },
      },
      pro: {
        name: 'Pro',
        bots: 10,
        pages: 10000,
        questions: 10000,
        teamMembers: 3,
        actionsLimit: 0,
        scheduleInterval: 'weekly',
        prices: {
          current: {
            monthly: 'price_pro_monthly',
            annually: 'price_pro_yearly',
          },
        },
      },
      standard: {
        name: 'Standard',
        bots: 3,
        pages: 15000,
        questions: 15000,
        teamMembers: 5,
        actionsLimit: 8,
        scheduleInterval: 'weekly',
        prices: {
          current: {
            monthly: 'price_standard_monthly',
            annually: 'price_standard_yearly',
          },
        },
      },
      business: {
        name: 'Business',
        bots: 10,
        pages: 100000,
        questions: 60000,
        teamMembers: 10,
        actionsLimit: 12,
        scheduleInterval: 'daily',
        prices: {
          current: {
            monthly: 'price_business_monthly',
            annually: 'price_business_yearly',
          },
          versions: [
            {
              name: 'legacy_100k_100bots',
              prices: [
                'price_business_legacy_monthly',
                'price_business_legacy_yearly',
              ],
              limits: {
                bots: 100,
                questions: 100000,
              },
            },
            {
              name: 'legacy_75k_25bots',
              prices: {
                monthly: 'price_business_mid_monthly',
                annually: 'price_business_mid_yearly',
              },
              limits: {
                bots: 25,
                questions: 75000,
              },
            },
            {
              name: 'legacy_bots_only',
              prices: ['price_business_bots_only'],
              limits: {
                bots: 50,
              },
            },
          ],
        },
      },
    })
    process.env.NEXT_PUBLIC_STRIPE_ADDONS = JSON.stringify({
      aiCredits: {
        unit: 5000,
        prices: {
          current: {
            monthly: 'price_ai_credits_monthly',
            annually: 'price_ai_credits_yearly',
          },
        },
      },
      bots: {
        unit: 1,
        prices: {
          current: {
            monthly: 'price_extra_bot_monthly',
            annually: 'price_extra_bot_yearly',
          },
        },
      },
      sourcePages: {
        unit: 10000,
        prices: {
          current: {
            monthly: 'price_source_pages_monthly',
            annually: 'price_source_pages_yearly',
          },
        },
      },
    })
  })

  afterEach(() => {
    if (originalPlans === undefined) {
      delete process.env.NEXT_PUBLIC_STRIPE_PLANS
    } else {
      process.env.NEXT_PUBLIC_STRIPE_PLANS = originalPlans
    }
    if (originalAddOns === undefined) {
      delete process.env.NEXT_PUBLIC_STRIPE_ADDONS
    } else {
      process.env.NEXT_PUBLIC_STRIPE_ADDONS = originalAddOns
    }
  })

  it('resolves explicit team plan objects and Stripe price mappings', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        plan: {
          id: 'pro',
          name: 'Pro',
        },
      }),
    ).toMatchObject({
      id: 'pro',
      name: 'Pro',
    })

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_personal_eur_monthly',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'personal',
      name: 'Personal',
      bots: 1,
      questions: 5000,
      actionsLimit: 3,
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

  it('resolves multiple grandfathered Business limits by Stripe price version', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_business_monthly',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'business',
      bots: 10,
      questions: 60000,
      actionsLimit: 12,
    })

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_business_legacy_monthly',
        stripeSubscriptionStatus: 'active',
        createdAt: '2026-04-29T00:00:00.000Z',
      }),
    ).toMatchObject({
      id: 'business',
      bots: 100,
      questions: 100000,
      actionsLimit: 12,
    })

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_business_mid_yearly',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'business',
      bots: 25,
      questions: 75000,
      actionsLimit: 12,
    })
  })

  it('detects grandfathered plan limits against current plan config', async () => {
    const { hasGrandfatheredPlanLimits } = await loadHelpers()

    expect(
      hasGrandfatheredPlanLimits({
        stripeSubscriptionPlan: 'price_business_monthly',
        stripeSubscriptionStatus: 'active',
      }),
    ).toBe(false)

    expect(
      hasGrandfatheredPlanLimits({
        stripeSubscriptionPlan: 'price_business_legacy_monthly',
        stripeSubscriptionStatus: 'active',
        createdAt: '2026-04-29T00:00:00.000Z',
      }),
    ).toBe(true)
  })

  it('inherits top-level plan limits when a version omits overrides', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_business_bots_only',
        stripeSubscriptionStatus: 'active',
      }),
    ).toMatchObject({
      id: 'business',
      bots: 50,
      pages: 100000,
      questions: 60000,
      teamMembers: 10,
      actionsLimit: 12,
    })
  })

  it('adds active add-on quantities to effective plan limits', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_standard_monthly',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          aiCredits: { quantity: 2 },
          bots: { quantity: 1 },
          sourcePages: { quantity: 3 },
        },
      }),
    ).toMatchObject({
      id: 'standard',
      bots: 4,
      pages: 45000,
      questions: 25000,
    })
  })

  it('adds annual add-on items when they belong to the annual base subscription', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionId: 'sub_annual',
        stripeSubscriptionPlan: 'price_standard_yearly',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          aiCredits: {
            quantity: 2,
            subscriptionId: 'sub_annual',
            itemId: 'si_ai_annual',
            status: 'active',
          },
          bots: {
            quantity: 1,
            subscriptionId: 'sub_annual',
            itemId: 'si_bot_annual',
            status: 'active',
          },
          sourcePages: {
            quantity: 3,
            subscriptionId: 'sub_annual',
            itemId: 'si_pages_annual',
            status: 'active',
          },
        },
      }),
    ).toMatchObject({
      id: 'standard',
      bots: 4,
      pages: 45000,
      questions: 25000,
    })
  })

  it('resolves add-on prices by billing interval', async () => {
    const {
      getAddOnConfig,
      getAddOnDisplayPrice,
      getAddOnPriceId,
      getAddOnPriceIds,
    } = await import('@/utils/billingAddOns')

    expect(getAddOnPriceId('aiCredits', 'USD', 'month')).toBe(
      'price_ai_credits_monthly',
    )
    expect(getAddOnPriceId('aiCredits', 'USD', 'year')).toBe(
      'price_ai_credits_yearly',
    )
    expect(getAddOnPriceIds(getAddOnConfig('aiCredits'))).toEqual([
      'price_ai_credits_monthly',
      'price_ai_credits_yearly',
    ])
    expect(getAddOnDisplayPrice(getAddOnConfig('aiCredits'), 'USD', 'year')).toBe(
      588,
    )
  })

  it('ignores add-on quantities when the base subscription is inactive', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionPlan: 'price_standard_monthly',
        stripeSubscriptionStatus: 'canceled',
        stripeAddOns: {
          aiCredits: { quantity: 2 },
          bots: { quantity: 1 },
          sourcePages: { quantity: 3 },
        },
      }),
    ).toMatchObject({
      id: 'free',
      bots: 1,
      pages: 50,
      questions: 100,
    })
  })

  it('ignores add-on quantities attached to a different subscription', async () => {
    const { stripePlan } = await loadHelpers()

    expect(
      stripePlan({
        stripeSubscriptionId: 'sub_base',
        stripeSubscriptionPlan: 'price_standard_monthly',
        stripeSubscriptionStatus: 'active',
        stripeAddOns: {
          aiCredits: { quantity: 2, subscriptionId: 'sub_addons' },
          bots: { quantity: 1, subscriptionId: 'sub_base' },
        },
      }),
    ).toMatchObject({
      id: 'standard',
      bots: 4,
      questions: 15000,
    })
  })

  it('returns an empty price-group array when no plan can support current usage', async () => {
    const { getNeededStripeProduct } = await loadHelpers()

    expect(
      getNeededStripeProduct({
        botCount: 999,
        pageCount: 1000,
        questionCount: 1000,
        roles: {},
      }),
    ).toEqual([])
  })

  it('omits legacy Pro prices from billing portal plan-change options', async () => {
    const { getNeededStripeProduct } = await loadHelpers()

    expect(
      getNeededStripeProduct({
        botCount: 1,
        pageCount: 1000,
        questionCount: 1000,
        roles: {},
      }),
    ).toEqual([
      ['price_personal_monthly', 'price_personal_yearly'],
      ['price_standard_monthly', 'price_standard_yearly'],
      ['price_business_monthly', 'price_business_yearly'],
    ])
  })

  it('keeps plan-change options available when add-ons cover current usage', async () => {
    const { getNeededStripeProduct } = await loadHelpers()

    expect(
      getNeededStripeProduct({
        stripeSubscriptionStatus: 'active',
        botCount: 4,
        pageCount: 45000,
        questionCount: 25000,
        roles: {},
        stripeAddOns: {
          aiCredits: { quantity: 2 },
          bots: { quantity: 1 },
          sourcePages: { quantity: 3 },
        },
      }),
    ).toEqual([
      ['price_standard_monthly', 'price_standard_yearly'],
      ['price_business_monthly', 'price_business_yearly'],
    ])
  })

  it('builds requested add-on state for a pending authenticated payment', async () => {
    const { getTeamAddOnsForRequestedQuantity } = await import(
      '@/utils/billingAddOns'
    )

    expect(
      getTeamAddOnsForRequestedQuantity({
        team: {
          stripeSubscriptionId: 'sub_base',
          stripeSubscriptionStatus: 'active',
          stripeAddOns: {
            aiCredits: {
              quantity: 1,
              subscriptionId: 'sub_base',
              itemId: 'si_ai_credits',
              status: 'active',
            },
            bots: {
              quantity: 1,
              subscriptionId: 'sub_base',
              itemId: 'si_bots',
              status: 'active',
            },
          },
        },
        addOnId: 'aiCredits',
        quantity: 3,
      }),
    ).toMatchObject({
      aiCredits: {
        quantity: 3,
        subscriptionId: 'sub_base',
        itemId: 'si_ai_credits',
        status: 'active',
      },
      bots: {
        quantity: 1,
        subscriptionId: 'sub_base',
        itemId: 'si_bots',
        status: 'active',
      },
    })
  })

  it('filters billing portal plan-change options by per-bot action count', async () => {
    const { getNeededStripeProduct } = await loadHelpers()
    const botWithNineActions = {
      tools: {
        calendly: { enabled: true, url: 'https://calendly.com/acme/demo' },
        calcom: { enabled: true, url: 'https://cal.com/acme/demo' },
        tidycal: { enabled: true, url: 'https://tidycal.com/acme/demo' },
        web_search: { enabled: true },
        stripe: { enabled: true },
        customButtons: [
          { enabled: true },
          { enabled: true },
          { enabled: true },
        ],
      },
      leadCollect: true,
    }

    expect(
      getNeededStripeProduct(
        {
          botCount: 1,
          pageCount: 1000,
          questionCount: 1000,
          roles: {},
        },
        [],
        [botWithNineActions],
      ),
    ).toEqual([
      ['price_business_monthly', 'price_business_yearly'],
    ])
  })

  it('filters billing portal plan-change options by action feature plan gates', async () => {
    const { getNeededStripeProduct } = await loadHelpers()
    const baseTeam = {
      botCount: 1,
      pageCount: 1000,
      questionCount: 1000,
      roles: {},
    }

    expect(
      getNeededStripeProduct(baseTeam, [], [
        {
          tools: {
            web_search: { enabled: true },
          },
        },
      ]),
    ).toEqual([
      ['price_standard_monthly', 'price_standard_yearly'],
      ['price_business_monthly', 'price_business_yearly'],
    ])

    expect(
      getNeededStripeProduct(baseTeam, [], [
        {
          tools: {
            web_search: {
              enabled: true,
              allowed_domains: ['docsbot.ai'],
            },
          },
        },
      ]),
    ).toEqual([
      ['price_business_monthly', 'price_business_yearly'],
    ])

    expect(
      getNeededStripeProduct(baseTeam, [], [
        {
          widgetSkills: ['refunds'],
        },
      ]),
    ).toEqual([
      ['price_standard_monthly', 'price_standard_yearly'],
      ['price_business_monthly', 'price_business_yearly'],
    ])
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
    })

    expect(
      stripePlan({
        id: 'ZrbLG98bbxZ9EFqiPvyl',
      }),
    ).toMatchObject({
      id: 'staff',
      scheduleInterval: 'daily',
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
