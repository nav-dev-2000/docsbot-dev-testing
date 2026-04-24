import { FieldValue, getFirestore } from 'firebase-admin/firestore'

import { configureFirebaseApp } from '@/config/firebase-server.config'
import {
  DEFAULT_CUSTOM_BUTTON_ICON,
  normalizeWhitelistedHeroIcon,
} from '@/constants/heroIcons.constants'
import { decryptKey, encryptKey } from '@/lib/encryption'
import { normalizeSkillName } from '@/lib/skill-name-normalize'
import { readSkillDraftPackageFromR2, writeSkillDraftFilesToR2 } from '@/lib/skills-r2-package'

export const SKILL_MODE_MARKDOWN = 'markdown'
export const SKILL_MODE_EXECUTABLE = 'executable'
export const SKILL_AUDIENCE_INTERNAL = 'internal'
export const SKILL_AUDIENCE_CUSTOMER = 'customer'
export const GENERATED_BUNDLE_ARTIFACT_PATH = '.docsbot/bundle/index.js'
/** Stored on each skill Firestore doc for future builder/runtime compatibility. */
export const SKILL_SCHEMA_VERSION = 1

export const SKILL_ALLOWED_PATHS = [
  /^SKILL\.md$/,
  /^package\.json$/,
  /^\.docsbot\/bundle\/index\.js$/,
  /^scripts\/.+$/,
  /^references\/.+$/,
  /^assets\/.+$/,
]

export { normalizeSkillName }

function defaultR2Prefix(teamId, botId, skillName) {
  return `${teamId}/${botId}/${skillName}`
}

export function isAllowedSkillPath(path) {
  return SKILL_ALLOWED_PATHS.some((pattern) => pattern.test(path || ''))
}

export function sortSkillFiles(files = []) {
  return [...files].sort((a, b) => a.path.localeCompare(b.path))
}

export function filterSupportedSkillFiles(files = []) {
  return files.filter((file) => isAllowedSkillPath(file?.path))
}

export function upsertSkillFile(files = [], nextFile) {
  if (!nextFile?.path || !isAllowedSkillPath(nextFile.path)) {
    throw new Error('Invalid skill file path.')
  }

  const withoutCurrent = files.filter((file) => file.path !== nextFile.path)
  return sortSkillFiles([
    ...withoutCurrent,
    {
      path: nextFile.path,
      content: String(nextFile.content ?? ''),
    },
  ])
}

export function removeSkillFile(files = [], path) {
  return sortSkillFiles(files.filter((file) => file.path !== path))
}

export function getSkillFile(files = [], path) {
  return files.find((file) => file.path === path) || null
}

export function getSkillFileContent(files = [], path) {
  return getSkillFile(files, path)?.content || ''
}

export function summarizeSkillResources(files = []) {
  return files.reduce(
    (summary, file) => {
      if (file.path.startsWith('references/')) summary.references += 1
      else if (file.path.startsWith('assets/')) summary.assets += 1
      else if (
        file.path === 'scripts/index.ts' ||
        (file.path.startsWith('scripts/') && file.path.endsWith('.ts'))
      ) {
        summary.scripts += 1
      }
      return summary
    },
    { references: 0, assets: 0, scripts: 0 },
  )
}

export function extractSkillFrontmatter(markdown = '') {
  const match = String(markdown).match(/^---\n([\s\S]*?)\n---/)
  if (!match) {
    return { name: null, description: null }
  }

  const raw = match[1]
  const result = { name: null, description: null }

  raw.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) return
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (key === 'name') result.name = value
    if (key === 'description') result.description = value
  })

  return result
}

function formatSkillDescriptionYamlScalar(text) {
  const s = String(text || '').trim()
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
}

export function replaceSkillMdFrontmatter(markdown, { name, description }) {
  const desc =
    String(description || '').trim() ||
    'DocsBot skill bundle being edited in the skills builder.'
  const quotedDesc = formatSkillDescriptionYamlScalar(desc)
  const fm = `---\nname: ${name}\ndescription: ${quotedDesc}\n---`
  const str = String(markdown || '').trim()
  if (!str) {
    return `${fm}\n\n# ${name}\n`
  }
  const match = str.match(/^---\n[\s\S]*?\n---\s*/)
  if (match) {
    return fm + str.slice(match[0].length)
  }
  return `${fm}\n\n${str}`
}

export function normalizeSkillFilesForOpenAiContainer(files, skillName, manifestDescription) {
  const desc =
    String(manifestDescription || '').trim() ||
    'DocsBot skill bundle being edited in the skills builder.'
  const skillMd = getSkillFileContent(files, 'SKILL.md')
  const merged = replaceSkillMdFrontmatter(skillMd, { name: skillName, description: desc })
  return upsertSkillFile(files, { path: 'SKILL.md', content: merged })
}

export function createSkillMarkdownTemplate(skillName, audience, mode, options = {}) {
  const displayAudience =
    audience === SKILL_AUDIENCE_INTERNAL ? 'internal-only' : 'customer-facing'
  const workflowLine =
    mode === SKILL_MODE_EXECUTABLE
      ? 'Call typed functions from `scripts/index.ts` instead of writing ad hoc API logic.'
      : 'Read and follow the markdown guidance first, then consult references only as needed.'

  const customDesc =
    typeof options.description === 'string' && options.description.trim()
      ? options.description.trim()
      : null
  const descriptionYaml = customDesc
    ? formatSkillDescriptionYamlScalar(customDesc)
    : `Use when the user needs help with ${skillName.replace(/-/g, ' ')} tasks.`

  return `---
name: ${skillName}
description: ${descriptionYaml}
---

# ${skillName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')}

## Overview

This is a ${displayAudience} DocsBot skill.

## Workflow

1. Read this file first.
2. Consult references/*.md only when deeper context is needed.
3. ${workflowLine}

## Constraints

- Do not expose secrets in bundle files.
- Keep instructions concise and operational.
- Prefer progressive disclosure over large inline reference blocks.
`
}

export function createScriptsIndexTemplate() {
  return `import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const ExampleSkillFunctionInput = z.object({
  query: z.string().describe("The main phrase, identifier, or request the function needs."),
});

const ExampleSkillFunctionOutput = z.object({
  summary: z
    .string()
    .describe("A concise JSON field the runtime agent can use directly when filtering or chaining function results."),
});

type ExampleSkillFunctionInput = z.infer<typeof ExampleSkillFunctionInput>;
type ExampleSkillFunctionOutput = z.infer<typeof ExampleSkillFunctionOutput>;

async function runExampleSkillFunction(
  _ctx: SkillContext,
  args: ExampleSkillFunctionInput,
): Promise<ExampleSkillFunctionOutput> {
  return {
    summary: \`Replace this example with real logic for: \${args.query}\`,
  };
}

export const exampleSkillFunction = defineSkillFunction({
  description: "Explain when the runtime agent should call this function, keep the input/output surface intentionally minimal, and ensure the function returns structured JSON only.",
  input: ExampleSkillFunctionInput,
  output: ExampleSkillFunctionOutput,
  handler: runExampleSkillFunction,
});
`
}

export function createExecutablePackageJsonTemplate(skillName = 'docsbot-skill') {
  return JSON.stringify(
    {
      name: skillName,
      private: true,
      type: 'module',
      dependencies: {
        zod: '^4.0.0',
      },
    },
    null,
    2,
  ) + '\n'
}

export function inferSkillModeFromFiles(files = []) {
  return files.some((file) => file.path === 'scripts/index.ts')
    ? SKILL_MODE_EXECUTABLE
    : SKILL_MODE_MARKDOWN
}

export function createInitialSkillFiles({ skillName, mode, audience = SKILL_AUDIENCE_INTERNAL }) {
  const files = [
    {
      path: 'SKILL.md',
      content: createSkillMarkdownTemplate(skillName, audience, mode),
    },
  ]

  if (mode === SKILL_MODE_EXECUTABLE) {
    files.push({
      path: 'scripts/index.ts',
      content: createScriptsIndexTemplate(),
    })
    files.push({
      path: 'package.json',
      content: createExecutablePackageJsonTemplate(skillName),
    })
  }

  return sortSkillFiles(files)
}

export function mergeBundleArtifact(files = [], bundleArtifact) {
  if (bundleArtifact?.content == null) {
    return sortSkillFiles(files)
  }

  return upsertSkillFile(files, {
    path: bundleArtifact.path || GENERATED_BUNDLE_ARTIFACT_PATH,
    content: bundleArtifact.content,
  })
}

export function sanitizeValidationPayload(validation) {
  if (!validation || typeof validation !== 'object') {
    return validation || null
  }

  const next = { ...validation }

  if (Array.isArray(next.functions)) {
    next.functions = next.functions
      .map((fn) => {
        if (!fn || typeof fn !== 'object') return null
        const name = String(fn.name || '').trim()
        const description = String(fn.description || '').trim()
        const inputDefinition = String(fn.inputDefinition || '').trim()
        if (!name) return null
        return {
          name,
          description,
          ...(inputDefinition ? { inputDefinition } : {}),
        }
      })
      .filter(Boolean)
  }

  if (next.bundleArtifact && typeof next.bundleArtifact === 'object') {
    next.bundleArtifact = {
      content: String(next.bundleArtifact.content ?? ''),
    }
  }

  if (Array.isArray(next.errorDetails)) {
    next.errorDetails = next.errorDetails.map((detail) => {
      if (!detail || typeof detail !== 'object') return detail
      const { artifactPath, ...rest } = detail
      void artifactPath
      return rest
    })
  }

  return next
}

export function buildSkillManifest({
  teamId,
  botId,
  skillName,
  description = '',
  audience = SKILL_AUDIENCE_INTERNAL,
  enabled = false,
  enabledWidget = false,
  hasFunctions = false,
  icon,
}) {
  return {
    name: skillName,
    description,
    internal: audience === SKILL_AUDIENCE_INTERNAL,
    enabled,
    enabledWidget,
    hasFunctions,
    icon: normalizeWhitelistedHeroIcon(icon, DEFAULT_CUSTOM_BUTTON_ICON),
    r2Prefix: defaultR2Prefix(teamId, botId, skillName),
    networkPolicy: {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    envBindings: [],
    secretBindings: [],
    metadataBindings: [],
  }
}

export function createSkillDraftRecord({
  teamId,
  botId,
  skillName,
  audience = SKILL_AUDIENCE_INTERNAL,
  mode = SKILL_MODE_MARKDOWN,
}) {
  const files = createInitialSkillFiles({ skillName, mode, audience })
  const frontmatter = extractSkillFrontmatter(getSkillFileContent(files, 'SKILL.md'))
  const inferredMode = inferSkillModeFromFiles(files)
  const hasFunctions = inferredMode === SKILL_MODE_EXECUTABLE

  return {
    manifest: buildSkillManifest({
      teamId,
      botId,
      skillName,
      description:
        frontmatter.description ||
        `Use when the user needs help with ${skillName.replace(/-/g, ' ')} tasks.`,
      audience,
      enabled: false,
      hasFunctions,
    }),
    mode: inferredMode,
    audience,
    files,
    validation: null,
    liveTest: null,
    chatMessages: [],
    lastAuthoringSummary: null,
    agent: {
      sandboxId: null,
      sessionId: null,
      lastResponseId: null,
    },
  }
}

export function serializeTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) return value.toJSON()
  if (typeof value?.toDate === 'function') return value.toDate().toJSON()
  return value
}

export function safeSkillString(value, fallback = '') {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function normalizeBindingDescription(value) {
  const description = safeSkillString(value).trim()
  return description || undefined
}

export function decryptSkillSecretStoredValue(stored) {
  if (stored == null || stored === '') return ''
  const s = String(stored)
  if (!s.startsWith('enc:')) return s
  try {
    return decryptKey(s.slice(4))
  } catch {
    return ''
  }
}

export function mapSecretBindingsForClient(bindings) {
  if (!Array.isArray(bindings)) return []
  return bindings.map((binding) => ({
    envVar: safeSkillString(binding.envVar),
    secret: decryptSkillSecretStoredValue(binding.secret),
    ...(normalizeBindingDescription(binding.description)
      ? { description: normalizeBindingDescription(binding.description) }
      : {}),
  }))
}

export function skillRecordWithDecryptedSecretBindings(record) {
  if (!record) return null
  const secretBindings = mapSecretBindingsForClient(record.secretBindings)
  return {
    ...record,
    secretBindings,
    manifest: {
      ...record.manifest,
      secretBindings,
    },
  }
}

function deriveMode(data, files) {
  if (Array.isArray(files) && files.length > 0) {
    return inferSkillModeFromFiles(files)
  }
  if (data?.mode === SKILL_MODE_EXECUTABLE) return SKILL_MODE_EXECUTABLE
  return SKILL_MODE_MARKDOWN
}

export function serializeSkillRecord(id, data = {}, files = []) {
  if (!data) return null

  const safeFiles = listDraftFiles(files || [])
  const inferredMode = deriveMode(data, safeFiles)
  const name = safeSkillString(data.name, id)
  const description = safeSkillString(data.description)
  const manifest = {
    name,
    description,
    internal: Boolean(data.internal),
    enabled: Boolean(data.enabled),
    enabledWidget: Boolean(data.enabledWidget),
    hasFunctions:
      data.hasFunctions !== undefined
        ? Boolean(data.hasFunctions)
        : inferredMode === SKILL_MODE_EXECUTABLE,
    icon: normalizeWhitelistedHeroIcon(data.icon, DEFAULT_CUSTOM_BUTTON_ICON),
    r2Prefix: safeSkillString(data.r2Prefix),
    networkPolicy: data.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    envBindings: data.envBindings || [],
    secretBindings: data.secretBindings || [],
    metadataBindings: data.metadataBindings || [],
  }

  return {
    id,
    draftId: id,
    skillName: name,
    name,
    description,
    icon: manifest.icon,
    internal: Boolean(data.internal),
    enabled: Boolean(data.enabled),
    enabledWidget: Boolean(data.enabledWidget),
    mode: inferredMode,
    audience:
      data.audience === SKILL_AUDIENCE_CUSTOMER || data.audience === SKILL_AUDIENCE_INTERNAL
        ? data.audience
        : SKILL_AUDIENCE_INTERNAL,
    status: safeSkillString(data.status, 'draft'),
    r2Prefix: safeSkillString(data.r2Prefix),
    hasFunctions: manifest.hasFunctions,
    files: safeFiles,
    validation: data.validation || null,
    liveTest: data.liveTest || null,
    chatMessages: data.chatMessages || [],
    lastAuthoringSummary: data.lastAuthoringSummary || null,
    networkPolicy: manifest.networkPolicy,
    envBindings: manifest.envBindings,
    secretBindings: manifest.secretBindings,
    metadataBindings: manifest.metadataBindings,
    manifest,
    agent: data.agent || {
      sandboxId: null,
      sessionId: null,
      lastResponseId: null,
    },
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    publishedAt: serializeTimestamp(data.publishedAt),
  }
}

export function skillListItemFromRecord(record) {
  return {
    name: record.name,
    description: record.description,
    mode: record.mode,
    internal: record.internal,
    enabled: record.enabled,
    updatedAt: record.updatedAt,
  }
}

export function buildSkillContextSummary(record) {
  const files = filterSupportedSkillFiles(record.files || [])

  return {
    skillName: record.name,
    mode: record.mode,
    audience: record.audience,
    manifest: {
      name: record.name,
      description: record.description,
      internal: record.internal,
      enabled: record.enabled,
      enabledWidget: record.enabledWidget,
      hasFunctions: record.hasFunctions,
      icon: record.icon,
      r2Prefix: record.r2Prefix,
      networkPolicy: record.networkPolicy,
      envBindings: record.envBindings,
      secretBindings: record.secretBindings,
      metadataBindings: record.metadataBindings,
    },
    fileTree: files.map((file) => ({
      path: file.path,
      size: file.content.length,
    })),
    validation: record.validation,
    liveTest: record.liveTest,
    resourceSummary: summarizeSkillResources(files),
  }
}

export function getSkillCollection(firestore, teamId, botId) {
  return firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('skills')
}

function getBuilderFirestore(firestore) {
  if (firestore) return firestore
  configureFirebaseApp()
  return getFirestore()
}

async function loadDraftFilesFromR2(record, teamId, botId, skillName) {
  const prefix = record?.r2Prefix || record?.manifest?.r2Prefix || defaultR2Prefix(teamId, botId, skillName)
  const pkg = await readSkillDraftPackageFromR2(prefix)
  if (!pkg?.configured) return []
  return listDraftFiles(pkg.files.filter((file) => !file.truncated))
}

export async function getSkillDraft(teamId, botId, skillName, firestore, options = {}) {
  const db = getBuilderFirestore(firestore)
  const snapshot = await getSkillCollection(db, teamId, botId).doc(skillName).get()

  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data() || {}
  const files = options.includeFiles === false
    ? []
    : await loadDraftFilesFromR2(data, teamId, botId, skillName)
  return serializeSkillRecord(snapshot.id, data, files)
}

const SKILL_DOC_ID_MAX_LENGTH = 64
const SKILL_DOC_ID_MIN_LENGTH = 3
const SKILL_DOC_ID_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

export async function allocateUniqueSkillName(teamId, botId, baseSkillName, firestore) {
  const base = String(baseSkillName || '').trim()
  if (!base) {
    throw new Error('Skill name is required.')
  }

  const db = getBuilderFirestore(firestore)
  const collection = getSkillCollection(db, teamId, botId)

  const nameTaken = async (name) => {
    const snap = await collection.doc(name).get()
    return snap.exists
  }

  const candidateForAttempt = (attempt) => {
    const suffix = attempt <= 1 ? '' : `-${attempt}`
    const maxBaseLen = SKILL_DOC_ID_MAX_LENGTH - suffix.length
    if (maxBaseLen < SKILL_DOC_ID_MIN_LENGTH) {
      return null
    }
    let trimmedBase = base.length <= maxBaseLen ? base : base.slice(0, maxBaseLen)
    trimmedBase = trimmedBase.replace(/-+$/, '')
    if (trimmedBase.length < SKILL_DOC_ID_MIN_LENGTH) {
      return null
    }
    const candidate = `${trimmedBase}${suffix}`
    if (
      candidate.length > SKILL_DOC_ID_MAX_LENGTH ||
      candidate.length < SKILL_DOC_ID_MIN_LENGTH ||
      !SKILL_DOC_ID_SLUG_REGEX.test(candidate)
    ) {
      return null
    }
    return candidate
  }

  const maxAttempts = 5000
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = candidateForAttempt(attempt)
    if (!candidate) {
      continue
    }
    if (!(await nameTaken(candidate))) {
      return candidate
    }
  }

  throw new Error(
    'Could not find an available skill name. Remove or rename an existing skill and try again.',
  )
}

export async function ensureSkillDraft({
  firestore,
  teamId,
  botId,
  skillName,
  audience = SKILL_AUDIENCE_CUSTOMER,
  mode = SKILL_MODE_MARKDOWN,
}) {
  const db = getBuilderFirestore(firestore)
  const collection = getSkillCollection(db, teamId, botId)
  const docRef = collection.doc(skillName)
  const snapshot = await docRef.get()

  if (snapshot.exists) {
    return getSkillDraft(teamId, botId, skillName, db)
  }

  const record = createSkillDraftRecord({
    teamId,
    botId,
    skillName,
    audience,
    mode,
  })

  await writeSkillDraftFilesToR2(record.manifest.r2Prefix, record.files)

  await docRef.set({
    ...record.manifest,
    version: SKILL_SCHEMA_VERSION,
    mode: record.mode,
    audience: record.audience,
    status: 'draft',
    validation: record.validation,
    liveTest: record.liveTest,
    chatMessages: record.chatMessages,
    lastAuthoringSummary: record.lastAuthoringSummary,
    agent: record.agent,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const created = await docRef.get()
  return serializeSkillRecord(created.id, created.data(), record.files)
}

export function listDraftFiles(files = {}) {
  if (Array.isArray(files)) {
    return sortSkillFiles(filterSupportedSkillFiles(files))
  }

  return sortSkillFiles(
    filterSupportedSkillFiles(
    Object.entries(files || {}).map(([path, content]) => ({
      path,
      content: String(content ?? ''),
    })),
    ),
  )
}

export function filesArrayToObject(files = []) {
  return sortSkillFiles(files).reduce((acc, file) => {
    acc[file.path] = String(file.content ?? '')
    return acc
  }, {})
}

export function getSkillDraftDocRef(teamId, botId, skillName, firestore) {
  const db = getBuilderFirestore(firestore)
  return getSkillCollection(db, teamId, botId).doc(skillName)
}

/**
 * @param {import('firebase-admin/firestore').DocumentReference} docRef
 * @param {{ openaiModelId: string, usage: Record<string, unknown> }} params
 */
export async function incrementSkillDraftBuilderAgentUsage(docRef, { openaiModelId, usage }) {
  const inc = (n) => FieldValue.increment(Number(n) || 0)
  await docRef.update({
    'agent.lastBuilderOpenaiModel': openaiModelId,
    'agent.lastBuilderModelSlug': usage.modelSlug,
    'agent.builderUsageTotals.turns': inc(1),
    'agent.builderUsageTotals.estimatedCostUsd': inc(usage.estimatedCostUsd),
    'agent.builderUsageTotals.estimatedTokenCostUsd': inc(usage.estimatedTokenCostUsd),
    'agent.builderUsageTotals.estimatedWebSearchCostUsd': inc(usage.estimatedWebSearchCostUsd),
    'agent.builderUsageTotals.estimatedCfShellCostUsd': inc(usage.estimatedCfShellCostUsd),
    'agent.builderUsageTotals.inputTokens': inc(usage.inputTokens),
    'agent.builderUsageTotals.outputTokens': inc(usage.outputTokens),
    'agent.builderUsageTotals.webSearchCalls': inc(usage.webSearchCalls),
    'agent.builderUsageTotals.shellCalls': inc(usage.shellCalls),
    'agent.builderUsageTotals.shellDurationMs': inc(usage.shellDurationMs),
  })
}

export async function updateSkillDraft(teamId, botId, skillName, updates = {}, firestore) {
  const db = getBuilderFirestore(firestore)
  const docRef = getSkillDraftDocRef(teamId, botId, skillName, db)
  const currentSnapshot = await docRef.get()

  if (!currentSnapshot.exists) {
    throw new Error('Skill draft not found.')
  }

  const current = await getSkillDraft(teamId, botId, skillName, db)
  const nextManifest = {
    name: current.name,
    description: current.description,
    internal: current.internal,
    enabled: current.enabled,
    enabledWidget: current.enabledWidget,
    hasFunctions: current.hasFunctions,
    icon: normalizeWhitelistedHeroIcon(current.icon, DEFAULT_CUSTOM_BUTTON_ICON),
    r2Prefix: current.r2Prefix || defaultR2Prefix(teamId, botId, skillName),
    networkPolicy: current.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    envBindings: current.envBindings || [],
    secretBindings: current.secretBindings || [],
    metadataBindings: current.metadataBindings || [],
    ...(updates.manifest || {}),
  }

  nextManifest.icon = normalizeWhitelistedHeroIcon(nextManifest.icon, DEFAULT_CUSTOM_BUTTON_ICON)

  if (Array.isArray(nextManifest.secretBindings)) {
    nextManifest.secretBindings = nextManifest.secretBindings.map((binding) => ({
      envVar: binding.envVar,
      secret:
        binding.secret && !String(binding.secret).startsWith('enc:')
          ? `enc:${encryptKey(binding.secret)}`
          : binding.secret,
      ...(normalizeBindingDescription(binding.description)
        ? { description: normalizeBindingDescription(binding.description) }
        : {}),
    }))
  }

  const nextFiles = updates.files
    ? listDraftFiles(
        Array.isArray(updates.files)
          ? updates.files
          : Object.entries(updates.files).map(([path, content]) => ({ path, content })),
      )
    : current.files

  const nextMode = updates.mode || inferSkillModeFromFiles(nextFiles)

  if (updates.manifest?.hasFunctions === undefined) {
    nextManifest.hasFunctions = nextMode === SKILL_MODE_EXECUTABLE
  }

  nextManifest.name = safeSkillString(nextManifest.name, current.name)
  nextManifest.description = safeSkillString(nextManifest.description)
  nextManifest.r2Prefix = safeSkillString(
    nextManifest.r2Prefix,
    defaultR2Prefix(teamId, botId, skillName),
  )

  if (updates.files !== undefined) {
    await writeSkillDraftFilesToR2(nextManifest.r2Prefix, nextFiles)
  }

  await docRef.set(
    {
      name: nextManifest.name,
      description: nextManifest.description,
      internal: Boolean(nextManifest.internal),
      enabled: Boolean(nextManifest.enabled),
      enabledWidget: Boolean(nextManifest.enabledWidget),
      hasFunctions: Boolean(nextManifest.hasFunctions),
      icon: nextManifest.icon,
      r2Prefix: nextManifest.r2Prefix,
      networkPolicy: nextManifest.networkPolicy,
      envBindings: nextManifest.envBindings,
      secretBindings: nextManifest.secretBindings,
      metadataBindings: nextManifest.metadataBindings,
      mode: nextMode,
      audience: updates.audience || current.audience,
      validation: updates.validation ?? current.validation,
      liveTest: updates.liveTest ?? current.liveTest,
      chatMessages: updates.chatMessages ?? current.chatMessages,
      agent: updates.agent ?? current.agent ?? null,
      lastAuthoringSummary: updates.lastAuthoringSummary ?? current.lastAuthoringSummary,
      publishedAt:
        updates.publishedAt !== undefined ? updates.publishedAt : current.publishedAt || null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  const updatedSnapshot = await docRef.get()
  const files = updates.files !== undefined ? nextFiles : current.files
  return serializeSkillRecord(updatedSnapshot.id, updatedSnapshot.data(), files)
}

export async function listSkillDrafts(teamId, botId, firestore) {
  const db = getBuilderFirestore(firestore)
  const snapshot = await getSkillCollection(db, teamId, botId).orderBy('updatedAt', 'desc').get()
  return snapshot.docs.map((doc) => serializeSkillRecord(doc.id, doc.data(), []))
}

export async function deleteSkillDraft(teamId, botId, skillName, firestore) {
  const db = getBuilderFirestore(firestore)
  const docRef = getSkillDraftDocRef(teamId, botId, skillName, db)
  const snapshot = await docRef.get()

  if (!snapshot.exists) {
    return { deleted: false, r2Prefix: null }
  }

  const data = snapshot.data() || {}
  const r2Prefix =
    typeof data.r2Prefix === 'string' && data.r2Prefix.trim()
      ? data.r2Prefix.trim()
      : defaultR2Prefix(teamId, botId, skillName)

  await docRef.delete()
  return { deleted: true, r2Prefix }
}

export async function markSkillDraftValidation(teamId, botId, skillName, validation, firestore) {
  return updateSkillDraft(teamId, botId, skillName, { validation }, firestore)
}

export async function publishSkillDraft({ teamId, botId, skillName, hasFunctions }, firestore) {
  return updateSkillDraft(
    teamId,
    botId,
    skillName,
    {
      manifest: {
        enabled: true,
        ...(hasFunctions !== undefined ? { hasFunctions } : {}),
      },
      publishedAt: new Date(),
    },
    firestore,
  )
}

export async function runSkillRemoteTest({ draft }) {
  return draft?.validation || null
}

export const serializeDraft = serializeSkillRecord
