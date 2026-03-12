import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getAuthorizedUser: vi.fn(),
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('@/middleware/getAuthorizedUser', () => ({
  getAuthorizedUser: mocks.getAuthorizedUser,
}))

import { routePaths } from '@/constants/routePaths.constants'
import { nonProtectedRouteRedirect } from '@/middleware/nonProtectedRouteRedirect'

describe('nonProtectedRouteRedirect', () => {
  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.getAuthorizedUser.mockReset()
  })

  it('redirects authenticated users to the app by default', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })

    await expect(
      nonProtectedRouteRedirect({ query: {} }),
    ).resolves.toEqual({
      redirect: {
        destination: routePaths.APP,
        permanent: false,
      },
    })
  })

  it('honors valid redirect targets from the query string', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })

    await expect(
      nonProtectedRouteRedirect({ query: { redirect: routePaths.BOTS } }),
    ).resolves.toEqual({
      redirect: {
        destination: routePaths.BOTS,
        permanent: false,
      },
    })
  })

  it('ignores invalid redirect targets to avoid open redirect behavior', async () => {
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })

    await expect(
      nonProtectedRouteRedirect({ query: { redirect: '/not-a-public-route' } }),
    ).resolves.toEqual({
      redirect: {
        destination: routePaths.APP,
        permanent: false,
      },
    })
  })

  it('leaves anonymous visitors on the current page', async () => {
    mocks.getAuthorizedUser.mockRejectedValue(new Error('Missing session'))

    await expect(
      nonProtectedRouteRedirect({ query: {} }),
    ).resolves.toEqual({
      props: {},
    })
  })
})
