import { LLMS } from '@/constants/llms.constants'
import { LLM_PRICING } from '@/constants/llmPricing.constants'

/** Skills builder agent always uses this OpenAI model id; BYOK only changes which API key is used. */
export const SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini'

/** @deprecated Use {@link SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL} + slug resolver. */
export const SKILLS_BUILDER_AGENT_MODEL_SLUG = 'gpt-5-4-mini'

const OPENAI_MODEL_ID_TO_LLM_SLUG = {
  'gpt-5.5': 'gpt-5-5',
  'gpt-5.4': 'gpt-5-4',
  'gpt-5.4-mini': 'gpt-5-4-mini',
}

const AI_CREDIT_TOKEN_UNIT = 5000

/** AI credits per completed web_search when DocsBot hosts OpenAI API usage. */
export const WEB_SEARCH_AI_CREDITS_PER_CALL_DOCSBOT_KEY = 10

/** AI credits per completed web_search when the team uses its own OpenAI API key (BYOK). */
export const WEB_SEARCH_AI_CREDITS_PER_CALL_CUSTOMER_KEY = 1

/** Widget caps each voice clip at this many seconds. */
export const VOICE_MESSAGE_MAX_DURATION_SECONDS = 30

/**
 * Approximate AI credits per minute of widget voice audio (DocsBot-hosted transcription).
 */
export const VOICE_AI_CREDITS_PER_MINUTE_DOCSBOT_KEY = 6

const DOCSBOT_KEY_MODEL_MULTIPLIERS = {
  'gpt-5.4-mini': 3,
  'gpt-5.4-nano': 1,
  'gpt-5.4': 10,
  'gpt-5.5': 24,
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
  const llm = LLMS.find((m) => m.slug === slug) || null
  const pricingRow =
    Object.values(LLM_PRICING)
      .flat()
      .find((m) => m.model_slug === slug) || null

  return {
    inputCostPerMillion:
      llm?.input_cost_per_million_tokens ??
      pricingRow?.input_token_cost_per_million ??
      0,
    cachedInputCostPerMillion:
      pricingRow?.cached_input_token_cost_per_million ??
      (llm?.input_cost_per_million_tokens != null
        ? llm.input_cost_per_million_tokens * CACHE_READ_INPUT_RATE_MULTIPLIER
        : 0),
    outputCostPerMillion:
      llm?.output_cost_per_million_tokens ??
      pricingRow?.output_token_cost_per_million ??
      0,
  }
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
  const usedTeamOpenAIKey = Boolean(options.usedTeamOpenAIKey)
  const modelSlug = skillsBuilderOpenaiModelToLlmSlug(openaiModelId)
  const llm = resolveLlmPricing(modelSlug)
  const inputTokens = totalUsage.inputTokens ?? 0
  const outputTokens = totalUsage.outputTokens ?? 0
  const totalTokens = totalUsage.totalTokens ?? inputTokens + outputTokens
  const cacheRead =
    totalUsage.inputTokenDetails?.cacheReadTokens ?? totalUsage.cachedInputTokens ?? 0
  const cacheWrite = totalUsage.inputTokenDetails?.cacheWriteTokens ?? 0
  const noCache = totalUsage.inputTokenDetails?.noCacheTokens
  const reasoningTokens = totalUsage.outputTokenDetails?.reasoningTokens

  const uncachedInput =
    typeof noCache === 'number' ? noCache : Math.max(0, inputTokens - cacheRead)

  const inputRate = llm.inputCostPerMillion
  const outputRate = llm.outputCostPerMillion
  const cacheReadRate = llm.cachedInputCostPerMillion

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
  const aiCredits = calculateSkillsBuilderAiCredits(
    { totalTokens, inputTokens, outputTokens },
    openaiModelId,
    usedTeamOpenAIKey,
    webSearchCalls,
  )

  return {
    skillsBuilderAgentUsage: {
      openaiModelId,
      modelSlug,
      inputTokens,
      outputTokens,
      totalTokens,
      cachedInputTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      reasoningTokens,
      aiCredits,
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

export function skillsBuilderModelCreditMultiplier(openaiModelId, usedTeamOpenAIKey = false) {
  if (usedTeamOpenAIKey) return 1
  return DOCSBOT_KEY_MODEL_MULTIPLIERS[String(openaiModelId || '').trim()] || 1
}

export function calculateSkillsBuilderAiCredits(
  usage = {},
  openaiModelId = SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL,
  usedTeamOpenAIKey = false,
  webSearchCalls = 0,
) {
  const totalTokens = Number.isFinite(Number(usage.totalTokens))
    ? Number(usage.totalTokens)
    : Number(usage.inputTokens || 0) + Number(usage.outputTokens || 0)
  const multiplier = skillsBuilderModelCreditMultiplier(openaiModelId, usedTeamOpenAIKey)
  const tokenCredits = Math.round((Math.max(0, totalTokens) / AI_CREDIT_TOKEN_UNIT) * multiplier)
  const searchCalls = Math.max(0, Math.trunc(Number(webSearchCalls) || 0))
  const searchCredits =
    searchCalls *
    (usedTeamOpenAIKey
      ? WEB_SEARCH_AI_CREDITS_PER_CALL_CUSTOMER_KEY
      : WEB_SEARCH_AI_CREDITS_PER_CALL_DOCSBOT_KEY)
  return Math.max(1, tokenCredits + searchCredits)
}

export function skillBuilderAiCreditTooltip(usage, usedTeamOpenAIKey = false) {
  const aiCredits = Number.isFinite(Number(usage?.aiCredits))
    ? Number(usage.aiCredits)
    : calculateSkillsBuilderAiCredits(
        usage,
        usage?.openaiModelId,
        usedTeamOpenAIKey,
        usage?.webSearchCalls,
      )
  if (usedTeamOpenAIKey) {
    return `${aiCredits} AI credits used. Your OpenAI key: 1x per message (5k tokens); ${WEB_SEARCH_AI_CREDITS_PER_CALL_CUSTOMER_KEY} credit per web search.`
  }
  const multiplier = skillsBuilderModelCreditMultiplier(usage?.openaiModelId, false)
  return `${aiCredits} AI credits used. ${multiplier}x per message (5k tokens); ${WEB_SEARCH_AI_CREDITS_PER_CALL_DOCSBOT_KEY} credits per web search.`
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
    usage.aiCredits,
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
    if (typeof usage.aiCredits === 'number') {
      totals.aiCredits = (totals.aiCredits || 0) + usage.aiCredits
    }
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
  const aiCredits = typeof usage.aiCredits === 'number' ? usage.aiCredits : null
  const webSearchCalls = typeof usage.webSearchCalls === 'number' ? usage.webSearchCalls : 0
  const shellUsd =
    typeof usage.estimatedCfShellCostUsd === 'number' ? usage.estimatedCfShellCostUsd : 0
  const totalUsd = typeof usage.estimatedCostUsd === 'number' ? usage.estimatedCostUsd : 0

  const creditPrefix = aiCredits != null ? `Credits ${aiCredits} · ` : ''
  return `Est. costs: ${creditPrefix}Tokens in ${inputTokens} · cached ${cachedInputTokens} · out ${outputTokens} · search ${webSearchCalls} · shell ~$${shellUsd.toFixed(4)} · total ~$${totalUsd.toFixed(4)}`
}

export function buildSkillsBuilderUsageTooltip({ persistedUsage, messages } = {}) {
  if (hasAnyUsageNumbers(persistedUsage)) {
    return formatSkillsBuilderUsageTooltip(persistedUsage)
  }
  return formatSkillsBuilderUsageTooltip(sumSkillsBuilderUsageFromMessages(messages))
}
