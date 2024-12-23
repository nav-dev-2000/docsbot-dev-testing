const withMarkdoc = require('@markdoc/next.js')
const { withHeadlessConfig } = require('@headstartwp/next/config')
const headlessConfig = require('./headless.config')

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
    return [
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
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      require('./scripts/generate-sitemap')
      require('./scripts/latest-news')
    }

    return config
  },
}

module.exports = process.env.DISABLE_HEADLESS 
  ? withMarkdoc()(nextConfig)
  : withHeadlessConfig(withMarkdoc()(nextConfig), headlessConfig)
