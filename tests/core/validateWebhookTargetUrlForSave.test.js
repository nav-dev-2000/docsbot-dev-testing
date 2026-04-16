import { describe, expect, it } from 'vitest'

import { validateWebhookTargetUrlForSave } from '@/lib/validateWebhookTargetUrl'

describe('validateWebhookTargetUrlForSave', () => {
  it('rejects empty or non-http(s) input', async () => {
    expect((await validateWebhookTargetUrlForSave('')).ok).toBe(false)
    expect((await validateWebhookTargetUrlForSave('ftp://x.com/')).ok).toBe(false)
  })

  it('rejects docsbot hostnames', async () => {
    const r = await validateWebhookTargetUrlForSave('https://docsbot.ai/hook')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.message).toMatch(/docsbot/i)
    }
  })

  it('rejects loopback and private targets', async () => {
    expect((await validateWebhookTargetUrlForSave('http://127.0.0.1/cb')).ok).toBe(
      false,
    )
    expect((await validateWebhookTargetUrlForSave('https://10.0.0.1/')).ok).toBe(
      false,
    )
  })

  it('accepts a public https URL', async () => {
    const r = await validateWebhookTargetUrlForSave('https://example.com/webhook')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.normalizedUrl).toContain('example.com')
    }
  })
})
