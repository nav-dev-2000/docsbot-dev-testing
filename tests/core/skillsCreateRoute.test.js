import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedBotContext: vi.fn(),
  canUserManageBotSettings: vi.fn(() => true),
  checkPlanPermission: vi.fn(() => ({ allowed: true, requiredPlanLabel: 'Standard' })),
  isSuperAdmin: vi.fn(() => false),
  responsesCreate: vi.fn(),
  allocateUniqueSkillName: vi.fn(async (_teamId, _botId, skillName) => skillName),
  ensureSkillDraft: vi.fn(),
  updateSkillDraft: vi.fn(),
  listSkillDrafts: vi.fn(async () => []),
  listSkillDraftSummaries: vi.fn(async () => []),
  skillRecordWithDecryptedSecretBindings: vi.fn((skill) => skill),
}))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function OpenAIMock() {
    this.responses = {
      create: mocks.responsesCreate,
    }
  }),
}))

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: mocks.getAuthorizedBotContext,
}))

vi.mock('@/utils/function.utils', () => ({
  canUserManageBotSettings: mocks.canUserManageBotSettings,
}))

vi.mock('@/utils/helpers', () => ({
  checkPlanPermission: mocks.checkPlanPermission,
  isSuperAdmin: mocks.isSuperAdmin,
}))

vi.mock('@/lib/skills-builder', async () => {
  const actual = await vi.importActual('@/lib/skills-builder')
  return {
    SKILL_AUDIENCE_CUSTOMER: actual.SKILL_AUDIENCE_CUSTOMER,
    SKILL_AUDIENCE_INTERNAL: actual.SKILL_AUDIENCE_INTERNAL,
    SKILL_CATEGORIES: actual.SKILL_CATEGORIES,
    allocateUniqueSkillName: mocks.allocateUniqueSkillName,
    createSkillMarkdownTemplate: vi.fn((skillName, _audience, _mode, options = {}) =>
      `---\nname: ${skillName}\ndescription: "${options.description || ''}"\n---\n`,
    ),
    ensureSkillDraft: mocks.ensureSkillDraft,
    listSkillDrafts: mocks.listSkillDrafts,
    listSkillDraftSummaries: mocks.listSkillDraftSummaries,
    normalizeSkillCategory: actual.normalizeSkillCategory,
    normalizeSkillName: actual.normalizeSkillName,
    skillRecordWithDecryptedSecretBindings: mocks.skillRecordWithDecryptedSecretBindings,
    updateSkillDraft: mocks.updateSkillDraft,
    upsertSkillFile: actual.upsertSkillFile,
  }
})

describe('skills create route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-openai-key'
    mocks.checkPlanPermission.mockReturnValue({
      allowed: true,
      requiredPlanLabel: 'Standard',
    })
    mocks.isSuperAdmin.mockReturnValue(false)

    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1' },
      bot: { id: 'bot-1' },
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })
    mocks.responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        name: 'Customer Refunds',
        slug: 'customer-refunds',
        description: 'Use when customers ask about refund policies and refund workflows.',
        icon: 'ReceiptRefundIcon',
        category: 'Customer Support',
      }),
    })
    mocks.ensureSkillDraft.mockResolvedValue({
      skillName: 'customer-refunds',
      name: 'Customer Refunds',
      displayName: 'Customer Refunds',
      mode: 'markdown',
      files: [{ path: 'SKILL.md', content: '# old\n' }],
    })
    mocks.updateSkillDraft.mockResolvedValue({
      id: 'customer-refunds',
      draftId: 'customer-refunds',
      skillName: 'customer-refunds',
      name: 'Customer Refunds',
      displayName: 'Customer Refunds',
      description: 'Use when customers ask about refund policies and refund workflows.',
      category: 'Customer Support',
    })
  })

  it('creates a draft with a friendly display name and stable slug', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/route')
    const response = await POST(
      new Request('https://docsbot.example/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Build a customer refund policy helper.',
          audience: 'customer',
        }),
      }),
      {
        params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
      },
    )

    expect(response.status).toBe(201)
    expect(mocks.responsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.objectContaining({
          format: expect.objectContaining({
            schema: expect.objectContaining({
              required: ['name', 'slug', 'description', 'icon', 'category'],
            }),
          }),
        }),
      }),
    )
    expect(mocks.allocateUniqueSkillName).toHaveBeenCalledWith(
      'team-1',
      'bot-1',
      'customer-refunds',
      { id: 'firestore' },
    )
    expect(mocks.ensureSkillDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        skillName: 'customer-refunds',
        displayName: 'Customer Refunds',
        category: 'Customer Support',
      }),
    )
    expect(mocks.updateSkillDraft).toHaveBeenCalledWith(
      'team-1',
      'bot-1',
      'customer-refunds',
      expect.objectContaining({
        manifest: expect.objectContaining({
          displayName: 'Customer Refunds',
          description: 'Use when customers ask about refund policies and refund workflows.',
        }),
        category: 'Customer Support',
      }),
      { id: 'firestore' },
    )
    await expect(response.json()).resolves.toEqual({
      skill: expect.objectContaining({
        skillName: 'customer-refunds',
        name: 'Customer Refunds',
      }),
    })
  })

  it('requires Standard or higher even for super admins', async () => {
    mocks.isSuperAdmin.mockReturnValue(true)
    mocks.checkPlanPermission.mockReturnValue({
      allowed: false,
      requiredPlanLabel: 'Standard',
    })

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/route')
    const response = await POST(
      new Request('https://docsbot.example/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Build a customer refund policy helper.',
          audience: 'customer',
        }),
      }),
      {
        params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
      },
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'DocsBot skills require the Standard plan or higher.',
    })
    expect(mocks.ensureSkillDraft).not.toHaveBeenCalled()
  })

  it('lists skill widget readiness flags with env bindings for icon resolution', async () => {
    mocks.listSkillDraftSummaries.mockResolvedValue([
      {
        id: 'customer-refunds',
        draftId: 'customer-refunds',
        skillName: 'customer-refunds',
        name: 'Customer Refunds',
        displayName: 'Customer Refunds',
        description: 'Use when customers ask about refunds.',
        internal: false,
        enabled: true,
        enabledWidget: false,
        mode: 'executable',
        hasFunctions: true,
        category: 'Customer Support',
        updatedAt: '2026-04-29T00:00:00.000Z',
        publishedAt: '2026-04-29T00:00:00.000Z',
        icon: 'ReceiptRefundIcon',
        networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
        envBindings: [{ envVar: 'WORKSPACE_ID', value: '' }],
        secretBindings: [{ envVar: 'API_TOKEN', secret: '' }],
      },
    ])

    const { GET } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/route')
    const response = await GET(new Request('https://docsbot.example/skills'), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
    })

    expect(response.status).toBe(200)
    expect(mocks.listSkillDraftSummaries).toHaveBeenCalledWith('team-1', 'bot-1', {
      id: 'firestore',
    })
    expect(mocks.listSkillDrafts).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      skills: [
        expect.objectContaining({
          skillName: 'customer-refunds',
          name: 'Customer Refunds',
          category: 'Customer Support',
          envBindings: [{ envVar: 'WORKSPACE_ID', value: '' }],
          hasMissingEnvBindings: true,
          hasMissingSecretBindings: true,
        }),
      ],
    })
  })
})
