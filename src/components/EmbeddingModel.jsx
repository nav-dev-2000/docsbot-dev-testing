import OpenAIIcon from '@/components/OpenAIIcon'
import CohereIcon from '@/components/CohereIcon'

export default function EmbeddingModel({ bot }) {
  let label
  let Icon = OpenAIIcon
  let title = 'OpenAI'
  if (bot.embeddingModel === 'embed-multilingual-v3.0') {
    label = 'v3'
    Icon = CohereIcon
    title = 'Cohere Embeddings v3'
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
    <p className="flex items-center text-sm text-gray-500" title={title}>
      <Icon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
      {label}
    </p>
  )
}
