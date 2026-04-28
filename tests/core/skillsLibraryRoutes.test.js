import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getAuthorizedBotContext: vi.fn(),
  jsonError: vi.fn((message, status = 500) => Response.json({ message }, { status })),
  canUserManageBotSettings: vi.fn(() => true),
  getWidgetSkillSlotLimit: vi.fn(() => 5),
  isSuperAdmin: vi.fn(() => false),
  deleteLibrarySkill: vi.fn(),
  importLibrarySkillToBot: vi.fn(),
  listLibrarySkills: vi.fn(),
  searchLibrarySkills: vi.fn(),
  listSkillDrafts: vi.fn(),
  promoteSkillDraftToLibrary: vi.fn(),
  skillRecordWithDecryptedSecretBindings: vi.fn((skill) => skill),
}))

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: mocks.getAuthorizedBotContext,
  jsonError: mocks.jsonError,
}))

vi.mock('@/utils/function.utils', () => ({
  canUserManageBotSettings: mocks.canUserManageBotSettings,
}))

vi.mock('@/utils/helpers', () => ({
  getWidgetSkillSlotLimit: mocks.getWidgetSkillSlotLimit,
  isSuperAdmin: mocks.isSuperAdmin,
}))

vi.mock('@/lib/skills-builder', () => ({
  deleteLibrarySkill: mocks.deleteLibrarySkill,
  importLibrarySkillToBot: mocks.importLibrarySkillToBot,
  listLibrarySkills: mocks.listLibrarySkills,
  searchLibrarySkills: mocks.searchLibrarySkills,
  listSkillDrafts: mocks.listSkillDrafts,
  promoteSkillDraftToLibrary: mocks.promoteSkillDraftToLibrary,
  skillRecordWithDecryptedSecretBindings: mocks.skillRecordWithDecryptedSecretBindings,
}))

describe('skills library routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1' },
      bot: { id: 'bot-1' },
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })
    mocks.listLibrarySkills.mockResolvedValue([
      { id: 'weather', name: 'weather', description: 'Weather lookup' },
    ])
    mocks.searchLibrarySkills.mockResolvedValue({
      configured: true,
      skills: [{ id: 'weather', name: 'weather', description: 'Weather lookup' }],
    })
    mocks.listSkillDrafts.mockResolvedValue([])
    mocks.importLibrarySkillToBot.mockResolvedValue({
      skill: { name: 'weather', description: 'Weather lookup' },
      librarySkill: { id: 'weather', name: 'weather' },
      result: { configured: true, draftCopied: 1, publishedCopied: 1 },
    })
    mocks.promoteSkillDraftToLibrary.mockResolvedValue({
      skill: { id: 'weather', name: 'weather' },
      result: { configured: true, copied: 2, deleted: 0 },
      searchIndex: { configured: true, indexed: true },
    })
    mocks.deleteLibrarySkill.mockResolvedValue({
      deleted: true,
      r2Deleted: 3,
      r2Cleaned: true,
    })
  })

  it('lists library skills for users with bot access', async () => {
    const { GET } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/_library/route')
    const response = await GET(new Request('https://docsbot.example/library'), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      skills: [{ id: 'weather', name: 'weather', description: 'Weather lookup' }],
    })
    expect(mocks.listLibrarySkills).toHaveBeenCalledWith({ id: 'firestore' })
  })

  it('uses library hybrid search when a query is provided', async () => {
    const { GET } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/_library/route')
    const response = await GET(new Request('https://docsbot.example/library?query=forecast&limit=3'), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      skills: [{ id: 'weather', name: 'weather', description: 'Weather lookup' }],
      search: {
        configured: true,
        message: undefined,
      },
    })
    expect(mocks.searchLibrarySkills).toHaveBeenCalledWith('forecast', { id: 'firestore' }, { limit: 3 })
    expect(mocks.listLibrarySkills).not.toHaveBeenCalled()
  })

  it('rejects non-super-admin promotion before copying packages', async () => {
    mocks.isSuperAdmin.mockReturnValue(false)

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/library/route')
    const response = await POST(new Request('https://docsbot.example/promote', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'weather' }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'Only super admins can add skills to the library.',
    })
    expect(mocks.promoteSkillDraftToLibrary).not.toHaveBeenCalled()
  })

  it('allows super admins to promote published skills to the library', async () => {
    mocks.isSuperAdmin.mockReturnValue(true)

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/library/route')
    const response = await POST(new Request('https://docsbot.example/promote', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', id: 'weather' }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Skill added to the global skills library.',
      skill: { id: 'weather', name: 'weather' },
      result: { configured: true, copied: 2, deleted: 0 },
      searchIndex: { configured: true, indexed: true },
    })
    expect(mocks.promoteSkillDraftToLibrary).toHaveBeenCalledWith({
      firestore: { id: 'firestore' },
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'weather',
      userId: 'user-1',
    })
  })

  it('imports library skills for authorized bot managers', async () => {
    const { POST } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/_library/[librarySkillId]/import/route'
    )
    const response = await POST(new Request('https://docsbot.example/import', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', librarySkillId: 'weather' }),
    })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      message: 'Library skill imported into this bot.',
      skill: { name: 'weather', description: 'Weather lookup' },
      librarySkill: { id: 'weather', name: 'weather' },
      result: { configured: true, draftCopied: 1, publishedCopied: 1 },
    })
    expect(mocks.importLibrarySkillToBot).toHaveBeenCalledWith({
      firestore: { id: 'firestore' },
      teamId: 'team-1',
      botId: 'bot-1',
      librarySkillName: 'weather',
    })
  })

  it('enforces non-super-admin skill slot limits before import', async () => {
    mocks.getWidgetSkillSlotLimit.mockReturnValue(1)
    mocks.listSkillDrafts.mockResolvedValue([{ name: 'existing' }])

    const { POST } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/_library/[librarySkillId]/import/route'
    )
    const response = await POST(new Request('https://docsbot.example/import', { method: 'POST' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', librarySkillId: 'weather' }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message:
        'This bot can have at most 1 skills on your current plan. Remove a skill or upgrade for a higher limit.',
    })
    expect(mocks.importLibrarySkillToBot).not.toHaveBeenCalled()
  })

  it('rejects non-super-admin library deletes', async () => {
    mocks.isSuperAdmin.mockReturnValue(false)

    const { DELETE } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/_library/[librarySkillId]/route'
    )
    const response = await DELETE(new Request('https://docsbot.example/delete', { method: 'DELETE' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', librarySkillId: 'weather' }),
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'Only super admins can delete skills from the library.',
    })
    expect(mocks.deleteLibrarySkill).not.toHaveBeenCalled()
  })

  it('returns not found when deleting a missing library skill', async () => {
    mocks.isSuperAdmin.mockReturnValue(true)
    mocks.deleteLibrarySkill.mockResolvedValue({
      deleted: false,
      r2Deleted: 0,
      r2Cleaned: true,
    })

    const { DELETE } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/_library/[librarySkillId]/route'
    )
    const response = await DELETE(new Request('https://docsbot.example/delete', { method: 'DELETE' }), {
      params: Promise.resolve({ teamId: 'team-1', botId: 'bot-1', librarySkillId: 'weather' }),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      message: 'Library skill not found.',
    })
  })
})
