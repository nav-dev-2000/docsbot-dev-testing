const withMarkdoc = require('@markdoc/next.js')
const { withHeadlessConfig } = require('@headstartwp/next/config')
const headlessConfig = require('./headless.config')
const { LLMS } = require('./src/constants/llms.constants')

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md'],
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    scrollRestoration: true,
    largePageDataBytes: 256 * 1000, // 256kb, the default is 128kb
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.cloud.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.docsbot.ai',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '**.tempurl.host',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  async redirects() {
    // Keep existing static redirects
    const existing = [
      {
        source: '/business',
        destination: '/#features',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/legal/privacy-policy',
        permanent: true,
      },
      {
        source: '/terms-of-service',
        destination: '/legal/terms-of-service',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/documentation/developer',
        permanent: true,
      },
      {
        source: '/docs/:slug*',
        destination: '/documentation/developer/:slug*',
        permanent: true,
      },
      {
        source: '/documentation/developer/integrations/zapier',
        destination: '/documentation/doc/zapier-integration',
        permanent: true,
      },
      {
        source: '/documentation/developer/helpscout',
        destination: '/documentation/doc/help-scout-integration',
        permanent: true,
      },
      {
        source: '/product-hunt',
        destination: 'https://www.producthunt.com/products/docsbot-ai',
        permanent: true,
      },
      {
        source: '/tools/ai-prompt-generator',
        destination: '/tools/prompt/ai-prompt-generator',
        permanent: true,
      },
      {
        source: '/tools/chatgpt-prompt-generator',
        destination: '/tools/prompt/chatgpt-prompt-generator',
        permanent: true,
      },
      {
        source: '/tools/claude-prompt-generator',
        destination: '/tools/prompt/claude-prompt-generator',
        permanent: true,
      },
      {
        source: '/tools/image-description-generator',
        destination: '/tools/image/description-generator',
        permanent: true,
      },
      {
        source: '/tools/image-caption-generator',
        destination: '/tools/image/caption-generator',
        permanent: true,
      },
      {
        source: '/tools/image-to-text-generator',
        destination: '/tools/image/text-extractor',
        permanent: true,
      },
      {
        source: '/tools/image-to-markdown-extractor',
        destination: '/tools/image/markdown-extractor',
        permanent: true,
      },
      {
        source: '/tools/image-to-faq-generator',
        destination: '/tools/image/faq-generator',
        permanent: true,
      },
      {
        source: '/tools/images',
        destination: '/tools/image',
        permanent: true,
      },
      {
        source: '/tools/customer-support',
        destination: '/tools/support',
        permanent: true,
      },
      {
        source: '/tools/ai-support-savings-calculator',
        destination: '/tools/support/ai-savings-calculator',
        permanent: true,
      },
      {
        source: '/tools/writing/pdf-summarizer',
        destination: '/tools/productivity/pdf-summarizer',
        permanent: true,
      },
      {
        source: '/tools/writing/pdf-to-text',
        destination: '/tools/productivity/pdf-to-text',
        permanent: true,
      },
      {
        source: '/article/gpt-5-release-date-features-what-to-expect-from-openais-next-model',
        destination: '/article/gpt-5-is-live-on-docsbot-better-answers-fewer-hallucinations-lower-costs',
        permanent: true,
      },
      {
        source: '/prompts/general/ai-answer-generator',
        destination: '/tools/productivity/ai-answer-generator',
        permanent: true,
      },
      {
        source: '/prompts/research/comprehensive-answer-generation-1',
        destination: '/tools/productivity/ai-answer-generator',
        permanent: true,
      },
      {
        source: '/prompts/education/answer-questions',
        destination: '/tools/productivity/ai-answer-generator',
        permanent: true,
      },
      {
        source: '/prompts/education/explanatory-answer-generator',
        destination: '/tools/productivity/ai-answer-generator',
        permanent: true,
      },
      {
        source: '/industry/customer-service-support',
        destination: '/customer-support',
        permanent: true,
      },
    ]

    // Build dynamic model redirects from LLMS
    const pairs = (LLMS || [])
      .filter((m) => m && m.redirect_to && m.slug && m.slug !== m.redirect_to)
      .map((m) => [m.slug, m.redirect_to])

    const modelRedirects = pairs.map(([from, to]) => ({
      source: `/models/${from}`,
      destination: `/models/${to}`,
      permanent: true,
    }))

    const compareRedirects = pairs.flatMap(([from, to]) => [
      {
        source: `/models/compare/${from}/:model2`,
        destination: `/models/compare/${to}/:model2`,
        permanent: true,
      },
      {
        source: `/models/compare/:model1/${from}`,
        destination: `/models/compare/:model1/${to}`,
        permanent: true,
      },
    ])

    const botDashboardRedirects = [
      {
        source: '/app/bots/:botId/questions',
        destination: '/app/bots/:botId/analytics/questions',
        permanent: true,
      },
      {
        source: '/app/bots/:botId/questions/:questionId',
        destination: '/app/bots/:botId/analytics/questions/:questionId',
        permanent: true,
      },
      {
        source: '/app/bots/:botId/conversations',
        destination: '/app/bots/:botId/analytics/conversations',
        permanent: true,
      },
      {
        source: '/app/bots/:botId/reports',
        destination: '/app/bots/:botId/analytics/reports',
        permanent: true,
      },
      {
        source: '/app/bots/:botId/reports/print',
        destination: '/app/bots/:botId/analytics/reports/print',
        permanent: true,
      },
      {
        source: '/app/bots/:botId/webhooks',
        destination: '/app/bots/:botId/configure/webhooks',
        permanent: true,
      },
    ]

    return [...existing, ...botDashboardRedirects, ...modelRedirects, ...compareRedirects]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      require('./scripts/generate-sitemap')
      require('./scripts/latest-news')
    }

    // Silence known dynamic require warning from @truto/truto-link-sdk client bundle
    // The SDK ships dynamic requires that webpack flags but are safe in our client-only usage.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@truto\/truto-link-sdk/,
        message: /Critical dependency/,
      },
    ]

    return config
  },
}

module.exports = process.env.DISABLE_HEADLESS 
  ? withMarkdoc()(nextConfig)
  : withHeadlessConfig(withMarkdoc()(nextConfig), headlessConfig)
