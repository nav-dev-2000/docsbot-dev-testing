import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()

const RATE_LIMIT = 2 // 3 requests per RATE_LIMIT_TIME minutes
const RATE_LIMIT_TIME = 1440 // in minutes
const LOGGED_IN_RATE_LIMIT = 6 // 6 requests per RATE_LIMIT_TIME minutes for logged-in users

// Lookup FAQs for a given URL
export const lookupFAQs = async (url) => {
  const ref = await firestore
    .collection('FAQs')
    .doc(encodeURIComponent(url))
    .get()
  return ref.exists ? ref.data() : null
}

// Save FAQs for a given URL
export const saveFAQs = async (
  ip,
  url,
  title,
  screenCap,
  thumbnail,
  summary,
  FAQs,
) => {
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

// Check if an IP has exceeded the rate limit for FAQ requests
export const checkFAQsRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('FAQs')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
  )
}

// Retrieve the 9 most recent FAQs
export const getRecentFAQs = async () => {
  const ref = await firestore
    .collection('FAQs')
    .orderBy('createdAt', 'desc')
    .select('url')
    .limit(9)
    .get()
  let FAQs = []
  ref.forEach((doc) => {
    FAQs.push(doc.data())
  })
  return FAQs
}

// Lookup a YouTube video summary by video ID
export const lookupYoutubeSummary = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const ref = await firestore.collection('yt-summaries').doc(videoId).get()
  const data = ref.exists ? ref.data() : null
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString()
  }
  return data
}

// Save a YouTube video summary
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
      type: 'summary',
      thumbnail: thumbnailUrl,
      createdAt: FieldValue.serverTimestamp(),
    })
}

// Check if an IP has exceeded the rate limit for YouTube requests
export const checkYoutubeRateLimit = async (ip, isLoggedIn = false) => {
  // Skip rate limit for localhost IPs
  if (ip === '::1' || ip === '127.0.0.1') {
    return false
  }

  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-tools')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
  )
}

// Lookup a YouTube blog post by video ID
export const lookupYoutubeBlogPost = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const ref = await firestore.collection('yt-blog-posts').doc(videoId).get()
  const data = ref.exists ? ref.data() : null
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString()
    data.id = videoId
  }
  return data
}

// Save a YouTube blog post
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

// Save an image tool request
export const saveImage = async (ip, type, descriptionData) => {
  await firestore.collection('image-tools').add({
    ip,
    type,
    ...descriptionData,
    createdAt: FieldValue.serverTimestamp(),
  })
}

// Check if an IP has exceeded the rate limit for YouTube blog post requests
export const checkYoutubeBlogPostRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-blog-posts')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
  )
}

// Check if an IP has exceeded the rate limit for image tool requests
export const checkImageRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('image-tools')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >=
    (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT) * 3
  ) //we have 3 image tools
}

// Retrieve recent YouTube blog posts
export const getRecentVideoBlogPosts = async () => {
  try {
    const res = await firestore
      .collection('yt-blog-posts')
      .orderBy('createdAt', 'desc')
      .select('title')
      .limit(9)
      .get()

    let videos = []
    res.forEach((doc) => {
      const data = doc.data()
      videos.push({
        id: doc.id,
        title: data.title,
      })
    })

    const res2 = await firestore
      .collection('yt-blog-posts')
      .select('title')
      .where('is_ai', '==', true)
      .limit(50)
      .get()

    let aiVideos = []
    res2.forEach((doc) => {
      const data = doc.data()
      const id = doc.id

      if (!videos.some((video) => video.id === id)) {
        aiVideos.push({
          id,
          title: data.title,
        })
      }
    })

    return { videos, aiVideos }
  } catch (error) {
    console.error('Error fetching recent YouTube blog posts:', error)
    return { videos: [], aiVideos: [] } // Return empty arrays if there's an error
  }
}

// Fetch YouTube subtitles for a given video ID
export const fetchYoutubeSubtitles = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }

  // Check if transcript is already cached
  const cachedTranscript = await lookupYoutubeTranscript(videoId)
  if (cachedTranscript) {
    return cachedTranscript
  }

  const apiEndpoint =
    'https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items?timeout=60&maxItems=3&token=' +
    process.env.APIFY_TOKEN

  const requestBody = {
    startUrls: [
      {
        url: `https://www.youtube.com/watch?v=${videoId}`,
      },
    ],
    downloadSubtitles: true,
    subtitlesLanguage: 'any',
    subtitlesFormat: 'plaintext',
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
      thumbnail:
        videoData.thumbnailUrl ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
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
      const englishSubtitles = videoData.subtitles.filter((sub) =>
        sub.language.startsWith('en'),
      )
      if (englishSubtitles.length > 0) {
        // Use only the first English subtitle
        subtitles = englishSubtitles[0].plaintext
      } else {
        // If no English subtitles, use the first available language
        subtitles = videoData.subtitles[0].plaintext
      }
    }

    // If subtitles are still empty, use the backup API
    /* disabled for tools, apify is reliable
    if (!subtitles) {
      console.log('No subtitles found, using backup API')
      const backupApiEndpoint = 'https://www.searchapi.io/api/v1/search'
      const params = new URLSearchParams({
        engine: 'youtube_transcripts',
        video_id: videoId,
        lang: 'en',
        api_key: process.env.SEARCHAPI_KEY,
      })

      const backupResponse = await fetch(`${backupApiEndpoint}?${params}`)

      if (!backupResponse.ok) {
        throw new Error(
          'Error fetching YouTube subtitles, please try again later',
        )
      }

      const backupData = await backupResponse.json()

      if (backupData.transcripts && backupData.transcripts.length > 0) {
        subtitles = backupData.transcripts
          .map((segment) => segment.text)
          .join(' ')
      }
    }
    */

    const result = { metadata, subtitles }

    // Cache the transcript and metadata
    await saveYoutubeTranscript(videoId, result)

    return result
  } catch (error) {
    console.error('Error fetching YouTube subtitles:', error)
    throw error
  }
}

// Lookup a cached YouTube transcript by video ID
export const lookupYoutubeTranscript = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const ref = await firestore.collection('yt-transcripts').doc(videoId).get()
  return ref.exists ? ref.data() : null
}

// Save a YouTube transcript to cache
export const saveYoutubeTranscript = async (videoId, data) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  await firestore
    .collection('yt-transcripts')
    .doc(videoId)
    .set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    })
}

// Generic lookup function for YouTube data
export const lookupYoutubeData = async (videoId, type) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }
  const docId = `${videoId}-${type}`
  const ref = await firestore.collection('yt-tools').doc(docId).get()
  let data = ref.exists ? ref.data() : null
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString()
  }

  // Merge metadata from subtitles cache
  const subtitlesCache = await lookupYoutubeTranscript(videoId)
  if (data && subtitlesCache && subtitlesCache.metadata) {
    data = {
      ...data,
      metadata: subtitlesCache.metadata,
    }
  }

  return data
}

// Generic save function for YouTube data
export const saveYoutubeData = async (ip, videoId, type, title, data) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }

  const docId = `${videoId}-${type}`
  await firestore
    .collection('yt-tools')
    .doc(docId)
    .set({
      videoId,
      ip,
      type,
      createdAt: FieldValue.serverTimestamp(),
      title,
      ...data,
    })
}

// Retrieve recent YouTube videos of a specific type
export const getRecentYoutubeVideos = async (type) => {
  try {
    const res = await firestore
      .collection('yt-tools')
      .orderBy('createdAt', 'desc')
      .select('videoId', 'title', 'short_title')
      .where('type', '==', type)
      .limit(9)
      .get()

    let videos = []
    res.forEach((doc) => {
      const data = doc.data()
      videos.push({
        id: data.videoId,
        title: data.short_title || data.title,
      })
    })

    const res2 = await firestore
      .collection('yt-tools')
      .select('videoId', 'title', 'short_title')
      .where('type', '==', type)
      .where('is_ai', '==', true)
      .limit(50)
      .get()

    let aiVideos = []
    res2.forEach((doc) => {
      const data = doc.data()

      if (!videos.some((video) => video.id === data.videoId)) {
        aiVideos.push({
          id: data.videoId,
          title: data.short_title || data.title,
        })
      }
    })

    return { videos, aiVideos }
  } catch (error) {
    console.error('Error fetching recent YouTube videos:', error)
    return { videos: [], aiVideos: [] } // Return empty arrays if there's an error
  }
}

// Add a new prompt
export const addPrompt = async (ip, type = 'prompt', data, id = null) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for prompt')
    }

    let docRef

    if (!id) {
      // Use add() method to automatically generate an ID
      docRef = await firestore.collection('prompts').add({
        ...data,
        ip,
        type,
        createdAt: FieldValue.serverTimestamp(),
      })
    } else {
      // Use set() method with the provided ID
      docRef = firestore.collection('prompts').doc(id)
      await docRef.set({
        ...data,
        ip,
        type,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    return docRef.id
  } catch (error) {
    console.error('Error adding new prompt:', error)
    throw error
  }
}

// Lookup a prompt by ID
export const getPrompt = async (promptId) => {
  if (!promptId || typeof promptId !== 'string') {
    throw new Error('Invalid prompt ID')
  }
  const ref = await firestore.collection('prompts').doc(promptId).get()
  const data = ref.exists ? ref.data() : null
  data.id = promptId
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString()
  }
  return data
}

// Retrieve recent prompts
export const getPrompts = async (type, category = null, tag = null, limit = 9) => {
  try {
    let query = firestore.collection('prompts').where('type', '==', type).where('should_index', '==', true)

    if (category) {
      query = query.where('category', '==', category)
    }

    if (tag) {
      query = query.where('tags', 'array-contains', tag)
    }

    const res = await query.limit(limit).get()

    let prompts = []
    res.forEach((doc) => {
      const data = doc.data()
      prompts.push({
        id: doc.id,
        name: data.name || null,
        short_description: data.short_description || null,
        icon: data.icon || null,
        category: data.category || null,
        // Add any other fields you want to include in the recent prompts list
      })
    })

    return prompts
  } catch (error) {
    console.error('Error fetching recent prompts:', error)
    return [] // Return an empty array if there's an error
  }
}

// Check if an IP has exceeded the rate limit for prompt requests
export const checkPromptRateLimit = async (ip, isLoggedIn = false) => {
  // Skip rate limiting for localhost
  if (ip === '::1' || ip === '127.0.0.1') {
    return false;
  }

  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('prompts')
    .where('ip', '==', ip)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
  )
}
