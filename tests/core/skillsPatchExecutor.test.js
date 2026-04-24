import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  applySkillSandboxPatch: vi.fn(),
}))

vi.mock('@/lib/skills-sandbox-client', () => ({
  applySkillSandboxPatch: mocks.applySkillSandboxPatch,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('skills-patch-executor', () => {
  it('returns successful apply_patch results from the sandbox backend', async () => {
    mocks.applySkillSandboxPatch.mockResolvedValue({
      status: 'completed',
      output: 'Updated SKILL.md',
    })

    const { createSkillPatchExecute } = await import('@/lib/skills-patch-executor')
    const execute = createSkillPatchExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    const result = await execute({
      callId: 'call_patch_1',
      operation: {
        type: 'update_file',
        path: 'SKILL.md',
        diff: '@@\n-Old\n+New',
      },
    })

    expect(mocks.applySkillSandboxPatch).toHaveBeenCalledWith({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      callId: 'call_patch_1',
      operation: {
        type: 'update_file',
        path: 'SKILL.md',
        diff: '@@\n-Old\n+New',
      },
      abortSignal: 'request-signal',
    })
    expect(result).toEqual({
      status: 'completed',
      output: 'Updated SKILL.md',
    })
  })

  it('returns failed patch results instead of throwing on backend errors', async () => {
    mocks.applySkillSandboxPatch.mockRejectedValue(new Error('Sandbox patch failed with status 500.'))

    const { createSkillPatchExecute } = await import('@/lib/skills-patch-executor')
    const execute = createSkillPatchExecute({
      teamId: 'team-1',
      botId: 'bot-1',
      skillName: 'customer-refunds',
      abortSignal: 'request-signal',
    })

    const result = await execute({
      callId: 'call_patch_2',
      operation: {
        type: 'delete_file',
        path: 'references/old.md',
      },
    })

    expect(result).toEqual({
      status: 'failed',
      output:
        'Patch backend request failed while applying the file operation in the sandbox. Error: Sandbox patch failed with status 500.',
    })
  })
})
