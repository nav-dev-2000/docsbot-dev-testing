import { executeSkillSandboxCommands, resetSkillSandbox } from '@/lib/skills-sandbox-client'

const DEFAULT_SHELL_TIMEOUT_MS = 60000

function shellCommandPreview(commands = []) {
  const preview = commands
    .filter((command) => typeof command === 'string' && command.trim())
    .join(' && ')
    .trim()

  if (!preview) return ''
  if (preview.length <= 240) return preview
  return `${preview.slice(0, 237)}...`
}

function formatShellBackendError(error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Unknown shell backend error.'

  return `Shell backend request failed or timed out while waiting for the sandbox command to complete. Error: ${message}`
}

function shouldResetSandboxAfterError(error) {
  const message = String(error?.message || '')
  return /timed out|timeout/i.test(message)
}

export function createSkillShellExecute({
  teamId,
  botId,
  skillName,
  abortSignal,
  /** When set, incremented once per invocation with wall-clock duration (ms) for usage estimates. */
  usageAccumulator,
} = {}) {
  return async ({ action }) => {
    const commands = Array.isArray(action?.commands) ? action.commands : []
    const startedAt = Date.now()
    const timeoutMs =
      Number.isFinite(action?.timeoutMs) && action.timeoutMs > 0
        ? action.timeoutMs
        : DEFAULT_SHELL_TIMEOUT_MS

    console.log(
      JSON.stringify({
        event: 'skills.shell.start',
        teamId,
        botId,
        skillName,
        commandCount: commands.length,
        timeoutMs,
        maxOutputLength: action?.maxOutputLength ?? null,
        commandPreview: shellCommandPreview(commands),
        timestamp: new Date(startedAt).toISOString(),
      }),
    )

    try {
      const result = await executeSkillSandboxCommands({
        teamId,
        botId,
        skillName,
        commands,
        timeoutMs,
        maxOutputLength: action?.maxOutputLength,
        abortSignal,
      })

      console.log(
        JSON.stringify({
          event: 'skills.shell.finish',
          teamId,
          botId,
          skillName,
          commandCount: commands.length,
          durationMs: Date.now() - startedAt,
          outcomes: result.output.map((entry) => entry?.outcome?.type || 'exit'),
          exitCodes: result.output.map((entry) =>
            entry?.outcome?.type === 'exit' ? Number(entry?.outcome?.exitCode ?? 1) : null,
          ),
          timestamp: new Date().toISOString(),
        }),
      )

      return {
        output: result.output.map((entry) => ({
          stdout: String(entry?.stdout ?? ''),
          stderr: String(entry?.stderr ?? ''),
          outcome: entry?.outcome?.type === 'timeout'
            ? { type: 'timeout' }
            : { type: 'exit', exitCode: Number(entry?.outcome?.exitCode ?? 1) },
        })),
      }
    } catch (error) {
      if (shouldResetSandboxAfterError(error)) {
        try {
          await resetSkillSandbox({ teamId, botId, skillName })
          console.warn(
            JSON.stringify({
              event: 'skills.shell.reset',
              teamId,
              botId,
              skillName,
              reason: 'timeout',
              timestamp: new Date().toISOString(),
            }),
          )
        } catch (resetError) {
          console.error(
            JSON.stringify({
              event: 'skills.shell.reset.error',
              teamId,
              botId,
              skillName,
              error:
                resetError instanceof Error && resetError.message
                  ? resetError.message
                  : 'Unknown sandbox reset error.',
              timestamp: new Date().toISOString(),
            }),
          )
        }
      }

      const message = formatShellBackendError(error)

      console.error(
        JSON.stringify({
          event: 'skills.shell.error',
          teamId,
          botId,
          skillName,
          commandCount: commands.length,
          durationMs: Date.now() - startedAt,
          commandPreview: shellCommandPreview(commands),
          error: message,
          timestamp: new Date().toISOString(),
        }),
      )

      return {
        output: commands.map(() => ({
          stdout: '',
          stderr: message,
          outcome: { type: 'exit', exitCode: 1 },
        })),
      }
    } finally {
      if (usageAccumulator) {
        usageAccumulator.calls = (usageAccumulator.calls ?? 0) + 1
        usageAccumulator.durationMs = (usageAccumulator.durationMs ?? 0) + (Date.now() - startedAt)
      }
    }
  }
}
