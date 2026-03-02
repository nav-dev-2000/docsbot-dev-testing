import { useCallback, useEffect, useState } from 'react'

const getEntryValue = (entry, key) => entry?.[key] ?? ''

export const useGlossaryEntry = ({ entry, onChange }) => {
    const [word, setWord] = useState(getEntryValue(entry, 'word'))
    const [translation, setTranslation] = useState(
        getEntryValue(entry, 'translation'),
    )
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (!isDirty) {
            setWord(getEntryValue(entry, 'word'))
            setTranslation(getEntryValue(entry, 'translation'))
        }
    }, [entry?.word, entry?.translation, isDirty])

    const commitChanges = useCallback(() => {
        if (isDirty) {
            if (onChange) {
                onChange({ word, translation })
            }
            setIsDirty(false)
        }
    }, [isDirty, onChange, word, translation])

    const handleWordChange = useCallback((value) => {
        setWord(value)
        setIsDirty(true)
    }, [])

    const handleTranslationChange = useCallback((value) => {
        setTranslation(value)
        setIsDirty(true)
    }, [])

    return {
        word,
        translation,
        isDirty,
        commitChanges,
        handleWordChange,
        handleTranslationChange,
    }
}
