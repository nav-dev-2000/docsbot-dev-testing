import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
  isSuperAdmin: vi.fn(),
  getTeam: vi.fn(),
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

vi.mock('@/utils/helpers', () => ({
  isSuperAdmin: mocks.isSuperAdmin,
}))

vi.mock('@/lib/dbQueries', () => ({
  getTeam: mocks.getTeam,
}))

import userTeamCheck from '@/lib/userTeamCheck'

describe('userTeamCheck', () => {
  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.getAuthorizedUser.mockReset()
    mocks.isSuperAdmin.mockReset()
    mocks.getTeam.mockReset()
    mocks.isSuperAdmin.mockReturnValue(false)
  })

  it('returns the authorized user and team for team members', async () => {
    const req = { query: { teamId: 'team-1' } }
    const res = {}
    const team = { id: 'team-1', roles: { 'user-1': 'owner' } }

    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })
    mocks.getTeam.mockResolvedValue(team)

    await expect(userTeamCheck(req, res)).resolves.toEqual({
      userId: 'user-1',
      team,
    })
    expect(mocks.configureFirebaseApp).toHaveBeenCalledTimes(1)
  })

  it('allows super admins to access teams without an explicit role', async () => {
    const req = { query: { teamId: 'team-2' } }
    const team = { id: 'team-2', roles: {} }

    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'super-user' })
    mocks.getTeam.mockResolvedValue(team)
    mocks.isSuperAdmin.mockReturnValue(true)

    await expect(userTeamCheck(req, {})).resolves.toEqual({
      userId: 'super-user',
      team,
    })
  })

  it('throws when the user does not belong to the requested team', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-3' })
    mocks.getTeam.mockResolvedValue({ id: 'team-3', roles: { owner: 'owner' } })

    await expect(
      userTeamCheck({ query: { teamId: 'team-3' } }, {}),
    ).rejects.toThrow('User does not have access to team')
  })
})
