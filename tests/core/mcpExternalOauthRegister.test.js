import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}))

vi.mock('@/lib/userTeamCheck', () => ({
  __esModule: true,
  default: vi.fn(),
}))

vi.mock('@/utils/function.utils', () => ({
  canUserManageBotSettings: vi.fn(),
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: vi.fn(),
}))

vi.mock('@/utils/outboundUrlValidation', () => ({
  validateOutboundFetchUrl: vi.fn(),
}))

import { resolveMcpOauthClientCredentials } from '@/pages/api/teams/[teamId]/bots/[botId]/mcp-external-oauth/register'

describe('resolveMcpOauthClientCredentials', () => {
  it('preserves an existing stored secret when manual secret is omitted', () => {
    const resolved = resolveMcpOauthClientCredentials({
      manualClientId: 'updated-client-id',
      manualClientSecret: '',
      existingData: {
        client_id: 'stored-client-id',
        client_secret: 'stored-secret',
      },
    })

    expect(resolved).toMatchObject({
      hasManualClientId: true,
      hasManualClientSecret: false,
      clientId: 'updated-client-id',
      clientSecret: 'stored-secret',
    })
  })

  it('replaces the stored secret only when a new non-empty manual secret is provided', () => {
    const resolved = resolveMcpOauthClientCredentials({
      manualClientId: 'updated-client-id',
      manualClientSecret: 'new-secret',
      existingData: {
        client_id: 'stored-client-id',
        client_secret: 'stored-secret',
      },
    })

    expect(resolved).toMatchObject({
      hasManualClientId: true,
      hasManualClientSecret: true,
      clientId: 'updated-client-id',
      clientSecret: 'new-secret',
    })
  })
})
