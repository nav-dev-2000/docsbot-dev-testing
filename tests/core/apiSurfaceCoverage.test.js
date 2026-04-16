import path from 'node:path'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const API_ROOT = path.resolve(TEST_DIR, '../../src/pages/api')

const walkFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      return walkFiles(fullPath)
    }
    return fullPath.endsWith('.js') ? [fullPath] : []
  })

const apiFiles = walkFiles(API_ROOT)
  .map((fullPath) => path.relative(API_ROOT, fullPath).replaceAll('\\', '/'))
  .sort()

const routeSources = Object.fromEntries(
  apiFiles.map((relativePath) => [
    relativePath,
    readFileSync(path.join(API_ROOT, relativePath), 'utf8'),
  ]),
)

const webhookRoutes = new Set([
  'bento-webhook/index.js',
  'helpscout-webhook.js',
  'stripe-webhook.js',
  'truto-webhook.js',
])

const publicProxyRoutes = new Set(['preview.js', 'revalidate.js'])

describe('API surface coverage inventory', () => {
  it('tracks every API route file in the repository', () => {
    expect(apiFiles).toHaveLength(97)
    expect(apiFiles).toContain('auth.js')
    expect(apiFiles).toContain('teams/[teamId]/stripe-portal.js')
    expect(apiFiles).toContain('stripe/oauth/callback.js')
    expect(apiFiles).toContain(
      'teams/[teamId]/bots/[botId]/stripe/oauth/authorize.js',
    )
    expect(apiFiles).toContain(
      'teams/[teamId]/bots/[botId]/custom-button-draft.js',
    )
    expect(apiFiles).toContain(
      'teams/[teamId]/bots/[botId]/mcp-server-draft.js',
    )
    expect(apiFiles).toContain('tools/prompt-generator.js')
    expect(apiFiles).toContain('tools/generate-demo-trial-url.js')
  })

  it.each(apiFiles)('classifies the security model for %s', (relativePath) => {
    const source = routeSources[relativePath]

    if (relativePath === 'teams/[teamId]/bots/[botId]/openapi.js') {
      expect(source.includes('getBot(')).toBe(true)
      return
    }

    if (relativePath.startsWith('teams/')) {
      expect(
        source.includes('userTeamCheck') || source.includes('getAuthorizedUser'),
      ).toBe(true)
      return
    }

    if (relativePath.startsWith('cron/')) {
      expect(source.includes('CRON_SECRET')).toBe(true)
      return
    }

    if (webhookRoutes.has(relativePath)) {
      expect(
        source.includes('signature') ||
          source.includes('Authorization') ||
          source.includes('event_type'),
      ).toBe(true)
      return
    }

    if (relativePath === 'bento-webhook/[visitorId].js') {
      expect(source.includes('cors')).toBe(true)
      return
    }

    if (publicProxyRoutes.has(relativePath)) {
      expect(source.includes('Handler')).toBe(true)
      return
    }

    if (relativePath === 'auth.js') {
      expect(source.includes("startsWith('Bearer ')")).toBe(true)
      return
    }

    if (relativePath === 'tools/clear-blog-cache.js') {
      expect(
        source.includes('INTERNAL_API_KEY') && source.includes('getAuthorizedUser'),
      ).toBe(true)
      return
    }

    if (relativePath === 'tools/generate-demo-trial-url.js') {
      expect(source.includes('INTERNAL_API_KEY') && source.includes('getAuthorizedUser')).toBe(
        true,
      )
      expect(source.includes('isSuperAdmin')).toBe(true)
      return
    }

    if (relativePath === 'widget/[teamId]/[botId].js') {
      expect(source.includes('cors')).toBe(true)
      return
    }

    expect(typeof source).toBe('string')
    expect(source.length).toBeGreaterThan(0)
  })

  const methodGuardRoutes = apiFiles.filter((relativePath) =>
  /\b(?:req|request)\.method\b/.test(routeSources[relativePath]) ||
  routeSources[relativePath].includes('createRouter()'),
  )

  it.each(methodGuardRoutes)(
    'declares at least one explicit method branch for %s',
    (relativePath) => {
      const source = routeSources[relativePath]
      const matches = Array.from(
        source.matchAll(
          /\b(?:req|request)\.method\s*(?:===|!==)\s*'([A-Z]+)'|\brouter\.(get|post|put|patch|delete)\(/gi,
        ),
      ).map((match) => match[1] || match[2])

      expect(matches.length).toBeGreaterThan(0)
      expect(
        matches.every((method) =>
          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(
            String(method).toUpperCase(),
          ),
        ),
      ).toBe(true)
    },
  )
})
