const LLMS = [
  {
    model_name: 'Claude Instant 1.2',
    slug: 'claude-instant-1-2',
    provider: 'anthropic',
    description:
      'Claude Instant 1.2, created by Anthropic, features a context window of 100,000 tokens. The model is priced at 0.8 cents per thousand tokens for input and 2.4 cents per thousand tokens for output. It was launched on August 9, 2023, and has shown strong performance in the MMLU benchmark with a score of 73.4 in a 5-shot scenario.',
    input_context_window: '100K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2023-08-09',
    knowledge_cut_off_date: 'January 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.8,
    output_cost_per_million_tokens: 2.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 73.4,
        notes: '5-shot',
        source:
          'https://www-cdn.anthropic.com/5c49cc247484cecf107c699baf29250302e5da70/claude-2-model-card.pdf',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Claude 3.7 Sonnet - Extended Thinking',
    slug: 'claude-3-7-sonnet-extended-thinking',
    provider: 'anthropic',
    description:
      "Claude 3.7 Sonnet is Anthropic's most intelligent model to date and the first hybrid reasoning model on the market. It features both standard and extended thinking modes, with the latter enabling visible step-by-step reasoning. The model shows particularly strong improvements in coding and front-end web development, achieving state-of-the-art performance on SWE-Bench Verified and TAU-bench. Available through Claude.ai, Anthropic API, Amazon Bedrock, and Google Cloud's Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-02-24',
    knowledge_cut_off_date: 'April 2024',
    api_providers:
      'Claude.ai, Anthropic API, Amazon Bedrock, Google Cloud Vertex AI',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      GPQA: {
        score: 84.8,
        notes: 'Diamond',
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MMMU: {
        score: 75,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      IFEval: {
        score: 93.2,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MATH: {
        score: 96.2,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MMMLU: {
        score: 86.8,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
    },
  },
  {
    model_name: 'Claude 3.7 Sonnet',
    slug: 'claude-3-7-sonnet',
    provider: 'anthropic',
    description:
      "Claude 3.7 Sonnet is Anthropic's most intelligent model to date and the first hybrid reasoning model on the market. It features both standard and extended thinking modes, with the latter enabling visible step-by-step reasoning. The model shows particularly strong improvements in coding and front-end web development, achieving state-of-the-art performance on SWE-Bench Verified and TAU-bench. Available through Claude.ai, Anthropic API, Amazon Bedrock, and Google Cloud's Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-02-24',
    knowledge_cut_off_date: 'April 2024',
    api_providers:
      'Claude.ai, Anthropic API, Amazon Bedrock, Google Cloud Vertex AI',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      GPQA: {
        score: 68,
        notes: 'Diamond',
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MMMU: {
        score: 71.8,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      IFEval: {
        score: 90.8,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MATH: {
        score: 82.2,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
      MMMLU: {
        score: 83.2,
        source: 'https://www.anthropic.com/news/claude-3-7-sonnet',
      },
    },
  },
  {
    model_name: 'Claude 3.5 Sonnet (new)',
    slug: 'claude-3-5-sonnet',
    provider: 'anthropic',
    description:
      "The upgraded Claude 3.5 Sonnet delivers across-the-board improvements over its predecessor, with particularly significant gains in coding—an area where it already led the field. The model is the first frontier AI to offer computer use in public beta. It has demonstrated wide-ranging improvements on industry benchmarks, especially in coding and tool use tasks. Available through various APIs like Anthropic API, Amazon Bedrock, and Google Cloud's Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-10-22',
    knowledge_cut_off_date: 'April 2024',
    api_providers: "Anthropic API, Amazon Bedrock, Google Cloud's Vertex AI",
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 89.3,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      'MMLU-Pro': {
        score: 78,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      MMMU: {
        score: 71.4,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      HellaSwag: null,
      HumanEval: {
        score: 93.7,
        notes: '0-shot',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      MATH: {
        score: 78.3,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
    },
  },
  {
    model_name: 'Claude 3.5 Sonnet (Oct 2024)',
    slug: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    description:
      "The upgraded Claude 3.5 Sonnet delivers across-the-board improvements over its predecessor, with particularly significant gains in coding—an area where it already led the field. The model is the first frontier AI to offer computer use in public beta. It has demonstrated wide-ranging improvements on industry benchmarks, especially in coding and tool use tasks. Available through various APIs like Anthropic API, Amazon Bedrock, and Google Cloud's Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-10-22',
    knowledge_cut_off_date: 'April 2024',
    api_providers: "Anthropic API, Amazon Bedrock, Google Cloud's Vertex AI",
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 89.3,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      'MMLU-Pro': {
        score: 78,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      MMMU: {
        score: 71.4,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      HellaSwag: null,
      HumanEval: {
        score: 93.7,
        notes: '0-shot',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      MATH: {
        score: 78.3,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
    },
  },
  {
    model_name: 'Claude 3.5 Sonnet (Jun 2024)',
    slug: 'claude-3-5-sonnet-20240620',
    provider: 'anthropic',
    description:
      'The original Claude 3.5 Sonnet model, developed by Anthropic, supports an input context window of 200K tokens and can generate up to 8,192 tokens per request. It is not open source and was released on June 20, 2024, with its last knowledge cut-off in April 2024. The model is available through API from Anthropic, AWS Bedrock, and Google AI Studio, Vertex AI. It performs well across several benchmarks and costs $3.00 per million tokens for input and $15.00 for output.',
    input_context_window: '200K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-06-20',
    knowledge_cut_off_date: 'April 2024',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 88.3,
        notes: '0-shot CoT',
        source:
          'https://cdn.sanity.io/files/4zrzovbb/website/fed9cc193a14b84131812372d8d5857f8f304c52.pdf',
      },
      'MMLU-Pro': {
        score: 75.1,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/news/3-5-models-and-computer-use',
      },
      MMMU: {
        score: 68.3,
        notes: '0-shot CoT',
        source:
          'https://cdn.sanity.io/files/4zrzovbb/website/fed9cc193a14b84131812372d8d5857f8f304c52.pdf',
      },
      HellaSwag: null,
      HumanEval: {
        score: 92,
        notes: '0-shot CoT',
        source:
          'https://cdn.sanity.io/files/4zrzovbb/website/fed9cc193a14b84131812372d8d5857f8f304c52.pdf',
      },
      MATH: {
        score: 71.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Claude 3 Sonnet',
    slug: 'claude-3-sonnet',
    provider: 'anthropic',
    description:
      'Claude 3 Sonnet, developed by Anthropic, features a context window of 200,000 tokens. The model costs 0.3 cents per thousand tokens for input and 1.5 cents per thousand tokens for output. It was released on March 4, 2024, and has achieved benchmark scores of 53.1 in MMMU, 89.0 in HellaSwag (10-shot), and 81.5 in MMLU (5-shot CoT).',
    input_context_window: '200K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-03-04',
    knowledge_cut_off_date: 'August 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 77.1,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      'MMLU-Pro': {
        score: 54.9,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      MMMU: {
        score: 53.1,
        notes: null,
        source: 'https://mmmu-benchmark.github.io/#leaderboard',
      },
      HellaSwag: {
        score: 89,
        notes: '10-shot',
        source: 'https://www.anthropic.com/news/claude-3-family',
      },
      HumanEval: {
        score: 73,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      MATH: {
        score: 43.1,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
    },
  },
  {
    model_name: 'Claude 3 Opus',
    slug: 'claude-3-opus',
    provider: 'anthropic',
    description:
      'Claude 3 Opus, developed by Anthropic, features a context window of 200,000 tokens. The model costs 1.5 cents per thousand tokens for input and 7.5 cents per thousand tokens for output. It was released on March 4, 2024, and has achieved impressive scores in benchmarks like HellaSwag with a score of 95.4 in a 10-shot scenario, MMLU with a score of 88.2 in a 5-shot CoT scenario, and MMMU with a score of 59.4.',
    input_context_window: '200K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-03-04',
    knowledge_cut_off_date: 'August 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 15,
    output_cost_per_million_tokens: 75,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.7,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      'MMLU-Pro': {
        score: 67.9,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      MMMU: {
        score: 59.4,
        notes: null,
        source: 'https://mmmu-benchmark.github.io/#leaderboard',
      },
      HellaSwag: {
        score: 95.4,
        notes: '10-shot',
        source: 'https://www.anthropic.com/news/claude-3-family',
      },
      HumanEval: {
        score: 84.9,
        notes: '0-shot',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
      MATH: {
        score: 60.1,
        notes: '0-shot CoT',
        source:
          'https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf',
      },
    },
  },
  {
    model_name: 'Claude 3.5 Haiku',
    slug: 'claude-3-5-haiku',
    provider: 'anthropic',
    description:
      'Claude 3.5 Haiku, developed by Anthropic, features a context window of 200,000 tokens. The model costs $1 per million input tokens and $5 per million output tokens, with up to 90% cost savings with prompt caching and 50% cost savings with Message Batches API. It was released on November 4, 2024. Ideal for code completions, interactive chatbots, data extraction/labeling, and real-time content moderation.',
    input_context_window: '200K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-11-04',
    knowledge_cut_off_date: 'July 2024',
    api_providers: 'Anthropic, AWS Bedrock, Vertex AI',
    input_cost_per_million_tokens: 0.8,
    output_cost_per_million_tokens: 4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: null,
      'MMLU-Pro': {
        score: 65.0,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/claude/haiku',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 88.1,
        notes: '0-shot',
        source: 'https://www.anthropic.com/claude/haiku',
      },
      MATH: {
        score: 69.4,
        notes: '0-shot CoT',
        source: 'https://www.anthropic.com/claude/haiku',
      },
    },
  },
  {
    model_name: 'Claude 3 Haiku',
    slug: 'claude-3-haiku',
    provider: 'anthropic',
    description:
      'Claude 3 Haiku, developed by Anthropic, features a context window of 200,000 tokens. The model costs 0.025 cents per thousand tokens for input and 0.125 cents per thousand tokens for output. It was released on March 13, 2024. In benchmarks, it achieved a score of 50.2 in MMMU, 85.9 in HellaSwag in a 10-shot scenario, and 76.7 in MMLU in a 5-shot CoT scenario.',
    input_context_window: '200K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-03-13',
    knowledge_cut_off_date: 'August 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.25,
    output_cost_per_million_tokens: 1.25,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 76.7,
        notes: '5-shot CoT',
        source: 'https://www.anthropic.com/claude-3-model-card',
      },
      MMMU: {
        score: 50.2,
        notes: null,
        source: 'https://mmmu-benchmark.github.io/#leaderboard',
      },
      HellaSwag: {
        score: 85.9,
        notes: '10-shot',
        source: 'https://www.anthropic.com/news/claude-3-family',
      },
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Claude 2.1',
    slug: 'claude-2-1',
    provider: 'anthropic',
    description:
      'Claude 2.1, developed by Anthropic, features a large context window of 200,000 tokens. The model costs 0.08 cents per thousand tokens for input and 0.24 cents per thousand tokens for output. It was released on November 23, 2023.',
    input_context_window: '200K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2023-11-23',
    knowledge_cut_off_date: 'January 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 8,
    output_cost_per_million_tokens: 24,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: null,
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Claude 2',
    slug: 'claude-2',
    provider: 'anthropic',
    description:
      'Claude 2, developed by Anthropic, features a large context window of 100,000 tokens. The model costs 0.8 cents per thousand tokens for input and 2.4 cents per thousand tokens for output. It was released on July 11, 2023, and has shown strong performance in the MMLU benchmark with a score of 78.5 in a 5-shot scenario.',
    input_context_window: '100K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2023-07-11',
    knowledge_cut_off_date: 'Early 2023',
    api_providers: 'Anthropic, AWS Bedrock, Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 8,
    output_cost_per_million_tokens: 24,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 78.5,
        notes: '5-shot',
        source:
          'https://www-cdn.anthropic.com/5c49cc247484cecf107c699baf29250302e5da70/claude-2-model-card.pdf',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Amazon Nova Micro',
    slug: 'amazon-nova-micro',
    provider: 'amazon',
    description:
      'Amazon Nova Micro is a text-only model optimized for cost and speed. With a context window of 128K tokens, it excels at tasks like text summarization, translation, interactive chat, and basic coding. Released as part of the Amazon Nova foundation models, it supports fine-tuning and distillation for customization on proprietary data.',
    input_context_window: '128K',
    maximum_output_tokens: '5K',
    open_source: false,
    release_date: '2024-12-02',
    knowledge_cut_off_date: 'Purposefully not disclosed',
    api_providers: 'Amazon Bedrock',
    input_cost_per_million_tokens: 0.035,
    output_cost_per_million_tokens: 0.14,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 77.6,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      DROP: {
        score: 79.3,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      ARC: {
        score: 90.2,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      GPQA: {
        score: 40.0,
        notes: 'Main',
        source: 'https://aws.amazon.com/nova',
      },
      GSM8K: {
        score: 92.3,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      MATH: {
        score: 69.3,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      HumanEval: {
        score: 81.1,
        notes: 'pass@1',
        source: 'https://aws.amazon.com/nova',
      },
      IFEval: {
        score: 87.2,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      Translation_EN_to_14: {
        score: 40.2,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
      Translation_14_to_EN: {
        score: 42.6,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
    },
  },
  {
    model_name: 'Amazon Nova Lite',
    slug: 'amazon-nova-lite',
    provider: 'amazon',
    description:
      'Amazon Nova Lite is a multimodal model capable of processing text, image, and video inputs to generate text outputs. With a context window of 300K tokens, it excels at real-time interactions, document analysis, and visual question answering. Released as part of the Amazon Nova foundation models, it supports fine-tuning and distillation for customization.',
    input_context_window: '300K',
    maximum_output_tokens: '5K',
    open_source: false,
    release_date: '2024-12-02',
    knowledge_cut_off_date: 'Purposefully not disclosed',
    api_providers: 'Amazon Bedrock',
    input_cost_per_million_tokens: 0.06,
    output_cost_per_million_tokens: 0.24,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 80.5,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      DROP: {
        score: 80.2,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      ARC: {
        score: 92.4,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      GPQA: {
        score: 42.0,
        notes: 'Main',
        source: 'https://aws.amazon.com/nova',
      },
      GSM8K: {
        score: 94.5,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      MATH: {
        score: 73.3,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      HumanEval: {
        score: 85.4,
        notes: 'pass@1',
        source: 'https://aws.amazon.com/nova',
      },
      IFEval: {
        score: 89.7,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      Translation_EN_to_14: {
        score: 41.5,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
      Translation_14_to_EN: {
        score: 43.1,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
    },
  },
  {
    model_name: 'Amazon Nova Pro',
    slug: 'amazon-nova-pro',
    provider: 'amazon',
    description:
      'Amazon Nova Pro is a state-of-the-art multimodal model with advanced capabilities in processing text, image, and video inputs. With a context window of 300K tokens, it excels at tasks like document analysis, visual question answering, and complex agentic workflows. Released as part of the Amazon Nova foundation models, it supports fine-tuning and distillation for customization.',
    input_context_window: '300K',
    maximum_output_tokens: '5K',
    open_source: false,
    release_date: '2024-12-02',
    knowledge_cut_off_date: 'Purposefully not disclosed',
    api_providers: 'Amazon Bedrock',
    input_cost_per_million_tokens: 0.8,
    output_cost_per_million_tokens: 3.2,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 85.9,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      DROP: {
        score: 85.4,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      ARC: {
        score: 94.8,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      GPQA: {
        score: 46.9,
        notes: 'Main',
        source: 'https://aws.amazon.com/nova',
      },
      GSM8K: {
        score: 94.8,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      MATH: {
        score: 76.6,
        notes: 'CoT',
        source: 'https://aws.amazon.com/nova',
      },
      HumanEval: {
        score: 89.0,
        notes: 'pass@1',
        source: 'https://aws.amazon.com/nova',
      },
      IFEval: {
        score: 92.1,
        notes: null,
        source: 'https://aws.amazon.com/nova',
      },
      Translation_EN_to_14: {
        score: 43.4,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
      Translation_14_to_EN: {
        score: 44.4,
        notes: 'Flores200',
        source: 'https://aws.amazon.com/nova',
      },
    },
  },
  {
    model_name: 'Command A',
    slug: 'command-a',
    provider: 'cohere',
    description:
      'Command A is Cohere\'s state-of-the-art generative model optimized for demanding enterprises requiring fast, secure, and high-quality AI. It delivers maximum performance with minimal hardware costs compared to leading models like GPT-4o and DeepSeek-V3. With a 256K context window (2x most leading models), it excels at business-critical agentic and multilingual tasks while being deployable on just two GPUs. It offers superior throughput (up to 156 tokens/sec, 1.75x higher than GPT-4o) and increased efficiency.',
    input_context_window: '256K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2025-03-13',
    knowledge_cut_off_date: 'Early 2025',
    api_providers: 'Cohere, Hugging Face, Major cloud providers',
    input_cost_per_million_tokens: 2.5,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.5,
        notes: null,
        source: 'https://cohere.com/blog/command-a',
      },
      MATH: {
        score: 80.0,
        notes: null,
        source: 'https://cohere.com/blog/command-a',
      },
      IFEval: {
        score: 90.9,
        notes: null,
        source: 'https://cohere.com/blog/command-a',
      },
      GPQA: {
        score: 50.8,
        notes: null,
        source: 'https://cohere.com/blog/command-a',
      },
      Taubench: {
        score: 51.7,
        notes: 'Agents benchmark',
        source: 'https://cohere.com/blog/command-a',
      },
      BFCL: {
        score: 63.8,
        notes: 'Tool-use in diverse environments',
        source: 'https://cohere.com/blog/command-a',
      },
      'MBPP+': {
        score: 86.2,
        notes: 'Python programming',
        source: 'https://cohere.com/blog/command-a',
      },
      'Bird-SQL': {
        score: 59.5,
        notes: null,
        source: 'https://cohere.com/blog/command-a',
      },
      RepoQA: {
        score: 92.6,
        notes: 'Repository-level QA in longer contexts',
        source: 'https://cohere.com/blog/command-a',
      },
      NTREX: {
        score: 68.8,
        notes: 'Multilingual',
        source: 'https://cohere.com/blog/command-a',
      },
    },
  },
  {
    model_name: 'Command R+ (Aug 2024)',
    slug: 'command-r-plus-08-2024',
    provider: 'cohere',
    description:
      'Command R+ (08-2024), developed by Cohere, features a context window of 128,000 tokens. It is updated to have roughly 50% higher throughput and 25% lower latencies compared to the previous version while maintaining the same hardware footprint. The model costs $2.375 per million input tokens and $9.5 per million output tokens. It was released in August 2024.',
    input_context_window: '128K',
    maximum_output_tokens: '',
    open_source: false,
    release_date: '2024-08-30',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'Cohere, AWS',
    input_cost_per_million_tokens: 2.5,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 75,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 71,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
      MATH: {
        score: 44,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
    },
  },
  {
    model_name: 'Command R (Aug 2024)',
    slug: 'command-r-08-2024',
    provider: 'cohere',
    description:
      'Command R (08-2024), updated by Cohere, offers enhanced multilingual retrieval-augmented generation (RAG) and tool use capabilities. This version excels in performance for math, code, and reasoning, providing competitive results comparable to the previous Command R+ model.',
    input_context_window: '128K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2024-08-30',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'Cohere, AWS',
    input_cost_per_million_tokens: 0.15,
    output_cost_per_million_tokens: 0.6,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 67,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 70,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
      MATH: {
        score: 40,
        notes: null,
        source: 'https://artificialanalysis.ai/models/command-r-plus',
      },
    },
  },
  {
    model_name: 'Gemma 2 27B',
    slug: 'gemma-2-27b',
    provider: 'google',
    description:
      'Gemma 2 27B by Google is an open model built from the same research and technology used to create the Gemini models. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    input_context_window: '8,192',
    maximum_output_tokens: 'Unknown',
    open_source: true,
    release_date: '2024-06-27',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'OpenRouter',
    input_cost_per_million_tokens: 0.27,
    output_cost_per_million_tokens: 0.27,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 75.2,
        notes: '5-shot',
        source: 'https://huggingface.co/google/gemma-2-27b-it',
      },
      'MMMU-Pro': null,
      HellaSwag: {
        score: 86.4,
        notes: '10-shot',
        source: 'https://huggingface.co/google/gemma-2-27b-it',
      },
      HumanEval: {
        score: 51.8,
        notes: 'pass@1',
        source: 'https://huggingface.co/google/gemma-2-27b-it',
      },
      MATH: {
        score: 42.3,
        notes: '4-shot',
        source: 'https://huggingface.co/google/gemma-2-27b-it',
      },
    },
  },
  {
    model_name: 'Gemma 2 9B',
    slug: 'gemma-2-9b',
    provider: 'google',
    description:
      'Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class. Designed for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.',
    input_context_window: '8,192',
    maximum_output_tokens: 'Unknown',
    open_source: true,
    release_date: '2024-06-27',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'OpenRouter',
    input_cost_per_million_tokens: 0.06,
    output_cost_per_million_tokens: 0.06,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 71.3,
        notes: '5-shot',
        source: 'https://huggingface.co/google/gemma-2-9b-it',
      },
      'MMLU-Pro': {
        score: 52.08,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      HellaSwag: {
        score: 81.9,
        notes: '10-shot',
        source: 'https://huggingface.co/google/gemma-2-9b-it',
      },
      HumanEval: {
        score: 40.2,
        notes: 'pass@1',
        source: 'https://huggingface.co/google/gemma-2-9b-it',
      },
      MATH: {
        score: 36.6,
        notes: '4-shot',
        source: 'https://huggingface.co/google/gemma-2-9b-it',
      },
    },
  },

  {
    model_name: 'Gemini 1.0 Ultra',
    slug: 'gemini-1-0-ultra',
    provider: 'google',
    description:
      'Gemini Ultra, developed by Google, features a large context window of 32768 tokens. The model has excelled in benchmarks like MMMU with a score of 59.4 in a 0-shot pass@1 scenario and MMLU with a score of 83.7 in a 5-shot scenario.',
    input_context_window: '32.8K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-02-08',
    knowledge_cut_off_date: 'November 2023',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0,
    output_cost_per_million_tokens: 0,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 83.7,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2312.11805.pdf',
      },
      MMMU: {
        score: 59.4,
        notes: '0-shot pass@1',
        source: 'https://deepmind.google/technologies/gemini/#gemini-1.0',
      },
      HellaSwag: null,
      HumanEval: {
        score: 74.4,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MATH: {
        score: 53.2,
        notes: '4-shot Minerva Prompt',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
    },
  },
  {
    model_name: 'Gemini 1.0 Pro',
    slug: 'gemini-1-0-pro',
    provider: 'google',
    description:
      'Gemini Pro, developed by Google, features a context window of 32768 tokens. The model costs 0.0125 cents per thousand tokens for input and 0.0375 cents per thousand tokens for output. It was released on December 13, 2023, and has achieved a score of 47.9 in the MMMU benchmark with a "pass@1" caveat and a score of 71.8 in the MMLU benchmark in a 5-shot scenario.',
    input_context_window: '32.8K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2023-12-13',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 12.5,
    output_cost_per_million_tokens: 37.5,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 71.8,
        notes: '5-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_1_report.pdf',
      },
      MMMU: {
        score: 47.9,
        notes: 'pass@1',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_1_report.pdf',
      },
      HellaSwag: {
        score: 84.7,
        notes: '10-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_1_report.pdf',
      },
      HumanEval: {
        score: 67.7,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MATH: {
        score: 32.6,
        notes: '4-shot Minerva Prompt',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
    },
  },

  {
    model_name: 'Gemini 1.5 Pro (002)',
    slug: 'gemini-1-5-pro-002',
    provider: 'google',
    description:
      'Gemini 1.5 Pro, a model designed for general performance across a wide range of text, code, and multimodal tasks. It supports a long context window, multimodal capabilities, and offers improved performance on benchmarks such as MMLU and MATH. The model has reduced input and output costs by approximately 64% and 52%, respectively. It was released as part of updated Gemini models alongside Gemini 1.5 Flash. These models provide faster output, lower latency, and increased rate limits, making them more efficient for various use cases.',
    input_context_window: '2M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-09-24',
    knowledge_cut_off_date: 'August 2024',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 1.25,
    output_cost_per_million_tokens: 5,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: null,
      'MMLU-Pro': {
        score: 75.8,
        notes: '0-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      MMMU: {
        score: 65.9,
        notes: null,
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      HellaSwag: {
        score: 93.3,
        notes: '10-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      HumanEval: {
        score: 84.1,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      GPQA: {
        score: 59.1,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MATH: {
        score: 86.5,
        notes: '4-shot Minerva Prompt',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
    },
  },
  {
    model_name: 'Gemini 1.5 Pro (001)',
    slug: 'gemini-1-5-pro-001',
    provider: 'google',
    description:
      'Gemini 1.5 Pro by Google features a vast context window of 1,000,000 tokens. The model is priced at 0.7 cents per thousand tokens for input and 2.1 cents per thousand tokens for output. It was launched on February 15, 2024. In benchmark tests, it achieved a score of 58.5 in MMMU with a 0-shot scenario and 81.9 in MMLU with a 5-shot scenario.',
    input_context_window: '2M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-02-15',
    knowledge_cut_off_date: 'November 2023',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 3.5,
    output_cost_per_million_tokens: 10.5,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 81.9,
        notes: '5-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      'MMLU-Pro': {
        score: 69,
        notes: '0-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      MMMU: {
        score: 62.2,
        notes: '0-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      HellaSwag: {
        score: 93.3,
        notes: '10-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      HumanEval: {
        score: 84.1,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MATH: {
        score: 67.7,
        notes: '4-shot Minerva Prompt',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
    },
  },
  {
    model_name: 'Gemini 2.0 Flash Thinking (Experimental)',
    slug: 'gemini-2-0-flash-thinking',
    provider: 'google',
    description:
      'Gemini 2.0 Flash Thinking is an enhanced reasoning model, capable of showing its thoughts to improve performance and explainability. It excels at complex problem solving, coding challenges, and mathematical reasoning while showing its work. The model is optimized for tasks requiring detailed explanations and logical breakdowns, with native tool use capabilities including code execution and Google Search.',
    input_context_window: '1M',
    maximum_output_tokens: '64K',
    open_source: false,
    release_date: '2024-12-19',
    knowledge_cut_off_date: 'June 2024',
    api_providers: 'Google AI Studio, Vertex AI, Gemini API',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      GPQA: {
        score: 74.2,
        notes: 'Diamond Science',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      AIME2024: {
        score: 73.3,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/flash-thinking/',
      },
      MMMU: {
        score: 75.4,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
    },
  },
  {
    model_name: 'Gemini 2.5 Pro',
    slug: 'gemini-2-5-pro',
    provider: 'google',
    description:
      "Gemini 2.5 Pro is Google's most intelligent AI model, designed as a thinking model capable of reasoning through its thoughts before responding. It leads common benchmarks by meaningful margins and showcases strong reasoning and code capabilities. The model excels at creating visually compelling web apps, agentic code applications, and code transformation. With native multimodality and a long context window, it can comprehend vast datasets and handle complex problems from different information sources.",
    input_context_window: '1M (2M soon)',
    maximum_output_tokens: '64K',
    open_source: false,
    release_date: '2025-03-25',
    knowledge_cut_off_date: 'January 2025',
    api_providers: 'Google AI Studio, Vertex AI, Gemini app',
    input_cost_per_million_tokens: 1.25,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      "Humanity's Last Exam": {
        score: 18.8,
        notes: 'State-of-the-art across models without tool use',
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      'SWE-Bench': {
        score: 63.8,
        notes: 'Verified, With custom agent setup',
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      'GPQA': {
        score: 84,
        notes: 'Diamond Science',
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      'AIME2024': {
        score: 92,
        notes: null,
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      'AIME2025': {
        score: 86.7,
        notes: null,
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      'Global MMLU': {
        score: 89.8,
        notes: 'Lite',
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      MMMU: {
        score: 81.7,
        notes: null,
        source: 'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
    },
  },
  {
    model_name: 'Gemini 2.0 Pro',
    slug: 'gemini-2-0-pro',
    provider: 'google',
    description:
      "Gemini 2.0 Pro is Google's best model yet for coding performance and complex prompts. It features enhanced capabilities including native tool use, image generation, and speech generation. The model excels at complex reasoning tasks and supports multimodal inputs including text, images, video and audio. Available through Google AI Studio and Vertex AI, it offers significantly improved performance over previous versions while maintaining high efficiency.",
    input_context_window: '2M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-12-11',
    knowledge_cut_off_date: 'August 2024',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.1,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      'MMLU-Pro': {
        score: 79.1,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'LiveCodeBench': {
        score: 36.0,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Bird-SQL (Dev)': {
        score: 59.3,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GPQA: {
        score: 64.7,
        notes: 'Diamond',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      SimpleQA: {
        score: 44.3,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'FACTS Grounding': {
        score: 82.8,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Global MMLU': {
        score: 86.5,
        notes: 'lite',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MATH: {
        score: 91.8,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      HiddenMath: {
        score: 65.2,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'MRCR (1M)': {
        score: 74.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 72.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'CoVoST2 (21 lang)': {
        score: 40.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'EgoSchema (test)': {
        score: 71.9,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
    },
  },
  {
    model_name: 'Gemini 2.0 Flash',
    slug: 'gemini-2-0-flash',
    provider: 'google',
    description:
      "Gemini 2.0 Flash is Google's powerful workhorse model with low latency and enhanced performance, built to power agentic experiences. It features native tool use capabilities and supports multimodal inputs including text, images, video and audio. The model delivers significantly improved performance over previous versions while maintaining high efficiency and speed.",
    input_context_window: '1M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-12-11',
    knowledge_cut_off_date: 'August 2024',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.1,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      'MMLU-Pro': {
        score: 77.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'LiveCodeBench': {
        score: 34.5,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Bird-SQL (Dev)': {
        score: 58.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GPQA: {
        score: 60.1,
        notes: 'Diamond',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      SimpleQA: {
        score: 29.9,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'FACTS Grounding': {
        score: 84.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Global MMLU': {
        score: 83.4,
        notes: 'Lite',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MATH: {
        score: 90.9,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      HiddenMath: {
        score: 63.5,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'MRCR (1M)': {
        score: 70.5,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 71.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'CoVoST2 (21 lang)': {
        score: 39.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'EgoSchema (test)': {
        score: 71.1,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
    },
  },
  {
    model_name: 'Gemini 2.0 Flash-Lite',
    slug: 'gemini-2-0-flash-lite',
    provider: 'google',
    description:
      "Gemini 2.0 Flash-Lite is Google's most cost-efficient model yet, offering better quality than previous versions at the same speed and cost. It features a 1 million token context window and supports multimodal inputs including text, images, video and audio. The model is optimized for low-cost workflows while maintaining high performance.",
    input_context_window: '1M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-12-11',
    knowledge_cut_off_date: 'June 2024',
    api_providers: 'Google AI Studio, Vertex AI, Gemini API',
    input_cost_per_million_tokens: 0.075,
    output_cost_per_million_tokens: 0.3,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      'MMLU-Pro': {
        score: 71.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'LiveCodeBench': {
        score: 28.9,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Bird-SQL (Dev)': {
        score: 57.4,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GPQA: {
        score: 51.5,
        notes: 'Diamond',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      SimpleQA: {
        score: 21.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'FACTS Grounding': {
        score: 83.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'Global MMLU': {
        score: 78.2,
        notes: 'Lite',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MATH: {
        score: 86.8,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      HiddenMath: {
        score: 55.3,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'MRCR (1M)': {
        score: 58.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 68.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'CoVoST2 (21 lang)': {
        score: 38.4,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      'EgoSchema (test)': {
        score: 67.2,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
    },
  },
  {
    model_name: 'Gemini 1.5 Flash (002)',
    slug: 'gemini-1-5-flash-002',
    provider: 'google',
    description:
      'Gemini Flash, developed by Google, features a context window of 1M tokens and can generate up to 8,192 tokens in a single request. The model costs $0.13 per million tokens for input and $0.38 per million tokens for output. It was released on May 14th, 2024. Notable benchmarks include a 78.9 score on MMLU and a 56.1 score on MMMU. The model is available through Google AI Studio, Vertex AI.',
    input_context_window: '1M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-09-24',
    knowledge_cut_off_date: 'August 2024',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.13,
    output_cost_per_million_tokens: 0.38,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: null,
      'MMLU-Pro': {
        score: 67.3,
        notes: '0-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      MMMU: {
        score: 62.3,
        notes: '0-shot pass@1',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      HellaSwag: {
        score: 86.5,
        notes: '10-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      HumanEval: {
        score: 74.3,
        notes: '0-shot',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
      GPQA: {
        score: 51,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MATH: {
        score: 77.9,
        notes: '4-shot Minerva Prompt',
        source:
          'https://developers.googleblog.com/en/updated-gemini-models-reduced-15-pro-pricing-increased-rate-limits-and-more/',
      },
    },
  },
  {
    model_name: 'Gemini 1.5 Flash (001)',
    slug: 'gemini-1-5-flash-001',
    provider: 'google',
    description:
      'Gemini Flash, developed by Google, features a context window of 1M tokens and can generate up to 8,192 tokens in a single request. The model costs $0.13 per million tokens for input and $0.38 per million tokens for output. It was released on May 14th, 2024. Notable benchmarks include a 78.9 score on MMLU and a 56.1 score on MMMU. The model is available through Google AI Studio, Vertex AI.',
    input_context_window: '1M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-05-14',
    knowledge_cut_off_date: 'November 2023',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.13,
    output_cost_per_million_tokens: 0.38,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      MMLU: {
        score: 78.9,
        notes: '5-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      'MMLU-Pro': {
        score: 59.1,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MMMU: {
        score: 56.1,
        notes: '0-shot pass@1',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      HellaSwag: {
        score: 86.5,
        notes: '10-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      HumanEval: {
        score: 74.3,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MATH: {
        score: 54.9,
        notes: '4-shot Minerva Prompt',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
    },
  },
  {
    model_name: 'Gemini 1.5 Flash-8B',
    slug: 'gemini-1-5-flash-8b',
    provider: 'google',
    description:
      'Gemini 1.5 Flash-8B is optimized for speed and efficiency, offering enhanced performance in small prompt tasks like chat, transcription, and translation. With reduced latency, it is highly effective for real-time and large-scale operations. This model focuses on cost-effective solutions while maintaining high-quality results.',
    input_context_window: '1M',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2024-09-24',
    knowledge_cut_off_date: 'August 2024',
    api_providers: 'Google AI Studio, Vertex AI',
    input_cost_per_million_tokens: 0.0375,
    output_cost_per_million_tokens: 0.15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: null,
      'MMLU-Pro': {
        score: 58.7,
        notes: '0-shot',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      MMMU: {
        score: 53.7,
        notes: '0-shot pass@1',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 58.7,
        notes: '4-shot Minerva Prompt',
        source:
          'https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf',
      },
    },
  },
  {
    model_name: 'Llama 4 Scout',
    slug: 'llama-4-scout',
    provider: 'meta',
    description:
      'Llama 4 Scout is a 17 billion active parameter model with 16 experts, making it the best multimodal model in its class. It outperforms Gemma 3, Gemini 2.0 Flash-Lite, and Mistral 3.1 across a broad range of benchmarks while being efficient enough to fit on a single NVIDIA H100 GPU with Int4 quantization. It features an industry-leading context window of 10M tokens and is natively multimodal, supporting text, image, and video inputs.',
    input_context_window: '10M',
    maximum_output_tokens: '4,096',
    open_source: true,
    release_date: '2025-04-05',
    knowledge_cut_off_date: 'March 2025',
    api_providers: 'Meta AI, Hugging Face, Fireworks, Together, DeepInfra',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      'MMLU-Pro': {
        score: 74.3,
        notes: 'Reasoning & Knowledge',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MMMU: {
        score: 69.4,
        notes: 'Image Reasoning',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MathVista: {
        score: 70.7,
        notes: 'Image Reasoning',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      ChartQA: {
        score: 88.8,
        notes: 'Image Understanding',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      DocVQA: {
        score: 94.4,
        notes: 'test',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      LiveCodeBench: {
        score: 32.8,
        notes: '10/01/2024-02/01/2025',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      GPQA: {
        score: 57.2,
        notes: 'Diamond',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MTOB: {
        score: '42.2/36.6',
        notes: 'half book, eng→kpv/kgv→eng',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MTOB-full': {
        score: '39.7/36.3',
        notes: 'full book, eng→kpv/kgv→eng',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
    },
  },
  {
    model_name: 'Llama 4 Maverick',
    slug: 'llama-4-maverick',
    provider: 'meta',
    description:
      'Llama 4 Maverick is a 17 billion active parameter model with 128 experts (400B total parameters), making it the best multimodal model in its class. It outperforms GPT-4o and Gemini 2.0 Flash across many benchmarks while achieving comparable results to DeepSeek v3 on reasoning and coding with less than half the active parameters. It offers best-in-class performance-to-cost ratio with an experimental chat version scoring ELO of 1417 on LMArena. Maverick fits on a single H100 host for easy deployment.',
    input_context_window: '1M',
    maximum_output_tokens: '4,096',
    open_source: true,
    release_date: '2025-04-05',
    knowledge_cut_off_date: 'March 2025',
    api_providers: 'Meta AI, Hugging Face, Fireworks, Together, DeepInfra',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      MMMU: {
        score: 73.4,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MathVista: {
        score: 73.7,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      ChartQA: {
        score: 90.0,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      DocVQA: {
        score: 94.4,
        notes: 'text',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      LiveCodeBench: {
        score: 43.4,
        notes: '10/01/2024-02/01/2025',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MMLU-Pro': {
        score: 80.5,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'GPQA': {
        score: 69.8,
        notes: 'Diamond',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'Global MMLU': {
        score: 64.6,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MTOB: {
        score: '54/46.4',
        notes: 'half book, eng→kpv/kgv→eng',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MTOB-full': {
        score: '50.8/46.7',
        notes: 'full book, eng→kpv/kgv→eng',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      LMArena: {
        score: 1417,
        notes: 'ELO rating (experimental chat version)',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
    },
  },
  {
    model_name: 'Llama 4 Behemoth',
    slug: 'llama-4-behemoth',
    provider: 'meta',
    description:
      'Llama 4 Behemoth is a 288 billion active parameter model with 16 experts, making it Meta\'s most powerful model and among the world\'s smartest LLMs. It outperforms GPT-4.5, Claude Sonnet 3.7, and Gemini 2.0 Pro on several STEM benchmarks. Behemoth serves as a teacher model for distilling knowledge to the smaller Llama 4 models. As of April 2025, it is still training and not yet publicly available.',
    input_context_window: null,
    maximum_output_tokens: null,
    open_source: false,
    release_date: 'In training (as of April 2025)',
    knowledge_cut_off_date: null,
    api_providers: null,
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      LiveCodeBench: {
        score: 49.4,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MATH-500': {
        score: 95,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MMLU-Pro': {
        score: 82.2,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'GPQA Diamond': {
        score: 73.7,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'Global MMLU': {
        score: 85.8,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      'MMMU': {
        score: 76.1,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
    },
  },
  {
    model_name: 'Llama 3.3 70B Instruct',
    slug: 'llama-3-3-70b-instruct',
    provider: 'meta',
    description:
      'Llama 3.3 70B Instruct, developed by Meta, is a multilingual, instruction-tuned large language model optimized for dialogue use cases. It supports multilingual text inputs and outputs with a context window of 128K tokens. Released on December 6th, 2024, it outperforms many open-source and closed chat models across industry benchmarks. The model employs Grouped-Query Attention (GQA) for enhanced scalability and is trained on a mix of public data with over 15 trillion tokens. Its knowledge cut-off date is December 2023.',
    input_context_window: '128K',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-12-06',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'Fireworks, Together, DeepInfra, Hyperbolic',
    input_cost_per_million_tokens: 0.23,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.0,
        notes: '0-shot, CoT',
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
      'MMLU-Pro': {
        score: 68.9,
        notes: '5-shot, CoT',
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
      IFEval: {
        score: 92.1,
        notes: null,
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
      HumanEval: {
        score: 88.4,
        notes: 'pass@1',
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
      GPQA: {
        score: 50.5,
        notes: '0-shot, CoT',
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
      MATH: {
        score: 77.0,
        notes: '0-shot, CoT',
        source:
          'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct#benchmarks---english-text',
      },
    },
  },
  {
    model_name: 'Llama 3.2 90B Vision Instruct',
    slug: 'llama-3-2-90b-vision-instruct',
    provider: 'meta',
    description:
      'The Llama 90B Vision model is a top-tier, 90-billion-parameter multimodal model designed for challenging visual reasoning and language tasks. Built on Llama 3.1, it excels in image captioning, visual question answering, and advanced image-text comprehension. The model achieved impressive scores on benchmarks like VQAv2 (78.1%), MMMU (60.3%), and DocVQA (90.1%).',
    input_context_window: '128K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2024-09-25',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'Fireworks, Together, DeepInfra, Hyperbolic',
    input_cost_per_million_tokens: 0.35,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
      MMMU: {
        score: 60.3,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 68,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
    },
  },
  {
    model_name: 'Llama 3.2 11B Vision Instruct',
    slug: 'llama-3-2-11b-vision-instruct',
    provider: 'meta',
    description:
      'Llama 3.2 11B Vision is an 11-billion-parameter multimodal model built on Llama 3.1, designed for visual reasoning and language tasks. It excels in image captioning, visual question answering, and document understanding, achieving strong benchmark scores like VQAv2 (75.2%), MMMU (50.7%), and DocVQA (88.4%).',
    input_context_window: '128K',
    maximum_output_tokens: 'Unknown',
    open_source: false,
    release_date: '2024-09-25',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'Fireworks, Together, Hyperbolic, Deepinfra',
    input_cost_per_million_tokens: 0.055,
    output_cost_per_million_tokens: 0.055,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 73,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
      MMMU: {
        score: 50.7,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 51.9,
        notes: '0-shot CoT',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD_VISION.md',
      },
    },
  },
  {
    model_name: 'Llama 3.1 8B Instruct',
    slug: 'llama-3-1-8b-instruct',
    provider: 'meta',
    description:
      'Llama 3.1 8B Instruct, developed by Meta, features a context window of 128K tokens. The model was released on July 23rd, 2024, and achieved a score of 66.7 in the MMLU benchmark in a 5-shot scenario.',
    input_context_window: '128K',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-07-23',
    knowledge_cut_off_date: 'December 2023',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx',
    input_cost_per_million_tokens: 0.03,
    output_cost_per_million_tokens: 0.05,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 66.7,
        notes: '5-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 51.9,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Llama 3.1 70B Instruct',
    slug: 'llama3-1-70b-instruct',
    provider: 'meta',
    description:
      "Llama 3.1 70B Instruct, provided by Meta, features a context window of 128K tokens. It has a maximum output capability of 2,048 tokens per request. Open source availability allows public use of the model's code. Released on July 23rd, 2024, with a knowledge cut-off date in December 2023, the model is accessible on various platforms, including Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, and IBM watsonx. Pricing and empirical throughput data are not available currently. Notable benchmarks include an MMLU score of 83.6 5-shot and a MATH score of 68.0 0-shot.",
    input_context_window: '128K',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-07-23',
    knowledge_cut_off_date: 'December 2023',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx, Deepinfra',
    input_cost_per_million_tokens: 0.23,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 83.6,
        notes: '5-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
      'MMLU-Pro': {
        score: 62.84,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 68,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Llama 3.1 405B Instruct',
    slug: 'llama-3-1-405b-instruct',
    provider: 'meta',
    description:
      'Llama 3.1 405B Instruct is a model developed by Meta that supports an input context window of 128K tokens and can generate a maximum of 2,048 tokens per request. The model is open-source and was released on July 23, 2024, with a knowledge cut-off date of December 2023. It is available through various API providers including Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, and IBM watsonx.',
    input_context_window: '128K',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-07-23',
    knowledge_cut_off_date: 'December 2023',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx, Avian, Deepinfra',
    input_cost_per_million_tokens: 1.79,
    output_cost_per_million_tokens: 1.79,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.2,
        notes: '5-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 73.8,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Llama 3 8B Instruct',
    slug: 'llama-3-8b-instruct',
    provider: 'meta',
    description:
      'Llama 3 8B Instruct, developed by Meta, features a context window of 8000 tokens. The model was released on April 18, 2024, and achieved a score of 68.4 in the MMLU benchmark.',
    input_context_window: '8,000',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-04-18',
    knowledge_cut_off_date: 'March 2023',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx',
    input_cost_per_million_tokens: 0.055,
    output_cost_per_million_tokens: 0.055,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 68.4,
        notes: '5-shot',
        source: 'https://llama.meta.com/llama3/',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 29.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Llama 3 70B Instruct',
    slug: 'llama-3-70b-instruct',
    provider: 'meta',
    description:
      'Llama 3 70B Instruct, developed by Meta, features a context window of 8000 tokens. The model was released on April 18, 2024, and achieved a score of 82.0 in the MMLU benchmark under a 5-shot scenario.',
    input_context_window: '8,000',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2024-04-18',
    knowledge_cut_off_date: 'December 2023',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx, Deepinfra, Groq',
    input_cost_per_million_tokens: 0.35,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 82,
        notes: '5-shot',
        source: 'https://llama.meta.com/llama3/',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 51,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Llama 2 Chat 70B',
    slug: 'llama-2-chat-70b',
    provider: 'meta',
    description:
      'Llama 2 Chat 70B, developed by Meta, features a context window of 4096 tokens. The model was released on July 18, 2023, and has achieved a score of 30.1 in the MMMU benchmark and 68.9 in the MMLU benchmark.',
    input_context_window: '4,096',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2023-07-18',
    knowledge_cut_off_date: 'September 2022',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx',
    input_cost_per_million_tokens: 0.65,
    output_cost_per_million_tokens: 2.75,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 68.9,
        notes: null,
        source: 'https://llama.meta.com/llama2/',
      },
      MMMU: {
        score: 30.1,
        notes: null,
        source: 'https://arxiv.org/pdf/2311.16502.pdf',
      },
      HellaSwag: {
        score: 85.3,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2307.09288v2',
      },
      HumanEval: {
        score: 29.9,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2307.09288v2',
      },
      MATH: null,
    },
  },
  {
    model_name: 'Llama 2 Chat 13B',
    slug: 'llama-2-chat-13b',
    provider: 'meta',
    description:
      'Llama 2 Chat 13B, developed by Meta, features a context window of 4096 tokens. The model was released on July 18, 2023, and achieved a score of 54.8 in the MMLU benchmark.',
    input_context_window: '4,096',
    maximum_output_tokens: '2,048',
    open_source: true,
    release_date: '2023-07-18',
    knowledge_cut_off_date: 'September 2022',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, NVIDIA NIM, IBM watsonx',
    input_cost_per_million_tokens: 0.1,
    output_cost_per_million_tokens: 0.5,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 54.8,
        notes: null,
        source: 'https://llama.meta.com/llama2/',
      },
      MMMU: {
        score: 0,
        notes: null,
        source: null,
      },
      HellaSwag: {
        score: 80.7,
        notes: '10-shot',
        source: 'https://llama.meta.com/llama2/',
      },
      HumanEval: {
        score: 18.3,
        notes: '0-shot',
        source: 'https://llama.meta.com/llama2/',
      },
      MATH: null,
    },
  },
  {
    model_name: 'Mistral Large 2',
    slug: 'mistral-large-2',
    provider: 'mistral',
    description:
      'Mistral Large 2, developed by Mistral, features a context window of 128K tokens. The model costs $3.00 per million tokens for input and $9.00 per million tokens for output. It was released on July 24, 2024, and achieved a score of 84.0 in the MMLU benchmark in a 5-shot scenario.',
    input_context_window: '128K',
    maximum_output_tokens: '8,192',
    open_source: true,
    release_date: '2024-07-24',
    knowledge_cut_off_date: 'Unknown',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, Snowflake Cortex',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 9,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 84,
        notes: '5-shot',
        source: 'https://mistral.ai/news/mistral-large-2407/',
      },
      'MMLU-Pro': {
        score: 50.69,
        notes: null,
        source:
          'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard#/?official=true',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: {
        score: 1.13,
        notes: null,
        source:
          'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard#/?official=true',
      },
      GPQA: {
        score: 24.94,
        notes: null,
        source: null,
      },
      IFEval: {
        score: 84.01,
        notes: null,
        source: null,
      },
    },
  },
  {
    model_name: 'Mistral Large',
    slug: 'mistral-large',
    provider: 'mistral',
    description:
      'Mistral Large, developed by Mistral, features a context window of 32000 tokens. The model is priced at 0.8 cents per thousand tokens for both input and output. It was released on February 26, 2024, and has achieved impressive scores in benchmarks like MMLU (81.2 in a 5-shot scenario) and HellaSwag (89.2 in a 10-shot scenario).',
    input_context_window: '32K',
    maximum_output_tokens: '4,096',
    open_source: true,
    release_date: '2024-02-26',
    knowledge_cut_off_date: 'Unknown',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, Snowflake Cortex',
    input_cost_per_million_tokens: 8,
    output_cost_per_million_tokens: 8,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 81.2,
        notes: '5-shot',
        source: 'https://mistral.ai/news/mistral-large/',
      },
      MMMU: null,
      HellaSwag: {
        score: 89.2,
        notes: '10-shot',
        source: 'https://mistral.ai/news/mistral-large/',
      },
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Mistral 8x7B Instruct',
    slug: 'mistral-8x7b-instruct',
    provider: 'mistral',
    description:
      'Mistral 8x7B Instruct, developed by Mistral, features a context window of 32000 tokens. The model costs 0.07 cents per thousand tokens for both input and output. It was released on December 11, 2023, and achieved a score of 70.6 in the MMLU benchmark in a 5-shot scenario.',
    input_context_window: '32K',
    maximum_output_tokens: '4,096',
    open_source: true,
    release_date: '2023-12-11',
    knowledge_cut_off_date: 'Unknown',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, Snowflake Cortex',
    input_cost_per_million_tokens: 0.7,
    output_cost_per_million_tokens: 0.7,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 70.6,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2401.04088.pdf',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Mistral 7B Instruct',
    slug: 'mistral-7b-instruct',
    provider: 'mistral',
    description:
      'Mistral 7B Instruct, developed by Mistral, features a large context window of 32000 tokens. The model is priced at 0.025 cents per thousand tokens for both input and output. It was released on September 27, 2023, and achieved a score of 60.1 in the MMLU benchmark under a 5-shot scenario.',
    input_context_window: '32K',
    maximum_output_tokens: '8,192',
    open_source: true,
    release_date: '2023-09-27',
    knowledge_cut_off_date: 'Unknown',
    api_providers:
      'Azure AI, AWS Bedrock, Google AI Studio, Vertex AI, Snowflake Cortex',
    input_cost_per_million_tokens: 0.25,
    output_cost_per_million_tokens: 0.25,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 60.1,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2310.06825.pdf',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'Llama 3.1 Nemotron 70B Instruct',
    slug: 'llama-3-1-nemotron-70b-instruct',
    provider: 'nvidia',
    description:
      "NVIDIA's Llama 3.1 Nemotron 70B is a language model designed for generating precise and useful responses. Leveraging Llama 3.1 70B architecture and Reinforcement Learning from Human Feedback (RLHF), it excels in automatic alignment benchmarks. This model is tailored for applications requiring high accuracy in helpfulness and response generation, suitable for diverse user queries across multiple domains.",
    input_context_window: '128K',
    maximum_output_tokens: 'Unknown',
    open_source: true,
    release_date: '2023-10-15',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'OpenRouter',
    input_cost_per_million_tokens: 0.35,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85,
        notes: '5-shot',
        source:
          'https://artificialanalysis.ai/models/llama-3-1-nemotron-instruct-70b',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 75,
        notes: null,
        source:
          'https://artificialanalysis.ai/models/llama-3-1-nemotron-instruct-70b',
      },
      MATH: {
        score: 71,
        notes: null,
        source:
          'https://artificialanalysis.ai/models/llama-3-1-nemotron-instruct-70b',
      },
    },
  },
  {
    model_name: 'o4-mini',
    slug: 'o4-mini',
    provider: 'openai',
    description:
      'OpenAI o4-mini is their latest small o-series model, optimized for fast, effective reasoning with exceptionally efficient performance in coding and visual tasks. It offers a 200,000 token context window and 100,000 maximum output tokens. The model supports reasoning tokens and can process both text and image inputs while generating text outputs. It balances higher reasoning capabilities with medium speed, making it suitable for a wide range of applications requiring efficient performance.',
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2025-04-16',
    knowledge_cut_off_date: 'May 31, 2024',
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 1.1,
    output_cost_per_million_tokens: 4.4,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {

      GPQA: {
        score: 81.4,
        notes: 'no tools, high effort',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      AIME2024: {
        score: 93.4,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      AIME2025: {
        score: 92.7,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      MMMU: {
        score: 81.6,
        notes: '',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      MathVista: {
        score: 84.3,
        notes: 'Visual Math Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'Humanity\'s Last Exam': {
        score: 14.28,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'CharXiv-Reasoning': {
        score: 72,
        notes: 'Scientific Figure Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'SWE-Bench': {
        score: 68.1,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
    },
  },
  {
    model_name: 'o3',
    slug: 'o3',
    provider: 'openai',
    description:
      'OpenAI o3 is their most capable reasoning model, designed for complex tasks requiring deep reasoning. Released in April 2025, it excels at software engineering, mathematics, and scientific reasoning. The model features three reasoning effort levels (low, medium, high) to balance between deep reasoning and latency. It supports key developer features including function calling, structured outputs, and developer messages. o3 includes vision capabilities for analyzing images and can be accessed through Chat Completions API, Assistants API, and Batch API.',
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2025-04-16',
    knowledge_cut_off_date: 'May 31, 2024',
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 10,
    output_cost_per_million_tokens: 40,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      'AIME2024': {
        score: 91.6,
        notes: 'no tools, Competition Math',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'AIME2025': {
        score: 88.9,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      MMMU: {
        score: 82.9,
        notes: '',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      MathVista: {
        score: 87.5,
        notes: 'Visual Math Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'CharXiv-Reasoning': {
        score: 75.4,
        notes: 'Scientific Figure Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'GPQA': {
        score: 83.3,
        notes: 'Diamond, no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'Humanity\'s Last Exam': {
        score: 20.32,
        notes: 'no tools',
        source: 'https://platform.openai.com/docs/models/o4-mini',
      },
      'SWE-Bench': {
        score: 69.1,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      'Scale MultiChallenge': {
        score: 56.51,
        notes: 'Multi-turn instruction following',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
    },
  },
  {
    model_name: 'o3-mini',
    slug: 'o3-mini',
    provider: 'openai',
    description:
      'OpenAI o3-mini is a fast, cost-efficient reasoning model optimized for STEM tasks, particularly excelling in science, math, and coding. Released in January 2025, it supports key developer features including function calling, structured outputs, and developer messages. The model offers three reasoning effort options (low, medium, high) to balance between deep reasoning and low latency. Unlike o3, it does not support vision capabilities. Initially available to select developers in API usage tiers 3-5, it can be accessed through Chat Completions API, Assistants API, and Batch API.',
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2025-01-31',
    knowledge_cut_off_date: null,
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 1.1,
    output_cost_per_million_tokens: 4.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.9,
        notes: 'pass@1, high effort',
        source: 'https://openai.com/index/openai-o3-mini/',
      },
      GPQA: {
        score: 79.7,
        notes: '0-shot, high effort',
        source: 'https://openai.com/index/openai-o3-mini/',
      },
      MATH: {
        score: 97.9,
        notes: 'pass@1, high effort',
        source: 'https://openai.com/index/openai-o3-mini/',
      },
      SimpleQA: {
        score: 13.8,
        notes: 'high effort',
        source: 'https://openai.com/index/openai-o3-mini/',
      },
    },
  },
  {
    model_name: 'o1 Pro',
    slug: 'o1-pro',
    provider: 'openai',
    description:
      "The o1 pro model, provided by OpenAI, features an input context window of 200K tokens and can generate up to 100K tokens in a single request. This model is not open source and was released in December 2024. It is currently accessible via the $200/month ChatGPT Pro plan, which provides scaled access to OpenAI's best models and tools, including o1, o1-mini, GPT-4o, and Advanced Voice. o1 pro mode uses enhanced compute and longer reflection time to deliver more accurate and reliable responses, particularly for solving complex problems.",
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2024-12-05',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI ChatGPT Pro',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 92.3,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MMMU: {
        score: 78.2,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 92.4,
        notes: null,
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      GPQA: {
        score: 77.3,
        notes: '0-shot',
        source: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MATH: {
        score: 94.8,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
    },
  },
  {
    model_name: 'o1',
    slug: 'o1',
    provider: 'openai',
    description:
      'The full o1 model, provided by OpenAI, features an input context window of 200K tokens and can generate up to 100K tokens in a single request. This model is not open source and was released in December 2024 first only via ChatGPT then API on December 19th. Its knowledge is up-to-date as of October 2023, and can be found in ChatGPT Plus and OpenAI API.',
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2024-12-05',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'ChatGPT Plus, OpenAI API, Azure OpenAI Service',
    input_cost_per_million_tokens: 15,
    output_cost_per_million_tokens: 60,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 92.3,
        notes: 'pass@1',
        url: 'https://openai.com/index/introducing-chatgpt-pro/',
      },
      MMMU: {
        score: 78.2,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 92.4,
        notes: null,
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      GPQA: {
        score: 77.3,
        notes: '0-shot',
        source: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MATH: {
        score: 94.8,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
    },
  },
  {
    model_name: 'o1 Preview',
    slug: 'o1-preview',
    provider: 'openai',
    description:
      "The o1 Preview model, provided by OpenAI, features an input context window of 128K tokens and can generate up to 32.8K tokens in a single request. This model is not open source and was released on September 12, 2024. Its knowledge is up-to-date as of October 2023, and OpenAI is the only API provider. The model's input costs $15 per million tokens, and the output costs $60 per million tokens.",
    input_context_window: '128K',
    maximum_output_tokens: '32.8K',
    open_source: false,
    release_date: '2024-09-12',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 15,
    output_cost_per_million_tokens: 60,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 90.8,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MMMU: {
        score: 78.2,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 92.4,
        notes: null,
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      GPQA: {
        score: 73.3,
        notes: '0-shot',
        source: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MATH: {
        score: 85.5,
        notes: 'pass@1',
        url: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
    },
  },
  {
    model_name: 'o1 Mini',
    slug: 'o1-mini',
    provider: 'openai',
    description:
      "The o1 Mini model, developed by OpenAI, features an input context window of 128K tokens. Capable of generating up to 65.5K tokens in a single request, this model was first released on September 12th, 2024. The knowledge cut-off date for the model is October 2023. It is not open source, and the model's input costs $3 per million tokens, while output generation costs $12 per million tokens. No benchmark results are available.",
    input_context_window: '128K',
    maximum_output_tokens: '65.5K',
    open_source: false,
    release_date: '2024-09-12',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 1.1,
    output_cost_per_million_tokens: 4.4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.2,
        notes: '0-shot CoT',
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 92.4,
        notes: null,
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      GPQA: {
        score: 60,
        notes: '0-shot',
        source: 'https://openai.com/index/learning-to-reason-with-llms/',
      },
      MATH: {
        score: 90.0,
        notes: '0-shot CoT',
        url: 'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
    },
  },
  {
    model_name: 'GPT-4.1',
    slug: 'gpt-4-1',
    provider: 'openai',
    description:
      'GPT-4.1, released by OpenAI on April 14, 2025, features a massive 1 million token context window and can generate up to 32,768 tokens per request. It excels at coding tasks, scoring 54.6% on SWE-Bench Verified, and demonstrates superior instruction following with a 10.5% improvement over GPT-4o on MultiChallenge. The model has a knowledge cutoff of June 2024 and costs $2.00 per million tokens for input and $8.00 per million tokens for output, with a 75% discount for cached inputs.',
    input_context_window: '1M',
    maximum_output_tokens: '32,768',
    open_source: false,
    release_date: '2025-04-14',
    knowledge_cut_off_date: 'June 2024',
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 2,
    output_cost_per_million_tokens: 8,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 90.2,
        notes: 'pass@1',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'Global MMLU': {
        score: 87.3,
        notes: 'pass@1',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'MMLU-Pro': null,
      MMMU: {
        score: 74.8,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      HellaSwag: null,
      HumanEval: null,
      AIME2024: {
        score: 48.1,
        notes: '',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      GPQA: {
        score: 66.3,
        notes: 'Diamond',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'SWE-Bench': {
        score: 54.6,
        notes: 'Verified',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MathVista: {
        score: 72.2,
        notes: 'Image Reasoning',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      IFEval: {
        score: 87.4,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
    },
  },
  {
    model_name: 'GPT-4.1 Mini',
    slug: 'gpt-4-1-mini',
    provider: 'openai',
    description:
      'GPT-4.1 Mini, released by OpenAI on April 14, 2025, is a significant leap in small model performance that matches or exceeds GPT-4o in many benchmarks while reducing latency by nearly half and cost by 83%. It features a 1 million token context window and can generate up to 32K tokens per request. The model has a knowledge cutoff of June 2024 and costs $0.40 per million tokens for input and $1.60 per million tokens for output, with a 75% discount for cached inputs.',
    input_context_window: '1M',
    maximum_output_tokens: '32K',
    open_source: false,
    release_date: '2025-04-14',
    knowledge_cut_off_date: 'June 2024',
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 0.4,
    output_cost_per_million_tokens: 1.6,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 87.5,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'Global MMLU': {
        score: 78.5,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MMMU: {
        score: 72.7,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      HellaSwag: null,
      HumanEval: null,
      AIME2024: {
        score: 49.6,
        notes: '',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      GPQA: {
        score: 65.0,
        notes: 'Diamond',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'SWE-Bench': {
        score: 23.6,
        notes: 'Verified',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MathVista: {
        score: 73.1,
        notes: 'Image Reasoning',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      IFEval: {
        score: 84.1,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
    },
  },
  {
    model_name: 'GPT-4.1 Nano',
    slug: 'gpt-4-1-nano',
    provider: 'openai',
    description:
      'GPT-4.1 Nano, released by OpenAI on April 14, 2025, is their fastest and cheapest model, designed for tasks requiring low latency such as classification or autocompletion. Despite its small size, it features a 1 million token context window and delivers impressive performance, scoring 80.1% on MMLU and 50.3% on GPQA. The model has a knowledge cutoff of June 2024 and costs just $0.10 per million tokens for input and $0.40 per million tokens for output, with a 75% discount for cached inputs.',
    input_context_window: '1M',
    maximum_output_tokens: '32K',
    open_source: false,
    release_date: '2025-04-14',
    knowledge_cut_off_date: 'June 2024',
    api_providers: 'OpenAI API',
    input_cost_per_million_tokens: 0.1,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 80.1,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'Global MMLU': {
        score: 66.9,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      'MMLU-Pro': null,
      MMMU: {
        score: 55.4,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      HellaSwag: null,
      HumanEval: null,
      AIME2024: {
        score: 29.4,
        notes: '',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      GPQA: {
        score: 50.3,
        notes: 'Diamond',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MathVista: {
        score: 56.2,
        notes: 'Image Reasoning',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      IFEval: {
        score: 74.5,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
    },
  },
  {
    model_name: 'GPT-4.5',
    slug: 'gpt-4-5',
    provider: 'openai',
    description:
      'The latest GPT-4.5 model from OpenAI, launched on February 27, 2025, is a massive 12.8 trillion-parameter AI with a 128K token context window. It offers enhanced general knowledge, improved emotional intelligence, multimodal input (text and image), advanced function calling, and streaming responses. Initially available via ChatGPT Pro and later to Plus and Team users, it generates responses at around 37 tokens per second, making it ideal for tasks that require cutting-edge emotional and general intelligence.',
    input_context_window: '128K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2025-02-27',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 75,
    output_cost_per_million_tokens: 150,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false
    },
    benchmarks: {
      MMMLU: {
        score: 85.1,
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      },
      MMMU: {
        score: 74.4,
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      },
      GPQA: {
        score: 71.4,
        notes: 'science',
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      },
      AIME2024: {
        score: 36.7,
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      },
      SimpleQA: {
        score: 62.5,
        notes: null,
        source: 'https://openai.com/gpt-4.5-benchmarks'
      },
      'SWE-Lancer': {
        score: 32.6,
        notes: 'Diamond',
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      },
      'SWE-Bench': {
        score: 38.0,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-gpt-4-5/'
      }
    },
  },
  {
    model_name: 'GPT-4o Mini',
    slug: 'gpt-4o-mini',
    provider: 'openai',
    description:
      'GPT-4o Mini, developed by OpenAI, features a context window of 128K tokens and can generate up to 16.4K tokens in a single request. The model has an empirical throughput of 85.2 tokens per second and was released on July 18th, 2024. It was last updated with new knowledge in October 2023. The model costs $0.15 per million tokens for input and $0.60 per million tokens for output. MMLU benchmark achieved a score of 82.0 in a 5-shot scenario.',
    input_context_window: '128K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2024-07-18',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 0.15,
    output_cost_per_million_tokens: 0.6,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 82,
        notes: '5-shot',
        source:
          'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/',
      },
      'MMLU-Pro': {
        score: 63.09,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: {
        score: 59.4,
        notes: null,
        source:
          'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 87.2,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      MATH: {
        score: 70.2,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
    },
  },
  {
    model_name: 'GPT-4o',
    slug: 'gpt-4o',
    provider: 'openai',
    description:
      'The latest GPT-4o model, provided by OpenAI, features a context window of 128K tokens and supports generating up to 16.4K tokens per request. It was released on August 6, 2024, with a knowledge cut-off as of October 2023. The model is available via OpenAI’s API, and it can empirically generate 77.4 tokens per second. Input costs $2.50 per million tokens and output costs $10 per million tokens.',
    input_context_window: '128K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2024-08-06',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 2.5,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.7,
        notes: '1-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      'MMLU-Pro': {
        score: 74.68,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      'Global MMLU': {
        score: 81.4,
        notes: '',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MMMU: {
        score: 68.7,
        notes: null,
        source: 'https://openai.com/index/hello-gpt-4o/',
      },
      MathVista: {
        score: 61.4,
        notes: '',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 90.2,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      AIME2024: {
        score: 13.1,
        source: 'https://openai.com/index/gpt-4-1/'
      },
      GPQA: {
        score: 46,
        notes: 'Diamond',
        source:
          'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      'SWE-Bench': {
        score: 33.2,
        notes: 'Verified',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MATH: {
        score: 75.9,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
      'IFEval': {
        score: 81,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
    },
  },
  {
    model_name: 'GPT-4o 2024-11-20',
    slug: 'gpt-4o-2024-11-20',
    provider: 'openai',
    description:
      "Latest GPT-4o, provided by OpenAI, features a context window of 128K tokens and supports generating up to 16.4K tokens per request. It was released on November 20, 2024, with a knowledge cut-off as of October 2023. The model is available via OpenAI's API, and it can empirically generate 77.4 tokens per second. Input costs $2.50 per million tokens and output costs $10 per million tokens. The model's creative writing ability has leveled up with more natural, engaging, and tailored writing to improve relevance and readability. It's also better at working with uploaded files, providing deeper insights and more thorough responses.",
    input_context_window: '128K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2024-11-20',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 2.5,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 88.7,
        notes: '5-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },

      'MMLU-Pro': {
        score: 74.68,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: {
        score: 69.1,
        notes: null,
        source: 'https://openai.com/index/hello-gpt-4o/',
      },

      HellaSwag: null,
      HumanEval: {
        score: 90.2,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      GPQA: {
        score: 53.6,
        notes: '0-shot',
        source:
          'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      MATH: {
        score: 75.9,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-4o 2024-08-06',
    slug: 'gpt-4o-2024-08-06',
    provider: 'openai',
    description:
      'GPT-4o, provided by OpenAI, features a context window of 128K tokens and supports generating up to 16.4K tokens per request. It was released on August 6, 2024, with a knowledge cut-off as of October 2023. The model is available via OpenAI’s API, and it can empirically generate 77.4 tokens per second. Input costs $2.50 per million tokens and output costs $10 per million tokens. No benchmark scores are available.',
    input_context_window: '128K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2024-08-06',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 2.5,
    output_cost_per_million_tokens: 10,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 88.7,
        notes: '5-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },

      'MMLU-Pro': {
        score: 74.68,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: {
        score: 69.1,
        notes: null,
        source: 'https://openai.com/index/hello-gpt-4o/',
      },

      HellaSwag: null,
      HumanEval: {
        score: 90.2,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      GPQA: {
        score: 53.6,
        notes: '0-shot',
        source:
          'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      MATH: {
        score: 75.9,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-4o 2024-05-13',
    slug: 'gpt-4o-2024-05-13',
    provider: 'openai',
    description:
      'GPT-4o is a language model developed by OpenAI featuring a context window of 128K tokens. The model allows for a maximum of 2048 tokens to be generated in a single request. Released on May 13, 2024, it has an empirical throughput of 89.3 tokens per second and supports API access through OpenAI. It costs $5.00 per million tokens for input and $15.00 per million tokens for output. As of now, it is not open-source, and its knowledge was last updated in October 2023. The model achieved an 88.7 score on the MMLU benchmark (5-shot setting), indicating robust knowledge acquisition capabilities in a few-shot scenario.',
    input_context_window: '128K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-05-13',
    knowledge_cut_off_date: 'October 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 5,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 87.2,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      'MMLU-Pro': {
        score: 72.55,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: {
        score: 69.1,
        notes: null,
        source: 'https://openai.com/index/hello-gpt-4o/',
      },
      HellaSwag: null,
      HumanEval: {
        score: 91,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      GPQA: {
        score: 53.6,
        notes: '0-shot',
        source:
          'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      MATH: {
        score: 76.6,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-4 Turbo',
    slug: 'gpt-4-turbo',
    provider: 'openai',
    description:
      'The latest GPT-4 Turbo, developed by OpenAI, features an input context window of 128K tokens and a generation capacity of 4,096 tokens per request. Released on April 9, 2024, its knowledge was last updated in December 2023 and it generates 31.8 tokens per second. It is offered by OpenAI and is not open source.',
    input_context_window: '128K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-04-09',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 10,
    output_cost_per_million_tokens: 30,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      'MMLU-Pro': {
        score: 63.71,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 86.6,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      MATH: {
        score: 64.5,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
    },
  },
  {
    model_name: 'GPT-4 Turbo 2024-04-09',
    slug: 'gpt-4-turbo-2024-04-09',
    provider: 'openai',
    description:
      'GPT-4 Turbo, developed by OpenAI, features an input context window of 128K tokens and a generation capacity of 4,096 tokens per request. Released on April 9, 2024, its knowledge was last updated in December 2023 and it generates 31.8 tokens per second. It is offered by OpenAI and is not open source.',
    input_context_window: '128K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-04-09',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 10,
    output_cost_per_million_tokens: 30,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      'MMLU-Pro': {
        score: 63.71,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 86.6,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      MATH: {
        score: 64.5,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
    },
  },
  {
    model_name: 'GPT-4 Turbo 0125',
    slug: 'gpt-4-0125-preview',
    provider: 'openai',
    description:
      'GPT-4 Turbo 0125, developed by OpenAI, features an impressive context window of 128,000 tokens. The model costs 1.0 cent per thousand tokens for input and 3.0 cents per thousand tokens for output. It is set to be released on January 25, 2024.',
    input_context_window: '128K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-01-25',
    knowledge_cut_off_date: 'December 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 10,
    output_cost_per_million_tokens: 30,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 85.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      'MMLU-Pro': {
        score: 63.71,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 86.6,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      MATH: {
        score: 64.5,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
    },
  },
  {
    model_name: 'GPT-4 Turbo 1106',
    slug: 'gpt-4-1106-preview',
    provider: 'openai',
    description:
      'GPT-4 Turbo 1106, developed by OpenAI, features an impressive context window of 128,000 tokens. The model costs 1.0 cent per thousand tokens for input and 3.0 cents per thousand tokens for output. It is set to be released on November 6, 2023.',
    input_context_window: '128K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2023-11-06',
    knowledge_cut_off_date: 'April 2023',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 10,
    output_cost_per_million_tokens: 30,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 84.7,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      'MMLU-Pro': {
        score: 63.71,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      MMMU: null,
      HellaSwag: null,
      HumanEval: {
        score: 83.7,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
      MATH: {
        score: 64.3,
        notes: '0-shot',
        source:
          'https://github.com/openai/simple-evals?tab=readme-ov-file#benchmark-results',
      },
    },
  },
  {
    model_name: 'GPT-4 32K 0613',
    slug: 'gpt-4-32k-0613',
    provider: 'openai',
    description:
      'GPT-4 32K 0613, developed by OpenAI, features a context window of 32768 tokens. The model costs 6.0 cents per thousand tokens for input and 12.0 cents per thousand tokens for output. It was released on June 13, 2023.',
    input_context_window: '32.8K',
    maximum_output_tokens: 'Unknown.',
    open_source: false,
    release_date: '2023-06-13',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 60,
    output_cost_per_million_tokens: 120,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: null,
      MMMU: null,
      HellaSwag: null,
      HumanEval: null,
      MATH: null,
    },
  },
  {
    model_name: 'GPT-4',
    slug: 'gpt-4',
    provider: 'openai',
    description:
      'The latest GPT-4, developed by OpenAI, features a context window of 8192 tokens. The model costs 3.0 cents per thousand tokens for input and 6.0 cents per thousand tokens for output. It was released on March 14, 2023, and has achieved impressive scores in benchmarks like HellaSwag with a score of 95.3 in a 10-shot scenario and MMLU with a score of 86.4 in a 5-shot scenario.',
    input_context_window: '8,192',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2023-06-13',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 30,
    output_cost_per_million_tokens: 60,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: {
        score: 34.9,
        notes: null,
        source: 'https://arxiv.org/pdf/2311.16502.pdf',
      },
      HellaSwag: {
        score: 95.3,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: {
        score: 67,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MATH: null,
    },
  },
  {
    model_name: 'GPT-4 0613',
    slug: 'gpt-4-0613',
    provider: 'openai',
    description:
      'GPT-4 0613, developed by OpenAI, features a context window of 8192 tokens. The model costs 3.0 cents per thousand tokens for input and 6.0 cents per thousand tokens for output. It was released on June 13, 2023.',
    input_context_window: '8,192',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2023-06-13',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 30,
    output_cost_per_million_tokens: 60,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: {
        score: 34.9,
        notes: null,
        source: 'https://arxiv.org/pdf/2311.16502.pdf',
      },
      HellaSwag: {
        score: 95.3,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: {
        score: 67,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MATH: null,
    },
  },
  {
    model_name: 'GPT-4 32K',
    slug: 'gpt-4-32k',
    provider: 'openai',
    description:
      'Retired GPT-4 32K, developed by OpenAI, features a context window of 32768 tokens. The model costs 6.0 cents per thousand tokens for input and 12.0 cents per thousand tokens for output. It was released on March 14, 2023.',
    input_context_window: '32.8K',
    maximum_output_tokens: '8,192',
    open_source: false,
    release_date: '2023-03-14',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 60,
    output_cost_per_million_tokens: 120,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: {
        score: 34.9,
        notes: null,
        source: 'https://arxiv.org/pdf/2311.16502.pdf',
      },
      HellaSwag: {
        score: 95.3,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: {
        score: 67,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MATH: null,
    },
  },
  {
    model_name: 'GPT-4 0314',
    slug: 'gpt-4-0314',
    provider: 'openai',
    description:
      'Original GPT-4, developed by OpenAI, features a context window of 8192 tokens. The model costs 3.0 cents per thousand tokens for input and 6.0 cents per thousand tokens for output. It was released on March 14, 2023, and has achieved impressive scores in benchmarks like HellaSwag with a score of 95.3 in a 10-shot scenario and MMLU with a score of 86.4 in a 5-shot scenario.',
    input_context_window: '8,192 tokens',
    maximum_output_tokens: '8,192 tokens',
    open_source: false,
    release_date: '2023-03-14',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 30,
    output_cost_per_million_tokens: 60,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 86.4,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: {
        score: 34.9,
        notes: null,
        source: 'https://arxiv.org/pdf/2311.16502.pdf',
      },
      HellaSwag: {
        score: 95.3,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: {
        score: 67,
        notes: '0-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MATH: null,
    },
  },

  {
    model_name: 'GPT-3.5 Turbo',
    slug: 'gpt-3-5-turbo',
    provider: 'openai',
    description:
      'The latest GPT-3.5 Turbo, developed by OpenAI, features a context window of 16385 tokens. The model costs 0.05 cents per thousand tokens for input and 0.15 cents per thousand tokens for output. It was released on January 25, 2024. With higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls. Currently points to gpt-3.5-turbo-0125.',
    input_context_window: '16.4K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-01-25',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 0.5,
    output_cost_per_million_tokens: 1.5,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 70,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: null,
      HellaSwag: {
        score: 85.5,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: null,
      MATH: {
        score: 43.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-3.5 Turbo 0125',
    slug: 'gpt-3-5-turbo-0125',
    provider: 'openai',
    description:
      'GPT-3.5 Turbo 0125, developed by OpenAI, features a context window of 16385 tokens. The model costs 0.05 cents per thousand tokens for input and 0.15 cents per thousand tokens for output. It was released on January 25, 2024. With higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls.',
    input_context_window: '16.4K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2024-01-25',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 0.5,
    output_cost_per_million_tokens: 1.5,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 70,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: null,
      HellaSwag: {
        score: 85.5,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: null,
      MATH: {
        score: 43.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-3.5 Turbo 1106',
    slug: 'gpt-3-5-turbo-1106',
    provider: 'openai',
    description:
      'GPT-3.5 Turbo 1106, developed by OpenAI, features a context window of 16385 tokens. Has Improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. The model costs 0.1 cents per thousand tokens for input and 0.2 cents per thousand tokens for output. It was released on November 6, 2023.',
    input_context_window: '16.4K',
    maximum_output_tokens: '4,096',
    open_source: false,
    release_date: '2023-11-06',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 1,
    output_cost_per_million_tokens: 2,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 70,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: null,
      HellaSwag: {
        score: 85.5,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: null,
      MATH: {
        score: 43.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'GPT-3.5 Turbo 16K',
    slug: 'gpt-3-5-turbo-16k',
    provider: 'openai',
    description:
      'RetiredGPT-3.5 Turbo 16K, developed by OpenAI, features a context window of 16384 tokens. The model costs 0.3 cents per thousand tokens for input and 0.4 cents per thousand tokens for output. It was released on June 13, 2023.',
    input_context_window: '16.4K',
    maximum_output_tokens: '16.4K',
    open_source: false,
    release_date: '2023-06-13',
    knowledge_cut_off_date: 'September 2021',
    api_providers: 'OpenAI, Azure OpenAI Service',
    input_cost_per_million_tokens: 3,
    output_cost_per_million_tokens: 4,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 70,
        notes: '5-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      MMMU: null,
      HellaSwag: {
        score: 85.5,
        notes: '10-shot',
        source: 'https://arxiv.org/pdf/2303.08774v5.pdf',
      },
      HumanEval: null,
      MATH: {
        score: 43.1,
        notes: '0-shot',
        source:
          'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md',
      },
    },
  },
  {
    model_name: 'Grok 3 Beta',
    slug: 'grok-3',
    provider: 'xai',
    description:
      'Grok 3 is xAI\'s most advanced model, trained on their Colossus supercluster with 10x the compute of previous state-of-the-art models. It features a 1M token context window and advanced reasoning capabilities refined through large-scale reinforcement learning, allowing it to think for seconds to minutes while solving complex problems. The model demonstrates leading performance across academic benchmarks and real-world user preferences, with an Elo score of 1402 in the Chatbot Arena. Released with a companion Grok 3 mini model optimized for cost-efficient reasoning.',
    input_context_window: '1M',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-02-19',
    knowledge_cut_off_date: 'February 2025',
    api_providers: 'xAI',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: true,
    },
    benchmarks: {
      'MMLU-Pro': {
        score: 79.9,
        notes: 'Base model',
        source: 'https://x.ai/blog/grok-3',
      },
      MMMU: {
        score: 78,
        notes: 'With Think mode',
        source: 'https://x.ai/blog/grok-3',
      },
      GPQA: {
        score: 84.6,
        notes: 'With Think mode, Diamond',
        source: 'https://x.ai/blog/grok-3',
      },
      'AIME2025': {
        score: 93.3,
        notes: 'With Think mode, cons@64',
        source: 'https://x.ai/blog/grok-3',
      },
      'LiveCodeBench': {
        score: 79.4,
        notes: 'v5 With Think mode',
        source: 'https://x.ai/blog/grok-3',
      },
      SimpleQA: {
        score: 43.6,
        source: 'https://x.ai/blog/grok-3',
      },
    },
  },
  {
    model_name: 'Grok-2',
    slug: 'grok-2',
    provider: 'xai',
    description:
      'Grok-2 is a frontier language model released by xAI, featuring state-of-the-art reasoning capabilities in chat, coding, and reasoning. It outperforms models like Claude 3.5 Sonnet and GPT-4-Turbo on the LMSYS leaderboard and offers advanced capabilities in both text and vision understanding. Released on August 13, 2024, Grok-2 is currently in beta on the 𝕏 platform and is soon to be available through an enterprise API.',
    input_context_window: '128K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2024-08-13',
    knowledge_cut_off_date: 'Unknown',
    api_providers: 'xAI',
    input_cost_per_million_tokens: 5,
    output_cost_per_million_tokens: 15,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 87.5,
        notes: '0-shot CoT',
        source: 'https://x.ai/blog/grok-2',
      },
      'MMLU-Pro': {
        score: 75.5,
        notes: '0-shot CoT',
        source: 'https://x.ai/blog/grok-2',
      },
      MMMU: {
        score: 66.1,
        notes: '0-shot CoT',
        source: 'https://x.ai/blog/grok-2',
      },
      HellaSwag: null,
      HumanEval: {
        score: 88.4,
        notes: 'pass@1',
        source: 'https://x.ai/blog/grok-2',
      },
      MATH: {
        score: 76.1,
        notes: 'maj@1',
        source: 'https://x.ai/blog/grok-2',
      },
    },
  },
  {
    model_name: 'DeepSeek-V3',
    slug: 'deepseek-v3',
    provider: 'deepseek',
    description:
      'DeepSeek-V3 is a Open-Source 671B parameter Mixture-of-Experts (MoE) model with 37B activated parameters per token. It features innovative load balancing and multi-token prediction, trained on 14.8T tokens. The model achieves state-of-the-art performance across benchmarks while maintaining efficient training costs of only 2.788M H800 GPU hours. It incorporates reasoning capabilities distilled from DeepSeek-R1 and supports a 128K context window.',
    input_context_window: '128K',
    maximum_output_tokens: '8K',
    open_source: true,
    release_date: '2024-12-27',
    knowledge_cut_off_date: null,
    api_providers: 'DeepSeek, HuggingFace',
    input_cost_per_million_tokens: 0.14,
    output_cost_per_million_tokens: 0.28,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 88.5,
        notes: 'EM',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      'MMLU-Pro': {
        score: 75.9,
        notes: 'EM',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      MMMU: null,
      HellaSwag: {
        score: 88.9,
        notes: '10-shot',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      GPQA: {
        score: 59.1,
        notes: 'pass@1',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      HumanEval: {
        score: 82.6,
        notes: 'pass@1',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      IFEval: {
        score: 86.1,
        notes: 'Prompt Strict',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
      MATH: {
        score: 61.6,
        notes: '4-shot',
        source: 'https://github.com/deepseek-ai/DeepSeek-V3',
      },
    },
  },
  {
    model_name: 'DeepSeek-R1',
    slug: 'deepseek-r1',
    provider: 'deepseek',
    description:
      'DeepSeek-R1 is a 671B parameter Mixture-of-Experts (MoE) model with 37B activated parameters per token, trained via large-scale reinforcement learning with a focus on reasoning capabilities. It incorporates two RL stages for discovering improved reasoning patterns and aligning with human preferences, along with two SFT stages for seeding reasoning and non-reasoning capabilities. The model achieves performance comparable to OpenAI-o1 across math, code, and reasoning tasks.',
    input_context_window: '128K',
    maximum_output_tokens: '32K',
    open_source: true,
    release_date: '2025-01-21',
    knowledge_cut_off_date: null,
    api_providers: 'DeepSeek, HuggingFace',
    input_cost_per_million_tokens: 0.55,
    output_cost_per_million_tokens: 2.19,
    modalities: {
      text: true,
      image: false,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 90.8,
        notes: 'Pass@1',
        source: 'https://github.com/deepseek-ai/DeepSeek-R1',
      },
      'MMLU-Pro': {
        score: 84.0,
        notes: 'EM',
        source: 'https://github.com/deepseek-ai/DeepSeek-R1',
      },
      MMMU: null,
      HellaSwag: null,
      GPQA: {
        score: 71.5,
        notes: 'Pass@1',
        source: 'https://github.com/deepseek-ai/DeepSeek-R1',
      },
      HumanEval: null,
      IFEval: {
        score: 83.3,
        notes: 'Prompt Strict',
        source: 'https://github.com/deepseek-ai/DeepSeek-R1',
      },
      MATH: null,
    },
  },
]

module.exports = { LLMS }
