---
name: truto-cli-sync-ops
description: Operate Truto integrations with the Truto CLI and this repo's node sync tooling. Use when working on `truto/*.json`, `scripts/truto-sync.js`, Truto sync-job troubleshooting, or when you need quick terminal checks against Truto APIs. Default testing environment is `development` unless the user explicitly requests another environment.
---

# Truto CLI Sync Ops

Use this skill to safely move between local sync-job edits and remote Truto verification.

## Quick defaults

- Default environment: `development`.
- If a repo script only accepts `staging|production` (like `scripts/truto-sync.js`), map development testing to `staging` unless instructed otherwise.
- Never touch production unless the user explicitly asks.

## Workflow

1. Confirm scope: integration type, target environment, and whether change is read-only (inspect) or write (update/create).
2. Validate local config first (`truto/<type>-sync.json`).
3. Run local repo sync command to inspect/update live sync jobs.
4. Use Truto CLI for broader inspection (accounts, integrations, sync jobs, logs) when needed.
5. After every write, immediately read back state (`get`, `runs`, or equivalent) before further edits.

## Repo-first commands

Prefer npm script aliases in this repo:

```bash
npm run truto-sync -- <type> get staging
npm run truto-sync -- <type> update staging
npm run truto-sync -- <type> runs staging 10
npm run truto-sync -- <type> run <run_id> staging
```

Equivalent direct command:

```bash
node scripts/truto-sync.js <type> <action> [args]
```

Actions supported by this repo helper: `create`, `update`, `get`, `run`, `runs`.

## Truto CLI usage

When the Truto CLI is installed (`truto` on PATH), use it for platform-level checks and scripted inspection.

Baseline commands:

```bash
truto --help
truto login
truto whoami
truto profiles use <profile-name>
truto interactive
```

Safe inspection pattern:

```bash
truto <resource> list -o json
truto <resource> get <id> -o json
```

If command shape is uncertain, discover subcommands with `--help` before running write operations.

## Guardrails

- Keep local JSON and remote state in sync; do not assume local edits are live.
- Change one variable at a time while debugging (request shape, transform, destination).
- Capture run IDs after test triggers and inspect them immediately.
- Prefer machine-readable output (`-o json`) for repeatable debugging.
- Document exact commands run in PR notes when changing Truto integrations.

## Common troubleshooting flow

1. `npm run truto-sync -- <type> get staging`
2. Trigger one sync run in app.
3. `npm run truto-sync -- <type> runs staging 5`
4. `npm run truto-sync -- <type> run <run_id> staging`
5. Fix only the failing step, then repeat.

## References

- Truto CLI landing/docs entry: `https://truto.one/cli`
- Repo helper script behavior: `scripts/truto-sync.js`
