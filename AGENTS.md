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
