import { describe, expect, it } from 'vitest'

import {
  filterSkillsLibrary,
  SKILLS_LIBRARY_AUDIENCE_CUSTOMER,
  SKILLS_LIBRARY_AUDIENCE_INTERNAL,
  SKILLS_LIBRARY_CAPABILITY_EXECUTABLE,
  SKILLS_LIBRARY_CAPABILITY_MARKDOWN,
  SKILLS_LIBRARY_CATEGORY_ALL,
  SKILLS_LIBRARY_CATEGORY_DEFAULT,
} from '@/lib/skills-library-ui'

const skills = [
  {
    id: 'customer-refunds',
    name: 'customer-refunds',
    description: 'Use when handling refunds and returns.',
    category: 'Customer Support',
    mode: 'markdown',
    internal: false,
  },
  {
    id: 'salesforce-sync',
    name: 'salesforce-sync',
    description: 'Create and update CRM records.',
    category: 'Sales',
    mode: 'executable',
    hasFunctions: true,
    audience: 'internal',
  },
  {
    id: 'shipping-status',
    name: 'shipping-status',
    displayName: 'Shipment Lookup',
    description: 'Check carrier delivery status.',
    category: 'E-Commerce',
    mode: 'markdown',
    audience: 'customer',
  },
]

describe('filterSkillsLibrary', () => {
  it('returns all skills when no query or filter is active', () => {
    expect(filterSkillsLibrary(skills, {}).map((skill) => skill.id)).toEqual([
      'customer-refunds',
      'salesforce-sync',
      'shipping-status',
    ])
  })

  it('matches slug, display name, and description case-insensitively', () => {
    expect(filterSkillsLibrary(skills, { query: 'REFUNDS' }).map((skill) => skill.id)).toEqual([
      'customer-refunds',
    ])
    expect(filterSkillsLibrary(skills, { query: 'shipment' }).map((skill) => skill.id)).toEqual([
      'shipping-status',
    ])
    expect(filterSkillsLibrary(skills, { query: 'crm' }).map((skill) => skill.id)).toEqual([
      'salesforce-sync',
    ])
    expect(filterSkillsLibrary(skills, { query: 'support' }).map((skill) => skill.id)).toEqual([
      'customer-refunds',
    ])
  })

  it('filters by capability and audience', () => {
    expect(
      filterSkillsLibrary(skills, {
        capability: SKILLS_LIBRARY_CAPABILITY_EXECUTABLE,
      }).map((skill) => skill.id),
    ).toEqual(['salesforce-sync'])
    expect(
      filterSkillsLibrary(skills, {
        capability: SKILLS_LIBRARY_CAPABILITY_MARKDOWN,
      }).map((skill) => skill.id),
    ).toEqual(['customer-refunds', 'shipping-status'])
    expect(
      filterSkillsLibrary(skills, {
        audience: SKILLS_LIBRARY_AUDIENCE_INTERNAL,
      }).map((skill) => skill.id),
    ).toEqual(['salesforce-sync'])
    expect(
      filterSkillsLibrary(skills, {
      audience: SKILLS_LIBRARY_AUDIENCE_CUSTOMER,
    }).map((skill) => skill.id),
  ).toEqual(['customer-refunds', 'shipping-status'])
  })

  it('filters by category while treating All categories as unfiltered', () => {
    expect(
      filterSkillsLibrary(skills, {
        category: 'Sales',
      }).map((skill) => skill.id),
    ).toEqual(['salesforce-sync'])
    expect(
      filterSkillsLibrary(skills, {
        category: 'Customer Support',
      }).map((skill) => skill.id),
    ).toEqual(['customer-refunds'])
    expect(
      filterSkillsLibrary([...skills, { id: 'legacy', name: 'Legacy' }], {
        category: SKILLS_LIBRARY_CATEGORY_DEFAULT,
      }).map((skill) => skill.id),
    ).toEqual(['legacy'])
    expect(
      filterSkillsLibrary(skills, {
        category: SKILLS_LIBRARY_CATEGORY_ALL,
      }).map((skill) => skill.id),
    ).toEqual(['customer-refunds', 'salesforce-sync', 'shipping-status'])
  })
})
