import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()

const RATE_LIMIT = 2 // 3 requests per RATE_LIMIT_TIME minutes
const RATE_LIMIT_TIME = 1440 // in minutes
const LOGGED_IN_RATE_LIMIT = 6 // 6 requests per RATE_LIMIT_TIME minutes for logged-in users

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
export const checkFAQsRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore.collection('FAQs').where('ip', '==', ip).where('createdAt', '>', timeDelta).get()

  return lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
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
export const checkYoutubeRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-summaries')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
}


export const lookupYoutubeBlogPost = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const ref = await firestore.collection('yt-blog-posts').doc(videoId).get()
  const data = ref.exists ? ref.data() : null;
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  return data;
}

export const saveYoutubeBlogPost = async (ip, videoId, blogPostData) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  await firestore
    .collection('yt-blog-posts')
    .doc(videoId)
    .set({
      ip,
      ...blogPostData,
      thumbnail: thumbnailUrl,
      createdAt: FieldValue.serverTimestamp(),
    })
}

/* returns true if ip exceeds rate limit */
export const checkYoutubeBlogPostRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-blog-posts')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
}

// Add this new function
export const getRecentSummarizedVideos = async () => {
  const ref = await firestore
    .collection('yt-summaries')
    .orderBy('createdAt', 'desc')
    .select('title')
    .limit(9)
    .get()

  let videos = []
  ref.forEach((doc) => {
    const data = doc.data()
    videos.push({
      id: doc.id,
      title: data.title,
    })
  })
  return videos
}

// Add this new function
export const getRecentVideoBlogPosts = async () => {
  const ref = await firestore
    .collection('yt-blog-posts')
    .orderBy('createdAt', 'desc')
    .select('title')
    .limit(9)
    .get()

  let blogPosts = []
  ref.forEach((doc) => {
    const data = doc.data()
    blogPosts.push({
      id: doc.id,
      title: data.title,
    })
  })
  return blogPosts
}