import { describe, expect, it } from 'vitest'

import {
  getExceededPlanLimits,
  isDowngradingBelowBusiness,
  isDowngradingBelowStandard,
  teamHasPerBotRoleAssignments,
  teamHasStripeActionsEnabled,
  teamHasLeadCollectCustomFields,
} from '@/utils/checkoutValidation'

describe('checkoutValidation', () => {
  it('reports exceeded checkout limits using the same contract as the billing route', () => {
    expect(
      getExceededPlanLimits({
        team: {
          botCount: 3,
          pageCount: 120,
          questionCount: 900,
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
        },
        inviteCount: 1,
      }),
    ).toEqual([
      'bots (3 > 2)',
      'pages (120 > 100)',
      'team members (3 > 2)',
    ])
  })

  it('counts active add-ons when checking plan limits', () => {
    expect(
      getExceededPlanLimits({
        team: {
          stripeSubscriptionStatus: 'active',
          botCount: 3,
          pageCount: 20100,
          questionCount: 5900,
          roles: {},
          stripeAddOns: {
            bots: { quantity: 1 },
            sourcePages: { quantity: 2 },
            aiCredits: { quantity: 1 },
          },
        },
        planLimits: {
          bots: 2,
          pages: 100,
          questions: 1000,
          teamMembers: 1,
        },
      }),
    ).toEqual([])
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

  it('treats only lower-than-standard targets as restricted for Standard features', () => {
    expect(isDowngradingBelowStandard('personal')).toBe(true)
    expect(isDowngradingBelowStandard('pro')).toBe(true)
    expect(isDowngradingBelowStandard('standard')).toBe(false)
    expect(isDowngradingBelowStandard('business')).toBe(false)
    expect(isDowngradingBelowStandard('enterprise')).toBe(false)
  })

  it('detects Stripe actions enabled on any bot', () => {
    expect(
      teamHasStripeActionsEnabled({
        bots: [{ tools: { stripe: { enabled: true } } }],
      }),
    ).toBe(true)

    expect(
      teamHasStripeActionsEnabled({
        bots: [
          { tools: {} },
          { tools: { stripe: { enabled: false } } },
        ],
      }),
    ).toBe(false)
  })

  it('detects lead collection custom fields on any bot', () => {
    expect(
      teamHasLeadCollectCustomFields({
        bots: [
          {
            leadCollect: {
              fields: [
                { key: 'name' },
                { key: 'email' },
                { key: 'phone' },
              ],
            },
          },
        ],
      }),
    ).toBe(true)

    expect(
      teamHasLeadCollectCustomFields({
        bots: [
          {
            leadCollect: {
              fields: [{ key: 'name' }, { key: 'email' }],
            },
          },
        ],
      }),
    ).toBe(false)

    expect(teamHasLeadCollectCustomFields({ bots: [] })).toBe(false)
  })
})
