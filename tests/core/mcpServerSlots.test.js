import { describe, expect, it } from 'vitest'
import { getMcpServerSlotLimit } from '@/utils/helpers'

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

  it('returns 5 on Standard', () => {
    expect(getMcpServerSlotLimit(planTeam('standard'))).toBe(5)
  })

  it('returns 10 on Business', () => {
    expect(getMcpServerSlotLimit(planTeam('business'))).toBe(10)
  })
})
