import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  configureFirebaseApp: vi.fn(),
  getFirestore: vi.fn(),
  getAuthorizedUser: vi.fn(),
  isSuperAdmin: vi.fn(),
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => React.createElement('a', { href }, children),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}))

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [null],
}))

vi.mock('@/config/firebase-ui.config', () => ({
  auth: {},
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: mocks.getFirestore,
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

import YearlyReportBanner from '@/components/YearlyReportBanner'
import YearlyReportNotice from '@/components/YearlyReportNotice'
import { getServerSideProps } from '@/pages/2025-in-review/[teamId]'

function mockTeamDocument(data, exists = true) {
  mocks.getFirestore.mockReturnValue({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists,
          data: () => data,
        }),
      })),
    })),
  })
}

function createContext() {
  return {
    params: { teamId: 'team-1' },
    req: {
      headers: {
        host: 'docsbot.test',
        'x-forwarded-proto': 'https',
      },
    },
  }
}

describe('yearly report dashboard components', () => {
  const team = {
    id: 'team-1',
    yearlyReports: {
      2025: {
        design_image_url: 'https://example.com/report.png',
      },
    },
  }

  it('does not render the dashboard notice while the yearly report is disabled', () => {
    expect(renderToStaticMarkup(React.createElement(YearlyReportNotice, { team }))).toBe('')
  })

  it('does not render the dashboard banner while the yearly report is disabled', () => {
    expect(renderToStaticMarkup(React.createElement(YearlyReportBanner, { team }))).toBe('')
  })
})

describe('yearly report page access', () => {
  const privateReport = {
    yearlyReports: {
      2025: {
        is_public: false,
        design_image_url: 'https://example.com/private-report.png',
        generated_at: '2026-01-02T00:00:00.000Z',
      },
    },
  }

  beforeEach(() => {
    mocks.configureFirebaseApp.mockReset()
    mocks.getFirestore.mockReset()
    mocks.getAuthorizedUser.mockReset()
    mocks.isSuperAdmin.mockReset()
    mocks.isSuperAdmin.mockReturnValue(false)
  })

  it('does not expose a private report to a user with team role none', async () => {
    mockTeamDocument({
      ...privateReport,
      roles: {
        'user-1': 'none',
      },
    })
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })

    const result = await getServerSideProps(createContext())

    expect(result.props.report).toEqual({ is_public: false })
  })

  it('exposes a private report to a user with normal team access', async () => {
    mockTeamDocument({
      ...privateReport,
      roles: {
        'user-1': 'viewer',
      },
    })
    mocks.getAuthorizedUser.mockResolvedValue({ uid: 'user-1' })

    const result = await getServerSideProps(createContext())

    expect(result.props.report.design_image_url).toBe('https://example.com/private-report.png')
  })
})
