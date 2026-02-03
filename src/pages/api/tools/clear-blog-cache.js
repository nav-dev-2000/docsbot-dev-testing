import { promises as fs } from 'fs'
import path from 'path'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { clearCloudflareCache } from '@/lib/cloudflare'
import { isSuperAdmin } from '@/utils/helpers'

const getBuildId = async () => {
  if (process.env.NEXT_BUILD_ID) {
    return process.env.NEXT_BUILD_ID
  }

  if (process.env.NEXT_PUBLIC_BUILD_ID) {
    return process.env.NEXT_PUBLIC_BUILD_ID
  }

  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID')
    const buildId = await fs.readFile(buildIdPath, 'utf8')
    return buildId.trim()
  } catch (error) {
    console.warn('Unable to read Next.js build ID:', error)
    return null
  }
}

const normalizePath = (input) => {
  if (!input || typeof input !== 'string') {
    return null
  }

  const trimmedInput = input.trim()
  if (!trimmedInput) {
    return null
  }

  let pathname = trimmedInput

  // If a full URL is provided, accept it as long as it points at docsbot.ai
  if (/^https?:\/\//i.test(trimmedInput)) {
    let parsedUrl
    try {
      parsedUrl = new URL(trimmedInput)
    } catch (error) {
      return null
    }

    if (parsedUrl.hostname !== 'docsbot.ai') {
      return null
    }

    pathname = parsedUrl.pathname
  }

  // If a bare slug is provided, assume it's an article slug.
  if (!pathname.startsWith('/')) {
    pathname = `/article/${pathname}`
  }

  const trimmedPath = pathname.replace(/\/$/, '')
  const pathSegments = trimmedPath.split('/').filter(Boolean)

  if (pathSegments.length === 0) {
    return null
  }

  return {
    path: `/${pathSegments.join('/')}`,
    pathSegments,
  }
}

const buildNextDataUrls = (buildId, articlePath, pathSegments) => {
  if (!buildId) {
    return []
  }

  const encodedQuery = pathSegments
    .map((segment) => `path=${encodeURIComponent(segment)}`)
    .join('&')

  return [
    `https://docsbot.ai/_next/data/${buildId}${articlePath}.json`,
    `https://docsbot.ai/_next/data/${buildId}${articlePath}.json?${encodedQuery}`,
  ]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { blogUrl, articlePath } = req.body || {}
  if (!blogUrl && !articlePath) {
    return res
      .status(400)
      .json({ message: 'Missing blogUrl or articlePath parameter' })
  }

  // Allow INTERNAL_API_KEY (server-to-server) as an alternative to super admin cookies.
  const authHeader = req.headers.authorization
  const expectedKey = process.env.INTERNAL_API_KEY
  const hasInternalKey =
    authHeader && expectedKey && authHeader === `Bearer ${expectedKey}`

  if (!hasInternalKey) {
    try {
      const user = await getAuthorizedUser({ req })
      if (!isSuperAdmin(user.uid)) {
        return res
          .status(403)
          .json({ message: 'Unauthorized: Only super admins can clear caches' })
      }
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Authentication required' })
    }
  }

  const parsed = normalizePath(blogUrl || articlePath)
  if (!parsed) {
    return res.status(400).json({
      message:
        'Invalid URL or path. Use a docsbot.ai URL, /article/slug, /documentation/..., or a slug.',
    })
  }

  const { path: normalizedPath, pathSegments } = parsed

  const buildId = await getBuildId()
  const urlsToPurge = [
    `https://docsbot.ai${normalizedPath}`,
    ...buildNextDataUrls(buildId, normalizedPath, pathSegments),
  ]

  try {
    const cloudflareResult = await clearCloudflareCache(null, null, urlsToPurge)
    console.log(`Cloudflare cache cleared: ${cloudflareResult ? 'success' : 'failed'}`)
  } catch (cloudflareError) {
    console.error('Error clearing Cloudflare cache:', cloudflareError)
  }

  const revalidatedPaths = []
  try {
    await res.revalidate(normalizedPath)
    revalidatedPaths.push(normalizedPath)
  } catch (error) {
    console.error(`Failed to revalidate path ${normalizedPath}:`, error)
  }

  return res.status(200).json({
    message: 'Cache cleared',
    path: normalizedPath,
    urlsToPurge,
    revalidatedPaths,
  })
}
