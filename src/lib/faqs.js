import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()

export const lookupFAQs = async (url) => {
  const ref = await firestore.collection('FAQs').doc(encodeURIComponent(url)).get()
  return ref.exists ? ref.data() : null
}

export const saveFAQs = async (ip, url, screenCap, thumbnail, summary, FAQs) => {
  await firestore.collection('FAQs').doc(encodeURIComponent(url)).set({
    ip,
    url,
    screenCap,
    summary,
    thumbnail,
    FAQs,
    createdAt: FieldValue.serverTimestamp(),
  })
}

const RATE_LIMIT = 3 // 3 requests per RATE_LIMIT_TIME minutes
const RATE_LIMIT_TIME = 60 // in minutes
/* returns true if ip exceeds rate limit */
export const checkFAQsRateLimit = async (ip) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore.collection('FAQs').where('ip', '==', ip).where('createdAt', '>', timeDelta).get()

  return lookupQuery.docs.length >= RATE_LIMIT
}

// returns 9 most recent FAQs
export const getRecentFAQs = async () => {
  const ref = await firestore.collection('FAQs').orderBy('createdAt', 'desc').select('url').limit(9).get()
  let FAQs = []
  ref.forEach((doc) => {
    FAQs.push(doc.data())
  })
  return FAQs
}