import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  queueSourceRegest: vi.fn(),
  getSource: vi.fn(),
  getSources: vi.fn(),
  getIntegratedAccountsByTenantId: vi.fn(),
  getTenantId: vi.fn(),
  deleteIntegratedAccount: vi.fn(),
  firestore: {
    collection: vi.fn(),
  },
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/config/firebase-ui.config', () => ({
  firebaseConfig: {
    storageBucket: 'docsbot-test.appspot.com',
  },
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mocks.firestore,
}))

vi.mock('@/lib/service', () => ({
  QueueSourceRegest: mocks.queueSourceRegest,
}))

vi.mock('@/lib/dbQueries', () => ({
  getSource: mocks.getSource,
  getSources: mocks.getSources,
  getTeam: vi.fn(),
}))

vi.mock('@/lib/truto', () => ({
  GetIntegratedAccountsByTenantID: mocks.getIntegratedAccountsByTenantId,
  GetTenantId: mocks.getTenantId,
  DeleteIntegratedAccount: mocks.deleteIntegratedAccount,
}))

import trutoWebhookHandler from '@/pages/api/truto-webhook'

describe('Truto webhook success path', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })

    mocks.getSource.mockResolvedValue({
      id: 'source1',
      trutoIntegrationID: 'keep-1',
    })
    mocks.getSources.mockResolvedValue({
      sources: [{ trutoIntegrationID: 'keep-1' }],
    })
    mocks.getIntegratedAccountsByTenantId.mockResolvedValue([
      { id: 'keep-1' },
      { id: 'orphan-1' },
    ])
    mocks.getTenantId.mockReturnValue('team1-bot1')
    mocks.queueSourceRegest.mockResolvedValue(undefined)
    mocks.deleteIntegratedAccount.mockResolvedValue(undefined)
    mocks.firestore.collection.mockImplementation(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            update: vi.fn(async () => undefined),
          })),
        })),
      })),
    }))
    process.env.TRUTO_WEBHOOK_SIGNATURE = 'truto-secret'
  })

  it('processes a valid integrated_account:created webhook and purges orphans', async () => {
    const payload = JSON.stringify({
      id: 'sync_1',
      event: 'integrated_account:created',
      payload: {
        id: 'keep-1',
        tenant_id: 'team1-bot1',
      },
    })
    const signatureHash = crypto
      .createHmac('sha256', process.env.TRUTO_WEBHOOK_SIGNATURE)
      .update(payload)
      .digest('base64')

    const req = createMockReq({
      method: 'POST',
      headers: {
        'x-truto-signature': `v=${signatureHash}`,
      },
      body: payload,
    })
    const res = createMockRes()

    await trutoWebhookHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'OK' })
    expect(mocks.deleteIntegratedAccount).toHaveBeenCalledWith('orphan-1')
  })
})
