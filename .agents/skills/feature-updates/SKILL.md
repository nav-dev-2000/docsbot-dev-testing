---
name: feature-updates
description: Guidelines for maintaining the product feature updates list. Use when this branch has added new product features or noteworthy improvements, not bug fixes.
---
- Add new product features and noteworthy improvements by creating a JSON file in `src/constants/feature-updates/`. Skip small UX improvements or bug fixes.
- **File naming:** `YYYY-MM-DD-slugified-title.json` (e.g. `2026-03-18-gpt-5-4-mini.json`). Use slug from title; if a file already exists for that date+slug, append `-2`, `-3`, etc.
- **File format:** Each file must contain `date` (ISO `YYYY-MM-DD`), `title`, and `description`. Keep descriptions concise (<= 140 chars when possible).
- **Optional link:** Add `href` to make the "Details" link render in the notifications menu. Use an internal path (must start with `/`) or a full `https://...` URL for external pages.
- Do **not** log catalog or data maintenance work (e.g. updates to `llms.constants.js`) as feature updates.
- Dashboard UI-only tweaks are small UX updates and should not be logged.
- Do not remove past entries.
- After adding a file, run `npm run feature-updates` to regenerate, or rely on `npm run dev` (runs generator at start). The generated output is `public/feature-updates.json` (gitignored).
- If you ship a feature behind a flag or gradual rollout, still add an entry with an accurate date of availability.
