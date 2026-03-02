import { PlusIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { GlossaryEntry as DefaultGlossaryEntry } from '@/components/GlossaryEntry'
import { useGlossary } from './Glossary.hooks'

export default function Glossary({
    team,
    bot,
    glossary: glossaryProp,
    onGlossaryChange,
    onUpgradeRequired,
    disabled = false,
    GlossaryEntry = DefaultGlossaryEntry,
    showTitle = true,
    showDescription = true,
}) {
    const {
        glossary,
        addGlossary,
        updateGlossary,
        removeGlossary,
        entryDisabled,
        glossaryPermission,
        canUseGlossary,
    } = useGlossary({
        team,
        bot,
        glossary: glossaryProp,
        onGlossaryChange,
        onUpgradeRequired,
        disabled,
    })
    const addDisabled = disabled || (!canUseGlossary && !onUpgradeRequired)

    return (
        <fieldset id="glossary" aria-describedby="glossary-description">
            <div>
                {showTitle && (
                    <legend
                        htmlFor="glossary"
                        className="block text-sm font-medium text-gray-900"
                    >
                        Glossary
                        {!glossaryPermission.allowed ? (
                            <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                {glossaryPermission.requiredPlanLabel}
                            </span>
                        ) : (
                            <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                New!
                            </span>
                        )}
                    </legend>
                )}
                {showDescription && (
                    <p
                        id="glossary-description"
                        className="text-sm text-gray-500"
                    >
                        Define a list of words and their equivalents in your
                        documentation for the bot to use when finding relevant
                        sources. This can help the bot understand the user's
                        question better when using brand or product-specific
                        terminology or translations. Words are case-insensitive
                        and only the full word is matched.
                        <Link
                            href="https://docsbot.ai/documentation/doc/glossary-improve-search-relevance-with-smart-term-replacement"
                            target="_blank"
                            className="ml-1 text-cyan-600 hover:text-cyan-500"
                        >
                            Learn more &rarr;
                        </Link>
                    </p>
                )}
                {glossary.map((entry, index) => (
                    <GlossaryEntry
                        entry={entry}
                        key={index}
                        disabled={entryDisabled}
                        onChange={(nextEntry) =>
                            updateGlossary(index, nextEntry)
                        }
                        onRemove={() => removeGlossary(index)}
                    />
                ))}
                <div className="mt-2 flex justify-center">
                    <button
                        type="button"
                        className="flex items-center justify-center rounded-md px-2 py-1 text-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                        onClick={() => addGlossary()}
                        disabled={addDisabled}
                    >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Add
                    </button>
                </div>
            </div>
        </fieldset>
    )
}
