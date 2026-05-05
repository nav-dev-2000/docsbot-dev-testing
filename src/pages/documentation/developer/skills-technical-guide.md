---
title: "DocsBot Skills Technical Guide"
description: "A technical guide to DocsBot Skills architecture, package structure, runtime behavior, testing, troubleshooting, and widget action enablement."
date: 2026-04-29
---

DocsBot Skills extend a bot with reusable instructions, reference material, and optional executable code. They are designed to let an agent load specialized context only when needed, then call structured functions when the conversation requires an action, API lookup, file generation, or other deterministic work.

This guide explains how Skills are structured, how the Skill Builder and runtime work internally, how to test and improve a Skill, and how to enable published Skills as selectable actions in the embeddable chat widget. For examples and the product overview, visit the [DocsBot Skills page](/skills).

## Skill Architecture Overview

A DocsBot Skill is a versioned package attached to a specific bot. Each Skill has a stable skill ID, dashboard metadata, draft files, and optionally a published package.

At runtime, the bot can:

1. See each enabled Skill's name and description.
2. Load the full `SKILL.md` only when the user's request matches that Skill.
3. Read additional reference files when deeper instructions are needed.
4. Call exported executable functions when the Skill defines code-backed actions.
5. Return structured results, generated artifacts, or action outcomes to the user.

Internally, Skills are stored as draft and published packages. Drafts are edited by the Skill Builder agent. Publishing validates the draft and promotes it to the live package that the bot can use.

## Package Structure

Supported Skill bundle files are intentionally constrained:

```text
SKILL.md
references/*.md
assets/*
scripts/index.ts
scripts/**
package.json
.docsbot/bundle/index.js
```

The important author-controlled files are:

- `SKILL.md`: Required. The runtime instructions the bot reads when the Skill is relevant.
- `references/*.md`: Optional deeper instructions, policy notes, examples, or long-form guidance.
- `assets/*`: Optional static resources bundled with the Skill.
- `scripts/index.ts`: Optional executable TypeScript entry point.
- `package.json`: Required for executable Skills that declare runtime dependencies.

Generated bundle artifacts under `.docsbot/` are platform-managed. Do not hand-edit them.

## `SKILL.md`

Every Skill must include a `SKILL.md` file with YAML front matter:

```markdown
---
name: example-skill
description: "Use when the user needs help with a specific workflow."
---

# Example Skill

## Overview

Explain what the Skill does and when the bot should use it.
```

The `description` is especially important. At startup, the bot only sees the Skill's name and description, so the description must clearly state when the Skill should load.

Good descriptions include:

- The user intent the Skill handles.
- Keywords users are likely to say.
- The domain, API, file type, or workflow involved.
- Boundaries that prevent the Skill from loading too broadly.

The body of `SKILL.md` should be written for the runtime bot, not for a developer. It should explain behavior, decision-making, required user inputs, and when to call Skill functions. Implementation details belong in `scripts/index.ts`, not in `SKILL.md`.

## Progressive Disclosure

Skills are built around progressive disclosure. The bot should not load every instruction for every possible task into every conversation.

The flow is:

1. Skill name and description are available for routing.
2. `SKILL.md` is loaded when the request matches.
3. `references/*.md` files are consulted only when needed.
4. Executable functions are called only for structured actions.

This keeps token usage lower and prevents unrelated instructions from affecting normal conversations.

## Markdown-Only vs Executable Skills

DocsBot supports two broad Skill types.

Markdown-only Skills contain `SKILL.md`, and optionally references or assets. They are useful for:

- Support policies.
- Editorial rules.
- Escalation procedures.
- Domain-specific response workflows.
- Internal checklists.
- Complex instructions that do not need code.

Executable Skills include `scripts/index.ts` and usually `package.json`. They are useful for:

- Calling APIs.
- Looking up live customer or account data.
- Creating tickets or records.
- Generating files.
- Transforming documents or structured data.
- Returning artifacts such as images, PDFs, CSVs, or reports.

## Executable Function Contract

Executable Skills export functions from `scripts/index.ts` using `defineSkillFunction`.

The standard shape is:

```ts
import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const InputSchema = z.object({
  query: z.string().min(1).describe("The value the bot needs to provide."),
});

const OutputSchema = z.object({
  summary: z.string().describe("Structured result for the bot to use."),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

async function runLookup(ctx: SkillContext, input: Input): Promise<Output> {
  return { summary: `Result for ${input.query}` };
}

export const lookupThing = defineSkillFunction({
  description: "Use when the bot needs to look up the thing.",
  input: InputSchema,
  output: OutputSchema,
  handler: runLookup,
});
```

Key rules:

- Import `defineSkillFunction` from `@docsbot/skills`.
- Use runtime Zod schemas for `input` and `output`.
- Keep function inputs minimal and model-friendly.
- Return structured JSON that matches the output schema.
- Use `handler(ctx, input)` order for two-argument handlers.
- Put implementation logic in named functions or helpers under `scripts/**`.
- Do not return raw API payloads unless the bot actually needs every field.

## Runtime Context

Skill handlers receive a `SkillContext` object. Important context areas include:

- `ctx.env`: Non-secret environment bindings and built-in runtime values.
- `ctx.metadata`: Per-user or per-session metadata passed from the widget or chat request.
- `ctx.artifacts.publish(...)`: Publishes generated files to expiring cloud storage.

Built-in runtime values include identifiers such as the DocsBot team ID, bot ID, conversation ID, and Skill name. These are rarely needed directly, but they are available when a Skill needs to stamp requests or correlate work.

## Environment, Secrets, and Metadata

Skills use three binding types.

### Environment Bindings

Use environment bindings for fixed, non-secret configuration:

- Workspace IDs.
- Account IDs.
- Tenant IDs.
- Regions.
- Non-secret service hostnames.
- Feature flags.

These values are available in `ctx.env` and can also be used as outbound request placeholders.

### Secret Bindings

Use secret bindings for credentials:

- API keys.
- Bearer tokens.
- Webhook secrets.
- OAuth tokens.

Secret values are not written into Skill files and should not be pasted into builder chat. The Skill declares the secret name, and the user saves the secret value in the dashboard. Skill code references secrets only through placeholders such as:

```ts
Authorization: "Bearer {{SERVICE_API_KEY}}"
```

### Metadata Bindings

Use metadata bindings for values that vary by user, page, session, or conversation:

- Customer ID.
- User email.
- Account ID from the embedding application.
- Current page context.
- Plan or entitlement context.

Metadata is passed into the widget or chat API by the host application and exposed to the Skill through `ctx.metadata`.

## Network Policy

Executable Skills run with an explicit outbound network policy. The manifest can define:

- Allowed URL schemes, usually `https`.
- Allowed domains or hostnames.

Skill code should only be able to contact the external services it actually needs. For example:

- A Notion Skill should allow Notion API domains.
- A Slack alert Skill should allow Slack webhook or API domains.
- An OpenAI image Skill should allow `api.openai.com`.

This policy is enforced through the runtime/proxy layer and is a core part of the security model.

## Artifact Publishing

When a Skill generates a file the user should view or download, publish it as an artifact rather than returning large content directly.

Examples:

- Images.
- PDFs.
- CSVs.
- HTML reports.
- Documents.
- Charts.

Use:

```ts
const artifact = await ctx.artifacts.publish({
  filename: "report.csv",
  contentType: "text/csv; charset=utf-8",
  body: csvBody,
});
```

The returned artifact includes fields such as URL, key, filename, content type, and expiration. Do not publish secrets, credentials, or private files as artifacts. Artifact URLs are intended to be shown to end users.

## Skill Builder Workflow

The Skill Builder is an AI coding agent inside the dashboard. It can:

- Create the initial Skill name, slug, description, and icon.
- Edit `SKILL.md`.
- Add reference files.
- Write `scripts/index.ts`.
- Update `package.json`.
- Declare environment, secret, and metadata bindings.
- Configure network policy.
- Run validation.
- Publish the Skill.

The builder works against the draft package. When it edits files, those changes are reflected in the draft view. The published package only changes after validation and publish.

## Validation and Publishing

Validation checks the current draft bundle against the remote Skill runtime. It verifies things like:

- Valid `SKILL.md` front matter.
- Supported file paths.
- Executable function exports.
- Zod input and output schemas.
- Bundleability of TypeScript and dependencies.
- Callable function metadata.

Publishing promotes the validated draft package to the live published package and updates the Skill manifest.

Recommended workflow:

1. Build or revise the Skill in the builder chat.
2. Run validation after meaningful edits.
3. Fix validation errors before publishing.
4. Publish only after validation succeeds.
5. Test the published Skill with the Skill test agent.
6. Enable it in the widget only after required settings are saved.

## Advanced View

The Skills dashboard includes an Advanced details tab. Use it to inspect:

- Draft files.
- Live published files.
- Draft-vs-published diffs when available.
- `SKILL.md`.
- `package.json`.
- `scripts/index.ts`.

This view is useful when a technical user wants to audit what the builder created, review a code-backed Skill, or confirm that the live package matches the intended draft.

## Testing Skills

DocsBot has several testing layers.

### 1. Bundle Validation

Validation is the first required test. It checks whether the Skill package is structurally valid and can run in the runtime environment.

Run validation after:

- Adding executable code.
- Changing function schemas.
- Changing dependencies.
- Updating bindings.
- Editing `SKILL.md` front matter.

Validation errors should be fixed before publishing.

### 2. Published Skill Test Agent

Executable Skills can be tested after publishing if:

- The Skill is published.
- It has callable functions.
- Required environment values are saved.
- Required secrets are saved.
- Required metadata test values are supplied.

The test agent loads the published Skill and exercises its functions using sample metadata. It produces:

- A plain-language summary.
- A technical report.
- Tool call and output history.
- Errors and edge-case notes.

If the report identifies problems, send it back to the Skill Builder. The builder can inspect the draft, update code or instructions, run validation, and publish a repaired version.

### 3. Runtime Logs

After a Skill is live, the Logs tab shows recent runtime events.

Logs may include:

- Function name.
- Success or failure.
- Duration.
- Runtime log count.
- Input.
- Output.
- Error text.
- Redirect chain details when relevant.

For failed events, use **Fix in builder** to send the runtime error back to the builder agent. This gives the builder concrete failure context instead of a vague bug report.

## Improving Skills Over Time

Good Skills usually improve through iteration.

Recommended improvement loop:

1. Review runtime logs for repeated failures, timeouts, or ambiguous inputs.
2. Use the Skill test agent to reproduce likely edge cases.
3. Send reports or log errors to the builder.
4. Ask the builder for a focused fix, such as improving validation, handling missing metadata, reducing API timeout risk, or clarifying `SKILL.md`.
5. Review Advanced details when the change affects code or security-sensitive bindings.
6. Validate and publish.
7. Watch logs after release.

Common improvement areas:

- Narrowing broad function inputs.
- Adding clearer output schemas.
- Handling missing metadata gracefully.
- Adding user clarification steps in `SKILL.md`.
- Reducing returned payload size.
- Publishing large outputs as artifacts instead of JSON.
- Tightening network policy.
- Replacing hard-coded deployment values with bindings.

## Enabling Skills as Widget Actions

Published customer-facing Skills can be enabled as selectable actions in the embeddable chat widget.

Dashboard steps:

1. Open the bot in the dashboard.
2. Go to **Configure → Skills**.
3. Create, import, validate, and publish the Skill.
4. Save all required environment values and secrets.
5. Confirm the Skill is customer-facing if the bot is public.
6. Go to **Widget → Actions**.
7. Find the **Skills** section.
8. Click **Add skill**.
9. Select the published Skill.
10. Save the widget settings.

The widget action list only allows Skills that are ready for widget use. A Skill can be disabled from selection when:

- It is not published.
- It is missing required secret values.
- It is missing required environment values.
- It is internal-only and the bot is public.
- The current plan does not include widget Skills.
- The bot has reached its plan's Skill slot limit.

Enabled widget Skills are stored by Skill ID and persisted by updating the Skill manifest's `enabledWidget` value.

## Passing Metadata From the Widget

Some Skills need per-user context. For example, a billing Skill may need `customerId`, or a support Skill may need `userEmail`.

When the Skill declares metadata bindings, the dashboard shows the required metadata keys in the Skill details panel. Your embed code or chat API integration must supply those keys for the Skill to use them.

Use metadata for values that identify the current user or session. Do not use metadata for global credentials or fixed deployment settings.

## Security Checklist

Before publishing an executable Skill, confirm:

- Secrets are declared as secret bindings, not hard-coded.
- Fixed non-secret configuration is declared as env bindings.
- Per-user/session values are declared as metadata bindings.
- Network policy only allows required domains.
- Function outputs are structured and minimal.
- Large generated files are published as artifacts.
- Artifacts do not contain secrets or sensitive private data.
- Public bots only expose customer-facing Skills.
- Internal-only Skills are reserved for private or authenticated use.

## Troubleshooting

### The Skill does not load when expected

Improve the Skill description. The bot uses name and description to decide whether to load the Skill.

### Validation fails

Open Advanced details and inspect `SKILL.md`, `scripts/index.ts`, and `package.json`. Fix schema, export, dependency, or front matter errors, then validate again.

### The test agent is disabled

The Skill must be published, executable, and have all required env and secret bindings saved.

### The Skill cannot be enabled in the widget

Check whether it is published, customer-facing, and has all required settings saved. Also confirm the bot plan supports Skills and has available Skill slots.

### Runtime calls fail

Open the Logs tab, expand the failed event, and send it to the builder with **Fix in builder**. Common causes are missing metadata, API auth errors, network policy restrictions, timeout limits, or unexpected upstream response formats.

### A Skill returns too much data

Update the function output schema to return only fields the bot needs. For files or large outputs, publish an artifact and return the artifact URL and metadata.

## Recommended Authoring Standards

- Keep `SKILL.md` concise and operational.
- Use reference files for long guidance.
- Use code for API logic, not markdown instructions.
- Use Zod schemas for every executable function.
- Keep function inputs small and deliberate.
- Return structured JSON only.
- Prefer official SDKs when they are lightweight and compatible.
- Avoid native dependencies or libraries that require system-level bindings.
- Use bindings instead of hard-coded customer-specific values.
- Validate before publishing.
- Test after publishing.
- Watch logs after enabling in production.

