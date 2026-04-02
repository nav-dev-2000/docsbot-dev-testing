import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const botDocGet = vi.fn()
  const botsQueryGet = vi.fn()

  const botsCollection = {
    doc: vi.fn(() => ({
      get: botDocGet,
    })),
    orderBy: vi.fn(() => ({
      limit: vi.fn(() => ({
        get: botsQueryGet,
      })),
    })),
  }

  const teamDocRef = {
    collection: vi.fn(() => botsCollection),
  }

  const teamsCollection = {
    doc: vi.fn(() => teamDocRef),
  }

  return {
    configureFirebaseApp: vi.fn(),
    mapWebhookEntries: vi.fn((entries) => entries),
    firestore: {
      collection: vi.fn((name) => {
        if (name === 'teams') {
          return teamsCollection
        }
        return teamsCollection
      }),
    },
    botDocGet,
    botsQueryGet,
  }
})

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mocks.firestore,
  FieldValue: {},
  FieldPath: {
    documentId: () => '__name__',
  },
  Timestamp: class Timestamp {},
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({}),
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    stripePlan: vi.fn(),
  }
})

vi.mock('@/utils/fakeUsers', () => ({
  __esModule: true,
  default: vi.fn(),
}))

vi.mock('@/lib/bento', () => ({
  bentoTrack: vi.fn(),
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: vi.fn(),
}))

vi.mock('@/lib/webhooks', () => ({
  mapWebhookEntries: mocks.mapWebhookEntries,
}))

import { getBot, getBots } from '@/lib/dbQueries'

const createTimestamp = (value) => ({
  toDate: () => new Date(value),
})

describe('dbQueries customButtons normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getBot normalizes spread-corrupted customButtons objects into arrays', async () => {
    mocks.botDocGet.mockResolvedValue({
      exists: true,
      id: 'XehewtsJxZPOS7NOHU1L',
      data: () => ({
        name: 'DocsBot Assistant',
        language: 'en',
        createdAt: createTimestamp('2026-04-01T00:00:00.000Z'),
        signatureKey: 'signature-key',
        tools: {
          customButtons: {
            0: {
              enabled: false,
              name: ' Docs ',
              instructions: ' When ',
              buttonText: ' Go ',
              url: '',
            },
          },
        },
      }),
    })

    const bot = await getBot(
      '9TnaEUyoAVVYcG2pDyR8',
      'XehewtsJxZPOS7NOHU1L',
    )

    expect(Array.isArray(bot.tools.customButtons)).toBe(true)
    expect(bot.tools.customButtons).toHaveLength(1)
    expect(bot.tools.customButtons[0]).toMatchObject({
      enabled: false,
      name: 'Docs',
      instructions: 'When',
      buttonText: 'Go',
    })
  })

  it('getBots normalizes malformed customButtons for list views too', async () => {
    mocks.botsQueryGet.mockResolvedValue({
      forEach: (callback) => {
        callback({
          id: 'XehewtsJxZPOS7NOHU1L',
          data: () => ({
            name: 'DocsBot Assistant',
            language: 'en',
            createdAt: createTimestamp('2026-04-01T00:00:00.000Z'),
            signatureKey: 'signature-key',
            tools: {
              customButtons: {
                0: {
                  enabled: true,
                  name: ' Learn more ',
                  instructions: ' Share docs ',
                  buttonText: ' Open ',
                  url: 'https://example.com/docs',
                },
              },
            },
          }),
        })
      },
    })

    const bots = await getBots({ id: '9TnaEUyoAVVYcG2pDyR8' }, 10)

    expect(bots).toHaveLength(1)
    expect(Array.isArray(bots[0].tools.customButtons)).toBe(true)
    expect(bots[0].tools.customButtons[0]).toMatchObject({
      enabled: true,
      name: 'Learn more',
      instructions: 'Share docs',
      buttonText: 'Open',
      url: 'https://example.com/docs',
    })
  })
})
