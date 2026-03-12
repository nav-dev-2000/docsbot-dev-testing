import { describe, expect, it, vi } from 'vitest'

import {
  SIGNUP_ONBOARDING_CACHE_TTL_MS,
  buildSignupOnboardingCachePayload,
  parseSignupOnboardingCache,
  persistSignupOnboardingCache,
  readSignupOnboardingCache,
  removeSignupOnboardingCache,
  shouldAutoAnalyzeSignupSeed,
} from '@/utils/signupOnboardingCache'
import { SIGNUP_ONBOARDING_CACHE_KEY } from '@/constants/storageKeys.constants'

const createStorage = () => {
  const data = new Map()

  return {
    getItem: vi.fn((key) => data.get(key) ?? null),
    setItem: vi.fn((key, value) => data.set(key, value)),
    removeItem: vi.fn((key) => data.delete(key)),
  }
}

describe('signupOnboardingCache', () => {
  it('builds and persists the signup cache payload used by onboarding', () => {
    const storage = createStorage()
    const timestamp = 1700000000000

    expect(
      buildSignupOnboardingCachePayload({
        usageType: 'support',
        site: 'https://docsbot.ai',
        timestamp,
      }),
    ).toEqual({
      usageType: 'support',
      site: 'https://docsbot.ai',
      timestamp,
    })

    persistSignupOnboardingCache(storage, {
      usageType: 'support',
      site: 'https://docsbot.ai',
      timestamp,
    })

    expect(storage.setItem).toHaveBeenCalledWith(
      SIGNUP_ONBOARDING_CACHE_KEY,
      JSON.stringify({
        usageType: 'support',
        site: 'https://docsbot.ai',
        timestamp,
      }),
    )
  })

  it('marks malformed and expired cache entries for cleanup', () => {
    expect(
      parseSignupOnboardingCache({
        storedValue: '{bad json',
      }),
    ).toEqual({
      cache: null,
      shouldClear: true,
    })

    expect(
      parseSignupOnboardingCache({
        storedValue: JSON.stringify({
          usageType: 'support',
          site: 'https://docsbot.ai',
          timestamp: 100,
        }),
        now: 100 + SIGNUP_ONBOARDING_CACHE_TTL_MS + 1,
      }),
    ).toEqual({
      cache: null,
      shouldClear: true,
    })
  })

  it('reads valid cache entries and can clear them explicitly', () => {
    const storage = createStorage()
    storage.setItem(
      SIGNUP_ONBOARDING_CACHE_KEY,
      JSON.stringify({
        usageType: 'research',
        site: 'https://docsbot.ai/docs',
        timestamp: 500,
      }),
    )

    expect(readSignupOnboardingCache(storage, { now: 500 })).toEqual({
      cache: {
        usageType: 'research',
        site: 'https://docsbot.ai/docs',
        timestamp: 500,
      },
      shouldClear: false,
    })

    removeSignupOnboardingCache(storage)
    expect(storage.removeItem).toHaveBeenCalledWith(
      SIGNUP_ONBOARDING_CACHE_KEY,
    )
  })

  it('auto-starts onboarding analysis only when the signup seed is still actionable', () => {
    const cache = {
      usageType: 'support',
      site: 'https://docsbot.ai',
    }

    expect(
      shouldAutoAnalyzeSignupSeed({
        cache,
        autoAnalysisTriggered: false,
        isAnalyzing: false,
        useManualEntry: false,
        currentStep: 0,
      }),
    ).toBe(true)

    expect(
      shouldAutoAnalyzeSignupSeed({
        cache,
        autoAnalysisTriggered: true,
        currentStep: 0,
      }),
    ).toBe(false)

    expect(
      shouldAutoAnalyzeSignupSeed({
        cache,
        isAnalyzing: true,
        currentStep: 0,
      }),
    ).toBe(false)

    expect(
      shouldAutoAnalyzeSignupSeed({
        cache,
        useManualEntry: true,
        currentStep: 0,
      }),
    ).toBe(false)

    expect(
      shouldAutoAnalyzeSignupSeed({
        cache,
        currentStep: 2,
      }),
    ).toBe(false)
  })
})
