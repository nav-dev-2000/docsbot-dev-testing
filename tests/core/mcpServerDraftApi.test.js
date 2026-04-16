import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  userTeamCheck: vi.fn(),
  getBot: vi.fn(),
  phTrack: vi.fn(),
  canUserManageBotSettings: vi.fn(),
  openaiCreate: vi.fn(),
}))

vi.mock('@/lib/userTeamCheck', () => ({
  __esModule: true,
  default: mocks.userTeamCheck,
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: mocks.getBot,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserManageBotSettings: mocks.canUserManageBotSettings,
  }
})

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      responses = {
        create: mocks.openaiCreate,
      }
    },
  }
})

import handler, {
  MCP_SERVER_DRAFT_SYSTEM_PROMPT,
  stripLinksAndUrlsFromDescription,
} from '@/pages/api/teams/[teamId]/bots/[botId]/mcp-server-draft'

describe('/api/teams/[teamId]/bots/[botId]/mcp-server-draft', () => {
  beforeEach(() => {
    mocks.userTeamCheck.mockReset()
    mocks.getBot.mockReset()
    mocks.phTrack.mockReset()
    mocks.canUserManageBotSettings.mockReset()
    mocks.openaiCreate.mockReset()

    mocks.userTeamCheck.mockResolvedValue({
      userId: 'user-1',
      team: {
        id: 'team-1',
        roles: { 'user-1': 'owner' },
        plan: {
          id: 'personal',
          name: 'Personal',
          bots: 3,
          pages: 5000,
          questions: 5000,
          teamMembers: 1,
        },
      },
    })
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      name: 'DocsBot',
      mcpServers: [],
    })
    mocks.canUserManageBotSettings.mockReturnValue(true)
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        serverLabel: 'docsbot_knowledge',
        serverDescription:
          'Use to search and retrieve answers from the connected knowledge base when users ask about internal documentation.',
      }),
    })
  })

  it('returns label and description with web_search low context and gpt-5.4-mini', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: {
        serverUrl: 'https://mcp.docsbot.ai/mcp',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      serverLabel: 'docsbot_knowledge',
      serverDescription:
        'Use to search and retrieve answers from the connected knowledge base when users ask about internal documentation.',
    })
    expect(mocks.openaiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
        instructions: MCP_SERVER_DRAFT_SYSTEM_PROMPT,
        reasoning: { effort: 'low' },
        tools: [
          {
            type: 'web_search',
            search_context_size: 'low',
          },
        ],
        store: true,
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: 'json_schema',
            name: 'mcp_server_draft',
          }),
        }),
      }),
    )
  })

  it('normalizes an invalid model label using the URL hostname', async () => {
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        serverLabel: '!!!',
        serverDescription:
          'Connect to this MCP server when external tools are required for the task.',
      }),
    })

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: {
        serverUrl: 'https://mcp.docsbot.ai/mcp',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.serverLabel).toBe('docsbot')
  })

  it('rejects users who cannot manage bot settings', async () => {
    mocks.canUserManageBotSettings.mockReturnValue(false)

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { serverUrl: 'https://mcp.example.com/mcp' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(403)
    expect(mocks.openaiCreate).not.toHaveBeenCalled()
  })

  it('returns 403 when the team is below Personal tier for MCP', async () => {
    mocks.userTeamCheck.mockResolvedValueOnce({
      userId: 'user-1',
      team: {
        id: 'team-1',
        roles: { 'user-1': 'owner' },
        plan: {
          id: 'free',
          name: 'Free',
          bots: 1,
          pages: 500,
          questions: 100,
          teamMembers: 1,
        },
      },
    })

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { serverUrl: 'https://mcp.example.com/mcp' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(403)
    expect(res.body?.message).toMatch(/Personal plan or higher/i)
    expect(mocks.openaiCreate).not.toHaveBeenCalled()
  })

  it('includes enabled tools in the user message when provided', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: {
        serverUrl: 'https://mcp.example.com/mcp',
        enabledTools: [{ name: 'search', description: 'Search the corpus' }],
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(mocks.openaiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: MCP_SERVER_DRAFT_SYSTEM_PROMPT,
        input: expect.stringMatching(/## Enabled tools[\s\S]*\bsearch\b/),
      }),
    )
  })

  it('validates serverUrl and method', async () => {
    const badReq = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { serverUrl: 'http://insecure.example/mcp' },
    })
    const badRes = createMockRes()
    await handler(badReq, badRes)
    expect(badRes.statusCode).toBe(400)

    const methodReq = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const methodRes = createMockRes()
    await handler(methodReq, methodRes)
    expect(methodRes.statusCode).toBe(405)
  })

  it('strips markdown citations from serverDescription in the response body', async () => {
    const withCitation =
      'Use to buy TRON energy and compare provider prices. ([merx.exchange](https://merx.exchange/?utm_source=openai))'
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        serverLabel: 'merx',
        serverDescription: withCitation,
      }),
    })

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { serverUrl: 'https://example.com/mcp' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.serverDescription).toBe(
      'Use to buy TRON energy and compare provider prices.',
    )
  })
})

describe('MCP_SERVER_DRAFT_SYSTEM_PROMPT', () => {
  it('refers to enabled tools in the user message, not in the system prompt body', () => {
    expect(MCP_SERVER_DRAFT_SYSTEM_PROMPT).toMatch(/Enabled tools/i)
    expect(MCP_SERVER_DRAFT_SYSTEM_PROMPT).toMatch(/user message/i)
    expect(MCP_SERVER_DRAFT_SYSTEM_PROMPT).not.toContain('get_invoice')
  })
})

describe('stripLinksAndUrlsFromDescription', () => {
  it('removes trailing markdown citation links and empty parens', () => {
    const input =
      'Use to buy TRON energy, compare provider prices, place orders, and manage transfer cost optimization for accounts and agents. It can also surface live market data and wallet-related actions. ([merx.exchange](https://merx.exchange/?utm_source=openai))'
    expect(stripLinksAndUrlsFromDescription(input)).toBe(
      'Use to buy TRON energy, compare provider prices, place orders, and manage transfer cost optimization for accounts and agents. It can also surface live market data and wallet-related actions.',
    )
  })

  it('removes bare https URLs', () => {
    expect(
      stripLinksAndUrlsFromDescription(
        'Use to do things. See https://example.com/path for more.',
      ),
    ).toBe('Use to do things. See for more.')
  })

  it('removes angle-bracket URLs', () => {
    expect(
      stripLinksAndUrlsFromDescription(
        'Use to sync calendars. Visit <https://example.com/hi> today.',
      ),
    ).toBe('Use to sync calendars. Visit today.')
  })
})
