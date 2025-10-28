import crypto from 'crypto'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const CACHE_COLLECTION = 'web-cache'
const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000

const firestore = () => getFirestore()

const ensureUrl = (value) => {
  if (!value) {
    return ''
  }

  const trimmed = value.toString().trim()
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export const normalizeCacheKey = (input, { includePath = true } = {}) => {
  const value = ensureUrl(input)
  if (!value) {
    return ''
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase()

    if (!includePath) {
      return hostname
    }

    let pathname = url.pathname || ''
    pathname = pathname.replace(/\/+/g, '/').replace(/\/+$/g, '')
    if (pathname === '/' || pathname === '') {
      pathname = ''
    }

    const normalized = `${hostname}${pathname}`
    return normalized
  } catch (error) {
    return value.replace(/^www\./i, '').toLowerCase()
  }
}

const createCacheId = (type, normalizedKey) => {
  return crypto.createHash('sha256').update(`${type}:${normalizedKey}`).digest('hex')
}

export const getCacheEntry = async (type, rawKey, options = {}) => {
  const normalizedKey = normalizeCacheKey(rawKey, options)
  if (!normalizedKey) {
    return null
  }

  const cacheId = createCacheId(type, normalizedKey)
  const docRef = firestore().collection(CACHE_COLLECTION).doc(cacheId)
  const snapshot = await docRef.get()

  if (!snapshot.exists) {
    return null
  }

  const data = snapshot.data() || {}
  const expiresAt = data.expiresAt?.toDate?.()

  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    docRef.delete().catch(() => null)
    return null
  }

  return {
    data: data.data ?? null,
    metadata: {
      id: snapshot.id,
      type: data.type ?? type,
      key: data.key ?? normalizedKey,
      createdAt: data.createdAt?.toDate?.() ?? null,
      expiresAt,
    },
  }
}

export const setCacheEntry = async (type, rawKey, value, options = {}) => {
  const normalizedKey = normalizeCacheKey(rawKey, options)
  if (!normalizedKey) {
    return null
  }

  const cacheId = createCacheId(type, normalizedKey)
  const docRef = firestore().collection(CACHE_COLLECTION).doc(cacheId)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + ONE_MONTH_IN_MS)

  const payload = {
    type,
    key: normalizedKey,
    data: value,
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  }

  await docRef.set(payload)
  return payload
}

