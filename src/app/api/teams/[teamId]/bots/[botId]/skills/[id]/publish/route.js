import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import {
  GENERATED_BUNDLE_ARTIFACT_PATH,
  getSkillDraft,
  mergeBundleArtifact,
  publishSkillDraft,
  sanitizeValidationPayload,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
} from '@/lib/skills-builder'
import {
  promoteSkillDraftToPublishedCurrent,
  readPublishedSkillPackageFromR2,
  readSkillDraftPackageFromR2,
} from '@/lib/skills-r2-package'

function skillRequiresGeneratedBundle(files = [], validation = null) {
  return (
    Array.isArray(files) &&
    files.some((file) => file?.path === 'scripts/index.ts')
  ) || Boolean(validation?.hasFunctions)
}

function hasNonEmptyR2File(pkg, path) {
  const file = Array.isArray(pkg?.files)
    ? pkg.files.find((entry) => entry?.path === path && !entry?.truncated)
    : null
  return Boolean(file && typeof file.content === 'string' && file.content.trim())
}

export async function POST(request, context) {
  try {
    const params = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!canUserManageBotSettings(team, userId, bot)) {
      return jsonError('You are not allowed to manage bot skills.', 403)
    }

    const draft = await getSkillDraft(team.id, bot.id, params.id, firestore)

    if (!draft) {
      return jsonError('Skill draft not found.', 404)
    }

    const runtimeUrl = process.env.SKILLS_RUNTIME_URL
    const runtimeToken = process.env.SKILLS_RUNTIME_TOKEN
    if (!runtimeUrl) {
      return jsonError(
        'SKILLS_RUNTIME_URL is not configured. The builder cannot validate before publishing.',
        500,
      )
    }

    const validationResponse = await fetch(`${runtimeUrl.replace(/\/$/, '')}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(runtimeToken ? { Authorization: `Bearer ${runtimeToken}` } : {}),
      },
      body: JSON.stringify({
        skillName: draft.skillName,
        manifest: {
          envBindings: draft.envBindings || [],
          secretBindings: draft.secretBindings || [],
          metadataBindings: draft.metadataBindings || [],
        },
        files: (draft.files || []).map((file) => ({
          path: file.path,
          content: file.content,
        })),
      }),
    })

    const validationPayload = await validationResponse.json().catch(() => ({
      valid: false,
      errors: ['Invalid runtime validation response.'],
      warnings: [],
    }))

    const sanitizedValidationPayload = sanitizeValidationPayload(validationPayload)
    const mergedFiles = sanitizedValidationPayload?.bundleArtifact
      ? mergeBundleArtifact(draft.files || [], sanitizedValidationPayload.bundleArtifact)
      : draft.files

    const updated = await updateSkillDraft(
      team.id,
      bot.id,
      params.id,
      {
        files: mergedFiles,
        manifest: {
          hasFunctions: Boolean(sanitizedValidationPayload?.hasFunctions),
        },
        validation: sanitizedValidationPayload,
      },
      firestore,
    )

    if (!validationResponse.ok || !sanitizedValidationPayload?.valid) {
      return NextResponse.json(
        {
          message:
            sanitizedValidationPayload?.message ||
            sanitizedValidationPayload?.error ||
            'Resolve validation errors before publishing.',
          result: sanitizedValidationPayload,
          skill: skillRecordWithDecryptedSecretBindings(updated),
        },
        { status: validationResponse.ok ? 400 : validationResponse.status },
      )
    }

    const requiresBundle = skillRequiresGeneratedBundle(updated.files, sanitizedValidationPayload)
    if (
      requiresBundle &&
      !String(sanitizedValidationPayload?.bundleArtifact?.content || '').trim()
    ) {
      return jsonError(
        'Runtime validation did not return a generated bundle artifact. Refusing to publish.',
        500,
      )
    }

    const draftPackage = await readSkillDraftPackageFromR2(updated.r2Prefix)
    if (!draftPackage.configured) {
      return jsonError(
        draftPackage.message || 'Skills R2 storage is not configured.',
        500,
      )
    }

    if (requiresBundle && !hasNonEmptyR2File(draftPackage, GENERATED_BUNDLE_ARTIFACT_PATH)) {
      return jsonError(
        'Refusing to publish because the generated bundle artifact is missing from the draft package in R2.',
        500,
      )
    }

    const promoteResult = await promoteSkillDraftToPublishedCurrent(updated.r2Prefix)
    if (!promoteResult.configured) {
      return jsonError(
        promoteResult.message || 'Skills R2 storage is not configured.',
        500,
      )
    }

    const publishedPackage = await readPublishedSkillPackageFromR2(updated.r2Prefix)
    if (!publishedPackage.configured) {
      return jsonError(
        publishedPackage.message || 'Skills R2 storage is not configured.',
        500,
      )
    }

    if (requiresBundle && !hasNonEmptyR2File(publishedPackage, GENERATED_BUNDLE_ARTIFACT_PATH)) {
      return jsonError(
        'Refusing to mark the skill published because the generated bundle artifact is missing from the published R2 package.',
        500,
      )
    }

    const published = await publishSkillDraft(
      {
        teamId: team.id,
        botId: bot.id,
        skillName: params.id,
        userId,
        hasFunctions: Boolean(sanitizedValidationPayload?.hasFunctions),
      },
      firestore,
    )

    return NextResponse.json({
      message: 'Skill bundle promoted to the published package and Firestore manifest updated.',
      skill: skillRecordWithDecryptedSecretBindings(published),
      result: {
        valid: true,
        uploaded: true,
        promoted: promoteResult.promoted,
        deleted: promoteResult.deleted,
      },
    })
  } catch (error) {
    return jsonError(error?.message || 'Failed to publish skill.', error?.status || 500)
  }
}
