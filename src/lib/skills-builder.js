import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import OpenAI from 'openai'

import { configureFirebaseApp } from '@/config/firebase-server.config'
import {
  DEFAULT_CUSTOM_BUTTON_ICON,
  normalizeWhitelistedHeroIcon,
} from '@/constants/heroIcons.constants'
import { decryptKey, encryptKey } from '@/lib/encryption'
import { formatSkillNameDisplay, normalizeSkillName } from '@/lib/skill-name-normalize'
import {
  copyLibrarySkillPackageToDraftAndPublished,
  copyPublishedSkillPackageToLibrary,
  deleteSkillLibraryPackageFromR2,
  getSkillLibraryR2RootPrefix,
  readSkillDraftPackageFromR2,
  writeSkillDraftFilesToR2,
} from '@/lib/skills-r2-package'
import {
  deleteLibrarySkillFromSearch,
  indexLibrarySkillForSearch,
  searchLibrarySkillsWithHybrid,
} from '@/lib/skills-library-search'

export const SKILL_MODE_MARKDOWN = 'markdown'
export const SKILL_MODE_EXECUTABLE = 'executable'
export const SKILL_AUDIENCE_INTERNAL = 'internal'
export const SKILL_AUDIENCE_CUSTOMER = 'customer'
export const SKILL_CATEGORY_DEFAULT = 'Default'
export const SKILL_CATEGORIES = [
  SKILL_CATEGORY_DEFAULT,
  'Accounting & Finance',
  'Analytics & BI',
  'Application Development',
  'Automation',
  'Cloud Storage',
  'Communications',
  'Customer Support',
  'Data Management',
  'E-Commerce',
  'Education & Training',
  'Email',
  'Events & Scheduling',
  'HR & Recruiting',
  'Identity & Access',
  'Incident Management',
  'Knowledge Management',
  'Legal & Compliance',
  'Marketing',
  'Payments & Billing',
  'Productivity',
  'Project Management',
  'Sales',
  'Security & Verification',
  'Subscriptions',
  'Surveys & Feedback',
  'Voice & Video',
]
export const SKILL_CATEGORY_CLASSIFIER_MODEL = 'gpt-5.4-nano'
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

  if (Array.isArray(next.errorDetails)) {
    next.errorDetails = next.errorDetails.map((detail) => {
      if (!detail || typeof detail !== 'object') return detail
      const { artifactPath, ...rest } = detail
      void artifactPath
      return rest
    })
  }

  const errors = Array.isArray(next.errors) ? next.errors : []
  const details = Array.isArray(next.errorDetails) ? next.errorDetails : []
  const hasInvalidZodContract =
    details.some((detail) => detail?.code === 'invalid_input' || detail?.code === 'invalid_output') ||
    errors.some(
      (error) =>
        typeof error === 'string' &&
        (error.includes("Function must define 'input' as a Zod schema") ||
          error.includes("Function must define 'output' as a Zod schema")),
    )

  if (hasInvalidZodContract) {
    const hint =
      "Fix the defineSkillFunction({...}) object first. This error means the value passed as input or output was not a runtime Zod schema object. Pass named schema constants directly, for example input: ExampleTaskInputSchema and output: ExampleTaskOutputSchema; do not diagnose it as a package import visibility issue unless validation also reports an import or bundling error."
    const existingHints = Array.isArray(next.hints) ? next.hints.filter(Boolean) : []
    next.hints = existingHints.includes(hint) ? existingHints : [...existingHints, hint]
  }

  return next
}

export function buildSkillManifest({
  teamId,
  botId,
  skillName,
  displayName,
  description = '',
  audience = SKILL_AUDIENCE_INTERNAL,
  category = SKILL_CATEGORY_DEFAULT,
  enabled = false,
  enabledWidget = false,
  hasFunctions = false,
  icon,
}) {
  return {
    name: skillName,
    displayName: safeSkillString(displayName, formatSkillNameDisplay(skillName, skillName)),
    description,
    category: normalizeSkillCategory(category),
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
    authProviders: [],
  }
}

export function createSkillDraftRecord({
  teamId,
  botId,
  skillName,
  displayName,
  audience = SKILL_AUDIENCE_INTERNAL,
  category = SKILL_CATEGORY_DEFAULT,
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
      displayName,
      description:
        frontmatter.description ||
        `Use when the user needs help with ${skillName.replace(/-/g, ' ')} tasks.`,
      audience,
      category,
      enabled: false,
      hasFunctions,
    }),
    mode: inferredMode,
    audience,
    category: normalizeSkillCategory(category),
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

export function normalizeSkillCategory(value, fallback = SKILL_CATEGORY_DEFAULT) {
  const category = safeSkillString(value).trim()
  return SKILL_CATEGORIES.includes(category) ? category : fallback
}

export function hasValidSkillCategory(value) {
  return SKILL_CATEGORIES.includes(safeSkillString(value).trim())
}

function isRedactedPlaceholder(value) {
  const s = safeSkillString(value).trim()
  return s === '**REDACTED**' || s.replace(/\*/g, '').trim().toUpperCase() === 'REDACTED'
}

export function resolveSkillDisplayName(id, data = {}) {
  const explicit = safeSkillString(data.displayName).trim()
  if (explicit) return explicit

  const legacyName = safeSkillString(data.name).trim()
  if (legacyName && legacyName !== id && normalizeSkillName(legacyName) !== legacyName) {
    return legacyName
  }

  return formatSkillNameDisplay(id, id)
}

function normalizeBindingDescription(value) {
  const description = safeSkillString(value).trim()
  return description || undefined
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeEnvBindingOptions(value) {
  const options = {}

  if (isPlainObject(value)) {
    for (const [key, option] of Object.entries(value)) {
      const valueFromKey = safeSkillString(key).trim()
      if (!valueFromKey) continue
      const label = safeSkillString(option, valueFromKey).trim()
      options[valueFromKey] = label || valueFromKey
    }
  }

  return options
}

export function normalizeEnvBindingForStorage(binding = {}, existing = {}) {
  const envVar = safeSkillString(binding.envVar).trim()
  const hasScalarValue =
    typeof binding.value === 'string' ||
    typeof binding.value === 'number' ||
    typeof binding.value === 'boolean'
  if (binding.value !== undefined && !hasScalarValue) {
    const error = new Error(`Env binding ${envVar || 'value'} value must be a scalar.`)
    error.status = 400
    throw error
  }
  const optionsSource =
    binding.options !== undefined
      ? binding.options
      : hasScalarValue
        ? existing.options
        : existing.options
  const options = normalizeEnvBindingOptions(optionsSource)
  const optionValues = new Set(Object.keys(options))
  const existingValue = safeSkillString(existing.value).trim()
  const incomingValue = hasScalarValue ? safeSkillString(binding.value).trim() : ''
  const shouldUseIncomingValue =
    hasScalarValue && !isRedactedPlaceholder(incomingValue) && !existingValue
  let value = shouldUseIncomingValue ? incomingValue : existingValue

  if (optionValues.size) {
    if (shouldUseIncomingValue && value && !optionValues.has(value)) {
      const error = new Error(
        `Env binding ${envVar} value must match one of its option keys.`,
      )
      error.status = 400
      throw error
    }

    if (!hasScalarValue && value && !optionValues.has(value)) {
      value = Object.keys(options)[0]
    }
  }

  return {
    envVar,
    value,
    ...(optionValues.size ? { options } : {}),
    ...(normalizeBindingDescription(binding.description)
      ? { description: normalizeBindingDescription(binding.description) }
      : normalizeBindingDescription(existing.description)
        ? { description: normalizeBindingDescription(existing.description) }
        : {}),
  }
}

export function decryptSkillSecretStoredValue(stored) {
  if (stored == null || stored === '') return ''
  const s = String(stored)
  try {
    return decryptKey(s)
  } catch {
    return ''
  }
}

/** Encrypt plaintext secrets for storage; leave values that already decrypt with our key unchanged. */
function normalizeSecretBindingSecretForStorage(secret, existingSecret = '') {
  const existing = safeSkillString(existingSecret).trim()
  if (existing) return existing
  if (secret == null || secret === '' || isRedactedPlaceholder(secret)) return ''
  const s = String(secret)
  try {
    decryptKey(s)
    return s
  } catch {
    return encryptKey(s)
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
  const skillName = safeSkillString(data.skillName, id)
  const displayName = resolveSkillDisplayName(skillName, data)
  const description = safeSkillString(data.description)
  const manifest = {
    name: skillName,
    displayName,
    description,
    category: normalizeSkillCategory(data.category),
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
    authProviders: data.authProviders || [],
    envBindings: data.envBindings || [],
    secretBindings: data.secretBindings || [],
    metadataBindings: data.metadataBindings || [],
    authProviders: data.authProviders || [],
  }

  return {
    id,
    draftId: id,
    skillName,
    name: displayName,
    displayName,
    description,
    category: manifest.category,
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
    authProviders: manifest.authProviders,
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
    id: record.id,
    draftId: record.draftId,
    skillName: record.skillName,
    name: record.name,
    displayName: record.displayName,
    description: record.description,
    category: record.category,
    mode: record.mode,
    internal: record.internal,
    enabled: record.enabled,
    updatedAt: record.updatedAt,
    icon: record.icon,
    networkPolicy: record.networkPolicy,
    envBindings: record.envBindings,
    authProviders: record.authProviders,
  }
}

function maskSecretBindingsForAgent(bindings) {
  if (!Array.isArray(bindings)) return []
  return bindings.map((binding) => ({
    envVar: safeSkillString(binding.envVar),
    secret: binding.secret ? '**REDACTED**' : '',
    ...(normalizeBindingDescription(binding.description)
      ? { description: normalizeBindingDescription(binding.description) }
      : {}),
  }))
}

function maskEnvBindingsForAgent(bindings) {
  if (!Array.isArray(bindings)) return []
  return bindings.map((binding) => ({
    envVar: safeSkillString(binding.envVar),
    value: binding.value ? '**REDACTED**' : '',
    ...(normalizeBindingDescription(binding.description)
      ? { description: normalizeBindingDescription(binding.description) }
      : {}),
  }))
}

export function buildSkillContextSummary(record) {
  const files = filterSupportedSkillFiles(record.files || [])
  const envBindings = maskEnvBindingsForAgent(record.envBindings)
  const secretBindings = maskSecretBindingsForAgent(record.secretBindings)

  return {
    skillName: record.skillName,
    name: record.name,
    displayName: record.displayName,
    mode: record.mode,
    audience: record.audience,
    category: record.category,
    manifest: {
      name: record.skillName,
      displayName: record.displayName,
      description: record.description,
      category: record.category,
      internal: record.internal,
      enabled: record.enabled,
      enabledWidget: record.enabledWidget,
      hasFunctions: record.hasFunctions,
      icon: record.icon,
      r2Prefix: record.r2Prefix,
      networkPolicy: record.networkPolicy,
      envBindings,
      secretBindings,
      metadataBindings: record.metadataBindings,
      authProviders: record.authProviders,
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

export function getSkillsLibraryCollection(firestore) {
  return firestore.collection('skills')
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
  displayName,
  audience = SKILL_AUDIENCE_CUSTOMER,
  category = SKILL_CATEGORY_DEFAULT,
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
    displayName,
    audience,
    category,
    mode,
  })

  await writeSkillDraftFilesToR2(record.manifest.r2Prefix, record.files)

  await docRef.set({
    ...record.manifest,
    version: SKILL_SCHEMA_VERSION,
    mode: record.mode,
    audience: record.audience,
    category: record.category,
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

export function serializeLibrarySkillRecord(id, data = {}) {
  if (!data) return null
  const name = resolveSkillDisplayName(id, data)
  const mode = data.mode === SKILL_MODE_EXECUTABLE ? SKILL_MODE_EXECUTABLE : SKILL_MODE_MARKDOWN
  return {
    id,
    name,
    displayName: name,
    skillName: id,
    description: safeSkillString(data.description),
    category: normalizeSkillCategory(data.category),
    icon: normalizeWhitelistedHeroIcon(data.icon, DEFAULT_CUSTOM_BUTTON_ICON),
    internal: Boolean(data.internal),
    enabled: Boolean(data.enabled),
    enabledWidget: Boolean(data.enabledWidget),
    mode,
    audience:
      data.audience === SKILL_AUDIENCE_CUSTOMER || data.audience === SKILL_AUDIENCE_INTERNAL
        ? data.audience
        : Boolean(data.internal)
          ? SKILL_AUDIENCE_INTERNAL
          : SKILL_AUDIENCE_CUSTOMER,
    hasFunctions:
      data.hasFunctions !== undefined ? Boolean(data.hasFunctions) : mode === SKILL_MODE_EXECUTABLE,
    r2Prefix: safeSkillString(data.r2Prefix, getSkillLibraryR2RootPrefix(id)),
    networkPolicy: data.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    source: data.source || null,
    createdBy: safeSkillString(data.createdBy),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  }
}

function libraryDocFromSkillDraft(draft, { teamId, botId, skillName, userId }) {
  const librarySkillName = safeSkillString(draft.skillName, skillName)
  return {
    name: draft.name,
    displayName: draft.name,
    description: safeSkillString(draft.description),
    category: normalizeSkillCategory(draft.category),
    internal: Boolean(draft.internal),
    enabled: Boolean(draft.enabled),
    enabledWidget: Boolean(draft.enabledWidget),
    hasFunctions: Boolean(draft.hasFunctions),
    icon: normalizeWhitelistedHeroIcon(draft.icon, DEFAULT_CUSTOM_BUTTON_ICON),
    r2Prefix: getSkillLibraryR2RootPrefix(librarySkillName),
    networkPolicy: draft.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    authProviders: draft.authProviders || [],
    mode: draft.mode === SKILL_MODE_EXECUTABLE ? SKILL_MODE_EXECUTABLE : SKILL_MODE_MARKDOWN,
    audience:
      draft.audience === SKILL_AUDIENCE_CUSTOMER || draft.audience === SKILL_AUDIENCE_INTERNAL
        ? draft.audience
        : draft.internal
          ? SKILL_AUDIENCE_INTERNAL
          : SKILL_AUDIENCE_CUSTOMER,
    status: 'published',
    version: SKILL_SCHEMA_VERSION,
    source: {
      teamId,
      botId,
      skillName,
      r2Prefix: draft.r2Prefix || defaultR2Prefix(teamId, botId, skillName),
      publishedAt: draft.publishedAt || null,
    },
    createdBy: userId,
  }
}

function skillCategoryClassificationInput(draft = {}) {
  return {
    name: safeSkillString(draft.name || draft.displayName),
    slug: safeSkillString(draft.skillName || draft.id),
    description: safeSkillString(draft.description),
    mode: safeSkillString(draft.mode),
    audience: safeSkillString(draft.audience),
    integrationDomains: Array.isArray(draft.networkPolicy?.allowedDomains)
      ? draft.networkPolicy.allowedDomains.filter(Boolean).map(String)
      : [],
    authProviders: Array.isArray(draft.authProviders)
      ? draft.authProviders
          .map((provider) => ({
            id: safeSkillString(provider?.id),
            type: safeSkillString(provider?.type),
            domains: Array.isArray(provider?.allowedDomains)
              ? provider.allowedDomains.filter(Boolean).map(String)
              : [],
          }))
          .filter((provider) => provider.id || provider.type || provider.domains.length > 0)
      : [],
  }
}

const SKILL_CATEGORY_JSON_SCHEMA = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: SKILL_CATEGORIES,
      description: 'The single best broad DocsBot skill category.',
    },
  },
  required: ['category'],
  additionalProperties: false,
}

async function classifySkillCategoryWithOpenAi(draft) {
  if (!process.env.OPENAI_API_KEY) return SKILL_CATEGORY_DEFAULT

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await openai.responses.create({
      model: SKILL_CATEGORY_CLASSIFIER_MODEL,
      store: false,
      instructions:
        'Classify the DocsBot skill into exactly one broad category. Prefer business-process categories over narrow vendor or channel labels. Return only JSON matching the schema.',
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(skillCategoryClassificationInput(draft)),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'skill_category_classification',
          strict: true,
          schema: SKILL_CATEGORY_JSON_SCHEMA,
        },
      },
      max_output_tokens: 200,
    })

    const parsed = JSON.parse(response.output_text || '{}')
    return normalizeSkillCategory(parsed.category)
  } catch (error) {
    console.warn('skills category classification failed:', error)
    return SKILL_CATEGORY_DEFAULT
  }
}

async function resolveLibrarySkillCategory(draft) {
  if (
    hasValidSkillCategory(draft?.category) &&
    normalizeSkillCategory(draft.category) !== SKILL_CATEGORY_DEFAULT
  ) {
    return normalizeSkillCategory(draft.category)
  }
  return classifySkillCategoryWithOpenAi(draft)
}

export async function listLibrarySkills(firestore) {
  const db = getBuilderFirestore(firestore)
  const snapshot = await getSkillsLibraryCollection(db).orderBy('updatedAt', 'desc').get()
  return snapshot.docs.map((doc) => serializeLibrarySkillRecord(doc.id, doc.data()))
}

export async function searchLibrarySkills(query, firestore, options = {}) {
  const searchResult = await searchLibrarySkillsWithHybrid(query, options)
  if (searchResult.configured) {
    return searchResult
  }

  const q = String(query || '').trim().toLowerCase()
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50)
  const skills = await listLibrarySkills(firestore)
  const filtered = q
    ? skills.filter((skill) =>
        [skill.id, skill.name, skill.description, skill.category]
          .map((value) => String(value || '').toLowerCase())
          .join(' ')
          .includes(q),
      )
    : skills

  return {
    ...searchResult,
    skills: filtered.slice(0, limit),
  }
}

export async function getLibrarySkill(librarySkillName, firestore) {
  const db = getBuilderFirestore(firestore)
  const snapshot = await getSkillsLibraryCollection(db).doc(librarySkillName).get()
  if (!snapshot.exists) return null
  return serializeLibrarySkillRecord(snapshot.id, snapshot.data())
}

export async function promoteSkillDraftToLibrary({
  firestore,
  teamId,
  botId,
  skillName,
  userId,
}) {
  const db = getBuilderFirestore(firestore)
  const draft = await getSkillDraft(teamId, botId, skillName, db, { includeFiles: false })
  if (!draft) {
    throw new Error('Skill draft not found.')
  }

  const librarySkillName = safeSkillString(draft.skillName, skillName)
  const sourceRootPrefix = draft.r2Prefix || defaultR2Prefix(teamId, botId, skillName)
  const copyResult = await copyPublishedSkillPackageToLibrary(sourceRootPrefix, librarySkillName)
  if (!copyResult.configured) {
    const error = new Error(copyResult.message || 'Skills R2 storage is not configured.')
    error.status = 500
    throw error
  }
  if ((copyResult.copied || 0) === 0) {
    const error = new Error('Publish this skill before adding it to the library.')
    error.status = 400
    throw error
  }

  const collection = getSkillsLibraryCollection(db)
  const docRef = collection.doc(librarySkillName)
  const existing = await docRef.get()
  const category = await resolveLibrarySkillCategory(draft)
  const record = libraryDocFromSkillDraft(
    { ...draft, category },
    { teamId, botId, skillName, userId },
  )
  await docRef.set({
    ...record,
    createdAt: existing.exists
      ? existing.data()?.createdAt || FieldValue.serverTimestamp()
      : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const saved = await docRef.get()
  const skill = serializeLibrarySkillRecord(saved.id, saved.data())
  const searchIndex = await indexLibrarySkillForSearch(skill)
  return {
    skill,
    result: copyResult,
    searchIndex,
  }
}

export async function importLibrarySkillToBot({
  firestore,
  teamId,
  botId,
  librarySkillName,
}) {
  const db = getBuilderFirestore(firestore)
  const libraryRef = getSkillsLibraryCollection(db).doc(librarySkillName)
  const librarySnapshot = await libraryRef.get()
  if (!librarySnapshot.exists) {
    const error = new Error('Library skill not found.')
    error.status = 404
    throw error
  }

  const librarySkill = serializeLibrarySkillRecord(librarySnapshot.id, librarySnapshot.data())
  const localSkillName = await allocateUniqueSkillName(teamId, botId, librarySkill.skillName, db)
  const localR2Prefix = defaultR2Prefix(teamId, botId, localSkillName)
  const copyResult = await copyLibrarySkillPackageToDraftAndPublished(librarySkill.skillName, localR2Prefix)
  if (!copyResult.configured) {
    const error = new Error(copyResult.message || 'Skills R2 storage is not configured.')
    error.status = 500
    throw error
  }
  if ((copyResult.draftCopied || 0) === 0 || (copyResult.publishedCopied || 0) === 0) {
    const error = new Error('Library skill package is missing.')
    error.status = 404
    throw error
  }

  const docRef = getSkillDraftDocRef(teamId, botId, localSkillName, db)
  await docRef.set({
    name: localSkillName,
    displayName: librarySkill.name,
    description: librarySkill.description,
    category: librarySkill.category,
    internal: Boolean(librarySkill.internal),
    enabled: false,
    enabledWidget: false,
    hasFunctions: Boolean(librarySkill.hasFunctions),
    icon: librarySkill.icon,
    r2Prefix: localR2Prefix,
    networkPolicy: librarySkill.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    envBindings: [],
    secretBindings: [],
    metadataBindings: [],
    authProviders: librarySkill.authProviders || [],
    version: SKILL_SCHEMA_VERSION,
    mode: librarySkill.mode,
    audience: librarySkill.audience,
    status: 'draft',
    validation: null,
    liveTest: null,
    chatMessages: [],
    lastAuthoringSummary: null,
    agent: {
      sandboxId: null,
      sessionId: null,
      lastResponseId: null,
    },
    importedFromLibrary: {
      skillName: librarySkill.skillName,
      importedAt: FieldValue.serverTimestamp(),
    },
    publishedAt: new Date(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const created = await getSkillDraft(teamId, botId, localSkillName, db, { includeFiles: false })
  return {
    skill: created,
    librarySkill,
    result: copyResult,
  }
}

export async function deleteLibrarySkill(librarySkillName, firestore) {
  const db = getBuilderFirestore(firestore)
  const docRef = getSkillsLibraryCollection(db).doc(librarySkillName)
  const snapshot = await docRef.get()
  if (!snapshot.exists) {
    return {
      deleted: false,
      r2Deleted: 0,
      r2Cleaned: true,
    }
  }

  const r2Result = await deleteSkillLibraryPackageFromR2(librarySkillName)
  const searchResult = await deleteLibrarySkillFromSearch(librarySkillName)
  await docRef.delete()
  return {
    deleted: true,
    r2Deleted: r2Result.deleted ?? 0,
    r2Cleaned: Boolean(r2Result.configured),
    searchDeleted: Boolean(searchResult.deleted),
    searchCleaned: Boolean(searchResult.configured),
  }
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
    'agent.builderUsageTotals.cachedInputTokens': inc(usage.cachedInputTokens),
    'agent.builderUsageTotals.cacheWriteTokens': inc(usage.cacheWriteTokens),
    'agent.builderUsageTotals.outputTokens': inc(usage.outputTokens),
    'agent.builderUsageTotals.reasoningTokens': inc(usage.reasoningTokens),
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
    name: current.skillName,
    displayName: current.displayName,
    description: current.description,
    internal: current.internal,
    enabled: current.enabled,
    enabledWidget: current.enabledWidget,
    hasFunctions: current.hasFunctions,
    category: current.category,
    icon: normalizeWhitelistedHeroIcon(current.icon, DEFAULT_CUSTOM_BUTTON_ICON),
    r2Prefix: current.r2Prefix || defaultR2Prefix(teamId, botId, skillName),
    networkPolicy: current.networkPolicy || {
      allowedDomains: [],
      allowedSchemes: ['https'],
    },
    envBindings: current.envBindings || [],
    secretBindings: current.secretBindings || [],
    metadataBindings: current.metadataBindings || [],
    authProviders: current.authProviders || [],
    ...(updates.manifest || {}),
  }

  nextManifest.icon = normalizeWhitelistedHeroIcon(nextManifest.icon, DEFAULT_CUSTOM_BUTTON_ICON)

  if (Array.isArray(nextManifest.secretBindings)) {
    const currentSecretByName = new Map(
      (current.secretBindings || []).map((binding) => [binding.envVar, binding]),
    )
    nextManifest.secretBindings = nextManifest.secretBindings.map((binding) => ({
      envVar: binding.envVar,
      secret: normalizeSecretBindingSecretForStorage(
        binding.secret,
        currentSecretByName.get(binding.envVar)?.secret,
      ),
      ...(normalizeBindingDescription(binding.description)
        ? { description: normalizeBindingDescription(binding.description) }
        : normalizeBindingDescription(currentSecretByName.get(binding.envVar)?.description)
          ? { description: normalizeBindingDescription(currentSecretByName.get(binding.envVar).description) }
          : {}),
    }))
  }

  if (Array.isArray(nextManifest.envBindings)) {
    const currentEnvByName = new Map(
      (current.envBindings || []).map((binding) => [binding.envVar, binding]),
    )
    nextManifest.envBindings = nextManifest.envBindings.map((binding) =>
      normalizeEnvBindingForStorage(binding, currentEnvByName.get(binding.envVar) || {}),
    )
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

  nextManifest.name = safeSkillString(nextManifest.name, current.skillName)
  nextManifest.displayName = safeSkillString(
    nextManifest.displayName,
    current.displayName || formatSkillNameDisplay(skillName, skillName),
  )
  nextManifest.description = safeSkillString(nextManifest.description)
  nextManifest.category = normalizeSkillCategory(nextManifest.category)
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
      displayName: nextManifest.displayName,
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
      authProviders: nextManifest.authProviders,
      mode: nextMode,
      audience: updates.audience || current.audience,
      category: normalizeSkillCategory(updates.category, nextManifest.category),
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

  if (updates.validation !== undefined) {
    await docRef.update({
      validation: updates.validation,
    })
  }

  const updatedSnapshot = await docRef.get()
  const files = updates.files !== undefined ? nextFiles : current.files
  return serializeSkillRecord(updatedSnapshot.id, updatedSnapshot.data(), files)
}

export async function listSkillDrafts(teamId, botId, firestore) {
  const db = getBuilderFirestore(firestore)
  const snapshot = await getSkillCollection(db, teamId, botId).orderBy('updatedAt', 'desc').get()
  return snapshot.docs.map((doc) => serializeSkillRecord(doc.id, doc.data(), []))
}

const SKILL_DRAFT_SUMMARY_FIELDS = [
  'name',
  'displayName',
  'description',
  'category',
  'internal',
  'enabled',
  'enabledWidget',
  'mode',
  'audience',
  'hasFunctions',
  'icon',
  'r2Prefix',
  'networkPolicy',
  'envBindings',
  'secretBindings',
  'metadataBindings',
  'authProviders',
  'createdAt',
  'updatedAt',
  'publishedAt',
]

export async function listSkillDraftSummaries(teamId, botId, firestore) {
  const db = getBuilderFirestore(firestore)
  const query = getSkillCollection(db, teamId, botId)
    .orderBy('updatedAt', 'desc')
    .select(...SKILL_DRAFT_SUMMARY_FIELDS)
  const snapshot = await query.get()
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
