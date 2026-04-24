import { LLMS } from '@/constants/llms.constants'

/** Skills builder agent always uses this OpenAI model id; BYOK only changes which API key is used. */
export const SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini'

/** @deprecated Use {@link SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL} + slug resolver. */
export const SKILLS_BUILDER_AGENT_MODEL_SLUG = 'gpt-5-4-mini'

const OPENAI_MODEL_ID_TO_LLM_SLUG = {
  'gpt-5.4': 'gpt-5-4',
  [SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL]: 'gpt-5-4-mini',
}

export function skillsBuilderOpenaiModelToLlmSlug(openaiModelId) {
  return OPENAI_MODEL_ID_TO_LLM_SLUG[openaiModelId] || OPENAI_MODEL_ID_TO_LLM_SLUG[SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL]
}

/**
 * Heuristic USD per completed web_search tool call (OpenAI bills this separately from tokens).
 * Override with env for your org if needed.
 */
const WEB_SEARCH_USD_PER_CALL = Number(process.env.SKILLS_BUILDER_WEB_SEARCH_USD_PER_CALL) || 0.01

/**
 * Heuristic Cloudflare sandbox (skills builder shell) cost: per completed shell tool call plus wall-clock seconds.
 * Tune to match your Workers + container usage. Defaults are order-of-magnitude placeholders only.
 */
const CF_SHELL_USD_PER_INVOCATION =
  Number(process.env.SKILLS_BUILDER_CF_SHELL_USD_PER_INVOCATION) || 0
const CF_SHELL_USD_PER_SECOND =
  Number(process.env.SKILLS_BUILDER_CF_SHELL_USD_PER_SECOND) || 0.00005

/** Cached prompt tokens are billed lower; ~90% discount vs uncached input is typical for OpenAI cache reads. */
const CACHE_READ_INPUT_RATE_MULTIPLIER = 0.1

function resolveLlmPricing(slug) {
  return LLMS.find((m) => m.slug === slug) || null
}

/**
 * @param {object} totalUsage
 * @param {number} webSearchCalls
 * @param {{ calls?: number, durationMs?: number }} [shellUsage]
 * @param {{ openaiModelId?: string }} [options]
 */
export function buildSkillsBuilderAgentUsageMetadata(
  totalUsage,
  webSearchCalls,
  shellUsage = {},
  options = {},
) {
  const openaiModelId = options.openaiModelId || SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL
  const modelSlug = skillsBuilderOpenaiModelToLlmSlug(openaiModelId)
  const llm = resolveLlmPricing(modelSlug)
  const inputTokens = totalUsage.inputTokens ?? 0
  const outputTokens = totalUsage.outputTokens ?? 0
  const cacheRead =
    totalUsage.inputTokenDetails?.cacheReadTokens ?? totalUsage.cachedInputTokens ?? 0
  const cacheWrite = totalUsage.inputTokenDetails?.cacheWriteTokens ?? 0
  const noCache = totalUsage.inputTokenDetails?.noCacheTokens
  const reasoningTokens = totalUsage.outputTokenDetails?.reasoningTokens

  const uncachedInput =
    typeof noCache === 'number' ? noCache : Math.max(0, inputTokens - cacheRead)

  const inputRate = llm?.input_cost_per_million_tokens ?? 0
  const outputRate = llm?.output_cost_per_million_tokens ?? 0
  const cacheReadRate = inputRate * CACHE_READ_INPUT_RATE_MULTIPLIER

  const estimatedTokenCostUsd =
    (uncachedInput / 1_000_000) * inputRate +
    (cacheRead / 1_000_000) * cacheReadRate +
    (cacheWrite / 1_000_000) * inputRate +
    (outputTokens / 1_000_000) * outputRate

  const estimatedWebSearchCostUsd = webSearchCalls * WEB_SEARCH_USD_PER_CALL

  const shellCalls = shellUsage.calls ?? 0
  const shellDurationMs = shellUsage.durationMs ?? 0
  const estimatedCfShellCostUsd =
    shellCalls * CF_SHELL_USD_PER_INVOCATION + (shellDurationMs / 1000) * CF_SHELL_USD_PER_SECOND

  const estimatedCostUsd =
    estimatedTokenCostUsd + estimatedWebSearchCostUsd + estimatedCfShellCostUsd

  return {
    skillsBuilderAgentUsage: {
      openaiModelId,
      modelSlug,
      inputTokens,
      outputTokens,
      cachedInputTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      reasoningTokens,
      webSearchCalls,
      shellCalls,
      shellDurationMs,
      estimatedCostUsd,
      estimatedTokenCostUsd,
      estimatedWebSearchCostUsd,
      estimatedCfShellCostUsd,
    },
  }
}

export function isWebSearchToolCallPart(part) {
  if (!part || typeof part !== 'object') return false
  const name = part.toolName
  return name === 'web_search' || name === 'openai.web_search'
}

/** Count completed web_search tool calls across all generation steps (for usage persistence). */
export function countWebSearchToolCallsInSteps(steps = []) {
  let n = 0
  for (const step of steps) {
    for (const call of step.toolCalls || []) {
      if (isWebSearchToolCallPart(call)) n += 1
    }
  }
  return n
}

function hasAnyUsageNumbers(usage) {
  if (!usage || typeof usage !== 'object') return false
  return [
    usage.inputTokens,
    usage.cachedInputTokens,
    usage.outputTokens,
    usage.webSearchCalls,
    usage.estimatedCfShellCostUsd,
    usage.estimatedCostUsd,
    usage.turns,
  ].some((value) => typeof value === 'number' && !Number.isNaN(value))
}

export function sumSkillsBuilderUsageFromMessages(messages = []) {
  const totals = {
    turns: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    webSearchCalls: 0,
    estimatedCfShellCostUsd: 0,
    estimatedCostUsd: 0,
  }

  for (const message of messages || []) {
    if (message?.role !== 'assistant') continue
    const usage = message.metadata?.skillsBuilderAgentUsage
    if (!usage || typeof usage !== 'object') continue

    totals.turns += 1
    if (typeof usage.inputTokens === 'number') totals.inputTokens += usage.inputTokens
    if (typeof usage.cachedInputTokens === 'number') {
      totals.cachedInputTokens += usage.cachedInputTokens
    }
    if (typeof usage.outputTokens === 'number') totals.outputTokens += usage.outputTokens
    if (typeof usage.webSearchCalls === 'number') totals.webSearchCalls += usage.webSearchCalls
    if (typeof usage.estimatedCfShellCostUsd === 'number') {
      totals.estimatedCfShellCostUsd += usage.estimatedCfShellCostUsd
    }
    if (typeof usage.estimatedCostUsd === 'number') {
      totals.estimatedCostUsd += usage.estimatedCostUsd
    }
  }

  return totals.turns > 0 ? totals : null
}

export function formatSkillsBuilderUsageTooltip(usage) {
  if (!hasAnyUsageNumbers(usage)) return null

  const inputTokens = typeof usage.inputTokens === 'number' ? usage.inputTokens : 0
  const cachedInputTokens =
    typeof usage.cachedInputTokens === 'number' ? usage.cachedInputTokens : 0
  const outputTokens = typeof usage.outputTokens === 'number' ? usage.outputTokens : 0
  const webSearchCalls = typeof usage.webSearchCalls === 'number' ? usage.webSearchCalls : 0
  const shellUsd =
    typeof usage.estimatedCfShellCostUsd === 'number' ? usage.estimatedCfShellCostUsd : 0
  const totalUsd = typeof usage.estimatedCostUsd === 'number' ? usage.estimatedCostUsd : 0

  return `Est. costs: Tokens in ${inputTokens} · cached ${cachedInputTokens} · out ${outputTokens} · search ${webSearchCalls} · shell ~$${shellUsd.toFixed(4)} · total ~$${totalUsd.toFixed(4)}`
}

export function buildSkillsBuilderUsageTooltip({ persistedUsage, messages } = {}) {
  if (hasAnyUsageNumbers(persistedUsage)) {
    return formatSkillsBuilderUsageTooltip(persistedUsage)
  }
  return formatSkillsBuilderUsageTooltip(sumSkillsBuilderUsageFromMessages(messages))
}
