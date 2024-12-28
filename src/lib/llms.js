import {
  AnthropicLogo,
  GoogleLogo,
  MetaLogo,
  MistralLogo,
  XAILogo,
  NvidiaLogo,
  CohereLogo,
  AmazonLogo,
  DeepSeekLogo,
} from '@/components/ModelLogos'
import OpenAIIcon from '@/components/OpenAIIcon'

const PROVIDER_INFO = {
  anthropic: {
    displayName: 'Anthropic',
    url: 'https://www.anthropic.com',
    icon: AnthropicLogo,
  },
  google: {
    displayName: 'Google',
    url: 'https://ai.google/gemini-ecosystem',
    icon: GoogleLogo,
  },
  openai: {
    displayName: 'OpenAI',
    url: 'https://openai.com',
    icon: OpenAIIcon,
  },
  meta: {
    displayName: 'Meta',
    url: 'https://ai.meta.com/',
    icon: MetaLogo,
  },
  amazon: {
    displayName: 'Amazon',
    url: 'https://aws.amazon.com/ai/generative-ai/nova/',
    icon: AmazonLogo,
  },
  cohere: {
    displayName: 'Cohere',
    url: 'https://cohere.com',
    icon: CohereLogo,
  },
  mistral: {
    displayName: 'Mistral AI',
    url: 'https://mistral.ai',
    icon: MistralLogo,
  },
  xai: {
    displayName: 'xAI',
    url: 'https://x.ai',
    icon: XAILogo,
  },
  nvidia: {
    displayName: 'NVIDIA',
    url: 'https://nvidia.com',
    icon: NvidiaLogo,
  },
  deepseek: {
    displayName: 'DeepSeek',
    url: 'https://www.deepseek.com/',
    icon: DeepSeekLogo,
  },
}

export const getProviderInfo = (providerName) => {
  return PROVIDER_INFO[providerName]
}

export const getBenchmarkDescription = (key) => {
  const descriptions = {
    MMLU: 'Massive Multitask Language Understanding - Tests knowledge across 57 subjects including mathematics, history, law, and more',
    'MMLU-Pro':
      'A more robust MMLU benchmark with harder, reasoning-focused questions, a larger choice set, and reduced prompt sensitivity',
    MMMU: 'Massive Multitask Multimodal Understanding - Tests understanding across text, images, audio, and video',
    HellaSwag: 'A challenging sentence completion benchmark',
    HumanEval: 'Evaluates code generation and problem-solving capabilities',
    MATH: 'Tests mathematical problem-solving abilities across various difficulty levels',
    GPQA: 'Tests PhD-level knowledge in chemistry, biology, and physics through multiple choice questions that require deep domain expertise',
    IFEval: 'Tests model\'s ability to accurately follow explicit formatting instructions, generate appropriate outputs, and maintain consistent instruction adherence across different tasks',
  }
  return descriptions[key] || 'Description not available'
}
