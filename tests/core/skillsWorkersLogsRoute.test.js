import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/appRouteAuth', () => ({
  getAuthorizedBotContext: vi.fn(),
  jsonError: vi.fn(),
}))

describe('skills workers logs route', () => {
  it('surfaces structured call-function session errors with function input details', async () => {
    const { normalizeRuntimeEvent } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/workers-logs/events'
    )
    const entry = normalizeRuntimeEvent(
      {
        timestamp: Date.now(),
        source: {
          event: 'session_error',
          pathname: '/call-function',
          error:
            "Skill 'current-weather-api' is missing the published bundle artifact '.docsbot/bundle/index.js'.",
          function_name: 'getCurrentWeather',
          input: { location: 'Chicago, IL' },
          session_id: 'team-1:bot-1:conv-1',
        },
      },
      0,
    )

    expect(entry).toMatchObject({
      kind: 'function_error',
      status: 'error',
      functionName: 'getCurrentWeather',
      input: { location: 'Chicago, IL' },
      output: undefined,
      error:
        "Skill 'current-weather-api' is missing the published bundle artifact '.docsbot/bundle/index.js'.",
    })
    expect(entry.summary).toContain('getCurrentWeather')
  })
})
