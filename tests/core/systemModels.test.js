import { describe, expect, it } from 'vitest'
import {
  getVisibleAiCreditModelMultipliers,
  getVisibleSystemModels,
} from '@/lib/systemModels'

describe('system model helpers', () => {
  it('returns the default visible chat models with credit multipliers', () => {
    const models = getVisibleAiCreditModelMultipliers()

    expect(models).toEqual([
      { title: 'GPT-5.5', value: 'gpt-5.5', creditMultiplier: 24 },
      { title: 'GPT-5.4', value: 'gpt-5.4', creditMultiplier: 10 },
      { title: 'GPT-5.4 mini', value: 'gpt-5.4-mini', creditMultiplier: 3 },
      { title: 'GPT-5.4 nano', value: 'gpt-5.4-nano', creditMultiplier: 1 },
      { title: 'GPT-5', value: 'gpt-5', creditMultiplier: 6 },
      { title: 'GPT-5 mini', value: 'gpt-5-mini', creditMultiplier: 1 },
      { title: 'GPT-4.1', value: 'gpt-4.1', creditMultiplier: 9 },
      { title: 'GPT-4.1 mini', value: 'gpt-4.1-mini', creditMultiplier: 1 },
    ])
  })

  it('includes selected legacy models only when they are selected', () => {
    expect(getVisibleSystemModels().map((model) => model.value)).not.toContain(
      'gpt-4o',
    )

    expect(
      getVisibleSystemModels({ selectedModel: 'gpt-4o' }).map(
        (model) => model.value,
      ),
    ).toContain('gpt-4o')
  })
})
