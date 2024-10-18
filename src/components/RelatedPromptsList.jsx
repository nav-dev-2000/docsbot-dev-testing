import Link from 'next/link'
import PromptIcon from '@/components/PromptIcon'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'

const RelatedPromptsList = ({ prompts, category }) => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-center">
        More {PROMPT_CATEGORIES[category]} Prompts
      </h2>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {prompts.map((prompt) => (
          <li
            key={prompt.id}
            className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow"
          >
            <Link
              href={`/prompts/${category}/${prompt.id}`}
              className="flex w-full items-center justify-between space-x-4 p-4 hover:bg-gray-50 h-full"
            >
              <div className="flex-shrink-0">
                <div className="rounded-lg bg-cyan-600 p-3">
                  <PromptIcon icon={prompt.icon} className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-md truncate font-medium text-gray-900">
                    {prompt.name}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {prompt.short_description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="my-8 flex justify-center gap-12 text-xl font-semibold">
        <Link
          href={`/prompts/${category}`}
          className="text-cyan-600 hover:text-cyan-500 hover:underline"
        >
          View all {PROMPT_CATEGORIES[category]} prompts
        </Link>
        <Link
          href="/prompts"
          className="text-cyan-600 hover:text-cyan-500 hover:underline"
        >
          Browse all categories
        </Link>
      </div>
    </div>
  )
}

export default RelatedPromptsList
