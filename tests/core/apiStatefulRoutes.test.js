import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  userTeamCheck: vi.fn(),
  getAuthorizedUser: vi.fn(),
  getBots: vi.fn(),
  getBot: vi.fn(),
  getTeam: vi.fn(),
  acceptInvite: vi.fn(),
  validateBotParams: vi.fn(),
  canUserCreateDeleteBot: vi.fn(),
  stripePlan: vi.fn(),
  checkPlanPermission: vi.fn(),
  isSuperAdmin: vi.fn(),
  bentoTrack: vi.fn(),
  phTrack: vi.fn(),
  createTenant: vi.fn(),
  QueueBotCopy: vi.fn(),
  clearCloudflareCache: vi.fn(),
  sendInviteEmail: vi.fn(),
  detectRegionFromHeaders: vi.fn(),
  getAuth: vi.fn(),
  isVectorDbMaintenanceEnabled: vi.fn(),
  vectorDbMaintenanceResponse: vi.fn(),
  firestoreState: {
    addBot: vi.fn(),
    getCopyFromBot: vi.fn(),
    deleteBot: vi.fn(),
    updateTeam: vi.fn(),
    addInvite: vi.fn(),
    getInviteQuery: vi.fn(),
    getTeamDoc: vi.fn(),
  },
}))

const createFirestoreMock = () => {
  const invitesQuery = {
    where: vi.fn(() => invitesQuery),
    get: mocks.firestoreState.getInviteQuery,
    add: mocks.firestoreState.addInvite,
    doc: vi.fn(() => ({
      get: vi.fn(async () => ({
        data: () => ({ email: 'invitee@example.com' }),
      })),
    })),
  }

  const botsCollection = {
    add: mocks.firestoreState.addBot,
    doc: vi.fn((id) => ({
      get: mocks.firestoreState.getCopyFromBot,
      delete: mocks.firestoreState.deleteBot,
    })),
  }

  const teamDocRef = {
    collection: vi.fn((name) => {
      if (name === 'bots') return botsCollection
      return botsCollection
    }),
    get: mocks.firestoreState.getTeamDoc,
    update: mocks.firestoreState.updateTeam,
  }

  const teamsCollection = {
    doc: vi.fn(() => teamDocRef),
  }

  return {
    collection: vi.fn((name) => {
      if (name === 'teams') return teamsCollection
      if (name === 'invites') return invitesQuery
      return teamsCollection
    }),
    runTransaction: vi.fn(async (callback) =>
      callback({
        get: vi.fn(async () => ({
          exists: true,
          empty: false,
          data: () => ({ botCount: 0, roles: {} }),
          docs: [],
        })),
        update: vi.fn(),
        delete: vi.fn(),
      }),
    ),
  }
}

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/lib/userTeamCheck', () => ({
  __esModule: true,
  default: mocks.userTeamCheck,
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

vi.mock('@/lib/dbQueries', () => ({
  getBots: mocks.getBots,
  getBot: mocks.getBot,
  getTeam: mocks.getTeam,
  acceptInvite: mocks.acceptInvite,
}))

vi.mock('@/lib/apiFunctions', () => ({
  validateBotParams: mocks.validateBotParams,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserCreateDeleteBot: mocks.canUserCreateDeleteBot,
  }
})

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    stripePlan: mocks.stripePlan,
    checkPlanPermission: mocks.checkPlanPermission,
    isSuperAdmin: mocks.isSuperAdmin,
  }
})

vi.mock('@/lib/bento', () => ({
  bentoTrack: mocks.bentoTrack,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('@/lib/weaviate', () => ({
  createTenant: mocks.createTenant,
}))

vi.mock('@/lib/service', () => ({
  QueueBotCopy: mocks.QueueBotCopy,
}))

vi.mock('@/lib/cloudflare', () => ({
  clearCloudflareCache: mocks.clearCloudflareCache,
}))

vi.mock('@/utils/emails', () => ({
  sendInviteEmail: mocks.sendInviteEmail,
}))

vi.mock('@/lib/regionUtils', () => ({
  detectRegionFromHeaders: mocks.detectRegionFromHeaders,
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: mocks.getAuth,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => createFirestoreMock(),
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
}))

vi.mock('@/lib/maintenance', () => ({
  isVectorDbMaintenanceEnabled: mocks.isVectorDbMaintenanceEnabled,
  vectorDbMaintenanceResponse: mocks.vectorDbMaintenanceResponse,
}))

import botsHandler from '@/pages/api/teams/[teamId]/bots/index'
import inviteHandler from '@/pages/api/teams/[teamId]/invite'

describe('stateful team route handlers', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })

    Object.values(mocks.firestoreState).forEach((value) => value.mockReset())

    mocks.userTeamCheck.mockResolvedValue({
      userId: 'user-1',
      team: {
        id: 'team-1',
        name: 'DocsBot',
        roles: { 'user-1': 'owner' },
        botCount: 0,
      },
    })
    mocks.getAuthorizedUser.mockResolvedValue({
      uid: 'user-1',
      email: 'owner@example.com',
    })
    mocks.canUserCreateDeleteBot.mockReturnValue(true)
    mocks.stripePlan.mockReturnValue({
      bots: 10,
      teamMembers: 10,
      name: 'Business',
    })
    mocks.checkPlanPermission.mockReturnValue({
      allowed: true,
      requiredPlanLabel: 'Business',
    })
    mocks.isSuperAdmin.mockReturnValue(false)
    mocks.validateBotParams.mockResolvedValue({
      name: 'Support Bot',
    })
    mocks.detectRegionFromHeaders.mockReturnValue('EU')
    mocks.isVectorDbMaintenanceEnabled.mockReturnValue(false)
    mocks.vectorDbMaintenanceResponse.mockReturnValue({ message: 'maintenance' })
    mocks.firestoreState.addBot.mockResolvedValue({ id: 'bot-1' })
    mocks.firestoreState.getCopyFromBot.mockResolvedValue({
      exists: true,
      data: () => ({ id: 'bot-template' }),
    })
    mocks.firestoreState.deleteBot.mockResolvedValue(undefined)
    mocks.firestoreState.updateTeam.mockResolvedValue(undefined)
    mocks.firestoreState.addInvite.mockResolvedValue({ id: 'invite-1' })
    mocks.firestoreState.getInviteQuery.mockResolvedValue({ size: 0 })
    mocks.firestoreState.getTeamDoc.mockResolvedValue({
      data: () => ({ roles: {} }),
    })
    mocks.getBot.mockResolvedValue({ id: 'bot-1', name: 'Support Bot' })
    mocks.getTeam.mockResolvedValue({ id: 'team-1', name: 'DocsBot' })
    mocks.getAuth.mockReturnValue({
      getUserByEmail: vi.fn(async () => null),
      getUser: vi.fn(async () => ({ uid: 'user-1', email: 'owner@example.com' })),
    })
  })

  it('creates a bot and returns the created bot payload', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1' },
      headers: { 'cf-ipcountry': 'DE' },
      body: {},
    })
    const res = createMockRes()

    await botsHandler(req, res)

    expect(res.statusCode).toBe(201)
    expect(mocks.firestoreState.addBot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Support Bot',
        vectorDatabase: 'turbopuffer',
        region: 'EU',
        roles: {},
        status: 'pending',
      }),
    )
    expect(mocks.clearCloudflareCache).toHaveBeenCalledWith('team-1', 'bot-1')
    expect(res.body).toEqual({ id: 'bot-1', name: 'Support Bot' })
  })

  it('rolls back the bot record when weaviate tenant creation fails', async () => {
    mocks.validateBotParams.mockResolvedValue({
      name: 'Weaviate Bot',
      vectorDatabase: 'weaviate',
    })
    mocks.createTenant.mockRejectedValue(new Error('tenant failed'))

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1' },
      body: {},
    })
    const res = createMockRes()

    await botsHandler(req, res)

    expect(res.statusCode).toBe(500)
    expect(mocks.firestoreState.deleteBot).toHaveBeenCalled()
    expect(res.body).toEqual({
      message: 'Error creating bot DB. Please try again or contact support.',
    })
  })

  it('creates invites with sanitized bot overrides and sends the invite email', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1' },
      body: {
        inviteEmail: 'invitee@example.com',
        role: 'viewer',
        botOverrides: [
          { botId: 'bot-1', role: 'editor' },
          { botId: '', role: 'viewer' },
          { botId: 'bot-2', role: 'default' },
        ],
      },
    })
    const res = createMockRes()

    await inviteHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.firestoreState.addInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invitee@example.com',
        teamId: 'team-1',
        role: 'viewer',
        botOverrides: [{ botId: 'bot-1', role: 'editor' }],
      }),
    )
    expect(mocks.sendInviteEmail).toHaveBeenCalled()
  })

  it('rejects none-role invites that do not specify any bot overrides', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1' },
      body: {
        inviteEmail: 'invitee@example.com',
        role: 'none',
        botOverrides: [],
      },
    })
    const res = createMockRes()

    await inviteHandler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      message: 'Team role None requires at least one bot override.',
    })
  })

  it('accepts a pending invite through the PUT flow', async () => {
    mocks.acceptInvite.mockResolvedValue(undefined)
    mocks.getTeam.mockResolvedValue({ id: 'team-1', name: 'DocsBot' })

    const req = createMockReq({
      method: 'PUT',
      body: {
        status: 'accept',
        teamId: 'team-1',
        inviteId: 'invite-1',
        role: 'viewer',
      },
    })
    const res = createMockRes()

    await inviteHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.acceptInvite).toHaveBeenCalledWith(
      'team-1',
      'user-1',
      'invite-1',
      'viewer',
    )
    expect(res.body).toEqual({
      message: 'Accepted invite',
      data: { id: 'team-1', name: 'DocsBot' },
    })
  })
})
