import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateOutboundFetchUrl: vi.fn(),
}))

vi.mock('@/utils/outboundUrlValidation', () => ({
  validateOutboundFetchUrl: mocks.validateOutboundFetchUrl,
}))

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

import {
  extraHeadersForSameOriginMcp,
  fetchOutbound,
} from '@/pages/api/teams/[teamId]/bots/[botId]/mcp/discover'

describe('fetchOutbound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('validates outbound URL then calls fetch with provided init', async () => {
    mocks.validateOutboundFetchUrl.mockResolvedValue({
      valid: true,
      normalizedUrl: 'https://mcp.example.com/sse',
    })
    const mockResponse = { status: 302 }
    global.fetch.mockResolvedValue(mockResponse)

    await expect(
      fetchOutbound('https://mcp.example.com/sse', { method: 'GET' }),
    ).resolves.toBe(mockResponse)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://mcp.example.com/sse',
      {
        method: 'GET',
      },
    )
  })
})

describe('extraHeadersForSameOriginMcp', () => {
  it('returns extra headers when target is same origin as MCP URL', () => {
    const h = { 'X-Key': 'secret' }
    expect(
      extraHeadersForSameOriginMcp('https://mcp.example.com/sse', 'https://mcp.example.com/.well-known/foo', h),
    ).toEqual(h)
  })

  it('returns empty object when target origin differs (no secret exfil)', () => {
    const h = { Authorization: 'Bearer token' }
    expect(
      extraHeadersForSameOriginMcp('https://mcp.example.com/sse', 'https://evil.example/metadata', h),
    ).toEqual({})
  })
})
