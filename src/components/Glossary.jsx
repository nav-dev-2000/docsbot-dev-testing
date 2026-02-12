import { PlusIcon } from '@heroicons/react/20/solid'
import { checkPlanPermission } from '@/utils/helpers'
import Link from 'next/link'

export default function Glossary({
  team,
  glossary,
  addGlossary,
  disabled,
  GlossaryEntry,
  showTitle = true,
  showDescription = true,
}) {
  return (
    <fieldset id="glossary" aria-describedby="glossary-description">
      <div>
        {showTitle && (
          <legend
            htmlFor="glossary"
            className="block text-sm font-medium text-gray-900"
          >
            Glossary
            {!checkPlanPermission(team, 'pro', 'glossary').allowed ? (
              <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                {
                  checkPlanPermission(team, 'pro', 'glossary')
                    .requiredPlanLabel
                }
              </span>
            ) : (
              <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                New!
              </span>
            )}
          </legend>
        )}
        {showDescription && (
          <p id="glossary-description" className="text-sm text-gray-500">
            Define a list of words and their equivalents in your
            documentation for the bot to use when finding relevant sources.
            This can help the bot understand the user's question better when
            using brand or product-specific terminology or translations.
            Words are case-insensitive and only the full word is matched.
            <Link
              href="https://docsbot.ai/documentation/doc/glossary-improve-search-relevance-with-smart-term-replacement"
              target="_blank"
              className="ml-1 text-cyan-600 hover:text-cyan-500"
            >
              Learn more &rarr;
            </Link>
          </p>
        )}
        {glossary !== undefined &&
          glossary.map((_, index) => (
            <GlossaryEntry index={index} key={index} />
          ))}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="flex items-center justify-center rounded-md px-2 py-1 text-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
            onClick={() => addGlossary()}
            disabled={disabled}
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </fieldset>
  )
}
