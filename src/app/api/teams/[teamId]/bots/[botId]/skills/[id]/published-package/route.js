import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { getSkillDraft } from '@/lib/skills-builder'
import {
  readPublishedSkillPackageFromR2,
  readSkillDraftPackageFromR2,
} from '@/lib/skills-r2-package'

export const dynamic = 'force-dynamic'

function isSupportedSkillPackagePath(path) {
  const normalized = String(path || '').replace(/^\/+/, '')
  return (
    normalized === 'SKILL.md' ||
    normalized === 'package.json' ||
    normalized === '.docsbot/bundle/index.js' ||
    normalized.startsWith('scripts/') ||
    normalized.startsWith('references/') ||
    normalized.startsWith('assets/')
  )
}

function slimPackage(pkg) {
  const files = Array.isArray(pkg?.files)
    ? pkg.files.filter((file) => isSupportedSkillPackagePath(file?.path))
    : []

  return {
    configured: pkg.configured,
    message: pkg.message,
    objects: pkg.objects,
    files,
  }
}

export async function GET(request, context) {
  try {
    const params = await context.params
    const { team, bot, firestore } = await getAuthorizedBotContext(request, params)
    const draft = await getSkillDraft(team.id, bot.id, params.id, firestore, {
      includeFiles: false,
    })

    if (!draft) {
      return jsonError('Skill draft not found.', 404)
    }

    const rootPrefix = draft.manifest?.r2Prefix || draft.r2Prefix || `${team.id}/${bot.id}/${draft.skillName}`

    const hasPublished = Boolean(draft.publishedAt)
    const [draftPkg, publishedPkg] = await Promise.all([
      readSkillDraftPackageFromR2(rootPrefix, { pathFilter: isSupportedSkillPackagePath }),
      hasPublished
        ? readPublishedSkillPackageFromR2(rootPrefix, { pathFilter: isSupportedSkillPackagePath })
        : Promise.resolve(null),
    ])

    return NextResponse.json({
      hasPublished,
      draft: slimPackage(draftPkg),
      published: publishedPkg ? slimPackage(publishedPkg) : null,
    })
  } catch (error) {
    return jsonError(
      error?.message || 'Unable to load published package.',
      error?.status || 500,
    )
  }
}
