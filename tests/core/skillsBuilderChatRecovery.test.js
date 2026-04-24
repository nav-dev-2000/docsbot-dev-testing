import { describe, expect, it } from 'vitest'

import { recoverInterruptedToolCalls } from '@/lib/skills-builder-chat-recovery'

describe('skills-builder-chat-recovery', () => {
  it('marks interrupted tool calls as output-error when a later user message exists', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-shell',
            toolCallId: 'call_123',
            state: 'input-available',
            input: {
              action: {
                commands: ['cd /workspace && ls -la'],
              },
            },
          },
        ],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Try again' }] },
    ]

    const recovered = recoverInterruptedToolCalls(messages)
    expect(recovered[1].parts[0]).toMatchObject({
      type: 'tool-shell',
      toolCallId: 'call_123',
      state: 'output-error',
      errorText:
        'User interrupted this tool call before it completed. Reassess the current state and continue.',
    })
  })

  it('leaves the latest unfinished assistant tool call alone when no later user message exists', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-shell',
            toolCallId: 'call_123',
            state: 'input-available',
            input: {
              action: {
                commands: ['cd /workspace && ls -la'],
              },
            },
          },
        ],
      },
    ]

    expect(recoverInterruptedToolCalls(messages)).toBe(messages)
  })
})
