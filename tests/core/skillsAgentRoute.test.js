import { beforeEach, describe, expect, it, vi } from 'vitest'

let currentDraft

const mocks = vi.hoisted(() => {
  const openai = vi.fn((model) => ({ provider: 'openai', model }))
  openai.tools = {
    webSearch: vi.fn((options) => ({ type: 'web_search', options })),
    shell: vi.fn((options) => ({ type: 'shell', options })),
    applyPatch: vi.fn((options) => ({ type: 'apply_patch', options })),
  }

  return {
    consumeStream: vi.fn(),
    convertToModelMessages: vi.fn(async (messages) => messages),
    hasToolCall: vi.fn((toolName) => ({ type: 'hasToolCall', toolName })),
    streamText: vi.fn(),
    openai,
    createOpenAI: vi.fn(() => openai),
    getTeamWithEncryptedOpenAIKey: vi.fn(),
    decryptKey: vi.fn((k) => k),
    incrementSkillDraftBuilderAgentUsage: vi.fn(),
    getAuthorizedBotContext: vi.fn(),
    openAiErrorMessage: vi.fn(() => null),
    getSkillDraft: vi.fn(),
    getSkillDraftDocRef: vi.fn(),
    buildSkillContextSummary: vi.fn((record) => ({
      skillName: record.skillName,
      fileTree: record.files.map((file) => ({ path: file.path, size: file.content.length })),
    })),
    mergeBundleArtifact: vi.fn((files, artifact) => {
      if (!artifact?.path) return files
      const next = files.filter((file) => file.path !== artifact.path)
      next.push({ path: artifact.path, content: artifact.content })
      return next.sort((a, b) => a.path.localeCompare(b.path))
    }),
    publishSkillDraft: vi.fn(),
    replaceSkillMdFrontmatter: vi.fn((markdown, { name, description }) => {
      const body = String(markdown || '').replace(/^---[\s\S]*?---\s*/, '')
      return `---\nname: ${name}\ndescription: \"${description}\"\n---\n\n${body || '# Skill\n'}`
    }),
    getSkillFileContent: vi.fn(
      (files, path) => files.find((file) => file.path === path)?.content || '',
    ),
    upsertSkillFile: vi.fn((files, nextFile) => {
      const next = files.filter((file) => file.path !== nextFile.path)
      next.push(nextFile)
      return next.sort((a, b) => a.path.localeCompare(b.path))
    }),
    normalizeEnvBindingForStorage: vi.fn((binding, existing = {}) => {
      const optionsSource =
        binding.options !== undefined
          ? binding.options
          : binding.value !== undefined
            ? existing.options
            : existing.options
      const options =
        optionsSource && typeof optionsSource === 'object' && !Array.isArray(optionsSource)
          ? Object.fromEntries(
              Object.entries(optionsSource)
                .map(([value, label]) => [String(value).trim(), String(label || value).trim()])
                .filter(([value]) => value),
            )
          : {}
      const optionValues = new Set(Object.keys(options))
      const hasScalarValue =
        typeof binding.value === 'string' ||
        typeof binding.value === 'number' ||
        typeof binding.value === 'boolean'
      if (binding.value !== undefined && !hasScalarValue) {
        throw new Error(`Env binding ${binding.envVar} value must be a scalar.`)
      }
      const scalar =
        hasScalarValue ? String(binding.value) : existing.value || ''
      if (optionValues.size && hasScalarValue && scalar && !optionValues.has(scalar)) {
        throw new Error(`Env binding ${binding.envVar} value must match one of its option keys.`)
      }
      return {
        envVar: binding.envVar,
        value: scalar,
        ...(optionValues.size ? { options } : {}),
        ...(binding.description
          ? { description: binding.description }
          : existing.description
            ? { description: existing.description }
            : {}),
      }
    }),
    updateSkillDraft: vi.fn(),
    createSkillPatchExecute: vi.fn(),
    createSkillShellExecute: vi.fn(),
    buildSkillSandboxId: vi.fn((teamId, botId, skillName) => `skill:${teamId}:${botId}:${skillName}`),
    SKILLS_SANDBOX_SESSION_ID: 'builder',
    promoteSkillDraftToPublishedCurrent: vi.fn(),
    readSkillDraftPackageFromR2: vi.fn(),
    readPublishedSkillPackageFromR2: vi.fn(),
    canUserManageBotSettings: vi.fn(() => true),
    sanitizeValidationPayload: vi.fn((payload) => payload),
    docRef: {
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined),
    },
    runtimeFetch: vi.fn(),
    responseOptions: null,
    streamArgs: null,
    shellExecute: vi.fn(),
    patchExecute: vi.fn(),
    isSuperAdmin: vi.fn(() => true),
  }
})

vi.mock('ai', () => ({
  consumeStream: mocks.consumeStream,
  convertToModelMessages: mocks.convertToModelMessages,
  hasToolCall: mocks.hasToolCall,
  streamText: mocks.streamText,
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: mocks.openai,
  createOpenAI: mocks.createOpenAI,
}))

vi.mock('@/lib/dbQueries', () => ({
  getTeamWithEncryptedOpenAIKey: mocks.getTeamWithEncryptedOpenAIKey,
}))

vi.mock('@/lib/encryption', () => ({
  decryptKey: mocks.decryptKey,
}))

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: mocks.getAuthorizedBotContext,
}))

vi.mock('@/lib/openai-error-message', () => ({
  openAiErrorMessage: mocks.openAiErrorMessage,
}))

vi.mock('@/lib/skills-builder', () => ({
  GENERATED_BUNDLE_ARTIFACT_PATH: '.docsbot/bundle/index.js',
  buildSkillContextSummary: mocks.buildSkillContextSummary,
  getSkillFileContent: mocks.getSkillFileContent,
  getSkillDraft: mocks.getSkillDraft,
  getSkillDraftDocRef: mocks.getSkillDraftDocRef,
  mergeBundleArtifact: mocks.mergeBundleArtifact,
  publishSkillDraft: mocks.publishSkillDraft,
  replaceSkillMdFrontmatter: mocks.replaceSkillMdFrontmatter,
  sanitizeValidationPayload: mocks.sanitizeValidationPayload,
  upsertSkillFile: mocks.upsertSkillFile,
  normalizeEnvBindingForStorage: mocks.normalizeEnvBindingForStorage,
  updateSkillDraft: mocks.updateSkillDraft,
  incrementSkillDraftBuilderAgentUsage: mocks.incrementSkillDraftBuilderAgentUsage,
}))

vi.mock('@/lib/skills-shell-executor', () => ({
  createSkillShellExecute: mocks.createSkillShellExecute,
}))

vi.mock('@/lib/skills-patch-executor', () => ({
  createSkillPatchExecute: mocks.createSkillPatchExecute,
}))

vi.mock('@/lib/skills-sandbox-client', () => ({
  buildSkillSandboxId: mocks.buildSkillSandboxId,
  SKILLS_SANDBOX_SESSION_ID: mocks.SKILLS_SANDBOX_SESSION_ID,
}))

vi.mock('@/lib/skills-r2-package', () => ({
  promoteSkillDraftToPublishedCurrent: mocks.promoteSkillDraftToPublishedCurrent,
  readSkillDraftPackageFromR2: mocks.readSkillDraftPackageFromR2,
  readPublishedSkillPackageFromR2: mocks.readPublishedSkillPackageFromR2,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserManageBotSettings: mocks.canUserManageBotSettings,
  }
})

vi.mock('@/utils/helpers', () => ({
  isSuperAdmin: mocks.isSuperAdmin,
}))

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createAbortableRequest(url, init = {}) {
  const controller = new AbortController()
  const request = new Request(url, {
    ...init,
    signal: controller.signal,
  })

  return { request, controller }
}

describe('skills agent route', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    process.env.SKILLS_RUNTIME_URL = 'https://skills-runtime.example'
    process.env.SKILLS_RUNTIME_TOKEN = 'runtime-token'

    currentDraft = {
      id: 'customer-refunds',
      draftId: 'customer-refunds',
      skillName: 'customer-refunds',
      name: 'customer-refunds',
      description: 'Use when customers need refund policy help.',
      internal: false,
      enabled: false,
      mode: 'executable',
      audience: 'customer',
      status: 'draft',
      r2Prefix: 'team-1/bot-1/customer-refunds',
      hasFunctions: true,
      files: [
        {
          path: 'SKILL.md',
          content:
            '---\nname: customer-refunds\ndescription: "Use when customers need refund policy help."\n---\n\n# Refunds\n',
        },
      ],
      validation: {
        valid: false,
        hasFunctions: true,
      },
      liveTest: null,
      chatMessages: [],
      lastAuthoringSummary: null,
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
      manifest: {
        name: 'customer-refunds',
        description: 'Use when customers need refund policy help.',
        internal: false,
        enabled: false,
        hasFunctions: true,
        r2Prefix: 'team-1/bot-1/customer-refunds',
        networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
        envBindings: [],
        secretBindings: [],
        metadataBindings: [],
      },
      agent: {
        sandboxId: null,
        sessionId: null,
        lastResponseId: null,
        builderUsageTotals: {
          turns: 7,
          inputTokens: 700,
        },
      },
      publishedAt: null,
    }

    mocks.getAuthorizedBotContext.mockResolvedValue({
      team: { id: 'team-1', roles: { 'user-1': 'owner' } },
      bot: { id: 'bot-1', roles: {} },
      botId: 'bot-1',
      userId: 'user-1',
      firestore: { id: 'firestore' },
    })

    mocks.getSkillDraft.mockImplementation(async () => clone(currentDraft))
    mocks.getSkillDraftDocRef.mockReturnValue(mocks.docRef)
    mocks.createSkillShellExecute.mockReturnValue(mocks.shellExecute)
    mocks.createSkillPatchExecute.mockReturnValue(mocks.patchExecute)
    mocks.promoteSkillDraftToPublishedCurrent.mockResolvedValue({
      configured: true,
      promoted: 2,
      deleted: 0,
    })
    mocks.readSkillDraftPackageFromR2.mockResolvedValue({
      configured: true,
      files: [
        { path: '.docsbot/bundle/index.js', content: 'export default {}\n', truncated: false },
      ],
    })
    mocks.readPublishedSkillPackageFromR2.mockResolvedValue({
      configured: true,
      files: [
        { path: '.docsbot/bundle/index.js', content: 'export default {}\n', truncated: false },
      ],
    })
    mocks.publishSkillDraft.mockImplementation(async ({ hasFunctions }) => {
      currentDraft = {
        ...currentDraft,
        enabled: true,
        hasFunctions,
        publishedAt: '2026-04-18T20:00:00.000Z',
        manifest: {
          ...currentDraft.manifest,
          enabled: true,
          hasFunctions,
        },
      }
      return clone(currentDraft)
    })
    mocks.updateSkillDraft.mockImplementation(async (_teamId, _botId, _skillName, updates) => {
      const nextFiles = updates.files ?? currentDraft.files
      const nextManifest = {
        ...currentDraft.manifest,
        ...(updates.manifest || {}),
      }

      currentDraft = {
        ...currentDraft,
        files: nextFiles,
        mode: updates.mode ?? currentDraft.mode,
        audience: updates.audience ?? currentDraft.audience,
        validation: updates.validation ?? currentDraft.validation,
        liveTest: updates.liveTest ?? currentDraft.liveTest,
        chatMessages: updates.chatMessages ?? currentDraft.chatMessages,
        agent: updates.agent ?? currentDraft.agent,
        lastAuthoringSummary: updates.lastAuthoringSummary ?? currentDraft.lastAuthoringSummary,
        publishedAt:
          updates.publishedAt !== undefined ? updates.publishedAt : currentDraft.publishedAt,
        manifest: nextManifest,
        description: nextManifest.description,
        internal: nextManifest.internal,
        enabled: nextManifest.enabled,
        hasFunctions: nextManifest.hasFunctions,
        r2Prefix: nextManifest.r2Prefix,
        networkPolicy: nextManifest.networkPolicy,
        envBindings: nextManifest.envBindings,
        secretBindings: nextManifest.secretBindings,
        metadataBindings: nextManifest.metadataBindings,
      }

      return clone(currentDraft)
    })
    mocks.getTeamWithEncryptedOpenAIKey.mockResolvedValue({ openAIKey: null })
    mocks.createOpenAI.mockImplementation(() => mocks.openai)

    mocks.streamText.mockImplementation((args) => {
      mocks.streamArgs = args
      void Promise.resolve().then(() =>
        args.onFinish?.({
          totalUsage: {
            inputTokens: 0,
            outputTokens: 0,
            inputTokenDetails: {
              noCacheTokens: 0,
              cacheReadTokens: 0,
              cacheWriteTokens: 0,
            },
            outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
            totalTokens: 0,
          },
          steps: [],
        }),
      )
      return {
        toUIMessageStreamResponse: (options) => {
          mocks.responseOptions = options
          return Response.json({ ok: true })
        },
      }
    })

    global.fetch = mocks.runtimeFetch
  })

  it('allows long builder turns up to the Vercel Pro function maximum', async () => {
    const { maxDuration } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')

    expect(maxDuration).toBe(800)
  })

  it('wires AI SDK shell execution through the Cloudflare sandbox and persists agent state', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    const { request } = createAbortableRequest('https://docsbot.example/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Build the refund skill.' }],
      }),
    })

    const response = await POST(request, {
      params: Promise.resolve({
        teamId: 'team-1',
        botId: 'bot-1',
        id: 'customer-refunds',
      }),
    })

    expect(response.status).toBe(200)
    expect(mocks.buildSkillSandboxId).toHaveBeenCalledWith('team-1', 'bot-1', 'customer-refunds')
    expect(mocks.createSkillShellExecute).toHaveBeenCalledWith({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: request.signal,
      usageAccumulator: { calls: 0, durationMs: 0 },
    })
    expect(mocks.createOpenAI).not.toHaveBeenCalled()
    expect(mocks.openai).toHaveBeenCalledWith('gpt-5.4-mini')
    expect(mocks.openai.tools.webSearch).toHaveBeenCalledWith({
      externalWebAccess: true,
    })
    expect(mocks.openai.tools.shell).toHaveBeenCalledWith({
      execute: mocks.shellExecute,
    })
    expect(mocks.openai.tools.applyPatch).toHaveBeenCalledWith({
      execute: mocks.patchExecute,
    })
    expect(mocks.docRef.set).toHaveBeenCalledWith(
      {
        agent: {
          sandboxId: 'skill:team-1:bot-1:customer-refunds',
          sessionId: 'builder',
          lastResponseId: null,
        },
      },
      { merge: true },
    )

    expect(mocks.streamArgs.abortSignal).toBe(request.signal)
    expect(mocks.streamArgs.providerOptions).toEqual({
      openai: {
        reasoningEffort: 'high',
        reasoningSummary: 'detailed',
        parallelToolCalls: false,
        truncation: 'auto',
      },
    })
    expect(mocks.hasToolCall).toHaveBeenCalledWith('ask_user_questions')
    expect(mocks.hasToolCall).not.toHaveBeenCalledWith('publish_skill_bundle')
    expect(mocks.streamArgs.stopWhen).toEqual([
      { type: 'hasToolCall', toolName: 'ask_user_questions' },
      expect.any(Function),
    ])
    expect(mocks.streamArgs.stopWhen).not.toContainEqual({
      type: 'hasToolCall',
      toolName: 'publish_skill_bundle',
    })
    expect(mocks.streamArgs.stopWhen[1]({ steps: Array.from({ length: 49 }, () => ({})) })).toBe(false)
    expect(
      mocks.streamArgs.stopWhen[1]({
        steps: [
          ...Array.from({ length: 49 }, () => ({})),
          { toolCalls: [{ toolName: 'publish_skill_bundle' }] },
        ],
      }),
    ).toBe(false)
    expect(mocks.streamArgs.stopWhen[1]({ steps: Array.from({ length: 50 }, () => ({})) })).toBe(true)
    const publishFollowupStep = mocks.streamArgs.prepareStep({
      steps: [
        ...Array.from({ length: 49 }, () => ({})),
        { toolCalls: [{ toolName: 'publish_skill_bundle' }] },
      ],
    })
    expect(publishFollowupStep).toEqual(
      expect.objectContaining({
        activeTools: [],
        toolChoice: 'none',
      }),
    )
    expect(publishFollowupStep.system).toContain(
      'You have the publish tool result in context now. Do not call tools.',
    )
    expect(mocks.streamArgs.system).toContain('SKILL.md is the runtime skill file for the finished skill')
    expect(mocks.streamArgs.system).toContain(
      'Use the apply_patch tool for creating, updating, or deleting bundle files under /workspace.',
    )
    expect(mocks.streamArgs.system).toContain(
      'The apply_patch operation.path must be relative to /workspace, for example "scripts/index.ts" or "SKILL.md", not "/workspace/scripts/index.ts".',
    )
    expect(mocks.streamArgs.system).toContain(
      'When building a new skill, start by planning the intended behavior before editing files',
    )
    expect(mocks.streamArgs.system).toContain(
      'If the user\'s request leaves meaningful uncertainty about scope, audience, workflow, authentication method, required fields, data source, or success criteria, call `ask_user_questions` before implementing.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Use `ask_user_questions` when the user must choose a direction, clarify requirements, confirm a plan, or provide non-secret information',
    )
    expect(
      JSON.stringify(mocks.streamArgs.tools.ask_user_questions.inputSchema.toJSONSchema()),
    ).toContain(
      'If you believe one option is clearly best, append \\" (recommended)\\" to that option label and only that option label.',
    )
    expect(mocks.streamArgs.system).toContain(
      'The deployed runtime root for this skill is `/skills/customer-refunds/`.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Only reference markdown or asset files that belong to this skill. Never cross-reference files from other skills.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Any cross-reference you author for the runtime agent should use either a path relative to this skill root or an absolute `/skills/customer-refunds/...` path.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not reference `/.agents/...` paths.',
    )
    expect(mocks.streamArgs.system).toContain(
      '`envBindings` is `{ envVar, value?, options?, description? }` for fixed non-secret deployment config',
    )
    expect(mocks.streamArgs.system).toContain(
      'create a dropdown with scalar `value` plus an optional `options` object',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not put arrays or objects in `value`',
    )
    expect(mocks.streamArgs.system).toContain(
      '`{ "envVar": "DEFAULT_MODEL", "value": "gpt-image-1.5", "options": { "gpt-image-1.5": "GPT Image 1.5", "gpt-image-1": "GPT Image 1", "gpt-image-1-mini": "GPT Image 1 Mini" }, "description": "Default image generation model." }`',
    )
    expect(mocks.streamArgs.system).toContain(
      'Use multiple-choice env bindings only for deployment-scoped choices that stay fixed across skill calls for this bot',
    )
    expect(mocks.streamArgs.system).toContain(
      'Those belong in `defineSkillFunction` input schemas as enum/union fields',
    )
    expect(
      JSON.stringify(mocks.streamArgs.tools.update_manifest.inputSchema.toJSONSchema()),
    ).toContain('Optional public single-select dropdown choices')
    expect(
      JSON.stringify(mocks.streamArgs.tools.update_manifest.inputSchema.toJSONSchema()),
    ).toContain('value` must exactly match one of the option keys')
    expect(mocks.streamArgs.system).toContain(
      '`secretBindings` is `{ envVar, description? }` per credential',
    )
    expect(mocks.streamArgs.system).toContain(
      'call `read_docs` with `auth_overview` and then the specific supported `auth_*` page',
    )
    expect(mocks.streamArgs.system).toContain(
      'For authenticated outbound requests, prefer `authProviders` with provider-scoped `allowedDomains` and `ctx.auth.fetch(...)`.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Use global `networkPolicy.allowedDomains` with built-in `fetch()` only for unauthenticated requests or legacy placeholder-based skills',
    )
    expect(mocks.streamArgs.system).toContain('## Progressive docs index')
    expect(mocks.streamArgs.system).toContain(
      '`auth_basic`: Read for Basic Auth APIs such as WordPress Application Passwords',
    )
    expect(mocks.streamArgs.system).toContain(
      '`auth_aws_sigv4`: Read for AWS APIs or AWS-compatible APIs',
    )
    expect(mocks.streamArgs.system).toContain(
      '`executable_functions`: Read before creating or changing `scripts/**`, `package.json`, or exported `defineSkillFunction` runtime functions.',
    )
    expect(mocks.streamArgs.system).toContain(
      '`artifacts_files`: Read when a function creates a user-viewable or downloadable file',
    )
    expect(
      JSON.stringify(mocks.streamArgs.tools.read_docs.inputSchema.toJSONSchema()),
    ).toContain('executable_functions')
    expect(
      JSON.stringify(mocks.streamArgs.tools.read_docs.inputSchema.toJSONSchema()),
    ).toContain('artifacts_files')
    expect(mocks.streamArgs.system).toContain(
      '`metadataBindings` is `{ envVar, metadataKey, description? }` for each value supplied from the widget embed or chat context',
    )
    expect(mocks.streamArgs.system).toContain(
      'include a short one-sentence `description` in the manifest update so the UI can explain what the value is for.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Use env bindings for non-secret config that stays fixed for this skill bot deployment',
    )
    expect(mocks.streamArgs.system).toContain(
      'Normal env binding placeholders such as `{{SERVICE_HOST}}` may be used in both global `networkPolicy.allowedDomains` and provider `authProviders[].allowedDomains`.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Use placeholder hostnames only when necessary for a portable skill because the hostname is customer-specific or deployment-specific.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not use a placeholder as the entire `fetch` or `new Request` URL',
    )
    expect(mocks.streamArgs.system).toContain(
      'fetch("https://hooks.slack.com/services/{{SLACK_WEBHOOK_PATH}}", ...)',
    )
    expect(mocks.streamArgs.system).toContain(
      'If you need to rename a file, use shell tool.',
    )
    expect(mocks.streamArgs.system).toContain(
      'It validates the current draft files against the remote skill runtime, which is the source of truth for bundle errors.',
    )
    expect(mocks.streamArgs.system).toContain(
      'If `validate_skill_bundle` returns `ok: true` or `validation.valid: true`, treat validation as passed.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not continue troubleshooting validation, import, dependency, or package-install issues from earlier reasoning; proceed to publish if the skill is otherwise ready.',
    )
    expect(mocks.streamArgs.system).toContain(
      '`publish_skill_bundle` is not a stopping or pausing tool.',
    )
    expect(mocks.streamArgs.system).toContain(
      'A successful publish tool result is not a user-facing completion by itself and must not stop the agent.',
    )
    expect(mocks.streamArgs.system).toContain(
      'When you call it, make that call the only action in the step and stop immediately.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Build skills as reusable templates for any team that installs them.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Account-specific non-secret values, including hosts/domains, workspace IDs, tenant IDs, project IDs, channel IDs, regions, and similar identifiers, belong in `envBindings`',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not ask for identifiers just to code them in.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Before creating or changing executable TypeScript functions, call `read_docs` with `doc: "executable_functions"`.',
    )
    expect(mocks.streamArgs.system).toContain(
      'If a function generates a file or downloadable artifact, call `read_docs` with `doc: "artifacts_files"` before writing the implementation.',
    )
    expect(mocks.streamArgs.system).toContain(
      'The Overview section should explain what the skill does, when it should be used, and any important execution context the runtime agent needs.',
    )
    expect(mocks.streamArgs.system).toContain(
      'SKILL.md should describe agent behavior, decision-making, and how the agent should use generated skill functions.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Function outputs must be structured JSON that matches the declared output schema.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Handler argument order is `handler(ctx, input)`; never reverse it.',
    )
    expect(mocks.streamArgs.system).not.toContain('await ctx.artifacts.publish({ filename, contentType, body })')
    expect(mocks.streamArgs.system).not.toContain('input: ExampleTaskInputSchema')
    expect(mocks.streamArgs.system).not.toContain('output: ExampleTaskOutputSchema')
    expect(mocks.streamArgs.system).not.toContain('Put `"zod": "^4.0.0"`')
    expect(mocks.streamArgs.system).not.toContain(
      "If validation says `Function must define 'input' as a Zod schema`",
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not put raw API call instructions, request URLs, HTTP parameter recipes, shell commands, coding steps, or TypeScript implementation tasks into SKILL.md.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not include builder-only instructions in SKILL.md such as how to build the skill, how to use apply_patch or shell, progressive disclosure guidance, validation steps, publish steps, or secret-handling reminders meant for authors.',
    )
    expect(mocks.streamArgs.system).toContain(
      'Do not use web_search to look up DocsBot.ai documentation, this skills builder, or how skills work in this environment.',
    )

    expect(mocks.responseOptions.consumeSseStream).toBe(mocks.consumeStream)
    expect(typeof mocks.responseOptions.messageMetadata).toBe('function')

    expect(mocks.streamArgs.stopWhen[1]({ steps: Array.from({ length: 50 }, () => ({})) })).toBe(true)
    const finishMeta = mocks.responseOptions.messageMetadata({
      part: {
        type: 'finish',
        finishReason: 'stop',
        rawFinishReason: 'stop',
        totalUsage: {
          inputTokens: 100,
          outputTokens: 50,
          inputTokenDetails: {
            noCacheTokens: 80,
            cacheReadTokens: 20,
            cacheWriteTokens: 0,
          },
          outputTokenDetails: { textTokens: 20, reasoningTokens: 30 },
          totalTokens: 150,
        },
      },
    })
    expect(finishMeta?.skillsBuilderAgentUsage?.inputTokens).toBe(100)
    expect(finishMeta?.skillsBuilderAgentUsage?.cachedInputTokens).toBe(20)
    expect(finishMeta?.skillsBuilderAgentUsage?.webSearchCalls).toBe(0)
    expect(finishMeta?.skillsBuilderAgentUsage?.shellCalls).toBe(0)
    expect(finishMeta?.skillsBuilderAgentUsage?.shellDurationMs).toBe(0)
    expect(finishMeta?.skillsBuilderAgentUsage?.openaiModelId).toBe('gpt-5.4-mini')
    expect(finishMeta?.skillsBuilderAgentUsage?.modelSlug).toBe('gpt-5-4-mini')
    expect(finishMeta?.skillsBuilderAgentPaused).toEqual({
      reason: 'step_limit',
      maxSteps: 50,
      message:
        'Paused for safety after many steps. You can tell the builder agent to keep working, and include any direction or corrections you want it to follow.',
    })

    await Promise.resolve()
    expect(mocks.incrementSkillDraftBuilderAgentUsage).toHaveBeenCalledWith(
      mocks.docRef,
      expect.objectContaining({
        openaiModelId: 'gpt-5.4-mini',
        usage: expect.objectContaining({
          openaiModelId: 'gpt-5.4-mini',
          modelSlug: 'gpt-5-4-mini',
        }),
      }),
    )

    await mocks.responseOptions.onFinish({ isAborted: false })
    expect(mocks.docRef.set).toHaveBeenLastCalledWith(
      {
        lastAuthoringSummary: {
          updatedAt: expect.any(String),
          messageCount: 1,
          isAborted: false,
          stepLimitReached: true,
          maxSteps: 50,
        },
        agent: {
          sandboxId: 'skill:team-1:bot-1:customer-refunds',
          sessionId: 'builder',
          lastResponseId: null,
        },
      },
      { merge: true },
    )
  })

  it('uses team OpenAI key with the skills builder model when the team has an encrypted OpenAI key', async () => {
    mocks.getTeamWithEncryptedOpenAIKey.mockResolvedValue({ openAIKey: 'enc:stub' })
    mocks.decryptKey.mockReturnValue('sk-team')

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    const { request } = createAbortableRequest('https://docsbot.example/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Build the refund skill.' }],
      }),
    })

    const response = await POST(request, {
      params: Promise.resolve({
        teamId: 'team-1',
        botId: 'bot-1',
        id: 'customer-refunds',
      }),
    })

    expect(response.status).toBe(200)
    expect(mocks.createOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-team' })
    expect(mocks.openai).toHaveBeenCalledWith('gpt-5.4-mini')

    await Promise.resolve()
    expect(mocks.incrementSkillDraftBuilderAgentUsage).toHaveBeenCalledWith(
      mocks.docRef,
      expect.objectContaining({
        openaiModelId: 'gpt-5.4-mini',
        usage: expect.objectContaining({
          modelSlug: 'gpt-5-4-mini',
          openaiModelId: 'gpt-5.4-mini',
        }),
      }),
    )
  })

  it('does not attach usage metadata for non–super-admins', async () => {
    mocks.isSuperAdmin.mockReturnValue(false)
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    const { request } = createAbortableRequest('https://docsbot.example/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Build the refund skill.' }],
      }),
    })

    await POST(request, {
      params: Promise.resolve({
        teamId: 'team-1',
        botId: 'bot-1',
        id: 'customer-refunds',
      }),
    })

    expect(typeof mocks.responseOptions.messageMetadata).toBe('function')
    expect(mocks.streamArgs.stopWhen[1]({ steps: Array.from({ length: 50 }, () => ({})) })).toBe(true)
    const finishMeta = mocks.responseOptions.messageMetadata({
      part: {
        type: 'finish',
        finishReason: 'stop',
        rawFinishReason: 'stop',
        totalUsage: {
          inputTokens: 100,
          outputTokens: 50,
          inputTokenDetails: {
            noCacheTokens: 80,
            cacheReadTokens: 20,
            cacheWriteTokens: 0,
          },
          outputTokenDetails: { textTokens: 20, reasoningTokens: 30 },
          totalTokens: 150,
        },
      },
    })
    expect(finishMeta).toEqual({
      skillsBuilderAgentPaused: {
        reason: 'step_limit',
        maxSteps: 50,
        message:
          'Paused for safety after many steps. You can tell the builder agent to keep working, and include any direction or corrections you want it to follow.',
      },
    })
    expect(finishMeta?.skillsBuilderAgentUsage).toBeUndefined()
    mocks.isSuperAdmin.mockReturnValue(true)
  })

  it('does not replay interrupted assistant tool calls when converting messages for the next turn', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')

    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
            {
              role: 'assistant',
              parts: [
                {
                  type: 'tool-shell',
                  toolCallId: 'call_interrupted',
                  state: 'input-available',
                  input: {
                    action: {
                      commands: ['cd /workspace && pwd'],
                    },
                  },
                },
              ],
            },
            { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
          ],
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

    expect(mocks.convertToModelMessages).toHaveBeenCalledWith([
      { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
      { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
    ])
  })

  it('starts a fresh OpenAI response from text history without replaying response items', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')

    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
            {
              role: 'assistant',
              parts: [
                {
                  type: 'reasoning',
                  text: 'I inspected the existing files.',
                  providerOptions: {
                    openai: {
                      itemId: 'rs_0c542f6eb81950000069f1223a2d6c81a1876ce6026ce9def1',
                      responseId: 'resp_old',
                      reasoningEncryptedContent: 'encrypted-content',
                    },
                  },
                },
                {
                  type: 'text',
                  text: 'I can continue from the authored files.',
                  providerMetadata: {
                    openai: {
                      itemId: 'msg_old',
                      responseId: 'resp_old',
                    },
                  },
                },
                {
                  type: 'tool-call',
                  toolCallId: 'call_old',
                  toolName: 'load_context',
                  input: {},
                  callProviderMetadata: {
                    openai: {
                      itemId: 'fc_0cdc252d2c8b1f950069f13526c5d081a28a6f187aeae67ddb',
                    },
                  },
                },
              ],
            },
            { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
          ],
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

    expect(mocks.convertToModelMessages).toHaveBeenCalledWith([
      { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'I can continue from the authored files.',
          },
        ],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
    ])
  })

  it('preserves completed ask_user_questions tool outputs when continuing', async () => {
    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    const askPart = {
      type: 'tool-ask_user_questions',
      toolCallId: 'call_questions',
      state: 'output-available',
      input: {
        intro: 'I need one detail.',
        questions: [
          {
            id: 'scope',
            kind: 'multiple_choice',
            prompt: 'Which scope?',
            options: [{ id: 'refunds', label: 'Refunds' }],
          },
        ],
      },
      output: {
        answers: [
          {
            questionId: 'scope',
            kind: 'multiple_choice',
            selectedOptionIds: ['refunds'],
          },
        ],
      },
    }

    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
            {
              role: 'assistant',
              parts: [askPart],
            },
            { role: 'user', parts: [{ type: 'text', text: 'Use refunds.' }] },
          ],
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

    expect(mocks.convertToModelMessages).toHaveBeenCalledWith([
      { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
      {
        role: 'assistant',
        parts: [askPart],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Use refunds.' }] },
    ])
  })

  it('preserves existing env binding values when update_manifest omits value', async () => {
    currentDraft.envBindings = [
      { envVar: 'WORKSPACE_ID', value: 'workspace-keep', description: 'Account scope' },
    ]
    currentDraft.manifest = {
      ...currentDraft.manifest,
      envBindings: currentDraft.envBindings,
    }

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    const result = await mocks.streamArgs.tools.update_manifest.execute({
      name: 'Refund Policy Helper',
      envBindings: [
        { envVar: 'WORKSPACE_ID', description: 'Updated explanation only.' },
        { envVar: 'TENANT_ID', value: 'tenant-new' },
      ],
    })

    const lastCall = mocks.updateSkillDraft.mock.calls.at(-1)
    expect(lastCall[3].manifest.displayName).toBe('Refund Policy Helper')
    expect(lastCall[3].manifest.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-keep',
        description: 'Updated explanation only.',
      },
      { envVar: 'TENANT_ID', value: 'tenant-new' },
    ])
    expect(result.manifest.envBindings).toEqual([
      {
        envVar: 'WORKSPACE_ID',
        value: 'workspace-keep',
        description: 'Updated explanation only.',
      },
      { envVar: 'TENANT_ID', value: 'tenant-new' },
    ])
  })

  it('rejects unsafe or non-env allowed domain values in update_manifest', async () => {
    currentDraft.envBindings = [
      { envVar: 'EXISTING_HOST', value: 'existing.example.com' },
    ]
    currentDraft.manifest = {
      ...currentDraft.manifest,
      envBindings: currentDraft.envBindings,
    }

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['*'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/Wildcard allowed domains are not supported/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['*.example.com'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/Wildcard allowed domains are not supported/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['localhost'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/Local or private hostnames/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['127.0.0.1'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/IP literal allowed domains are not supported/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['https://api.example.com'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/hostnames only/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['{{ SERVICE_HOST }}'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/placeholders must be exactly one env binding placeholder/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        networkPolicy: { allowedDomains: ['{{SERVICE_HOST}}'], allowedSchemes: ['https'] },
      }),
    ).rejects.toThrow(/SERVICE_HOST is not declared in envBindings/)

    await expect(
      mocks.streamArgs.tools.update_manifest.execute({
        authProviders: [
          {
            id: 'service',
            type: 'headerAuth',
            description: 'Adds service auth.',
            headers: [{ name: 'Authorization', valueTemplate: 'Bearer {{SERVICE_TOKEN}}' }],
            allowedDomains: ['*.example.com'],
          },
        ],
        secretBindings: [{ envVar: 'SERVICE_TOKEN' }],
      }),
    ).rejects.toThrow(/Wildcard allowed domains are not supported/)

    const result = await mocks.streamArgs.tools.update_manifest.execute({
      envBindings: [
        { envVar: 'EXISTING_HOST', value: 'existing.example.com' },
        { envVar: 'SERVICE_HOST', value: 'api.example.com' },
      ],
      networkPolicy: { allowedDomains: ['{{SERVICE_HOST}}'], allowedSchemes: ['https'] },
      authProviders: [
        {
          id: 'service',
          type: 'headerAuth',
          description: 'Adds service auth.',
          headers: [{ name: 'Authorization', valueTemplate: 'Bearer {{SERVICE_TOKEN}}' }],
          allowedDomains: ['{{SERVICE_HOST}}'],
        },
      ],
      secretBindings: [{ envVar: 'SERVICE_TOKEN' }],
    })

    expect(result.manifest.networkPolicy.allowedDomains).toEqual(['{{SERVICE_HOST}}'])
    expect(result.manifest.authProviders[0].allowedDomains).toEqual(['{{SERVICE_HOST}}'])
    expect(result.warnings).toEqual([
      expect.stringContaining('prefer the auth provider scoped allowedDomains'),
    ])

    const partialResult = await mocks.streamArgs.tools.update_manifest.execute({
      envBindings: [{ envVar: 'OTHER_VALUE', value: 'other' }],
      networkPolicy: { allowedDomains: ['{{EXISTING_HOST}}'], allowedSchemes: ['https'] },
    })
    expect(partialResult.manifest.networkPolicy.allowedDomains).toEqual(['{{EXISTING_HOST}}'])
    expect(partialResult.warnings).toEqual([])

    const authProviderPartialResult = await mocks.streamArgs.tools.update_manifest.execute({
      envBindings: [
        { envVar: 'OTHER_VALUE', value: 'other' },
        { envVar: 'AUTH_SERVICE_HOST', value: 'auth.example.com' },
      ],
      authProviders: [
        {
          id: 'existing-service',
          type: 'headerAuth',
          description: 'Adds service auth for an existing host binding.',
          headers: [{ name: 'Authorization', valueTemplate: 'Bearer {{SERVICE_TOKEN}}' }],
          allowedDomains: ['{{AUTH_SERVICE_HOST}}'],
        },
      ],
      secretBindings: [{ envVar: 'SERVICE_TOKEN' }],
    })
    expect(authProviderPartialResult.manifest.authProviders[0].allowedDomains).toEqual([
      '{{AUTH_SERVICE_HOST}}',
    ])
  })

  it('stores multiple-choice env bindings as scalar value plus options map', async () => {
    currentDraft.envBindings = [
      { envVar: 'REGION', value: 'eu-west-1', description: 'Current region' },
    ]
    currentDraft.manifest = {
      ...currentDraft.manifest,
      envBindings: currentDraft.envBindings,
    }

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    const result = await mocks.streamArgs.tools.update_manifest.execute({
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
    })

    expect(result.manifest.envBindings).toEqual([
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

  it('validates the current R2-backed draft and lets the runtime persist the bundle artifact', async () => {
    currentDraft.files = [
      { path: '.docsbot/bundle/index.js', content: 'stale generated bundle\n' },
      ...currentDraft.files,
    ]
    mocks.runtimeFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          valid: true,
          hasFunctions: true,
          warnings: [],
          errors: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    const result = await mocks.streamArgs.tools.validate_skill_bundle.execute({})

    expect(mocks.runtimeFetch).toHaveBeenCalledWith(
      'https://skills-runtime.example/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer runtime-token',
          'Content-Type': 'application/json',
        }),
      }),
    )
    const validateBody = JSON.parse(mocks.runtimeFetch.mock.calls[0][1].body)
    expect(validateBody.manifest).toEqual({
      networkPolicy: { allowedDomains: [], allowedSchemes: ['https'] },
      envBindings: [],
      secretBindings: [],
      metadataBindings: [],
      authProviders: [],
    })
    expect(validateBody.r2Prefix).toBe('team-1/bot-1/customer-refunds')
    expect(validateBody.files.map((file) => file.path)).toEqual(['SKILL.md'])
    expect(mocks.updateSkillDraft).toHaveBeenCalledWith(
      'team-1',
      'bot-1',
      'customer-refunds',
      expect.objectContaining({
        manifest: { hasFunctions: true },
        validation: expect.objectContaining({ valid: true, hasFunctions: true }),
      }),
      { id: 'firestore' },
    )
    expect(result).toEqual({
      ok: true,
      validation: expect.objectContaining({ valid: true, hasFunctions: true }),
      fileTree: ['.docsbot/bundle/index.js', 'SKILL.md'],
    })
  })

  it('publishes by promoting the draft prefix and updating Firestore metadata', async () => {
    mocks.runtimeFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          valid: true,
          hasFunctions: true,
          warnings: [],
          errors: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    const result = await mocks.streamArgs.tools.publish_skill_bundle.execute({})

    expect(mocks.promoteSkillDraftToPublishedCurrent).toHaveBeenCalledWith(
      'team-1/bot-1/customer-refunds',
    )
    expect(mocks.publishSkillDraft).toHaveBeenCalledWith(
      {
        teamId: 'team-1',
        botId: 'bot-1',
        skillName: 'customer-refunds',
        userId: 'user-1',
        hasFunctions: true,
      },
      { id: 'firestore' },
    )
    expect(result).toEqual({
      ok: true,
      publishedAt: '2026-04-18T20:00:00.000Z',
      skill: {
        skillName: 'customer-refunds',
        fileTree: currentDraft.files.map((file) => ({ path: file.path, size: file.content.length })),
      },
      result: {
        valid: true,
        uploaded: true,
        promoted: 2,
        deleted: 0,
      },
    })
  })

  it('publishes executable skills when validation does not return a bundle artifact', async () => {
    mocks.runtimeFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          valid: true,
          hasFunctions: true,
          warnings: [],
          errors: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { POST } = await import('@/app/api/teams/[teamId]/bots/[botId]/skills/[id]/agent/route')
    await POST(
      new Request('https://docsbot.example/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
      {
        params: Promise.resolve({
          teamId: 'team-1',
          botId: 'bot-1',
          id: 'customer-refunds',
        }),
      },
    )

    const result = await mocks.streamArgs.tools.publish_skill_bundle.execute({})

    expect(result).toEqual({
      ok: true,
      publishedAt: '2026-04-18T20:00:00.000Z',
      skill: {
        skillName: 'customer-refunds',
        fileTree: currentDraft.files.map((file) => ({ path: file.path, size: file.content.length })),
      },
      result: {
        valid: true,
        uploaded: true,
        promoted: 2,
        deleted: 0,
      },
    })
    expect(mocks.readSkillDraftPackageFromR2).not.toHaveBeenCalled()
    expect(mocks.readPublishedSkillPackageFromR2).not.toHaveBeenCalled()
    expect(mocks.promoteSkillDraftToPublishedCurrent).toHaveBeenCalledWith(
      'team-1/bot-1/customer-refunds',
    )
    expect(mocks.publishSkillDraft).toHaveBeenCalledWith(
      {
        teamId: 'team-1',
        botId: 'bot-1',
        skillName: 'customer-refunds',
        userId: 'user-1',
        hasFunctions: true,
      },
      { id: 'firestore' },
    )
  })
})
