import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  timestampNow: vi.fn(() => 'NOW'),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: mocks.getFirestore,
  Timestamp: {
    now: mocks.timestampNow,
  },
}))

import { deliverWebhookEvent } from '@/lib/webhookDelivery'

describe('webhookDelivery', () => {
  it('does not resolve Firestore while the module imports', () => {
    expect(mocks.getFirestore).not.toHaveBeenCalled()
  })

  it('resolves Firestore when delivering an event', async () => {
    const botRef = {
      collection: vi.fn(),
      doc: vi.fn(),
      get: vi.fn(async () => ({ exists: false })),
    }
    botRef.collection.mockReturnValue(botRef)
    botRef.doc.mockReturnValue(botRef)

    mocks.getFirestore.mockReturnValueOnce(botRef)

    await expect(
      deliverWebhookEvent({
        teamId: 'team-1',
        botId: 'bot-1',
        event: 'lead.created',
        payload: { event: 'lead.created' },
      }),
    ).resolves.toEqual({
      delivered: 0,
      failed: 0,
      deliveries: [],
    })

    expect(mocks.getFirestore).toHaveBeenCalledTimes(1)
  })
})
