import { applySkillSandboxPatch } from '@/lib/skills-sandbox-client'

function formatPatchBackendError(error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Unknown apply_patch backend error.'

  return `Patch backend request failed while applying the file operation in the sandbox. Error: ${message}`
}

export function createSkillPatchExecute({ teamId, botId, skillName, abortSignal }) {
  return async ({ callId, operation }) => {
    const startedAt = Date.now()

    console.log(
      JSON.stringify({
        event: 'skills.patch.start',
        teamId,
        botId,
        skillName,
        callId,
        operationType: operation?.type || null,
        path: operation?.path || null,
        timestamp: new Date(startedAt).toISOString(),
      }),
    )

    try {
      const result = await applySkillSandboxPatch({
        teamId,
        botId,
        skillName,
        callId,
        operation,
        abortSignal,
      })

      console.log(
        JSON.stringify({
          event: 'skills.patch.finish',
          teamId,
          botId,
          skillName,
          callId,
          operationType: operation?.type || null,
          path: operation?.path || null,
          status: result.status,
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString(),
        }),
      )

      return {
        status: result.status,
        ...(result.output ? { output: String(result.output) } : {}),
      }
    } catch (error) {
      const message = formatPatchBackendError(error)

      console.error(
        JSON.stringify({
          event: 'skills.patch.error',
          teamId,
          botId,
          skillName,
          callId,
          operationType: operation?.type || null,
          path: operation?.path || null,
          durationMs: Date.now() - startedAt,
          error: message,
          timestamp: new Date().toISOString(),
        }),
      )

      return {
        status: 'failed',
        output: message,
      }
    }
  }
}
