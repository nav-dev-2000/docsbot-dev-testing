---
name: widget-locale-merge
description: >-
  Merges widget locale packs (export default JS modules) into
  src/constants/strings.constants.js. Use when syncing i18n from the widget
  repo, after exporting locale files, or when the user mentions merging widget
  translations, locale directory paths, or strings.constants updates from the
  widget.
---

# Widget locale merge (site ← widget)

## What it does

The script reads every `*.js` file in a locale directory (widget format: `export default { name, isRTL?, labels: { ... } }`), normalizes a few key names to match the site (`ja` file → `jp` locale; split Stripe agent keys → `agentActivityStripeRecentInvoicesAndSubscriptions`), merges into the existing `i18n` object in `src/constants/strings.constants.js`, and rewrites that file.

## Run the merge

Bundled script (path relative to **this skill folder**): `scripts/merge-widget-locales.mjs`.

From the **docsbot-site** repo root (prefix with `.agents/skills/widget-locale-merge/`):

```bash
# Default: ./locales in this repo
node .agents/skills/widget-locale-merge/scripts/merge-widget-locales.mjs

# Widget repo (or any checkout): absolute path
node .agents/skills/widget-locale-merge/scripts/merge-widget-locales.mjs /path/to/widget-repo/path/to/locales

# Same, explicit flag
node .agents/skills/widget-locale-merge/scripts/merge-widget-locales.mjs --locales-dir /path/to/widget-repo/path/to/locales
```

Relative paths are resolved from the **current working directory**, not necessarily the site repo.

npm shortcut:

```bash
npm run merge-widget-locales -- /path/to/widget/locales
```

(Arguments after `--` are passed to the script.)

## Reference file for key discovery

The script uses **`de.js`** in that directory when present (otherwise **`en.js`**, otherwise the first `*.js` name sorted alphabetically) only to infer the full set of widget label keys so canonical ordering and new keys stay in sync. Ensure that directory includes a complete pack for at least one of those.

## After merging — run language checks

Always run these after updating `strings.constants.js`:

1. **Key parity (every locale has the same keys as English)**  
   `node scripts/validate-translations.js`

2. **Vitest locale rules** (non-empty values, allowed English matches, etc.)  
   `npx vitest run tests/core/stringsConstants.test.js`

3. **Full core suite** (recommended before PR)  
   `npm run test:core`

4. **Lint** (constants are production code)  
   `npm run lint`

If `stringsConstants.test.js` fails on “matches English values”, either fix the translation or extend `ALLOWED_ENGLISH_VALUE_MATCHES` in that test when the match is intentional (cognates, loanwords, or locales without a widget pack yet).

## Files

- Script: `scripts/merge-widget-locales.mjs` (repo root is detected by walking up to `src/constants/strings.constants.js`)
- Output (under repo root): `src/constants/strings.constants.js`
