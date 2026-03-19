---
name: llm-benchmark-keys-standardization
description: Standardize benchmark keys when editing llms constants. Use when adding or editing models in the model library via `src/constants/llms.constants.js`
---
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
