export const AVAILABLE_MODELS = [
    {
        id: 'gpt-5-5',
        value: 'gpt-5.5',
        title: 'GPT-5.5',
        description:
            'Highest capability model for the most demanding workflows.',
        creditMultiplier: 24,
        status: 'notRecommended',
        capabilities: { powerful: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-4',
        value: 'gpt-5.4',
        title: 'GPT-5.4',
        description:
            'Best intelligence at scale for agentic and professional workflows.',
        creditMultiplier: 10,
        status: 'recommended',
        capabilities: { powerful: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-4-mini',
        value: 'gpt-5.4-mini',
        title: 'GPT-5.4 mini',
        description:
            'Latest and best small model. Fast, efficient, great for most support use cases.',
        creditMultiplier: 3,
        capabilities: { best: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-4-nano',
        value: 'gpt-5.4-nano',
        title: 'GPT-5.4 nano',
        description:
            'Good for support. As smart as GPT-5 mini, but optimized for faster responses and lower cost.',
        creditMultiplier: 1,
        capabilities: {
            fast: true,
            costEffective: true,
        },
    },
    {
        id: 'gpt-5-2',
        value: 'gpt-5.2',
        title: 'GPT-5.2',
        description:
            'Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning.',
        creditMultiplier: 9,
        hasVerification: true,
    },
    {
        id: 'gpt-5-1',
        value: 'gpt-5.1',
        title: 'GPT-5.1',
        description:
            'Previous flagship with adaptive reasoning and fast responses for complex tasks.',
        creditMultiplier: 6,
        hasVerification: true,
    },
    {
        id: 'gpt-5',
        value: 'gpt-5',
        title: 'GPT-5',
        description:
            'Previous intelligent reasoning model for agentic tasks with configurable reasoning and flexible effort.',
        creditMultiplier: 6,
        hasVerification: true,
    },
    {
        id: 'gpt-5-mini',
        value: 'gpt-5-mini',
        title: 'GPT-5 mini',
        description:
            'Previous smart, fast, and useful model. Good for most support use cases.',
        creditMultiplier: 1,
    },
    {
        id: 'gpt-4.1',
        value: 'gpt-4.1',
        title: 'GPT-4.1',
        description: 'Previous generation model good at instruction following.',
        creditMultiplier: 9,
    },
    {
        id: 'gpt-4.1-mini',
        value: 'gpt-4.1-mini',
        title: 'GPT-4.1 mini',
        description:
            'Previous generation. Faster than GPT-4.1 while still good at instruction following.',
        creditMultiplier: 1,
    },
    {
        id: 'gpt-5-nano',
        value: 'gpt-5-nano',
        title: 'GPT-5 nano',
        description:
            'Affordable and extremely fast at 1x AI credits per message.',
        creditMultiplier: 1,
        capabilities: {
            fast: true,
            costEffective: true,
        },
    },
    {
        id: 'gpt-4.1-nano',
        value: 'gpt-4.1-nano',
        title: 'GPT-4.1 nano',
        description:
            'Previous generation model. We recommend upgrading to at least GPT-4.1 mini.',
        creditMultiplier: 1,
    },
    {
        id: 'gpt-4.5-preview',
        value: 'gpt-4.5-preview',
        title: 'GPT-4.5',
        description:
            'Very slow, expensive ($0.27/question), and low rate limits. Not recommended for most use cases.',
        creditMultiplier: 374,
        expirationDate: 'June 2025',
        status: 'notRecommended',
    },
    {
        id: 'gpt-4o',
        value: 'gpt-4o',
        title: 'GPT-4o',
        description:
            'Previous generation general purpose model. Consider upgrading to GPT-4.1.',
        creditMultiplier: 12,
    },
    {
        id: 'gpt-4o-mini',
        value: 'gpt-4o-mini',
        title: 'GPT-4o mini',
        description:
            'Previous generation model. Consider upgrading to GPT-4.1 mini.',
        creditMultiplier: 1,
    },
    {
        id: 'gpt-4-turbo',
        value: 'gpt-4-turbo',
        title: 'GPT-4 Turbo',
        description: 'Previous generation model. Recommend upgrading to GPT-4.1.',
        creditMultiplier: 52,
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-4',
        value: 'gpt-4',
        title: 'GPT-4',
        description: 'Previous generation model. Recommend upgrading to GPT-4.1.',
        creditMultiplier: 149,
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo',
        value: 'gpt-3.5-turbo',
        title: 'GPT 3.5 Turbo',
        description:
            'Previous generation model. Recommend upgrading to GPT-4.1.',
        creditMultiplier: 1,
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo-0613',
        value: 'gpt-3.5-turbo-0613',
        title: 'GPT 3.5 Turbo',
        description:
            'The legacy June 2023 snapshot of GPT-3.5 Turbo, succeeded by more efficient versions.',
        creditMultiplier: 1,
        status: 'notRecommended',
        expirationDate: 'June 2024',
    },
]

export const getModelLabel = (modelId) =>
    AVAILABLE_MODELS.find((m) => m.value === modelId)?.title ?? modelId

export const getSystemModelVisibility = ({
    selectedModel = 'gpt-5.4-mini',
    short = false,
} = {}) => ({
    'gpt-5.4': true,
    'gpt-5.5': true,
    'gpt-5.4-mini': true,
    'gpt-5.4-nano': true,
    'gpt-5.2': selectedModel === 'gpt-5.2',
    'gpt-5.1': selectedModel === 'gpt-5.1',
    'gpt-5': true,
    'gpt-4.1': !short,
    'gpt-5-mini': true,
    'gpt-4.1-mini': true,
    'gpt-5-nano': selectedModel === 'gpt-5-nano',
    'gpt-4.1-nano': selectedModel === 'gpt-4.1-nano',
    'gpt-4.5-preview': selectedModel === 'gpt-4.5-preview',
    'gpt-4o': !short && selectedModel === 'gpt-4o',
    'gpt-4o-mini': selectedModel === 'gpt-4o-mini',
    'gpt-4-turbo': selectedModel === 'gpt-4-turbo',
    'gpt-4': selectedModel === 'gpt-4',
    'gpt-3.5-turbo': selectedModel === 'gpt-3.5-turbo',
    'gpt-3.5-turbo-0613': selectedModel === 'gpt-3.5-turbo-0613',
})

export const getVisibleSystemModels = (options = {}) => {
    const modelVisibility = getSystemModelVisibility(options)
    return AVAILABLE_MODELS.filter((model) => modelVisibility[model.value])
}

export const getVisibleAiCreditModelMultipliers = (options = {}) =>
    getVisibleSystemModels(options).map(({ title, value, creditMultiplier }) => ({
        title,
        value,
        creditMultiplier,
    }))

export const MODELS_REQUIRING_OPENAI_KEY = []
