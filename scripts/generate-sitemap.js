const fs = require('fs')
const globby = require('globby')

function addPage(page) {
  //remove exstension
  const path = page.replace(/\.[^/.]+$/, '').replace('src/pages', '').replace('/index', '')

  return `  <url>
    <loc>${`https://docsbot.ai${path}`}</loc>
    <changefreq>daily</changefreq>
  </url>`
}

async function generateSitemap() {
  // Ignore Next.js specific files (e.g., _app.js) and API routes.
  const pages = await globby([
    'src/pages/**/*{.js,.jsx,.mdx,.md}',
    '!src/pages/_*{.jsx,.js}',
    '!src/pages/{api,app,ask,chat}/{**/*,*}',
  ])
  const sitemap = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(addPage).join('\n')}
</urlset>`

  fs.writeFileSync('public/sitemap.xml', sitemap)
}

generateSitemap()
