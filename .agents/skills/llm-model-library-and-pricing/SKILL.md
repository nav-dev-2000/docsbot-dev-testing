---
name: llm-model-library-and-pricing
description: Maintain the LLM model library, pricing data, benchmark keys, and model retirement redirects in `src/constants/llms.constants.js`, `src/constants/llmPricing.constants.js`, `src/lib/llms.js`, and `next.config.js`. Use this skill when adding, updating, pricing, benchmarking, or retiring models in the model library.
---
## Model Library Maintenance

Use this skill when adding, updating, pricing, benchmarking, or retiring models in the model library.

### Core Files

- `src/constants/llms.constants.js`: canonical model library entries.
- `src/constants/llmPricing.constants.js`: pricing-page rows for currently promoted models.
- `src/lib/llms.js`: provider metadata and the `BENCHMARKS` registry.
- `next.config.js`: generates permanent 301 redirects from model `redirect_to` fields.

### Adding A New Model

1. **Research first.** Gather model specs, pricing, release date, context/output limits, modalities, capabilities, benchmark values, and source URLs from the internet. Prefer primary sources: provider announcement posts, official docs, official model cards, and official pricing pages.

2. **Copy the latest previous model object.** Start from the newest comparable model in the same family/provider, then adapt the copy. Preserve local field style and only change values that are actually different.

3. **Update benchmark keys deliberately.** Check `src/lib/llms.js` before adding benchmark data. Use existing `BENCHMARKS` keys when possible. If a benchmark is genuinely new, add a standardized key to `BENCHMARKS` first, then use that exact key in `llms.constants.js`.

4. **Update pricing when appropriate.** Add or update `src/constants/llmPricing.constants.js` only for models that should appear on the pricing page. The pricing page should emphasize current, promoted model generations rather than every legacy point release.

5. **Retire older models.** Add `redirect_to` fields to older models that are more than one generation behind. The usual target is the latest comparable model in the same family and tier. See Retirement policy below.

6. **Validate.** Run focused model-library tests and whitespace checks before finishing.

### Benchmark Key Rules

- Use the exact camelCase keys from `BENCHMARKS` in `src/lib/llms.js`.
- Do not create ad hoc benchmark keys with spaces, dashes, apostrophes, or inconsistent capitalization.
- Remove punctuation and convert names to descriptive camelCase, such as `HumanitysLastExam`, `SWEBench`, `TerminalBench`.
- Convert parenthetical variants to suffixes, such as `AIME2025WithTools`.
- Use underscores for version/range details where that pattern already exists, such as `MRCRv2_128k` and `OpenAIMRCRv2Needle512K_1M`.
- Avoid duplicate concepts. For example, use `HumanitysLastExam` instead of adding `HLE`.

Example:

```javascript
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
```

Avoid:

```javascript
benchmarks: {
  'SWE-Bench': { ... },
  "Humanity's Last Exam": { ... },
}
```

### Retirement Redirects

Models are retired by adding `redirect_to` to their object in `src/constants/llms.constants.js`:

```javascript
{
  model_name: 'Old Model',
  slug: 'old-model',
  redirect_to: 'new-model',
  provider: 'provider',
  ...
}
```

`next.config.js` reads `LLMS`, finds entries with `redirect_to`, and generates permanent redirects:

- `/models/:oldSlug` -> `/models/:newSlug`
- `/models/compare/:oldSlug/:model2` -> `/models/compare/:newSlug/:model2`
- `/models/compare/:model1/:oldSlug` -> `/models/compare/:model1/:newSlug`

These redirects are permanent 301 redirects and prevent retired model URLs from becoming 404s.

### Retirement Policy

- Retire older models that are more than one generation behind.
- Redirect within the same family and tier when possible, such as old Opus models to the newest Opus model, old Sonnet models to the newest Sonnet model, and old mini models to the newest comparable mini model.
- OpenAI is the exception: keep two major GPT generations live. For example, when GPT-5 is current, keep GPT-4 family pages that are still strategically relevant, such as `GPT-4o` and `GPT-4.1`, while retiring older GPT-3.5, GPT-4 base/Turbo, o-family, and Codex-specific pages to the current GPT target. Basically we want to keep what is still in popular/active use and supported by the provider.
- Do not redirect the latest live target to itself.

### Validation

Run focused checks after model-library edits:

```bash
npm test -- --run tests/core/llmBenchmarkKeys.test.js tests/core/pricingStripeTableFeatures.test.js
git diff --check
```

For broader changes, also run:

```bash
npm run test:core
npm run lint
```

When changing redirects, sanity-check generated routes:

```bash
DISABLE_HEADLESS=1 node - <<'NODE'
const config = require('./next.config.js')
Promise.resolve(config.redirects()).then((redirects) => {
  console.log(redirects.filter((r) => r.source.includes('old-model')))
})
NODE
```
