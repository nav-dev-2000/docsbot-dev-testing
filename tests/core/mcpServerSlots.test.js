import { describe, expect, it } from 'vitest'
import { getMcpServerSlotLimit, getWidgetSkillSlotLimit } from '@/utils/helpers'

const planTeam = (planId, overrides = {}) => ({
  id: 'team-1',
  plan: {
    id: planId,
    name: planId,
    bots: 10,
    pages: 10000,
    questions: 10000,
    teamMembers: 5,
    ...overrides,
  },
})

describe('getMcpServerSlotLimit', () => {
  it('returns 0 below Personal', () => {
    expect(getMcpServerSlotLimit(planTeam('free'))).toBe(0)
    expect(getMcpServerSlotLimit(planTeam('hobby'))).toBe(0)
  })

  it('returns 1 on Personal and Pro', () => {
    expect(getMcpServerSlotLimit(planTeam('personal'))).toBe(1)
    expect(getMcpServerSlotLimit(planTeam('pro'))).toBe(1)
  })

  it('returns 3 on Standard (same as per-bot skills limit; Personal keeps 1)', () => {
    expect(getMcpServerSlotLimit(planTeam('standard'))).toBe(3)
  })

  it('returns 10 on Business', () => {
    expect(getMcpServerSlotLimit(planTeam('business'))).toBe(10)
  })
})

describe('getWidgetSkillSlotLimit (per-bot DocsBot skills)', () => {
  it('returns 0 below Standard', () => {
    expect(getWidgetSkillSlotLimit(planTeam('free'))).toBe(0)
    expect(getWidgetSkillSlotLimit(planTeam('hobby'))).toBe(0)
    expect(getWidgetSkillSlotLimit(planTeam('personal'))).toBe(0)
    expect(getWidgetSkillSlotLimit(planTeam('pro'))).toBe(0)
  })

  it('returns 3 on Standard', () => {
    expect(getWidgetSkillSlotLimit(planTeam('standard'))).toBe(3)
  })

  it('returns 10 on Business', () => {
    expect(getWidgetSkillSlotLimit(planTeam('business'))).toBe(10)
  })
})
