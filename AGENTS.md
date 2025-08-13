# Rules for Feature Updates

- Always add new product features and noteworthy improvements to `src/constants/featureUpdates.constants.js`.
- Keep the list ordered descending by `date` (newest first). Use ISO format `YYYY-MM-DD`.
- Each entry must contain: `date`, `title`, `description`.
- Keep descriptions concise (<= 140 chars when possible). Avoid marketing fluff.
- Do not remove past entries; append new ones.
- If you ship a feature behind a flag or gradual rollout, still add an entry with an accurate date of availability.