import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAsyncIterableReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  stripePlan: vi.fn(),
  constructEvent: vi.fn(),
  checkoutSessionRetrieve: vi.fn(),
  customerUpdate: vi.fn(),
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
    this.send = mocks.slackSend
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
    mocks.stripePlan.mockReturnValue({ name: 'Business', questions: 1000 })
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
    mocks.getTeam.mockResolvedValue({ id: 'team-1', name: 'DocsBot Team' })
    mocks.teamOwner.mockReturnValue('owner-1')
    mocks.slackSend.mockResolvedValue(undefined)
    process.env.STRIPE_WEBHOOK_SECRET = 'stripe-secret'
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
  })
})
