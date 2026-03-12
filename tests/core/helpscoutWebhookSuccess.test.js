import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEventStreamReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuth: vi.fn(),
  getTeams: vi.fn(),
  getTeam: vi.fn(),
  getURL: vi.fn(),
  stripePlan: vi.fn(),
  firestore: {
    collection: vi.fn(),
  },
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: mocks.getAuth,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mocks.firestore,
}))

vi.mock('@/lib/dbQueries', () => ({
  getTeam: mocks.getTeam,
  getTeams: mocks.getTeams,
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    getURL: mocks.getURL,
    stripePlan: mocks.stripePlan,
  }
})

import helpscoutWebhookHandler from '@/pages/api/helpscout-webhook'

describe('Help Scout webhook success path', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })

    mocks.getAuth.mockReturnValue({
      getUserByEmail: vi.fn(async () => ({ uid: 'user-1' })),
    })
    mocks.getTeams.mockResolvedValue([{ id: 'team-1' }])
    mocks.getTeam.mockResolvedValue({
      id: 'team-1',
      name: 'DocsBot Team',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      stripeSubscriptionPrice: 4900,
      stripeSubscriptionQuantity: 1,
      stripeSubscriptionInterval: 'month',
    })
    mocks.getURL.mockReturnValue('https://docsbot.ai')
    mocks.stripePlan.mockReturnValue({ id: 'business', name: 'Business' })
    mocks.firestore.collection.mockImplementation((name) => {
      if (name === 'users') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn(async () => ({
              exists: true,
              data: () => ({ currentTeam: 'team-1' }),
            })),
          })),
        }
      }
      return {
        doc: vi.fn(),
      }
    })

    process.env.HELPSCOUT_WEBHOOK_SECRET = 'helpscout-secret'
    process.env.HELPSCOUT_APP_ID = 'app-id'
    process.env.HELPSCOUT_APP_SECRET = 'app-secret'
  })

  it('updates Help Scout customer metadata when the webhook resolves to a team', async () => {
    const payload = JSON.stringify({
      customer: {
        id: 99,
        email: 'customer@example.com',
      },
    })
    const signature = crypto
      .createHmac('sha1', process.env.HELPSCOUT_WEBHOOK_SECRET)
      .update(payload)
      .digest('base64')

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({ access_token: 'token-123' })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn(async () => ''),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn(async () => ({ _embedded: {} })),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn(async () => ''),
      })

    const req = createEventStreamReq(
      {
        method: 'POST',
        headers: {
          'x-helpscout-event': 'convo.created',
          'x-helpscout-signature': signature,
        },
      },
      [Buffer.from(payload)],
    )
    const res = createMockRes()

    await helpscoutWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'Customer metadata updated' })
    expect(global.fetch).toHaveBeenCalledTimes(4)
  })
})
