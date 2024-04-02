const fs = require('fs')

async function getLatestNews() {

  const axios = require('axios')

  // Fetch the latest post from the "news" category
  const response = await axios.get('https://blog.docsbot.ai/wp-json/wp/v2/posts?categories=news&per_page=1')
  const latestPost = response.data

  //only keep the data we need: title, link
  const { title, slug } = latestPost[0]

  fs.writeFileSync('public/latest-news.json', JSON.stringify({ title: title?.rendered, link: "/article/" + slug }))
}

getLatestNews()
