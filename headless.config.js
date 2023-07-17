/**
 * Headless Config
 *
 * @type {import('@headstartwp/core').HeadlessConfig}
 */
module.exports = {
  sourceUrl: process.env.NEXT_PUBLIC_HEADLESS_WP_URL,
  hostUrl: process.env.HOST_URL,
  useWordPressPlugin: true,
  debug: {
    requests: process.env?.ENABLE_REQUEST_DEBUG === 'true',
    redirects: process.env?.ENABLE_REDIRECT_DEBUG === 'true',
    /**
     * devMode logs additional stuff that can be helpful for debugging
     */
    devMode: process.env?.ENABLE_DEV_MODE === 'true',
  },
  integrations: {
    yoastSEO: {
      enable: true,
    },
  },
}
