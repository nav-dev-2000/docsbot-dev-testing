# Rules for Feature Updates

- Always add noteworthy new product features and improvements to `src/constants/featureUpdates.constants.js`. Skip small UX improvements or bug fixes.
- Do **not** log catalog or data maintenance work (for example, updates to `src/constants/llms.constants.js`) as feature updates.
- Dashboard UI-only tweaks (icon swaps, label wording, spacing/layout polish, permission-loading visibility behavior) are considered small UX updates and should not be logged as feature updates.
- Keep the list ordered descending by `date` (newest first). Use ISO format `YYYY-MM-DD`.
- Each entry must contain: `date`, `title`, `description`.
- Keep descriptions concise (<= 140 chars when possible). Avoid marketing fluff.
- Do not remove past entries; append new ones.

# Rules for Editing LLM Constants

## Benchmark Keys Standardization

**Before editing `src/constants/llms.constants.js` to add or update benchmark data:**

1. **Always check `src/lib/llms.js` first** - Review the `BENCHMARKS` constant to see what standardized benchmark keys are available.

2. **Use standardized keys** - When adding benchmarks to a model's `benchmarks` object, use the exact camelCase keys from the `BENCHMARKS` constant in `src/lib/llms.js`. Do not create new variations with spaces, dashes, or different naming conventions.

3. **Key naming convention:**
   - Use camelCase for multi-word benchmarks (e.g., `HumanitysLastExam`, `SWEBench`, `TerminalBench`)
   - Remove spaces, dashes, and special characters
   - Convert parentheses to descriptive suffixes (e.g., `AIME2025WithTools` instead of `"AIME2025 (with tools)"`)
   - For version numbers, use underscores (e.g., `MRCRv2_128k`, `OmniDocBench15`)

4. **If a benchmark key doesn't exist** - Add it to the `BENCHMARKS` constant in `src/lib/llms.js` first, then use that standardized key in `llms.constants.js`.

5. **Avoid duplicates** - Check for existing keys that represent the same benchmark (e.g., `HLE` vs `HumanitysLastExam` - use `HumanitysLastExam`).

**Example:**
```javascript
// ✅ CORRECT - Uses standardized key from BENCHMARKS
benchmarks: {
  SWEBench: {
    score: 76.2,
    notes: 'Verified',
    source: 'https://example.com',
  },
  HumanitysLastExam: {
    score: 37.5,
    notes: 'No tools',
    source: 'https://example.com',
  },
}

// ❌ INCORRECT - Uses non-standardized keys
benchmarks: {
  'SWE-Bench': { ... },  // Wrong - has dash
  "Humanity's Last Exam": { ... },  // Wrong - has space and apostrophe
}
```

## Cursor Cloud specific instructions

### Project overview

DocsBot AI is a Next.js 14 (Pages Router) SaaS application. It relies on external managed services (Firebase, Stripe, external bot API at `api.docsbot.ai`) with no local databases or Docker. See `README.md` for full architecture details.

### Running locally

- **Dev server:** `npm run dev` (starts on port 3000)
- **Lint:** `npm run lint`
- **Build:** `npm run build` (runs `prebuild` scripts for sitemap/news generation first)

### Environment setup

- Copy `.env.example` to `.env.local` and fill in values. For cloud agent dev without real credentials, set `DISABLE_HEADLESS=1` to skip the WordPress blog dependency (the blog pages will 404 but the rest of the app works).
- The app requires Firebase, Stripe, and external bot API credentials for full functionality. Without real credentials, public/marketing pages, documentation, models directory, tools, and pricing pages still render correctly.
- No `.nvmrc` or `.node-version` file exists; Node.js 18+ works fine.

### Starting the dev server

The `FIREBASE_SERVICE_ACCOUNT_KEY` secret often contains literal newline characters in the PEM private key. Node.js `JSON.parse` (strict mode) rejects these. Before starting the dev server, fix the env var by replacing literal newlines with `\n` escape sequences. Use the wrapper script:

```bash
bash .dev-start.sh
```

This script re-exports `FIREBASE_SERVICE_ACCOUNT_KEY` with properly escaped newlines, then runs `npm run dev`. Without this fix, any page requiring Firebase server-side auth (e.g. `/login`, `/app/*`) will return 500.

### Test credentials

- `TEST_USERNAME` / `TEST_PASSWORD` environment secrets can be used to log in at `/login` for dashboard testing.

### Key caveats

- The `next.config.js` runs `scripts/generate-sitemap.js` and `scripts/latest-news.js` during server-side webpack builds; these write to `public/` and are safe to ignore.
- The headless WordPress integration (`@headstartwp/next`) is disabled via `DISABLE_HEADLESS=1`; without it, blog routes (`/articles/*`) and WP-sourced docs will fail.
- There are no automated test suites (no Jest, Vitest, Cypress, etc.) in this repo. Linting (`npm run lint`) is the primary automated quality check.
- The `tools/zapier-cli/` directory is a separate Zapier integration package with its own `package-lock.json`; it is independent of the main app.
- Next.js `.env.local` does NOT override system environment variables. If secrets are injected via the VM environment, they take precedence over `.env.local` values.
