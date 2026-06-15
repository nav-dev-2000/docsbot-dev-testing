import { describe, expect, it } from 'vitest'

import {
  decrementNonNegativeCount,
  incrementNonNegativeCount,
  sumNonNegativeCounts,
  toNonNegativeCount,
} from '@/lib/nonNegativeCounts'

describe('non-negative count helpers', () => {
  it('normalizes invalid and negative persisted counts to zero', () => {
    expect(toNonNegativeCount(-3268)).toBe(0)
    expect(toNonNegativeCount(null)).toBe(0)
    expect(toNonNegativeCount('not-a-count')).toBe(0)
  })

  it('never lets decrements go below zero', () => {
    expect(decrementNonNegativeCount(2, 3268)).toBe(0)
    expect(decrementNonNegativeCount(-3, 1)).toBe(0)
  })

  it('treats missing decrement amounts as zero', () => {
    expect(decrementNonNegativeCount(5)).toBe(5)
    expect(decrementNonNegativeCount(5, undefined)).toBe(5)
  })

  it('ignores negative source totals when recomputing counts', () => {
    expect(sumNonNegativeCounts([10, -5, '3', undefined])).toBe(13)
  })

  it('increments from a sanitized current count', () => {
    expect(incrementNonNegativeCount(-4)).toBe(1)
    expect(incrementNonNegativeCount(2, 3)).toBe(5)
  })
})
