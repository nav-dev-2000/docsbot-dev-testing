import { describe, expect, it } from 'vitest'

import {
  formatDomainListInputText,
  normalizeWebSearchAllowedDomains,
} from '@/lib/webSearch'

describe('web search domain input helpers', () => {
  it('formats domain list text like the widget allowed domains field', () => {
    expect(
      formatDomainListInputText(
        'Docs.OpenAI.com example.com   https://foo.bar/docs',
      ),
    ).toBe('Docs.OpenAI.com,example.com,https://foo.bar/docs')
  })

  it('normalizes comma and space separated domain input', () => {
    expect(
      normalizeWebSearchAllowedDomains(
        'Docs.OpenAI.com, example.com https://foo.bar/docs invalid',
      ),
    ).toEqual(['docs.openai.com', 'example.com', 'foo.bar'])
  })
})
