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
  summarizeUpstreamMcpError,
  getMcpSessionIdFromResponse,
  firstJsonObjectFromMcpHttpBody,
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

describe('getMcpSessionIdFromResponse', () => {
  it('returns Mcp-Session-Id from headers', () => {
    const h = new Headers()
    h.set('Mcp-Session-Id', 'sess-abc')
    const res = { headers: h }
    expect(getMcpSessionIdFromResponse(res)).toBe('sess-abc')
  })

  it('returns null when missing', () => {
    expect(getMcpSessionIdFromResponse({ headers: new Headers() })).toBeNull()
  })
})

describe('firstJsonObjectFromMcpHttpBody', () => {
  it('parses raw JSON', () => {
    const j = firstJsonObjectFromMcpHttpBody('{"jsonrpc":"2.0","result":{}}')
    expect(j.result).toEqual({})
  })

  it('parses first SSE data line', () => {
    const body = 'data: {"jsonrpc":"2.0","id":0,"result":{"x":1}}\n\n'
    const j = firstJsonObjectFromMcpHttpBody(body)
    expect(j.result).toEqual({ x: 1 })
  })
})

describe('summarizeUpstreamMcpError', () => {
  it('returns JSON-RPC error message', () => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Bad JSON-RPC' },
    })
    expect(summarizeUpstreamMcpError(body)).toBe('Bad JSON-RPC')
  })

  it('returns top-level message when present', () => {
    expect(summarizeUpstreamMcpError(JSON.stringify({ message: 'Invalid session' }))).toBe(
      'Invalid session',
    )
  })

  it('returns trimmed plain text when not JSON', () => {
    expect(summarizeUpstreamMcpError('plain error')).toBe('plain error')
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
