import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class ListObjectsV2Command {
    constructor(input) {
      this.input = input
    }
  }

  class GetObjectCommand {
    constructor(input) {
      this.input = input
    }
  }

  class PutObjectCommand {
    constructor(input) {
      this.input = input
    }
  }

  class CopyObjectCommand {
    constructor(input) {
      this.input = input
    }
  }

  class DeleteObjectsCommand {
    constructor(input) {
      this.input = input
    }
  }

  const objects = new Map()
  const putInputs = []

  class S3Client {
    async send(command) {
      if (command instanceof ListObjectsV2Command) {
        const prefix = command.input.Prefix || ''
        const contents = [...objects.entries()]
          .filter(([key]) => key.startsWith(prefix))
          .map(([key, value]) => ({
            Key: key,
            Size: Buffer.byteLength(value, 'utf8'),
          }))

        return {
          Contents: contents,
          IsTruncated: false,
        }
      }

      if (command instanceof GetObjectCommand) {
        const body = objects.get(command.input.Key) || ''
        return {
          Body: {
            transformToString: async () => body,
          },
        }
      }

      if (command instanceof PutObjectCommand) {
        putInputs.push(command.input)
        objects.set(command.input.Key, String(command.input.Body ?? ''))
        return {}
      }

      if (command instanceof CopyObjectCommand) {
        const [, ...copySourceParts] = String(command.input.CopySource || '').split('/')
        const sourceKey = copySourceParts
          .map((segment) => decodeURIComponent(segment))
          .join('/')
        const body = objects.get(sourceKey) || ''
        objects.set(command.input.Key, String(body))
        return {}
      }

      if (command instanceof DeleteObjectsCommand) {
        for (const { Key } of command.input.Delete?.Objects || []) {
          objects.delete(Key)
        }
        return {
          Errors: [],
        }
      }

      throw new Error(`Unexpected command: ${command?.constructor?.name}`)
    }
  }

  return {
    objects,
    putInputs,
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    CopyObjectCommand,
    DeleteObjectsCommand,
  }
})

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: mocks.S3Client,
  ListObjectsV2Command: mocks.ListObjectsV2Command,
  GetObjectCommand: mocks.GetObjectCommand,
  PutObjectCommand: mocks.PutObjectCommand,
  CopyObjectCommand: mocks.CopyObjectCommand,
  DeleteObjectsCommand: mocks.DeleteObjectsCommand,
}))

describe('skills-r2-package', () => {
  beforeEach(() => {
    mocks.objects.clear()
    mocks.putInputs.length = 0
    process.env.CLOUDFLARE_ACCOUNT_ID = 'acct-123'
    process.env.R2_ACCESS_KEY_ID = 'key-123'
    process.env.R2_SECRET_ACCESS_KEY = 'secret-123'
    process.env.SKILLS_R2_BUCKET = 'skills-bucket'
  })

  it('writes, reads, promotes, and deletes draft bundles with the new scoped prefixes', async () => {
    const {
      getSkillDraftR2Prefix,
      getSkillPublishedR2Prefix,
      writeSkillDraftFilesToR2,
      readSkillDraftPackageFromR2,
      readPublishedSkillPackageFromR2,
      promoteSkillDraftToPublishedCurrent,
      deleteSkillPrefixFromR2,
    } = await import('@/lib/skills-r2-package')

    expect(getSkillDraftR2Prefix('team-1/bot-1/customer-refunds')).toBe(
      'team-1/bot-1/customer-refunds/draft/',
    )
    expect(getSkillPublishedR2Prefix('team-1/bot-1/customer-refunds')).toBe(
      'team-1/bot-1/customer-refunds/published/current/',
    )

    await writeSkillDraftFilesToR2('team-1/bot-1/customer-refunds', [
      { path: 'scripts/index.ts', content: 'export const handler = true\n' },
      { path: 'SKILL.md', content: '# Refunds\n' },
    ])

    expect([...mocks.objects.keys()].sort()).toEqual([
      'team-1/bot-1/customer-refunds/draft/',
      'team-1/bot-1/customer-refunds/draft/SKILL.md',
      'team-1/bot-1/customer-refunds/draft/scripts/index.ts',
    ])
    expect(
      mocks.putInputs.map((input) => ({
        Key: input.Key,
        ContentLength: input.ContentLength,
      })),
    ).toEqual([
      {
        Key: 'team-1/bot-1/customer-refunds/draft/',
        ContentLength: 0,
      },
      {
        Key: 'team-1/bot-1/customer-refunds/draft/scripts/index.ts',
        ContentLength: Buffer.byteLength('export const handler = true\n', 'utf8'),
      },
      {
        Key: 'team-1/bot-1/customer-refunds/draft/SKILL.md',
        ContentLength: Buffer.byteLength('# Refunds\n', 'utf8'),
      },
    ])

    const draft = await readSkillDraftPackageFromR2('team-1/bot-1/customer-refunds')
    expect(draft.objects.map((o) => o.key).sort()).toEqual(['SKILL.md', 'scripts/index.ts'])
    expect(draft.files).toEqual([
      { path: 'scripts/index.ts', content: 'export const handler = true\n', truncated: false },
      { path: 'SKILL.md', content: '# Refunds\n', truncated: false },
    ])

    const promoted = await promoteSkillDraftToPublishedCurrent('team-1/bot-1/customer-refunds')
    expect(promoted).toEqual({
      configured: true,
      promoted: 2,
      deleted: 0,
    })
    expect(
      mocks.putInputs.slice(3).map((input) => ({
        Key: input.Key,
        ContentLength: input.ContentLength,
      })),
    ).toEqual([
      {
        Key: 'team-1/bot-1/customer-refunds/published/current/',
        ContentLength: 0,
      },
    ])

    const published = await readPublishedSkillPackageFromR2('team-1/bot-1/customer-refunds')
    expect(published.objects.map((o) => o.key).sort()).toEqual(['SKILL.md', 'scripts/index.ts'])
    expect(published.files).toEqual([
      { path: 'scripts/index.ts', content: 'export const handler = true\n', truncated: false },
      { path: 'SKILL.md', content: '# Refunds\n', truncated: false },
    ])

    const deleted = await deleteSkillPrefixFromR2('team-1/bot-1/customer-refunds')
    expect(deleted).toEqual({
      configured: true,
      deleted: 6,
    })
    expect([...mocks.objects.keys()]).toEqual([])
  })

  it('supports single-file draft updates and deletions inside the draft prefix', async () => {
    const {
      writeSkillDraftFilesToR2,
      writeSkillDraftFileToR2,
      deleteSkillDraftFileFromR2,
      readSkillDraftPackageFromR2,
    } = await import('@/lib/skills-r2-package')

    await writeSkillDraftFilesToR2('team-1/bot-1/customer-refunds', [
      { path: 'SKILL.md', content: '# Refunds\n' },
    ])

    await writeSkillDraftFileToR2('team-1/bot-1/customer-refunds', {
      path: '.docsbot/bundle/index.js',
      content: 'export default {}\n',
    })

    let draft = await readSkillDraftPackageFromR2('team-1/bot-1/customer-refunds')
    expect(draft.files.map((file) => file.path)).toEqual([
      '.docsbot/bundle/index.js',
      'SKILL.md',
    ])

    await deleteSkillDraftFileFromR2('team-1/bot-1/customer-refunds', '.docsbot/bundle/index.js')
    draft = await readSkillDraftPackageFromR2('team-1/bot-1/customer-refunds')
    expect(draft.files).toEqual([{ path: 'SKILL.md', content: '# Refunds\n', truncated: false }])
  })

  it('promotes large draft bundles without dropping truncated preview files', async () => {
    const {
      writeSkillDraftFilesToR2,
      promoteSkillDraftToPublishedCurrent,
      readPublishedSkillPackageFromR2,
    } = await import('@/lib/skills-r2-package')

    const largeBundle = 'x'.repeat(600 * 1024)

    await writeSkillDraftFilesToR2('team-1/bot-1/weather', [
      { path: 'SKILL.md', content: '# Weather\n' },
      { path: '.docsbot/bundle/index.js', content: largeBundle },
    ])

    const promoted = await promoteSkillDraftToPublishedCurrent('team-1/bot-1/weather')
    expect(promoted).toEqual({
      configured: true,
      promoted: 2,
      deleted: 0,
    })

    const published = await readPublishedSkillPackageFromR2('team-1/bot-1/weather')
    expect(published.objects.map((o) => o.key).sort()).toEqual([
      '.docsbot/bundle/index.js',
      'SKILL.md',
    ])
    expect(published.files).toEqual([
      {
        path: '.docsbot/bundle/index.js',
        content: `[Skipped: object is ${Buffer.byteLength(largeBundle, 'utf8')} bytes; max 524288 for UI preview.]`,
        truncated: true,
      },
      { path: 'SKILL.md', content: '# Weather\n', truncated: false },
    ])
  })

  it('copies published skill packages into and out of the library prefix', async () => {
    const {
      copyLibrarySkillPackageToDraftAndPublished,
      copyPublishedSkillPackageToLibrary,
      deleteSkillLibraryPackageFromR2,
      getSkillLibraryPublishedR2Prefix,
      getSkillLibraryR2RootPrefix,
      promoteSkillDraftToPublishedCurrent,
      readPublishedSkillPackageFromR2,
      readSkillDraftPackageFromR2,
      writeSkillDraftFilesToR2,
    } = await import('@/lib/skills-r2-package')

    expect(getSkillLibraryR2RootPrefix('weather')).toBe('library/skills/weather')
    expect(getSkillLibraryPublishedR2Prefix('weather')).toBe(
      'library/skills/weather/published/current/',
    )

    await writeSkillDraftFilesToR2('team-1/bot-1/weather', [
      { path: 'SKILL.md', content: '# Weather\n' },
      { path: 'scripts/index.ts', content: 'export const run = true\n' },
    ])
    await promoteSkillDraftToPublishedCurrent('team-1/bot-1/weather')

    const libraryCopy = await copyPublishedSkillPackageToLibrary('team-1/bot-1/weather', 'weather')
    expect(libraryCopy).toEqual({
      configured: true,
      copied: 2,
      deleted: 0,
    })
    expect([...mocks.objects.keys()].sort()).toContain(
      'library/skills/weather/published/current/SKILL.md',
    )

    const importedCopy = await copyLibrarySkillPackageToDraftAndPublished(
      'weather',
      'team-2/bot-2/weather',
    )
    expect(importedCopy).toEqual({
      configured: true,
      draftCopied: 2,
      draftDeleted: 0,
      publishedCopied: 2,
      publishedDeleted: 0,
      message: undefined,
    })

    const importedDraft = await readSkillDraftPackageFromR2('team-2/bot-2/weather')
    expect(importedDraft.files.map((file) => file.path).sort()).toEqual([
      'SKILL.md',
      'scripts/index.ts',
    ])
    const importedPublished = await readPublishedSkillPackageFromR2('team-2/bot-2/weather')
    expect(importedPublished.files.map((file) => file.path).sort()).toEqual([
      'SKILL.md',
      'scripts/index.ts',
    ])

    const deleted = await deleteSkillLibraryPackageFromR2('weather')
    expect(deleted.configured).toBe(true)
    expect(deleted.deleted).toBe(3)
    expect([...mocks.objects.keys()].some((key) => key.startsWith('library/skills/weather/'))).toBe(
      false,
    )
  })
})
