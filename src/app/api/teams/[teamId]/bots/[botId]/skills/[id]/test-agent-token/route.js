import { SignJWT } from 'jose'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { getSkillDraft } from '@/lib/skills-builder'
import { normalizeMetadataBindings, SKILL_TEST_MODEL } from '@/lib/skill-test-agent-ui'
import { canUserManageBotSettings } from '@/utils/function.utils'

function bindingValuePresent(value) {
  return Boolean(String(value || '').trim())
}

function getMissingEnvironmentBindings(draft) {
  const envRows =
    Array.isArray(draft?.envBindings) && draft.envBindings.length
      ? draft.envBindings
      : draft?.manifest?.envBindings || []
  const secretRows =
    Array.isArray(draft?.secretBindings) && draft.secretBindings.length
      ? draft.secretBindings
      : draft?.manifest?.secretBindings || []
  return {
    env: envRows
      .filter((row) => !bindingValuePresent(row?.value))
      .map((row) => String(row?.envVar || '').trim())
      .filter(Boolean),
    secrets: secretRows
      .filter((row) => !bindingValuePresent(row?.secret))
      .map((row) => String(row?.envVar || '').trim())
      .filter(Boolean),
  }
}

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function sanitizeRequiredMetadata(rawMetadata, metadataBindings) {
  const metadata = plainObject(rawMetadata) ? rawMetadata : {}
  const out = {}
  const missing = []
  for (const binding of metadataBindings) {
    const key = binding.metadataKey
    const value = metadata[key]
    if (!bindingValuePresent(value)) {
      missing.push(key)
    } else {
      out[key] = String(value)
    }
  }
  return { metadata: out, missing }
}

async function signBotMetadataJwt({ teamId, botId, signatureKey, metadata }) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + 60 * 60
  const secret = new TextEncoder().encode(signatureKey)
  const token = await new SignJWT({
    team_id: teamId,
    bot_id: botId,
    metadata,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secret)

  return { token, issuedAt, expiresAt }
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
    if (!draft.publishedAt) {
      return jsonError('Publish this skill before running the test agent.', 400)
    }

    const missingEnvironment = getMissingEnvironmentBindings(draft)
    if (missingEnvironment.env.length || missingEnvironment.secrets.length) {
      return jsonError('Save all required environment variables and secrets before testing this skill.', 400)
    }

    if (!bindingValuePresent(bot.signatureKey)) {
      return jsonError('This bot is missing a signature key for signed metadata tests.', 500)
    }

    const body = await request.json().catch(() => ({}))
    const metadataBindings = normalizeMetadataBindings(
      Array.isArray(draft.metadataBindings) && draft.metadataBindings.length
        ? draft.metadataBindings
        : draft.manifest?.metadataBindings || [],
    )
    const { metadata, missing } = sanitizeRequiredMetadata(body?.metadata, metadataBindings)
    if (missing.length) {
      return jsonError(`Missing required metadata values: ${missing.join(', ')}.`, 400)
    }

    const signed = await signBotMetadataJwt({
      teamId: team.id,
      botId: bot.id,
      signatureKey: bot.signatureKey,
      metadata,
    })

    return Response.json({
      token: signed.token,
      issuedAt: signed.issuedAt,
      expiresAt: signed.expiresAt,
      metadata,
      model: SKILL_TEST_MODEL,
      skillName: draft.skillName || params.id,
    })
  } catch (error) {
    return jsonError(error?.message || 'Unable to create skill test signature.', error?.status || 500)
  }
}

export const dynamic = 'force-dynamic'
