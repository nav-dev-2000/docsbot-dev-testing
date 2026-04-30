import { describe, expect, it, vi } from 'vitest'

import { applyPatchOperation } from '../../tools/skills-sandbox/src/applyPatchOperation.ts'

describe('skills sandbox patch worker', () => {
  it('fails suspicious update_file no-op patches', async () => {
    const readFile = vi.fn().mockResolvedValue({ content: 'same\ncontent\n' })
    const writeFile = vi.fn()
    const session = {
      readFile,
      writeFile,
    }

    await expect(
      applyPatchOperation(session, '/workspace', {
        type: 'update_file',
        path: 'scripts/index.ts',
        diff: ['-same', '+same'].join('\n'),
      }),
    ).rejects.toThrow(
      'Patch made no content changes to scripts/index.ts. Re-read the file and send a more specific diff with stronger context.',
    )

    expect(writeFile).not.toHaveBeenCalled()
  })

  it('returns changed-line counts for successful updates', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValueOnce({ content: 'line1\nline2\n' })
      .mockResolvedValueOnce({ content: 'line1\nupdated\n' })
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const session = {
      readFile,
      writeFile,
    }

    await expect(
      applyPatchOperation(session, '/workspace', {
        type: 'update_file',
        path: 'scripts/index.ts',
        diff: ['@@ line1', '-line2', '+updated'].join('\n'),
      }),
    ).resolves.toEqual({
      status: 'completed',
      output: 'Updated scripts/index.ts (1 changed lines)',
    })
  })

  it('normalizes accidental workspace-root prefixes and reports the corrected path', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValueOnce({ content: 'line1\nline2\n' })
      .mockResolvedValueOnce({ content: 'line1\nupdated\n' })
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const session = {
      readFile,
      writeFile,
    }

    await expect(
      applyPatchOperation(session, '/workspace', {
        type: 'update_file',
        path: '/workspace/scripts/index.ts',
        diff: ['@@ line1', '-line2', '+updated'].join('\n'),
      }),
    ).resolves.toEqual({
      status: 'completed',
      output:
        'Path notice: /workspace/scripts/index.ts included the workspace root prefix; apply_patch paths should be relative to /workspace. The change was applied to scripts/index.ts.\nUpdated scripts/index.ts (1 changed lines)',
    })

    expect(readFile).toHaveBeenNthCalledWith(1, '/workspace/scripts/index.ts', {
      encoding: 'utf-8',
    })
    expect(writeFile).toHaveBeenCalledWith('/workspace/scripts/index.ts', 'line1\nupdated\n', {
      encoding: 'utf-8',
    })
  })

  it('rejects paths that try to escape the workspace', async () => {
    await expect(
      applyPatchOperation(
        {
          deleteFile: vi.fn(),
          mkdir: vi.fn(),
          readFile: vi.fn(),
          writeFile: vi.fn(),
        },
        '/workspace',
        {
          type: 'delete_file',
          path: '/workspace/../secrets.txt',
        },
      ),
    ).rejects.toThrow('Operation outside workspace: /workspace/../secrets.txt')
  })

  it('restores the original file when post-write verification fails', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValueOnce({ content: 'line1\nline2\n' })
      .mockResolvedValueOnce({ content: 'line1\nupdated;;\n' })
    const writeFile = vi.fn().mockResolvedValue(undefined)
    const session = {
      deleteFile: vi.fn(),
      mkdir: vi.fn(),
      readFile,
      writeFile,
    }

    await expect(
      applyPatchOperation(session, '/workspace', {
        type: 'update_file',
        path: 'scripts/index.ts',
        diff: ['@@ line1', '-line2', '+updated'].join('\n'),
      }),
    ).rejects.toThrow(/Patch write verification failed for scripts\/index\.ts \(expected 14 bytes, read back 16 bytes, first differing line 2\)\. Re-read the file before attempting another edit\. Rollback succeeded and original file content was restored\./)

    expect(writeFile).toHaveBeenCalledTimes(2)
    expect(writeFile).toHaveBeenNthCalledWith(2, '/workspace/scripts/index.ts', 'line1\nline2\n', {
      encoding: 'utf-8',
    })
  })

  it('reports rollback failures without claiming the original file was restored', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValueOnce({ content: 'line1\nline2\n' })
      .mockResolvedValueOnce({ content: 'line1\nupdated;;\n' })
    const writeFile = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('disk quota exceeded'))
    const session = {
      deleteFile: vi.fn(),
      mkdir: vi.fn(),
      readFile,
      writeFile,
    }

    await expect(
      applyPatchOperation(session, '/workspace', {
        type: 'update_file',
        path: 'scripts/index.ts',
        diff: ['@@ line1', '-line2', '+updated'].join('\n'),
      }),
    ).rejects.toThrow(
      /Patch write verification failed for scripts\/index\.ts \(expected 14 bytes, read back 16 bytes, first differing line 2\)\. Re-read the file before attempting another edit\. Rollback failed and the file may be left in a partially updated state: disk quota exceeded/,
    )

    expect(writeFile).toHaveBeenCalledTimes(2)
  })
})
