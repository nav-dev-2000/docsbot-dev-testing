import { getSandbox, type Sandbox as CloudflareSandbox } from '@cloudflare/sandbox'

import { applyPatchOperation } from './applyPatchOperation'

export { Sandbox } from '@cloudflare/sandbox'

type SandboxExecRequest = {
  teamId: string
  botId: string
  skillName: string
  sandboxId: string
  sessionId?: string
  commands?: string[]
  timeoutMs?: number
  maxOutputLength?: number
}

type SandboxApplyPatchOperation =
  | {
      type: 'create_file'
      path: string
      diff: string
    }
  | {
      type: 'delete_file'
      path: string
    }
  | {
      type: 'update_file'
      path: string
      diff: string
    }

type SandboxApplyPatchRequest = {
  teamId: string
  botId: string
  skillName: string
  sandboxId: string
  sessionId?: string
  callId: string
  operation: SandboxApplyPatchOperation
}

type Env = {
  Sandbox: DurableObjectNamespace<CloudflareSandbox>
  CLOUDFLARE_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  SKILLS_R2_BUCKET?: string
  R2_SKILLS_BUCKET?: string
  SKILLS_SANDBOX_TOKEN: string
  WORKSPACE_ROOT?: string
}

const DEFAULT_WORKSPACE_ROOT = '/workspace'
const ENABLE_DRAFT_MOUNT = true

function unauthorized() {
  return Response.json({ message: 'Unauthorized.' }, { status: 401 })
}

async function destroySandbox(sandbox: Awaited<ReturnType<typeof getSandbox>>) {
  try {
    await sandbox.destroy()
  } catch (error) {
    const message = String((error as Error)?.message || '')
    if (!/not found|missing|unknown/i.test(message)) {
      throw error
    }
  }
}

function logEvent(event: string, data: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      event,
      ...data,
      timestamp: new Date().toISOString(),
    }),
  )
}

function truncateText(value: string, maxOutputLength?: number) {
  if (!maxOutputLength || value.length <= maxOutputLength) {
    return value
  }
  return value.slice(0, maxOutputLength)
}

async function ensureSession(
  sandbox: Awaited<ReturnType<typeof getSandbox>>,
  sessionId: string,
  workspaceRoot: string,
) {
  try {
    return {
      session: await sandbox.createSession({
        id: sessionId,
        cwd: workspaceRoot,
      }),
      reused: false,
    }
  } catch {
    return {
      session: await sandbox.getSession(sessionId),
      reused: true,
    }
  }
}

async function ensureDraftMount(
  sandbox: Awaited<ReturnType<typeof getSandbox>>,
  env: Env,
  draftPrefix: string,
  workspaceRoot: string,
) {
  const bucket = env.SKILLS_R2_BUCKET || env.R2_SKILLS_BUCKET
  if (!bucket) {
    throw new Error('SKILLS_R2_BUCKET or R2_SKILLS_BUCKET is required for the sandbox worker.')
  }

  try {
    await sandbox.mountBucket(bucket, workspaceRoot, {
      endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      provider: 'r2',
      prefix: `/${draftPrefix.replace(/^\/+|\/+$/g, '')}/`,
      credentials:
        env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.R2_ACCESS_KEY_ID,
              secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            }
          : undefined,
    })
  } catch (error) {
    const message = String((error as Error)?.message || '')
    if (!/mount|already|exists|conflict/i.test(message)) {
      throw error
    }
  }
}

async function ensureWorkspaceDirectory(
  session: Awaited<ReturnType<Awaited<ReturnType<typeof getSandbox>>['createSession']>>,
  workspaceRoot: string,
) {
  await session.exec(`mkdir -p '${workspaceRoot.replace(/'/g, `'\"'\"'`)}'`)
}

function isDeadSessionError(error: unknown) {
  const message = String((error as Error)?.message || '')
  return /not ready|shell has died|shell terminated unexpectedly|session is dead/i.test(message)
}

async function createMountedSession(
  sandbox: Awaited<ReturnType<typeof getSandbox>>,
  env: Env,
  sessionId: string,
  workspaceRoot: string,
  draftPrefix: string,
) {
  const { session, reused } = await ensureSession(sandbox, sessionId, workspaceRoot)
  if (!reused) {
    await ensureWorkspaceDirectory(session, workspaceRoot)

    if (ENABLE_DRAFT_MOUNT) {
      await ensureDraftMount(sandbox, env, draftPrefix, workspaceRoot)
    }
  }

  return { session, reused }
}

async function recycleSession(
  sandbox: Awaited<ReturnType<typeof getSandbox>>,
  env: Env,
  sessionId: string,
  workspaceRoot: string,
  draftPrefix: string,
) {
  try {
    await sandbox.deleteSession(sessionId)
  } catch (error) {
    const message = String((error as Error)?.message || '')
    if (!/not found|missing|unknown/i.test(message)) {
      throw error
    }
  }

  return createMountedSession(sandbox, env, sessionId, workspaceRoot, draftPrefix)
}

function draftPrefixForRequest(input: SandboxExecRequest) {
  return `${input.teamId}/${input.botId}/${input.skillName}/draft`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader !== `Bearer ${env.SKILLS_SANDBOX_TOKEN}`) {
      return unauthorized()
    }

    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true })
    }

    if (request.method === 'POST' && url.pathname === '/reset') {
      try {
        const input = (await request.json()) as Pick<SandboxExecRequest, 'sandboxId'>
        if (!input?.sandboxId) {
          return Response.json({ message: 'sandboxId is required.' }, { status: 400 })
        }

        const sandbox = getSandbox(env.Sandbox, input.sandboxId)
        await destroySandbox(sandbox)

        logEvent('exec.reset', {
          sandboxId: input.sandboxId,
        })

        return Response.json({ ok: true, sandboxId: input.sandboxId })
      } catch (error) {
        logEvent('exec.reset.error', {
          error: (error as Error)?.message || 'Sandbox reset failed.',
        })
        return Response.json(
          { message: (error as Error)?.message || 'Sandbox reset failed.' },
          { status: 500 },
        )
      }
    }

    if (request.method === 'POST' && url.pathname === '/apply-patch') {
      try {
        const input = (await request.json()) as SandboxApplyPatchRequest
        const workspaceRoot = env.WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT
        const sessionId = input.sessionId || 'builder'
        const draftPrefix = draftPrefixForRequest(input)
        let currentSandbox = getSandbox(env.Sandbox, input.sandboxId)

        logEvent('patch.request', {
          sandboxId: input.sandboxId,
          sessionId,
          teamId: input.teamId,
          botId: input.botId,
          skillName: input.skillName,
          callId: input.callId,
          operationType: input.operation?.type || null,
          path: input.operation?.path || null,
        })

        let { session } = await createMountedSession(
          currentSandbox,
          env,
          sessionId,
          workspaceRoot,
          draftPrefix,
        )

        try {
          const result = await applyPatchOperation(session, workspaceRoot, input.operation)
          logEvent('patch.result', {
            sandboxId: input.sandboxId,
            sessionId,
            callId: input.callId,
            operationType: input.operation.type,
            path: input.operation.path,
            status: result.status,
          })
          return Response.json(result)
        } catch (error) {
          if (isDeadSessionError(error)) {
            logEvent('patch.recover.start', {
              sandboxId: input.sandboxId,
              sessionId,
              callId: input.callId,
              operationType: input.operation.type,
              path: input.operation.path,
              error: String((error as Error)?.message || ''),
            })

            await destroySandbox(currentSandbox)
            currentSandbox = getSandbox(env.Sandbox, input.sandboxId)
            session = (
              await createMountedSession(
                currentSandbox,
                env,
                sessionId,
                workspaceRoot,
                draftPrefix,
              )
            ).session

            const result = await applyPatchOperation(session, workspaceRoot, input.operation)
            logEvent('patch.recover.result', {
              sandboxId: input.sandboxId,
              sessionId,
              callId: input.callId,
              operationType: input.operation.type,
              path: input.operation.path,
              status: result.status,
            })
            return Response.json(result)
          }

          logEvent('patch.error', {
            sandboxId: input.sandboxId,
            sessionId,
            callId: input.callId,
            operationType: input.operation?.type || null,
            path: input.operation?.path || null,
            error: (error as Error)?.message || 'Patch application failed.',
          })
          return Response.json(
            {
              status: 'failed',
              output: (error as Error)?.message || 'Patch application failed.',
            },
            { status: 200 },
          )
        }
      } catch (error) {
        logEvent('patch.fatal', {
          error: (error as Error)?.message || 'Patch request failed.',
        })
        return Response.json(
          { message: (error as Error)?.message || 'Patch request failed.' },
          { status: 500 },
        )
      }
    }

    if (request.method !== 'POST' || url.pathname !== '/exec') {
      return Response.json({ message: 'Not found.' }, { status: 404 })
    }

    try {
      const input = (await request.json()) as SandboxExecRequest
      const workspaceRoot = env.WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT
      const sandbox = getSandbox(env.Sandbox, input.sandboxId)
      const sessionId = input.sessionId || 'builder'
      const commands = Array.isArray(input.commands) ? input.commands : []
      const requestStartedAt = Date.now()

      logEvent('exec.request', {
        sandboxId: input.sandboxId,
        sessionId,
        teamId: input.teamId,
        botId: input.botId,
        skillName: input.skillName,
        commandCount: commands.length,
        timeoutMs: input.timeoutMs ?? null,
        maxOutputLength: input.maxOutputLength ?? null,
      })

      const draftPrefix = draftPrefixForRequest(input)
      logEvent('exec.session.acquire.start', {
        sandboxId: input.sandboxId,
        sessionId,
      })

      let currentSandbox = sandbox
      const { session, reused } = await createMountedSession(
        currentSandbox,
        env,
        sessionId,
        workspaceRoot,
        draftPrefix,
      )
      let currentSession = session
      if (!reused) {
        if (ENABLE_DRAFT_MOUNT) {
          logEvent('exec.mount.start', {
            sandboxId: input.sandboxId,
            sessionId,
            draftPrefix,
            workspaceRoot,
          })
        } else {
          logEvent('exec.mount.skipped', {
            sandboxId: input.sandboxId,
            sessionId,
            draftPrefix,
            workspaceRoot,
            reason: 'Debug mode: R2 mount disabled.',
          })
        }
      }
      logEvent('exec.ready', {
        sandboxId: input.sandboxId,
        sessionId,
        workspaceRoot,
        draftPrefix,
        reusedSession: reused,
        durationMs: Date.now() - requestStartedAt,
      })

      const output = []
      for (const command of commands) {
        const commandStartedAt = Date.now()
        logEvent('exec.command.start', {
          sandboxId: input.sandboxId,
          sessionId,
          command,
        })

        try {
          const result = await currentSession.exec(command, {
            timeout: input.timeoutMs,
          })

          const stdout = truncateText(String(result.stdout || ''), input.maxOutputLength)
          const stderr = truncateText(String(result.stderr || ''), input.maxOutputLength)
          const exitCode = Number(result.exitCode ?? (result.success === false ? 1 : 0))

          output.push({
            stdout,
            stderr,
            outcome: {
              type: 'exit',
              exitCode,
            },
          })

          logEvent('exec.command.result', {
            sandboxId: input.sandboxId,
            sessionId,
            command,
            stdout,
            stderr,
            exitCode,
            durationMs: Date.now() - commandStartedAt,
          })
        } catch (error) {
          if (isDeadSessionError(error)) {
            logEvent('exec.recover.start', {
              sandboxId: input.sandboxId,
              sessionId,
              command,
              error: String((error as Error)?.message || ''),
            })

            await destroySandbox(currentSandbox)
            currentSandbox = getSandbox(env.Sandbox, input.sandboxId)

            logEvent('exec.mount.start', {
              sandboxId: input.sandboxId,
              sessionId,
              draftPrefix,
              workspaceRoot,
              recovery: true,
            })

            const recovered = await createMountedSession(
              currentSandbox,
              env,
              sessionId,
              workspaceRoot,
              draftPrefix,
            )
            currentSession = recovered.session

            logEvent('exec.recover.ready', {
              sandboxId: input.sandboxId,
              sessionId,
              command,
              reusedSession: recovered.reused,
            })

            try {
              const retried = await currentSession.exec(command, {
                timeout: input.timeoutMs,
              })

              const stdout = truncateText(String(retried.stdout || ''), input.maxOutputLength)
              const stderr = truncateText(String(retried.stderr || ''), input.maxOutputLength)
              const exitCode = Number(retried.exitCode ?? (retried.success === false ? 1 : 0))

              output.push({
                stdout,
                stderr,
                outcome: {
                  type: 'exit',
                  exitCode,
                },
              })

              logEvent('exec.command.result', {
                sandboxId: input.sandboxId,
                sessionId,
                command,
                stdout,
                stderr,
                exitCode,
                retriedAfterRecovery: true,
                durationMs: Date.now() - commandStartedAt,
              })
              continue
            } catch (retryError) {
              error = retryError
            }
          }

          const message = String((error as Error)?.message || '')
          const stderr = truncateText(message, input.maxOutputLength)
          const timedOut = /timeout/i.test(message)

          output.push({
            stdout: '',
            stderr,
            outcome: timedOut
              ? { type: 'timeout' }
              : { type: 'exit', exitCode: 1 },
          })

          if (timedOut) {
            logEvent('exec.session.recycle.start', {
              sandboxId: input.sandboxId,
              sessionId,
              command,
            })

            try {
              const recycled = await recycleSession(
                currentSandbox,
                env,
                sessionId,
                workspaceRoot,
                draftPrefix,
              )
              currentSession = recycled.session

              logEvent('exec.session.recycle.ready', {
                sandboxId: input.sandboxId,
                sessionId,
                command,
                reusedSession: recycled.reused,
              })
            } catch (recycleError) {
              logEvent('exec.session.recycle.error', {
                sandboxId: input.sandboxId,
                sessionId,
                command,
                error: String((recycleError as Error)?.message || ''),
              })
            }
          }

          logEvent('exec.command.error', {
            sandboxId: input.sandboxId,
            sessionId,
            command,
            stderr,
            timedOut,
            durationMs: Date.now() - commandStartedAt,
          })
        }
      }

      logEvent('exec.response', {
        sandboxId: input.sandboxId,
        sessionId,
        commandCount: commands.length,
        durationMs: Date.now() - requestStartedAt,
      })

      return Response.json({
        sandboxId: input.sandboxId,
        sessionId,
        output,
      })
    } catch (error) {
      logEvent('exec.fatal', {
        error: (error as Error)?.message || 'Sandbox execution failed.',
      })
      return Response.json(
        { message: (error as Error)?.message || 'Sandbox execution failed.' },
        { status: 500 },
      )
    }
  },
}
