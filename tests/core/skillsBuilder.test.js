import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  encryptKey: vi.fn((value) => `encrypted:${value}`),
  readSkillDraftPackageFromR2: vi.fn(),
  writeSkillDraftFilesToR2: vi.fn(),
  copyLibrarySkillPackageToDraftAndPublished: vi.fn(),
  copyPublishedSkillPackageToLibrary: vi.fn(),
  deleteSkillLibraryPackageFromR2: vi.fn(),
  getSkillLibraryR2RootPrefix: vi.fn((skillName) => `library/skills/${skillName}`),
  deleteLibrarySkillFromSearch: vi.fn(),
  indexLibrarySkillForSearch: vi.fn(),
  searchLibrarySkillsWithHybrid: vi.fn(),
  configureFirebaseApp: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  increment: vi.fn((value) => ({ __increment: value })),
}))

vi.mock('@/lib/encryption', () => ({
  encryptKey: mocks.encryptKey,
  decryptKey: (payload) => {
    const value = String(payload || '')
    if (!value.startsWith('encrypted:')) {
      throw new Error('invalid ciphertext')
    }
    return value.slice('encrypted:'.length)
  },
}))

vi.mock('@/lib/skills-r2-package', () => ({
  copyLibrarySkillPackageToDraftAndPublished: mocks.copyLibrarySkillPackageToDraftAndPublished,
  copyPublishedSkillPackageToLibrary: mocks.copyPublishedSkillPackageToLibrary,
  deleteSkillLibraryPackageFromR2: mocks.deleteSkillLibraryPackageFromR2,
  getSkillLibraryR2RootPrefix: mocks.getSkillLibraryR2RootPrefix,
  readSkillDraftPackageFromR2: mocks.readSkillDraftPackageFromR2,
  writeSkillDraftFilesToR2: mocks.writeSkillDraftFilesToR2,
}))

vi.mock('@/lib/skills-library-search', () => ({
  deleteLibrarySkillFromSearch: mocks.deleteLibrarySkillFromSearch,
  indexLibrarySkillForSearch: mocks.indexLibrarySkillForSearch,
  searchLibrarySkillsWithHybrid: mocks.searchLibrarySkillsWithHybrid,
}))

vi.mock('@/config/firebase-server.config', () => ({
  configureFirebaseApp: mocks.configureFirebaseApp,
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: mocks.serverTimestamp,
    increment: mocks.increment,
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
    update: vi.fn(async (nextData) => {
      state.data = {
        ...state.data,
        ...clone(nextData),
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

function createLibraryFirestoreMock({ library = {}, local = {} } = {}) {
  const state = {
    library: clone(library),
    local: clone(local),
  }

  const makeSnapshot = (id, data) => ({
    exists: data !== undefined,
    id,
    data: () => clone(data),
  })

  const makeDoc = (store, id) => ({
    get: vi.fn(async () => makeSnapshot(id, store[id])),
    set: vi.fn(async (nextData, options) => {
      store[id] =
        options?.merge && store[id]
          ? {
              ...store[id],
              ...clone(nextData),
            }
          : clone(nextData)
    }),
    delete: vi.fn(async () => {
      delete store[id]
    }),
  })

  const projectData = (data, fields) => {
    if (!Array.isArray(fields) || fields.length === 0) return data
    return fields.reduce((acc, field) => {
      if (Object.prototype.hasOwnProperty.call(data || {}, field)) {
        acc[field] = data[field]
      }
      return acc
    }, {})
  }

  const localQuery = {
    selectedFields: [],
    select: vi.fn(function select(...fields) {
      this.selectedFields = fields
      return this
    }),
    get: vi.fn(async function get() {
      return {
        docs: Object.entries(state.local).map(([id, data]) =>
          makeSnapshot(id, projectData(data, this.selectedFields)),
        ),
      }
    }),
  }

  const localCollection = {
    doc: vi.fn((id) => makeDoc(state.local, id)),
    orderBy: vi.fn(() => localQuery),
  }

  const topSkillsCollection = {
    doc: vi.fn((id) => makeDoc(state.library, id)),
    orderBy: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: Object.entries(state.library).map(([id, data]) => makeSnapshot(id, data)),
      })),
    })),
  }

  const botDoc = {
    collection: vi.fn(() => localCollection),
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
    localQuery,
    collection: vi.fn((name) => (name === 'skills' ? topSkillsCollection : teamsCollection)),
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
    mocks.copyLibrarySkillPackageToDraftAndPublished.mockResolvedValue({
      configured: true,
      draftCopied: 1,
      draftDeleted: 0,
      publishedCopied: 1,
      publishedDeleted: 0,
    })
    mocks.copyPublishedSkillPackageToLibrary.mockResolvedValue({
      configured: true,
      copied: 1,
      deleted: 0,
    })
    mocks.deleteSkillLibraryPackageFromR2.mockResolvedValue({
      configured: true,
      deleted: 1,
    })
    mocks.deleteLibrarySkillFromSearch.mockResolvedValue({
      configured: true,
      deleted: true,
    })
    mocks.indexLibrarySkillForSearch.mockResolvedValue({
      configured: true,
      indexed: true,
    })
    mocks.searchLibrarySkillsWithHybrid.mockResolvedValue({
      configured: true,
      skills: [],
    })
  })

  it('increments all builder agent usage total fields', async () => {
    const { incrementSkillDraftBuilderAgentUsage } = await import('@/lib/skills-builder')
    const docRef = { update: vi.fn(async () => undefined) }

    await incrementSkillDraftBuilderAgentUsage(docRef, {
      openaiModelId: 'gpt-5.4-mini',
      usage: {
        modelSlug: 'gpt-5-4-mini',
        estimatedCostUsd: 0.12,
        estimatedTokenCostUsd: 0.1,
        estimatedWebSearchCostUsd: 0.01,
        estimatedCfShellCostUsd: 0.01,
        inputTokens: 100,
        cachedInputTokens: 25,
        cacheWriteTokens: 5,
        outputTokens: 50,
        reasoningTokens: 12,
        webSearchCalls: 1,
        shellCalls: 2,
        shellDurationMs: 3000,
      },
    })

    expect(docRef.update).toHaveBeenCalledWith(
      expect.objectContaining({
        'agent.lastBuilderOpenaiModel': 'gpt-5.4-mini',
        'agent.lastBuilderModelSlug': 'gpt-5-4-mini',
        'agent.builderUsageTotals.turns': { __increment: 1 },
        'agent.builderUsageTotals.inputTokens': { __increment: 100 },
        'agent.builderUsageTotals.cachedInputTokens': { __increment: 25 },
        'agent.builderUsageTotals.cacheWriteTokens': { __increment: 5 },
        'agent.builderUsageTotals.outputTokens': { __increment: 50 },
        'agent.builderUsageTotals.reasoningTokens': { __increment: 12 },
      }),
    )
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
        secret: 'encrypted:raw-secret',
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

  it('updateSkillDraft stores multiple-choice env options while keeping value scalar', async () => {
    const firestore = createFirestoreMock({
      name: 'customer-refunds',
      description: 'Use when refund workflows need automation.',
      internal: false,
      enabled: false,
      hasFunctions: true,
      icon: 'LinkIcon',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [{ envVar: 'REGION', value: 'eu-west-1' }],
      secretBindings: [],
      metadataBindings: [],
      mode: 'executable',
      audience: 'customer',
      validation: null,
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
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
              envVar: 'REGION',
              value: 'eu-west-1',
              options: { 'us-east-1': 'us-east-1', 'eu-west-1': 'eu-west-1' },
              description: 'Deployment region.',
            },
            {
              envVar: 'API_ENVIRONMENT',
              value: 'sandbox',
              options: { sandbox: 'Sandbox', production: 'Production' },
            },
          ],
        },
      },
      firestore,
    )

    expect(updated.envBindings).toEqual([
      {
        envVar: 'REGION',
        value: 'eu-west-1',
        options: { 'us-east-1': 'us-east-1', 'eu-west-1': 'eu-west-1' },
        description: 'Deployment region.',
      },
      {
        envVar: 'API_ENVIRONMENT',
        value: 'sandbox',
        options: { sandbox: 'Sandbox', production: 'Production' },
      },
    ])
  })

  it('updateSkillDraft preserves multiple-choice env options on scalar updates', async () => {
    const firestore = createFirestoreMock({
      name: 'image-generator',
      description: 'Use when image generation needs defaults.',
      internal: false,
      enabled: false,
      hasFunctions: true,
      icon: 'PhotoIcon',
      r2Prefix: 'team-1/bot-1/image-generator',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [
        {
          envVar: 'DEFAULT_QUALITY',
          value: 'auto',
          options: { auto: 'auto', low: 'low', medium: 'medium', high: 'high' },
          description: 'Default image quality when the user does not specify one.',
        },
      ],
      secretBindings: [],
      metadataBindings: [],
      mode: 'executable',
      audience: 'customer',
      validation: null,
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
    })

    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [{ path: 'SKILL.md', content: 'old content' }],
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')
    const updated = await updateSkillDraft(
      'team-1',
      'bot-1',
      'image-generator',
      {
        manifest: {
          envBindings: [
            {
              envVar: 'DEFAULT_QUALITY',
              value: 'medium',
              description: 'Default image quality when the user does not specify one.',
            },
          ],
        },
      },
      firestore,
    )

    expect(updated.envBindings).toEqual([
      {
        envVar: 'DEFAULT_QUALITY',
        value: 'medium',
        options: { auto: 'auto', low: 'low', medium: 'medium', high: 'high' },
        description: 'Default image quality when the user does not specify one.',
      },
    ])
    expect(updated.manifest.envBindings).toEqual(updated.envBindings)
  })

  it('updateSkillDraft rejects multiple-choice env values outside the option keys', async () => {
    const firestore = createFirestoreMock({
      name: 'image-generator',
      description: 'Use when image generation needs defaults.',
      internal: false,
      enabled: false,
      hasFunctions: true,
      icon: 'PhotoIcon',
      r2Prefix: 'team-1/bot-1/image-generator',
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
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')

    await expect(
      updateSkillDraft(
        'team-1',
        'bot-1',
        'image-generator',
        {
          manifest: {
            envBindings: [
              {
                envVar: 'DEFAULT_QUALITY',
                value: 'ultra',
                options: { auto: 'auto', low: 'low', medium: 'medium', high: 'high' },
              },
            ],
          },
        },
        firestore,
      ),
    ).rejects.toThrow('Env binding DEFAULT_QUALITY value must match one of its option keys.')
  })

  it('updateSkillDraft stores a friendly display name without changing the skill id', async () => {
    const firestore = createFirestoreMock({
      name: 'customer-refunds',
      description: 'Use when refund workflows need automation.',
      internal: false,
      enabled: false,
      hasFunctions: false,
      icon: 'LinkIcon',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
      mode: 'markdown',
      audience: 'customer',
      validation: null,
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
      agent: null,
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')
    const updated = await updateSkillDraft(
      'team-1',
      'bot-1',
      'customer-refunds',
      {
        manifest: {
          displayName: 'Refund Policy Helper',
        },
      },
      firestore,
    )

    expect(updated.skillName).toBe('customer-refunds')
    expect(updated.name).toBe('Refund Policy Helper')
    expect(updated.manifest.name).toBe('customer-refunds')
    expect(updated.manifest.displayName).toBe('Refund Policy Helper')
    expect(firestore.state.data.name).toBe('customer-refunds')
    expect(firestore.state.data.displayName).toBe('Refund Policy Helper')
  })

  it('updateSkillDraft does not re-encrypt existing ciphertext when updating unrelated fields', async () => {
    const storedCipher = 'encrypted:already-stored'
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
      secretBindings: [
        {
          envVar: 'API_TOKEN',
          secret: storedCipher,
          description: 'API token used for outbound requests.',
        },
      ],
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
      files: [{ path: 'SKILL.md', content: 'content' }],
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')
    await updateSkillDraft('team-1', 'bot-1', 'customer-refunds', { validation: { ok: true } }, firestore)

    expect(mocks.encryptKey).not.toHaveBeenCalled()
    expect(firestore.docRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        secretBindings: [
          {
            envVar: 'API_TOKEN',
            secret: storedCipher,
            description: 'API token used for outbound requests.',
          },
        ],
        validation: { ok: true },
      }),
      { merge: true },
    )
    expect(firestore.docRef.update).toHaveBeenCalledWith({
      validation: { ok: true },
    })
  })

  it('replaces validation map after merged draft updates so stale error details are cleared', async () => {
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
      validation: {
        valid: false,
        errors: ['old error'],
        errorDetails: [{ code: 'invalid_input' }],
      },
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
      agent: null,
    })

    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [{ path: 'SKILL.md', content: 'content' }],
    })

    const { updateSkillDraft } = await import('@/lib/skills-builder')
    const updated = await updateSkillDraft(
      'team-1',
      'bot-1',
      'customer-refunds',
      {
        validation: {
          valid: true,
          errors: [],
          warnings: [],
        },
      },
      firestore,
    )

    expect(updated.validation).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    })
    expect(firestore.state.data.validation).toEqual({
      valid: true,
      errors: [],
      warnings: [],
    })
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
    expect(draft.skillName).toBe('customer-refunds')
    expect(draft.name).toBe('Customer Refunds')
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
          secret: 'encrypted:sekret',
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

  it('lists skill draft summaries with a projected Firestore query and no R2 reads', async () => {
    const firestore = createLibraryFirestoreMock({
      local: {
        'customer-refunds': {
          name: 'Customer Refunds',
          description: 'Use when customers ask about refunds.',
          internal: false,
          enabled: true,
          enabledWidget: true,
          mode: 'executable',
          hasFunctions: true,
          icon: 'ReceiptRefundIcon',
          r2Prefix: 'team-1/bot-1/customer-refunds',
          networkPolicy: { allowedDomains: ['api.example.com'], allowedSchemes: ['https'] },
          authProviders: [
            { id: 'service', type: 'headerAuth', allowedDomains: ['api.auth.example'], allowedSchemes: ['https'] },
          ],
          envBindings: [{ envVar: 'WORKSPACE_ID', value: '' }],
          secretBindings: [{ envVar: 'API_TOKEN', secret: 'encrypted:token' }],
          chatMessages: [{ role: 'user', content: 'large history should not be selected' }],
          files: [{ path: 'SKILL.md', content: '# large file should not be selected' }],
          updatedAt: '2026-04-29T00:00:00.000Z',
          publishedAt: '2026-04-29T00:00:00.000Z',
        },
      },
    })

    const { listSkillDraftSummaries } = await import('@/lib/skills-builder')
    const summaries = await listSkillDraftSummaries('team-1', 'bot-1', firestore)

    expect(firestore.localQuery.select).toHaveBeenCalled()
    expect(firestore.localQuery.selectedFields).toEqual(
      expect.arrayContaining([
        'name',
        'description',
        'enabledWidget',
        'networkPolicy',
        'authProviders',
        'envBindings',
        'secretBindings',
        'updatedAt',
      ]),
    )
    expect(firestore.localQuery.selectedFields).not.toContain('chatMessages')
    expect(firestore.localQuery.selectedFields).not.toContain('files')
    expect(mocks.readSkillDraftPackageFromR2).not.toHaveBeenCalled()
    expect(summaries).toHaveLength(1)
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        skillName: 'customer-refunds',
        name: 'Customer Refunds',
        enabledWidget: true,
        hasFunctions: true,
        authProviders: [
          { id: 'service', type: 'headerAuth', allowedDomains: ['api.auth.example'], allowedSchemes: ['https'] },
        ],
        files: [],
      }),
    )
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
      secretBindings: [
        {
          envVar: 'API_TOKEN',
          secret: 'encrypted-secret-value',
          description: 'API token for the customer account.',
        },
        {
          envVar: 'OPTIONAL_TOKEN',
          secret: '',
          description: 'Optional token.',
        },
      ],
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
        value: '**REDACTED**',
        description: 'Workspace ID for the customer account this skill uses.',
      },
    ])
    expect(summary.manifest.secretBindings).toEqual([
      {
        envVar: 'API_TOKEN',
        secret: '**REDACTED**',
        description: 'API token for the customer account.',
      },
      {
        envVar: 'OPTIONAL_TOKEN',
        secret: '',
        description: 'Optional token.',
      },
    ])
  })

  it('seeds executable skill templates with JSON-only function output guidance', async () => {
    const { createScriptsIndexTemplate } = await import('@/lib/skills-builder')

    const template = createScriptsIndexTemplate()

    expect(template).toContain('structured JSON only')
    expect(template).toContain('filtering or chaining function results')
  })

  it('adds invalid Zod contract guidance only to matching validation payloads', async () => {
    const { sanitizeValidationPayload } = await import('@/lib/skills-builder')

    const invalidContract = sanitizeValidationPayload({
      valid: false,
      errors: ["Function must define 'input' as a Zod schema in defineSkillFunction({...})"],
      warnings: [],
      errorDetails: [{ code: 'invalid_output', artifactPath: '.docsbot/bundle/index.js' }],
    })

    expect(invalidContract.hints).toEqual([
      expect.stringContaining('Fix the defineSkillFunction({...}) object first.'),
    ])
    expect(invalidContract.hints[0]).toContain('input: ExampleTaskInputSchema')
    expect(invalidContract.hints[0]).toContain('output: ExampleTaskOutputSchema')
    expect(invalidContract.errorDetails[0]).not.toHaveProperty('artifactPath')

    const unrelated = sanitizeValidationPayload({
      valid: false,
      errors: ['Missing SKILL.md.'],
      warnings: [],
    })

    expect(unrelated.hints).toBeUndefined()
  })

  it('promotes a published bot skill into the top-level skills library', async () => {
    const firestore = createLibraryFirestoreMock({
      local: {
        weather: {
          name: 'weather',
          description: 'Use when checking weather.',
          internal: false,
          enabled: true,
          enabledWidget: false,
          hasFunctions: true,
          icon: 'BoltIcon',
          r2Prefix: 'team-1/bot-1/weather',
          networkPolicy: { allowedDomains: ['api.weather.example'], allowedSchemes: ['https'] },
          mode: 'executable',
          audience: 'customer',
          publishedAt: '2026-04-22T00:00:00.000Z',
        },
      },
    })

    const { promoteSkillDraftToLibrary } = await import('@/lib/skills-builder')
    const promoted = await promoteSkillDraftToLibrary({
      firestore,
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'weather',
      userId: 'admin-1',
    })

    expect(mocks.copyPublishedSkillPackageToLibrary).toHaveBeenCalledWith(
      'team-1/bot-1/weather',
      'weather',
    )
    expect(promoted.skill).toEqual(
      expect.objectContaining({
        id: 'weather',
        skillName: 'weather',
        name: 'Weather',
        description: 'Use when checking weather.',
        r2Prefix: 'library/skills/weather',
        hasFunctions: true,
      }),
    )
    expect(mocks.indexLibrarySkillForSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'weather',
        skillName: 'weather',
        name: 'Weather',
      }),
    )
    expect(firestore.state.library.weather).toEqual(
      expect.objectContaining({
        name: 'Weather',
        displayName: 'Weather',
        source: expect.objectContaining({
          teamId: 'team-1',
          botId: 'bot-1',
          skillName: 'weather',
        }),
        createdBy: 'admin-1',
      }),
    )
  })

  it('replaces an existing library skill document when promoting the same id', async () => {
    const firestore = createLibraryFirestoreMock({
      library: {
        weather: {
          name: 'weather',
          description: 'Old weather skill.',
          legacyField: 'remove-me',
          createdAt: 'OLD_CREATED_AT',
        },
      },
      local: {
        weather: {
          name: 'weather',
          description: 'Updated weather skill.',
          internal: true,
          enabled: true,
          enabledWidget: false,
          hasFunctions: false,
          icon: 'BoltIcon',
          r2Prefix: 'team-1/bot-1/weather',
          networkPolicy: { allowedDomains: ['api.weather.example'], allowedSchemes: ['https'] },
          mode: 'markdown',
          audience: 'internal',
          publishedAt: '2026-04-22T00:00:00.000Z',
        },
      },
    })

    const { promoteSkillDraftToLibrary } = await import('@/lib/skills-builder')
    await promoteSkillDraftToLibrary({
      firestore,
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'weather',
      userId: 'admin-1',
    })

    expect(firestore.state.library.weather).toEqual(
      expect.objectContaining({
        name: 'Weather',
        description: 'Updated weather skill.',
        createdAt: 'OLD_CREATED_AT',
        updatedAt: 'SERVER_TIMESTAMP',
      }),
    )
    expect(firestore.state.library.weather).not.toHaveProperty('legacyField')
    expect(mocks.copyPublishedSkillPackageToLibrary).toHaveBeenCalledWith(
      'team-1/bot-1/weather',
      'weather',
    )
    expect(mocks.indexLibrarySkillForSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'weather',
        description: 'Updated weather skill.',
      }),
    )
  })

  it('returns configured library search hits directly from the search index', async () => {
    const firestore = createLibraryFirestoreMock()
    mocks.searchLibrarySkillsWithHybrid.mockResolvedValue({
      configured: true,
      skills: [
        {
          id: 'weather',
          name: 'weather',
          description: 'Search row.',
          iconDomain: 'api.brand.dev',
          networkPolicy: { allowedDomains: ['api.brand.dev'], allowedSchemes: ['https'] },
          searchScore: 0.25,
        },
      ],
    })

    const { searchLibrarySkills } = await import('@/lib/skills-builder')
    const result = await searchLibrarySkills('weather api', firestore)

    expect(result.skills).toEqual([
      expect.objectContaining({
        id: 'weather',
        name: 'weather',
        description: 'Search row.',
        iconDomain: 'api.brand.dev',
        networkPolicy: { allowedDomains: ['api.brand.dev'], allowedSchemes: ['https'] },
        searchScore: 0.25,
      }),
    ])
  })

  it('applies the limit when falling back to Firestore substring search', async () => {
    const firestore = createLibraryFirestoreMock({
      library: {
        weather: {
          name: 'weather',
          description: 'Check weather conditions.',
        },
        weather_alerts: {
          name: 'weather-alerts',
          description: 'Send weather alerts.',
        },
        weather_maps: {
          name: 'weather-maps',
          description: 'Render weather maps.',
        },
      },
    })
    mocks.searchLibrarySkillsWithHybrid.mockResolvedValue({
      configured: false,
      skills: [],
      message: 'Search service unavailable.',
    })

    const { searchLibrarySkills } = await import('@/lib/skills-builder')
    const result = await searchLibrarySkills('weather', firestore, { limit: 2 })

    expect(result.configured).toBe(false)
    expect(result.skills).toHaveLength(2)
    expect(result.skills.map((skill) => skill.id)).toEqual(['weather', 'weather_alerts'])
  })

  it('imports a library skill with a unique local suffix when the slug already exists', async () => {
    const firestore = createLibraryFirestoreMock({
      library: {
        weather: {
          name: 'weather',
          description: 'Use when checking weather.',
          internal: false,
          hasFunctions: false,
          icon: 'BoltIcon',
          r2Prefix: 'library/skills/weather',
          networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
          mode: 'markdown',
          audience: 'customer',
        },
      },
      local: {
        weather: {
          name: 'weather',
          description: 'Existing weather skill.',
          r2Prefix: 'team-1/bot-1/weather',
        },
      },
    })

    const { importLibrarySkillToBot } = await import('@/lib/skills-builder')
    const imported = await importLibrarySkillToBot({
      firestore,
      teamId: 'team-1',
      botId: 'bot-1',
      librarySkillName: 'weather',
    })

    expect(imported.skill.skillName).toBe('weather-2')
    expect(imported.skill.name).toBe('Weather')
    expect(mocks.copyLibrarySkillPackageToDraftAndPublished).toHaveBeenCalledWith(
      'weather',
      'team-1/bot-1/weather-2',
    )
    expect(firestore.state.local['weather-2']).toEqual(
      expect.objectContaining({
        name: 'weather-2',
        displayName: 'Weather',
        description: 'Use when checking weather.',
        r2Prefix: 'team-1/bot-1/weather-2',
        enabled: false,
        enabledWidget: false,
        publishedAt: expect.any(String),
      }),
    )
  })

  it('deletes library Firestore metadata and the library R2 prefix', async () => {
    const firestore = createLibraryFirestoreMock({
      library: {
        weather: {
          name: 'weather',
          r2Prefix: 'library/skills/weather',
        },
      },
    })

    const { deleteLibrarySkill } = await import('@/lib/skills-builder')
    const deleted = await deleteLibrarySkill('weather', firestore)

    expect(mocks.deleteSkillLibraryPackageFromR2).toHaveBeenCalledWith('weather')
    expect(deleted).toEqual({
      deleted: true,
      r2Deleted: 1,
      r2Cleaned: true,
      searchDeleted: true,
      searchCleaned: true,
    })
    expect(firestore.state.library.weather).toBeUndefined()
  })
})
