import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedUserCurrentTeam: vi.fn(),
  getInvitesFromTeam: vi.fn(),
  getBots: vi.fn(),
  getUserRole: vi.fn(),
  canUserViewBot: vi.fn(),
  stripeRetrieve: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children }) => children,
}))

vi.mock('@/components/DashboardWrap', () => ({
  __esModule: true,
  default: ({ children }) => children,
}))
vi.mock('@/components/Alert', () => ({
  __esModule: true,
  default: () => null,
}))
vi.mock('@/components/UpgradeNotice', () => ({
  __esModule: true,
  default: () => null,
}))
vi.mock('@/components/LocalStringNum', () => ({
  __esModule: true,
  default: () => null,
}))
vi.mock('@/components/TeamHistory', () => ({
  __esModule: true,
  default: () => null,
}))
vi.mock('@/components/Tooltip', () => ({
  __esModule: true,
  default: ({ children }) => children,
}))
vi.mock('@/config/firebase-ui.config', () => ({
  auth: {},
}))
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [null],
}))

vi.mock('@/middleware/getAuthorizedUserCurrentTeam', () => ({
  getAuthorizedUserCurrentTeam: mocks.getAuthorizedUserCurrentTeam,
}))

vi.mock('@/lib/dbQueries', () => ({
  getInvitesFromTeam: mocks.getInvitesFromTeam,
  getBots: mocks.getBots,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    getUserRole: mocks.getUserRole,
    canUserViewBot: mocks.canUserViewBot,
  }
})

vi.mock('@/utils/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: mocks.stripeRetrieve,
      },
    },
  },
}))

import { getServerSideProps } from '@/pages/app/index'

describe('dashboard getServerSideProps', () => {
  beforeEach(() => {
    mocks.getAuthorizedUserCurrentTeam.mockReset()
    mocks.getInvitesFromTeam.mockReset()
    mocks.getBots.mockReset()
    mocks.getUserRole.mockReset()
    mocks.canUserViewBot.mockReset()
    mocks.stripeRetrieve.mockReset()

    mocks.getAuthorizedUserCurrentTeam.mockResolvedValue({
      props: {
        team: {
          id: 'team-1',
          botCount: 1,
          roles: { 'user-1': 'owner' },
        },
        userId: 'user-1',
      },
    })
    mocks.getInvitesFromTeam.mockResolvedValue([])
    mocks.getBots.mockResolvedValue([{ id: 'bot-1' }])
    mocks.getUserRole.mockReturnValue('owner')
    mocks.canUserViewBot.mockReturnValue(true)
  })

  it('redirects none-role users straight to the bots list', async () => {
    mocks.getUserRole.mockReturnValue('none')

    const result = await getServerSideProps({ query: {} })

    expect(result).toEqual({
      redirect: {
        destination: '/app/bots',
        permanent: false,
      },
    })
  })

  it('redirects owners with no bots to onboarding', async () => {
    mocks.getAuthorizedUserCurrentTeam.mockResolvedValue({
      props: {
        team: {
          id: 'team-1',
          botCount: 0,
          roles: { 'user-1': 'owner' },
        },
        userId: 'user-1',
      },
    })

    const result = await getServerSideProps({ query: {} })

    expect(result).toEqual({
      redirect: {
        destination: '/app/onboarding',
        permanent: false,
      },
    })
  })

  it('attaches purchase details when a checkout session id is present', async () => {
    mocks.stripeRetrieve.mockResolvedValue({
      line_items: {
        data: [{ description: 'Business' }],
      },
      amount_total: 4900,
    })

    const result = await getServerSideProps({
      query: { session_id: 'cs_123' },
    })

    expect(result).toEqual({
      props: {
        team: {
          id: 'team-1',
          botCount: 1,
          roles: { 'user-1': 'owner' },
        },
        userId: 'user-1',
        teamInvites: [],
        bots: [{ id: 'bot-1' }],
        purchase: {
          productName: 'Business',
          price: 49,
        },
      },
    })
  })
})
