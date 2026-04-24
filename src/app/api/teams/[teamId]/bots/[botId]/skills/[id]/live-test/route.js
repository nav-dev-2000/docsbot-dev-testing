import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import {
  getSkillDraft,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
} from '@/lib/skills-builder'

export async function POST(request, context) {
  try {
    const params = await context.params
    const auth = await getAuthorizedBotContext(request, params)
    const draft = await getSkillDraft(auth.team.id, auth.bot.id, params.id, auth.firestore)

    if (!draft) {
      return jsonError('Skill draft not found.', 404)
    }

    if (!draft.validation?.valid) {
      return jsonError(
        'Run bundle validation successfully before starting a live test.',
        400,
      )
    }

    const runtimeUrl = process.env.SKILLS_RUNTIME_URL
    const runtimeToken = process.env.SKILLS_RUNTIME_TOKEN

    const liveTestResult = {
      ok: Boolean(runtimeUrl && runtimeToken),
      testedAt: new Date().toISOString(),
      message:
        runtimeUrl && runtimeToken
          ? 'Live runtime endpoint credentials are present. Wire session start/activate calls next.'
          : 'Live test wiring is in place. Configure SKILLS_RUNTIME_URL and SKILLS_RUNTIME_TOKEN to enable remote activation and function execution.',
      checks: [
        {
          type: 'activation',
          status:
            runtimeUrl && runtimeToken ? 'ready_for_wiring' : 'not_configured',
          detail:
            runtimeUrl && runtimeToken
              ? 'Remote runtime environment variables are present.'
              : 'Remote session start/activate endpoints are not configured in this environment.',
        },
      ],
      validation: draft.validation,
    }

    const updated = await updateSkillDraft(
      auth.team.id,
      auth.bot.id,
      draft.skillName,
      {
        liveTest: liveTestResult,
      },
      auth.firestore,
    )

    return NextResponse.json({
      message: liveTestResult.message,
      skill: skillRecordWithDecryptedSecretBindings(updated),
      liveTest: updated.liveTest,
    })
  } catch (error) {
    return jsonError(error?.message || 'Unable to run live skill test.', error?.status || 500)
  }
}
