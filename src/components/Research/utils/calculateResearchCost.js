export const RESEARCH_MODELS = [
    {
        id: 'gpt-5.5',
        name: 'GPT-5.5',
        creditMultiplier: 24,
        description: 'Highest capability model for the most demanding research tasks',
    },
    {
        id: 'gpt-5.4-mini',
        name: 'GPT-5.4 mini',
        creditMultiplier: 3,
        description: 'Fast, efficient, and recommended for most deep research tasks',
    },
]

const DEFAULT_RESEARCH_MODEL_ID = 'gpt-5.4-mini'

const RESEARCH_MODEL_BY_ID = RESEARCH_MODELS.reduce((models, model) => {
    models[model.id] = model
    return models
}, {})

const RESEARCH_COST_MODELS = {
    ...RESEARCH_MODEL_BY_ID,
    o3: {
        id: 'o3',
        name: 'o3',
        creditMultiplier: 23,
    },
    'o4-mini': {
        id: 'o4-mini',
        name: 'o4-mini',
        creditMultiplier: 5,
    },
}

const LEGACY_RESEARCH_MODEL_MIGRATIONS = {
    o3: 'gpt-5.5',
    'o4-mini': 'gpt-5.4-mini',
    o4mini: 'gpt-5.4-mini',
    o4: 'gpt-5.4-mini',
}

export const normalizeResearchModelId = (modelId) => {
    const normalized = (modelId || '').toString().trim().toLowerCase()
    if (!normalized) return DEFAULT_RESEARCH_MODEL_ID
    if (LEGACY_RESEARCH_MODEL_MIGRATIONS[normalized]) {
        return LEGACY_RESEARCH_MODEL_MIGRATIONS[normalized]
    }
    if (normalized.startsWith('o3-')) return 'gpt-5.5'
    if (normalized.startsWith('o4-mini-') || normalized.startsWith('o4mini-')) {
        return 'gpt-5.4-mini'
    }
    if (normalized.startsWith('gpt-5.5-')) return 'gpt-5.5'
    if (normalized.startsWith('gpt-5.4-mini-')) return 'gpt-5.4-mini'
    return normalized
}

export const getResearchModel = (modelId) =>
    RESEARCH_MODEL_BY_ID[normalizeResearchModelId(modelId)] ||
    RESEARCH_MODEL_BY_ID[DEFAULT_RESEARCH_MODEL_ID]

const normalizeResearchCostModelId = (modelId) => {
    const normalized = (modelId || '').toString().trim().toLowerCase()
    if (!normalized) return DEFAULT_RESEARCH_MODEL_ID
    if (normalized === 'o3' || normalized.startsWith('o3-')) return 'o3'
    if (
        normalized === 'o4-mini' ||
        normalized === 'o4mini' ||
        normalized === 'o4' ||
        normalized.startsWith('o4-mini-') ||
        normalized.startsWith('o4mini-')
    ) {
        return 'o4-mini'
    }
    if (normalized.startsWith('gpt-5.5-')) return 'gpt-5.5'
    if (normalized.startsWith('gpt-5.4-mini-')) return 'gpt-5.4-mini'
    return normalized
}

export const getResearchCostModel = (modelId) =>
    RESEARCH_COST_MODELS[normalizeResearchCostModelId(modelId)] ||
    RESEARCH_COST_MODELS[DEFAULT_RESEARCH_MODEL_ID]

const getUsageValue = (usage, snakeKey, camelKey) =>
    Math.max(0, usage?.[snakeKey] || usage?.[camelKey] || 0)

const countOutputItems = (outputItems, itemType) => {
    const seen = new Set()
    let count = 0

    outputItems.forEach((item, index) => {
        if (item?.type !== itemType) return
        const itemId =
            item.id ||
            item.call_id ||
            item.container_id ||
            `${itemType}:${index}`
        if (seen.has(itemId)) return
        seen.add(itemId)
        count += 1
    })

    return count
}

export const calculateResearchCost = (job) => {
    if (!job) return null

    const response = job.response || {}
    const usage = response.usage || job.tokenUsage || {}
    const selectedModel = getResearchCostModel(job?.model || response?.model)

    // Standard tier pricing per 1M tokens
    const PRICES = {
        'gpt-5.5': { input: 5.0, cachedInput: 0.5, output: 30.0 },
        'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
        o3: { input: 10.0, cachedInput: 2.5, output: 40.0 },
        'o4-mini': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    }

    const p = PRICES[selectedModel.id] || PRICES[DEFAULT_RESEARCH_MODEL_ID]

    const rate = {
        input: p.input / 1_000_000,
        cached: p.cachedInput / 1_000_000,
        output: p.output / 1_000_000,
    }

    const inputTokens = getUsageValue(usage, 'input_tokens', 'inputTokens')

    const cachedTokens = Math.max(
        0,
        (usage.input_tokens_details &&
            usage.input_tokens_details.cached_tokens) ||
            (usage.inputTokensDetails &&
                usage.inputTokensDetails.cachedTokens) ||
            usage.cached_tokens ||
            usage.cachedInputTokens ||
            0,
    )

    const nonCachedTokens = Math.max(0, inputTokens - cachedTokens)
    const outputTokens = getUsageValue(usage, 'output_tokens', 'outputTokens')

    if (!inputTokens && !cachedTokens && !outputTokens && !response.output) {
        return null
    }

    const inputCost = nonCachedTokens * rate.input + cachedTokens * rate.cached

    const outputCost = outputTokens * rate.output

    // Tool call costs
    const outputItems = Array.isArray(response.output) ? response.output : []

    const webSearchCalls = Math.max(
        countOutputItems(outputItems, 'web_search_call'),
        Math.max(0, job.webSearchCallCount || 0),
    )

    const codeInterpreterCalls = Math.max(
        countOutputItems(outputItems, 'code_interpreter_call'),
        Math.max(0, job.codeInterpreterCallCount || 0),
    )

    // Pricing assumptions (o-series deep research)
    const webSearchCostPerCall = 0.01 // $10 / 1k
    const codeInterpreterCostPerCall = 0.03

    const toolsCost =
        webSearchCalls * webSearchCostPerCall +
        codeInterpreterCalls * codeInterpreterCostPerCall

    const totalCost = inputCost + outputCost + toolsCost

    return {
        model: selectedModel.id,
        modelName: selectedModel.name,
        creditMultiplier: selectedModel.creditMultiplier,
        inputTokens,
        cachedTokens,
        nonCachedTokens,
        outputTokens,
        webSearchCalls,
        codeInterpreterCalls,
        inputCost,
        outputCost,
        toolsCost,
        totalCost,
    }
}
