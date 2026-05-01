import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import {
  countBillableBotActions,
  getBotActionSlotLimit,
} from '@/utils/helpers'
import {
  deleteSkillDraft,
  getSkillDraft,
  listSkillDrafts,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
} from '@/lib/skills-builder'
import { deleteSkillPrefixFromR2 } from '@/lib/skills-r2-package'

export const dynamic = 'force-dynamic'

const SKILL_UPDATE_KEYS = [
  'manifest',
  'files',
  'audience',
  'category',
  'mode',
  'validation',
  'liveTest',
  'chatMessages',
  'agent',
  'lastAuthoringSummary',
  'publishedAt',
]

function hasMissingEnvBindingValues(recordOrManifest) {
  const bindings = recordOrManifest?.envBindings
  return (
    Array.isArray(bindings) &&
    bindings.some(
      (binding) =>
        typeof binding?.value !== 'string' || binding.value.trim().length === 0,
    )
  )
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

    return NextResponse.json({
      skill: skillRecordWithDecryptedSecretBindings(draft),
    })
  } catch (error) {
    return jsonError(
      error?.message || 'Unable to load skill draft.',
      error?.status || 500,
    )
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!canUserManageBotSettings(team, userId, bot)) {
      return jsonError('You are not allowed to manage bot skills.', 403)
    }

    const skillId = params.id
    const existing = await getSkillDraft(team.id, bot.id, skillId, firestore)
    if (!existing) {
      return jsonError('Skill draft not found.', 404)
    }

    const body = await request.json().catch(() => ({}))
    const updates = {}
    for (const key of SKILL_UPDATE_KEYS) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const nextManifest = {
      ...(existing.manifest || {}),
      ...(updates.manifest || {}),
    }
    if (nextManifest.enabledWidget === true && hasMissingEnvBindingValues(nextManifest)) {
      return jsonError(
        'This skill cannot be enabled in widget actions until all envBindings have values.',
        400,
      )
    }

    if (
      existing?.manifest?.enabledWidget !== true &&
      nextManifest.enabledWidget === true
    ) {
      const drafts = await listSkillDrafts(team.id, bot.id, firestore)
      const enabledWidgetSkills = drafts
        .filter((draft) => draft?.id !== skillId && draft?.manifest?.enabledWidget === true)
        .map((draft) => draft.skillName || draft.id)
      const actionLimit = getBotActionSlotLimit(team)
      const actionCount = countBillableBotActions({
        tools: bot?.tools,
        leadCollect: bot?.leadCollect,
        mcpServers: bot?.mcpServers,
        widgetSkills: [...enabledWidgetSkills, skillId],
      })

      if (actionCount > actionLimit) {
        return jsonError(
          actionLimit === 0
            ? 'Actions are not available on your current plan.'
            : `Your plan includes up to ${String(actionLimit)} actions per bot. Disable an action or upgrade for a higher limit.`,
          403,
        )
      }
    }

    const updated = await updateSkillDraft(team.id, bot.id, skillId, updates, firestore)
    return NextResponse.json({
      skill: skillRecordWithDecryptedSecretBindings(updated),
    })
  } catch (error) {
    return jsonError(
      error?.message || 'Unable to update skill.',
      error?.status || 500,
    )
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!canUserManageBotSettings(team, userId, bot)) {
      return jsonError('You are not allowed to manage bot skills.', 403)
    }

    const skillId = params.id

    const existing = await getSkillDraft(team.id, bot.id, skillId, firestore)
    if (!existing) {
      return jsonError('Skill draft not found.', 404)
    }

    const r2Prefix =
      typeof existing.r2Prefix === 'string' && existing.r2Prefix.trim()
        ? existing.r2Prefix.trim()
        : `${team.id}/${bot.id}/${skillId}`

    const r2Result = await deleteSkillPrefixFromR2(r2Prefix)

    const { deleted } = await deleteSkillDraft(team.id, bot.id, skillId, firestore)
    if (!deleted) {
      return jsonError('Skill draft not found.', 404)
    }

    return NextResponse.json({
      ok: true,
      r2Deleted: r2Result.deleted ?? 0,
      r2Cleaned: Boolean(r2Result.configured),
    })
  } catch (error) {
    return jsonError(
      error?.message || 'Unable to delete skill.',
      error?.status || 500,
    )
  }
}
