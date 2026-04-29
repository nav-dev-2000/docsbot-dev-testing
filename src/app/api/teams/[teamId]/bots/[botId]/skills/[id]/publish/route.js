import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import {
  getSkillDraft,
  publishSkillDraft,
  sanitizeValidationPayload,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
} from '@/lib/skills-builder'
import { promoteSkillDraftToPublishedCurrent } from '@/lib/skills-r2-package'

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
        r2Prefix: draft.r2Prefix,
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

    const updated = await updateSkillDraft(
      team.id,
      bot.id,
      params.id,
      {
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

    const promoteResult = await promoteSkillDraftToPublishedCurrent(updated.r2Prefix)
    if (!promoteResult.configured) {
      return jsonError(
        promoteResult.message || 'Skills R2 storage is not configured.',
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
