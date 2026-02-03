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

const normalizeArticlePath = (blogInput) => {
  if (!blogInput || typeof blogInput !== 'string') {
    return null
  }

  const trimmedInput = blogInput.trim()
  if (!trimmedInput) {
    return null
  }

  let pathname = trimmedInput
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

  const trimmedPath = pathname.replace(/\/$/, '')
  const pathSegments = trimmedPath.split('/').filter(Boolean)

  if (pathSegments.length === 0) {
    return null
  }

  // Handle documentation URLs: /documentation/doc/slug
  if (pathSegments[0] === 'documentation' && pathSegments[1] === 'doc') {
    if (pathSegments.length < 3) {
      return null
    }
    return {
      articlePath: `/${pathSegments.join('/')}`,
      pathSegments: pathSegments,
    }
  }

  // Handle blog article URLs: /article/slug
  const normalizedSegments =
    pathSegments[0] === 'article' ? pathSegments : ['article', ...pathSegments]

  if (normalizedSegments.length < 2) {
    return null
  }

  return {
    articlePath: `/${normalizedSegments.join('/')}`,
    pathSegments: normalizedSegments,
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

  const parsed = normalizeArticlePath(blogUrl || articlePath)
  if (!parsed) {
    return res.status(400).json({
      message:
        'Invalid blog or documentation URL or path. Use a docsbot.ai article/documentation URL, /article/slug, /documentation/doc/slug, or a post slug.',
    })
  }

  const { articlePath: normalizedArticlePath, pathSegments } = parsed

  const buildId = await getBuildId()
  const urlsToPurge = [
    `https://docsbot.ai${normalizedArticlePath}`,
    ...buildNextDataUrls(buildId, normalizedArticlePath, pathSegments),
  ]

  try {
    const cloudflareResult = await clearCloudflareCache(null, null, urlsToPurge)
    console.log(`Cloudflare cache cleared: ${cloudflareResult ? 'success' : 'failed'}`)
  } catch (cloudflareError) {
    console.error('Error clearing Cloudflare cache:', cloudflareError)
  }

  const revalidatedPaths = []
  try {
    await res.revalidate(normalizedArticlePath)
    revalidatedPaths.push(normalizedArticlePath)
  } catch (error) {
    console.error(`Failed to revalidate path ${normalizedArticlePath}:`, error)
  }

  return res.status(200).json({
    message: 'Blog cache cleared',
    articlePath: normalizedArticlePath,
    urlsToPurge,
    revalidatedPaths,
  })
}
