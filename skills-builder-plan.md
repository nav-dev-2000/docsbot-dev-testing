# Skills Builder Plan

## Purpose

Build the DocsBot skill builder first. Do not build the runtime skill execution product in this phase beyond the remote test integration the builder needs.

This plan updates the earlier draft with these confirmed decisions:

- Skills live under each bot only.
- The builder UI is chat-first and chat-only for edits.
- Do not allow manual editing of skill title, manifest fields, or code files in the UI.
- Use App Router for the new AI SDK API paths.
- Use an OpenAI Responses API coding model for the builder agent.
- Enable OpenAI built-in web search for the builder agent.
- Use the OpenAI Responses built-in shell tool for actual code authoring.
- Use our remote Cloudflare worker test endpoint as the validation/runtime test tool.
- Customer-facing skills do not require private metadata bindings, but the builder should warn when executable actions appear unsafe for public users.
- Secrets are stored in the skill manifest using the existing DocsBot encryption flow.

## Current repo implementation touchpoints

Use these existing files as the primary integration points when implementing the builder:

- `src/lib/botRoutes.js`
  - add `skills` to the valid `configure` controls
- `src/pages/app/bots/[botId]/[[...slug]].jsx`
  - add the `Configure -> Skills` menu entry
  - render the new builder page in the configure content map
- `src/components/new-dashboard/PageConfigure/index.jsx`
  - export `PageConfigure.Skills`
- `src/components/new-dashboard/PageConfigure/Configure.Skills.jsx`
  - new builder surface component
- `src/lib/encryption.js`
  - use the existing `encryptKey` flow when persisting manifest `secretBindings`

## Core Product Decisions

### Builder scope

This feature builds and validates skill bundles. It does not expose manual file editing, manual schema editing, or a local script editor.

The builder should:

1. Create a new skill draft under a bot.
2. Let the agent author or revise the skill bundle through chat.
3. Show the generated files and manifest state as read-only output.
4. Test the bundle remotely through the Cloudflare runtime.
5. Publish the bundle only after the draft passes validation.

### Bot-only storage model

Skills are stored per bot only.

Firestore path:

```text
teams/{team_id}/bots/{bot_id}/skills/{skill_name}
```

R2 prefix:

```text
{team_id}/{bot_id}/{skill_name}/
```

No team-global skill library is needed in this phase.

### Chat-only editing

All mutable actions go through the builder agent. The UI should not expose direct text editing for:

- skill title
- manifest values
- `SKILL.md`
- `scripts/index.ts`
- helper modules
- references

The Files and Manifest areas should be read-only inspection surfaces that mirror the current draft state produced by the agent.

## UX Plan

### Configure Skills entry

Add a new `Skills` item under `Configure`.

The user flow:

1. Open `Configure -> Skills`
2. Click `Create New Skill`
3. Fill a small setup form:
   - skill name
   - internal-only vs customer-facing
   - markdown-only vs executable
4. Open the skill builder workspace
5. Use chat to describe the skill and iterate on it

### Builder layout

Use a list/detail layout.

Left rail:

- existing bot skills
- `Create New Skill`

Main area tabs:

1. `Chat`
2. `Files`
3. `Manifest`
4. `Functions`
5. `Validation`
6. `Live Test`
7. `Publish`

Only the Chat tab is editable. The other tabs are read-only views of agent-produced state and test results.

### Read-only tabs

#### Files

Show the generated bundle tree and file contents. No manual editing controls.

#### Manifest

Show the derived and persisted manifest object. No manual field editing controls.

#### Functions

Show discovered exported functions from `/test`.

#### Validation

Show Cloudflare test results, extracted frontmatter, bundle warnings, and blocking errors.

#### Live Test

Show activation tests, function tests, and logs from the remote test flow.

#### Publish

Show readiness state and publish action only when validation passes.

## Architecture Plan

### UI routing

Use the existing dashboard page for the visual builder surface, but use App Router for the new AI SDK-backed API handlers.

Recommended split:

- Dashboard page remains in the current bot UI surface.
- New server endpoints live under `src/app/api/**`.

Recommended API shape:

```text
src/app/api/teams/[teamId]/bots/[botId]/skills/
  drafts/route.ts
  [skillName]/
    agent/route.ts
    test/route.ts
    publish/route.ts
    live-test/route.ts
```

This allows the app to keep the current Pages Router dashboard while using App Router route handlers where AI SDK support is cleaner.

### Builder agent runtime

The builder agent should be implemented as an AI SDK-based chat endpoint backed by the OpenAI Responses API.

Use:

- AI SDK transport and streaming response handling
- an OpenAI Responses model suitable for high-quality coding
- built-in web search enabled
- built-in shell enabled

The builder agent should not use custom file-write tools for code generation. The shell tool is the primary authoring mechanism.

### Why shell is the primary coding interface

The agent needs to create and revise:

- `SKILL.md`
- `scripts/index.ts`
- helper files under `scripts/**`
- `references/*.md`
- optional `package.json`

Those files should be authored inside an isolated draft workspace using the Responses shell tool. After each successful shell step, the server should diff and sync the changed files back into the draft state.

This matches the desired behavior:

- actual coding happens through the model's coding tool
- the UI stays chat-only
- the builder remains deterministic about which files changed

### Built-in tools to enable

#### OpenAI built-in web search

Enable built-in web search for:

- framework examples
- API docs
- schema lookups
- policy/reference discovery during skill authoring

This should be on by default for the builder agent.

#### OpenAI built-in shell

Enable the built-in shell tool for:

- writing files
- reorganizing bundle folders
- generating `package.json` when needed
- running lightweight inspections inside the ephemeral skill workspace

All skill file creation should happen through this tool, not through manual UI editors.

## Custom host tools

Use a small set of host tools in addition to the built-in OpenAI tools.

### 1. `load_skill_builder_context`

Return:

- current draft manifest
- current file tree
- skill bundle spec summary
- prior validation/test results
- audience mode
- skill type mode

The agent should call this first.

### 2. `update_skill_manifest`

Use this to update non-file metadata that belongs in the manifest object, such as:

- `name`
- `description`
- `internal`
- `enabled`
- `networkPolicy`
- `secretBindings`
- `metadataBindings`

This tool should be the only way the agent changes manifest state.

When storing secret values, this tool should call the existing DocsBot encryption function before persistence.

### 3. `sync_shell_workspace`

After shell-based code authoring, read the allowed files from the ephemeral workspace and sync them back into the server-side draft state.

Allowed paths:

- `SKILL.md`
- `scripts/**`
- `references/**`
- `assets/**`
- `package.json`
- `.docsbot/bundle/index.js`

This tool must reject any path outside the skill bundle root.

### 4. `test_skill_remote`

Call the remote Cloudflare worker test endpoint with the current draft files.

Use it for:

- bundle validation
- function extraction
- bundle artifact generation

This tool should write returned bundle output into:

```text
.docsbot/bundle/index.js
```

### 5. `run_live_skill_test`

Run the builder's live remote test flow after structural validation passes.

Use it to:

- activate the skill
- inspect the compact function index
- optionally describe/call a function
- verify policy behavior

### 6. `publish_skill`

Persist the final bundle to R2 and save the manifest when validation passes.

## Draft workspace model

### Ephemeral shell workspace

Each skill draft should materialize into an isolated temporary workspace on the server.

The shell tool should only see the draft bundle files, not the full app repository.

Recommended shape inside the ephemeral workspace:

```text
/tmp/skills-builder/{draft_id}/
  SKILL.md
  scripts/
  references/
  assets/
  package.json
  .docsbot/bundle/index.js
```

This keeps the coding agent focused and reduces accidental edits outside the skill scope.

### Source of truth

The builder server keeps the source of truth for the draft bundle. The shell workspace is a temporary projection of that draft.

Flow:

1. materialize draft into workspace
2. model uses shell
3. server syncs changed files back into draft state
4. `/test` runs against current draft files

## Skill authoring rules

### Supported skill types

#### Markdown-only skills

Supported as a first-class option.

Required:

- `SKILL.md`

Optional:

- `references/*.md`
- `assets/*`

Not required:

- `scripts/index.ts`
- `package.json`
- `.docsbot/bundle/index.js`

#### Executable skills

Required:

- `SKILL.md`
- `scripts/index.ts`

Optional:

- `scripts/**`
- `references/*.md`
- `assets/*`
- `package.json`

Generated during test:

- `.docsbot/bundle/index.js`

### One entrypoint rule

Executable skills support exactly one public executable entrypoint:

```text
scripts/index.ts
```

Helper code may exist under `scripts/**`, but only exports from `scripts/index.ts` are part of the callable surface.

### No manual generic runtime duplication

Keep generic activation and tool-calling instructions in the global builder/runtime prompts, not inside every skill.

## Security and policy plan

### Internal vs customer-facing

This remains a required setup choice when creating the skill.

#### Internal-only skills

These may expose stronger capabilities for team-operated workflows.

#### Customer-facing skills

These are allowed to be executable, but the builder should warn when the skill design appears unsafe for public bot users.

Important: customer-facing skills do not require private metadata bindings. Metadata is optional context, not a hard requirement.

### Customer-facing warnings

For customer-facing executable skills, warn when the draft appears to:

- mutate systems without a clear confirmation flow
- expose privileged internal operations
- call broad admin endpoints
- depend on unrestricted credentials
- use dangerously broad network access

These warnings should guide the user, not necessarily block the draft unless the risk is clearly severe.

### Secrets

Secrets are stored through the existing DocsBot encrypted manifest storage model.

Builder behavior:

- never write secrets into bundle files
- never expose decrypted secrets to the model
- save encrypted values in `secretBindings`
- instruct skill code to use placeholders like `{{API_TOKEN}}`

### Metadata bindings

Metadata bindings remain supported for contextual scoping such as:

- `customerId`
- `orderId`
- `accountId`

They are useful for safer customer-facing skills, but they are not mandatory in this phase.

## Test and validation plan

### Validation path

The builder should call the remote Cloudflare `/test` capability:

- after agent-generated changes
- on explicit Test
- on Save
- on Publish

The builder should block publish when validation returns `valid: false`.

### What the remote test returns

The builder should expect:

- frontmatter validation
- function discovery
- warning/error output
- resource summary
- generated `.docsbot/bundle/index.js`

### Live test path

After `/test` succeeds, the builder may run a live remote test flow:

1. stage draft bundle
2. stage manifest
3. activate skill
4. optionally inspect functions
5. optionally execute a sample function
6. surface logs/results in the UI

### Builder validation categories

1. Bundle validation
2. Activation test
3. Function discovery test
4. Function execution test
5. Reference discovery test
6. Policy/risk warning test

## System prompt plan

### Builder system prompt goals

The builder system prompt should tell the model:

- it is building DocsBot skills, not generic apps
- it should prefer concise `SKILL.md` instructions
- it should use markdown references for long-form material
- it should use TypeScript for executable skills
- it should use the shell tool for all file authoring
- it should use web search when docs/examples are needed
- it should update manifest data through the manifest tool
- it should run remote validation after meaningful changes
- it should warn when a customer-facing skill appears too privileged
- it should support markdown-only skills without creating scripts

### Prompt inputs

Pass these structured values into the system prompt or developer context:

- team id
- bot id
- draft skill name
- skill mode: markdown-only or executable
- audience mode: internal or customer-facing
- current manifest
- current file tree
- existing validation results
- remote runtime capabilities

### Important builder-specific instruction

Include an explicit rule like:

> The chat interface is the only editing surface. Do not ask the user to manually edit files or metadata. Use the shell tool to author bundle files and use the provided manifest/test tools for non-file state and validation.

## Recommended implementation phases

### Phase 1: route and page shell

- Add `Configure -> Skills`
- Add the skill list/detail workspace shell
- Add chat-first layout
- Keep other tabs read-only

### Phase 2: draft model and storage

- Create draft manifest/files state
- Materialize ephemeral shell workspace
- Sync shell workspace back into draft state

### Phase 3: App Router AI endpoints

- Add App Router route handlers for:
  - draft creation
  - agent chat
  - remote test
  - live test
  - publish

### Phase 4: OpenAI Responses coding agent

- Use a high-quality OpenAI Responses model
- Enable built-in web search
- Enable built-in shell
- Add the small host tool set

### Phase 5: remote validation and function discovery

- wire `/test`
- capture `.docsbot/bundle/index.js`
- surface functions and warnings

### Phase 6: publish flow

- push bundle to R2
- persist manifest
- enable skill

## Non-goals for this phase

- manual code editing UI
- team-global skill templates
- direct local runtime execution inside the app server
- full standalone skill runtime product work beyond what the builder needs to validate remotely

## Final recommendation

Build the skill builder as a chat-only authoring environment where the model uses:

- OpenAI Responses built-in web search for discovery
- OpenAI Responses built-in shell for real code/file authoring
- a small set of host tools for manifest persistence, encryption-backed secrets, draft syncing, remote Cloudflare testing, and publish

Use App Router route handlers for the AI SDK-backed endpoints, keep the draft workspace isolated per skill, and present every non-chat tab as a read-only view of agent-produced state.
