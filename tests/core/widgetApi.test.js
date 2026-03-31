import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockReq, createMockRes } from './helpers/http'

const mocks = vi.hoisted(() => ({
  getBot: vi.fn(),
  getTeam: vi.fn(),
  checkPlanPermission: vi.fn(),
}))

vi.mock('@/lib/dbQueries', () => ({
  getBot: mocks.getBot,
  getTeam: mocks.getTeam,
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    checkPlanPermission: mocks.checkPlanPermission,
  }
})

import widgetHandler from '@/pages/api/widget/[teamId]/[botId]'

describe('/api/widget/[teamId]/[botId]', () => {
  beforeEach(() => {
    mocks.getBot.mockReset()
    mocks.getTeam.mockReset()
    mocks.checkPlanPermission.mockReset()

    mocks.getTeam.mockResolvedValue({
      id: 'team-1',
      plan: 'business',
      openAIKey: 'sk-abc...1234',
    })
    mocks.checkPlanPermission.mockReturnValue({ allowed: true })
  })

  it('returns boolean scheduling flags and web search as widget tool options', async () => {
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      status: 'ready',
      name: 'DocsBot',
      description: 'Ask anything.',
      language: 'en',
      isAgent: true,
      model: 'gpt-5.4-nano',
      tools: {
        human_escalation: { enabled: true },
        followup_rating: { enabled: false },
        web_search: { enabled: true },
        calendly: {
          instructions: 'Book a demo.',
          url: 'docsbot/demo',
        },
        calcom: {
          enabled: false,
          instructions: 'Book office hours.',
          url: 'docsbot/office-hours',
        },
      },
    })

    const req = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const res = createMockRes()

    await widgetHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.useWebSearch).toBe(true)
    expect(res.body.useCalendly).toBe(true)
    expect(res.body.useCalCom).toBe(false)
    expect(res.body.useTidyCal).toBe(false)
  })

  it('falls back to false when a booking action is not configured', async () => {
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      status: 'ready',
      name: 'DocsBot',
      description: 'Ask anything.',
      language: 'en',
      isAgent: false,
      tools: {},
    })

    const req = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const res = createMockRes()

    await widgetHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.useWebSearch).toBe(false)
    expect(res.body.useCalendly).toBe(false)
    expect(res.body.useCalCom).toBe(false)
    expect(res.body.useTidyCal).toBe(false)
  })

  it('returns false for web search without a team OpenAI key', async () => {
    mocks.getTeam.mockResolvedValue({
      id: 'team-1',
      plan: 'business',
      openAIKey: null,
    })
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      status: 'ready',
      name: 'DocsBot',
      description: 'Ask anything.',
      language: 'en',
      isAgent: true,
      model: 'gpt-5.4-nano',
      tools: {
        web_search: {
          enabled: true,
        },
      },
    })

    const req = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const res = createMockRes()

    await widgetHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.useWebSearch).toBe(false)
  })

  it('returns false for web search below the Standard plan and booking flags below the Personal plan', async () => {
    mocks.getTeam.mockResolvedValue({
      id: 'team-1',
      plan: 'hobby',
      openAIKey: 'sk-abc...1234',
    })
    mocks.checkPlanPermission.mockImplementation((team, requiredPlan, feature) => {
      if (requiredPlan === 'personal' && feature === 'bookingActions') {
        return { allowed: false, requiredPlanLabel: 'Personal' }
      }

      if (requiredPlan === 'standard') {
        return { allowed: false, requiredPlanLabel: 'Standard' }
      }

      return { allowed: true, requiredPlanLabel: 'Personal' }
    })
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      status: 'ready',
      name: 'DocsBot',
      description: 'Ask anything.',
      language: 'en',
      isAgent: true,
      model: 'gpt-5.4-nano',
      tools: {
        web_search: {
          enabled: true,
        },
        calendly: {
          enabled: true,
          instructions: 'Book a demo.',
          url: 'docsbot/demo',
        },
      },
    })

    const req = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const res = createMockRes()

    await widgetHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.useWebSearch).toBe(false)
    expect(res.body.useCalendly).toBe(false)
    expect(res.body.useCalCom).toBe(false)
    expect(res.body.useTidyCal).toBe(false)
  })

  it('returns false for web search on an incompatible bot model', async () => {
    mocks.getBot.mockResolvedValue({
      id: 'bot-1',
      status: 'ready',
      name: 'DocsBot',
      description: 'Ask anything.',
      language: 'en',
      isAgent: true,
      model: 'gpt-4.1-nano',
      tools: {
        web_search: {
          enabled: true,
        },
      },
    })

    const req = createMockReq({
      method: 'GET',
      query: { teamId: 'team-1', botId: 'bot-1' },
    })
    const res = createMockRes()

    await widgetHandler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.useWebSearch).toBe(false)
  })
})
