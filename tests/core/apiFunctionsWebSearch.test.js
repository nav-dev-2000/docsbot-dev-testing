import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldPath: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(),
  },
}))

vi.mock('@/config/firebase-ui.config', () => ({
  firebaseConfig: {},
}))

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(),
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: vi.fn(),
  getTeam: vi.fn(),
}))

vi.mock('@/lib/weaviate', () => ({
  deleteTenant: vi.fn(),
}))

vi.mock('@/lib/turbopuffer', () => ({
  deleteTurbopufferNamespace: vi.fn(),
}))

vi.mock('@/lib/service', () => ({
  QueueSourceExpel: vi.fn(),
}))

vi.mock('@/utils/helpers', () => ({
  isSuperAdmin: vi.fn(() => false),
  getCustomButtonsSlotLimit: vi.fn(() => 5),
  getMcpServerSlotLimit: vi.fn(() => 5),
  checkPlanPermission: vi.fn((team, requiredPlan) => {
    if (requiredPlan === 'standard') {
      return { allowed: team?.plan === 'standard' || team?.plan === 'business', requiredPlanLabel: 'Standard' }
    }

    if (requiredPlan === 'personal') {
      return { allowed: true, requiredPlanLabel: 'Personal' }
    }

    if (requiredPlan === 'hobby') {
      return { allowed: true, requiredPlanLabel: 'Personal' }
    }

    return { allowed: true, requiredPlanLabel: 'Business' }
  }),
}))

vi.mock('@/constants/strings.constants', () => ({
  i18n: {
    en: { labels: {} },
  },
}))

vi.mock('@/constants/prompts.constants', () => ({
  PRESET_PROMPTS: {
    CUSTOMER_SUPPORT: {
      prompt: 'Use search_documentation when needed.',
    },
  },
}))

vi.mock('@/lib/truto', () => ({
  DeleteIntegratedAccount: vi.fn(),
  BulkDeleteIntegratedAccounts: vi.fn(),
}))

vi.mock('@/constants/sourceTypes.constants', () => ({
  isTrutoSourceType: vi.fn(() => false),
}))

vi.mock('@/lib/slackHelpers', () => ({
  getBotIdFromChannelMapping: vi.fn(),
  getValidChannelEntries: vi.fn(() => []),
}))

vi.mock('@/lib/stripeConnect', () => ({
  OBSOLETE_STRIPE_TOOL_METADATA_KEYS: [],
}))

import { validateBotParams } from '@/lib/apiFunctions'

describe('validateBotParams web search enforcement', () => {
  const baseReq = {
    body: {
      tools: {
        web_search: {
          enabled: true,
        },
      },
    },
  }

  it('throws when enabling web search without an OpenAI key', async () => {
    await expect(
      validateBotParams(
        baseReq,
        { id: 'team-1', plan: 'standard', openAIKey: null },
        'user-1',
        true,
        { id: 'bot-1', tools: {} },
      ),
    ).rejects.toThrow('Please add your OpenAI API key before enabling web search.')
  })

  it('throws when enabling web search below the Standard plan', async () => {
    await expect(
      validateBotParams(
        baseReq,
        { id: 'team-1', plan: 'personal', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', tools: {} },
      ),
    ).rejects.toThrow('Web search is only available on the Standard plan or higher.')
  })

  it('allows enabling web search on Standard with an OpenAI key', async () => {
    await expect(
      validateBotParams(
        baseReq,
        { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', tools: {}, model: 'gpt-5.4-nano' },
      ),
    ).resolves.toMatchObject({
      classify: true,
      tools: {
        web_search: {
          enabled: true,
        },
      },
    })
  })

  it('forces public bots to use cached web search', async () => {
    await expect(
      validateBotParams(
        {
          body: {
            privacy: 'public',
            tools: {
              web_search: {
                enabled: true,
                live: true,
              },
            },
          },
        },
        { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', privacy: 'private', tools: {}, model: 'gpt-5.4-nano' },
      ),
    ).resolves.toMatchObject({
      privacy: 'public',
      tools: {
        web_search: {
          enabled: true,
          live: false,
        },
      },
    })
  })

  it('throws when enabling web search on an incompatible model', async () => {
    await expect(
      validateBotParams(
        baseReq,
        { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', tools: {}, model: 'gpt-4.1-nano' },
      ),
    ).rejects.toThrow(
      'Web search requires GPT-4o, GPT-4.1, or GPT-5+ family models. Current model: GPT-4.1 nano.',
    )
  })

  it('does not persist MCP OAuth client secrets in bot mcpServers', async () => {
    await expect(
      validateBotParams(
        {
          body: {
            mcpServers: [
              {
                serverLabel: 'Example MCP',
                serverUrl: 'https://mcp.example.com/sse',
                oauthClientId: 'client-id',
                oauthClientSecret: 'super-secret',
              },
            ],
          },
        },
        { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', tools: {}, model: 'gpt-5.4-mini' },
      ),
    ).resolves.toMatchObject({
      mcpServers: [
        {
          oauthClientId: 'client-id',
        },
      ],
    })

    const botData = await validateBotParams(
      {
        body: {
          mcpServers: [
            {
              serverLabel: 'Example MCP',
              serverUrl: 'https://mcp.example.com/sse',
              oauthClientId: 'client-id',
              oauthClientSecret: 'super-secret',
            },
          ],
        },
      },
      { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
      'user-1',
      true,
      { id: 'bot-1', tools: {}, model: 'gpt-5.4-mini' },
    )

    expect(botData.mcpServers[0].oauthClientSecret).toBeUndefined()
  })

  it('persists MCP custom request headers as a map', async () => {
    const botData = await validateBotParams(
      {
        body: {
          mcpServers: [
            {
              serverLabel: 'Cloudflare Tunnel',
              serverUrl: 'https://mcp.example.com/sse',
              customHeaders: {
                'CF-Access-Client-Id': 'client-id',
                'CF-Access-Client-Secret': 'client-secret',
              },
            },
          ],
        },
      },
      { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
      'user-1',
      true,
      { id: 'bot-1', tools: {}, model: 'gpt-5.4-mini' },
    )

    expect(botData.mcpServers[0].customHeaders).toEqual({
      'CF-Access-Client-Id': 'client-id',
      'CF-Access-Client-Secret': 'client-secret',
    })
  })

  it('rejects MCP custom request headers with invalid field names (RFC 9110)', async () => {
    await expect(
      validateBotParams(
        {
          body: {
            mcpServers: [
              {
                serverLabel: 'Example MCP',
                serverUrl: 'https://mcp.example.com/sse',
                customHeaders: { 'X Bad Name': 'x' },
              },
            ],
          },
        },
        { id: 'team-1', plan: 'standard', openAIKey: 'sk-test' },
        'user-1',
        true,
        { id: 'bot-1', tools: {}, model: 'gpt-5.4-mini' },
      ),
    ).rejects.toThrow(/RFC 9110/)
  })
})
