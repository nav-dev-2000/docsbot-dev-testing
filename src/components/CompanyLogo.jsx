import { useCallback, useEffect } from 'react'
import clsx from 'clsx'

function googleFaviconUrl(domain, sz = 64) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`
}

let warnedMissingLogolinkKey = false

export default function CompanyLogo({ domain, className, alt }) {
  const apiKey = process.env.NEXT_PUBLIC_LOGOLINK_KEY
  useEffect(() => {
    if (!apiKey && domain && !warnedMissingLogolinkKey) {
      warnedMissingLogolinkKey = true
      console.warn(
        '[CompanyLogo] NEXT_PUBLIC_LOGOLINK_KEY is not set; using Google favicon'
      )
    }
  }, [apiKey, domain])

  const handleError = useCallback(
    (e) => {
      const img = e.currentTarget
      if (img.dataset.fallback === '1') {
        img.style.display = 'none'
        return
      }
      console.warn(
        '[CompanyLogo] LogoLink image failed, falling back to Google favicon',
        domain
      )
      img.dataset.fallback = '1'
      img.src = googleFaviconUrl(domain)
    },
    [domain]
  )

  if (!domain) return null

  const src = apiKey
    ? `https://logos.context.dev/?publicClientId=${encodeURIComponent(apiKey)}&domain=${encodeURIComponent(domain)}`
    : googleFaviconUrl(domain)

  return (
    <img
      src={src}
      alt={alt ?? `${domain} logo`}
      className={clsx('bg-white rounded-md', className)}
      onError={handleError}
    />
  )
}
