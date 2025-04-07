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
    DocVQA: 'Document Visual Question Answering - Evaluates the ability of AI models to comprehend and answer questions based on document images',
    ChartQA: 'Chart Visual Question Answering - Evaluates the ability of AI models to comprehend and answer questions based on chart images',
    MathVista: 'Evaluates the mathematical reasoning abilities of AI models within visual contexts',
    IFEval: 'Tests model\'s ability to accurately follow explicit formatting instructions, generate appropriate outputs, and maintain consistent instruction adherence across different tasks',
    'Humanity\'s Last Exam': 'A challenging benchmark that tests models on complex reasoning tasks without tool use',
    LiveCodeBench: 'A benchmark that continuously collects new coding problems from platforms like LeetCode, AtCoder, and CodeForces to evaluate LLMs on unseen problems, ensuring contamination-free assessment of their coding capabilities',
    'SWE-Bench': 'Evaluates software engineering capabilities through verified code modifications and custom agent setups',
    'GPQA': 'Graduate-level Physics Questions Assessment - Tests advanced physics knowledge with Diamond Science level questions',
    'AIME2024': 'American Invitational Mathematics Examination 2024 - Evaluates advanced mathematical problem-solving abilities',
    'AIME2025': 'American Invitational Mathematics Examination 2025 - Tests cutting-edge mathematical reasoning capabilities',
    'Global MMLU': 'A global version of the MMLU benchmark that tests knowledge across multiple languages and cultures',
    'SimpleQA': 'A benchmark that evaluates basic question-answering capabilities across common knowledge domains',
    'MTOB': 'Machine Translation from One Book - Evaluates LLMs\' ability to translate between English and low-resource languages (like Kalamang) using only half of a grammar book as reference',
    'MTOB-full': 'Machine Translation from One Book (Full) - Evaluates LLMs\' ability to translate between English and low-resource languages using a complete grammar book as the only reference material',
    'LMArena': 'A benchmark that evaluates chat model performance through ELO ratings, where models compete against each other in head-to-head comparisons judged by users',
  }
  return descriptions[key] || 'Description not available'
}
