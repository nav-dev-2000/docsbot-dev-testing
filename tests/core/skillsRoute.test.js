import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedBotContext: vi.fn(),
  jsonError: vi.fn((message, status = 500) => Response.json({ message }, { status })),
  canUserManageBotSettings: vi.fn(() => true),
  countBillableBotActions: vi.fn(() => 1),
  getBotActionSlotLimit: vi.fn(() => 8),
  isSuperAdmin: vi.fn(() => false),
  getSkillDraft: vi.fn(),
  listSkillDrafts: vi.fn(async () => []),
  listSkillDraftSummaries: vi.fn(async () => []),
  updateSkillDraft: vi.fn(),
  skillRecordWithDecryptedSecretBindings: vi.fn((skill) => skill),
  deleteSkillDraft: vi.fn(),
  deleteSkillPrefixFromR2: vi.fn(),
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

vi.mock('@/lib/skills-builder', async () => {
  const actual = await vi.importActual('@/lib/skills-builder')
  return {
    SKILL_CATEGORIES: actual.SKILL_CATEGORIES,
    normalizeSkillCategory: actual.normalizeSkillCategory,
    deleteSkillDraft: mocks.deleteSkillDraft,
    getSkillDraft: mocks.getSkillDraft,
    listSkillDrafts: mocks.listSkillDrafts,
    listSkillDraftSummaries: mocks.listSkillDraftSummaries,
    skillRecordWithDecryptedSecretBindings: mocks.skillRecordWithDecryptedSecretBindings,
    updateSkillDraft: mocks.updateSkillDraft,
  }
})

vi.mock('@/utils/helpers', () => ({
  countBillableBotActions: mocks.countBillableBotActions,
  getBotActionSlotLimit: mocks.getBotActionSlotLimit,
  isSuperAdmin: mocks.isSuperAdmin,
}))

vi.mock('@/lib/skills-r2-package', () => ({
  deleteSkillPrefixFromR2: mocks.deleteSkillPrefixFromR2,
}))

describe('skills route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.countBillableBotActions.mockReturnValue(1)
    mocks.getBotActionSlotLimit.mockReturnValue(8)
    mocks.isSuperAdmin.mockReturnValue(false)
    mocks.listSkillDraftSummaries.mockResolvedValue([])

    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1', roles: { 'user-1': 'owner' } },
      bot: { id: 'bot-1', roles: {} },
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })
  })

  it('includes auth providers and env bindings in skill list summaries for provider-domain icons', async () => {
    mocks.listSkillDraftSummaries.mockResolvedValue([
      {
        id: 'wordpress-posts',
        draftId: 'wordpress-posts',
        skillName: 'wordpress-posts',
        name: 'WordPress Posts',
        displayName: 'WordPress Posts',
        description: 'Lists posts.',
        internal: false,
        enabled: true,
        enabledWidget: false,
        mode: 'executable',
        hasFunctions: true,
        updatedAt: '2026-04-30T00:00:00.000Z',
        publishedAt: null,
        icon: 'CommandLineIcon',
        networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
        authProviders: [
          {
            id: 'wordpress',
            type: 'basicAuth',
            allowedDomains: ['wordpress.org'],
            allowedSchemes: ['https'],
          },
        ],
        envBindings: [{ envVar: 'WORDPRESS_HOST', value: 'wordpress.example' }],
        secretBindings: [],
      },
    ])

    const { GET } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/route')
    const response = await GET(new Request('https://docsbot.example/skills'), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      skills: [
        {
          skillName: 'wordpress-posts',
          authProviders: [
            {
              id: 'wordpress',
              type: 'basicAuth',
              allowedDomains: ['wordpress.org'],
            },
          ],
          envBindings: [{ envVar: 'WORDPRESS_HOST', value: 'wordpress.example' }],
        },
      ],
    })
  })

  it('refuses to enable widget actions when an env binding value is missing', async () => {
    mocks.getSkillDraft.mockResolvedValue({
      skillName: 'customer-refunds',
      name: 'customer-refunds',
      manifest: {
        enabledWidget: false,
        envBindings: [{ envVar: 'WORKSPACE_ID', value: '' }],
      },
    })

    const { PUT } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/route')
    const response = await PUT(
      new Request('https://docsbot.example/skill', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: {
            enabledWidget: true,
          },
        }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      message: 'This skill cannot be enabled in widget actions until all envBindings have values.',
    })
    expect(mocks.updateSkillDraft).not.toHaveBeenCalled()
  })

  it('allows enabling widget actions when env binding values are present', async () => {
    mocks.getSkillDraft.mockResolvedValue({
      skillName: 'customer-refunds',
      name: 'customer-refunds',
      manifest: {
        enabledWidget: false,
        envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
      },
    })
    mocks.updateSkillDraft.mockResolvedValue({
      skillName: 'customer-refunds',
      manifest: {
        enabledWidget: true,
        envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
      },
    })

    const { PUT } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/route')
    const response = await PUT(
      new Request('https://docsbot.example/skill', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: {
            enabledWidget: true,
          },
        }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    expect(response.status).toBe(200)
    expect(mocks.updateSkillDraft).toHaveBeenCalledWith(
      'team-1',
      'bot-1',
      'customer-refunds',
      {
        manifest: {
          enabledWidget: true,
        },
      },
      { id: 'firestore' },
    )
  })

  it('enforces widget action limits for super admins', async () => {
    mocks.isSuperAdmin.mockReturnValue(true)
    mocks.getBotActionSlotLimit.mockReturnValue(0)
    mocks.countBillableBotActions.mockReturnValue(1)
    mocks.getSkillDraft.mockResolvedValue({
      skillName: 'customer-refunds',
      name: 'customer-refunds',
      manifest: {
        enabledWidget: false,
        envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
      },
    })

    const { PUT } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/route')
    const response = await PUT(
      new Request('https://docsbot.example/skill', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: {
            enabledWidget: true,
          },
        }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'Actions are not available on your current plan.',
    })
    expect(mocks.updateSkillDraft).not.toHaveBeenCalled()
  })
})
