import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadBillingSubscriptionSync = async () =>
  import('@/utils/billingSubscriptionSync')

describe('billingSubscriptionSync', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds team billing updates with add-on quantities from subscription items', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PLANS = JSON.stringify({
      personal: {
        bots: 3,
        pages: 5000,
        questions: 5000,
        teamMembers: 1,
        prices: {
          current: {
            monthly: 'price_personal_monthly',
            annually: 'price_personal_yearly',
          },
        },
      },
    })
    process.env.NEXT_PUBLIC_STRIPE_ADDONS = JSON.stringify({
      aiCredits: {
        prices: {
          USD: {
            monthly: 'price_addon_ai_monthly',
            annually: 'price_addon_ai_yearly',
          },
        },
      },
      bots: {
        prices: {
          USD: {
            monthly: 'price_addon_bot_monthly',
            annually: 'price_addon_bot_yearly',
          },
        },
      },
      sourcePages: {
        prices: {
          USD: {
            monthly: 'price_addon_pages_monthly',
            annually: 'price_addon_pages_yearly',
          },
        },
      },
      teamMembers: {
        prices: {
          USD: {
            monthly: 'price_addon_team_members_monthly',
            annually: 'price_addon_team_members_yearly',
          },
        },
      },
    })

    const { buildTeamBillingUpdate } = await loadBillingSubscriptionSync()

    const update = buildTeamBillingUpdate({
      team: {
        id: 'team-1',
        stripeAddOns: {},
      },
      subscription: {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        currency: 'usd',
        cancel_at_period_end: false,
        quantity: 1,
        items: {
          data: [
            {
              quantity: 1,
              price: {
                id: 'price_personal_monthly',
                product: 'prod_personal',
                amount: 4100,
                interval: 'month',
              },
            },
            {
              quantity: 2,
              price: {
                id: 'price_addon_ai_monthly',
                product: 'prod_addon_ai',
                amount: 4900,
                interval: 'month',
              },
            },
            {
              quantity: 3,
              price: {
                id: 'price_addon_team_members_monthly',
                product: 'prod_addon_team_members',
                amount: 900,
                interval: 'month',
              },
            },
          ],
        },
      },
    })

    expect(update).toMatchObject({
      stripeSubscriptionPlan: 'price_personal_monthly',
      stripeSubscriptionStatus: 'active',
      stripeAddOns: {
        aiCredits: expect.objectContaining({ quantity: 2 }),
        bots: expect.objectContaining({ quantity: 0 }),
        sourcePages: expect.objectContaining({ quantity: 0 }),
        teamMembers: expect.objectContaining({ quantity: 3 }),
      },
      questionLimit: 15000,
      plan: 'personal',
    })
  })

  it('keeps annual add-ons attached to the annual base subscription', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PLANS = JSON.stringify({
      standard: {
        bots: 3,
        pages: 15000,
        questions: 15000,
        teamMembers: 5,
        prices: {
          current: {
            monthly: 'price_standard_monthly',
            annually: 'price_standard_yearly',
          },
        },
      },
    })
    process.env.NEXT_PUBLIC_STRIPE_ADDONS = JSON.stringify({
      aiCredits: {
        prices: {
          current: {
            monthly: 'price_addon_ai_monthly',
            annually: 'price_addon_ai_yearly',
          },
        },
      },
      bots: {
        prices: {
          current: {
            monthly: 'price_addon_bot_monthly',
            annually: 'price_addon_bot_yearly',
          },
        },
      },
      sourcePages: {
        prices: {
          current: {
            monthly: 'price_addon_pages_monthly',
            annually: 'price_addon_pages_yearly',
          },
        },
      },
      teamMembers: {
        prices: {
          current: {
            monthly: 'price_addon_team_members_monthly',
            annually: 'price_addon_team_members_yearly',
          },
        },
      },
    })

    const { buildTeamBillingUpdate } = await loadBillingSubscriptionSync()

    const update = buildTeamBillingUpdate({
      team: {
        id: 'team-1',
        stripeAddOns: {},
      },
      subscription: {
        id: 'sub_annual',
        customer: 'cus_123',
        status: 'active',
        currency: 'usd',
        cancel_at_period_end: false,
        quantity: 1,
        items: {
          data: [
            {
              id: 'si_base',
              quantity: 1,
              price: {
                id: 'price_standard_yearly',
                product: 'prod_standard',
                amount: 149000,
                interval: 'year',
              },
            },
            {
              id: 'si_ai_annual',
              quantity: 2,
              price: {
                id: 'price_addon_ai_yearly',
                product: 'prod_addon_ai',
                amount: 58800,
                interval: 'year',
              },
            },
            {
              id: 'si_team_members_annual',
              quantity: 2,
              price: {
                id: 'price_addon_team_members_yearly',
                product: 'prod_addon_team_members',
                amount: 10800,
                interval: 'year',
              },
            },
          ],
        },
      },
    })

    expect(update).toMatchObject({
      stripeSubscriptionId: 'sub_annual',
      stripeSubscriptionPlan: 'price_standard_yearly',
      stripeSubscriptionInterval: 'year',
      stripeAddOns: {
        aiCredits: expect.objectContaining({
          quantity: 2,
          subscriptionId: 'sub_annual',
          itemId: 'si_ai_annual',
          status: 'active',
        }),
        teamMembers: expect.objectContaining({
          quantity: 2,
          subscriptionId: 'sub_annual',
          itemId: 'si_team_members_annual',
          status: 'active',
        }),
      },
      questionLimit: 25000,
    })
  })

  it('ignores add-on-only subscriptions', async () => {
    const { isAddOnOnlySubscription } = await loadBillingSubscriptionSync()

    expect(
      isAddOnOnlySubscription({
        items: {
          data: [{ price: { id: 'price_addon_ai_monthly' } }],
        },
      }),
    ).toBe(true)
  })
})
