import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'
import { DEFAULT_CUSTOM_BUTTON_ICON } from '@/constants/heroIcons.constants'

const mocks = vi.hoisted(() => ({
  userTeamCheck: vi.fn(),
  getBot: vi.fn(),
  phTrack: vi.fn(),
  canUserManageBotSettings: vi.fn(),
  openaiCreate: vi.fn(),
}))

vi.mock('@/lib/userTeamCheck', () => ({
  __esModule: true,
  default: mocks.userTeamCheck,
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: mocks.getBot,
}))

vi.mock('@/lib/posthog', () => ({
  phTrack: mocks.phTrack,
}))

vi.mock('@/utils/function.utils', async () => {
  const actual = await vi.importActual('@/utils/function.utils')
  return {
    ...actual,
    canUserManageBotSettings: mocks.canUserManageBotSettings,
  }
})

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      responses = {
        create: mocks.openaiCreate,
      }
    },
  }
})

vi.mock('@/utils/helpers', () => ({
  countBillableBotActions: vi.fn(() => 0),
  getBotActionSlotLimit: vi.fn(() => 8),
  checkPlanPermission: vi.fn((team, requiredPlan, feature) => {
    if (requiredPlan === 'personal' && feature === 'customButtons') {
      return { allowed: true, requiredPlanLabel: 'Personal' }
    }
    return { allowed: true, requiredPlanLabel: 'Personal' }
  }),
}))

import handler from '@/pages/api/teams/[teamId]/bots/[botId]/custom-button-draft'

describe('/api/teams/[teamId]/bots/[botId]/custom-button-draft', () => {
  beforeEach(() => {
    mocks.userTeamCheck.mockReset()
    mocks.getBot.mockReset()
    mocks.phTrack.mockReset()
    mocks.canUserManageBotSettings.mockReset()
    mocks.openaiCreate.mockReset()

    mocks.userTeamCheck.mockResolvedValue({
      userId: 'user-1',
      team: {
        id: 'team-1',
        roles: { 'user-1': 'owner' },
      },
    })
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      name: 'DocsBot',
    })
    mocks.canUserManageBotSettings.mockReturnValue(true)
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        functionKey: 'pricing',
        name: 'Pricing',
        instructions:
          'Use this when the user asks about plans, pricing, or feature differences.',
        buttonText: 'View pricing',
        icon: 'BanknotesIcon',
      }),
    })
  })

  it('generates a structured custom button draft with gpt-5.4-mini', async () => {
    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: {
        input:
          'Send users to our pricing page when they ask about plan tiers or pricing.',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      functionKey: 'pricing',
      name: 'Pricing',
      instructions:
        'Use this when the user asks about plans, pricing, or feature differences.',
      buttonText: 'View pricing',
      icon: 'BanknotesIcon',
    })
    const openaiArgs = mocks.openaiCreate.mock.calls[0][0]
    expect(mocks.openaiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
        reasoning: { effort: 'medium' },
        store: true,
        text: expect.objectContaining({
          format: expect.objectContaining({
            type: 'json_schema',
          }),
        }),
      }),
    )
    expect(openaiArgs.text.format.schema.properties.icon.enum.length).toBeGreaterThan(
      50,
    )
  })

  it('normalizes a function key that does not match the ASCII pattern', async () => {
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        functionKey: 'Not Valid!!!',
        name: 'Pricing Page',
        instructions: 'Use when the user asks about pricing.',
        buttonText: 'View pricing',
        icon: 'BanknotesIcon',
      }),
    })

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { input: 'Create a pricing button.' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.functionKey).toBe('pricing_page')
  })

  it('falls back to the default icon when the model returns an invalid icon', async () => {
    mocks.openaiCreate.mockResolvedValue({
      output_text: JSON.stringify({
        functionKey: 'pricing',
        name: 'Pricing',
        instructions: 'Use this when the user asks about pricing.',
        buttonText: 'View pricing',
        icon: 'MissingHeroIcon',
      }),
    })

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { input: 'Create a pricing button.' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.icon).toBe(DEFAULT_CUSTOM_BUTTON_ICON)
  })

  it('rejects users who cannot manage bot settings', async () => {
    mocks.canUserManageBotSettings.mockReturnValue(false)

    const req = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { input: 'Create a pricing button.' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(403)
    expect(mocks.openaiCreate).not.toHaveBeenCalled()
  })

  it('validates required input and method', async () => {
    const badReq = createMockReq({
      method: 'POST',
      query: { teamId: 'team-1', botId: 'bot-1' },
      body: { input: '   ' },
    })
    const badRes = createMockRes()

    await handler(badReq, badRes)

    expect(badRes.statusCode).toBe(400)

    const methodReq = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const methodRes = createMockRes()

    await handler(methodReq, methodRes)

    expect(methodRes.statusCode).toBe(405)
  })
})
