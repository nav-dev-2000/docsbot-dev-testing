import { describe, expect, it } from 'vitest'

import {
  filterSkillsLibrary,
  SKILLS_LIBRARY_AUDIENCE_CUSTOMER,
  SKILLS_LIBRARY_AUDIENCE_INTERNAL,
  SKILLS_LIBRARY_CAPABILITY_EXECUTABLE,
  SKILLS_LIBRARY_CAPABILITY_MARKDOWN,
} from '@/lib/skills-library-ui'

const skills = [
  {
    id: 'customer-refunds',
    name: 'customer-refunds',
    description: 'Use when handling refunds and returns.',
    mode: 'markdown',
    internal: false,
  },
  {
    id: 'salesforce-sync',
    name: 'salesforce-sync',
    description: 'Create and update CRM records.',
    mode: 'executable',
    hasFunctions: true,
    audience: 'internal',
  },
  {
    id: 'shipping-status',
    name: 'shipping-status',
    displayName: 'Shipment Lookup',
    description: 'Check carrier delivery status.',
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
})
