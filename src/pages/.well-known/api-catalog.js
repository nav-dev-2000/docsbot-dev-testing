const API_CATALOG_PATH = '/.well-known/api-catalog'
const API_CATALOG_LINK_HEADER = `<${API_CATALOG_PATH}>; rel="api-catalog"; type="application/linkset+json"`

const apiCatalog = {
  linkset: [
    {
      anchor: 'https://api.docsbot.ai/',
      'service-desc': [
        {
          href: 'https://api.docsbot.ai/openapi.json',
          type: 'application/vnd.oai.openapi+json',
        },
      ],
      'service-doc': [
        {
          href: 'https://docsbot.ai/documentation/developer/chat-api-overview',
          type: 'text/html',
        },
      ],
      status: [
        {
          href: 'https://docsbot.ai/api/region',
          type: 'application/json',
        },
      ],
    },
  ],
}

export async function getServerSideProps({ req, res }) {
  const isHeadRequest = req.method === 'HEAD'

  res.setHeader('Content-Type', 'application/linkset+json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  res.setHeader('Link', API_CATALOG_LINK_HEADER)
  res.statusCode = 200

  if (isHeadRequest) {
    res.end()
  } else {
    res.end(JSON.stringify(apiCatalog, null, 2))
  }

  return {
    props: {},
  }
}

export default function ApiCatalog() {
  return null
}
