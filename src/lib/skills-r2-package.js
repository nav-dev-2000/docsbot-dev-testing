import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const MAX_TEXT_BYTES = 512 * 1024
const DELETE_BATCH_SIZE = 1000
const SKILLS_LIBRARY_ROOT_PREFIX = 'library/skills'

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.SKILLS_R2_BUCKET || process.env.R2_SKILLS_BUCKET

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  }
}

export function isR2PackageConfigured() {
  return Boolean(getR2Config())
}

function getClient(config) {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

function normalizeRootPrefix(prefix) {
  return String(prefix || '').replace(/^\/+|\/+$/g, '')
}

function buildScopedPrefix(rootPrefix, scope) {
  const root = normalizeRootPrefix(rootPrefix)
  if (!root) return ''
  return `${root}/${scope.replace(/^\/+|\/+$/g, '')}/`
}

export function getSkillDraftR2Prefix(rootPrefix) {
  return buildScopedPrefix(rootPrefix, 'draft')
}

export function getSkillPublishedR2Prefix(rootPrefix) {
  return buildScopedPrefix(rootPrefix, 'published/current')
}

export function getSkillLibraryR2RootPrefix(skillName) {
  const name = normalizeRootPrefix(skillName)
  return name ? `${SKILLS_LIBRARY_ROOT_PREFIX}/${name}` : ''
}

export function getSkillLibraryPublishedR2Prefix(skillName) {
  return getSkillPublishedR2Prefix(getSkillLibraryR2RootPrefix(skillName))
}

function buildDraftObjectKey(rootPrefix, relativePath) {
  const scope = getSkillDraftR2Prefix(rootPrefix)
  const path = String(relativePath || '').replace(/^\/+/, '')
  return scope && path ? `${scope}${path}` : ''
}

function buildTextPutObjectInput({ bucket, key, body = '', contentType }) {
  const text = String(body ?? '')

  return {
    Bucket: bucket,
    Key: key,
    Body: text,
    ContentType: contentType,
    ContentLength: Buffer.byteLength(text, 'utf8'),
  }
}

async function streamToString(body) {
  if (!body) return ''
  if (typeof body.transformToString === 'function') {
    return body.transformToString('utf-8')
  }
  const chunks = []
  for await (const chunk of body) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

async function listObjects(client, config, prefix) {
  return listObjectsInternal(client, config, prefix, false)
}

async function listObjectsIncludingDirectoryMarkers(client, config, prefix) {
  return listObjectsInternal(client, config, prefix, true)
}

async function listObjectsInternal(client, config, prefix, includeDirectoryMarkers) {
  const objects = []
  let continuationToken

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    )

    for (const obj of list.Contents || []) {
      if (obj.Key && (includeDirectoryMarkers || !obj.Key.endsWith('/'))) {
        objects.push({ key: obj.Key, size: obj.Size ?? 0 })
      }
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)

  return objects
}

async function ensurePrefixMarker(client, config, normalizedPrefix) {
  if (!normalizedPrefix) return

  await client.send(
    new PutObjectCommand(
      buildTextPutObjectInput({
        bucket: config.bucket,
        key: normalizedPrefix,
        body: '',
        contentType: 'application/x-directory',
      }),
    ),
  )
}

async function readTextFilesUnderPrefix(prefix, options = {}) {
  const config = getR2Config()
  if (!config) {
    return {
      configured: false,
      message:
        'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
      objects: [],
      files: [],
    }
  }

  const normalizedPrefix = String(prefix || '').replace(/^\/+/, '')
  const pathFilter = typeof options.pathFilter === 'function' ? options.pathFilter : null
  if (!normalizedPrefix) {
    return {
      configured: true,
      objects: [],
      files: [],
    }
  }

  const client = getClient(config)
  const rawObjects = await listObjects(client, config, normalizedPrefix)
  const objects = rawObjects
    .map(({ key, size }) => {
      const rel = key.startsWith(normalizedPrefix) ? key.slice(normalizedPrefix.length) : key
      return { key: rel, size }
    })
    .filter((o) => o.key && !o.key.endsWith('/') && (!pathFilter || pathFilter(o.key)))

  const files = (
    await Promise.all(
      rawObjects.map(async ({ key, size }) => {
        const relativePath = key.startsWith(normalizedPrefix) ? key.slice(normalizedPrefix.length) : key

        if (!relativePath || relativePath.endsWith('/')) return null
        if (pathFilter && !pathFilter(relativePath)) return null

        if (size > MAX_TEXT_BYTES) {
          return {
            path: relativePath,
            content: `[Skipped: object is ${size} bytes; max ${MAX_TEXT_BYTES} for UI preview.]`,
            truncated: true,
          }
        }

        const get = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        )

        const raw = await streamToString(get.Body)
        const isProbablyText = !raw.includes('\0') || raw.length < 64

        return {
          path: relativePath,
          content: isProbablyText ? raw : `[Binary or non-UTF8 content, ${size} bytes]`,
          truncated: Boolean(!isProbablyText),
        }
      }),
    )
  ).filter(Boolean)

  files.sort((a, b) => a.path.localeCompare(b.path))

  return {
    configured: true,
    objects,
    files,
  }
}

async function deleteKeys(config, keys = []) {
  if (keys.length === 0) return 0

  const client = getClient(config)
  let deleted = 0

  for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
    const batch = keys.slice(i, i + DELETE_BATCH_SIZE)
    const out = await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )

    deleted += batch.length - (out.Errors?.length || 0)
    if (out.Errors?.length) {
      const first = out.Errors[0]
      throw new Error(
        first?.Message ||
          `R2 delete failed for ${first?.Key || 'object'} (${first?.Code || 'Unknown'}).`,
      )
    }
  }

  return deleted
}

function buildCopySource(bucket, key) {
  const normalizedBucket = String(bucket || '').trim()
  const normalizedKey = String(key || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${normalizedBucket}/${normalizedKey}`
}

async function writeTextFilesUnderPrefix(prefix, files = []) {
  const config = getR2Config()
  if (!config) {
    throw new Error(
      'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    )
  }

  const normalizedPrefix = String(prefix || '').replace(/^\/+/, '')
  if (!normalizedPrefix) {
    throw new Error('R2 prefix is required.')
  }

  const client = getClient(config)
  const existingObjects = await listObjects(client, config, normalizedPrefix)
  const nextKeys = new Set()

  await ensurePrefixMarker(client, config, normalizedPrefix)

  for (const file of files) {
    const relativePath = String(file?.path || '').replace(/^\/+/, '')
    if (!relativePath) continue

    const key = `${normalizedPrefix}${relativePath}`
    nextKeys.add(key)

    await client.send(
      new PutObjectCommand(
        buildTextPutObjectInput({
          bucket: config.bucket,
          key,
          body: file?.content,
          contentType: 'text/plain; charset=utf-8',
        }),
      ),
    )
  }

  const obsoleteKeys = existingObjects
    .map((object) => object.key)
    .filter((key) => !nextKeys.has(key))

  await deleteKeys(config, obsoleteKeys)

  return {
    configured: true,
    written: nextKeys.size,
    deleted: obsoleteKeys.length,
  }
}

async function copyObjectsBetweenPrefixes(sourcePrefix, destinationPrefix) {
  const config = getR2Config()
  if (!config) {
    return {
      configured: false,
      copied: 0,
      deleted: 0,
      message:
        'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    }
  }

  const normalizedSourcePrefix = String(sourcePrefix || '').replace(/^\/+/, '')
  const normalizedDestinationPrefix = String(destinationPrefix || '').replace(/^\/+/, '')
  if (!normalizedSourcePrefix || !normalizedDestinationPrefix) {
    return {
      configured: true,
      copied: 0,
      deleted: 0,
    }
  }

  const client = getClient(config)
  const sourceObjects = await listObjects(client, config, normalizedSourcePrefix)
  const sourceFileObjects = sourceObjects.filter(({ key }) => {
    const relativePath = key.startsWith(normalizedSourcePrefix)
      ? key.slice(normalizedSourcePrefix.length)
      : ''
    return Boolean(relativePath && !relativePath.endsWith('/'))
  })
  if (sourceFileObjects.length === 0) {
    return {
      configured: true,
      copied: 0,
      deleted: 0,
    }
  }

  const destinationObjects = await listObjects(client, config, normalizedDestinationPrefix)
  const nextDestinationKeys = new Set()

  await ensurePrefixMarker(client, config, normalizedDestinationPrefix)

  for (const { key } of sourceFileObjects) {
    const relativePath = key.startsWith(normalizedSourcePrefix)
      ? key.slice(normalizedSourcePrefix.length)
      : ''
    if (!relativePath || relativePath.endsWith('/')) {
      continue
    }

    const destinationKey = `${normalizedDestinationPrefix}${relativePath}`
    nextDestinationKeys.add(destinationKey)

    await client.send(
      new CopyObjectCommand({
        Bucket: config.bucket,
        Key: destinationKey,
        CopySource: buildCopySource(config.bucket, key),
      }),
    )
  }

  const obsoleteKeys = destinationObjects
    .map((object) => object.key)
    .filter((key) => !nextDestinationKeys.has(key))

  const deleted = await deleteKeys(config, obsoleteKeys)

  return {
    configured: true,
    copied: nextDestinationKeys.size,
    deleted,
  }
}

export async function readSkillDraftPackageFromR2(rootPrefix, options) {
  return readTextFilesUnderPrefix(getSkillDraftR2Prefix(rootPrefix), options)
}

export async function readPublishedSkillPackageFromR2(rootPrefix, options) {
  return readTextFilesUnderPrefix(getSkillPublishedR2Prefix(rootPrefix), options)
}

export async function writeSkillDraftFilesToR2(rootPrefix, files = []) {
  return writeTextFilesUnderPrefix(getSkillDraftR2Prefix(rootPrefix), files)
}

export async function ensureSkillDraftPrefixMarkerInR2(rootPrefix) {
  const config = getR2Config()
  if (!config) {
    throw new Error(
      'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    )
  }

  const normalizedPrefix = getSkillDraftR2Prefix(rootPrefix)
  if (!normalizedPrefix) {
    throw new Error('R2 prefix is required.')
  }

  const client = getClient(config)
  await ensurePrefixMarker(client, config, normalizedPrefix)

  return {
    configured: true,
    marker: normalizedPrefix,
  }
}

export async function writeSkillDraftFileToR2(rootPrefix, file) {
  const current = await readSkillDraftPackageFromR2(rootPrefix)
  const files = Array.isArray(current.files) ? current.files.filter((entry) => entry.path !== file?.path) : []
  files.push({
    path: String(file?.path || ''),
    content: String(file?.content ?? ''),
  })
  return writeSkillDraftFilesToR2(rootPrefix, files)
}

export async function deleteSkillDraftFileFromR2(rootPrefix, relativePath) {
  const config = getR2Config()
  if (!config) {
    throw new Error(
      'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    )
  }

  const key = buildDraftObjectKey(rootPrefix, relativePath)
  if (!key) return { configured: true, deleted: 0 }

  const deleted = await deleteKeys(config, [key])
  return { configured: true, deleted }
}

export async function promoteSkillDraftToPublishedCurrent(rootPrefix) {
  const config = getR2Config()
  if (!config) {
    return {
      configured: false,
      promoted: 0,
      deleted: 0,
      message:
        'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    }
  }

  const client = getClient(config)
  const draftPrefix = getSkillDraftR2Prefix(rootPrefix)
  const publishedPrefix = getSkillPublishedR2Prefix(rootPrefix)

  if (!draftPrefix || !publishedPrefix) {
    return {
      configured: true,
      promoted: 0,
      deleted: 0,
    }
  }

  const draftObjects = await listObjects(client, config, draftPrefix)
  const publishedObjects = await listObjects(client, config, publishedPrefix)
  const nextPublishedKeys = new Set()

  await ensurePrefixMarker(client, config, publishedPrefix)

  for (const { key } of draftObjects) {
    const relativePath = key.startsWith(draftPrefix) ? key.slice(draftPrefix.length) : ''
    if (!relativePath || relativePath.endsWith('/')) {
      continue
    }

    const publishedKey = `${publishedPrefix}${relativePath}`
    nextPublishedKeys.add(publishedKey)

    await client.send(
      new CopyObjectCommand({
        Bucket: config.bucket,
        Key: publishedKey,
        CopySource: buildCopySource(config.bucket, key),
      }),
    )
  }

  const obsoleteKeys = publishedObjects
    .map((object) => object.key)
    .filter((key) => !nextPublishedKeys.has(key))

  const deleted = await deleteKeys(config, obsoleteKeys)

  return {
    configured: true,
    promoted: nextPublishedKeys.size,
    deleted,
  }
}

export async function copyPublishedSkillPackageToLibrary(sourceRootPrefix, librarySkillName) {
  return copyObjectsBetweenPrefixes(
    getSkillPublishedR2Prefix(sourceRootPrefix),
    getSkillLibraryPublishedR2Prefix(librarySkillName),
  )
}

export async function copyLibrarySkillPackageToDraftAndPublished(librarySkillName, destinationRootPrefix) {
  const libraryPublishedPrefix = getSkillLibraryPublishedR2Prefix(librarySkillName)
  const draft = await copyObjectsBetweenPrefixes(
    libraryPublishedPrefix,
    getSkillDraftR2Prefix(destinationRootPrefix),
  )
  if (!draft.configured) return draft

  const published = await copyObjectsBetweenPrefixes(
    libraryPublishedPrefix,
    getSkillPublishedR2Prefix(destinationRootPrefix),
  )

  return {
    configured: published.configured,
    draftCopied: draft.copied,
    draftDeleted: draft.deleted,
    publishedCopied: published.copied,
    publishedDeleted: published.deleted,
    message: published.message,
  }
}

export async function deleteSkillLibraryPackageFromR2(librarySkillName) {
  return deleteSkillPrefixFromR2(getSkillLibraryR2RootPrefix(librarySkillName))
}

export async function deleteSkillPrefixFromR2(rootPrefix) {
  const config = getR2Config()
  if (!config) {
    return {
      configured: false,
      deleted: 0,
      message:
        'R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and SKILLS_R2_BUCKET (or R2_SKILLS_BUCKET).',
    }
  }

  const normalizedPrefix = normalizeRootPrefix(rootPrefix)
  if (!normalizedPrefix) {
    return { configured: true, deleted: 0 }
  }

  const client = getClient(config)
  const keys = (
    await listObjectsIncludingDirectoryMarkers(client, config, `${normalizedPrefix}/`)
  ).map((object) => object.key)
  const deleted = await deleteKeys(config, keys)

  return { configured: true, deleted }
}
