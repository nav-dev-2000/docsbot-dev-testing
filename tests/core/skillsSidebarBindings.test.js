import { describe, expect, it } from 'vitest'

import { buildBindingsHelpPrompt } from '@/lib/skills-bindings-help'

describe('skills sidebar bindings helper', () => {
  it('builds one helper prompt covering env bindings and secrets', () => {
    const prompt = buildBindingsHelpPrompt({
      envBindings: [
        { envVar: 'WORKSPACE_ID', value: 'workspace-123' },
        { envVar: 'TENANT_ID', value: 'tenant-456' },
      ],
      secretBindings: [{ envVar: 'SERVICE_API_KEY', secret: '' }],
    })

    expect(prompt).toContain('Environment values: WORKSPACE_ID, TENANT_ID.')
    expect(prompt).toContain('Secrets: SERVICE_API_KEY.')
    expect(prompt).toContain('For each environment value')
    expect(prompt).toContain('For each secret')
  })

  it('returns an empty prompt when there are no bindings', () => {
    expect(buildBindingsHelpPrompt()).toBe('')
  })
})
