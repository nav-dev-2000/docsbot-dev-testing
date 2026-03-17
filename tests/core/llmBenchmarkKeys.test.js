import { describe, expect, it } from 'vitest'

import { BENCHMARKS } from '@/lib/llms'
import { LLMS } from '@/constants/llms.constants'

/**
 * Collects all benchmark keys used across all models in llms.constants.js
 */
function getAllBenchmarkKeys() {
  const keys = new Set()
  for (const model of LLMS) {
    if (model.benchmarks && typeof model.benchmarks === 'object') {
      for (const key of Object.keys(model.benchmarks)) {
        keys.add(key)
      }
    }
  }
  return [...keys]
}

/**
 * Finds BENCHMARKS keys that are a prefix of the invalid key (for suggestion)
 */
function getPrefixSuggestions(invalidKey) {
  const validKeys = Object.keys(BENCHMARKS)
  return validKeys.filter((valid) => invalidKey.startsWith(valid) && valid !== invalidKey)
}

describe('LLM benchmark keys validation', () => {
  it('all benchmark keys in llms.constants.js must exist in BENCHMARKS', () => {
    const usedKeys = getAllBenchmarkKeys()
    const validKeys = new Set(Object.keys(BENCHMARKS))
    const invalidKeys = usedKeys.filter((key) => !validKeys.has(key))

    if (invalidKeys.length === 0) {
      return
    }

    const messages = invalidKeys.map((key) => {
      const suggestions = getPrefixSuggestions(key)
      let msg = `"${key}" key does not exist in BENCHMARKS`
      if (suggestions.length > 0) {
        msg += `. Did you mean ${suggestions.map((s) => `"${s}"`).join(' or ')}?`
      }
      msg += ` (add to BENCHMARKS in src/lib/llms.js if this is a new benchmark)`
      return msg
    })

    expect(
      invalidKeys,
      `Invalid benchmark keys found:\n${messages.join('\n')}`,
    ).toEqual([])
  })
})
