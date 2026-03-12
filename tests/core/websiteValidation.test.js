import { describe, expect, it } from 'vitest'

import {
  ensureUrlHasProtocol,
  isBlockedDomain,
  usageTypeToPromptKey,
  validateBusinessUrl,
  validateWebsiteInput,
  WEBSITE_PATH_WARNING_COPY,
} from '@/utils/websiteValidation'

describe('websiteValidation', () => {
  it('adds https when a protocol is missing', () => {
    expect(ensureUrlHasProtocol('docsbot.ai')).toBe('https://docsbot.ai')
  })

  it('rejects URLs with embedded credentials', () => {
    expect(validateBusinessUrl('https://user:secret@docsbot.ai')).toEqual({
      valid: false,
      error: 'URLs with authentication credentials are not allowed.',
    })
  })

  it('rejects blocked business domains including subdomains', () => {
    expect(isBlockedDomain('support.youtube.com')).toBe(true)
    expect(validateWebsiteInput('youtube.com')).toEqual({
      valid: false,
      error: 'youtube.com is not allowed. Please enter your business website URL.',
    })
  })

  it('normalizes valid domains and flags deep paths for onboarding guidance', () => {
    expect(WEBSITE_PATH_WARNING_COPY).toContain('main website domain')

    expect(validateWebsiteInput('docsbot.ai/pricing/enterprise')).toEqual({
      valid: true,
      normalizedUrl: 'https://docsbot.ai/pricing/enterprise',
      hasPathWarning: true,
      hostname: 'docsbot.ai',
    })
  })

  it('maps usage types to the correct starter prompt keys', () => {
    expect(usageTypeToPromptKey('support')).toBe('CUSTOMER_SUPPORT')
    expect(usageTypeToPromptKey('research')).toBe('AI_AGENT')
    expect(usageTypeToPromptKey('content')).toBe('COPYWRITER')
    expect(usageTypeToPromptKey('unknown')).toBeNull()
  })
})
