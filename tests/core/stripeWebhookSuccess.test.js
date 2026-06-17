import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAsyncIterableReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  stripePlan: vi.fn(),
  constructEvent: vi.fn(),
  checkoutSessionRetrieve: vi.fn(),
  customerUpdate: vi.fn(),
  subscriptionUpdate: vi.fn(),
  getTeam: vi.fn(),
  getTeamEmail: vi.fn(),
  teamOwner: vi.fn(),
  phTrack: vi.fn(),
  slackSend: vi.fn(),
  firestore: {
    runTransaction: vi.fn(),
    collection: vi.fn(),
  },
}))

vi.hoisted(() => {
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.test/services/test'
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
  })
})

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    stripePlan: mocks.stripePlan,
  }
})

vi.mock('@/utils/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
    checkout: {
      sessions: {
        retrieve: mocks.checkoutSessionRetrieve,
      },
    },
    customers: {
      update: mocks.customerUpdate,
    },
    invoices: {
      retrieve: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    subscriptions: {
      cancel: vi.fn(),
      update: mocks.subscriptionUpdate,
    },
  },
}))

vi.mock('@/lib/dbQueries', () => ({
  getTeam: mocks.getTeam,
  getTeamEmail: mocks.getTeamEmail,
  getUser: vi.fn(),
}))

vi.mock('@/lib/bento', () => ({
  bentoTrack: vi.fn(),
  teamOwner: mocks.teamOwner,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('@slack/webhook', () => ({
  IncomingWebhook: vi.fn().mockImplementation(function IncomingWebhook() {
    return { send: mocks.slackSend }
  }),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mocks.firestore,
}))

import stripeWebhookHandler from '@/pages/api/stripe-webhook'

describe('stripe webhook success path', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })

    mocks.firestore.collection.mockImplementation(() => ({
      doc: vi.fn((id) => ({ id })),
      where: vi.fn(() => ({
        where: vi.fn(),
      })),
    }))
    mocks.firestore.runTransaction.mockImplementation(async (callback) => {
      const queryResult = {
        empty: false,
        docs: [
          {
            id: 'team-1',
            data: () => ({ name: 'DocsBot Team' }),
          },
        ],
      }
      const transaction = {
        get: vi.fn(async () => queryResult),
        update: vi.fn(),
      }
      await callback(transaction)
      mocks.transaction = transaction
    })
    mocks.stripePlan.mockReturnValue({
      id: 'business',
      name: 'Business',
      questions: 1000,
    })
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          mode: 'subscription',
          client_reference_id: 'team-1',
        },
      },
    })
    mocks.checkoutSessionRetrieve.mockResolvedValue({
      customer: 'cus_123',
      currency: 'usd',
      amount_total: 4900,
      customer_details: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      subscription: {
        id: 'sub_123',
        status: 'active',
        quantity: 1,
        cancel_at_period_end: false,
        items: {
          data: [
            {
              quantity: 1,
              plan: {
                id: 'price_business_monthly',
                product: 'prod_business',
                amount: 4900,
                interval: 'month',
              },
            },
          ],
        },
      },
    })
    mocks.customerUpdate.mockResolvedValue({})
    mocks.subscriptionUpdate.mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      currency: 'usd',
      cancel_at_period_end: false,
      quantity: 1,
      cancellation_details: {},
      items: {
        data: [],
      },
    })
    mocks.getTeam.mockResolvedValue({ id: 'team-1', name: 'DocsBot Team' })
    mocks.teamOwner.mockReturnValue('owner-1')
    mocks.slackSend.mockResolvedValue(undefined)
    process.env.STRIPE_WEBHOOK_SECRET = 'stripe-secret'
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.test/services/test'
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
      teamMembers: {
        unit: 1,
        prices: {
          current: {
            monthly: 'price_team_members_monthly',
            annually: 'price_team_members_yearly',
          },
        },
      },
    })
  })

  it('handles a successful checkout.session.completed event', async () => {
    const req = createAsyncIterableReq(
      {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_123',
        },
      },
      [Buffer.from('{}')],
    )
    const res = createMockRes()

    await stripeWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ received: true })
    expect(mocks.checkoutSessionRetrieve).toHaveBeenCalledWith('cs_123', {
      expand: ['subscription'],
    })
    expect(mocks.customerUpdate).toHaveBeenCalledWith('cus_123', {
      metadata: { teamId: 'team-1' },
    })
    expect(mocks.transaction.update).toHaveBeenCalledWith(
      { id: 'team-1' },
      expect.objectContaining({
        plan: 'business',
        questionLimit: 1000,
        stripeSubscriptionPlan: 'price_business_monthly',
      }),
    )
  })

  it('ignores add-on-only subscription updates without overwriting the base plan', async () => {
    mocks.firestore.runTransaction.mockImplementation(async (callback) => {
      const queryResult = {
        empty: false,
        docs: [
          {
            id: 'team-1',
            data: () => ({
              name: 'DocsBot Team',
              stripeSubscriptionId: 'sub_base',
              stripeSubscriptionPlan: 'price_business_monthly',
              stripeSubscriptionStatus: 'active',
              stripeAddOns: {},
            }),
          },
        ],
      }
      const transaction = {
        get: vi.fn(async () => queryResult),
        update: vi.fn(),
      }
      await callback(transaction)
      mocks.transaction = transaction
    })
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_addons',
          customer: 'cus_123',
          status: 'active',
          items: {
            data: [
              {
                id: 'si_ai',
                quantity: 2,
                price: {
                  id: 'price_ai_credits_monthly',
                  product: 'prod_ai_credits',
                  amount: 4900,
                  interval: 'month',
                },
              },
            ],
          },
        },
      },
    })
    mocks.stripePlan.mockReturnValue({
      id: 'business',
      name: 'Business',
      questions: 70000,
    })

    const req = createAsyncIterableReq(
      {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_123',
        },
      },
      [Buffer.from('{}')],
    )
    const res = createMockRes()

    await stripeWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.transaction.update).not.toHaveBeenCalled()
  })

  it('mirrors annual add-on items on the same annual base subscription', async () => {
    mocks.firestore.runTransaction.mockImplementation(async (callback) => {
      const queryResult = {
        empty: false,
        docs: [
          {
            id: 'team-1',
            data: () => ({
              name: 'DocsBot Team',
              stripeSubscriptionId: 'sub_123',
              stripeSubscriptionPlan: 'price_business_monthly',
              stripeSubscriptionStatus: 'active',
              stripeAddOns: {
                aiCredits: {
                  quantity: 1,
                  subscriptionId: 'sub_123',
                  itemId: 'si_ai',
                },
              },
            }),
          },
        ],
      }
      const transaction = {
        get: vi.fn(async () => queryResult),
        update: vi.fn(),
      }
      await callback(transaction)
      mocks.transaction = transaction
    })
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
          currency: 'usd',
          cancel_at_period_end: false,
          quantity: 1,
          cancellation_details: {},
          plan: {
            id: 'price_business_yearly',
            product: 'prod_business',
            amount: 499200,
            interval: 'year',
          },
          items: {
            data: [
              {
                id: 'si_base',
                quantity: 1,
                price: {
                  id: 'price_business_yearly',
                  product: 'prod_business',
                  amount: 499200,
                  interval: 'year',
                },
              },
              {
                id: 'si_ai',
                quantity: 2,
                price: {
                  id: 'price_ai_credits_yearly',
                  product: 'prod_ai_credits',
                  amount: 58800,
                  interval: 'year',
                },
              },
              {
                id: 'si_team_members',
                quantity: 3,
                price: {
                  id: 'price_team_members_yearly',
                  product: 'prod_team_members',
                  amount: 22800,
                  interval: 'year',
                },
              },
            ],
          },
        },
      },
    })
    mocks.stripePlan.mockReturnValue({
      id: 'business',
      name: 'Business',
      questions: 70000,
    })

    const req = createAsyncIterableReq(
      {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_123',
        },
      },
      [Buffer.from('{}')],
    )
    const res = createMockRes()

    await stripeWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.transaction.update).toHaveBeenCalledWith(
      { id: 'team-1' },
      expect.objectContaining({
        stripeSubscriptionInterval: 'year',
        stripeAddOns: expect.objectContaining({
          aiCredits: expect.objectContaining({
            quantity: 2,
            itemId: 'si_ai',
            subscriptionId: 'sub_123',
          }),
          teamMembers: expect.objectContaining({
            quantity: 3,
            itemId: 'si_team_members',
            subscriptionId: 'sub_123',
          }),
        }),
      }),
    )
  })

  it('sends a Slack notification when add-on quantities change', async () => {
    mocks.firestore.runTransaction.mockImplementation(async (callback) => {
      const queryResult = {
        empty: false,
        docs: [
          {
            id: 'team-1',
            data: () => ({
              name: 'DocsBot Team',
              stripeSubscriptionId: 'sub_123',
              stripeSubscriptionPlan: 'price_business_monthly',
              stripeSubscriptionStatus: 'active',
              stripeAddOns: {
                aiCredits: {
                  quantity: 1,
                  subscriptionId: 'sub_123',
                  itemId: 'si_ai',
                },
              },
            }),
          },
        ],
      }
      const transaction = {
        get: vi.fn(async () => queryResult),
        update: vi.fn(),
      }
      await callback(transaction)
      mocks.transaction = transaction
    })
    mocks.getTeamEmail.mockResolvedValue('owner@example.com')
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        previous_attributes: {
          items: {
            data: [
              {
                id: 'si_base',
                quantity: 1,
                price: {
                  id: 'price_business_monthly',
                  product: 'prod_business',
                  amount: 49900,
                  interval: 'month',
                },
              },
              {
                id: 'si_ai',
                quantity: 1,
                price: {
                  id: 'price_ai_credits_monthly',
                  product: 'prod_ai_credits',
                  amount: 4900,
                  interval: 'month',
                },
              },
            ],
          },
        },
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
          currency: 'usd',
          cancel_at_period_end: false,
          quantity: 1,
          cancellation_details: {},
          plan: {
            id: 'price_business_monthly',
            product: 'prod_business',
            amount: 49900,
            interval: 'month',
          },
          items: {
            data: [
              {
                id: 'si_base',
                quantity: 1,
                price: {
                  id: 'price_business_monthly',
                  product: 'prod_business',
                  amount: 49900,
                  interval: 'month',
                },
              },
              {
                id: 'si_ai',
                quantity: 3,
                price: {
                  id: 'price_ai_credits_monthly',
                  product: 'prod_ai_credits',
                  amount: 4900,
                  interval: 'month',
                },
              },
            ],
          },
        },
      },
    })
    mocks.stripePlan.mockReturnValue({
      id: 'business',
      name: 'Business',
      questions: 80000,
    })

    const req = createAsyncIterableReq(
      {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_123',
        },
      },
      [Buffer.from('{}')],
    )
    const res = createMockRes()

    await stripeWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.slackSend).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            title: 'DocsBot Subscription Add-Ons Changed',
            fields: expect.arrayContaining([
              expect.objectContaining({
                title: 'Customer Email',
                value: 'owner@example.com',
              }),
              expect.objectContaining({
                title: 'Team',
                value: '<https://docsbot.ai/app/team?switchTeam=team-1|DocsBot Team>',
              }),
              expect.objectContaining({
                title: 'Changes',
                value: 'AI Credits: 1 -> 3',
              }),
            ]),
          }),
        ],
      }),
    )
  })

  it('clears stored add-ons when the base subscription no longer has add-on items', async () => {
    mocks.firestore.runTransaction.mockImplementation(async (callback) => {
      const queryResult = {
        empty: false,
        docs: [
          {
            id: 'team-1',
            data: () => ({
              name: 'DocsBot Team',
              stripeSubscriptionId: 'sub_123',
              stripeSubscriptionPlan: 'price_personal_monthly',
              stripeSubscriptionStatus: 'active',
              stripeAddOns: {
                aiCredits: {
                  quantity: 1,
                  subscriptionId: 'sub_123',
                  itemId: 'si_ai',
                  status: 'active',
                },
              },
            }),
          },
        ],
      }
      const transaction = {
        get: vi.fn(async () => queryResult),
        update: vi.fn(),
      }
      await callback(transaction)
      mocks.transaction = transaction
    })
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active',
          currency: 'usd',
          cancel_at_period_end: false,
          quantity: 1,
          cancellation_details: {},
          plan: {
            id: 'price_personal_monthly',
            product: 'prod_personal',
            amount: 4900,
            interval: 'month',
          },
          items: {
            data: [
              {
                id: 'si_base',
                quantity: 1,
                price: {
                  id: 'price_personal_monthly',
                  product: 'prod_personal',
                  amount: 4900,
                  interval: 'month',
                },
              },
            ],
          },
        },
      },
    })
    mocks.stripePlan.mockReturnValue({
      id: 'personal',
      name: 'Personal',
      questions: 5000,
    })

    const req = createAsyncIterableReq(
      {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_123',
        },
      },
      [Buffer.from('{}')],
    )
    const res = createMockRes()

    await stripeWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.transaction.update).toHaveBeenCalledWith(
      { id: 'team-1' },
      expect.objectContaining({
        stripeAddOns: expect.objectContaining({
          aiCredits: expect.objectContaining({
            quantity: 0,
            itemId: null,
            subscriptionId: 'sub_123',
            status: 'active',
          }),
        }),
        questionLimit: 5000,
      }),
    )
  })
})
