import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  executeSkillSandboxCommands: vi.fn(),
  resetSkillSandbox: vi.fn(),
}))

vi.mock('@/lib/skills-sandbox-client', () => ({
  executeSkillSandboxCommands: mocks.executeSkillSandboxCommands,
  resetSkillSandbox: mocks.resetSkillSandbox,
}))

describe('skills-shell-executor', () => {
  it('maps AI SDK shell actions to sandbox command execution results', async () => {
    mocks.executeSkillSandboxCommands.mockResolvedValue({
      output: [
        {
          stdout: '/workspace\n',
          stderr: '',
          outcome: { type: 'exit', exitCode: 0 },
        },
        {
          stdout: '',
          stderr: 'Timed out',
          outcome: { type: 'timeout' },
        },
      ],
    })

    const { createSkillShellExecute } = await import('@/lib/skills-shell-executor')
    const execute = createSkillShellExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    const result = await execute({
      action: {
        commands: ['pwd', 'sleep 5'],
        timeoutMs: 5000,
        maxOutputLength: 2048,
      },
    })

    expect(mocks.executeSkillSandboxCommands).toHaveBeenCalledWith({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      commands: ['pwd', 'sleep 5'],
      timeoutMs: 5000,
      maxOutputLength: 2048,
      abortSignal: 'request-signal',
    })
    expect(result).toEqual({
      output: [
        {
          stdout: '/workspace\n',
          stderr: '',
          outcome: { type: 'exit', exitCode: 0 },
        },
        {
          stdout: '',
          stderr: 'Timed out',
          outcome: { type: 'timeout' },
        },
      ],
    })
  })

  it('returns shell stderr instead of throwing when sandbox execution fails', async () => {
    mocks.executeSkillSandboxCommands.mockRejectedValue(new Error('Sandbox execution failed with status 401.'))

    const { createSkillShellExecute } = await import('@/lib/skills-shell-executor')
    const execute = createSkillShellExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    const result = await execute({
      action: {
        commands: ['pwd', 'ls -la'],
      },
    })

    expect(result).toEqual({
      output: [
        {
          stdout: '',
          stderr:
            'Shell backend request failed or timed out while waiting for the sandbox command to complete. Error: Sandbox execution failed with status 401.',
          outcome: { type: 'exit', exitCode: 1 },
        },
        {
          stdout: '',
          stderr:
            'Shell backend request failed or timed out while waiting for the sandbox command to complete. Error: Sandbox execution failed with status 401.',
          outcome: { type: 'exit', exitCode: 1 },
        },
      ],
    })
  })

  it('uses a default timeout when the model does not provide one', async () => {
    mocks.executeSkillSandboxCommands.mockResolvedValue({
      output: [
        {
          stdout: 'ok\n',
          stderr: '',
          outcome: { type: 'exit', exitCode: 0 },
        },
      ],
    })

    const { createSkillShellExecute } = await import('@/lib/skills-shell-executor')
    const execute = createSkillShellExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    await execute({
      action: {
        commands: ['echo ok'],
      },
    })

    expect(mocks.executeSkillSandboxCommands).toHaveBeenCalledWith({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      commands: ['echo ok'],
      timeoutMs: 60000,
      maxOutputLength: undefined,
      abortSignal: 'request-signal',
    })
  })

  it('accumulates invocation count and wall-clock duration when usageAccumulator is set', async () => {
    vi.useFakeTimers()
    mocks.executeSkillSandboxCommands.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                output: [
                  {
                    stdout: 'ok\n',
                    stderr: '',
                    outcome: { type: 'exit', exitCode: 0 },
                  },
                ],
              }),
            1500,
          )
        }),
    )

    const { createSkillShellExecute } = await import('@/lib/skills-shell-executor')
    const usageAccumulator = { calls: 0, durationMs: 0 }
    const execute = createSkillShellExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
      usageAccumulator,
    })

    const finished = execute({
      action: {
        commands: ['sleep 1'],
      },
    })

    await vi.advanceTimersByTimeAsync(1500)
    await finished

    expect(usageAccumulator.calls).toBe(1)
    expect(usageAccumulator.durationMs).toBe(1500)

    vi.useRealTimers()
  })

  it('resets the sandbox after timeout-like backend failures', async () => {
    mocks.executeSkillSandboxCommands.mockRejectedValue(
      new Error('Sandbox worker request timed out after 75000ms before a complete response was received.'),
    )

    const { createSkillShellExecute } = await import('@/lib/skills-shell-executor')
    const execute = createSkillShellExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    await execute({
      action: {
        commands: ['pwd'],
      },
    })

    expect(mocks.resetSkillSandbox).toHaveBeenCalledWith({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
    })
  })
})
