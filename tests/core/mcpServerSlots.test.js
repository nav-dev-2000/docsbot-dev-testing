import { describe, expect, it } from 'vitest'
import {
  countBillableBotActions,
  getBotActionSlotLimit,
} from '@/utils/helpers'

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

describe('getBotActionSlotLimit', () => {
  it('returns 0 below Personal and for legacy Pro', () => {
    expect(getBotActionSlotLimit(planTeam('free'))).toBe(0)
    expect(getBotActionSlotLimit(planTeam('hobby'))).toBe(0)
    expect(getBotActionSlotLimit(planTeam('pro'))).toBe(0)
  })

  it('returns 3 on Personal, 8 on Standard, and 12 on Business/Enterprise', () => {
    expect(getBotActionSlotLimit(planTeam('personal'))).toBe(3)
    expect(getBotActionSlotLimit(planTeam('standard'))).toBe(8)
    expect(getBotActionSlotLimit(planTeam('business'))).toBe(12)
    expect(
      getBotActionSlotLimit(
        planTeam('enterprise', { name: 'Enterprise', bots: 1000 }),
      ),
    ).toBe(12)
  })
})

describe('countBillableBotActions', () => {
  it('does not count human escalation or feedback actions', () => {
    expect(
      countBillableBotActions({
        tools: {
          human_escalation: { enabled: true },
          followup_rating: { enabled: true },
        },
      }),
    ).toBe(0)
  })

  it('counts user-visible widget actions only', () => {
    expect(
      countBillableBotActions({
        tools: {
          calendly: { enabled: true, url: 'docsbot/demo' },
          calcom: { enabled: false, url: 'docsbot/demo' },
          tidycal: { enabled: true, url: 'docsbot/office-hours' },
          customButtons: [
            { enabled: true, name: 'Pricing' },
            { enabled: false, name: 'Docs' },
          ],
          web_search: {
            enabled: true,
            allowed_domains: ['docsbot.ai'],
          },
          stripe: { enabled: true, refund: { enabled: true } },
        },
        leadCollect: { mode: 'before_response', fields: [] },
        mcpServers: [
          { enabled: true, tools: [{ enabled: true }, { enabled: true }] },
          { enabled: false, tools: [{ enabled: true }] },
        ],
        widgetSkills: ['refunds', 'crm-lookup'],
      }),
    ).toBe(9)
  })
})
