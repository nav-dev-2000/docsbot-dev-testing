import { useCallback, useMemo, useState } from 'react'
import { checkPlanPermission } from '@/utils/helpers'

export function useModelSelector({
    team,
    model: modelProp,
    defaultModel = 'gpt-5-mini',
    onModelChange,
    short = false,
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
        const canUsePersonal = checkPlanPermission(team, 'personal').allowed

        return {
            'gpt-5.2': true,
            'gpt-5.1': true,
            'gpt-5': selectedModel === 'gpt-5',
            'gpt-4.1': !short,
            'gpt-5-mini': true,
            'gpt-4.1-mini': true,
            'gpt-5-nano':
                (canUsePersonal && !short) || selectedModel === 'gpt-5-nano',
            'gpt-4.1-nano': !short,
            'gpt-4.5-preview': selectedModel === 'gpt-4.5-preview',
            'gpt-4o': !short,
            'gpt-4o-mini': selectedModel === 'gpt-4o-mini',
            'gpt-4-turbo': selectedModel === 'gpt-4-turbo',
            'gpt-4': selectedModel === 'gpt-4',
            'gpt-3.5-turbo': selectedModel === 'gpt-3.5-turbo',
            'gpt-3.5-turbo-0613': selectedModel === 'gpt-3.5-turbo-0613',
        }
    }, [short, selectedModel, team])

    return {
        model: selectedModel,
        modelVisibility,
        setModel,
        showHelperText: short,
    }
}
