---
name: truto-sync-jobs
description: Edit, push, and debug Truto sync jobs in this repo. Use when working on files in `truto/*.json`, `src/lib/truto.js`, Truto sync-job runs, webhook payloads, or Zoho/Freshdesk/Zendesk sync behavior.
---

# Truto Sync Jobs

## Purpose

Use this skill when an agent needs to:

- update a Truto sync job definition in `truto/*.json`
- change sync job args in `src/lib/truto.js`
- push local sync-job changes to Truto staging or production
- debug Truto run failures, empty results, mapping problems, or bad resource/method combinations

## Core workflow

1. Edit the local sync config in `truto/<type>-sync.json`.
2. If needed, update runtime args in `src/lib/truto.js`.
3. Push the config to Truto:

```bash
node scripts/truto-sync.js <type> update staging
```

4. Verify the live remote config:

```bash
node scripts/truto-sync.js <type> get staging
```

5. Re-run the source sync in the app or trigger the Truto run externally.
6. Inspect the run and local webhook logs before changing more code.

## Useful commands

Get a live sync job:

```bash
node scripts/truto-sync.js zohodesk get staging
```

Update a live sync job:

```bash
node scripts/truto-sync.js zohodesk update staging
```

Fetch a specific run:

```bash
node scripts/truto-sync.js zohodesk run RUN_ID_HERE staging
```

List recent runs for a sync job:

```bash
node scripts/truto-sync.js zohodesk runs staging 10
```

Debug a specific run after a source sync:

```bash
node scripts/truto-sync.js zohodesk run RUN_ID_HERE staging
```

Inspect recent runs while iterating on a fix:

```bash
node scripts/truto-sync.js zohodesk runs staging 5
```

## Debugging checklist

### 1. Separate config problems from data problems

- First check the remote job returned by `node scripts/truto-sync.js <type> get staging`.
- Do not assume a local JSON edit is active until the remote job shows it.

### 2. Read run stats before guessing

Look at `resource_stats` in the sync-job run.

- If a request shows `fetched > 0`, that request worked.
- If files stay empty after successful fetches, the problem is downstream mapping, transform logic, or destination upload.

### 3. Inspect the local webhook log

The local dev server logs:

- `sync_job_run:started`
- `sync_job_run:record_error`
- `sync_job_run:completed`

These logs usually reveal:

- exact `resource` and `method`
- the run args used
- remote integration errors such as `URL_NOT_FOUND`
- whether Firebase storage stayed empty after completion

### 4. Prefer isolation

When testing a suspected fix, change one variable at a time:

- transform only
- mapping only
- request shape only
- destination only

Do not combine multiple experiments in one run unless necessary.

## Truto-specific notes

### Remote job source of truth

- `truto/*.json` is only the local source file.
- The live behavior comes from the remote Truto sync job after `update`.

### Common failure patterns

- `Unified Model not found`
  - request shape is wrong for that `resource`/`method`
- `Resource <name> not found for integration <integration>`
  - the `resource` is not valid for that integration runtime
- `fetched > 0, persisted = 0`
  - request worked; a later step dropped records

### Prefer request-side filtering over transform-side filtering

If the integration supports a server-side filter, prefer that over a Truto transform.

Reason:

- Truto transform behavior can differ by resource shape
- list responses may be wrapped or iterated per-record depending on the integration
- request-side filters are easier to reason about from run stats

## Zoho Desk notes

### Working tickets search shape

For Zoho dated ticket search, use:

- `resource: "tickets-search"`
- `method: "list"`
- query fields:
  - `status`
  - `createdTimeRange`

Example:

```json
{
  "type": "request",
  "name": "list-tickets",
  "resource": "tickets-search",
  "method": "list",
  "query": {
    "status": "Closed",
    "createdTimeRange": "{{args.start_date}},2099-12-31T23:59:59.000Z"
  },
  "integrated_account_id": "{{args.integrated_account_id}}"
}
```

### Zoho search result shape

Relevant fields from `tickets-search` results:

- `id`
- `subject`
- `description`
- `webUrl`
- `createdTime`

Do not assume Freshdesk/Zendesk-style fields like `name`, `ticket_url`, or `created_at`.

### Transform to request chaining

When you flatten a request result and the next step is another `request`:

- do not insert an `add_context` step between the transform and the next `request`
- `add_context` is meant to extract values from a direct request result, not from a transform output
- make the next `request` depend on the transform step directly
- for per-record access after a transform, reference the current record from the resource path in the next request query
- example: `{{resources.tickets-search.id}}`

Example:

```json
{
  "name": "flatten",
  "type": "transform",
  "depends_on": "list-tickets",
  "config": {
    "expression": "resources.`tickets-search`.result"
  }
}
```

```json
{
  "type": "request",
  "name": "comments",
  "resource": "ticketing/comments",
  "method": "list",
  "depends_on": "flatten",
  "query": {
    "ticket_id": "{{resources.tickets-search.id}}"
  },
  "integrated_account_id": "{{args.integrated_account_id}}"
}
```

### Direct request to context chaining

When a later `request`, `transform`, or `destination` needs stable fields from a direct request result:

- it is valid to use `add_context` immediately after the direct request
- this is useful for carrying fields like `ticket_id`, `subject`, `description`, or derived URLs into later steps
- for Zoho Desk, prefer this pattern when later transforms or upload metadata need ticket fields after the comments request runs
- for ticket-style syncs, keep the follow-up comments request chained to the original list request, not to the `add_context` step
- use `add_context` to carry metadata forward, while the follow-up request reads its record key directly from the original request resource path

## Safe debugging strategy

1. Verify the raw Truto endpoint manually if needed.
2. Mirror that request shape in the sync job.
3. Push the sync job.
4. Run once.
5. Inspect `resource_stats`.
6. Only then change downstream transforms or destination logic.

## Avoid

- assuming proxy HTTP paths map directly to sync-job `resource` names
- relying on transform filters before proving the request resource shape works
- changing both mapping and filtering in the same experiment when debugging empty results
