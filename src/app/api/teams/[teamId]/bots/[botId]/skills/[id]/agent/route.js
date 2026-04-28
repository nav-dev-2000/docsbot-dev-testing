import { NextResponse } from 'next/server'
import { consumeStream, convertToModelMessages, hasToolCall, streamText } from 'ai'
import { createOpenAI, openai as openaiProviderDefault } from '@ai-sdk/openai'
import { z } from 'zod'
import embeddableWidgetDocs from '@/pages/documentation/developer/embeddable-chat-widget.md?raw'
import chatAgentDocs from '@/pages/documentation/developer/chat-agent.md?raw'

import { getAuthorizedBotContext } from '@/lib/appRouteAuth'
import { openAiErrorMessage } from '@/lib/openai-error-message'
import { getTeamWithEncryptedOpenAIKey } from '@/lib/dbQueries'
import { decryptKey } from '@/lib/encryption'
import {
  buildSkillContextSummary,
  getSkillFileContent,
  getSkillDraft,
  getSkillDraftDocRef,
  incrementSkillDraftBuilderAgentUsage,
  mergeBundleArtifact,
  publishSkillDraft,
  replaceSkillMdFrontmatter,
  sanitizeValidationPayload,
  upsertSkillFile,
  updateSkillDraft,
} from '@/lib/skills-builder'
import { recoverInterruptedToolCalls } from '@/lib/skills-builder-chat-recovery'
import { createSkillPatchExecute } from '@/lib/skills-patch-executor'
import { createSkillShellExecute } from '@/lib/skills-shell-executor'
import {
  buildSkillSandboxId,
  SKILLS_SANDBOX_SESSION_ID,
} from '@/lib/skills-sandbox-client'
import { promoteSkillDraftToPublishedCurrent } from '@/lib/skills-r2-package'
import {
  buildSkillsBuilderAgentUsageMetadata,
  countWebSearchToolCallsInSteps,
  isWebSearchToolCallPart,
  SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL,
} from '@/lib/skills-agent-usage'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

const WORKSPACE_ROOT = '/workspace'
const BUILDER_AGENT_MAX_STEPS = 50
const BUILDER_AGENT_STEP_LIMIT_PAUSE_MESSAGE =
  'Paused for safety after many steps. You can tell the builder agent to keep working, and include any direction or corrections you want it to follow.'
const GENERATED_BUNDLE_ARTIFACT_PATH = '.docsbot/bundle/index.js'
const GENERATED_COMPILED_ARTIFACT_PATH = '.docsbot/compiled/index.js'
const DOC_CONTENT_BY_KEY = {
  widget: {
    path: 'src/pages/documentation/developer/embeddable-chat-widget.md',
    content: embeddableWidgetDocs,
  },
  chat_apis: {
    path: 'src/pages/documentation/developer/chat-agent.md',
    content: chatAgentDocs,
  },
}
export const maxDuration = 300

const loadContextInputSchema = z
  .object({})
  .describe(
    'No parameters. Load the latest skill draft context from the server, including manifest, file tree, validation state, and live test state.',
  )

const updateManifestInputSchema = z
  .object({
    description: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Human-readable summary of what the skill does and when it should be used. Keep aligned with SKILL.md frontmatter description.',
      ),
    internal: z
      .boolean()
      .optional()
      .describe(
        'If true, the skill is intended for internal operators only; otherwise treat it as customer-facing.',
      ),
    networkPolicy: z
      .object({
        allowedDomains: z.array(z.string()).optional(),
        allowedSchemes: z.array(z.string()).optional().default(['https']),
      })
      .optional()
      .describe('Outbound policy for the deployed skill runtime.'),
    envBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          value: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe(
              'Non-secret value for this env var. Omit to keep the previously saved value for this key when only updating descriptions or shuffling the list.',
            ),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this environment value is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Static non-secret env vars to expose to runtime code and placeholder substitution. The model may optionally prefill a short one-sentence description for each binding.',
      ),
    metadataBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          metadataKey: z.string().trim().min(1),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this metadata value is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Metadata bindings to expose dynamic, per-user/session scoped values to runtime code. The model may optionally prefill a short one-sentence description for each binding.',
      ),
    secretBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this secret is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Secret-backed env var names required by the skill. These are exposed as {{ENV_VAR_NAME}} placeholders in outbound URLs and headers to be replaced with the actual secret values at runtime via proxy.',
      ),
  })
  .describe(
    'Partial manifest update. Include only keys you are changing. Omitted keys keep their previous values.',
  )

const askUserChoiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
})

const askUserMultipleChoiceQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  kind: z.literal('multiple_choice'),
  options: z.array(askUserChoiceOptionSchema).min(2).max(24),
  allowMultiple: z.boolean().optional(),
})

const askUserOpenEndedQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  kind: z.literal('open_ended'),
  placeholder: z.string().optional(),
  optional: z.boolean().optional(),
})

const askUserQuestionsInputSchema = z.object({
  intro: z.string().optional(),
  questions: z
    .array(
      z.discriminatedUnion('kind', [
        askUserMultipleChoiceQuestionSchema,
        askUserOpenEndedQuestionSchema,
      ]),
    )
    .min(1)
    .max(12),
})

const readDocsInputSchema = z.object({
  doc: z
    .enum(['widget', 'chat_apis'])
    .describe(
      "Which documentation to load. Use 'widget' for embeddable chat widget setup and manifest-defined metadata in widget embed code. Use 'chat_apis' for chat agent / chat API docs.",
    ),
})

async function validateDraftAgainstRuntime({ draft, teamId, botId, firestore }) {
  const runtimeUrl = process.env.SKILLS_RUNTIME_URL
  const runtimeToken = process.env.SKILLS_RUNTIME_TOKEN

  if (!runtimeUrl) {
    throw new Error('SKILLS_RUNTIME_URL is not configured. The builder cannot validate without it.')
  }

  const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(runtimeToken ? { Authorization: `Bearer ${runtimeToken}` } : {}),
    },
    body: JSON.stringify({
      skillName: draft.skillName,
      manifest: {
        envBindings: draft.envBindings || [],
        secretBindings: draft.secretBindings || [],
        metadataBindings: draft.metadataBindings || [],
      },
      files: (draft.files || [])
        .map((file) => ({
          path: file.path,
          content: file.content,
        }))
        .filter(
          (file) =>
            file.path !== GENERATED_BUNDLE_ARTIFACT_PATH &&
            file.path !== GENERATED_COMPILED_ARTIFACT_PATH,
        ),
    }),
  })

  const payload = await response.json().catch(() => ({
    valid: false,
    errors: ['Invalid runtime test response.'],
    warnings: [],
  }))

  const sanitizedPayload = sanitizeValidationPayload(payload)
  const mergedFiles = sanitizedPayload?.bundleArtifact
    ? mergeBundleArtifact(draft.files || [], sanitizedPayload.bundleArtifact)
    : draft.files

  const updated = await updateSkillDraft(
    teamId,
    botId,
    draft.skillName,
    {
      files: mergedFiles,
      manifest: {
        hasFunctions: Boolean(sanitizedPayload?.hasFunctions),
      },
      validation: sanitizedPayload,
    },
    firestore,
  )

  return {
    ok: response.ok && Boolean(sanitizedPayload?.valid),
    payload: sanitizedPayload,
    draft: updated,
    status: response.status,
  }
}

async function publishDraftBundle({ draft, teamId, botId, userId, firestore }) {
  let latestDraft = draft

  if (!latestDraft.validation?.valid) {
    const validationResult = await validateDraftAgainstRuntime({
      draft: latestDraft,
      teamId,
      botId,
      firestore,
    })
    latestDraft = validationResult.draft

    if (!validationResult.ok) {
      return {
        ok: false,
        draft: latestDraft,
        message:
          validationResult.payload?.message ||
          validationResult.payload?.error ||
          'Validation failed before publish.',
        validation: validationResult.payload,
      }
    }

  }

  const promoted = await promoteSkillDraftToPublishedCurrent(latestDraft.r2Prefix)
  if (!promoted.configured) {
    return {
      ok: false,
      draft: latestDraft,
      message: promoted.message || 'Skills R2 storage is not configured.',
    }
  }

  const published = await publishSkillDraft(
    {
      teamId,
      botId,
      skillName: latestDraft.skillName,
      userId,
      hasFunctions: Boolean(latestDraft.validation?.hasFunctions),
    },
    firestore,
  )

  return {
    ok: true,
    draft: published,
    result: {
      valid: true,
      uploaded: true,
      promoted: promoted.promoted,
      deleted: promoted.deleted,
    },
  }
}
 
function buildSystemPrompt(draft) {
  const audience = draft.manifest?.internal ? 'internal-only' : 'customer-facing'

  return `## Identity
You are the DocsBot Skills Builder coding agent. You help a non-technical DocsBot customer create, revise, validate, and publish a DocsBot skill bundle through this conversation.

A **DocsBot skill** is a versioned package attached to one bot. It always includes \`SKILL.md\` (how the live agent should behave) and may add reference files and, for executable skills, bundled TypeScript the runtime runs. It is not a separate product: it extends this bot’s user chat behavior together with the model, tools, and other settings.

**Why the user has you build them:** To enable new capabilities for their agent (bot) by defining how it should behave, and which steps to take for recurring scenarios—and, when needed, to expose those steps as **functions** the agent calls (typed actions to run code or perform API calls or other remote interactions) instead of improvising or pasting ad hoc integration instructions into chat.

**How they are used at runtime:** After **publish**, the deployed DocsBot agent (bot) uses the skill when a conversation matches what the skill is for: it follows SKILL.md instructions, reads bundled references, and calls exported \`defineSkillFunction\` handlers when a structured action is needed. Published skills can also be offered in the **embeddable chat widget** as user-triggered quick actions; **public** bots only allow **customer-facing** skills in that context, where actions generic or scoped to the specific customer/user interacting with the bot.**internal** skills are for private or staff-side use and may expose more powerful capabilities. This skill is intended for a **${audience}** audience unless the user requests you to change that.

## Context
Build or revise the skill bundle named ${draft.skillName}. The working filesystem root is ${WORKSPACE_ROOT}.

## Runtime file mapping
- The deployed runtime root for this skill is \`/skills/${draft.skillName}/\`.
- Only reference markdown or asset files that belong to this skill. Never cross-reference files from other skills.
- Any cross-reference you author for the runtime agent should use either a path relative to this skill root or an absolute \`/skills/${draft.skillName}/...\` path.
- In the runtime environment, skills are mounted under \`/skills/NAME/...\`. Do not reference \`/.agents/...\` paths.

## Core workflow
- Use the apply_patch tool for creating, updating, or deleting bundle files under ${WORKSPACE_ROOT}. If you need to rename a file, use shell tool.
- Use the shell tool mainly for inspecting authored source files under ${WORKSPACE_ROOT}, optional local verification, and other CLI workflows that support authoring.
- Treat ${WORKSPACE_ROOT} as the only writable bundle root.
- Use the \`update_manifest\` tool for manifest changes.
- Use \`ask_user_questions\` only when the user must choose a direction or provide non-secret information that cannot reasonably be represented as a configurable manifest binding. When you call it, make that call the only action in the step and stop immediately. Do not call another tool, continue reasoning, or write a fallback text question after \`ask_user_questions\`; wait for the form response.
- Use the \`validate_skill_bundle\` tool after meaningful edits. It validates the current draft files against the remote skill runtime, which is the source of truth for bundle errors.
- Use the \`publish_skill_bundle\` tool before claiming the task is complete.
- \`publish_skill_bundle\` is not a stopping or pausing tool. After it succeeds, always continue and if done working, send a final assistant message in the same turn. Do not end the turn with only the tool result. Briefly tell the user that the skill was published and summarize the important changes.
- Do not generate, repair, or hand-author platform-generated artifacts yourself. Write source files, then use \`validate_skill_bundle\` and \`publish_skill_bundle\`.

## User-facing messaging
- Do not mention internal platform identifiers, package names, or infrastructure names in user-visible messages.
- Describe your actions in plain language, for example: "I updated the instructions", "I ran validation", or "the skill was published".

## Platform rules
- This chat is the only editing surface. Do not ask the user to manually edit files or manifest fields.
- Do not ask the user to paste secrets, tokens, or integration IDs into chat. Declare required secretBindings instead.
- Build skills as reusable templates for any team that installs them. Do not hard-code a customer's domains, workspace IDs, tenant IDs, account IDs, project IDs, helpdesk hosts, channel IDs, regions, email addresses, or similar deployment-specific values in code, SKILL.md, package files, references, or examples. Model these as env bindings, secret bindings, or metadata bindings in the manifest.
- Keep all authored files within the supported skill bundle layout.
- Use TypeScript for executable code.
- Use ES modules format exclusively. Never use Service Worker format.
- Add appropriate TypeScript types and interfaces.
- You must import all methods, classes, and types used in the code you generate.
- Executable skills must export functions created with \`defineSkillFunction(...)\` from \`@docsbot/skills\`.
- Every exported \`defineSkillFunction(...)\` must include \`description\`, \`input\`, and \`output\`.
- \`input\` and \`output\` must be Zod schemas.
- Define named Zod schema constants and explicit TypeScript input and output aliases for each exported function, then keep the handler aligned with them.
- Skill handlers receive arguments in this order: \`handler(ctx, input)\`, where \`ctx\` is the runtime \`SkillContext\` and \`input\` is the object validated against the function's \`input\` Zod schema. If you use a named implementation function, define it in that same order, for example \`async function runThing(ctx: SkillContext, input: ThingInput): Promise<ThingOutput>\`.
- Never define a two-argument handler as \`(input, ctx)\` or pass a named function with that order. That reverses the runtime context and model-provided input, causing required input fields to be \`undefined\` at execution time.
- \`description\` should explain when the runtime agent should call the function and what the function does.
- \`input\` must describe only the exact arguments the model truly needs to call the function successfully. Prefer a small, opinionated argument surface over mirroring every upstream API option.
- \`output\` must describe only the structured result fields the deployed agent is likely to use in user responses or downstream chaining. Do not return full API payloads, debug fields, or speculative metadata.
- Every function output must be valid JSON that matches the declared \`output\` schema. Return structured JSON objects only so the runtime can filter fields and pipe outputs between functions; never return free-form text blobs, markdown, HTML, or other non-JSON content from skill functions.
- The handler's TypeScript parameter type must match \`input\`, and the handler's Promise return type must match \`output\`.
- If the function can return multiple result variants, express that intentionally in both TypeScript and \`output\` rather than returning ad hoc objects.
- The schemas and named TypeScript aliases you author are used to generate the function context shown to frontend/runtime agents, so include enough structure, field names, descriptions, and result variants for those agents to call functions correctly and interpret their outputs reliably.
- Keep implementation logic in a named function and any needed helpers under \`scripts/**\`, not in \`SKILL.md\`.
- Prefer \`handler: namedFunction\` or a thin handler wrapper that delegates to a named function, rather than embedding substantial logic inline inside \`defineSkillFunction(...)\`.
- Do not export plain objects, helper constants, or raw API recipes as callable skill functions. Export only real \`defineSkillFunction(...)\` functions intended for runtime use.
- Executable skills should include \`package.json\` with the runtime dependencies needed to bundle the skill, including \`zod\`.
- Scripts may depend on npm packages declared in \`package.json\`. If you add one, update \`package.json\` in the bundle. Use shell installation only when optional local verification truly needs it; local \`node_modules\` contents are not the source of truth for validation.
- If there is an official SDK or library for the service you are integrating with, use it to simplify the implementation.
- Minimize external dependencies beyond the SDKs and libraries actually needed for the skill.
- Do not use libraries that rely on FFI, native bindings, or C/C++ extensions.
- Never bake secrets into the code.
- Include proper error handling and logging.
- Include comments explaining complex logic.
- Keep all code in a single file unless the user explicitly asks for a multi-file structure or the complexity clearly requires a helper under \`scripts/**\`.
- Author source files only. Do not try to manually create or fix generated artifacts; \`validate_skill_bundle\` and \`publish_skill_bundle\` handle that platform work.
- When validation fails, first inspect the returned validation errors and the authored bundle files such as \`scripts/index.ts\`, \`package.json\`, and \`SKILL.md\`. Do not debug \`/workspace/node_modules\`, hidden package-manager directories, or local package cache layouts unless a local shell command explicitly failed because a package is missing.
- Keep SKILL.md concise and operational.
- Treat the current audience as ${audience} unless the user explicitly changes it.
- Do not use web_search to look up DocsBot.ai documentation, this skills builder, or how skills work in this environment.
- Use \`read_docs\` when the user needs help with embeddable widget docs or chat API docs. Use \`doc: "widget"\` for the embeddable chat widget and manifest-defined metadata in the widget embed code. Use \`doc: "chat_apis"\` for chat agent or chat API documentation.

## Env, secrets, and customer metadata in \`update_manifest\` and scripts
- **Register in the manifest** (via \`update_manifest\`): \`envBindings\` is \`{ envVar, value?, description? }\` for fixed non-secret deployment config such as workspace IDs, tenant IDs, account IDs, regions, or environment names. Omit \`value\` to keep the current saved value for that env var. \`secretBindings\` is \`{ envVar, description? }\` per credential (declare **names only**; never put secret values in chat, bundle files, or *.md). \`metadataBindings\` is \`{ envVar, metadataKey, description? }\` for each value supplied from the widget embed or chat context (\`metadataKey\` matches what the customer sets in embed configuration).
- **Portability rule:** Account-specific non-secret values, including hosts/domains, workspace IDs, tenant IDs, project IDs, channel IDs, regions, and similar identifiers, belong in \`envBindings\` and should be read from \`ctx.env\` or used as \`{{ENV_VAR_NAME}}\` placeholders. If the value varies per end user or session, use \`metadataBindings\` instead. If the value is a credential, token, API key, webhook secret path, or other sensitive value, use \`secretBindings\`.
- **Do not ask for identifiers just to code them in.** If a skill needs a service host, workspace or channel ID, repository owner/name, tenant or organization ID, account ID, subdomain, or comparable customer-specific identifier, declare a descriptive env binding such as \`SERVICE_DOMAIN\`, \`WORKSPACE_ID\`, \`CHANNEL_ID\`, \`REPOSITORY_OWNER\`, \`TENANT_ID\`, or \`ACCOUNT_ID\`. This allows the skill to be ported to other teams without updating code. Ask the user only when there is no reasonable generic binding design or when the user must choose between product behaviors.
- **Binding descriptions:** When a binding would be confusing to a non-technical user, include a short one-sentence \`description\` in the manifest update so the UI can explain what the value is for.
- **Env bindings:** The runtime exposes declared env bindings in \`ctx.env\` and as \`{{ENV_VAR_NAME}}\` placeholders in outbound URLs and headers. Use env bindings for non-secret config that stays fixed for this skill bot deployment, not for per-user/session values.
- **Metadata:** The runtime passes metadata bindings into the skill handler through \`ctx.metadata\` (allowlisted values keyed by \`metadataKey\`). Treat missing keys safely. Use metadata for per-user/session context such as user email, customer ID, etc., not for fixed deployment config or raw secrets.
- **Proxy placeholders:** Env bindings, secret bindings, and metadata binding \`envVar\` names can be used as \`{{ENV_VAR_NAME}}\` placeholders in outbound HTTP request URLs and request header values. Use \`ctx.env\` / \`ctx.metadata\` when code logic needs the value; use \`{{ENV_VAR_NAME}}\` when the value only needs to be inserted into an outbound request by the proxy.
- **URL placeholder shape:** Do not use a placeholder as the entire \`fetch\` or \`new Request\` URL, such as \`fetch("{{SLACK_WEBHOOK_URL}}")\`; that URL is invalid before the proxy can rewrite it. Keep the scheme and host literal, and put placeholders only in path segments, query parameters, or headers. For Slack webhooks, register a secret such as \`SLACK_WEBHOOK_PATH\` containing only the path after \`/services/\`, then call \`fetch("https://hooks.slack.com/services/{{SLACK_WEBHOOK_PATH}}", ...)\`.
- **Secrets:** Decrypted secrets are never available in skill code and can not be read from \`ctx.env\`, \`ctx.metadata\`, or \`process.env\`. Secret values may only be referenced as \`{{ENV_VAR_NAME}}\` placeholders in outbound URLs and header values.
- **Built-in runtime values:** \`DOCSBOT_TEAM_ID\`, \`DOCSBOT_BOT_ID\`, \`DOCSBOT_CONVERSATION_ID\`, and \`DOCSBOT_SKILL_NAME\` are always available. They are rarely needed, but they can be read from \`ctx.env\` or used as proxy placeholders like \`{{DOCSBOT_TEAM_ID}}\` when appropriate.
- **Example manifest + \`fetch\`** (illustrative; align \`envVar\` / \`metadataKey\` with your real manifest):

\`\`\`json
{
  "envBindings": [
    { "envVar": "WORKSPACE_ID", "value": "workspace-123", "description": "Workspace ID for the customer account this skill queries." },
    { "envVar": "TENANT_ID", "value": "tenant-456", "description": "Tenant or organization ID used in outbound API requests." }
  ],
  "secretBindings": [
    { "envVar": "SERVICE_API_KEY", "description": "API key used to authenticate requests to the service." }
  ],
  "metadataBindings": [{ "envVar": "CUSTOMER_ID", "metadataKey": "customerId", "description": "The end user's customer ID passed from the widget or chat request." }]
}
\`\`\`

\`\`\`typescript
import type { SkillContext } from "@docsbot/skills";

// WORKSPACE_ID and TENANT_ID are fixed non-secret deployment config from envBindings and are available in ctx.env / {{...}} placeholders.
// CUSTOMER_ID comes from metadata bindings via ctx.metadata.
// SERVICE_API_KEY is a secret binding and only appears as {{...}} placeholders in the outbound URL / headers.
// DOCSBOT_CONVERSATION_ID and DOCSBOT_BOT_ID are built-in runtime values that are always available if needed.
async function fetchCustomerContext(ctx: SkillContext) {
  const workspaceId = ctx.env?.WORKSPACE_ID ?? "";
  const customerId = ctx.metadata?.customerId ?? "";
  const res = await fetch(
    "https://api.example.com/v1/workspaces/" +
      encodeURIComponent(workspaceId) +
      "/tenants/{{TENANT_ID}}/customers/lookup?customer_id=" +
      encodeURIComponent(customerId) +
      "&api_key={{SERVICE_API_KEY}}&conversation={{DOCSBOT_CONVERSATION_ID}}",
    {
      headers: {
        Authorization: "Bearer {{SERVICE_API_KEY}}",
        "X-Tenant-Id": "{{TENANT_ID}}",
        "X-DocsBot-Bot": "{{DOCSBOT_BOT_ID}}",
      },
    },
  );
  if (!res.ok) throw new Error("request failed");
  return res.json();
}
\`\`\`

## SKILL.md authoring rules
- SKILL.md is the runtime skill file for the finished skill, not a builder checklist.
- Write SKILL.md for the agent that will use the skill in production, not for the builder agent.
- The Overview section should explain what the skill does, when it should be used, and any important execution context the runtime agent needs.
- SKILL.md should describe agent behavior, decision-making, and how the agent should use generated skill functions. It should not be written like implementation notes for a developer.
- Do not put raw API call instructions, request URLs, HTTP parameter recipes, shell commands, coding steps, or TypeScript implementation tasks into SKILL.md.
- If the skill needs external APIs or code-driven actions, those should be implemented in scripts/index.ts or helper files. SKILL.md should only tell the runtime agent when to call those functions, what information to gather first, how to handle ambiguity, and what outcome to produce for the user.
- Do not include builder-only instructions in SKILL.md such as how to build the skill, how to use apply_patch or shell, progressive disclosure guidance, validation steps, publish steps, or secret-handling reminders meant for authors.
- The Constraints section should contain only real runtime constraints for the skill itself, such as business rules, safety rules, API limitations, or things the runtime agent must avoid.
- Keep the frontmatter valid and separated from the markdown body with a blank line after the closing --- marker.

## Executable skill contract
- Executable skills are for complex capabilities that need code to run (such as API calls or code-driven actions). Markdown-only skills are for simpler capabilities that can be described in SKILL.md (and references/*.md for progressive disclosure).
- Author executable code in \`scripts/index.ts\`.
- Include \`package.json\` for executable skills.
- Import \`defineSkillFunction\` from \`@docsbot/skills\`.
- Import \`z\` from \`zod\`.
- Export named functions with \`export const functionName = defineSkillFunction({...})\`.
- The runtime agent discovers callable functions from those exports, so the export name must be the public function name.
- Prefer adjacent \`const FunctionNameInput = z.object(...)\`, \`const FunctionNameOutput = ...\`, and matching \`type FunctionNameInput = z.infer<typeof FunctionNameInput>\` aliases so the generated TypeScript definitions shown to the runtime agent stay readable.
- Prefer a named implementation function such as \`async function runFunctionName(ctx: SkillContext, input: FunctionNameInput): Promise<FunctionNameOutput> { ... }\` and pass that function to \`handler\`.
- Handler argument order is part of the runtime contract: \`ctx\` first, validated \`input\` second. One-argument handlers may accept only \`input\`, but two-argument handlers must not use \`input\` first.
- Keep schemas and handlers aligned. If the handler returns a shape that changed, update \`output\` in the same edit.
- If a function consumes fixed deployment config, request metadata, secrets, or network access, register them in the manifest (see **Env, secrets, and customer metadata in \`update_manifest\` and scripts**) together with an appropriate \`networkPolicy\`, rather than describing hidden prerequisites in SKILL.md.

## Supported bundle files
- SKILL.md
- references/*.md
- assets/*
- scripts/index.ts
- helper files under scripts/**
- package.json

## Validation and publish
- \`validate_skill_bundle\` validates the current draft bundle and updates validation state.
- \`publish_skill_bundle\` publishes the validated draft bundle.
- \`validate_skill_bundle\` and \`publish_skill_bundle\` handle platform-managed generated artifacts; they are not the coding agent's job to create or repair manually.
- Do not claim completion until \`publish_skill_bundle\` succeeds, or you can clearly explain the blocker.
- A successful publish tool result is not a user-facing completion by itself and must not stop the agent. Follow it with a concise assistant message so the conversation never ends silently after publishing.
`.trim()
}

function stepIncludesToolCall(step, toolName) {
  return Array.isArray(step?.toolCalls) && step.toolCalls.some((toolCall) => toolCall?.toolName === toolName)
}

export async function POST(request, context) {
  try {
    const params = await context.params
    const { team, bot, botId, userId, firestore } = await getAuthorizedBotContext(request, params)
    const draft = await getSkillDraft(team.id, botId, params.id, firestore)

    if (!draft) {
      return NextResponse.json({ message: 'Skill draft not found.' }, { status: 404 })
    }

    if (!canUserManageBotSettings(team, userId, bot)) {
      return NextResponse.json(
        { message: 'You are not allowed to manage bot skills.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const messages = recoverInterruptedToolCalls(Array.isArray(body.messages) ? body.messages : [])
    const sandboxId = buildSkillSandboxId(team.id, botId, draft.skillName)

    const teamSecrets = await getTeamWithEncryptedOpenAIKey(team.id)
    let teamOpenAiApiKey = null
    if (teamSecrets?.openAIKey) {
      try {
        teamOpenAiApiKey = decryptKey(teamSecrets.openAIKey)
      } catch (err) {
        console.warn('skills builder: could not decrypt team OpenAI key, using platform key', err)
      }
    }
    const useTeamOpenAiKey = Boolean(teamOpenAiApiKey)
    const builderOpenaiModelId = SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL
    const openaiForBuilder = useTeamOpenAiKey
      ? createOpenAI({ apiKey: teamOpenAiApiKey })
      : openaiProviderDefault
    const systemPrompt = buildSystemPrompt(draft)

    await getSkillDraftDocRef(team.id, botId, draft.skillName, firestore).set(
      {
        agent: {
          sandboxId,
          sessionId: SKILLS_SANDBOX_SESSION_ID,
          ...(draft.agent?.lastResponseId !== undefined
            ? { lastResponseId: draft.agent.lastResponseId }
            : {}),
        },
      },
      { merge: true },
    )

    const tools = {
      load_context: {
        description: 'Load the current skill draft context and its manifest, file tree, validation state, and live test state.',
        inputSchema: loadContextInputSchema,
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          return buildSkillContextSummary(latest)
        },
      },
      update_manifest: {
        description: 'Update manifest values and keep SKILL.md frontmatter description aligned.',
        inputSchema: updateManifestInputSchema,
        execute: async (input) => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const patch = {}

          if (input.description !== undefined) patch.description = input.description
          if (input.internal !== undefined) patch.internal = input.internal
          if (input.networkPolicy !== undefined) patch.networkPolicy = input.networkPolicy
          if (input.envBindings !== undefined) {
            const existingEnvByName = new Map(
              (latest?.envBindings || []).map((binding) => [
                binding.envVar,
                { value: binding.value, description: binding.description },
              ]),
            )
            patch.envBindings = input.envBindings.map((binding) => ({
              envVar: binding.envVar,
              value:
                binding.value !== undefined
                  ? binding.value
                  : existingEnvByName.get(binding.envVar)?.value ?? '',
              ...(binding.description
                ? { description: binding.description }
                : existingEnvByName.get(binding.envVar)?.description
                  ? { description: existingEnvByName.get(binding.envVar).description }
                  : {}),
            }))
          }
          if (input.metadataBindings !== undefined) patch.metadataBindings = input.metadataBindings
          if (input.secretBindings !== undefined) {
            const existingByEnv = new Map(
              (latest?.secretBindings || []).map((binding) => [
                binding.envVar,
                { secret: binding.secret, description: binding.description },
              ]),
            )
            patch.secretBindings = input.secretBindings.map((binding) => ({
              envVar: binding.envVar,
              secret: existingByEnv.get(binding.envVar)?.secret || '',
              ...(binding.description
                ? { description: binding.description }
                : existingByEnv.get(binding.envVar)?.description
                  ? { description: existingByEnv.get(binding.envVar).description }
                  : {}),
            }))
          }

          let nextFiles = latest.files
          if (input.description !== undefined) {
            nextFiles = upsertSkillFile(latest.files, {
              path: 'SKILL.md',
              content: replaceSkillMdFrontmatter(getSkillFileContent(latest.files, 'SKILL.md'), {
                name: latest.skillName,
                description: input.description,
              }),
            })
          }

          const updated = await updateSkillDraft(
            team.id,
            botId,
            latest.skillName,
            {
              manifest: patch,
              ...(input.description !== undefined ? { files: nextFiles } : {}),
            },
            firestore,
          )

          return {
            manifest: updated.manifest,
          }
        },
      },
      validate_skill_bundle: {
        description: 'Validate the current draft bundle against the remote skill runtime.',
        inputSchema: z.object({}),
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const result = await validateDraftAgainstRuntime({
            draft: latest,
            teamId: team.id,
            botId,
            firestore,
          })
          return {
            ok: result.ok,
            validation: result.draft.validation,
            fileTree: result.draft.files.map((file) => file.path),
          }
        },
      },
      publish_skill_bundle: {
        description: 'Publish the validated draft bundle by promoting it to the published package.',
        inputSchema: z.object({}),
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const result = await publishDraftBundle({
            draft: latest,
            teamId: team.id,
            botId,
            userId,
            firestore,
          })

          if (!result.ok) {
            return {
              ok: false,
              message: result.message,
              validation: result.draft?.validation || null,
            }
          }

          return {
            ok: true,
            publishedAt: result.draft.publishedAt,
            skill: buildSkillContextSummary(result.draft),
            result: result.result,
          }
        },
      },
      read_docs: {
        description:
          "Call to load developer docs into context only when needed to answer user questions about the widget or chat agent API. Use doc='widget' for embeddable chat widget help, embedding help, or how to pass manifest-defined user metadata in widget embed code. Use doc='chat_apis' for chat agent or chat API help.",
        inputSchema: readDocsInputSchema,
        execute: async (input) => {
          const docEntry = DOC_CONTENT_BY_KEY[input.doc]
          return {
            doc: input.doc,
            path: docEntry.path,
            content: docEntry.content,
          }
        },
      },
      ask_user_questions: {
        description:
          'Pause and ask the user one or more questions using multiple-choice controls and optional short open-ended fields. Call this tool whenever you need to gather additional information such as direction, clarification, or confirmation from the user to proceed with the task.',
        inputSchema: askUserQuestionsInputSchema,
      },
    }

    const modelMessages = await convertToModelMessages(messages)

    const superAdmin = isSuperAdmin(userId)
    const webSearchUsageAcc = { calls: 0 }
    const shellUsageAcc = { calls: 0, durationMs: 0 }
    let builderStepLimitReached = false
    const builderStepLimitStopCondition = ({ steps = [] }) => {
      const latestStep = steps[steps.length - 1]
      if (steps.length >= BUILDER_AGENT_MAX_STEPS && stepIncludesToolCall(latestStep, 'publish_skill_bundle')) {
        return false
      }
      const reached = steps.length >= BUILDER_AGENT_MAX_STEPS
      if (reached) builderStepLimitReached = true
      return reached
    }

    const stream = streamText({
      model: openaiForBuilder(builderOpenaiModelId),
      system: systemPrompt,
      messages: modelMessages,
      abortSignal: request.signal,
      tools: {
        ...tools,
        web_search: openaiForBuilder.tools.webSearch({
          externalWebAccess: true,
        }),
        shell: openaiForBuilder.tools.shell({
          execute: createSkillShellExecute({
            teamId: team.id,
            botId,
            skillName: draft.skillName,
            abortSignal: request.signal,
            usageAccumulator: shellUsageAcc,
          }),
        }),
        apply_patch: openaiForBuilder.tools.applyPatch({
          execute: createSkillPatchExecute({
            teamId: team.id,
            botId,
            skillName: draft.skillName,
            abortSignal: request.signal,
          }),
        }),
      },
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
          reasoningSummary: 'detailed',
          parallelToolCalls: false,
          truncation: 'auto',
        },
      },
      prepareStep: ({ steps = [] }) => {
        const latestStep = steps[steps.length - 1]
        if (steps.length >= BUILDER_AGENT_MAX_STEPS && stepIncludesToolCall(latestStep, 'publish_skill_bundle')) {
          return {
            activeTools: [],
            toolChoice: 'none',
            system: `${systemPrompt}\n\nThe previous step called \`publish_skill_bundle\` at the safety step limit. You have the publish tool result in context now. Do not call tools. Read the result and send the user a concise final message that says whether publishing succeeded or explains the validation/publish failure and the next fix needed.`,
          }
        }
        return undefined
      },
      // Only the question form intentionally pauses the builder. Publishing must continue so
      // the model can send a user-visible completion message after the tool result.
      stopWhen: [hasToolCall('ask_user_questions'), builderStepLimitStopCondition],
      onFinish: async (event) => {
        try {
          const webSearchCalls = countWebSearchToolCallsInSteps(event.steps)
          const usageMeta = buildSkillsBuilderAgentUsageMetadata(
            event.totalUsage,
            webSearchCalls,
            { ...shellUsageAcc },
            { openaiModelId: builderOpenaiModelId },
          )
          await incrementSkillDraftBuilderAgentUsage(
            getSkillDraftDocRef(team.id, botId, draft.skillName, firestore),
            {
              openaiModelId: builderOpenaiModelId,
              usage: usageMeta.skillsBuilderAgentUsage,
            },
          )
        } catch (err) {
          console.warn('skills builder: failed to persist builder usage totals', err)
        }
      },
    })

    return stream.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
      consumeSseStream: consumeStream,
      messageMetadata: ({ part }) => {
        if (superAdmin && part.type === 'tool-call' && !part.invalid && isWebSearchToolCallPart(part)) {
          webSearchUsageAcc.calls += 1
        }
        if (part.type !== 'finish') return undefined

        const meta = {}
        if (builderStepLimitReached) {
          meta.skillsBuilderAgentPaused = {
            reason: 'step_limit',
            maxSteps: BUILDER_AGENT_MAX_STEPS,
            message: BUILDER_AGENT_STEP_LIMIT_PAUSE_MESSAGE,
          }
        }
        if (superAdmin) {
          Object.assign(
            meta,
            buildSkillsBuilderAgentUsageMetadata(
              part.totalUsage,
              webSearchUsageAcc.calls,
              shellUsageAcc,
              { openaiModelId: builderOpenaiModelId },
            ),
          )
        }
        return Object.keys(meta).length ? meta : undefined
      },
      onError: (error) => openAiErrorMessage(error) || 'Unable to run skills builder agent.',
      onFinish: async ({ isAborted }) => {
        await getSkillDraftDocRef(team.id, botId, draft.skillName, firestore).set(
          {
            lastAuthoringSummary: {
              updatedAt: new Date().toISOString(),
              messageCount: messages.length,
              isAborted: Boolean(isAborted),
              stepLimitReached: Boolean(builderStepLimitReached),
              maxSteps: BUILDER_AGENT_MAX_STEPS,
            },
            agent: {
              sandboxId,
              sessionId: SKILLS_SANDBOX_SESSION_ID,
              ...(draft.agent?.lastResponseId !== undefined
                ? { lastResponseId: draft.agent.lastResponseId }
                : {}),
            },
          },
          { merge: true },
        )
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: openAiErrorMessage(error) || error?.message || 'Unable to run skills builder agent.' },
      { status: error?.status || 500 },
    )
  }
}
