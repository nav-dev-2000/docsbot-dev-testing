import { describe, expect, it } from 'vitest'

import {
  getEffectiveResearchTaskCount,
  getExceededPlanLimits,
  getPlanResearchTasksLimit,
  isDowngradingBelowBusiness,
  teamHasPerBotRoleAssignments,
} from '@/utils/checkoutValidation'

describe('checkoutValidation', () => {
  it('normalizes plan research task limits from number or object shapes', () => {
    expect(getPlanResearchTasksLimit({ researchTasks: 25 })).toBe(25)
    expect(
      getPlanResearchTasksLimit({ researchTasks: { monthly: 40 } }),
    ).toBe(40)
    expect(
      getPlanResearchTasksLimit({ researchTasks: { lifetime: 3 } }),
    ).toBe(3)
    expect(getPlanResearchTasksLimit({})).toBe(0)
  })

  it('excludes the free trial research allowance from checkout limit checks', () => {
    expect(
      getEffectiveResearchTaskCount({
        team: { researchCount: 2 },
        currentPlan: { researchTasks: 0 },
      }),
    ).toBe(0)

    expect(
      getEffectiveResearchTaskCount({
        team: { researchCount: 5 },
        currentPlan: { researchTasks: 0 },
      }),
    ).toBe(3)

    expect(
      getEffectiveResearchTaskCount({
        team: { researchCount: 5 },
        currentPlan: { researchTasks: 25 },
      }),
    ).toBe(5)
  })

  it('reports exceeded checkout limits using the same contract as the billing route', () => {
    expect(
      getExceededPlanLimits({
        team: {
          botCount: 3,
          pageCount: 120,
          questionCount: 900,
          researchCount: 8,
          roles: {
            owner: 'owner',
            admin: 'admin',
          },
        },
        planLimits: {
          bots: 2,
          pages: 100,
          questions: 1000,
          teamMembers: 2,
          researchTasks: 4,
        },
        inviteCount: 1,
        currentPlan: {
          researchTasks: 0,
        },
      }),
    ).toEqual([
      'bots (3 > 2)',
      'pages (120 > 100)',
      'team members (3 > 2)',
      'research tasks (6 > 4)',
    ])
  })

  it('detects per-bot role assignments that block business-plan downgrades', () => {
    expect(
      teamHasPerBotRoleAssignments({
        bots: [
          {
            roles: {
              member: 'editor',
              outsider: 'viewer',
            },
          },
        ],
        teamRoles: {
          member: 'admin',
        },
        teamInvites: [],
      }),
    ).toBe(true)

    expect(
      teamHasPerBotRoleAssignments({
        bots: [],
        teamRoles: {},
        teamInvites: [
          {
            botOverrides: [{ botId: 'bot-1', role: 'viewer' }],
          },
        ],
      }),
    ).toBe(true)

    expect(
      teamHasPerBotRoleAssignments({
        bots: [
          {
            roles: {
              member: 'default',
            },
          },
        ],
        teamRoles: {
          member: 'admin',
        },
        teamInvites: [],
      }),
    ).toBe(false)
  })

  it('treats only lower-than-business targets as restricted downgrades', () => {
    expect(isDowngradingBelowBusiness('personal')).toBe(true)
    expect(isDowngradingBelowBusiness('standard')).toBe(true)
    expect(isDowngradingBelowBusiness('business')).toBe(false)
    expect(isDowngradingBelowBusiness('enterprise')).toBe(false)
  })
})
