import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  encryptKey: vi.fn((value) => `encrypted:${value}`),
  readSkillDraftPackageFromR2: vi.fn(),
  writeSkillDraftFilesToR2: vi.fn(),
  configureFirebaseApp: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

vi.mock('@/lib/encryption', () => ({
  encryptKey: mocks.encryptKey,
  decryptKey: (payload) => {
    const value = String(payload || '')
    return value.startsWith('encrypted:') ? value.slice('encrypted:'.length) : value
  },
}))

vi.mock('@/lib/skills-r2-package', () => ({
  readSkillDraftPackageFromR2: mocks.readSkillDraftPackageFromR2,
  writeSkillDraftFilesToR2: mocks.writeSkillDraftFilesToR2,
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: mocks.serverTimestamp,
  },
}))

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createFirestoreMock(initialData = null) {
  const state = {
    data: initialData ? clone(initialData) : null,
  }

  const docRef = {
    get: vi.fn(async () => ({
      exists: state.data !== null,
      id: 'customer-refunds',
      data: () => clone(state.data),
    })),
    set: vi.fn(async (nextData, options) => {
      if (options?.merge && state.data) {
        state.data = {
          ...state.data,
          ...clone(nextData),
        }
      } else {
        state.data = clone(nextData)
      }
    }),
    delete: vi.fn(async () => {
      state.data = null
    }),
  }

  const skillsCollection = {
    doc: vi.fn(() => docRef),
    orderBy: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: [],
      })),
    })),
  }

  const botDoc = {
    collection: vi.fn(() => skillsCollection),
  }

  const botsCollection = {
    doc: vi.fn(() => botDoc),
  }

  const teamDoc = {
    collection: vi.fn(() => botsCollection),
  }

  const teamsCollection = {
    doc: vi.fn(() => teamDoc),
  }

  return {
    state,
    docRef,
    collection: vi.fn(() => teamsCollection),
  }
}

describe('skills-builder helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [],
    })
    mocks.writeSkillDraftFilesToR2.mockResolvedValue({
      configured: true,
      written: 0,
      deleted: 0,
    })
  })

  it('creates executable drafts with an R2 prefix and sandbox agent state', async () => {
    const {
      createSkillDraftRecord,
      SKILL_AUDIENCE_CUSTOMER,
      SKILL_MODE_EXECUTABLE,
    } = await import('@/lib/skills-builder')

    const draft = createSkillDraftRecord({
      teamId: 'team1234567890123456',
      botId: 'bot12345678901234567',
      skillName: 'customer-refunds',
      audience: SKILL_AUDIENCE_CUSTOMER,
      mode: SKILL_MODE_EXECUTABLE,
    })

    expect(draft.files.map((file) => file.path)).toEqual([
      'package.json',
      'scripts/index.ts',
      'SKILL.md',
    ])
    expect(draft.manifest.r2Prefix).toBe(
      'team1234567890123456/bot12345678901234567/customer-refunds',
    )
    expect(draft.agent).toEqual({
      sandboxId: null,
      sessionId: null,
      lastResponseId: null,
    })
    expect(draft.manifest.icon).toBe('LinkIcon')
  })

  it('ensureSkillDraft seeds the initial bundle into the draft R2 prefix', async () => {
    const firestore = createFirestoreMock()
    const { ensureSkillDraft, SKILL_SCHEMA_VERSION } = await import('@/lib/skills-builder')

    const draft = await ensureSkillDraft({
      firestore,
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      audience: 'customer',
      mode: 'markdown',
    })

    expect(mocks.writeSkillDraftFilesToR2).toHaveBeenCalledWith(
      'team-1/bot-1/customer-refunds',
      draft.files,
    )
    expect(firestore.docRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'customer-refunds',
        version: SKILL_SCHEMA_VERSION,
        r2Prefix: 'team-1/bot-1/customer-refunds',
        icon: 'LinkIcon',
        agent: {
          sandboxId: null,
          sessionId: null,
          lastResponseId: null,
        },
      }),
    )
  })

  it('updateSkillDraft encrypts secrets and writes updated files back to R2', async () => {
    const firestore = createFirestoreMock({
      name: 'customer-refunds',
      description: 'Use when refund workflows need automation.',
      internal: false,
      enabled: false,
      hasFunctions: true,
      icon: 'LinkIcon',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
      mode: 'executable',
      audience: 'customer',
      validation: null,
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
      agent: {
        sandboxId: 'skill:team-1:bot-1:customer-refunds',
        sessionId: 'builder',
        lastResponseId: null,
      },
    })

    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [{ path: 'SKILL.md', content: 'old content' }],
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')
    const updated = await updateSkillDraft(
      'team-1',
      'bot-1',
      'customer-refunds',
      {
        manifest: {
          envBindings: [
            {
              envVar: 'WORKSPACE_ID',
              value: 'workspace-123',
              description: 'Workspace ID for the customer account this skill queries.',
            },
          ],
          secretBindings: [
            {
              envVar: 'API_TOKEN',
              secret: 'raw-secret',
              description: 'API token used for outbound requests.',
            },
          ],
        },
        files: [{ path: 'SKILL.md', content: 'new content' }],
      },
      firestore,
    )

    expect(mocks.encryptKey).toHaveBeenCalledWith('raw-secret')
    expect(mocks.writeSkillDraftFilesToR2).toHaveBeenCalledWith(
      'team-1/bot-1/customer-refunds',
      [{ path: 'SKILL.md', content: 'new content' }],
    )
    expect(updated.secretBindings).toEqual([
      {
        envVar: 'API_TOKEN',
        secret: 'enc:encrypted:raw-secret',
        description: 'API token used for outbound requests.',
      },
    ])
    expect(updated.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-123',
        description: 'Workspace ID for the customer account this skill queries.',
      },
    ])
    expect(updated.files).toEqual([{ path: 'SKILL.md', content: 'new content' }])
  })

  it('getSkillDraft can return metadata without reading draft files from R2', async () => {
    const firestore = createFirestoreMock({
      name: 'customer-refunds',
      description: 'Use when refund workflows need automation.',
      internal: false,
      enabled: false,
      hasFunctions: true,
      icon: 'LinkIcon',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
      mode: 'executable',
      audience: 'customer',
      validation: null,
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
      agent: {
        sandboxId: 'skill:team-1:bot-1:customer-refunds',
        sessionId: 'builder',
        lastResponseId: null,
      },
    })

    const { getSkillDraft } = await import('@/lib/skills-builder')
    const draft = await getSkillDraft('team-1', 'bot-1', 'customer-refunds', firestore, {
      includeFiles: false,
    })

    expect(mocks.readSkillDraftPackageFromR2).not.toHaveBeenCalled()
    expect(draft.files).toEqual([])
    expect(draft.name).toBe('customer-refunds')
  })

  it('skillRecordWithDecryptedSecretBindings exposes plaintext values for the dashboard', async () => {
    const { skillRecordWithDecryptedSecretBindings, serializeSkillRecord } = await import(
      '@/lib/skills-builder'
    )

    const raw = serializeSkillRecord('my-skill', {
      name: 'my-skill',
      description: 'Use when skill drafts need review.',
      internal: false,
      enabled: false,
      audience: 'customer',
      r2Prefix: 'team/bot/my-skill',
      envBindings: [
        {
          envVar: 'WORKSPACE_ID',
          value: 'workspace-123',
          description: 'Workspace ID for the linked customer account.',
        },
      ],
      secretBindings: [
        {
          envVar: 'API_TOKEN',
          secret: 'enc:encrypted:sekret',
          description: 'API token used to authenticate outbound requests.',
        },
      ],
      metadataBindings: [
        {
          envVar: 'CUSTOMER_EMAIL',
          metadataKey: 'customerEmail',
          description: 'Email address passed from widget metadata.',
        },
      ],
    })

    const out = skillRecordWithDecryptedSecretBindings(raw)
    expect(out.secretBindings).toEqual([
      {
        envVar: 'API_TOKEN',
        secret: 'sekret',
        description: 'API token used to authenticate outbound requests.',
      },
    ])
    expect(out.manifest.secretBindings).toEqual([
      {
        envVar: 'API_TOKEN',
        secret: 'sekret',
        description: 'API token used to authenticate outbound requests.',
      },
    ])
    expect(out.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-123',
        description: 'Workspace ID for the linked customer account.',
      },
    ])
    expect(out.manifest.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-123',
        description: 'Workspace ID for the linked customer account.',
      },
    ])
    expect(out.metadataBindings).toEqual([
      {
        envVar: 'CUSTOMER_EMAIL',
        metadataKey: 'customerEmail',
        description: 'Email address passed from widget metadata.',
      },
    ])
    expect(out.manifest.metadataBindings).toEqual([
      {
        envVar: 'CUSTOMER_EMAIL',
        metadataKey: 'customerEmail',
        description: 'Email address passed from widget metadata.',
      },
    ])
  })

  it('serializeSkillRecord includes enabledWidget for widget deployment state', async () => {
    const { serializeSkillRecord } = await import('@/lib/skills-builder')

    const record = serializeSkillRecord('customer-refunds', {
      name: 'customer-refunds',
      description: 'Use when the user asks about refunds.',
      internal: false,
      enabled: true,
      enabledWidget: true,
      audience: 'customer',
      r2Prefix: 'team/bot/customer-refunds',
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
    })

    expect(record.enabledWidget).toBe(true)
    expect(record.manifest.enabledWidget).toBe(true)
  })

  it('serializeSkillRecord normalizes and exposes icon on the record and manifest', async () => {
    const { serializeSkillRecord } = await import('@/lib/skills-builder')

    const record = serializeSkillRecord('my-skill', {
      name: 'my-skill',
      description: 'Test.',
      icon: 'NotARealIcon',
      internal: false,
      enabled: false,
      audience: 'customer',
      r2Prefix: 'team/bot/my-skill',
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
    })

    expect(record.icon).toBe('LinkIcon')
    expect(record.manifest.icon).toBe('LinkIcon')

    const withIcon = serializeSkillRecord('other', {
      name: 'other',
      description: 'Test.',
      icon: 'BoltIcon',
      internal: false,
      enabled: false,
      audience: 'customer',
      r2Prefix: 'team/bot/other',
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
    })
    expect(withIcon.icon).toBe('BoltIcon')
  })

  it('filters node_modules and other unsupported package artifacts from draft files and context summaries', async () => {
    const { buildSkillContextSummary, listDraftFiles } = await import('@/lib/skills-builder')

    const files = listDraftFiles([
      { path: 'SKILL.md', content: '# Skill\n' },
      { path: 'scripts/index.ts', content: 'export const ok = true\n' },
      { path: 'package.json', content: '{\"private\":true}\n' },
      { path: 'node_modules/zod/index.cjs', content: 'module.exports = {}\n' },
      { path: 'package-lock.json', content: '{\"lockfileVersion\":3}\n' },
      { path: '.pnpm-store/v3/files/x', content: 'cached\n' },
    ])

    expect(files.map((file) => file.path)).toEqual(['package.json', 'scripts/index.ts', 'SKILL.md'])

    const summary = buildSkillContextSummary({
      name: 'customer-refunds',
      mode: 'executable',
      audience: 'customer',
      description: 'Use when refunds need review.',
      internal: false,
      enabled: false,
      enabledWidget: false,
      hasFunctions: true,
      icon: 'LinkIcon',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [
        {
          envVar: 'WORKSPACE_ID',
          value: 'workspace-123',
          description: 'Workspace ID for the customer account this skill uses.',
        },
      ],
      secretBindings: [],
      metadataBindings: [],
      validation: null,
      liveTest: null,
      files: [
        ...files,
        { path: 'node_modules/left-pad/index.js', content: 'module.exports = {}\n' },
      ],
    })

    expect(summary.fileTree.map((file) => file.path)).toEqual([
      'package.json',
      'scripts/index.ts',
      'SKILL.md',
    ])
    expect(summary.resourceSummary).toEqual({
      references: 0,
      assets: 0,
      scripts: 1,
    })
    expect(summary.manifest.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-123',
        description: 'Workspace ID for the customer account this skill uses.',
      },
    ])
  })

  it('seeds executable skill templates with JSON-only function output guidance', async () => {
    const { createScriptsIndexTemplate } = await import('@/lib/skills-builder')

    const template = createScriptsIndexTemplate()

    expect(template).toContain('structured JSON only')
    expect(template).toContain('filtering or chaining function results')
  })
})
