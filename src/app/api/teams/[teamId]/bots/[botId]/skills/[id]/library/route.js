import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import { promoteSkillDraftToLibrary } from '@/lib/skills-builder'

export const dynamic = 'force-dynamic'

export async function POST(request, context) {
  try {
    const params = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!isSuperAdmin(userId)) {
      return jsonError('Only super admins can add skills to the library.', 403)
    }

    if (!canUserManageBotSettings(team, userId, bot)) {
      return jsonError('You are not allowed to manage bot skills.', 403)
    }

    const promoted = await promoteSkillDraftToLibrary({
      firestore,
      teamId: team.id,
      botId: bot.id,
      skillName: params.id,
      userId,
    })

    return NextResponse.json({
      message: 'Skill added to the global skills library.',
      skill: promoted.skill,
      result: promoted.result,
      searchIndex: promoted.searchIndex,
    })
  } catch (error) {
    return jsonError(error?.message || 'Unable to add skill to the library.', error?.status || 500)
  }
}
