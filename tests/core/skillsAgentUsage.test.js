import { describe, expect, it } from 'vitest'

import {
  buildSkillsBuilderUsageTooltip,
  buildSkillsBuilderAgentUsageMetadata,
  calculateSkillsBuilderAiCredits,
  countWebSearchToolCallsInSteps,
  formatSkillsBuilderUsageTooltip,
  isWebSearchToolCallPart,
  SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL,
  SKILLS_BUILDER_AGENT_MODEL_SLUG,
  sumSkillsBuilderUsageFromMessages,
  VOICE_AI_CREDITS_PER_MINUTE_DOCSBOT_KEY,
} from '@/lib/skills-agent-usage'

describe('skills agent usage helpers', () => {
  it('exposes widget voice credit rates per minute of audio', () => {
    expect(VOICE_AI_CREDITS_PER_MINUTE_DOCSBOT_KEY).toBe(6)
  })

  it('builds metadata with token and web search cost fields', () => {
    const meta = buildSkillsBuilderAgentUsageMetadata(
      {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        inputTokenDetails: {
          noCacheTokens: 800_000,
          cacheReadTokens: 200_000,
          cacheWriteTokens: 0,
        },
        outputTokenDetails: {
          textTokens: 400_000,
          reasoningTokens: 600_000,
        },
        totalTokens: 2_000_000,
      },
      2,
    )

    expect(meta.skillsBuilderAgentUsage.modelSlug).toBe(SKILLS_BUILDER_AGENT_MODEL_SLUG)
    expect(meta.skillsBuilderAgentUsage.openaiModelId).toBe(SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL)
    expect(meta.skillsBuilderAgentUsage.inputTokens).toBe(1_000_000)
    expect(meta.skillsBuilderAgentUsage.outputTokens).toBe(1_000_000)
    expect(meta.skillsBuilderAgentUsage.cachedInputTokens).toBe(200_000)
    expect(meta.skillsBuilderAgentUsage.webSearchCalls).toBe(2)
    expect(meta.skillsBuilderAgentUsage.shellCalls).toBe(0)
    expect(meta.skillsBuilderAgentUsage.shellDurationMs).toBe(0)
    expect(meta.skillsBuilderAgentUsage.estimatedCfShellCostUsd).toBe(0)
    expect(meta.skillsBuilderAgentUsage.estimatedWebSearchCostUsd).toBeCloseTo(0.02, 5)
    expect(meta.skillsBuilderAgentUsage.estimatedCostUsd).toBeGreaterThan(0)
    expect(meta.skillsBuilderAgentUsage.estimatedTokenCostUsd).toBeGreaterThan(0)
    expect(meta.skillsBuilderAgentUsage.aiCredits).toBe(1220)
  })

  it('uses GPT-5.5 selected-model rates in token cost estimates', () => {
    const meta = buildSkillsBuilderAgentUsageMetadata(
      {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        inputTokenDetails: {
          noCacheTokens: 800_000,
          cacheReadTokens: 200_000,
          cacheWriteTokens: 0,
        },
        outputTokenDetails: { textTokens: 1_000_000, reasoningTokens: 0 },
        totalTokens: 2_000_000,
      },
      0,
      {},
      { openaiModelId: 'gpt-5.5' },
    )

    expect(meta.skillsBuilderAgentUsage.modelSlug).toBe('gpt-5-5')
    expect(meta.skillsBuilderAgentUsage.estimatedTokenCostUsd).toBeCloseTo(34.1, 5)
  })

  it('uses gpt-5-4 pricing when openaiModelId is gpt-5.4', () => {
    const shared = {
      inputTokens: 1_000_000,
      outputTokens: 0,
      inputTokenDetails: {
        noCacheTokens: 1_000_000,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
      outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
      totalTokens: 1_000_000,
    }
    const mini = buildSkillsBuilderAgentUsageMetadata(shared, 0, {}, { openaiModelId: 'gpt-5.4-mini' })
    const full = buildSkillsBuilderAgentUsageMetadata(shared, 0, {}, { openaiModelId: 'gpt-5.4' })
    expect(full.skillsBuilderAgentUsage.estimatedTokenCostUsd).toBeGreaterThan(
      mini.skillsBuilderAgentUsage.estimatedTokenCostUsd,
    )
    expect(full.skillsBuilderAgentUsage.modelSlug).toBe('gpt-5-4')
  })

  it('prorates credits to the nearest credit by token usage', () => {
    expect(
      calculateSkillsBuilderAiCredits({ totalTokens: 7_500 }, 'gpt-5.4', false),
    ).toBe(15)
    expect(
      calculateSkillsBuilderAiCredits({ totalTokens: 5_001 }, 'gpt-5.4-mini', false),
    ).toBe(3)
    expect(
      calculateSkillsBuilderAiCredits({ totalTokens: 5_001 }, 'gpt-5.4-mini', true),
    ).toBe(1)
  })

  it('adds fixed credits per web search (DocsBot vs customer OpenAI key)', () => {
    expect(calculateSkillsBuilderAiCredits({}, 'gpt-5.4-mini', false, 2)).toBe(20)
    expect(calculateSkillsBuilderAiCredits({}, 'gpt-5.4-mini', true, 2)).toBe(2)
    expect(
      calculateSkillsBuilderAiCredits({ totalTokens: 5_001 }, 'gpt-5.4-mini', false, 1),
    ).toBe(13)
    expect(calculateSkillsBuilderAiCredits({ totalTokens: 150 }, 'gpt-5.4-mini', false, 1)).toBe(10)
    expect(
      calculateSkillsBuilderAiCredits({ totalTokens: 5_001 }, 'gpt-5.4-mini', true, 1),
    ).toBe(2)
  })

  it('counts web search tool calls across steps', () => {
    expect(
      countWebSearchToolCallsInSteps([
        { toolCalls: [{ toolName: 'web_search' }, { toolName: 'shell' }] },
        { toolCalls: [{ toolName: 'openai.web_search' }] },
      ]),
    ).toBe(2)
  })

  it('includes Cloudflare shell wall time in metadata cost', () => {
    const meta = buildSkillsBuilderAgentUsageMetadata(
      {
        inputTokens: 0,
        outputTokens: 0,
        inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
        outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
        totalTokens: 0,
      },
      0,
      { calls: 2, durationMs: 10_000 },
    )

    expect(meta.skillsBuilderAgentUsage.shellCalls).toBe(2)
    expect(meta.skillsBuilderAgentUsage.shellDurationMs).toBe(10_000)
    expect(meta.skillsBuilderAgentUsage.estimatedCfShellCostUsd).toBeCloseTo(0.0005, 6)
    expect(meta.skillsBuilderAgentUsage.estimatedCostUsd).toBe(
      meta.skillsBuilderAgentUsage.estimatedCfShellCostUsd,
    )
  })

  it('detects web search tool names', () => {
    expect(isWebSearchToolCallPart({ toolName: 'web_search' })).toBe(true)
    expect(isWebSearchToolCallPart({ toolName: 'openai.web_search' })).toBe(true)
    expect(isWebSearchToolCallPart({ toolName: 'shell' })).toBe(false)
  })

  it('sums usage metadata across assistant messages', () => {
    expect(
      sumSkillsBuilderUsageFromMessages([
        {
          role: 'assistant',
          metadata: {
            skillsBuilderAgentUsage: {
              inputTokens: 100,
              cachedInputTokens: 20,
              outputTokens: 50,
              webSearchCalls: 1,
              estimatedCfShellCostUsd: 0.0004,
              estimatedCostUsd: 0.0104,
            },
          },
        },
        {
          role: 'assistant',
          metadata: {
            skillsBuilderAgentUsage: {
              inputTokens: 200,
              cachedInputTokens: 30,
              outputTokens: 75,
              webSearchCalls: 2,
              estimatedCfShellCostUsd: 0.0001,
              estimatedCostUsd: 0.0201,
            },
          },
        },
      ]),
    ).toEqual({
      turns: 2,
      inputTokens: 300,
      cachedInputTokens: 50,
      outputTokens: 125,
      webSearchCalls: 3,
      estimatedCfShellCostUsd: 0.0005,
      estimatedCostUsd: 0.0305,
    })
  })

  it('formats a persisted usage summary for the builder tooltip', () => {
    expect(
      formatSkillsBuilderUsageTooltip({
        inputTokens: 300,
        cachedInputTokens: 50,
        outputTokens: 125,
        webSearchCalls: 3,
        estimatedCfShellCostUsd: 0.0005,
        estimatedCostUsd: 0.0305,
      }),
    ).toBe(
      'Est. costs: Tokens in 300 · cached 50 · out 125 · search 3 · shell ~$0.0005 · total ~$0.0305',
    )
  })

  it('prefers persisted draft usage totals over chat message totals', () => {
    expect(
      buildSkillsBuilderUsageTooltip({
        persistedUsage: {
          inputTokens: 500,
          cachedInputTokens: 80,
          outputTokens: 160,
          webSearchCalls: 4,
          estimatedCfShellCostUsd: 0.0007,
          estimatedCostUsd: 0.042,
        },
        messages: [
          {
            role: 'assistant',
            metadata: {
              skillsBuilderAgentUsage: {
                inputTokens: 100,
                cachedInputTokens: 20,
                outputTokens: 50,
                webSearchCalls: 1,
                estimatedCfShellCostUsd: 0.0004,
                estimatedCostUsd: 0.0104,
              },
            },
          },
        ],
      }),
    ).toBe(
      'Est. costs: Tokens in 500 · cached 80 · out 160 · search 4 · shell ~$0.0007 · total ~$0.0420',
    )
  })

  it('falls back to chat message usage totals when persisted draft totals are missing', () => {
    expect(
      buildSkillsBuilderUsageTooltip({
        messages: [
          {
            role: 'assistant',
            metadata: {
              skillsBuilderAgentUsage: {
                inputTokens: 100,
                cachedInputTokens: 20,
                outputTokens: 50,
                webSearchCalls: 1,
                estimatedCfShellCostUsd: 0.0004,
                estimatedCostUsd: 0.0104,
              },
            },
          },
        ],
      }),
    ).toBe(
      'Est. costs: Tokens in 100 · cached 20 · out 50 · search 1 · shell ~$0.0004 · total ~$0.0104',
    )
  })
})
