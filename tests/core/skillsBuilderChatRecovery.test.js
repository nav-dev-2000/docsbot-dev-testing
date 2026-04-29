import { describe, expect, it } from 'vitest'

import {
  prepareSkillsBuilderMessagesForModel,
  recoverInterruptedToolCalls,
  removeAssistantResponseItemsFromHistory,
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

  it('strips OpenAI provider replay metadata while preserving other providers', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        providerMetadata: {
          openai: {
            responseId: 'resp_123',
          },
          docsbot: {
            safe: true,
          },
        },
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
              docsbot: {
                traceId: 'trace-1',
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
              docsbot: {
                safe: true,
              },
            },
          },
          {
            type: 'tool-shell',
            toolCallId: 'call_123',
            state: 'output-available',
            callProviderMetadata: {
              openai: {
                itemId: 'sh_123',
              },
              docsbot: {
                callTraceId: 'call-trace-1',
              },
            },
            resultProviderMetadata: {
              openai: {
                itemId: 'sh_result_123',
              },
            },
          },
        ],
      },
    ]

    const stripped = stripOpenAIResponseItemReferences(messages)

    expect(stripped).not.toBe(messages)
    expect(stripped[1].providerMetadata).toEqual({
      docsbot: {
        safe: true,
      },
    })
    expect(stripped[1].parts[0].providerOptions).toEqual({
      docsbot: {
        traceId: 'trace-1',
      },
    })
    expect(stripped[1].parts[1].providerMetadata).toEqual({
      docsbot: {
        safe: true,
      },
    })
    expect(stripped[1].parts[2].callProviderMetadata).toEqual({
      docsbot: {
        callTraceId: 'call-trace-1',
      },
    })
    expect(stripped[1].parts[2].resultProviderMetadata).toBeUndefined()
  })

  it('strips top-level message OpenAI provider metadata', () => {
    const messages = [
      {
        role: 'assistant',
        providerMetadata: {
          openai: { responseId: 'resp_123' },
          docsbot: { traceId: 'trace-1' },
        },
        parts: [{ type: 'text', text: 'Done' }],
      },
    ]

    const stripped = stripOpenAIResponseItemReferences(messages)

    expect(stripped[0].providerMetadata).toEqual({
      docsbot: { traceId: 'trace-1' },
    })
  })

  it('drops OpenAI hosted web search calls from replayed assistant history', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Research the vendor.' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'reasoning',
            text: 'I should verify the current vendor docs.',
          },
          {
            type: 'tool-web_search',
            toolCallId: 'ws_04f1669e1036bfce0069f181374f088194b5dd4c5cf6c6b2cc',
            state: 'output-available',
            input: {},
            output: {
              action: { type: 'search', query: 'vendor API docs' },
            },
            providerExecuted: true,
          },
          {
            type: 'text',
            text: 'I found the API docs and updated the skill.',
          },
        ],
      },
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-call',
            toolCallId: 'ws_04f1669e1036bfce0069f181374f088194b5dd4c5cf6c6b2cc',
            toolName: 'web_search',
            input: {},
            providerExecuted: true,
          },
          {
            type: 'web_search_call',
            id: 'ws_04f1669e1036bfce0069f181374f088194b5dd4c5cf6c6b2cc',
            status: 'completed',
          },
        ],
      },
    ]

    const stripped = stripOpenAIResponseItemReferences(messages)

    expect(stripped[1].parts).toEqual([
      {
        type: 'reasoning',
        text: 'I should verify the current vendor docs.',
      },
      {
        type: 'text',
        text: 'I found the API docs and updated the skill.',
      },
    ])
    expect(stripped[2].parts).toEqual([])
  })

  it('returns the original messages when there are no OpenAI response item references', () => {
    const messages = [{ role: 'user', parts: [{ type: 'text', text: 'Keep going' }] }]

    expect(stripOpenAIResponseItemReferences(messages)).toBe(messages)
  })

  it('removes unsafe assistant response items before model replay', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          { type: 'reasoning', text: 'Hidden reasoning summary' },
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'load_context',
            input: {},
          },
          { type: 'text', text: 'I updated the skill.' },
          {
            type: 'tool-ask_user_questions',
            toolCallId: 'call_questions',
            state: 'output-available',
            input: {
              questions: [
                {
                  id: 'scope',
                  kind: 'multiple_choice',
                  prompt: 'Which scope?',
                  options: [{ id: 'refunds', label: 'Refunds' }],
                },
              ],
            },
            output: {
              answers: [
                {
                  questionId: 'scope',
                  kind: 'multiple_choice',
                  selectedOptionIds: ['refunds'],
                },
              ],
            },
          },
        ],
      },
      {
        role: 'assistant',
        parts: [{ type: 'tool-shell', state: 'output-available', output: 'ok' }],
      },
    ]

    expect(removeAssistantResponseItemsFromHistory(messages)).toEqual([
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          { type: 'text', text: 'I updated the skill.' },
          {
            type: 'tool-ask_user_questions',
            toolCallId: 'call_questions',
            state: 'output-available',
            input: {
              questions: [
                {
                  id: 'scope',
                  kind: 'multiple_choice',
                  prompt: 'Which scope?',
                  options: [{ id: 'refunds', label: 'Refunds' }],
                },
              ],
            },
            output: {
              answers: [
                {
                  questionId: 'scope',
                  kind: 'multiple_choice',
                  selectedOptionIds: ['refunds'],
                },
              ],
            },
          },
        ],
      },
    ])
  })

  it('preserves completed ask_user_questions output-only messages for follow-up turns', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Start building' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-ask_user_questions',
            toolCallId: 'call_questions',
            state: 'output-available',
            input: {
              questions: [
                {
                  id: 'auth',
                  kind: 'open_ended',
                  prompt: 'What auth mode should the skill use?',
                },
              ],
            },
            output: {
              answers: [
                {
                  questionId: 'auth',
                  kind: 'open_ended',
                  text: 'Use OAuth.',
                },
              ],
            },
          },
        ],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Continue with OAuth.' }] },
    ]

    expect(removeAssistantResponseItemsFromHistory(messages)).toEqual(messages)
  })

  it('prepares old skill builder history as text-only assistant context', () => {
    const messages = [
      { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
      {
        role: 'assistant',
        parts: [
          {
            type: 'reasoning',
            text: 'I inspected the existing files.',
            providerOptions: {
              openai: {
                itemId: 'rs_0c542f6eb81950000069f1223a2d6c81a1876ce6026ce9def1',
                responseId: 'resp_old',
                reasoningEncryptedContent: 'encrypted-content',
              },
            },
          },
          {
            type: 'tool-call',
            toolCallId: 'call_old',
            toolName: 'load_context',
            input: {},
            providerMetadata: {
              openai: {
                itemId: 'fc_0cdc252d2c8b1f950069f13526c5d081a28a6f187aeae67ddb',
              },
            },
          },
          {
            type: 'text',
            text: 'I can continue from the authored files.',
            providerMetadata: {
              openai: {
                itemId: 'msg_old',
                responseId: 'resp_old',
              },
            },
          },
        ],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
    ]

    expect(prepareSkillsBuilderMessagesForModel(messages)).toEqual([
      { role: 'user', parts: [{ type: 'text', text: 'Build the refund skill.' }] },
      {
        role: 'assistant',
        parts: [{ type: 'text', text: 'I can continue from the authored files.' }],
      },
      { role: 'user', parts: [{ type: 'text', text: 'Keep going from there.' }] },
    ])
  })
})
