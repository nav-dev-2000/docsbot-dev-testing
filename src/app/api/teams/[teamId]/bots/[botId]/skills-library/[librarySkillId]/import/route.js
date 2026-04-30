import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'
import {
  importLibrarySkillToBot,
  skillRecordWithDecryptedSecretBindings,
} from '@/lib/skills-builder'

export const dynamic = 'force-dynamic'

export async function POST(request, context) {
  try {
    const params = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!canUserManageBotSettings(team, userId, bot)) {
      return jsonError('You are not allowed to manage bot skills.', 403)
    }

    if (!checkPlanPermission(team, 'standard').allowed) {
      return jsonError('DocsBot skills require the Standard plan or higher.', 403)
    }

    const imported = await importLibrarySkillToBot({
      firestore,
      teamId: team.id,
      botId: bot.id,
      librarySkillName: params.librarySkillId,
    })

    return NextResponse.json(
      {
        message: 'Library skill imported into this bot.',
        skill: skillRecordWithDecryptedSecretBindings(imported.skill),
        librarySkill: imported.librarySkill,
        result: imported.result,
      },
      { status: 201 },
    )
  } catch (error) {
    return jsonError(error?.message || 'Unable to import library skill.', error?.status || 500)
  }
}
