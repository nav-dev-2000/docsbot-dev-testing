import { CubeIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'
export default function GPTModel({ bot, isPlain = false }) {
  let label
  if (bot.model === 'gpt-5.2') {
    label = 'GPT-5.2'
  } else if (bot.model === 'gpt-5.1') {
    label = 'GPT-5.1'
  } else if (bot.model === 'gpt-5') {
    label = 'GPT-5'
  } else if (bot.model === 'gpt-5-mini') {
    label = 'GPT-5 mini'
  } else if (bot.model === 'gpt-5-nano') {
    label = 'GPT-5 nano'
  } else if (bot.model === 'gpt-4') {
    label = 'GPT-4'
  } else if (bot.model === 'gpt-4o') {
    label = 'GPT-4o'
  } else if (bot.model === 'gpt-4.5-preview') {
    label = 'GPT-4.5'
  } else if (bot.model === 'gpt-4o-mini') {
    label = 'GPT-4o mini'
  } else if (bot.model === 'gpt-4.1') {
    label = 'GPT-4.1'
  } else if (bot.model === 'gpt-4.1-mini') {
    label = 'GPT-4.1 mini'
  } else if (bot.model === 'gpt-4.1-nano') {
    label = 'GPT-4.1 nano'
  } else if (bot.model === 'o4-mini') {
    label = 'o4-mini'
  } else if (bot.model === 'o3') {
    label = 'o3'
  } else if (bot.model.includes('gpt-4')) {
    label = 'GPT-4 Turbo'
  } else {
    label = 'GPT-3.5'
  }
  
  if (isPlain) {
    return label
  }

  return (
    <Tooltip content="AI LLM model used for generating responses">
      <p className="flex items-center text-sm capitalize text-gray-500">
        <CubeIcon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
        {label}
      </p>
    </Tooltip>
  )
}
