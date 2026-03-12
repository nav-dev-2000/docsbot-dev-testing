import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
  lookupFAQs: vi.fn(),
  saveFAQs: vi.fn(),
  checkFAQsRateLimit: vi.fn(),
  addPrompt: vi.fn(),
  getPrompt: vi.fn(),
  checkPromptRateLimit: vi.fn(),
  lookupYoutubeData: vi.fn(),
  saveYoutubeData: vi.fn(),
  checkYoutubeRateLimit: vi.fn(),
  fetchYoutubeSubtitles: vi.fn(),
  phTrack: vi.fn(),
  isSuperAdmin: vi.fn(),
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

vi.mock('@/lib/tools', () => ({
  lookupFAQs: mocks.lookupFAQs,
  saveFAQs: mocks.saveFAQs,
  checkFAQsRateLimit: mocks.checkFAQsRateLimit,
  addPrompt: mocks.addPrompt,
  getPrompt: mocks.getPrompt,
  checkPromptRateLimit: mocks.checkPromptRateLimit,
  lookupYoutubeData: mocks.lookupYoutubeData,
  saveYoutubeData: mocks.saveYoutubeData,
  checkYoutubeRateLimit: mocks.checkYoutubeRateLimit,
  fetchYoutubeSubtitles: mocks.fetchYoutubeSubtitles,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    isSuperAdmin: mocks.isSuperAdmin,
  }
})

vi.mock('@/lib/cloudflare', () => ({
  clearCloudflareCache: vi.fn(),
}))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: '{}' } }],
        })),
      },
    },
    embeddings: {
      create: vi.fn(async () => ({
        data: [{ embedding: [0.1, 0.2] }],
      })),
    },
  })),
}))

import faqHandler from '@/pages/api/tools/faq'
import promptGeneratorHandler from '@/pages/api/tools/prompt-generator'
import textPrompterHandler from '@/pages/api/tools/text-prompter'
import youtubePrompterHandler from '@/pages/api/tools/youtube-prompter'

describe('tool API guardrails', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })

    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })
    mocks.lookupFAQs.mockResolvedValue(null)
    mocks.checkFAQsRateLimit.mockResolvedValue(false)
    mocks.checkPromptRateLimit.mockResolvedValue(false)
    mocks.lookupYoutubeData.mockResolvedValue(null)
    mocks.checkYoutubeRateLimit.mockResolvedValue(false)
    mocks.fetchYoutubeSubtitles.mockResolvedValue({
      metadata: { title: 'Video' },
      subtitles: 'Transcript',
    })
    mocks.isSuperAdmin.mockReturnValue(false)
    process.env.VERCEL_REGION = 'iad1'
  })

  it('returns cached FAQ content without invoking the expensive generation flow', async () => {
    mocks.lookupFAQs.mockResolvedValue({
      FAQs: [{ question: 'What is DocsBot?' }],
      summary: 'summary',
      screenCap: 'full.png',
      thumbnail: 'thumb.png',
    })

    const req = createMockReq({
      method: 'POST',
      body: { siteURL: 'https://docsbot.ai/pricing' },
    })
    const res = createMockRes()

    await faqHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      faqs: [{ question: 'What is DocsBot?' }],
      summary: 'summary',
      screenCap: 'full.png',
      thumbnail: 'thumb.png',
    })
  })

  it('rate-limits FAQ generation requests before scraping or OpenAI usage', async () => {
    mocks.checkFAQsRateLimit.mockResolvedValue(true)

    const req = createMockReq({
      method: 'POST',
      body: { siteURL: 'https://docsbot.ai/pricing' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
    })
    const res = createMockRes()

    await faqHandler(req, res)

    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({ message: 'Your IP has been rate limited.' })
  })

  it('blocks prompt-generator requests from disallowed countries and sketchy input', async () => {
    const blockedCountryReq = createMockReq({
      method: 'POST',
      headers: {
        'cf-ipcountry': 'IN',
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        input: 'Write a product onboarding prompt',
      },
    })
    const blockedCountryRes = createMockRes()
    await promptGeneratorHandler(blockedCountryReq, blockedCountryRes)
    expect(blockedCountryRes.statusCode).toBe(403)

    const forbiddenReq = createMockReq({
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        input: 'Generate a casino promo code prompt',
      },
    })
    const forbiddenRes = createMockRes()
    await promptGeneratorHandler(forbiddenReq, forbiddenRes)
    expect(forbiddenRes.statusCode).toBe(400)
    expect(forbiddenRes.body.message).toContain('inappropriate content')
  })

  it('rate-limits prompt-generator requests for normal users', async () => {
    mocks.checkPromptRateLimit.mockResolvedValue(true)

    const req = createMockReq({
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        input: 'Write a support prompt',
      },
    })
    const res = createMockRes()

    await promptGeneratorHandler(req, res)

    expect(res.statusCode).toBe(429)
  })

  it('blocks text-prompter requests by country and rate limit', async () => {
    const blockedCountryReq = createMockReq({
      method: 'POST',
      headers: {
        'cf-ipcountry': 'PK',
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        type: 'humanize',
        input: 'Rewrite this paragraph naturally.',
      },
    })
    const blockedCountryRes = createMockRes()
    await textPrompterHandler(blockedCountryReq, blockedCountryRes)
    expect(blockedCountryRes.statusCode).toBe(403)

    mocks.checkPromptRateLimit.mockResolvedValue(true)
    const limitedReq = createMockReq({
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        type: 'humanize',
        input: 'Rewrite this paragraph naturally.',
      },
    })
    const limitedRes = createMockRes()
    await textPrompterHandler(limitedReq, limitedRes)
    expect(limitedRes.statusCode).toBe(429)
  })

  it('validates YouTube inputs and rate-limits generation requests', async () => {
    const invalidUrlReq = createMockReq({
      method: 'POST',
      body: {
        videoUrl: 'not-a-youtube-url',
        type: 'summary',
      },
    })
    const invalidUrlRes = createMockRes()
    await youtubePrompterHandler(invalidUrlReq, invalidUrlRes)
    expect(invalidUrlRes.statusCode).toBe(400)

    mocks.checkYoutubeRateLimit.mockResolvedValue(true)
    const limitedReq = createMockReq({
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
      body: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'summary',
      },
    })
    const limitedRes = createMockRes()
    await youtubePrompterHandler(limitedReq, limitedRes)
    expect(limitedRes.statusCode).toBe(429)

    const invalidGetReq = createMockReq({
      method: 'GET',
      query: { videoId: '', type: 'summary' },
    })
    const invalidGetRes = createMockRes()
    await youtubePrompterHandler(invalidGetReq, invalidGetRes)
    expect(invalidGetRes.statusCode).toBe(400)
  })
})
