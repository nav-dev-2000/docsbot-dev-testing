const LLMS = [
  
  {
    model_name: "Claude Opus 4.5",
    slug: "claude-opus-4-5",
    provider: "anthropic",
    description:
      "Claude Opus 4.5 is Anthropic’s flagship frontier reasoning and agentic model (released November 2025), optimized for advanced coding, autonomous tool use, real-world computer interaction, and long-horizon multi-step workflows. It supports hybrid reasoning with extended thinking controlled via an effort parameter.",
    input_context_window: "200K",
    maximum_output_tokens: "64K",
    open_source: false,
    release_date: "2025-11-24",
    knowledge_cutoff_date: "2025-05",
    api_providers:
      "Anthropic API, Amazon Bedrock, Google Vertex AI, Claude developer platform",
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    key_capabilities: {
      coding: true,
      agentic_tool_use: true,
      computer_use: true,
      long_horizon_reasoning: true,
      document_spreadsheet_automation: true,
      multi_step_workflows: true,
    },
    benchmarks: {
      SWEBench: {
        score: 80.9,
        notes: "Verified",
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      TerminalBench: {
        score: 59.3,
        notes: null,
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      Tau2BenchRetail: {
        score: 88.9,
        notes: null,
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      Tau2BenchTelecom: {
        score: 98.2,
        notes: null,
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      OSWorld: {
        score: 66.3,
        notes: null,
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      AIME2025: {
        score: 92.77,
        notes: "No tools",
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      AIME2025WithTools: {
        score: 100.0,
        notes: "Python",
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      GPQA: {
        score: 87.0,
        notes: "Diamond",
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      MMMU: {
        score: 80.7,
        notes: "Validation",
        source: "https://www.anthropic.com/news/claude-opus-4-5",
      },
      MMLU: {
        score: 90.8,
        notes: null,
        source: "https://www.anthropic.com/news/claude-opus-4-5",
    },
  },
},

  {
    model_name: 'Claude Haiku 4.5',
    slug: 'claude-haiku-4-5',
    provider: 'anthropic',
    description:
      'Claude Haiku 4.5 is Anthropic’s ultra-fast, cost-efficient small model (released Oct 15 2025). It offers near-frontier reasoning and coding quality at a fraction of Sonnet’s price, with a 200K-token context window, up to 64K output tokens, and new features like extended-thinking mode and improved multi-document synthesis. Ideal for real-time chat, coding assistants, RAG pipelines, and lightweight agents.',
    input_context_window: '200K',
    maximum_output_tokens: '64K',
    open_source: false,
    release_date: '2025-10-15',
    knowledge_cut_off_date: '2025-02-28',
    api_providers:
      'Claude.ai (web, iOS, Android), Anthropic API, Claude Code, Amazon Bedrock, Google Cloud Vertex AI, GitHub Copilot (CLI integration)',
    input_cost_per_million_tokens: 1.0,
    output_cost_per_million_tokens: 5.0,
    modality_discounts: {
      batch_input: 0.5,
      batch_output: 2.5,
      cache_write: 1.25,
      cache_read: 0.1,
    },
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      SWEBench: {
        score: 73.3,
        notes: 'Verified',
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      TerminalBench: {
        score: 41.0,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      Tau2BenchRetail: {
        score: 83.2,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      Tau2BenchAirline: {
        score: 63.6,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      Tau2BenchTelecom: {
        score: 83.0,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      OSWorld: {
        score: 50.7,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      AIME2025: {
        score: 80.7,
        notes: 'No tools',
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      AIME2025WithTools: {
        score: 96.3,
        notes: 'Python',
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      GPQA: {
        score: 73.0,
        notes: 'Diamond',
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      MMMLU: {
        score: 83.0,
        notes: null,
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
      MMMU: {
        score: 73.2,
        notes: 'Validation',
        source: 'https://www.anthropic.com/news/claude-haiku-4-5',
      },
    },
  },

  {
    model_name: 'Claude Opus 4.1',
    slug: 'claude-opus-4-1',
    provider: 'anthropic',
    description:
      'Claude Opus 4.1 is Anthropic’s refined flagship reasoning model (released August 5, 2025), offering enhanced real-world coding, agentic research, creative writing, and hybrid reasoning capabilities. It supports extended thinking with user-visible reasoning summaries and hybrid mode toggles for instant or deep step-by-step reasoning. Available via Anthropic API, Claude Code, Amazon Bedrock, Google Vertex AI, and GitHub Copilot (Pro+ / Enterprise).',
    input_context_window: '200K',
    maximum_output_tokens: '32K',
    open_source: false,
    release_date: '2025-08-05',
    knowledge_cut_off_date: '2025-07-31',
    api_providers:
      'Anthropic API, Claude Code, Amazon Bedrock, Vertex AI, GitHub Copilot',
    input_cost_per_million_tokens: 15,
    output_cost_per_million_tokens: 75,
    modality_discounts: {
      batch_input: 7.5,
      batch_output: 37.5,
      cache_write: 18.75,
      cache_read: 1.5,
    },
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      SWEBench: {
        score: 74.5,
        notes: 'Verified',
        source: 'https://www.anthropic.com/news/claude-opus-4-1',
      },
      MultiFileRefactoring: {
        score: null,
        notes: 'Significant improvement vs. Opus 4; cleaner fixes',
        source: 'https://www.anthropic.com/news/claude-opus-4-1',
      },
      OSWorld: {
        score: 44.4,
        notes: 'Real-world computer use benchmark',
        source:
          'https://www.investing.com/news/company-news/anthropic-launches-claude-sonnet-45-claims-worlds-best-coding-model-4261494', // :contentReference[oaicite:1]{index=1}
      },
      AIME2025: {
        score: 78,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      GPQA: {
        score: 81,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
        notes: 'Diamond',
      },
      MMMLU: {
        score: 89.5,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      MMMU: {
        score: 77.1,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      FinanceAgent: {
        score: 50.9,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
    },
  },
  {
    model_name: 'Claude 4 Opus',
    slug: 'claude-4-opus',
    provider: 'anthropic',
    description:
      "Claude 4 Opus is Anthropic’s most advanced model. With a 200K token context window and hybrid reasoning, it's the world’s best coding model and excels at reasoning, tool use, and math. Available on Claude.ai, API, Bedrock, and Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-05-22',
    knowledge_cut_off_date: 'April 2025',
    api_providers:
      'Claude.ai, Anthropic API, Amazon Bedrock, Google Cloud Vertex AI',
    input_cost_per_million_tokens: 15.0,
    output_cost_per_million_tokens: 75.0,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      MMLU: {
        score: 88.8,
        source: 'https://www.datacamp.com/blog/claude-4', // :contentReference[oaicite:5]{index=5}
      },
      GPQA: {
        score: 79.6,
        source: 'https://www.datacamp.com/blog/claude-4', // :contentReference[oaicite:6]{index=6}
      },
      SWEBench: {
        score: 72.5,
        source: 'https://www.datacamp.com/blog/claude-4', // :contentReference[oaicite:7]{index=7}
      },
      TerminalBench: {
        score: 43.2,
        source: 'https://www.datacamp.com/blog/claude-4', // :contentReference[oaicite:8]{index=8}
      },
    },
  },
  {
    model_name: 'Claude 4.5 Sonnet',
    slug: 'claude-4-5-sonnet',
    provider: 'anthropic',
    description:
      'Claude 4.5 Sonnet is Anthropic’s newest balanced flagship. It delivers major gains in coding, long-horizon planning, and real-world computer use, including sustained autonomous work (30+ hours observed). It’s available on Claude.ai, Anthropic API, Amazon Bedrock, and Google Cloud Vertex AI.',
    input_context_window: '200K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-09-29',
    knowledge_cut_off_date: 'April 2025',
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
      SWEBench: {
        score: 77.2,
        notes: 'Verified',
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5', // :contentReference[oaicite:0]{index=0}
      },
      OSWorld: {
        score: 61.4,
        notes: 'Real-world computer use benchmark',
        source:
          'https://www.investing.com/news/company-news/anthropic-launches-claude-sonnet-45-claims-worlds-best-coding-model-4261494', // :contentReference[oaicite:1]{index=1}
      },
      AIME2025: {
        score: 87,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      GPQA: {
        score: 83.4,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
        notes: 'Diamond',
      },
      MMMLU: {
        score: 89.1,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      MMMU: {
        score: 77.8,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      FinanceAgent: {
        score: 55.3,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
    },
  },
  {
    model_name: 'Claude 4 Sonnet',
    slug: 'claude-4-sonnet',
    provider: 'anthropic',
    description:
      "Claude 4 Sonnet is Anthropic's balanced flagship model. It features a 200K token context window and excels in hybrid reasoning, coding, and general knowledge tasks. It demonstrates strong performance on coding and mathematical benchmarks, and is available via Claude.ai, Anthropic API, Amazon Bedrock, and Google Cloud Vertex AI.",
    input_context_window: '200K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-05-22',
    knowledge_cut_off_date: 'April 2025',
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
      MMLU: {
        score: 86.5,
        source: 'https://www.datacamp.com/blog/claude-4',
      },
      GPQA: {
        score: 76.1,
        notes: 'Diamond',
        source: 'https://www.datacamp.com/blog/claude-4',
      },
      SWEBench: {
        score: 72.7,
        notes: 'Verified',
        source:
          'https://nodeshift.com/blog/claude-4-opus-vs-sonnet-benchmarks-and-dev-workflow-with-claude-code',
      },
      AIME2025: {
        score: 70.5,
        source: 'https://www.datacamp.com/blog/claude-4',
      },
      OSWorld: {
        score: 42.2,
        notes: 'Real-world computer use benchmark',
        source:
          'https://www.investing.com/news/company-news/anthropic-launches-claude-sonnet-45-claims-worlds-best-coding-model-4261494', // :contentReference[oaicite:1]{index=1}
      },
      MMMLU: {
        score: 86.5,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      MMMU: {
        score: 74.4,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      FinanceAgent: {
        score: 44.5,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
    },
  },
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
    model_name: 'Claude 3.5 Sonnet',
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
      MMLUPro: {
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
    slug: 'claude-3-5-sonnet-20241022',
    redirect_to: 'claude-3-5-sonnet',
  },
  {
    slug: 'claude-3-5-sonnet-20240620',
    redirect_to: 'claude-3-5-sonnet',
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
      MMLUPro: {
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
      MMLUPro: {
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
      MMLUPro: {
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
      "Command A is Cohere's state-of-the-art generative model optimized for demanding enterprises requiring fast, secure, and high-quality AI. It delivers maximum performance with minimal hardware costs compared to leading models like GPT-4o and DeepSeek-V3. With a 256K context window (2x most leading models), it excels at business-critical agentic and multilingual tasks while being deployable on just two GPUs. It offers superior throughput (up to 156 tokens/sec, 1.75x higher than GPT-4o) and increased efficiency.",
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
      BirdSQL: {
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
      MMMUPro: null,
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
      MMLUPro: {
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
      MMLUPro: {
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
    slug: 'gemini-1-5-pro-001',
    redirect_to: 'gemini-1-5-pro-002',
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
      "Gemini 2.5 Pro is Google's older intelligent AI model, designed as a thinking model capable of reasoning through its thoughts before responding. It leads common benchmarks by meaningful margins and showcases strong reasoning and code capabilities. The model excels at creating visually compelling web apps, agentic code applications, and code transformation. With native multimodality and a long context window, it can comprehend vast datasets and handle complex problems from different information sources.",
    input_context_window: '1M',
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
      HumanitysLastExam: {
        score: 21.6,
        notes: 'No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      ARCAGI2: {
        score: 4.9,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      GPQA: {
        score: 86.4,
        notes: 'Diamond Science, No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      AIME2024: {
        score: 92,
        notes: null,
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      AIME2025: {
        score: 88.0,
        notes: 'No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MathArenaApex: {
        score: 0.5,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MMMUPro: {
        score: 68.0,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      ScreenSpotPro: {
        score: 11.4,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      CharXivReasoning: {
        score: 69.6,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      OmniDocBench15: {
        score: 0.145,
        notes: 'Overall Edit Distance, lower is better',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      VideoMMMU: {
        score: 83.6,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      LiveCodeBenchPro: {
        score: 1775,
        notes: 'Elo Rating, higher is better',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      TerminalBench: {
        score: 32.6,
        notes: 'Terminus-2 agent',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      SWEBench: {
        score: 59.6,
        notes: 'Verified, Single attempt',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      Tau2Bench: {
        score: 54.9,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      VendingBench2: {
        score: 573.64,
        notes: 'Net worth (mean), higher is better',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      FACTSBenchmarkSuite: {
        score: 63.4,
        notes: 'Held out internal grounding, parametric, MM, and search retrieval benchmarks',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      SimpleQA: {
        score: 54.5,
        notes: 'Verified, Parametric knowledge',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      GlobalMMLU: {
        score: 89.8,
        notes: 'Lite',
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      MMMLU: {
        score: 89.5,
        notes: 'Multilingual Q&A',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      GlobalPIQA: {
        score: 91.5,
        notes: null,
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MRCRv2_128k: {
        score: 58.0,
        notes: '8-needle, average',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MRCRv2_1M: {
        score: 16.4,
        notes: '8-needle, pointwise',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
    },
  },
  {
    model_name: 'Gemini 3 Pro',
    slug: 'gemini-3-pro',
    provider: 'google',
    description:
      'Gemini 3 Pro is Google\'s most intelligent model, designed to help bring any idea to life through state-of-the-art reasoning and multimodal understanding. It excels as the world\'s best model for multimodal tasks and stands as Google\'s most powerful agentic and coding model, delivering richer visualizations and deeper interactivity. The model significantly outperforms Gemini 2.5 Pro across all major benchmarks, achieving breakthrough scores on reasoning tasks like Humanity\'s Last Exam and GPQA Diamond, setting new standards in mathematics with MathArena Apex, and demonstrating exceptional performance in multimodal reasoning across video, images, and factual accuracy tasks.',
    input_context_window: '1M',
    maximum_output_tokens: '64K',
    open_source: false,
    release_date: '2025-11-18',
    knowledge_cut_off_date: 'January 2025',
    api_providers: 'Google AI Studio, Vertex AI, Gemini app',
    input_cost_per_million_tokens: 2.0,
    output_cost_per_million_tokens: 12.0,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      HumanitysLastExam: {
        score: 37.5,
        notes: 'No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      HumanitysLastExamWithTools: {
        score: 45.8,
        notes: 'With search and code execution',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      ARCAGI2: {
        score: 31.1,
        notes: 'Visual reasoning puzzles, ARC Prize Verified',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      GPQA: {
        score: 91.9,
        notes: 'Diamond, Scientific knowledge, No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      AIME2025: {
        score: 95.0,
        notes: 'No tools',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      AIME2025WithTools: {
        score: 100,
        notes: 'With code execution',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MathArenaApex: {
        score: 23.4,
        notes: 'Challenging Math Contest problems',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MMMU: {
        score: 81.0,
        notes: 'Pro, Multimodal understanding and reasoning',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      ScreenSpotPro: {
        score: 72.7,
        notes: 'Screen understanding',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      CharXivReasoning: {
        score: 81.4,
        notes: 'Information synthesis from complex charts',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      OmniDocBench15: {
        score: 0.115,
        notes: 'OCR, Overall Edit Distance (lower is better)',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      VideoMMMU: {
        score: 87.6,
        notes: 'Knowledge acquisition from videos',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      LiveCodeBenchPro: {
        score: 2439,
        notes: 'Competitive coding problems from Codeforces, ICPC, and IOI, Elo Rating (higher is better)',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      TerminalBench: {
        score: 54.2,
        notes: '2.0, Agentic terminal coding, Terminus-2 agent',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      SWEBench: {
        score: 76.2,
        notes: 'Verified, Agentic coding, Single attempt',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      Tau2Bench: {
        score: 85.4,
        notes: 'Agentic tool use',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      VendingBench2: {
        score: 5478.16,
        notes: 'Long-horizon agentic tasks, Net worth (mean), higher is better',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      FACTSBenchmarkSuite: {
        score: 70.5,
        notes: 'Held out internal grounding, parametric, MM, and search retrieval benchmarks',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      SimpleQA: {
        score: 72.1,
        notes: 'Parametric knowledge',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MMMLU: {
        score: 91.8,
        notes: 'Multilingual Q&A',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      GlobalPIQA: {
        score: 93.4,
        notes: 'Commonsense reasoning across 100 Languages and Cultures',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MRCRv2_128k: {
        score: 77.0,
        notes: 'Long context performance, 128k (average)',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
      MRCRv2_1M: {
        score: 26.3,
        notes: 'Long context performance, 1M (pointwise)',
        source:
          'https://deepmind.google/models/evals-methodology/gemini-3-pro',
      },
    },
  },
  {
    model_name: 'Gemini 2.5 Flash',
    slug: 'gemini-2-5-flash',
    provider: 'google',
    description:
      "Gemini 2.5 Flash is Google's first fully hybrid reasoning model that balances performance with speed and cost efficiency. It features controllable thinking capabilities, allowing developers to turn thinking on or off and set thinking budgets to find the optimal balance between quality, cost, and latency. Even with thinking turned off, it maintains the fast speeds of 2.0 Flash while delivering improved performance. The model performs strongly on complex reasoning tasks, ranking second only to Gemini 2.5 Pro on Hard Prompts in LMArena.",
    input_context_window: '1M',
    maximum_output_tokens: '65K',
    open_source: false,
    release_date: '2025-04-17',
    knowledge_cut_off_date: 'January 2025',
    api_providers: 'Google AI Studio, Vertex AI, Gemini app',
    input_cost_per_million_tokens: 0.15,
    output_cost_per_million_tokens: 0.6,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      HumanitysLastExam: {
        score: 12.1,
        notes: 'State-of-the-art across models without tool use',
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      GPQA: {
        score: 78.3,
        notes: 'Diamond Science',
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      AIME2024: {
        score: 88.0,
        notes: null,
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      AIME2025: {
        score: 78.0,
        notes: null,
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      GlobalMMLU: {
        score: 88.4,
        notes: 'Lite',
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      MMMU: {
        score: 76.7,
        notes: null,
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      LiveCodeBench: {
        score: 63.5,
        notes: 'v5',
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
      SimpleQA: {
        score: 29.7,
        notes: null,
        source:
          'https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/',
      },
    },
  },
  {
    model_name: 'Gemini 2.5 Flash Lite',
    slug: 'gemini-2.5-flash-lite',
    provider: 'google',
    description:
      'Gemini 2.5 Flash Lite is Google’s fastest and most cost‑efficient model in the 2.5 family, optimized for low‑latency tasks like translation and classification. It supports controllable reasoning (thinking budgets), 1M-token context, and multimodal input (text, image, audio, video) while maintaining high performance across coding, reasoning, math, science, and multimodal understanding benchmarks.',
    input_context_window: '1M',
    maximum_output_tokens: '65K',
    open_source: false,
    release_date: '2025-06-17',
    knowledge_cut_off_date: 'January 2025',
    api_providers: 'Google AI Studio, Vertex AI, Gemini app',
    input_cost_per_million_tokens: 0.1,
    output_cost_per_million_tokens: 0.4,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      HumanitysLastExam: {
        score: 5.1,
        notes: 'Non‑thinking mode score',
        source: 'https://deepmind.google/models/gemini/flash-lite/',
      },
      GPQA: {
        score: 64.6,
        notes: null,
        source: 'https://deepmind.google/models/gemini/flash-lite/',
      },
      AIME2025: {
        score: 49.8,
        notes: null,
        source: 'https://deepmind.google/models/gemini/flash-lite/',
      },
      SimpleQA: {
        score: 13.0,
        notes: null,
        source: 'https://deepmind.google/models/gemini/flash-lite/',
      },
      MMMU: {
        score: 72.9,
        notes: null,
        source: 'https://deepmind.google/models/gemini/flash-lite/',
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
      MMLUPro: {
        score: 79.1,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      LiveCodeBench: {
        score: 36.0,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      BirdSQLDev: {
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
      FACTSGrounding: {
        score: 82.8,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GlobalMMLU: {
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
      MRCRv2_1M: {
        score: 74.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 72.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      CoVoST2_21lang: {
        score: 40.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      EgoSchemaTest: {
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
      MMLUPro: {
        score: 77.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      LiveCodeBench: {
        score: 34.5,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      BirdSQLDev: {
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
      FACTSGrounding: {
        score: 84.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GlobalMMLU: {
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
      MRCRv2_1M: {
        score: 70.5,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 71.7,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      CoVoST2_21lang: {
        score: 39.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      EgoSchemaTest: {
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
      MMLUPro: {
        score: 71.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      LiveCodeBench: {
        score: 28.9,
        notes: 'v5',
        source: 'https://deepmind.google/technologies/gemini/',
      },
      BirdSQLDev: {
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
      FACTSGrounding: {
        score: 83.6,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      GlobalMMLU: {
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
      MRCRv2_1M: {
        score: 58.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      MMMU: {
        score: 68.0,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      CoVoST2_21lang: {
        score: 38.4,
        notes: null,
        source: 'https://deepmind.google/technologies/gemini/',
      },
      EgoSchemaTest: {
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
      MMLUPro: {
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
    slug: 'gemini-1-5-flash-001',
    redirect_to: 'gemini-1-5-flash-002',
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
      MMLUPro: {
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
      MMLUPro: {
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
      MTOBFull: {
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
      MMLUPro: {
        score: 80.5,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      GPQA: {
        score: 69.8,
        notes: 'Diamond',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      GlobalMMLU: {
        score: 64.6,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MTOB: {
        score: '54/46.4',
        notes: 'half book, eng→kpv/kgv→eng',
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MTOBFull: {
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
      "Llama 4 Behemoth is a 288 billion active parameter model with 16 experts, making it Meta's most powerful model and among the world's smartest LLMs. It outperforms GPT-4.5, Claude Sonnet 3.7, and Gemini 2.0 Pro on several STEM benchmarks. Behemoth serves as a teacher model for distilling knowledge to the smaller Llama 4 models. As of April 2025, it is still training and not yet publicly available.",
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
      MATH500: {
        score: 95,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MMLUPro: {
        score: 82.2,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      GPQADiamond: {
        score: 73.7,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      GlobalMMLU: {
        score: 85.8,
        notes: null,
        source: 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/',
      },
      MMMU: {
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
      MMLUPro: {
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
      MMLUPro: {
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
      MMLUPro: {
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
      HumanitysLastExam: {
        score: 14.28,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      CharXivReasoning: {
        score: 72,
        notes: 'Scientific Figure Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      SWEBench: {
        score: 68.1,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
    },
  },
  {
    model_name: 'o3-pro',
    slug: 'o3-pro-2025-06-10',
    provider: 'openai',
    description:
      'OpenAI o3-pro is a premium variant of the o3 model, designed to provide deeper and more reliable reasoning on complex tasks. Released in June 2025, o3-pro uses additional compute to “think harder,” making it ideal for challenging problems in research, software engineering, mathematics, and agentic reasoning. It supports all major developer tools including function calling, structured outputs, developer messages, and image inputs. o3-pro is served through the Responses API and supports background mode for long-running tasks.',
    input_context_window: '200K',
    maximum_output_tokens: '100K',
    open_source: false,
    release_date: '2025-06-10',
    knowledge_cut_off_date: 'May 31, 2024',
    api_providers: 'OpenAI Responses API',
    input_cost_per_million_tokens: 20,
    output_cost_per_million_tokens: 80,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      AIME2025: {
        score: 91.9,
        notes: 'Deep reasoning, no tools',
        source: 'https://openai.com/index/introducing-o3-pro/',
      },
      SWEBench: {
        score: 74.9,
        notes: 'Verified (higher compute)',
        source: 'https://openai.com/index/introducing-o3-pro/',
      },
      GPQA: {
        score: 87.0,
        notes: 'Diamond, improved chain-of-thought',
        source: 'https://openai.com/index/introducing-o3-pro/',
      },
      MathVista: {
        score: 89.2,
        notes: 'Vision + Math integration',
        source: 'https://openai.com/index/introducing-o3-pro/',
      },
      HumanitysLastExam: {
        score: 23.4,
        notes: 'Improved long-form reasoning',
        source: 'https://openai.com/index/introducing-o3-pro/',
      },
      ScaleMultichallenge: {
        score: 60.2,
        notes: 'Long multi-step tasks',
        source: 'https://openai.com/index/introducing-o3-pro/',
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
    input_cost_per_million_tokens: 2,
    output_cost_per_million_tokens: 8,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      AIME2024: {
        score: 91.6,
        notes: 'no tools, Competition Math',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      AIME2025: {
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
      CharXivReasoning: {
        score: 75.4,
        notes: 'Scientific Figure Reasoning',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      GPQA: {
        score: 83.3,
        notes: 'Diamond, no tools',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      HumanitysLastExam: {
        score: 20.32,
        notes: 'no tools',
        source: 'https://platform.openai.com/docs/models/o4-mini',
      },
      SWEBench: {
        score: 69.1,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-o3-and-o4-mini/',
      },
      ScaleMultichallenge: {
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
    model_name: 'o1-pro',
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
    slug: 'o1-preview',
    redirect_to: 'o1',
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
      GlobalMMLU: {
        score: 87.3,
        notes: 'pass@1',
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MMLUPro: null,
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
      SWEBench: {
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
      GlobalMMLU: {
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
      SWEBench: {
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
      GlobalMMLU: {
        score: 66.9,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
      MMLUPro: null,
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
      video: false,
    },
    benchmarks: {
      MMMLU: {
        score: 85.1,
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
      MMMU: {
        score: 74.4,
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
      GPQA: {
        score: 71.4,
        notes: 'science',
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
      AIME2024: {
        score: 36.7,
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
      SimpleQA: {
        score: 62.5,
        notes: null,
        source: 'https://openai.com/gpt-4.5-benchmarks',
      },
      SWELancerIC: {
        score: 32.6,
        notes: 'Diamond',
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
      SWEBench: {
        score: 38.0,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-gpt-4-5/',
      },
    },
  },
  {
    model_name: 'GPT-OSS',
    slug: 'gpt-oss',
    provider: 'openai',
    description:
      'GPT‑OSS is OpenAI’s first open-weight release since GPT‑2, featuring two models: GPT‑OSS‑20B and GPT‑OSS‑120B. The larger model is a 117B-parameter mixture-of-experts (MoE) architecture that activates only 5.1B parameters per token, making it efficient to run locally on a single high-end GPU. With a 128K token context window and strong performance in reasoning, math, coding, and health domains, GPT‑OSS rivals o4-mini in benchmarks and supports controllable chain-of-thought reasoning with open access under the Apache 2.0 license.',
    input_context_window: '128K',
    maximum_output_tokens: '65K',
    open_source: true,
    release_date: '2025-08-05',
    knowledge_cut_off_date: 'April 2024',
    api_providers: 'Self-hosted, Hugging Face, AWS, Azure, Databricks',
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
        score: 82.7,
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
      GPQA: {
        score: 80.1,
        notes: 'Diamond',
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
      HealthBench: {
        score: 83.0,
        notes: null,
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
      SimpleQA: {
        score: 66.2,
        notes: null,
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
      AIME2024: {
        score: 69.0,
        notes: null,
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
      LiveCodeBench: {
        score: 42.7,
        notes: 'v5',
        source: 'https://openai.com/index/gpt-oss-model-card/',
      },
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
      MMLUPro: {
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
    model_name: 'GPT-5 Pro',
    slug: 'gpt-5-pro',
    provider: 'openai',
    description:
      'GPT-5 Pro is the extended-reasoning variant of GPT-5. It uses scaled, efficient test-time compute to deliver the highest accuracy and most comprehensive answers across difficult, economically valuable tasks. External experts preferred GPT-5 Pro over GPT-5 Thinking on complex prompts, with fewer major errors.',
    input_context_window: null,
    maximum_output_tokens: null,
    open_source: false,
    release_date: '2025-08-07',
    knowledge_cut_off_date: null,
    api_providers: 'ChatGPT (Pro tier); GPT-5 Pro replaces o3-pro',
    input_cost_per_million_tokens: null,
    output_cost_per_million_tokens: null,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: false,
    },
    benchmarks: {
      SWEBench: {
        score: 74.9,
        notes:
          'Real-world coding benchmark; reported for GPT-5 family. Pro shares the coding stack and focuses on deeper reasoning.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      AiderPolyglot: {
        score: 88.0,
        notes: 'Code editing/refactoring benchmark; reported for GPT-5 family.',
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },
      MMMU: {
        score: 84.2,
        notes:
          'Multimodal understanding across image+text tasks; reported for GPT-5 family.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HealthBenchHard: {
        score: 46.2,
        notes:
          'Difficult subset of health reasoning tasks; reported for GPT-5 family.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      AIME2025: {
        score: 94.6,
        notes: 'Math benchmark; reported for GPT-5 family without tool use.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GPQA: {
        score: 88.4,
        notes:
          'State-of-the-art result explicitly attributed to GPT-5 Pro with extended reasoning.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      ExpertPreference: {
        score: null,
        notes:
          'External experts preferred GPT-5 Pro over “GPT-5 Thinking” 67.8% of the time; GPT-5 Pro made 22% fewer major errors across health, science, math, and coding.',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
    },
  },
  {
    model_name: 'GPT-5 Codex',
    slug: 'gpt-5-codex',
    provider: 'openai',
    description:
      'GPT-5 Codex is OpenAI’s GPT-5 variant optimized for agentic software engineering inside Codex. It excels at building full projects, refactoring large codebases, debugging, and code review. It supports images/screenshots for frontend work and runs in the Codex CLI, IDE extension, and cloud. Available in Codex surfaces and the OpenAI API (Responses API).',
    input_context_window: '400K',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-09-15',
    knowledge_cut_off_date: 'September 30, 2024',
    api_providers: 'OpenAI API (Responses), ChatGPT Codex (CLI, IDE, Cloud)',
    input_cost_per_million_tokens: 1.25,
    output_cost_per_million_tokens: 10.0,
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      // Intelligence
      AIME2025: {
        score: 94.6,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      FrontierMath: {
        score: 26.3,
        notes: 'with python tool only',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GPQA: {
        score: 85.7,
        notes: 'diamond, no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HumanitysLastExam: {
        score: 24.8,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HMMT2025: {
        score: 93.3,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Multimodal
      MMMU: {
        score: 84.2,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      MMMUPro: {
        score: 78.4,
        notes: 'avg across standard and vision sets',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      CharXivReasoning: {
        score: 81.1,
        notes: 'python enabled',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMMMU: {
        score: 84.6,
        notes: 'max frame 256',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      ERQA: {
        score: 65.7,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Coding
      SWELancerIC: {
        score: 112000,
        notes: 'SWE-Lancer: IC SWE Diamond Freelance Coding Tasks, $112K',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      SWEBench: {
        score: 74.5,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },
      AiderPolyglot: {
        score: 88.0,
        notes: 'diff',
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },

      // Instruction Following
      ScaleMultichallenge: {
        score: 69.6,
        notes: 'o3-mini grader',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      InternalAPIInstructionFollowing: {
        score: 64.0,
        notes: 'hard',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      COLLIE: {
        score: 99.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Function Calling
      Tau2BenchAirline: {
        score: 62.6,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      Tau2BenchRetail: {
        score: 81.1,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      Tau2BenchTelecom: {
        score: 96.7,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Long Context
      OpenAIMRCR2Needle128k: {
        score: 95.2,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      OpenAIMRCR2Needle256k: {
        score: 86.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksBFS128k: {
        score: 78.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksParents128k: {
        score: 73.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      BrowseCompLongContext128k: {
        score: 90.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      BrowseCompLongContext256k: {
        score: 88.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMME: {
        score: 86.7,
        notes: 'long, with subtitle category',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      MMMLU: {
        score: 89.4,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      FinanceAgent: {
        score: 46.9,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
    },
  },
  {
    model_name: 'GPT‑5.1',
    slug: 'gpt-5-1',
    provider: 'openai',
    description:
      'GPT‑5.1 is OpenAI’s adaptive flagship launched on November 13, 2025. It builds on GPT‑5 with dynamic reasoning effort (including the new default “no reasoning” mode), extended 24-hour prompt caching, upgraded coding personality, and native apply_patch and shell tools. GPT‑5.1 handles complex agentic and coding workloads while delivering faster responses on everyday tasks, and supports multimodal image input plus generation for product mockups and visual handoffs.',
    input_context_window: '400K',
    maximum_output_tokens: '128K',
    input_cost_per_million_tokens: 1.25,
    output_cost_per_million_tokens: 10,
    open_source: false,
    release_date: '2025-11-13',
    knowledge_cut_off_date: 'Fall 2024, July 2025 (mini/nano)',
    api_providers:
      'OpenAI API (Responses & Chat Completions), ChatGPT (Instant & Thinking), Codex (CLI & IDE)',
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      // Intelligence
      AIME2025: {
        score: 94.0,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      FrontierMath: {
        score: 26.7,
        notes: 'with python tool only',
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      GPQA: {
        score: 88.1,
        notes: 'diamond, no tools',
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      HumanitysLastExam: {
        score: 24.8,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HMMT2025: {
        score: 93.3,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Multimodal
      MMMU: {
        score: 85.4,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      MMMUPro: {
        score: 78.4,
        notes: 'avg across standard and vision sets',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      CharXivReasoning: {
        score: 81.1,
        notes: 'python enabled',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMMMU: {
        score: 84.6,
        notes: 'max frame 256',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      ERQA: {
        score: 65.7,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Coding
      SWELancerIC: {
        score: 112000,
        notes: 'SWE-Lancer: IC SWE Diamond Freelance Coding Tasks, $112K',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      SWEBench: {
        score: 76.3,
        notes: 'Verified',
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      AiderPolyglot: {
        score: 88.0,
        notes: 'diff',
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },

      // Instruction Following
      ScaleMultichallenge: {
        score: 69.6,
        notes: 'o3-mini grader',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      InternalAPIInstructionFollowing: {
        score: 64.0,
        notes: 'hard',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      COLLIE: {
        score: 99.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Function Calling
      Tau2BenchAirline: {
        score: 67.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      Tau2BenchRetail: {
        score: 77.9,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      Tau2BenchTelecom: {
        score: 95.6,
        notes: 'with helper system prompt',
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },

      // Long Context
      OpenAIMRCR2Needle128k: {
        score: 95.2,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      OpenAIMRCR2Needle256k: {
        score: 86.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksBFS128k: {
        score: 78.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksParents128k: {
        score: 73.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      BrowseCompLongContext128k: {
        score: 90.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-1-for-developers/',
      },
      BrowseCompLongContext256k: {
        score: 88.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMME: {
        score: 86.7,
        notes: 'long, with subtitle category',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
    },
  },
  {
    model_name: 'GPT‑5',
    slug: 'gpt-5',
    provider: 'openai',
    description:
      'GPT‑5 is OpenAI’s most advanced and versatile model to date, launched on August 7, 2025. It manages reasoning, creative writing, coding, health queries, and visual comprehension within a unified system. Equipped with intelligent routing and adjustable reasoning effort and verbosity, GPT‑5 delivers expert-level responses with reduced hallucinations and enhanced chain‑of‑thought transparency.',
    input_context_window: '400K',
    maximum_output_tokens: '128K',
    input_cost_per_million_tokens: 1.25,
    output_cost_per_million_tokens: 10,
    open_source: false,
    release_date: '2025-08-07',
    knowledge_cut_off_date: 'Fall 2024, July 2025 (mini/nano)',
    api_providers: 'OpenAI API, ChatGPT (Free, Plus, Pro, Enterprise)',
    modalities: {
      text: true,
      image: true,
      voice: false,
      video: false,
    },
    benchmarks: {
      // Intelligence
      AIME2025: {
        score: 94.6,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      FrontierMath: {
        score: 26.3,
        notes: 'with python tool only',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GPQA: {
        score: 85.7,
        notes: 'diamond, no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HumanitysLastExam: {
        score: 24.8,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      HMMT2025: {
        score: 93.3,
        notes: 'no tools',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Multimodal
      MMMU: {
        score: 84.2,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      MMMUPro: {
        score: 78.4,
        notes: 'avg across standard and vision sets',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      CharXivReasoning: {
        score: 81.1,
        notes: 'python enabled',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMMMU: {
        score: 84.6,
        notes: 'max frame 256',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      ERQA: {
        score: 65.7,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Coding
      SWELancerIC: {
        score: 112000,
        notes: 'SWE-Lancer: IC SWE Diamond Freelance Coding Tasks, $112K',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      SWEBench: {
        score: 74.9,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },
      AiderPolyglot: {
        score: 88.0,
        notes: 'diff',
        source: 'https://openai.com/index/introducing-gpt-5-for-developers/',
      },

      // Instruction Following
      ScaleMultichallenge: {
        score: 69.6,
        notes: 'o3-mini grader',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      InternalAPIInstructionFollowing: {
        score: 64.0,
        notes: 'hard',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      COLLIE: {
        score: 99.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Function Calling
      Tau2BenchAirline: {
        score: 62.6,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      Tau2BenchRetail: {
        score: 81.1,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      Tau2BenchTelecom: {
        score: 96.7,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },

      // Long Context
      OpenAIMRCR2Needle128k: {
        score: 95.2,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      OpenAIMRCR2Needle256k: {
        score: 86.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksBFS128k: {
        score: 78.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      GraphwalksParents128k: {
        score: 73.3,
        notes: '<128k',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      BrowseCompLongContext128k: {
        score: 90.0,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      BrowseCompLongContext256k: {
        score: 88.8,
        notes: null,
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      VideoMME: {
        score: 86.7,
        notes: 'long, with subtitle category',
        source: 'https://openai.com/index/introducing-gpt-5/',
      },
      MMMLU: {
        score: 89.4,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
      },
      FinanceAgent: {
        score: 46.9,
        source: 'https://www.anthropic.com/news/claude-sonnet-4-5',
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
      MMLUPro: {
        score: 74.68,
        notes: null,
        source: 'https://huggingface.co/spaces/TIGER-Lab/MMLU-Pro',
      },
      GlobalMMLU: {
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
        source: 'https://openai.com/index/gpt-4-1/',
      },
      GPQA: {
        score: 46,
        notes: 'Diamond',
        source:
          'https://openai.com/index/openai-o1-mini-advancing-cost-efficient-reasoning/',
      },
      SWEBench: {
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
      IFEval: {
        score: 81,
        notes: null,
        source: 'https://openai.com/index/gpt-4-1/',
      },
    },
  },
  {
    slug: 'gpt-4o-2024-11-20',
    redirect_to: 'gpt-4o',
  },
  {
    slug: 'gpt-4o-2024-08-06',
    redirect_to: 'gpt-4o',
  },
  {
    slug: 'gpt-4o-2024-05-13',
    redirect_to: 'gpt-4o',
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
      MMLUPro: {
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
    slug: 'gpt-4-turbo-2024-04-09',
    redirect_to: 'gpt-4-turbo',
  },
  {
    slug: 'gpt-4-0125-preview',
    redirect_to: 'gpt-4-turbo',
  },
  {
    slug: 'gpt-4-1106-preview',
    redirect_to: 'gpt-4-turbo',
  },
  {
    slug: 'gpt-4-32k-0613',
    redirect_to: 'gpt-4-32k',
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
    slug: 'gpt-4-0613',
    redirect_to: 'gpt-4',
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
    slug: 'gpt-4-0314',
    redirect_to: 'gpt-4',
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
    slug: 'gpt-3-5-turbo-0125',
    redirect_to: 'gpt-3-5-turbo',
  },
  {
    slug: 'gpt-3-5-turbo-1106',
    redirect_to: 'gpt-3-5-turbo',
  },
  {
    slug: 'gpt-3-5-turbo-16k',
    redirect_to: 'gpt-3-5-turbo',
  },
  {
    model_name: 'Grok 4',
    slug: 'grok-4',
    provider: 'xai',
    description:
      'Grok 4 is xAI’s most advanced foundation model, trained on their Colossus supercomputer with ~200,000 GPUs and 10x more compute than Grok 3. It supports multimodal reasoning across text, image, and video, and features advanced agentic capabilities via tool use (Python, internet search). The Grok 4 and Grok 4 Heavy models power xAI’s chatbot on X and lead benchmarks like Humanity’s Last Exam and ARC-AGI.',
    input_context_window: '1M (App), 256K (API)',
    maximum_output_tokens: '128K',
    open_source: false,
    release_date: '2025-07-09',
    knowledge_cut_off_date: 'June 2025',
    api_providers: 'xAI',
    input_cost_per_million_tokens: 3.0,
    output_cost_per_million_tokens: 15.0,
    modalities: {
      text: true,
      image: true,
      voice: true,
      video: true,
    },
    benchmarks: {
      HumanitysLastExam: {
        score: 44.4,
        notes: 'Grok 4 with tools',
        source: 'https://x.ai/news/grok-4',
      },
      ARC_AGI_V2: {
        score: 15.9,
        notes: 'ARC-AGI v2, text-only benchmark',
        source: 'https://x.ai/news/grok-4',
      },
      USAMO2025: {
        score: 61.9,
        notes: 'Mapped from USAMO (U.S. Math Olympiad 2025)',
        source: 'https://x.ai/news/grok-4',
      },
      VendingBench: {
        score: null,
        notes: '$4,694 profit over 5 episodes; ranked #1 in tool-use benchmark',
        source: 'https://x.ai/news/grok-4',
      },
    },
  },
  {
    model_name: 'Grok 3',
    slug: 'grok-3',
    provider: 'xai',
    description:
      "Grok 3 is xAI's most advanced model, trained on their Colossus supercluster with 10x the compute of previous state-of-the-art models. It features a 1M token context window and advanced reasoning capabilities refined through large-scale reinforcement learning, allowing it to think for seconds to minutes while solving complex problems. The model demonstrates leading performance across academic benchmarks and real-world user preferences, with an Elo score of 1402 in the Chatbot Arena. Released with a companion Grok 3 mini model optimized for cost-efficient reasoning.",
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
      MMLUPro: {
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
      AIME2025: {
        score: 93.3,
        notes: 'With Think mode, cons@64',
        source: 'https://x.ai/blog/grok-3',
      },
      LiveCodeBench: {
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
      MMLUPro: {
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
      MMLUPro: {
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
      MMLUPro: {
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
