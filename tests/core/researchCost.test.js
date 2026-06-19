import { describe, expect, it } from 'vitest'

import {
  calculateResearchCost,
  getResearchCostModel,
  getResearchModel,
  normalizeResearchModelId,
  RESEARCH_MODELS,
} from '../../src/components/Research/utils/calculateResearchCost'

describe('research cost model helpers', () => {
  it('offers GPT-5.5 and GPT-5.4 mini as deep research models', () => {
    expect(RESEARCH_MODELS.map((model) => model.id)).toEqual([
      'gpt-5.5',
      'gpt-5.4-mini',
    ])
  })

  it('normalizes old deep research model ids to current GPT model ids', () => {
    expect(normalizeResearchModelId('o3')).toBe('gpt-5.5')
    expect(normalizeResearchModelId('o3-2025-04-16')).toBe('gpt-5.5')
    expect(normalizeResearchModelId('o4-mini')).toBe('gpt-5.4-mini')
    expect(normalizeResearchModelId('o4-mini-2025-04-16')).toBe(
      'gpt-5.4-mini',
    )
    expect(normalizeResearchModelId('o4mini')).toBe('gpt-5.4-mini')
    expect(normalizeResearchModelId('gpt-5.5')).toBe('gpt-5.5')
    expect(normalizeResearchModelId('gpt-5.5-2026-06-01')).toBe('gpt-5.5')
    expect(normalizeResearchModelId('gpt-5.4-mini-2026-01-10')).toBe(
      'gpt-5.4-mini',
    )
  })

  it('returns display metadata with current credit multipliers', () => {
    expect(getResearchModel('o3')).toMatchObject({
      id: 'gpt-5.5',
      name: 'GPT-5.5',
      creditMultiplier: 24,
    })
    expect(getResearchModel('o3-2025-04-16')).toMatchObject({
      id: 'gpt-5.5',
      name: 'GPT-5.5',
      creditMultiplier: 24,
    })
    expect(getResearchModel('o4-mini')).toMatchObject({
      id: 'gpt-5.4-mini',
      name: 'GPT-5.4 mini',
      creditMultiplier: 3,
    })
  })

  it('preserves old o-series metadata for historical cost estimates', () => {
    expect(getResearchCostModel('o3-2025-04-16')).toMatchObject({
      id: 'o3',
      name: 'o3',
      creditMultiplier: 23,
    })
    expect(getResearchCostModel('o4-mini-2025-04-16')).toMatchObject({
      id: 'o4-mini',
      name: 'o4-mini',
      creditMultiplier: 5,
    })
  })

  it('calculates costs with historical o-series pricing for old jobs', () => {
    const cost = calculateResearchCost({
      model: 'o3-2025-04-16',
      response: {
        usage: {
          input_tokens: 1_000_000,
          input_tokens_details: { cached_tokens: 100_000 },
          output_tokens: 500_000,
        },
        output: [
          { type: 'web_search_call' },
          { type: 'code_interpreter_call' },
        ],
      },
    })

    expect(cost).toMatchObject({
      model: 'o3',
      modelName: 'o3',
      creditMultiplier: 23,
      inputTokens: 1_000_000,
      cachedTokens: 100_000,
      outputTokens: 500_000,
      webSearchCalls: 1,
      codeInterpreterCalls: 1,
    })
    expect(cost.inputCost).toBeCloseTo(9.25)
    expect(cost.outputCost).toBeCloseTo(20)
    expect(cost.toolsCost).toBeCloseTo(0.04)
    expect(cost.totalCost).toBeCloseTo(29.29)
  })

  it('calculates costs with current GPT pricing for new jobs', () => {
    const cost = calculateResearchCost({
      model: 'gpt-5.5-2026-06-01',
      response: {
        usage: {
          input_tokens: 1_000_000,
          input_tokens_details: { cached_tokens: 100_000 },
          output_tokens: 500_000,
        },
      },
    })

    expect(cost).toMatchObject({
      model: 'gpt-5.5',
      modelName: 'GPT-5.5',
      creditMultiplier: 24,
    })
    expect(cost.inputCost).toBeCloseTo(4.55)
    expect(cost.outputCost).toBeCloseTo(15)
  })

  it('uses persisted token usage and tool counts when response usage is absent', () => {
    const cost = calculateResearchCost({
      model: 'gpt-5.5',
      tokenUsage: {
        inputTokens: 6948,
        cachedInputTokens: 0,
        outputTokens: 393,
      },
      webSearchCallCount: 3,
      codeInterpreterCallCount: 0,
    })

    expect(cost).toMatchObject({
      model: 'gpt-5.5',
      inputTokens: 6948,
      cachedTokens: 0,
      outputTokens: 393,
      webSearchCalls: 3,
      codeInterpreterCalls: 0,
    })
    expect(cost.toolsCost).toBeCloseTo(0.03)
  })

  it('dedupes output tool calls by call id and uses the larger persisted count', () => {
    const cost = calculateResearchCost({
      model: 'gpt-5.4-mini',
      webSearchCallCount: 3,
      response: {
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
        output: [
          { type: 'web_search_call', id: 'ws_1' },
          { type: 'web_search_call', id: 'ws_1' },
          { type: 'web_search_call', id: 'ws_2' },
        ],
      },
    })

    expect(cost.webSearchCalls).toBe(3)
    expect(cost.toolsCost).toBeCloseTo(0.03)
  })
})
