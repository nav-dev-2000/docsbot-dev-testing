export const calculateResearchCost = (job) => {
    if (!job?.response?.usage) return null

    const response = job.response
    const usage = response.usage || {}

    // Determine model
    const pickModel = () => {
        const m = (job?.model || response?.model || '').toString().toLowerCase()
        if (m.includes('o3')) return 'o3'
        if (m.includes('o4-mini') || m.includes('o4mini') || m.includes('o4'))
            return 'o4-mini'
        return 'o4-mini'
    }

    const model = pickModel()

    // Standard tier pricing per 1M tokens
    const PRICES = {
        o3: { input: 10.0, cachedInput: 2.5, output: 40.0 },
        'o4-mini': { input: 2.0, cachedInput: 0.5, output: 8.0 },
    }

    const p = PRICES[model] || PRICES['o4-mini']

    const rate = {
        input: p.input / 1_000_000,
        cached: p.cachedInput / 1_000_000,
        output: p.output / 1_000_000,
    }

    const inputTokens = Math.max(0, usage.input_tokens || 0)

    const cachedTokens = Math.max(
        0,
        (usage.input_tokens_details &&
            usage.input_tokens_details.cached_tokens) ||
            usage.cached_tokens ||
            0,
    )

    const nonCachedTokens = Math.max(0, inputTokens - cachedTokens)
    const outputTokens = Math.max(0, usage.output_tokens || 0)

    const inputCost = nonCachedTokens * rate.input + cachedTokens * rate.cached

    const outputCost = outputTokens * rate.output

    // Tool call costs
    const outputItems = Array.isArray(response.output) ? response.output : []

    const webSearchCalls = outputItems.filter(
        (i) => i?.type === 'web_search_call',
    ).length

    const codeInterpreterCalls = outputItems.filter(
        (i) => i?.type === 'code_interpreter_call',
    ).length

    // Pricing assumptions (o-series deep research)
    const webSearchCostPerCall = 0.01 // $10 / 1k
    const codeInterpreterCostPerCall = 0.03

    const toolsCost =
        webSearchCalls * webSearchCostPerCall +
        codeInterpreterCalls * codeInterpreterCostPerCall

    const totalCost = inputCost + outputCost + toolsCost

    return {
        model,
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
