import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()

const RATE_LIMIT = 3 // 3 requests per RATE_LIMIT_TIME minutes
const RATE_LIMIT_TIME = 120 // in minutes

export const lookupFAQs = async (url) => {
  const ref = await firestore.collection('FAQs').doc(encodeURIComponent(url)).get()
  return ref.exists ? ref.data() : null
}

export const saveFAQs = async (ip, url, title, screenCap, thumbnail, summary, FAQs) => {
  await firestore.collection('FAQs').doc(encodeURIComponent(url)).set({
    ip,
    url,
    title,
    screenCap,
    summary,
    thumbnail,
    FAQs,
    createdAt: FieldValue.serverTimestamp(),
  })
}

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


export const lookupYoutubeSummary = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const ref = await firestore.collection('yt-summaries').doc(videoId).get()
  const data = ref.exists ? ref.data() : null;
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  return data;
}

export const saveYoutubeSummary = async (ip, videoId, summaryData) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  await firestore
    .collection('yt-summaries')
    .doc(videoId)
    .set({
      ip,
      ...summaryData,
      thumbnail: thumbnailUrl,
      createdAt: FieldValue.serverTimestamp(),
    })
}

/* returns true if ip exceeds rate limit */
export const checkYoutubeRateLimit = async (ip) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-summaries')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return lookupQuery.docs.length >= RATE_LIMIT
}