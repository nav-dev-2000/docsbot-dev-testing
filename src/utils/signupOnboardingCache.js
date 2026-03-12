import { SIGNUP_ONBOARDING_CACHE_KEY } from '@/constants/storageKeys.constants'

export const SIGNUP_ONBOARDING_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export const buildSignupOnboardingCachePayload = ({
  usageType,
  site = null,
  timestamp = Date.now(),
} = {}) => {
  if (!usageType) return null

  return {
    usageType,
    site: site || null,
    timestamp,
  }
}

export const persistSignupOnboardingCache = (
  storage,
  { usageType, site = null, timestamp = Date.now() } = {},
) => {
  const payload = buildSignupOnboardingCachePayload({
    usageType,
    site,
    timestamp,
  })

  if (!storage || !payload) return null

  storage.setItem(SIGNUP_ONBOARDING_CACHE_KEY, JSON.stringify(payload))
  return payload
}

export const removeSignupOnboardingCache = (storage) => {
  if (!storage) return
  storage.removeItem(SIGNUP_ONBOARDING_CACHE_KEY)
}

export const parseSignupOnboardingCache = ({
  storedValue,
  now = Date.now(),
  ttlMs = SIGNUP_ONBOARDING_CACHE_TTL_MS,
} = {}) => {
  if (!storedValue) {
    return { cache: null, shouldClear: false }
  }

  try {
    const parsed = JSON.parse(storedValue)
    if (
      typeof parsed?.timestamp === 'number' &&
      now - parsed.timestamp > ttlMs
    ) {
      return { cache: null, shouldClear: true }
    }

    return { cache: parsed, shouldClear: false }
  } catch {
    return { cache: null, shouldClear: true }
  }
}

export const readSignupOnboardingCache = (
  storage,
  options = {},
) => {
  if (!storage) {
    return { cache: null, shouldClear: false }
  }

  return parseSignupOnboardingCache({
    storedValue: storage.getItem(SIGNUP_ONBOARDING_CACHE_KEY),
    ...options,
  })
}

export const shouldAutoAnalyzeSignupSeed = ({
  cache,
  autoAnalysisTriggered = false,
  isAnalyzing = false,
  useManualEntry = false,
  currentStep = 0,
} = {}) => {
  return Boolean(
    cache?.site &&
      String(cache.site).trim() &&
      cache?.usageType &&
      !autoAnalysisTriggered &&
      !isAnalyzing &&
      !useManualEntry &&
      currentStep === 0,
  )
}
