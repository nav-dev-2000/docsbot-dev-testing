import OpenAIIcon from '@/components/OpenAIIcon'
import CohereIcon from '@/components/CohereIcon'
import Link from 'next/link'
import Tooltip from '@/components/Tooltip'
export default function EmbeddingModel({ bot }) {
  let label
  let Icon = OpenAIIcon
  let title = 'OpenAI'
  if (bot.embeddingModel === 'embed-multilingual-v3.0') {
    label = 'v3'
    Icon = CohereIcon
    title = 'Cohere Embeddings v3'
  } else if (bot.embeddingModel === 'embed-v4.0') {
    label = 'v4'
    Icon = CohereIcon
    title = 'Cohere Embeddings v4'
  } else if (bot.embeddingModel === 'text-embedding-3-large') {
    label = 'v3 Large'
    title = 'OpenAI Embeddings Large v3'
  } else if (bot.embeddingModel === 'text-embedding-3-small') {
    label = 'v3 Small'
    title = 'OpenAI Embeddings Small v3'
  } else {
    label = 'v2'
    title = 'OpenAI Embeddings Ada v2'
  }
  return (
    <Tooltip content={title}>
      <Link href="/documentation/doc/understanding-embedding-models-in-docsbot" target="_blank" className="flex items-center text-sm text-gray-500">
        <Icon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
        {label}
      </Link>
    </Tooltip>
  )
}
