export const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'annually', label: 'Annual', priceSuffix: '/year' },
]

export const currencies = {
  USD: { label: 'USD', symbol: '$' },
  JPY: { label: 'JPY', symbol: '¥' },
  EUR: { label: 'EUR', symbol: '€' },
  GBP: { label: 'GBP', symbol: '£' },
  AUD: { label: 'AUD', symbol: '$' },
}

export const pricingTiers = [
  {
    name: 'Hobby',
    id: 'hobby',
    href: '/register',
    price: {
      USD: { monthly: 19, annually: 192 },
      JPY: { monthly: 3000, annually: 30000 },
      AUD: { monthly: 32, annually: 324 },
      EUR: { monthly: 19, annually: 192 },
      GBP: { monthly: 17, annually: 168 },
    },
    description: 'Create your own basic DocsBot for quick answers from your docs.',
    features: [
      '1 DocsBot',
      '1k Source Pages',
      'Unlock paid source types',
      '1k messages/mo',
      'Prompt customization',
      'Private bots',
      'GPT-4o/4.1 support',
      'Premium embedding models',
      'Research mode',
      '1 user',
    ],
    mostPopular: false,
  },
  {
    name: 'Power',
    id: 'power',
    href: '/register',
    price: {
      USD: {
        monthly: 49,
        annually: 492,
      },
      JPY: {
        monthly: 7500,
        annually: 75000,
      },
      AUD: {
        monthly: 82,
        annually: 828,
      },
      EUR: {
        monthly: 49,
        annually: 492,
      },
      GBP: {
        monthly: 42,
        annually: 420,
      },
    },
    description: 'For power users and small businesses just getting started.',
    features: [
      '3 DocsBots',
      '5k Source Pages',
      'Unlock cloud source types',
      'Monthly source refresh',
      '5k messages/mo',
      'Basic Analytics',
      'Zapier integration',
      'Help Scout integration',
      'Slack integration',
      'Chat history',
      'Chat with images',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'pro',
    href: '/register',
    price: {
      USD: {
        monthly: 99,
        annually: 996,
      },
      JPY: {
        monthly: 15000,
        annually: 150000,
      },
      AUD: {
        monthly: 162,
        annually: 1620,
      },
      EUR: {
        monthly: 98,
        annually: 984,
      },
      GBP: {
        monthly: 85,
        annually: 852,
      },
    },
    description: 'For small businesses who want to save time and money on support.',
    features: [
      '10 DocsBots',
      '10k Source Pages',
      'Unlock ticket source types',
      'Weekly source refresh',
      '10k messages/mo',
      '5 team users',
      'Advanced Analytics',
      'Unbranded chat widgets',
      'Glossary',
      'Conversation summaries & insights',
      'Escalation ticket creation',
      'Train from images in HTML/Markdown',
    ],
    mostPopular: true,
  },
  {
    name: 'Business',
    id: 'business',
    href: '/register',
    price: {
      USD: {
        monthly: 499,
        annually: 4992,
      },
      JPY: {
        monthly: 76000,
        annually: 760000,
      },
      AUD: {
        monthly: 818,
        annually: 8184,
      },
      EUR: {
        monthly: 492,
        annually: 4992,
      },
      GBP: {
        monthly: 425,
        annually: 4260,
      },
    },
    description: 'Advanced reporting to improve your products, docs, and support.',
    features: [
      '100 DocsBots',
      '100k Source Pages',
      '100k messages/mo',
      '15 team users',
      'Conversation topic reports',
      'Conversation sentiment analysis',
      'AI question reports',
      'Priority support',
      'Rate limiting',
    ],
    mostPopular: false,
  },
]

export const enterpriseFeatures = [
  'Custom Bot, Source, Question limits',
  'Custom Team size (seats)',
  'Azure OpenAI Service',
  'Self-hosted options',
  'IP logging',
  'SSO options',
  'Priority support & SLAs',
  'Custom feature development',
  'Custom invoices and Purchase Orders',
  'ACH & Wire transfer payment methods',
]
