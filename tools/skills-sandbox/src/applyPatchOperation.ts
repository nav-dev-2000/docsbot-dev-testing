import path from 'node:path'

import { applyDiff } from './applyDiff'

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

function normalizeWorkspaceOperationPath(workspaceRoot: string, operationPath: string) {
  const rawPath = String(operationPath || '').trim()
  const normalizedWorkspaceRoot = path.posix.normalize(workspaceRoot)
  const rootRelativePrefix = normalizedWorkspaceRoot.replace(/^\/+/, '')
  let pathForValidation = rawPath
  let usedWorkspaceRootPrefix = false

  if (rawPath === normalizedWorkspaceRoot) {
    pathForValidation = ''
    usedWorkspaceRootPrefix = true
  } else if (rawPath.startsWith(`${normalizedWorkspaceRoot}/`)) {
    pathForValidation = rawPath.slice(normalizedWorkspaceRoot.length + 1)
    usedWorkspaceRootPrefix = true
  } else if (rawPath === rootRelativePrefix) {
    pathForValidation = ''
    usedWorkspaceRootPrefix = true
  } else if (rootRelativePrefix && rawPath.startsWith(`${rootRelativePrefix}/`)) {
    pathForValidation = rawPath.slice(rootRelativePrefix.length + 1)
    usedWorkspaceRootPrefix = true
  }

  const pathSegments = pathForValidation.split('/').filter(Boolean)
  if (
    !pathForValidation ||
    pathForValidation === '.' ||
    pathForValidation.startsWith('/') ||
    pathSegments.includes('..')
  ) {
    throw new Error(`Operation outside workspace: ${operationPath}`)
  }

  const normalized = path.posix.normalize(pathForValidation).replace(/^\/+/, '')
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Operation outside workspace: ${operationPath}`)
  }

  return {
    normalizedPath: normalized,
    targetPath: path.posix.join(workspaceRoot, normalized),
    pathNotice:
      usedWorkspaceRootPrefix && rawPath !== normalized
        ? `Path notice: ${operationPath} included the workspace root prefix; apply_patch paths should be relative to ${workspaceRoot}. The change was applied to ${normalized}.`
        : null,
  }
}

function countChangedLines(original: string, patched: string) {
  const before = String(original || '').split('\n')
  const after = String(patched || '').split('\n')
  const max = Math.max(before.length, after.length)
  let changed = 0

  for (let index = 0; index < max; index += 1) {
    if ((before[index] ?? null) !== (after[index] ?? null)) {
      changed += 1
    }
  }

  return changed
}

function countBytes(content: string) {
  return Buffer.byteLength(String(content || ''), 'utf8')
}

function findFirstDifferingLineNumber(expected: string, actual: string) {
  const expectedLines = String(expected || '').split('\n')
  const actualLines = String(actual || '').split('\n')
  const max = Math.max(expectedLines.length, actualLines.length)

  for (let index = 0; index < max; index += 1) {
    if ((expectedLines[index] ?? null) !== (actualLines[index] ?? null)) {
      return index + 1
    }
  }

  return null
}

function formatVerificationFailureMessage(operationPath: string, expected: string, actual: string) {
  const firstDifferingLine = findFirstDifferingLineNumber(expected, actual)
  const mismatchDetails = [
    `expected ${countBytes(expected)} bytes`,
    `read back ${countBytes(actual)} bytes`,
    firstDifferingLine ? `first differing line ${firstDifferingLine}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return `Patch write verification failed for ${operationPath} (${mismatchDetails}). Re-read the file before attempting another edit.`
}

function formatPatchOutput(message: string, pathNotice: string | null) {
  return pathNotice ? `${pathNotice}\n${message}` : message
}

async function rollbackPatchedFile(
  session: {
    writeFile: (path: string, content: string, options: { encoding: string }) => Promise<unknown>
  },
  targetPath: string,
  originalContent: string,
) {
  await session.writeFile(targetPath, originalContent, { encoding: 'utf-8' })
}

export async function applyPatchOperation(
  session: {
    deleteFile: (path: string) => Promise<unknown>
    mkdir: (path: string, options: { recursive: boolean }) => Promise<unknown>
    writeFile: (path: string, content: string, options: { encoding: string }) => Promise<unknown>
    readFile: (path: string, options: { encoding: string }) => Promise<{ content?: string | null }>
  },
  workspaceRoot: string,
  operation: SandboxApplyPatchOperation,
) {
  const { normalizedPath, targetPath, pathNotice } = normalizeWorkspaceOperationPath(
    workspaceRoot,
    operation.path,
  )

  if (operation.type === 'delete_file') {
    await session.deleteFile(targetPath)
    return {
      status: 'completed' as const,
      output: formatPatchOutput(`Deleted ${normalizedPath}`, pathNotice),
    }
  }

  if (operation.type === 'create_file') {
    const content = applyDiff('', operation.diff, 'create')
    await session.mkdir(path.posix.dirname(targetPath), { recursive: true })
    await session.writeFile(targetPath, content, { encoding: 'utf-8' })
    return {
      status: 'completed' as const,
      output: formatPatchOutput(`Created ${normalizedPath}`, pathNotice),
    }
  }

  const original = await session.readFile(targetPath, { encoding: 'utf-8' })
  const originalContent = String(original.content || '')
  const patched = applyDiff(originalContent, operation.diff)
  if (patched === originalContent) {
    throw new Error(
      `Patch made no content changes to ${normalizedPath}. Re-read the file and send a more specific diff with stronger context.`,
    )
  }
  try {
    await session.writeFile(targetPath, patched, { encoding: 'utf-8' })
    const verified = await session.readFile(targetPath, { encoding: 'utf-8' })
    const verifiedContent = String(verified.content || '')
    if (verifiedContent !== patched) {
      throw new Error(formatVerificationFailureMessage(normalizedPath, patched, verifiedContent))
    }
  } catch (error) {
    const primaryMessage = error instanceof Error ? error.message : 'Patch write failed.'

    try {
      await rollbackPatchedFile(session, targetPath, originalContent)
    } catch (rollbackError) {
      throw new Error(
        `${primaryMessage} Rollback failed and the file may be left in a partially updated state: ${
          rollbackError instanceof Error ? rollbackError.message : 'Unknown rollback error.'
        }`,
      )
    }

    throw new Error(`${primaryMessage} Rollback succeeded and original file content was restored.`)
  }
  return {
    status: 'completed' as const,
    output: formatPatchOutput(
      `Updated ${normalizedPath} (${countChangedLines(originalContent, patched)} changed lines)`,
      pathNotice,
    ),
  }
}
