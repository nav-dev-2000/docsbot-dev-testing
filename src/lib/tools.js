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

export const saveImage = async (ip, type, descriptionData) => {
  await firestore
    .collection('image-tools')
    .add({
      ip,
      type,
      ...descriptionData,
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

/* returns true if ip exceeds rate limit */
export const checkImageRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('image-tools')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT) * 3 //we have 3 image tools
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

// Add this new function
export const fetchYoutubeSubtitles = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }

  const apiEndpoint = 'https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items?timeout=60&maxItems=3&token=' + process.env.APIFY_TOKEN

  const requestBody = {
    startUrls: [
      {
        url: `https://www.youtube.com/watch?v=${videoId}`
      }
    ],
    downloadSubtitles: true,
    subtitlesLanguage: "any",
    subtitlesFormat: "plaintext",
    preferAutoGeneratedSubtitles: false,
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.log('HTTP error:', response.status) // Log the raw response
      throw new Error('HTTP error')
    }

    const responseText = await response.text()

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError)
      throw new Error('Error fetching YouTube subtitles')
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data found for this video')
    }

    const videoData = data[0]

    // Extract metadata
    const metadata = {
      title: videoData.title,
      description: videoData.text,
      thumbnail: videoData.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: videoData.duration,
      viewCount: videoData.viewCount,
      likes: videoData.likes,
      commentsCount: videoData.commentsCount,
      channelName: videoData.channelName,
      channelUrl: videoData.channelUrl,
      numberOfSubscribers: videoData.numberOfSubscribers,
      date: videoData.date,
    }

    // Get English subtitles (including variants like en-US) or the first available language
    let subtitles = ''
    if (videoData.subtitles && videoData.subtitles.length > 0) {
      const englishSubtitles = videoData.subtitles.filter(sub => sub.language.startsWith('en'))
      if (englishSubtitles.length > 0) {
        // Use only the first English subtitle
        subtitles = englishSubtitles[0].plaintext
      } else {
        // If no English subtitles, use the first available language
        subtitles = videoData.subtitles[0].plaintext
      }
    }

    return { metadata, subtitles }
  } catch (error) {
    console.error('Error fetching YouTube subtitles:', error)
    throw error
  }
}