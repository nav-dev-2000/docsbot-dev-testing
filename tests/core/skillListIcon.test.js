import { describe, expect, it } from 'vitest'

import { skillIconDomainFromNetworkPolicy } from '@/components/SkillListIcon'

describe('skillIconDomainFromNetworkPolicy', () => {
  it('uses the global network policy domain first', () => {
    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: ['api.example.com'] },
        [{ allowedDomains: ['wordpress.org'] }],
      ),
    ).toBe('example.com')
  })

  it('falls back to auth provider domains when global policy has no domains', () => {
    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: [] },
        [{ allowedDomains: ['wordpress.org'] }],
      ),
    ).toBe('wordpress.org')
  })

  it('uses saved env binding values for placeholder hostnames', () => {
    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: ['{{WORDPRESS_HOST}}'] },
        [],
        [{ envVar: 'WORDPRESS_HOST', value: 'myblog.example.com' }],
      ),
    ).toBe('example.com')

    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: [] },
        [{ allowedDomains: ['{{ WORDPRESS_HOST }}'] }],
        [{ envVar: 'WORDPRESS_HOST', value: 'https://wordpress.example.org' }],
      ),
    ).toBe('example.org')
  })

  it('does not use unresolved env placeholder hostnames for favicon domains', () => {
    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: ['{{WORDPRESS_HOST}}'] },
        [],
      ),
    ).toBe('')

    expect(
      skillIconDomainFromNetworkPolicy(
        { allowedDomains: [] },
        [{ allowedDomains: ['{{ WORDPRESS_HOST }}'] }],
        [{ envVar: 'WORDPRESS_HOST', value: '' }],
      ),
    ).toBe('')
  })
})
