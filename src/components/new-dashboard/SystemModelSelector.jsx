import RadioBox from '@new-dashboard/RadioBox'
import { useCallback, useMemo, useState } from 'react'

const AVAILABLE_MODELS = [
    {
        id: 'gpt-5-4',
        value: 'gpt-5.4',
        title: 'GPT-5.4',
        description:
            'Best intelligence at scale for agentic and professional workflows.',
        status: 'recommended',
        capabilities: { powerful: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-2',
        value: 'gpt-5.2',
        title: 'GPT-5.2',
        description:
            'Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning.',
        hasVerification: true,
    },
    {
        id: 'gpt-5-1',
        value: 'gpt-5.1',
        title: 'GPT-5.1',
        description:
            'Previous flagship with adaptive reasoning and fast responses for complex tasks.',
        hasVerification: true,
    },
    {
        id: 'gpt-5',
        value: 'gpt-5',
        title: 'GPT-5',
        description:
            'Previous intelligent reasoning model for agentic tasks with configurable reasoning and flexible effort.',
        hasVerification: true,
    },
    {
        id: 'gpt-4.1',
        value: 'gpt-4.1',
        title: 'GPT-4.1',
        description: 'Previous generation model good at instruction following.',
    },
    {
        id: 'gpt-5-4-mini',
        value: 'gpt-5.4-mini',
        title: 'GPT-5.4 mini',
        description:
            'Latest and best small model. Fast, efficient, great for most support use cases.',
        capabilities: { best: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-4-nano',
        value: 'gpt-5.4-nano',
        title: 'GPT-5.4 nano',
        description:
            'Good for support. As smart as GPT-5 mini, but optimized for faster responses and lower cost.',
        capabilities: {
            fast: true,
            costEffective: true,
        },
    },
    {
        id: 'gpt-5-mini',
        value: 'gpt-5-mini',
        title: 'GPT-5 mini',
        description:
            'Previous smart, fast, and useful model. Good for most support use cases.',
    },
    {
        id: 'gpt-4.1-mini',
        value: 'gpt-4.1-mini',
        title: 'GPT-4.1 mini',
        description:
            'Previous generation. Faster than GPT-4.1 while still good at instruction following.',
    },
    {
        id: 'gpt-5-nano',
        value: 'gpt-5-nano',
        title: 'GPT-5 nano',
        description:
            'Included in all plans. Affordable & extremely fast model.',
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
    },
    {
        id: 'gpt-4.5-preview',
        value: 'gpt-4.5-preview',
        title: 'GPT-4.5',
        description:
            'Very slow, expensive ($0.27/question), and low rate limits. Not recommended for most use cases.',
        expirationDate: 'June 2025',
        status: 'notRecommended',
    },
    {
        id: 'gpt-4o',
        value: 'gpt-4o',
        title: 'GPT-4o',
        description:
            'Previous generation general purpose model. Consider upgrading to GPT-4.1.',
    },
    {
        id: 'gpt-4o-mini',
        value: 'gpt-4o-mini',
        title: 'GPT-4o mini',
        description:
            'Previous generation model. Consider upgrading to GPT-4.1 mini.',
    },
    {
        id: 'gpt-4-turbo',
        value: 'gpt-4-turbo',
        title: 'GPT-4 Turbo',
        description: 'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-4',
        value: 'gpt-4',
        title: 'GPT-4',
        description: 'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo',
        value: 'gpt-3.5-turbo',
        title: 'GPT 3.5 Turbo',
        description:
            'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo-0613',
        value: 'gpt-3.5-turbo-0613',
        title: 'GPT 3.5 Turbo',
        description:
            'The legacy June 2023 snapshot of GPT-3.5 Turbo, succeeded by more efficient versions.',
        status: 'notRecommended',
        expirationDate: 'June 2024',
    },
]

export const getModelLabel = (modelId) =>
    AVAILABLE_MODELS.find((m) => m.value === modelId)?.title ?? modelId

export const MODELS_REQUIRING_OPENAI_KEY = [
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5',
    'gpt-4.1',
    'gpt-4o',
]

const MODELS_INCLUDED_WITHOUT_KEY = [
    'gpt-5.4-nano',
    'gpt-5-nano',
    'gpt-5-mini',
    'gpt-4o-mini',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
]

export default function SystemModelSelector({
    team,
    model: modelProp,
    onModelChange,
    disabled = false,
    short = false,
    defaultModel = 'gpt-5.4-nano',
}) {
    const isControlled = modelProp !== undefined
    const [internalModel, setInternalModel] = useState(defaultModel)
    const selectedModel = isControlled ? modelProp : internalModel

    const setModel = useCallback(
        (nextModel) => {
            if (!isControlled) {
                setInternalModel(nextModel)
            }
            onModelChange?.(nextModel)
        },
        [isControlled, onModelChange],
    )

    const modelVisibility = useMemo(() => {
        return {
            'gpt-5.4': true,
            // Show GPT-5.4 mini always (disabled when no OpenAI key, like GPT-5.4).
            'gpt-5.4-mini': true,
            // GPT-5.4 nano is allowed without an OpenAI key for free teams.
            'gpt-5.4-nano': true,
            // GPT-5.2 is treated as legacy: hide it unless it's already selected.
            'gpt-5.2': selectedModel === 'gpt-5.2',
            'gpt-5.1': selectedModel === 'gpt-5.1',
            // GPT-5 is not legacy: always show as an option.
            'gpt-5': true,
            'gpt-4.1': !short,
            'gpt-5-mini': true,
            'gpt-4.1-mini': true,
            'gpt-5-nano': selectedModel === 'gpt-5-nano',
            'gpt-4.1-nano': selectedModel === 'gpt-4.1-nano',
            'gpt-4.5-preview': selectedModel === 'gpt-4.5-preview',
            // GPT-4o is a legacy model: hide unless it's already saved on the bot.
            'gpt-4o': !short && selectedModel === 'gpt-4o',
            'gpt-4o-mini': selectedModel === 'gpt-4o-mini',
            'gpt-4-turbo': selectedModel === 'gpt-4-turbo',
            'gpt-4': selectedModel === 'gpt-4',
            'gpt-3.5-turbo': selectedModel === 'gpt-3.5-turbo',
            'gpt-3.5-turbo-0613': selectedModel === 'gpt-3.5-turbo-0613',
        }
    }, [short, selectedModel, team?.openAIKey])

    const recommendedGpt54Model = team?.openAIKey
        ? 'gpt-5.4-mini'
        : 'gpt-5.4-nano'

    return (
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="sr-only">OpenAI Models</legend>

            {AVAILABLE_MODELS.map((modelItem) =>
                modelVisibility[modelItem.value] ? (
                    <RadioBox
                        key={modelItem.id}
                        id={modelItem.id}
                        name="model"
                        value={modelItem.value}
                        checked={selectedModel === modelItem.value}
                        onChange={() => setModel(modelItem.value)}
                        disabled={disabled}
                        title={modelItem.title}
                        description={modelItem.description}
                        status={
                            modelItem.value === recommendedGpt54Model
                                ? 'recommended'
                                : modelItem.status
                        }
                        capabilities={modelItem.capabilities}
                        hasVerification={modelItem.hasVerification}
                        expirationDate={modelItem.expirationDate}
                        lifecycle={modelItem.lifecycle}
                        included={
                            !team?.openAIKey &&
                            MODELS_INCLUDED_WITHOUT_KEY.includes(
                                modelItem.value,
                            )
                        }
                    />
                ) : null,
            )}
        </fieldset>
    )
}

