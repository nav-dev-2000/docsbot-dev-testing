import { describe, expect, it } from 'vitest'

import {
  recoverInterruptedToolCalls,
  stripOpenAIResponseItemReferences,
} from '@/lib/skills-builder-chat-recovery'

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

  it('strips OpenAI stored response item references while preserving other provider metadata', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'reasoning',
            text: 'Reasoning summary',
            providerOptions: {
              openai: {
                itemId: 'rs_123',
                responseId: 'resp_123',
                reasoningEncryptedContent: 'encrypted-reasoning',
              },
            },
          },
          {
            type: 'text',
            text: 'I updated the skill.',
            providerMetadata: {
              openai: {
                itemId: 'msg_123',
                responseId: 'resp_123',
                annotations: [{ type: 'url_citation', url: 'https://example.com' }],
              },
            },
          },
          {
            type: 'tool-shell',
            toolCallId: 'call_123',
            state: 'output-available',
            providerMetadata: {
              openai: {
                itemId: 'sh_123',
              },
            },
          },
        ],
      },
    ]

    const stripped = stripOpenAIResponseItemReferences(messages)

    expect(stripped).not.toBe(messages)
    expect(stripped[1].parts[0].providerOptions).toEqual({
      openai: {
        reasoningEncryptedContent: 'encrypted-reasoning',
      },
    })
    expect(stripped[1].parts[1].providerMetadata).toEqual({
      openai: {
        annotations: [{ type: 'url_citation', url: 'https://example.com' }],
      },
    })
    expect(stripped[1].parts[2].providerMetadata).toBeUndefined()
  })

  it('returns the original messages when there are no OpenAI response item references', () => {
    const messages = [{ role: 'user', parts: [{ type: 'text', text: 'Keep going' }] }]

    expect(stripOpenAIResponseItemReferences(messages)).toBe(messages)
  })
})
