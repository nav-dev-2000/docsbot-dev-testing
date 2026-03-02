import { useCallback, useEffect, useMemo, useState } from 'react'
import { checkPlanPermission } from '@/utils/helpers'

const resolveGlossaryPermission = (team) => {
    if (!team) {
        return { allowed: true, requiredPlanLabel: '' }
    }

    return checkPlanPermission(team, 'pro', 'glossary')
}

const resolveGlossary = ({ glossary, bot }) => {
    if (glossary !== undefined) {
        return glossary ?? []
    }

    return bot?.glossary ?? []
}

export const useGlossary = ({
    team,
    bot,
    glossary: glossaryProp,
    onGlossaryChange,
    onUpgradeRequired,
    disabled = false,
} = {}) => {
    const isControlled = glossaryProp !== undefined
    const [internalGlossary, setInternalGlossary] = useState(() =>
        resolveGlossary({ glossary: glossaryProp, bot }),
    )

    useEffect(() => {
        if (isControlled) {
            return
        }

        setInternalGlossary(resolveGlossary({ bot }))
    }, [bot?.glossary, isControlled])

    const glossary = isControlled ? (glossaryProp ?? []) : internalGlossary

    const glossaryPermission = useMemo(
        () => resolveGlossaryPermission(team),
        [team],
    )
    const canUseGlossary = glossaryPermission.allowed
    const entryDisabled = disabled || !canUseGlossary

    const commitGlossary = useCallback(
        (nextGlossary) => {
            if (!isControlled) {
                setInternalGlossary(nextGlossary)
            }

            if (onGlossaryChange) {
                onGlossaryChange(nextGlossary)
            }
        },
        [isControlled, onGlossaryChange],
    )

    const updateGlossary = useCallback(
        (index, nextEntry) => {
            const nextGlossary = [...glossary]
            nextGlossary[index] = nextEntry
            commitGlossary(nextGlossary)
        },
        [commitGlossary, glossary],
    )

    const removeGlossary = useCallback(
        (index) => {
            const nextGlossary = [...glossary]
            nextGlossary.splice(index, 1)
            commitGlossary(nextGlossary)
        },
        [commitGlossary, glossary],
    )

    const addGlossary = useCallback(() => {
        if (!canUseGlossary) {
            if (onUpgradeRequired) {
                onUpgradeRequired()
            }
            return
        }

        const nextGlossary = [...glossary, { word: '', translation: '' }]
        commitGlossary(nextGlossary)
    }, [canUseGlossary, commitGlossary, glossary, onUpgradeRequired])

    return {
        glossary,
        addGlossary,
        updateGlossary,
        removeGlossary,
        entryDisabled,
        glossaryPermission,
        canUseGlossary,
        isControlled,
    }
}
