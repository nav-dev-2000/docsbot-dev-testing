import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  createFirestoreMock: () => {
    const querySnapshot = {
      docs: [],
      empty: true,
      size: 0,
      forEach: vi.fn(),
    }

    const ref = {
      collection: vi.fn(() => ref),
      doc: vi.fn(() => ref),
      where: vi.fn(() => ref),
      select: vi.fn(() => ref),
      limit: vi.fn(() => ref),
      orderBy: vi.fn(() => ref),
      add: vi.fn(async () => ({ id: 'team-new' })),
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined),
      get: vi.fn(async () => querySnapshot),
    }

    return ref
  },
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
  userTeamCheck: vi.fn(),
  getTeams: vi.fn(),
  getTeam: vi.fn(),
  getPrompts: vi.fn(),
  addOrUpdateRating: vi.fn(),
  getRating: vi.fn(),
  clearCloudflareCache: vi.fn(),
  getRawBody: vi.fn(),
  teamOwner: vi.fn(),
  bentoTrack: vi.fn(),
  QueueReport: vi.fn(),
  checkPlanPermission: vi.fn(),
  firestore: null,
}))

mocks.firestore = mocks.createFirestoreMock()

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

vi.mock('@/lib/userTeamCheck', () => ({
  __esModule: true,
  default: mocks.userTeamCheck,
}))

vi.mock('@/lib/dbQueries', () => ({
  getTeams: mocks.getTeams,
  getTeam: mocks.getTeam,
}))

vi.mock('@/lib/tools', () => ({
  getPrompts: mocks.getPrompts,
  addOrUpdateRating: mocks.addOrUpdateRating,
  getRating: mocks.getRating,
}))

vi.mock('@/lib/cloudflare', () => ({
  clearCloudflareCache: mocks.clearCloudflareCache,
}))

vi.mock('@/lib/bento', () => ({
  teamOwner: mocks.teamOwner,
  bentoTrack: mocks.bentoTrack,
}))

vi.mock('@/lib/service', () => ({
  QueueReport: mocks.QueueReport,
}))

vi.mock('raw-body', () => ({
  default: mocks.getRawBody,
}))

vi.mock('@/config/firebase-ui.config', () => ({
  firebaseConfig: {
    storageBucket: 'docsbot-test.appspot.com',
  },
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mocks.firestore,
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
  FieldPath: {
    documentId: vi.fn(() => 'documentId'),
  },
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    checkPlanPermission: mocks.checkPlanPermission,
  }
})

import clearBlogCacheHandler from '@/pages/api/tools/clear-blog-cache'
import promptSearchHandler from '@/pages/api/tools/prompt-search'
import rateHandler from '@/pages/api/tools/rate'
import cleanupDemoBotsHandler from '@/pages/api/cron/cleanup-demo-bots'
import reportsCronHandler from '@/pages/api/cron/reports'
import helpscoutWebhookHandler from '@/pages/api/helpscout-webhook'
import trutoWebhookHandler from '@/pages/api/truto-webhook'
import teamsHandler from '@/pages/api/teams/index'
import researchCountHandler from '@/pages/api/teams/[teamId]/research-count'
import logoutHandler from '@/pages/api/logout'
import waitlistHandler from '@/pages/api/waitlist'

describe('selected API route contracts', () => {
  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.getAuthorizedUser.mockReset()
    mocks.userTeamCheck.mockReset()
    mocks.getTeams.mockReset()
    mocks.getTeam.mockReset()
    mocks.getPrompts.mockReset()
    mocks.addOrUpdateRating.mockReset()
    mocks.getRating.mockReset()
    mocks.clearCloudflareCache.mockReset()
    mocks.getRawBody.mockReset()
    mocks.teamOwner.mockReset()
    mocks.bentoTrack.mockReset()
    mocks.QueueReport.mockReset()
    mocks.checkPlanPermission.mockReset()
    mocks.firestore = mocks.createFirestoreMock()

    mocks.getAuthorizedUser.mockResolvedValue({
      uid: 'user-1',
      name: 'Test User',
      email: 'user@example.com',
    })
    mocks.userTeamCheck.mockResolvedValue({
      userId: 'user-1',
      team: { id: 'team-1', researchCount: 4, roles: { 'user-1': 'owner' } },
    })
    mocks.getTeams.mockResolvedValue([{ id: 'team-1', name: 'DocsBot' }])
    mocks.getTeam.mockResolvedValue({ id: 'team-new', name: "Test User's Team" })
    mocks.getPrompts.mockResolvedValue([
      { name: 'Prompt Builder', short_description: 'Build better prompts' },
      { name: 'FAQ Writer', short_description: 'Generate answers' },
    ])
    mocks.getRating.mockResolvedValue({ rating: 4, count: 2 })
    mocks.getRawBody.mockResolvedValue('{}')
    mocks.checkPlanPermission.mockReturnValue({ allowed: true })
    global.fetch = vi.fn()
    process.env.CRON_SECRET = 'cron-secret'
  })

  it('requires authentication for cache clears and blocks wrong methods', async () => {
    mocks.getAuthorizedUser.mockRejectedValueOnce(new Error('Missing session'))

    const unauthorizedReq = createMockReq({
      method: 'POST',
      body: { articlePath: '/article/test' },
    })
    const unauthorizedRes = createMockRes()
    await clearBlogCacheHandler(unauthorizedReq, unauthorizedRes)
    expect(unauthorizedRes.statusCode).toBe(401)

    const wrongMethodReq = createMockReq({ method: 'GET' })
    const wrongMethodRes = createMockRes()
    await clearBlogCacheHandler(wrongMethodReq, wrongMethodRes)
    expect(wrongMethodRes.statusCode).toBe(405)
  })

  it('searches prompts and enforces query + method requirements', async () => {
    const badReq = createMockReq({ method: 'GET', query: {} })
    const badRes = createMockRes()
    await promptSearchHandler(badReq, badRes)
    expect(badRes.statusCode).toBe(400)

    const okReq = createMockReq({
      method: 'GET',
      query: { query: 'prompt' },
    })
    const okRes = createMockRes()
    await promptSearchHandler(okReq, okRes)
    expect(okRes.statusCode).toBe(200)
    expect(okRes.body).toEqual([
      { name: 'Prompt Builder', short_description: 'Build better prompts' },
    ])

    const methodReq = createMockReq({ method: 'POST' })
    const methodRes = createMockRes()
    await promptSearchHandler(methodReq, methodRes)
    expect(methodRes.statusCode).toBe(405)
  })

  it('validates ratings input and supports get + post only', async () => {
    const invalidReq = createMockReq({
      method: 'POST',
      body: { itemId: '', rating: 10 },
    })
    const invalidRes = createMockRes()
    await rateHandler(invalidReq, invalidRes)
    expect(invalidRes.statusCode).toBe(400)

    const postReq = createMockReq({
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: { itemId: 'prompt-1', rating: 5 },
    })
    const postRes = createMockRes()
    await rateHandler(postReq, postRes)
    expect(postRes.statusCode).toBe(200)
    expect(postRes.body).toEqual({ success: true, rating: 4, count: 2 })

    const getReq = createMockReq({
      method: 'GET',
      query: { itemId: 'prompt-1' },
    })
    const getRes = createMockRes()
    await rateHandler(getReq, getRes)
    expect(getRes.statusCode).toBe(200)

    const methodReq = createMockReq({ method: 'DELETE' })
    const methodRes = createMockRes()
    await rateHandler(methodReq, methodRes)
    expect(methodRes.statusCode).toBe(405)
  })

  it('protects cron routes with method and secret checks', async () => {
    const cleanupMethodReq = createMockReq({ method: 'POST' })
    const cleanupMethodRes = createMockRes()
    await cleanupDemoBotsHandler(cleanupMethodReq, cleanupMethodRes)
    expect(cleanupMethodRes.statusCode).toBe(405)

    const cleanupAuthReq = createMockReq({ method: 'GET' })
    const cleanupAuthRes = createMockRes()
    await cleanupDemoBotsHandler(cleanupAuthReq, cleanupAuthRes)
    expect(cleanupAuthRes.statusCode).toBe(401)

    const reportsReq = createMockReq({ method: 'GET' })
    const reportsRes = createMockRes()
    await reportsCronHandler(reportsReq, reportsRes)
    expect(reportsRes.statusCode).toBe(401)
  })

  it('rejects invalid webhook signatures early', async () => {
    const helpscoutMethodReq = createMockReq({ method: 'GET' })
    const helpscoutMethodRes = createMockRes()
    await helpscoutWebhookHandler(helpscoutMethodReq, helpscoutMethodRes)
    expect(helpscoutMethodRes.statusCode).toBe(405)

    const helpscoutReq = createMockReq({
      method: 'POST',
      headers: { 'x-helpscout-event': 'conversation.created' },
    })
    const rawBodyReq = Object.assign(new EventEmitter(), helpscoutReq)
    queueMicrotask(() => {
      rawBodyReq.emit('data', Buffer.from('{}'))
      rawBodyReq.emit('end')
    })
    const helpscoutRes = createMockRes()
    await helpscoutWebhookHandler(rawBodyReq, helpscoutRes)
    expect(helpscoutRes.statusCode).toBe(401)

    const trutoReq = createMockReq({
      method: 'POST',
      body: '{}',
    })
    const trutoRes = createMockRes()
    await trutoWebhookHandler(trutoReq, trutoRes)
    expect(trutoRes.statusCode).toBe(401)

    const trutoMethodReq = createMockReq({ method: 'GET' })
    const trutoMethodRes = createMockRes()
    await trutoWebhookHandler(trutoMethodReq, trutoMethodRes)
    expect(trutoMethodRes.statusCode).toBe(400)
  })

  it('enforces auth on team routes and returns simple successful payloads', async () => {
    mocks.getAuthorizedUser.mockRejectedValueOnce(new Error('Denied'))
    const unauthorizedTeamsReq = createMockReq({ method: 'GET' })
    const unauthorizedTeamsRes = createMockRes()
    await teamsHandler(unauthorizedTeamsReq, unauthorizedTeamsRes)
    expect(unauthorizedTeamsRes.statusCode).toBe(403)

    const listReq = createMockReq({ method: 'GET' })
    const listRes = createMockRes()
    await teamsHandler(listReq, listRes)
    expect(listRes.statusCode).toBe(200)
    expect(listRes.body).toEqual([{ id: 'team-1', name: 'DocsBot' }])

    const badMethodReq = createMockReq({ method: 'PATCH' })
    const badMethodRes = createMockRes()
    await teamsHandler(badMethodReq, badMethodRes)
    expect(badMethodRes.statusCode).toBe(400)

    mocks.userTeamCheck.mockRejectedValueOnce(new Error('Denied'))
    const authReq = createMockReq({ method: 'GET', query: { teamId: 'team-1' } })
    const authRes = createMockRes()
    await researchCountHandler(authReq, authRes)
    expect(authRes.statusCode).toBe(403)

    const countReq = createMockReq({ method: 'GET', query: { teamId: 'team-1' } })
    const countRes = createMockRes()
    await researchCountHandler(countReq, countRes)
    expect(countRes.statusCode).toBe(200)
    expect(countRes.body).toEqual({ researchCount: 4 })
  })

  it('handles logout idempotently and proxies waitlist responses', async () => {
    const logoutReq = createMockReq({ method: 'POST', headers: {} })
    const logoutRes = createMockRes()
    await logoutHandler(logoutReq, logoutRes)
    expect(logoutRes.statusCode).toBe(204)

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn(async () => ({ subscribed: true })),
    })
    const waitlistReq = createMockReq({
      method: 'POST',
      body: { email: 'user@example.com' },
    })
    const waitlistRes = createMockRes()
    await waitlistHandler(waitlistReq, waitlistRes)
    expect(waitlistRes.statusCode).toBe(200)
    expect(waitlistRes.body).toEqual({ subscribed: true })
  })
})
