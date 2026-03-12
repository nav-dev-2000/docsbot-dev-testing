import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  createSessionCookie: vi.fn(),
  getAuth: vi.fn(),
  decodeJwt: vi.fn(),
  assignDefaultTeam: vi.fn(),
  getInvitesFromEmail: vi.fn(),
  acceptInvite: vi.fn(),
  bentoTrack: vi.fn(),
  stripePlan: vi.fn(),
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: mocks.getAuth,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}))

vi.mock('jose', () => ({
  decodeJwt: mocks.decodeJwt,
}))

vi.mock('@/lib/dbQueries', () => ({
  assignDefaultTeam: mocks.assignDefaultTeam,
  getInvitesFromEmail: mocks.getInvitesFromEmail,
  acceptInvite: mocks.acceptInvite,
}))

vi.mock('@/lib/bento', () => ({
  bentoTrack: mocks.bentoTrack,
}))

vi.mock('@/utils/helpers', () => {
  return {
    stripePlan: mocks.stripePlan,
  }
})

import handler from '@/pages/api/auth'

describe('/api/auth handler', () => {
  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.createSessionCookie.mockReset()
    mocks.getAuth.mockReset()
    mocks.decodeJwt.mockReset()
    mocks.assignDefaultTeam.mockReset()
    mocks.getInvitesFromEmail.mockReset()
    mocks.acceptInvite.mockReset()
    mocks.bentoTrack.mockReset()
    mocks.stripePlan.mockReset()

    mocks.getAuth.mockImplementation(() => ({
      createSessionCookie: mocks.createSessionCookie,
    }))
    mocks.createSessionCookie.mockResolvedValue('session-cookie')
    mocks.decodeJwt.mockReturnValue({
      user_id: 'user-1',
      email: 'User@Example.com',
    })
    mocks.getInvitesFromEmail.mockResolvedValue([])
  })

  it('returns 401 when the bearer token is missing', async () => {
    const req = createMockReq()
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({
      message: 'Unauthorized: No valid authorization header provided',
    })
    expect(mocks.createSessionCookie).not.toHaveBeenCalled()
  })

  it('creates a session cookie for existing users', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: {
        authorization: 'Bearer access-token',
      },
      body: {
        name: 'DocsBot',
        isNewUser: false,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mocks.configureFirebaseApp).toHaveBeenCalledTimes(1)
    expect(mocks.createSessionCookie).toHaveBeenCalledWith('access-token', {
      expiresIn: 1209600000,
    })
    expect(mocks.getInvitesFromEmail).toHaveBeenCalledWith('user@example.com')
    expect(mocks.assignDefaultTeam).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'success' })
    expect(res.getHeader('set-cookie')).toContain('docsbot-auth-v2=')
  })

  it('bootstraps a new user and sets the wizard preferences cookie', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: {
        authorization: 'Bearer access-token',
      },
      body: {
        name: 'DocsBot Team',
        isNewUser: true,
      },
    })
    const res = createMockRes()

    mocks.getInvitesFromEmail.mockResolvedValue([
      {
        teamId: 'team-1',
        inviteId: 'invite-1',
        role: 'editor',
      },
    ])

    await handler(req, res)

    expect(mocks.assignDefaultTeam).toHaveBeenCalledWith('user-1', 'DocsBot Team')
    expect(mocks.acceptInvite).toHaveBeenCalledWith(
      'team-1',
      'user-1',
      'invite-1',
      'editor',
    )
    expect(mocks.bentoTrack).toHaveBeenCalledWith('user-1', 'addSubscriber', {
      email: 'User@Example.com',
      fields: {
        invited: true,
        name: 'DocsBot Team',
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ message: 'success' })
    expect(res.getHeader('set-cookie')).toEqual(
      expect.arrayContaining([
        expect.stringContaining('docsbot-auth-v2='),
        expect.stringContaining('docsbot-prefs='),
      ]),
    )
  })

  it('maps Firebase auth failures to a 401 response', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: {
        authorization: 'Bearer bad-token',
      },
      body: {
        isNewUser: false,
      },
    })
    const res = createMockRes()

    mocks.createSessionCookie.mockRejectedValue({
      codePrefix: 'auth',
      errorInfo: {
        message: 'Token expired',
      },
    })

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({
      message: 'Token expired',
    })
  })
})
