import { XMarkIcon } from '@heroicons/react/20/solid'
import { useGlossaryEntry } from './GlossaryEntry.hooks'

export default function GlossaryEntry({
    entry,
    onChange,
    onRemove,
    disabled = false,
    wordPlaceholder = 'Word',
    translationPlaceholder = 'Equivalent in sources',
    className = '',
}) {
    const {
        word,
        translation,
        commitChanges,
        handleWordChange,
        handleTranslationChange,
    } = useGlossaryEntry({ entry, onChange })

    return (
        <div
            className={`flex items-start pt-2 ${className}`.trim()}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    commitChanges()
                }
            }}
        >
            <div className="grid w-full grid-cols-2 gap-2 text-sm">
                <div>
                    <input
                        type="text"
                        value={word}
                        autoComplete="off"
                        onChange={(event) =>
                            handleWordChange(event.target.value)
                        }
                        placeholder={wordPlaceholder}
                        disabled={disabled}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        value={translation}
                        autoComplete="off"
                        onChange={(event) =>
                            handleTranslationChange(event.target.value)
                        }
                        placeholder={translationPlaceholder}
                        disabled={disabled}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                    />
                </div>
            </div>
            <div className="m-auto flex items-center text-center">
                <button
                    type="button"
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={onRemove ? () => onRemove() : undefined}
                    disabled={disabled || !onRemove}
                >
                    <span className="sr-only">
                        Remove Glossary entry: {word}
                    </span>
                    <XMarkIcon
                        className="h-5 w-5 text-gray-700"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </div>
    )
}
