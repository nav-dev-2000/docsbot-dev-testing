/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    newNextLinkBehavior: true,
    scrollRestoration: true,
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
        hostname: '**.wpmudev.host',
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
    ]
  },
}

module.exports = nextConfig
