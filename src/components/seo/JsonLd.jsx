import Head from 'next/head'
import { useMemo } from 'react'

function escapeJsonLd(value) {
  return value
    .replace(/[<>]/g, (char) => (char === '<' ? '\\u003c' : '\\u003e'))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export default function JsonLd({ id, data }) {
  const json = useMemo(() => {
    if (!data) return null
    return escapeJsonLd(JSON.stringify(data))
  }, [data])

  if (!json) {
    return null
  }

  return (
    <Head>
      <script
        id={id}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json }}
      />
    </Head>
  )
}
