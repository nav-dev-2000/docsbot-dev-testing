import { CubeIcon } from '@heroicons/react/24/outline'

export default function GPTModel({ bot }) {
  const label = bot.model === 'gpt-4' ? 'GPT-4' : 'GPT-3.5'
  return (
    <p className="flex items-center text-sm capitalize text-gray-500">
      <CubeIcon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
      {label}
    </p>
  )
}
