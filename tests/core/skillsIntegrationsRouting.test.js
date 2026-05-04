import { describe, expect, it } from 'vitest'

import {
  getSkillIntegrationPath,
  resolveSkillCategoryNameFromSlug,
  skillCategorySlug,
} from '../../src/lib/skillsIntegrationPaths'

describe('skills library URL helpers', () => {
  it('slugifies category names for URL segments', () => {
    expect(skillCategorySlug('Accounting & Finance')).toBe('accounting-and-finance')
    expect(skillCategorySlug('CRM & Sales')).toBe('crm-and-sales')
    expect(skillCategorySlug('  Helpdesk  ')).toBe('helpdesk')
  })

  it('builds integration paths under /skills/{category}/{slug}', () => {
    expect(
      getSkillIntegrationPath({
        slug: 'loanpro',
        category: 'Accounting & Finance',
      }),
    ).toBe('/skills/accounting-and-finance/loanpro')
  })

  it('resolves category display names from URL segments', () => {
    const records = [
      { slug: 'a', category: 'Accounting & Finance' },
      { slug: 'b', category: 'CRM & Sales' },
    ]
    expect(resolveSkillCategoryNameFromSlug('accounting-and-finance', records)).toBe('Accounting & Finance')
    expect(resolveSkillCategoryNameFromSlug('crm-and-sales', records)).toBe('CRM & Sales')
    expect(resolveSkillCategoryNameFromSlug('nope', records)).toBe(null)
    expect(resolveSkillCategoryNameFromSlug('Bad!!!', records)).toBe(null)
  })
})
