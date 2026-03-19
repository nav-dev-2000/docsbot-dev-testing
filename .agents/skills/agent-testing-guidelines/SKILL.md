---
name: agent-testing-guidelines
description: Always load when running tests or deciding how to validate changes. Use when you need the repo’s standard checklist for `npm run test:core`, linting, and selecting focused Vitest runs under `tests/core/**`.
---

# Testing Expectations for Agents

Use these guidelines whenever you are validating changes with `npm run test:core`, `npm run test:core:watch`, `npm run lint`, or by running focused Vitest tests under `tests/core/**`:

- **Default check for most code changes:** run `npm run test:core`.
- **Also run lint for production code changes:** run `npm run lint` after modifying app code, API routes, middleware, services, shared utilities, or constants used by runtime code.
- **When changing a covered area, start narrow:** run the most relevant file(s) first with `npx vitest run tests/core/<file>.test.js`, then finish with `npm run test:core`.
- **When to add or update tests:**
  - Add/extend tests when changing `src/pages/api/**`, `src/middleware/**`, `src/services/**`, `src/utils/**`, or shared logic in `src/lib/**`.
  - Prefer runtime handler tests for API routes that verify method guards, auth/security checks, and key input/output behavior.
  - Prefer focused unit tests for pure helpers and extracted business-logic helpers.
- **When full manual UI testing is not necessary:** if a change is limited to shared non-UI logic already covered by Vitest and does not alter rendered UI behavior, automated coverage plus lint is usually sufficient.
- **When manual UI testing is still expected:** if you change rendered onboarding/dashboard/pricing UI or user interaction flows, do the relevant UI/manual test in addition to `npm run test:core`.

