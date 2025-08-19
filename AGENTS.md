# Rules for Feature Updates

- Always add noteworthy new product features and improvements to `src/constants/featureUpdates.constants.js`. Skip small UX improvents or bug fixes.
- Keep the list ordered descending by `date` (newest first). Use ISO format `YYYY-MM-DD`.
- Each entry must contain: `date`, `title`, `description`.
- Keep descriptions concise (<= 140 chars when possible). Avoid marketing fluff.
- Do not remove past entries; append new ones.