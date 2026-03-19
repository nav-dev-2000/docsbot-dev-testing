
## Cursor Cloud specific instructions

### Project overview

DocsBot AI is a Next.js 14 (Pages Router) SaaS application. It relies on external managed services (Firebase, Stripe, external bot API at `api.docsbot.ai`) with no local databases or Docker. See `README.md` for full architecture details.

### Running locally

- **Dev server:** `npm run dev` (starts on port 3000)
- **Lint:** `npm run lint`
- **Build:** `npm run build` (runs `prebuild` scripts for sitemap/news generation first)
- **Core test suite:** `npm run test:core`
- **Watch mode for local iteration:** `npm run test:core:watch`

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
- The main automated regression suite is Vitest under `tests/core/**/*.test.js`. It is intentionally optimized for fast agent/PR feedback and currently covers API surface contracts, selected API runtime flows, auth/team middleware, signup/onboarding/checkout logic, and shared helpers/utilities.
- The `tools/zapier-cli/` directory is a separate Zapier integration package with its own `package-lock.json`; it is independent of the main app.
- Next.js `.env.local` does NOT override system environment variables. If secrets are injected via the VM environment, they take precedence over `.env.local` values.

### Testing expectations for agents
See `.agents/skills/agent-testing-guidelines/` for the full checklist when validating changes with tests/lint/Vitest.
