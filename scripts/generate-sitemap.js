const fs = require('fs')
const globby = require('globby')
const { ALTERNATIVES } = require('../src/constants/alternatives.constants');
const { INDUSTRIES } = require('../src/constants/industries.constants');
const { PROMPT_CATEGORIES } = require('../src/constants/promptCategories.constants');
const { GLOSSARY } = require('../src/constants/glossary.constants');
const { LLMS } = require('../src/constants/llms.constants');
function addPage(page, changefreq = 'daily') {
  //remove exstension
  const path = page
    .replace(/\.[^/.]+$/, '')
    .replace('src/pages', '')
    .replace('/index', '')

  return `  <url>
    <loc>${`https://docsbot.ai${path}`}</loc>
    <changefreq>${changefreq}</changefreq>
  </url>`
}

function generateSectionSitemap(urls, filename, changefreq = 'daily') {
  const sitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => addPage(url, changefreq)).join('\n')}
</urlset>`

  fs.writeFileSync(`public/${filename}`, sitemap)
  return filename
}

async function generateSitemap() {
  // Ignore Next.js specific files (e.g., _app.js) and specific directories/files
  const pages = await globby([
    'src/pages/**/*{.js,.jsx,.mdx,.md}',
    '!src/pages/_*{.jsx,.js}',
    '!src/pages/**/[*{.jsx,.js}',
    '!src/pages/prompts/[category]/**.jsx',
    '!src/pages/prompts/tags/index.jsx',
    '!src/pages/api/**/*',
    '!src/pages/app/**/*',
    '!src/pages/ask/**/*',
    '!src/pages/chat/**/*',
    '!src/pages/iframe/**/*',
    '!src/pages/404.{js,jsx,mdx,md}',
    '!src/pages/register.{js,jsx,mdx,md}',
  ])

  const comparisons = ALTERNATIVES.map((item) => `/comparisons/${item.slug}-alternative`)
  const industries = INDUSTRIES.map((item) => `/industry/${item.slug}`)
  const glossary = GLOSSARY.map((item) => `/ai-terms-glossary/term/${item.slug}`)
  const prompts = Object.entries(PROMPT_CATEGORIES).map(([key]) => `/prompts/${key}`)
  // Exclude redirected models from sitemap
  const liveModels = LLMS.filter((item) => !item.redirect_to)
  const models = liveModels.map((item) => `/models/${item.slug}`)
  const modelComparisons = liveModels.flatMap((model1) =>
    liveModels
      .filter((model2) => model2.slug !== model1.slug)
      .map((model2) => `/models/compare/${model1.slug}/${model2.slug}`)
  )

  // Generate individual sitemaps
  const sitemapFiles = [
    generateSectionSitemap(pages, 'sitemap-pages.xml'),
    generateSectionSitemap(comparisons, 'sitemap-comparisons.xml', 'weekly'),
    generateSectionSitemap(industries, 'sitemap-industries.xml', 'monthly'),
    generateSectionSitemap(glossary, 'sitemap-glossary.xml', 'weekly'),
    generateSectionSitemap(prompts, 'sitemap-prompts.xml'),
    generateSectionSitemap(models, 'sitemap-models.xml', 'weekly'),
    generateSectionSitemap(modelComparisons, 'sitemap-model-comparisons.xml', 'weekly'),
  ]

  // Create sitemap index
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(file => `  <sitemap>
    <loc>https://docsbot.ai/${file}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  fs.writeFileSync('public/sitemap-next.xml', sitemapIndex)

  // Fetch and merge with external sitemap
  const axios = require('axios')
  const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await axios.get(url)
      } catch (error) {
        if (attempt === maxRetries) throw error
        console.log(`Attempt ${attempt} failed, retrying...`)
        // Wait for 10 second before retrying
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }
  }

  const response = await fetchWithRetry('https://blog.docsbot.ai/sitemap_index.xml')
  let externalSitemap = response.data
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
