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
  ZhipuLogo,
  MiniMaxLogo,
  MoonshotLogo,
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
  zhipu: {
    displayName: 'Zhipu AI (Z.ai)',
    url: 'https://z.ai',
    icon: ZhipuLogo,
  },
  minimax: {
    displayName: 'MiniMax',
    url: 'https://www.minimax.io',
    icon: MiniMaxLogo,
  },
  moonshot: {
    displayName: 'Moonshot AI',
    url: 'https://kimi.ai',
    icon: MoonshotLogo,
  },
}

export const BENCHMARKS = {
  AIDERPolyglot: {
    title: 'AiderPolyglot',
    description: 'Evaluates code generation capabilities across multiple programming languages using diff-based assessment',
  },
  AIME2024: {
    title: 'AIME 2024',
    description: 'American Invitational Mathematics Examination 2024 - Evaluates advanced mathematical problem-solving abilities',
  },
  AIME2025: {
    title: 'AIME 2025',
    description: 'American Invitational Mathematics Examination 2025 - Tests cutting-edge mathematical reasoning capabilities',
  },
  AIME2025WithTools: {
    title: 'AIME 2025 (with tools)',
    description: 'American Invitational Mathematics Examination 2025 with code execution tools - Evaluates mathematical reasoning with computational assistance',
  },
  AIME2026: {
    title: 'AIME 2026',
    description: 'American Invitational Mathematics Examination 2026 - Evaluates advanced mathematical problem-solving abilities (contest-level math)',
  },
  APEXAgents: {
    title: 'APEX Agents',
    description: 'Evaluates long-horizon professional agent tasks with real-world objectives and constraints',
  },
  ARCAGI2: {
    title: 'ARC-AGI-2',
    description: 'Visual reasoning puzzles benchmark, ARC Prize Verified, testing abstract reasoning and visual problem-solving',
  },
  ARCAGI1: {
    title: 'ARC-AGI-1',
    description:
      'Abstract reasoning benchmark (ARC Prize Verified) evaluating core pattern recognition and problem-solving on ARC-AGI-1 tasks',
  },
  ARC_AGI_V2: {
    title: 'ARC-AGI-2',
    description: 'Visual reasoning puzzles benchmark (alternate key for ARCAGI2)',
  },
  BirdSQL: {
    title: 'Bird-SQL',
    description: 'Evaluates SQL query generation and database interaction capabilities',
  },
  BirdSQLDev: {
    title: 'Bird-SQL (Dev)',
    description: 'Evaluates SQL query generation and database interaction capabilities',
  },
  BigLawBench: {
    title: 'BigLaw Bench',
    description: 'Evaluates legal reasoning and document analysis on large law firm tasks',
  },
  BrowseComp: {
    title: 'BrowseComp',
    description: 'Evaluates browsing and web comprehension capabilities',
  },
  CursorBench: {
    title: 'CursorBench',
    description: 'Evaluates real-world software engineering and code editing performance on repository tasks',
  },
  BrowseCompWithContext: {
    title: 'BrowseComp (with context management)',
    description: 'BrowseComp variant evaluated with context management strategies for longer multi-turn browsing tasks',
  },
  BrowseCompLongContext128k: {
    title: 'BrowseComp Long Context (128k)',
    description: 'Evaluates long context browsing and comprehension capabilities at 128k context length',
  },
  BrowseCompLongContext256k: {
    title: 'BrowseComp Long Context (256k)',
    description: 'Evaluates long context browsing and comprehension capabilities at 256k context length',
  },
  ChartQA: {
    title: 'ChartQA',
    description: 'Chart Visual Question Answering - Evaluates the ability of AI models to comprehend and answer questions based on chart images',
  },
  CharXivReasoning: {
    title: 'CharXiv Reasoning',
    description: 'Evaluates information synthesis from complex charts and scientific visualizations',
  },
  CybersecurityCTF: {
    title: 'Cybersecurity CTF',
    description: 'Evaluates cybersecurity skills on Capture The Flag challenges',
  },
  CyberGym: {
    title: 'CyberGym',
    description: 'Agentic cybersecurity benchmark measuring practical exploit/defense tasks in sandboxed environments',
  },
  COLLIE: {
    title: 'COLLIE',
    description: 'Evaluates instruction following and task completion capabilities',
  },
  CoVoST2_21lang: {
    title: 'CoVoST2 (21 languages)',
    description: 'Evaluates speech translation capabilities across 21 languages',
  },
  DocVQA: {
    title: 'DocVQA',
    description: 'Document Visual Question Answering - Evaluates the ability of AI models to comprehend and answer questions based on document images',
  },
  DROP: {
    title: 'DROP',
    description: 'Discrete Reasoning Over Paragraphs - reading comprehension benchmark',
  },
  EgoSchemaTest: {
    title: 'EgoSchema (test)',
    description: 'Evaluates video understanding and temporal reasoning capabilities',
  },
  ERQA: {
    title: 'ERQA',
    description: 'Evaluates visual question answering capabilities',
  },
  ARC: {
    title: 'ARC',
    description: 'AI2 Reasoning Challenge - science question answering',
  },
  ExpertPreference: {
    title: 'Expert Preference',
    description: 'Evaluates expert preferences for model outputs on real-world reasoning prompts',
  },
  FACTSBenchmarkSuite: {
    title: 'FACTS Benchmark Suite',
    description: 'Evaluates held-out internal grounding, parametric knowledge, multimodal understanding, and search retrieval capabilities',
  },
  FACTSGrounding: {
    title: 'FACTS Grounding',
    description: 'Evaluates grounding capabilities for held-out internal benchmarks',
  },
  FinanceAgent: {
    title: 'Finance Agent',
    description: 'Evaluates agents on core financial analyst tasks, measuring their ability to interpret and analyze financial data',
  },
  CodingResolution: {
    title: 'Coding Resolution',
    description: 'Tracks production coding task resolution rates on long-horizon software engineering workloads',
  },
  FrontierMath: {
    title: 'FrontierMath',
    description: 'Evaluates advanced mathematical reasoning with Python tool assistance',
  },
  FrontierMathTier1_3: {
    title: 'FrontierMath (Tier 1–3)',
    description: 'Advanced mathematics benchmark covering FrontierMath Tier 1–3 tasks with Python assistance',
  },
  FrontierMathTier4: {
    title: 'FrontierMath (Tier 4)',
    description: 'Advanced mathematics benchmark covering FrontierMath Tier 4 tasks with Python assistance',
  },
  FrontierScienceResearch: {
    title: 'Frontier Science Research',
    description: 'Evaluates scientific research capabilities',
  },
  GlobalMMLU: {
    title: 'Global MMLU',
    description: 'A multilingual version of the MMLU benchmark that tests knowledge across multiple languages and cultures',
  },
  GlobalPIQA: {
    title: 'Global PIQA',
    description: 'Evaluates commonsense reasoning across 100 languages and cultures',
  },
  GPQA: {
    title: 'GPQA',
    description: 'Graduate-level Physics Questions Assessment - Tests advanced physics knowledge with Diamond Science level questions',
  },
  GPQADiamond: {
    title: 'GPQA Diamond',
    description: 'GPQA Diamond tier - graduate-level physics assessment',
  },
  GSM8K: {
    title: 'GSM8K',
    description: 'Grade School Math 8K - mathematical reasoning benchmark',
  },
  GDPvalWinsOrTies: {
    title: 'GDPval (wins or ties)',
    description: 'Economic knowledge work evaluation measuring win/tie rates versus industry professionals across 44 occupations',
  },
  GDPvalAA: {
    title: 'GDPval-AA',
    description: 'Economic knowledge work evaluation focused on accuracy-adjusted GDPval results',
    format: 'number',
  },
  GraphwalksBFS128k: {
    title: 'Graphwalks BFS (128k)',
    description: 'Evaluates long context graph traversal capabilities using breadth-first search at 128k context length',
  },
  GraphwalksParents128k: {
    title: 'Graphwalks Parents (128k)',
    description: 'Evaluates long context graph traversal capabilities using parent relationships at 128k context length',
  },
  GraphwalksBFS0K_128K: {
    title: 'Graphwalks BFS (0K–128K)',
    description: 'Long context graph traversal using breadth-first search, 0K–128K context range',
  },
  GraphwalksBFS256K_1M: {
    title: 'Graphwalks BFS (256K–1M)',
    description: 'Long context graph traversal using breadth-first search, 256K–1M context range',
  },
  GraphwalksParents0_128K: {
    title: 'Graphwalks Parents (0–128K)',
    description: 'Long context graph traversal using parent relationships, 0–128K context range',
  },
  GraphwalksParents256K_1M: {
    title: 'Graphwalks Parents (256K–1M)',
    description: 'Long context graph traversal using parent relationships, 256K–1M context range',
  },
  HellaSwag: {
    title: 'HellaSwag',
    description: 'A challenging sentence completion benchmark',
  },
  HealthBench: {
    title: 'HealthBench',
    description: 'Medical/health domain benchmark',
  },
  HealthBenchHard: {
    title: 'HealthBench Hard',
    description: 'HealthBench hard difficulty variant',
  },
  HiddenMath: {
    title: 'Hidden Math',
    description: 'Internal math reasoning benchmark',
  },
  HMMT2025: {
    title: 'HMMT 2025',
    description: 'Harvard-MIT Mathematics Tournament 2025 - Evaluates advanced mathematical problem-solving abilities',
  },
  HMMTNov2025: {
    title: 'HMMT Nov 2025',
    description: 'Harvard-MIT Mathematics Tournament November 2025 - Evaluates advanced mathematical problem-solving abilities',
  },
  HumanEval: {
    title: 'HumanEval',
    description: 'Evaluates code generation and problem-solving capabilities',
  },
  HumanitysLastExam: {
    title: "Humanity's Last Exam",
    description: 'A large-scale benchmark by xAI designed to evaluate deep reasoning and tool use across real-world tasks, simulating general intelligence under realistic constraints',
  },
  HumanitysLastExamWithTools: {
    title: "Humanity's Last Exam (with tools)",
    description: 'A challenging benchmark that tests models on complex reasoning tasks with search and code execution tools',
  },
  IFEval: {
    title: 'IFEval',
    description: "Tests model's ability to accurately follow explicit formatting instructions, generate appropriate outputs, and maintain consistent instruction adherence across different tasks",
  },
  InternalAPIInstructionFollowing: {
    title: 'Internal API Instruction Following',
    description: 'Evaluates hard instruction following tasks for API usage',
  },
  InvestmentBankingModelingTasks: {
    title: 'Investment Banking Modeling Tasks',
    description: 'Internal benchmark for junior investment banking analyst modeling tasks',
  },
  LMArena: {
    title: 'LM Arena',
    description: 'A benchmark that evaluates chat model performance through ELO ratings, where models compete against each other in head-to-head comparisons judged by users',
  },
  LiveCodeBench: {
    title: 'LiveCodeBench',
    description: 'A benchmark that continuously collects new coding problems from platforms like LeetCode, AtCoder, and CodeForces to evaluate LLMs on unseen problems, ensuring contamination-free assessment of their coding capabilities',
  },
  LiveCodeBenchPro: {
    title: 'LiveCodeBench Pro',
    description: 'A competitive coding benchmark featuring problems from Codeforces, ICPC, and IOI, evaluated using Elo ratings (higher is better)',
    format: 'number',
  },
  MATH: {
    title: 'MATH',
    description: 'Tests mathematical problem-solving abilities across various difficulty levels',
  },
  MATH500: {
    title: 'MATH 500',
    description: 'MATH benchmark with 500 problems',
  },
  MathArenaApex: {
    title: 'Math Arena Apex',
    description: 'A challenging benchmark featuring difficult math contest problems that test advanced mathematical reasoning',
  },
  MathVista: {
    title: 'MathVista',
    description: 'Evaluates the mathematical reasoning abilities of AI models within visual contexts',
  },
  MMMU: {
    title: 'MMMU',
    description: 'Massive Multitask Multimodal Understanding - Tests understanding across text, images, audio, and video',
  },
  MMMUPro: {
    title: 'MMMU Pro',
    description: 'A more advanced version of MMMU that evaluates multimodal understanding and reasoning across standard and vision sets',
  },
  MMMUProNoTools: {
    title: 'MMMU Pro (no tools)',
    description: 'MMMU Pro evaluated without tool use - visual understanding and reasoning',
  },
  MMMUProWithTools: {
    title: 'MMMU Pro (with tools)',
    description: 'MMMU Pro evaluated with tools - visual understanding and reasoning',
  },
  MMMUProWithPython: {
    title: 'MMMU Pro (with Python)',
    description: 'MMMU Pro evaluated with Python tool assistance',
  },
  MMMLU: {
    title: 'MMMLU',
    description: 'Multilingual MMLU variant',
  },
  MRCRv2_128k: {
    title: 'MRCR v2 (128k)',
    description: 'Long context performance benchmark at 128k context length, measuring average performance on needle-in-haystack tasks',
  },
  MRCRv2_1M: {
    title: 'MRCR v2 (1M)',
    description: 'Long context performance benchmark at 1M context length, measuring pointwise performance on needle-in-haystack tasks',
  },
  MMLU: {
    title: 'MMLU',
    description: 'Massive Multitask Language Understanding - Tests knowledge across 57 subjects including mathematics, history, law, and more',
  },
  MMLUPro: {
    title: 'MMLU Pro',
    description: 'A more robust MMLU benchmark with harder, reasoning-focused questions, a larger choice set, and reduced prompt sensitivity',
  },
  MTOB: {
    title: 'MTOB',
    description: "Machine Translation from One Book - Evaluates LLMs' ability to translate between English and low-resource languages (like Kalamang) using only half of a grammar book as reference",
  },
  MTOBFull: {
    title: 'MTOB (Full)',
    description: "Machine Translation from One Book (Full) - Evaluates LLMs' ability to translate between English and low-resource languages using a complete grammar book as the only reference material",
  },
  'MBPP+': {
    title: 'MBPP+',
    description: 'Mostly Basic Python Programming Plus - code generation benchmark',
  },
  MultiFileRefactoring: {
    title: 'Multi-file Refactoring',
    description: 'Evaluates ability to refactor code across multiple files with cleaner fixes',
  },
  OmniDocBench15: {
    title: 'OmniDocBench 1.5',
    description: 'OCR benchmark measuring overall edit distance (lower is better) - Evaluates optical character recognition accuracy',
    format: 'number',
  },
  OpenAIMRCR2Needle128k: {
    title: 'OpenAI MRCR2 Needle (128k)',
    description: 'Long context performance benchmark at 128k context length',
  },
  OpenAIMRCR2Needle1M: {
    title: 'OpenAI MRCR2 Needle (1M)',
    description: 'Long context performance benchmark at 1M context length',
  },
  OpenAIMRCR2Needle256k: {
    title: 'OpenAI MRCR2 Needle (256k)',
    description: 'Long context performance benchmark at 256k context length',
  },
  OpenAIMRCRv2Needle4K_8K: {
    title: 'OpenAI MRCR2 Needle (4K–8K)',
    description: 'Long context needle-in-haystack benchmark, 4K–8K range',
  },
  OpenAIMRCRv2Needle8K_16K: {
    title: 'OpenAI MRCR2 Needle (8K–16K)',
    description: 'Long context needle-in-haystack benchmark, 8K–16K range',
  },
  OpenAIMRCRv2Needle16K_32K: {
    title: 'OpenAI MRCR2 Needle (16K–32K)',
    description: 'Long context needle-in-haystack benchmark, 16K–32K range',
  },
  OpenAIMRCRv2Needle32K_64K: {
    title: 'OpenAI MRCR2 Needle (32K–64K)',
    description: 'Long context needle-in-haystack benchmark, 32K–64K range',
  },
  OpenAIMRCRv2Needle64K_128K: {
    title: 'OpenAI MRCR2 Needle (64K–128K)',
    description: 'Long context needle-in-haystack benchmark, 64K–128K range',
  },
  OpenAIMRCRv2Needle128K_256K: {
    title: 'OpenAI MRCR2 Needle (128K–256K)',
    description: 'Long context needle-in-haystack benchmark, 128K–256K range',
  },
  OpenAIMRCRv2Needle256K_512K: {
    title: 'OpenAI MRCR2 Needle (256K–512K)',
    description: 'Long context needle-in-haystack benchmark, 256K–512K range',
  },
  OpenAIMRCRv2Needle512K_1M: {
    title: 'OpenAI MRCR2 Needle (512K–1M)',
    description: 'Long context needle-in-haystack benchmark, 512K–1M range',
  },
  OSWorld: {
    title: 'OSWorld',
    description: 'Evaluates computer use and web navigation tasks in simulated OS environments',
  },
  OfficeQA: {
    title: 'Office QA',
    description: 'Evaluates office/productivity domain question answering',
  },
  OutputSpeedTokensPerSecond: {
    title: 'Output Speed (tokens/sec)',
    description: 'Token generation throughput',
    format: 'number',
  },
  NTREX: {
    title: 'NTREX',
    description: 'Neural Translation Benchmark',
  },
  RepoQA: {
    title: 'RepoQA',
    description: 'Repository-level code understanding benchmark',
  },
  ScaleMultichallenge: {
    title: 'Scale Multichallenge',
    description: 'Evaluates instruction following capabilities using o3-mini grader',
  },
  ScreenSpotPro: {
    title: 'ScreenSpot Pro',
    description: 'Evaluates screen understanding capabilities, testing models on their ability to interpret and reason about screen layouts and UI elements',
  },
  SciCode: {
    title: 'SciCode',
    description: 'Evaluates scientific research coding and tooling performance on research-oriented programming tasks',
  },
  SimpleQA: {
    title: 'SimpleQA',
    description: 'A benchmark that evaluates basic question-answering capabilities across common knowledge domains',
  },
  SWEBench: {
    title: 'SWE-Bench Verified',
    description: 'Evaluates software engineering capabilities through verified code modifications and custom agent setups',
  },
  SWEBenchRakuten: {
    title: 'SWE-Bench Rakuten',
    description: 'Production software engineering benchmark based on Rakuten task resolution outcomes',
  },
  SWEBenchPro: {
    title: 'SWE-Bench Pro',
    description: 'Evaluates software engineering on multi-language SWE-Bench Pro benchmark of real-world GitHub issues',
  },
  SWELancerIC: {
    title: 'SWE-Lancer IC',
    description: 'Evaluates freelance coding tasks on IC SWE Diamond level tasks, measured in monetary value ($112K)',
  },
  Tau2Bench: {
    title: 'Tau2Bench',
    description: 'Evaluates agentic tool use capabilities, testing models on their ability to effectively use tools in agentic scenarios',
  },
  Taubench: {
    title: 'Taubench',
    description: 'Tau benchmark variant',
  },
  Toolathon: {
    title: 'Toolathon',
    description: 'Assesses agentic tool-calling performance across multi-step tasks',
  },
  ToolDecathlon: {
    title: 'Tool-Decathlon',
    description: 'Agentic tool-use benchmark evaluating performance across a suite of diverse tool tasks',
  },
  BFCL: {
    title: 'BFCL',
    description: 'Berkeley Function Calling Leaderboard - function calling benchmark',
  },
  BFCLMultiTurn: {
    title: 'BFCL Multi-Turn',
    description: 'Berkeley Function Calling Leaderboard (BFCL) multi-turn tool-use benchmark',
  },
  MEWC: {
    title: 'MEWC',
    description: 'Multi-Expert Workflow Coordination benchmark measuring coordination across specialized tools/agents',
  },
  VIBEPro: {
    title: 'VIBE-Pro',
    description: 'Office/productivity agent benchmark focused on real-world work tasks',
  },
  VisualAcuityXBOW: {
    title: 'Visual Acuity (XBOW)',
    description: 'Evaluates high-resolution visual understanding and perception on the XBOW visual acuity benchmark',
  },
  MultiSWEBench: {
    title: 'Multi-SWE-Bench',
    description: 'Multi-language SWE-Bench-style benchmark evaluating software engineering across multiple stacks',
  },
  SWEBenchMultilingual: {
    title: 'SWE-Bench Multilingual',
    description: 'Multilingual version of SWE-Bench evaluating software engineering performance across languages',
  },
  MCPAtlas: {
    title: 'MCP-Atlas',
    description: 'Tool-use benchmark focused on MCP (Model Context Protocol) tasks; typically reported on a public subset',
  },
  MCPUniverse: {
    title: 'MCP-Universe',
    description: 'Tool-use benchmark measuring success rate across MCP tool-use tasks/environments',
  },
  MCPMark: {
    title: 'MCP-Mark',
    description: 'Tool-use benchmark measuring pass@1 on MCP tasks',
  },
  BrowseCompZh: {
    title: 'BrowseComp Zh',
    description: 'Chinese BrowseComp variant measuring browsing + comprehension performance on Chinese tasks',
  },
  Codeforces: {
    title: 'Codeforces',
    description: 'Competitive programming benchmark reported as Codeforces rating (higher is better)',
    format: 'number',
  },
  IMOAnswerBench: {
    title: 'IMO Answer Bench',
    description: 'Olympiad-style math benchmark focused on solution/answer correctness',
  },
  Tau2BenchAirline: {
    title: 'Tau2Bench Airline',
    description: 'Evaluates function calling capabilities in airline domain scenarios',
  },
  Tau2BenchRetail: {
    title: 'Tau2Bench Retail',
    description: 'Evaluates function calling capabilities in retail domain scenarios',
  },
  Tau2BenchTelecom: {
    title: 'Tau2Bench Telecom',
    description: 'Evaluates function calling capabilities in telecom domain scenarios',
  },
  Tau2BenchTelecomNoReasoning: {
    title: 'Tau2Bench Telecom (no reasoning)',
    description: 'Tau2Bench Telecom evaluated without reasoning effort',
  },
  Translation_EN_to_14: {
    title: 'Translation EN to 14',
    description: 'English to 14-language translation benchmark',
  },
  Translation_14_to_EN: {
    title: 'Translation 14 to EN',
    description: '14-language to English translation benchmark',
  },
  USAMO2025: {
    title: 'USAMO 2025',
    description: 'USA Mathematical Olympiad 2025',
  },
  TerminalBench: {
    title: 'Terminal-Bench 2.0',
    description: 'Evaluates agentic terminal coding capabilities using the Terminus-2 agent framework',
  },
  VendingBench: {
    title: 'Vending-Bench',
    description: 'Long-horizon agentic tasks benchmark',
  },
  VendingBench2: {
    title: 'Vending-Bench 2',
    description: 'Long-horizon agentic tasks benchmark measuring net worth (mean), where higher scores indicate better performance',
    format: 'currency',
  },
  VideoMME: {
    title: 'VideoMME',
    description: 'Long-form video understanding benchmark with subtitle category evaluation',
  },
  VideoMMMU: {
    title: 'Video-MMMU',
    description: 'Evaluates knowledge acquisition from videos, testing multimodal understanding of video content',
  },
}

export const getProviderInfo = (providerName) => {
  const providerInfo = PROVIDER_INFO[providerName]
  
  if (!providerInfo) {
    throw new Error(
      `Provider "${providerName}" not found in PROVIDER_INFO. ` +
      `Available providers: ${Object.keys(PROVIDER_INFO).join(', ')}`
    )
  }
  
  return providerInfo
}

export const getBenchmarkTitle = (key) => {
  return BENCHMARKS[key]?.title || key
}

export const getBenchmarkDescription = (key) => {
  return BENCHMARKS[key]?.description || 'Description not available'
}

export const formatBenchmarkScore = (key, score) => {
  if (score == null) {
    return 'N/A'
  }

  const format = BENCHMARKS[key]?.format || 'percent'
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(score)
    case 'number':
      return score.toString()
    case 'percent':
    default:
      return `${score}%`
  }
}
