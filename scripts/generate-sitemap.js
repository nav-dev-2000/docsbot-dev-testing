const fs = require('fs')
const globby = require('globby')
const { ALTERNATIVES } = require('../src/constants/alternatives.constants');
const { INDUSTRIES } = require('../src/constants/industries.constants');

function addPage(page) {
  //remove exstension
  const path = page
    .replace(/\.[^/.]+$/, '')
    .replace('src/pages', '')
    .replace('/index', '')

  return `  <url>
    <loc>${`https://docsbot.ai${path}`}</loc>
    <changefreq>daily</changefreq>
  </url>`
}

async function generateSitemap() {
  // Ignore Next.js specific files (e.g., _app.js) and specific directories/files
  const pages = await globby([
    'src/pages/**/*{.js,.jsx,.mdx,.md}',
    '!src/pages/_*{.jsx,.js}',
    '!src/pages/**/[*{.jsx,.js}',
    '!src/pages/api/**/*',
    '!src/pages/app/**/*',
    '!src/pages/ask/**/*',
    '!src/pages/chat/**/*',
    '!src/pages/iframe/**/*',
    '!src/pages/404.{js,jsx,mdx,md}',
    '!src/pages/register.{js,jsx,mdx,md}',
  ])

  const comparisons = ALTERNATIVES.map((item) => ({
    href: `/comparisons/${item.slug}-alternative`,
  }))

  comparisons.forEach((comparison) => {
    pages.push(comparison.href)
  })

  const industries = INDUSTRIES.map((item) => ({
    href: `/industry/${item.slug}`,
  }))
  industries.forEach((industry) => {
    pages.push(industry.href)
  })

  const sitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(addPage).join('\n')}
</urlset>`

  fs.writeFileSync('public/sitemap-next.xml', sitemap)

  const axios = require('axios')

  // Fetch the external sitemap and merge it with the existing sitemap
  const response = await axios.get('https://blog.docsbot.ai/sitemap_index.xml')
  let externalSitemap = response.data
  externalSitemap = externalSitemap
    .replace(
      '//blog.docsbot.ai/wp-content/plugins/wordpress-seo/css/main-sitemap.xsl',
      '/main-sitemap.xsl'
    )
    .replace(
      '</sitemapindex>',
      `\t<sitemap>
\t\t<loc>https://docsbot.ai/sitemap-next.xml</loc>
\t\t<lastmod>${new Date().toISOString()}</lastmod>
\t</sitemap>
</sitemapindex>`
    )

  fs.writeFileSync('public/sitemap.xml', externalSitemap)
}

generateSitemap()
