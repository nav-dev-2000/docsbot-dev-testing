import { describe, expect, it } from 'vitest'

import {
  openAiErrorMessage,
  unwrapJsonMessageString,
} from '@/lib/openai-error-message'

describe('openAiErrorMessage', () => {
  it('unwraps JSON-shaped message strings to plain text', () => {
    const raw =
      '{"message":"400 Inline skill name/description must match the values in SKILL.md/Skills.md front matter."}'
    expect(unwrapJsonMessageString(raw)).toBe(
      '400 Inline skill name/description must match the values in SKILL.md/Skills.md front matter.',
    )
  })

  it('extracts nested OpenAI-style error.message', () => {
    const err = {
      message: '{"message":"400 Bad request body."}',
    }
    expect(openAiErrorMessage(err)).toBe('400 Bad request body.')
  })

  it('returns normal Error messages unchanged', () => {
    expect(openAiErrorMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('extracts message from AI SDK APICallError-style responseBody JSON', () => {
    const err = {
      responseBody: JSON.stringify({
        error: {
          message:
            'No tool call found for function call output with call_id call_abc.',
          type: 'invalid_request_error',
        },
      }),
    }
    expect(openAiErrorMessage(err)).toBe(
      'No tool call found for function call output with call_id call_abc.',
    )
  })
})
