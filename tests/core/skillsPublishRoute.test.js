import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedBotContext: vi.fn(),
  jsonError: vi.fn((message, status = 500) => Response.json({ message }, { status })),
  canUserManageBotSettings: vi.fn(() => true),
  getSkillDraft: vi.fn(),
  updateSkillDraft: vi.fn(),
  publishSkillDraft: vi.fn(),
  sanitizeValidationPayload: vi.fn((payload) => payload),
  mergeBundleArtifact: vi.fn((files, artifact) => {
    const next = files.filter((file) => file.path !== '.docsbot/bundle/index.js')
    if (artifact?.content != null) {
      next.push({
        path: '.docsbot/bundle/index.js',
        content: artifact.content,
      })
    }
    return next.sort((a, b) => a.path.localeCompare(b.path))
  }),
  skillRecordWithDecryptedSecretBindings: vi.fn((skill) => skill),
  promoteSkillDraftToPublishedCurrent: vi.fn(),
  readSkillDraftPackageFromR2: vi.fn(),
  readPublishedSkillPackageFromR2: vi.fn(),
}))

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: mocks.getAuthorizedBotContext,
  jsonError: mocks.jsonError,
}))

vi.mock('@/utils/function.utils', () => ({
  canUserManageBotSettings: mocks.canUserManageBotSettings,
}))

vi.mock('@/lib/skills-builder', () => ({
  GENERATED_BUNDLE_ARTIFACT_PATH: '.docsbot/bundle/index.js',
  getSkillDraft: mocks.getSkillDraft,
  mergeBundleArtifact: mocks.mergeBundleArtifact,
  publishSkillDraft: mocks.publishSkillDraft,
  sanitizeValidationPayload: mocks.sanitizeValidationPayload,
  skillRecordWithDecryptedSecretBindings: mocks.skillRecordWithDecryptedSecretBindings,
  updateSkillDraft: mocks.updateSkillDraft,
}))

vi.mock('@/lib/skills-r2-package', () => ({
  promoteSkillDraftToPublishedCurrent: mocks.promoteSkillDraftToPublishedCurrent,
  readSkillDraftPackageFromR2: mocks.readSkillDraftPackageFromR2,
  readPublishedSkillPackageFromR2: mocks.readPublishedSkillPackageFromR2,
}))

describe('skills publish route', () => {
  const baseDraft = {
    skillName: 'current-weather-api',
    files: [
      { path: 'SKILL.md', content: '# Weather\n' },
      { path: 'package.json', content: '{ "dependencies": { "zod": "^4.0.0" } }\n' },
      { path: 'scripts/index.ts', content: 'import { z } from "zod"\n' },
    ],
    manifest: {
      description: 'Weather skill',
      r2Prefix: 'team-1/bot-1/current-weather-api',
      envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
    },
    r2Prefix: 'team-1/bot-1/current-weather-api',
    envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
    mode: 'executable',
    validation: { valid: false },
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.SKILLS_RUNTIME_URL = 'https://skills-runtime.example'
    process.env.SKILLS_RUNTIME_TOKEN = 'runtime-token'
    global.fetch = vi.fn()

    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1' },
      bot: { id: 'bot-1' },
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })
    mocks.getSkillDraft.mockResolvedValue(structuredClone(baseDraft))
    mocks.updateSkillDraft.mockImplementation(async (_teamId, _botId, _skillName, updates) => ({
      ...structuredClone(baseDraft),
      files: updates.files ?? structuredClone(baseDraft.files),
      validation: updates.validation ?? structuredClone(baseDraft.validation),
      manifest: {
        ...structuredClone(baseDraft.manifest),
        ...(updates.manifest || {}),
      },
      hasFunctions: Boolean(updates.manifest?.hasFunctions),
    }))
    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [
        { path: '.docsbot/bundle/index.js', content: 'export default {}', truncated: false },
      ],
    })
    mocks.promoteSkillDraftToPublishedCurrent.mockResolvedValue({
      configured: true,
      promoted: 4,
      deleted: 0,
    })
    mocks.readPublishedSkillPackageFromR2.mockResolvedValue({
      configured: true,
      files: [
        { path: '.docsbot/bundle/index.js', content: 'export default {}', truncated: false },
      ],
    })
    mocks.publishSkillDraft.mockResolvedValue({
      ...structuredClone(baseDraft),
      manifest: {
        ...structuredClone(baseDraft.manifest),
        enabled: true,
        hasFunctions: true,
      },
      publishedAt: '2026-04-22T00:00:00.000Z',
    })
  })

  it('rejects users who cannot manage bot settings before loading the draft', async () => {
    mocks.canUserManageBotSettings.mockReturnValue(false)

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/publish/route')
    const response = await POST(new Request('https://docsbot.example/publish', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'current-weather-api' }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'You are not allowed to manage bot skills.',
    })
    expect(mocks.canUserManageBotSettings).toHaveBeenCalledWith(
      { id: 'team-1' },
      'user-1',
      { id: 'bot-1' },
    )
    expect(mocks.getSkillDraft).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mocks.updateSkillDraft).not.toHaveBeenCalled()
    expect(mocks.promoteSkillDraftToPublishedCurrent).not.toHaveBeenCalled()
    expect(mocks.publishSkillDraft).not.toHaveBeenCalled()
  })

  it('publishes executable skills when runtime validation does not return a bundle artifact', async () => {
    global.fetch.mockResolvedValue(
      Response.json({
        valid: true,
        errors: [],
        warnings: [],
        hasFunctions: true,
      }),
    )

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/publish/route')
    const response = await POST(new Request('https://docsbot.example/publish', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'current-weather-api' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Skill bundle promoted to the published package and Firestore manifest updated.',
      skill: expect.objectContaining({
        publishedAt: '2026-04-22T00:00:00.000Z',
      }),
      result: {
        valid: true,
        uploaded: true,
        promoted: 4,
        deleted: 0,
      },
    })
    const validationBody = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(validationBody.manifest).toEqual({
      envBindings: [{ envVar: 'WORKSPACE_ID', value: 'workspace-123' }],
      secretBindings: [],
      metadataBindings: [],
    })
    expect(mocks.readSkillDraftPackageFromR2).not.toHaveBeenCalled()
    expect(mocks.readPublishedSkillPackageFromR2).not.toHaveBeenCalled()
    expect(mocks.promoteSkillDraftToPublishedCurrent).toHaveBeenCalledWith(
      'team-1/bot-1/current-weather-api',
    )
    expect(mocks.publishSkillDraft).toHaveBeenCalledWith(
      {
        teamId: 'team-1',
        botId: 'bot-1',
        skillName: 'current-weather-api',
        userId: 'user-1',
        hasFunctions: true,
      },
      { id: 'firestore' },
    )
  })

  it('does not require the generated bundle artifact to exist in published R2', async () => {
    global.fetch.mockResolvedValue(
      Response.json({
        valid: true,
        errors: [],
        warnings: [],
        hasFunctions: true,
        bundleArtifact: {
          content: 'export default {}',
        },
      }),
    )
    mocks.readPublishedSkillPackageFromR2.mockResolvedValue({
      configured: true,
      files: [],
    })

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/publish/route')
    const response = await POST(new Request('https://docsbot.example/publish', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'current-weather-api' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Skill bundle promoted to the published package and Firestore manifest updated.',
      skill: expect.objectContaining({
        publishedAt: '2026-04-22T00:00:00.000Z',
      }),
      result: {
        valid: true,
        uploaded: true,
        promoted: 4,
        deleted: 0,
      },
    })
    expect(mocks.promoteSkillDraftToPublishedCurrent).toHaveBeenCalledWith(
      'team-1/bot-1/current-weather-api',
    )
    expect(mocks.readPublishedSkillPackageFromR2).not.toHaveBeenCalled()
    expect(mocks.publishSkillDraft).toHaveBeenCalled()
  })
})
