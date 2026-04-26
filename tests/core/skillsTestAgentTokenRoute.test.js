import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedBotContext: vi.fn(),
  jsonError: vi.fn((message, status = 500) => Response.json({ message }, { status })),
  canUserManageBotSettings: vi.fn(() => true),
  getSkillDraft: vi.fn(),
  sign: vi.fn(),
  setProtectedHeader: vi.fn(),
  setIssuedAt: vi.fn(),
  setExpirationTime: vi.fn(),
  signJwtCtor: vi.fn(),
}))

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: mocks.getAuthorizedBotContext,
  jsonError: mocks.jsonError,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserManageBotSettings: mocks.canUserManageBotSettings,
  }
})

vi.mock('@/lib/skills-builder', () => ({
  getSkillDraft: mocks.getSkillDraft,
}))

vi.mock('jose', () => ({
  SignJWT: mocks.signJwtCtor,
}))

describe('skills test agent token route', () => {
  const baseDraft = {
    skillName: 'customer-refunds',
    publishedAt: '2026-04-24T00:00:00.000Z',
    envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
    secretBindings: [{ envVar: 'API_TOKEN', secret: 'enc:secret' }],
    metadataBindings: [
      {
        envVar: 'CUSTOMER_ID',
        metadataKey: 'priv_customer_id',
        description: 'Customer id',
      },
    ],
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1' },
      bot: { id: 'bot-1', signatureKey: 'signature-key' },
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })
    mocks.getSkillDraft.mockResolvedValue(structuredClone(baseDraft))
    mocks.sign.mockResolvedValue('signed-jwt')
    mocks.setExpirationTime.mockReturnValue({ sign: mocks.sign })
    mocks.setIssuedAt.mockReturnValue({ setExpirationTime: mocks.setExpirationTime })
    mocks.setProtectedHeader.mockReturnValue({ setIssuedAt: mocks.setIssuedAt })
    mocks.signJwtCtor.mockImplementation(function SignJWTMock(payload) {
      return {
        payload,
        setProtectedHeader: mocks.setProtectedHeader,
      }
    })
  })

  it('rejects users who cannot manage bot skills', async () => {
    mocks.canUserManageBotSettings.mockReturnValue(false)

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/test-agent-token/route')
    const response = await POST(new Request('https://docsbot.example/test-agent-token', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'customer-refunds' }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'You are not allowed to manage bot skills.',
    })
    expect(mocks.getSkillDraft).not.toHaveBeenCalled()
  })

  it('rejects unpublished skills', async () => {
    mocks.getSkillDraft.mockResolvedValue({
      ...structuredClone(baseDraft),
      publishedAt: null,
    })

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/test-agent-token/route')
    const response = await POST(new Request('https://docsbot.example/test-agent-token', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'customer-refunds' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Publish this skill before running the test agent.',
    })
  })

  it('rejects missing env or secret values', async () => {
    mocks.getSkillDraft.mockResolvedValue({
      ...structuredClone(baseDraft),
      envBindings: [{ envVar: 'WORKSPACE_ID', value: '' }],
    })

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/test-agent-token/route')
    const response = await POST(new Request('https://docsbot.example/test-agent-token', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'customer-refunds' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Save all required environment variables and secrets before testing this skill.',
    })
  })

  it('rejects missing metadata values', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/test-agent-token/route')
    const response = await POST(
      new Request('https://docsbot.example/test-agent-token', {
        method: 'POST',
        body: JSON.stringify({ metadata: {} }),
      }),
      {
        params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'customer-refunds' }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'Missing required metadata values: priv_customer_id.',
    })
  })

  it('signs metadata and returns a short-lived token', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/test-agent-token/route')
    const response = await POST(
      new Request('https://docsbot.example/test-agent-token', {
        method: 'POST',
        body: JSON.stringify({
          metadata: { priv_customer_id: 'cust-123', ignored: 'drop-me' },
        }),
      }),
      {
        params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'customer-refunds' }),
      },
    )

    expect(mocks.signJwtCtor).toHaveBeenCalledWith({
      team_id: 'team-1',
      bot_id: 'bot-1',
      metadata: { priv_customer_id: 'cust-123' },
    })
    expect(mocks.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' })
    expect(mocks.sign).toHaveBeenCalled()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({
      token: 'signed-jwt',
      issuedAt: expect.any(Number),
      expiresAt: expect.any(Number),
      metadata: { priv_customer_id: 'cust-123' },
      model: 'gpt-5.4-nano',
      skillName: 'customer-refunds',
    })
    expect(body.expiresAt - body.issuedAt).toBe(60 * 60)
  })
})
