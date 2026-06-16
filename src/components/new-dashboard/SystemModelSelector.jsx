import RadioBox from '@new-dashboard/RadioBox'
import { useCallback, useMemo, useState } from 'react'
import {
    AVAILABLE_MODELS,
    MODELS_REQUIRING_OPENAI_KEY,
    getModelLabel,
    getSystemModelVisibility,
} from '@/lib/systemModels'

export { getModelLabel, MODELS_REQUIRING_OPENAI_KEY }

export default function SystemModelSelector({
    team,
    model: modelProp,
    onModelChange,
    disabled = false,
    short = false,
    defaultModel = 'gpt-5.4-mini',
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

    const modelVisibility = useMemo(
        () => getSystemModelVisibility({ selectedModel, short }),
        [short, selectedModel],
    )

    const recommendedGpt54Model = 'gpt-5.4-mini'
    const isUsingTeamOpenAIKey = Boolean(team?.openAIKey)

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
                        hasVerification={
                            isUsingTeamOpenAIKey && modelItem.hasVerification
                        }
                        expirationDate={modelItem.expirationDate}
                        lifecycle={modelItem.lifecycle}
                        creditMultiplier={
                            isUsingTeamOpenAIKey
                                ? 1
                                : modelItem.creditMultiplier
                        }
                        creditMultiplierTooltip={
                            isUsingTeamOpenAIKey
                                ? '1x AI credits per message (5k tokens) with your OpenAI key.'
                                : `${modelItem.creditMultiplier}x AI credits per message (5k tokens).`
                        }
                    />
                ) : null,
            )}
        </fieldset>
    )
}
