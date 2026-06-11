import { afterEach, describe, expect, it, vi } from 'vitest'

const firestoreMock = vi.hoisted(() => ({
  runTransaction: vi.fn(),
  collection: vi.fn(),
}))

const storageMock = vi.hoisted(() => ({
  bucket: vi.fn(() => ({
    deleteFiles: vi.fn(),
  })),
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => firestoreMock),
  FieldPath: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(),
  },
}))

vi.mock('@/config/firebase-ui.config', () => ({
  firebaseConfig: { storageBucket: 'test-bucket' },
}))

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => storageMock),
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: vi.fn(),
  getTeam: vi.fn(),
}))

vi.mock('@/lib/weaviate', () => ({
  deleteTenant: vi.fn(),
}))

vi.mock('@/lib/turbopuffer', () => ({
  deleteTurbopufferNamespace: vi.fn(),
}))

vi.mock('@/lib/service', () => ({
  QueueSourceExpel: vi.fn(),
}))

vi.mock('@/utils/helpers', () => ({
  isSuperAdmin: vi.fn(() => false),
  checkPlanPermission: vi.fn(() => ({ allowed: true, requiredPlanLabel: 'Business' })),
  countBillableBotActions: vi.fn(() => 1),
  getBotActionSlotLimit: vi.fn(() => 8),
}))

vi.mock('@/constants/strings.constants', () => ({
  i18n: { en: { labels: {} } },
}))

vi.mock('@/constants/prompts.constants', () => ({
  PRESET_PROMPTS: {},
}))

vi.mock('@/lib/truto', () => ({
  DeleteIntegratedAccount: vi.fn(),
  BulkDeleteIntegratedAccounts: vi.fn(),
}))

vi.mock('@/constants/sourceTypes.constants', () => ({
  isTrutoSourceType: vi.fn(() => false),
}))

vi.mock('@/lib/slackHelpers', () => ({
  getBotIdFromChannelMapping: vi.fn(),
  getValidChannelEntries: vi.fn(() => []),
}))

vi.mock('@/lib/stripeConnect', () => ({
  OBSOLETE_STRIPE_TOOL_METADATA_KEYS: [],
}))

import { deleteSource } from '@/lib/apiFunctions'

function makeDocRef(path) {
  return {
    path,
    collection: vi.fn((name) => ({
      doc: vi.fn((id) => makeDocRef(`${path}/${name}/${id}`)),
    })),
  }
}

describe('deleteSource count updates', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('clamps team and bot source/page/chunk counts when deleting a failed source', async () => {
    const refs = {}
    firestoreMock.collection.mockImplementation((name) => ({
      doc: vi.fn((id) => {
        const ref = makeDocRef(`${name}/${id}`)
        refs[ref.path] = ref
        return ref
      }),
    }))

    const updates = []
    firestoreMock.runTransaction.mockImplementation(async (callback) => {
      const transaction = {
        get: vi.fn(async (ref) => {
          if (ref.path === 'teams/team-1') {
            return {
              exists: true,
              data: () => ({ sourceCount: 0, pageCount: 0, chunkCount: 0 }),
            }
          }
          if (ref.path === 'teams/team-1/bots/bot-1') {
            return {
              exists: true,
              data: () => ({ sourceCount: 0, pageCount: 0, chunkCount: 0 }),
            }
          }
          return {
            exists: true,
            data: () => ({
              type: 'sitemap',
              status: 'failed',
              pageCount: 3268,
              chunkCount: 99,
            }),
          }
        }),
        update: vi.fn((ref, payload) => updates.push({ path: ref.path, payload })),
        delete: vi.fn(),
      }

      await callback(transaction)
    })

    await deleteSource('team-1', { id: 'bot-1', indexId: 'idx-1' }, 'source-1')

    expect(updates).toEqual([
      {
        path: 'teams/team-1',
        payload: {
          sourceCount: 0,
          chunkCount: 0,
          pageCount: 0,
          needsUpdate: true,
        },
      },
      {
        path: 'teams/team-1/bots/bot-1',
        payload: {
          sourceCount: 0,
          chunkCount: 0,
          pageCount: 0,
          status: 'pending',
        },
      },
    ])
  })
})
