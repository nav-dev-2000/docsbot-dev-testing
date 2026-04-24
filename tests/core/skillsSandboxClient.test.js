import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  applySkillSandboxPatch,
  buildSkillSandboxId,
  executeSkillSandboxCommands,
  resetSkillSandbox,
  SKILLS_SANDBOX_SESSION_ID,
} from '@/lib/skills-sandbox-client'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('skills-sandbox-client', () => {
  it('builds a lowercase hyphenated sandbox id within Cloudflare limits', () => {
    expect(buildSkillSandboxId('Team_1', 'Bot 1', 'Customer Refunds')).toBe(
      'skill-team-1-bot-1-customer-refunds',
    )
  })

  it('truncates long sandbox ids and appends a deterministic hash suffix', () => {
    const sandboxId = buildSkillSandboxId(
      'team-with-a-very-long-identifier-that-keeps-going',
      'bot-with-a-very-long-identifier-that-keeps-going',
      'skill-with-a-very-long-identifier-that-keeps-going',
    )

    expect(sandboxId.length).toBeLessThanOrEqual(63)
    expect(sandboxId).toMatch(/^skill-[a-z0-9-]+-[a-f0-9]{12}$/)
    expect(sandboxId).toBe(
      buildSkillSandboxId(
        'team-with-a-very-long-identifier-that-keeps-going',
        'bot-with-a-very-long-identifier-that-keeps-going',
        'skill-with-a-very-long-identifier-that-keeps-going',
      ),
    )
  })

  it('retries transient fetch failures before returning sandbox output', async () => {
    process.env.SKILLS_SANDBOX_URL = 'https://sandbox.example'
    process.env.SKILLS_SANDBOX_TOKEN = 'test-token'

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sandboxId: 'skill-team-1-bot-1-customer-refunds',
            sessionId: SKILLS_SANDBOX_SESSION_ID,
            output: [
              {
                stdout: '/workspace\n',
                stderr: '',
                outcome: { type: 'exit', exitCode: 0 },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    const result = await executeSkillSandboxCommands({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      commands: ['pwd'],
      timeoutMs: 10000,
      maxOutputLength: 1024,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      sandboxId: 'skill-team-1-bot-1-customer-refunds',
      sessionId: SKILLS_SANDBOX_SESSION_ID,
      output: [
        {
          stdout: '/workspace\n',
          stderr: '',
          outcome: { type: 'exit', exitCode: 0 },
        },
      ],
    })
  })

  it('does not retry when the caller aborts the sandbox request', async () => {
    process.env.SKILLS_SANDBOX_URL = 'https://sandbox.example'
    process.env.SKILLS_SANDBOX_TOKEN = 'test-token'

    const abortController = new AbortController()
    const fetchMock = vi.fn((_url, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(options.signal.reason || new Error('Operation aborted.'))
        })
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const requestPromise = executeSkillSandboxCommands({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      commands: ['pwd'],
      timeoutMs: 10000,
      abortSignal: abortController.signal,
    })

    abortController.abort(new Error('Client disconnected.'))

    await expect(requestPromise).rejects.toThrow('Client disconnected.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts a hung sandbox request with a bounded fetch timeout', async () => {
    vi.useFakeTimers()
    process.env.SKILLS_SANDBOX_URL = 'https://sandbox.example'
    process.env.SKILLS_SANDBOX_TOKEN = 'test-token'

    const fetchMock = vi.fn((_url, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(options.signal.reason || new Error('aborted'))
        })
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const requestPromise = executeSkillSandboxCommands({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      commands: ['cat SKILL.md'],
      timeoutMs: 10000,
    })
    const rejection = expect(requestPromise).rejects.toThrow(
      'Sandbox worker request timed out after 30000ms before a complete response was received.',
    )

    await vi.advanceTimersByTimeAsync(100000)

    await rejection
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('resets a sandbox through the worker endpoint', async () => {
    process.env.SKILLS_SANDBOX_URL = 'https://sandbox.example'
    process.env.SKILLS_SANDBOX_TOKEN = 'test-token'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          sandboxId: 'skill-team-1-bot-1-customer-refunds',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const result = await resetSkillSandbox({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.example/reset',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({
      ok: true,
      sandboxId: 'skill-team-1-bot-1-customer-refunds',
    })
  })

  it('applies a patch through the worker endpoint', async () => {
    process.env.SKILLS_SANDBOX_URL = 'https://sandbox.example'
    process.env.SKILLS_SANDBOX_TOKEN = 'test-token'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'completed',
          output: 'Updated SKILL.md',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const result = await applySkillSandboxPatch({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      callId: 'call_patch_1',
      operation: {
        type: 'update_file',
        path: 'SKILL.md',
        diff: '@@\n-Old\n+New',
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.example/apply-patch',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(result).toEqual({
      status: 'completed',
      output: 'Updated SKILL.md',
    })
  })
})
