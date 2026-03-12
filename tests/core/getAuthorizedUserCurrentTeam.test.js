import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
  isSuperAdmin: vi.fn(),
  getTeam: vi.fn(),
  firestoreState: {
    userUpdate: vi.fn(),
    userGet: vi.fn(),
    userSet: vi.fn(),
    addTeam: vi.fn(),
  },
}))

const createFirestoreMock = () => {
  const usersRef = {
    doc: vi.fn(() => ({
      update: mocks.firestoreState.userUpdate,
      get: mocks.firestoreState.userGet,
      set: mocks.firestoreState.userSet,
    })),
  }

  const teamsRef = {
    add: mocks.firestoreState.addTeam,
  }

  return {
    collection: vi.fn((name) => {
      if (name === 'users') return usersRef
      if (name === 'teams') return teamsRef
      return usersRef
    }),
  }
}

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    isSuperAdmin: mocks.isSuperAdmin,
  }
})

vi.mock('@/lib/dbQueries', () => ({
  getTeam: mocks.getTeam,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => createFirestoreMock(),
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
}))

import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'

describe('getAuthorizedUserCurrentTeam', () => {
  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.getAuthorizedUser.mockReset()
    mocks.isSuperAdmin.mockReset()
    mocks.getTeam.mockReset()
    Object.values(mocks.firestoreState).forEach((value) => value.mockReset())

    mocks.getAuthorizedUser.mockResolvedValue({
      uid: 'user-1',
      name: 'Taylor',
    })
    mocks.isSuperAdmin.mockReturnValue(false)
    mocks.getTeam.mockResolvedValue({
      id: 'team-1',
      roles: { 'user-1': 'owner' },
      name: "Taylor's Team",
    })
    mocks.firestoreState.userUpdate.mockResolvedValue(undefined)
    mocks.firestoreState.userGet.mockResolvedValue({
      exists: true,
      data: () => ({ currentTeam: 'team-1' }),
    })
    mocks.firestoreState.userSet.mockResolvedValue(undefined)
    mocks.firestoreState.addTeam.mockResolvedValue({ id: 'team-1' })
  })

  it('switches team immediately for super admins', async () => {
    mocks.isSuperAdmin.mockReturnValue(true)
    const context = {
      query: { switchTeam: 'team-99' },
      res: createMockRes(),
    }

    await expect(getAuthorizedUserCurrentTeam(context)).resolves.toEqual({
      redirect: {
        destination: '/app/bots',
        permanent: false,
      },
    })
    expect(mocks.firestoreState.userUpdate).toHaveBeenCalledWith({
      currentTeam: 'team-99',
    })
  })

  it('returns the current accessible team when the user already has one', async () => {
    const context = {
      query: {},
      res: createMockRes(),
    }

    await expect(getAuthorizedUserCurrentTeam(context)).resolves.toEqual({
      props: {
        team: {
          id: 'team-1',
          roles: { 'user-1': 'owner' },
          name: "Taylor's Team",
        },
        userId: 'user-1',
      },
    })
  })

  it('creates a new team and user record when no current team exists', async () => {
    mocks.firestoreState.userGet.mockResolvedValue({
      exists: false,
      data: () => ({}),
    })
    mocks.getTeam.mockResolvedValueOnce({
      id: 'team-new',
      roles: { 'user-1': 'owner' },
      name: "Taylor's Team",
    })
    mocks.firestoreState.addTeam.mockResolvedValue({ id: 'team-new' })

    const context = {
      query: {},
      res: createMockRes(),
    }

    await expect(getAuthorizedUserCurrentTeam(context)).resolves.toEqual({
      props: {
        team: {
          id: 'team-new',
          roles: { 'user-1': 'owner' },
          name: "Taylor's Team",
        },
        userId: 'user-1',
      },
    })
    expect(mocks.firestoreState.userSet).toHaveBeenCalledWith({
      createdAt: 'SERVER_TIMESTAMP',
      currentTeam: 'team-new',
    })
  })

  it('clears auth cookies and redirects to login on auth failure', async () => {
    mocks.getAuthorizedUser.mockRejectedValue(new Error('Session expired'))
    const res = createMockRes()
    const context = {
      query: {},
      res,
      resolvedUrl: '/app/team',
    }

    const result = await getAuthorizedUserCurrentTeam(context)

    expect(result).toEqual({
      redirect: {
        destination: '/login?redirect=%2Fapp%2Fteam',
        permanent: false,
      },
    })
    expect(res.getHeader('set-cookie')).toContain('docsbot-auth-v2=')
  })
})
