import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
  userTeamCheck: vi.fn(),
  isSuperAdmin: vi.fn(),
  canUserModifyTeam: vi.fn(),
  getUserTeams: vi.fn(),
  getInvitesFromEmailAndTeamId: vi.fn(),
  getTeamUsers: vi.fn(),
  getTeam: vi.fn(),
  phTrack: vi.fn(),
  firestoreState: {
    updateTeam: vi.fn(),
    getBots: vi.fn(),
    batchUpdate: vi.fn(),
    batchCommit: vi.fn(),
  },
}))

const createFirestoreMock = () => {
  const teamRef = {
    update: mocks.firestoreState.updateTeam,
    collection: vi.fn((name) => {
      if (name === 'bots') {
        return {
          get: mocks.firestoreState.getBots,
        }
      }
      return {}
    }),
  }

  return {
    collection: vi.fn(() => ({
      doc: vi.fn(() => teamRef),
    })),
    batch: vi.fn(() => ({
      update: mocks.firestoreState.batchUpdate,
      commit: mocks.firestoreState.batchCommit,
    })),
  }
}

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

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    isSuperAdmin: mocks.isSuperAdmin,
  }
})

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserModifyTeam: mocks.canUserModifyTeam,
  }
})

vi.mock('@/lib/dbQueries', () => ({
  getUserTeams: mocks.getUserTeams,
  getInvitesFromEmailAndTeamId: mocks.getInvitesFromEmailAndTeamId,
  getTeamUsers: mocks.getTeamUsers,
  getTeam: mocks.getTeam,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => createFirestoreMock(),
  FieldValue: {},
}))

import membersHandler from '@/pages/api/teams/[teamId]/members'

describe('team members API ownership transfer', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((value) => {
      if (value && typeof value.mockReset === 'function') {
        value.mockReset()
      }
    })
    Object.values(mocks.firestoreState).forEach((value) => value.mockReset())

    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'owner-1' })
    mocks.userTeamCheck.mockResolvedValue({
      userId: 'owner-1',
      team: {
        id: 'team-1',
        name: 'DocsBot',
        roles: {
          'owner-1': 'owner',
          'member-1': 'viewer',
          'member-2': 'admin',
        },
      },
    })
    mocks.isSuperAdmin.mockReturnValue(false)
    mocks.canUserModifyTeam.mockReturnValue(true)
    mocks.getUserTeams.mockResolvedValue([
      {
        id: 'team-1',
        roles: {
          'owner-1': 'owner',
          'member-1': 'viewer',
          'member-2': 'admin',
        },
      },
    ])
    mocks.getInvitesFromEmailAndTeamId.mockResolvedValue([])
    mocks.getTeam.mockImplementation(async () => ({
      id: 'team-1',
      name: 'DocsBot',
      roles: {
        'owner-1': 'owner',
        'member-1': 'viewer',
        'member-2': 'admin',
      },
    }))
    mocks.getTeamUsers.mockResolvedValue([
      { uid: 'owner-1', role: 'admin' },
      { uid: 'member-1', role: 'owner' },
      { uid: 'member-2', role: 'admin' },
    ])
    mocks.firestoreState.updateTeam.mockResolvedValue(undefined)
    mocks.firestoreState.getBots.mockResolvedValue({
      forEach: (callback) => {
        callback({
          ref: { id: 'bot-1' },
          data: () => ({
            roles: {
              'member-1': 'viewer',
              'owner-1': 'editor',
            },
          }),
        })
      },
    })
    mocks.firestoreState.batchUpdate.mockImplementation(() => undefined)
    mocks.firestoreState.batchCommit.mockResolvedValue(undefined)
  })

  it('allows the owner to transfer ownership to a non-owner teammate', async () => {
    const req = createMockReq({
      method: 'PUT',
      query: { teamId: 'team-1' },
      body: {
        memberId: 'member-1',
        role: 'owner',
        transferOwnership: true,
      },
    })
    const res = createMockRes()

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.firestoreState.batchUpdate).toHaveBeenCalledWith(expect.any(Object), {
      roles: {
        'owner-1': 'admin',
        'member-1': 'owner',
        'member-2': 'admin',
      },
    })
    expect(mocks.firestoreState.batchUpdate).toHaveBeenCalledWith(
      { id: 'bot-1' },
      { roles: {} },
    )
    expect(mocks.firestoreState.batchCommit).toHaveBeenCalled()
    expect(res.body).toEqual({
      message: 'Ownership has been transferred successfully',
      teamUsers: [
        { uid: 'owner-1', role: 'admin' },
        { uid: 'member-1', role: 'owner' },
        { uid: 'member-2', role: 'admin' },
      ],
      team: {
        id: 'team-1',
        name: 'DocsBot',
        roles: {
          'owner-1': 'owner',
          'member-1': 'viewer',
          'member-2': 'admin',
        },
      },
    })
  })

  it('rejects ownership transfers initiated by non-owners', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'member-2' })
    mocks.userTeamCheck.mockResolvedValue({
      userId: 'member-2',
      team: {
        id: 'team-1',
        name: 'DocsBot',
        roles: {
          'owner-1': 'owner',
          'member-1': 'viewer',
          'member-2': 'admin',
        },
      },
    })

    const req = createMockReq({
      method: 'PUT',
      query: { teamId: 'team-1' },
      body: {
        memberId: 'member-1',
        role: 'owner',
        transferOwnership: true,
      },
    })
    const res = createMockRes()

    await membersHandler(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      message: 'Only the team owner can transfer ownership!',
    })
    expect(mocks.firestoreState.batchUpdate).not.toHaveBeenCalled()
  })

  it('allows super admins to transfer ownership without being the current owner', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'super-admin-1' })
    mocks.userTeamCheck.mockResolvedValue({
      userId: 'super-admin-1',
      team: {
        id: 'team-1',
        name: 'DocsBot',
        roles: {
          'owner-1': 'owner',
          'member-1': 'viewer',
          'member-2': 'admin',
        },
      },
    })
    mocks.isSuperAdmin.mockReturnValue(true)

    const req = createMockReq({
      method: 'PUT',
      query: { teamId: 'team-1' },
      body: {
        memberId: 'member-2',
        role: 'owner',
        transferOwnership: true,
      },
    })
    const res = createMockRes()

    await membersHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.firestoreState.batchUpdate).toHaveBeenCalledWith(expect.any(Object), {
      roles: {
        'owner-1': 'admin',
        'member-1': 'viewer',
        'member-2': 'owner',
      },
    })
    expect(mocks.firestoreState.batchCommit).toHaveBeenCalled()
  })
})
