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

  it('surfaces outbound redirect chains as structured log details', async () => {
    const { normalizeRuntimeEvent } = await import(
      '@/app/api/teams/[teamId]/bots/[botId]/skills/workers-logs/events'
    )
    const entry = normalizeRuntimeEvent(
      {
        timestamp: Date.now(),
        source: {
          source: 'skills-runtime',
          event: 'outbound_redirect_chain',
          redirect_count: 1,
          initial_url: 'https://hooks.slack.com/[REDACTED]',
          final_url: 'https://api.slack.com/[REDACTED]',
          final_status: 200,
          chain: [
            {
              status: 302,
              method: 'POST',
              requestUrl: 'https://hooks.slack.com/[REDACTED]',
              location: 'https://api.slack.com/[REDACTED]',
            },
          ],
          template_value_shapes: [
            {
              key: 'SLACK_WEBHOOK_URL',
              length: 56,
              slashCount: 2,
              segmentCount: 3,
              startsWithHttpScheme: false,
              hasWhitespace: false,
            },
          ],
        },
      },
      0,
    )

    expect(entry).toMatchObject({
      kind: 'outbound_redirect_chain',
      status: 'success',
      title: 'Outbound redirect followed',
      redirectChain: {
        redirectCount: 1,
        initialUrl: 'https://hooks.slack.com/[REDACTED]',
        finalUrl: 'https://api.slack.com/[REDACTED]',
        finalStatus: 200,
        chain: [
          {
            status: 302,
            method: 'POST',
            requestUrl: 'https://hooks.slack.com/[REDACTED]',
            location: 'https://api.slack.com/[REDACTED]',
          },
        ],
        templateValueShapes: [
          {
            key: 'SLACK_WEBHOOK_URL',
            length: 56,
            slashCount: 2,
            segmentCount: 3,
            startsWithHttpScheme: false,
            hasWhitespace: false,
          },
        ],
      },
    })
    expect(entry.summary).toContain('1 redirect')
    expect(entry.summary).toContain('HTTP 200')
  })
})
