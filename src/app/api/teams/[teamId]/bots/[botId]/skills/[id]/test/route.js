import { NextResponse } from 'next/server'

import { getAuthorizedBotContext } from '@/lib/appRouteAuth'
import {
  getSkillDraft,
  sanitizeValidationPayload,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
} from '@/lib/skills-builder'

export async function POST(request, context) {
  try {
    const params = await context.params
    const auth = await getAuthorizedBotContext(request, params)
    const draft = await getSkillDraft(auth.team.id, auth.bot.id, params.id, auth.firestore)

    if (!draft) {
      return NextResponse.json({ message: 'Skill draft not found.' }, { status: 404 })
    }

    const runtimeUrl = process.env.SKILLS_RUNTIME_URL
    const runtimeToken = process.env.SKILLS_RUNTIME_TOKEN

    if (!runtimeUrl) {
      const fallback = {
        valid: false,
        errors: ['SKILLS_RUNTIME_URL is not configured.'],
        warnings: [],
        frontmatter: {
          name: draft.skillName,
          description: draft.manifest?.description || '',
        },
        functions: [],
        resourceSummary: {
          references: (draft.files || []).filter((file) => file.path.startsWith('references/')).length,
          assets: (draft.files || []).filter((file) => file.path.startsWith('assets/')).length,
          scripts: (draft.files || []).some((file) => file.path === 'scripts/index.ts') ? 1 : 0,
        },
        hasFunctions: draft.mode === 'executable',
      }

      const updated = await updateSkillDraft(
        auth.team.id,
        auth.bot.id,
        draft.skillName,
        {
          manifest: {
            hasFunctions: Boolean(fallback.hasFunctions),
          },
          validation: fallback,
        },
        auth.firestore,
      )
      return NextResponse.json(
        {
          validation: updated.validation,
          skill: skillRecordWithDecryptedSecretBindings(updated),
        },
        { status: 200 },
      )
    }

    const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/test`, {
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

    const payload = await response.json().catch(() => ({
      valid: false,
      errors: ['Invalid runtime test response.'],
      warnings: [],
    }))

    const sanitizedPayload = sanitizeValidationPayload(payload)

    const updated = await updateSkillDraft(
      auth.team.id,
      auth.bot.id,
      draft.skillName,
      {
        manifest: {
          hasFunctions: Boolean(sanitizedPayload?.hasFunctions),
        },
        validation: sanitizedPayload,
      },
      auth.firestore,
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            payload?.message ||
            payload?.error ||
            `Runtime test failed with status ${response.status}.`,
          validation: updated.validation,
          skill: skillRecordWithDecryptedSecretBindings(updated),
        },
        { status: response.status },
      )
    }

    return NextResponse.json({
      message: 'Remote validation completed.',
      validation: updated.validation,
      skill: skillRecordWithDecryptedSecretBindings(updated),
    })
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Unable to test skill draft.' },
      { status: error?.status || 500 },
    )
  }
}
