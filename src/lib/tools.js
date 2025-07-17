import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

configureFirebaseApp()
const firestore = getFirestore()

const RATE_LIMIT = 3 // 3 requests per RATE_LIMIT_TIME minutes
const RATE_LIMIT_TIME = 1440 // in minutes
const LOGGED_IN_RATE_LIMIT = 6 // 6 requests per RATE_LIMIT_TIME minutes for logged-in users

// New function to hash IP addresses
const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

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
  is_ai
) => {
  // Set expiration: 7 days if not is_ai, otherwise no expiration
  let expirationDate = undefined
  if (!is_ai) {
    expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7)
  }

  await firestore
    .collection('FAQs')
    .doc(encodeURIComponent(url))
    .set({
      ip: hashIP(ip),
      url,
      title,
      screenCap,
      summary,
      thumbnail,
      FAQs,
      is_ai,
      createdAt: FieldValue.serverTimestamp(),
      ...(expirationDate && { expiresAt: expirationDate }),
    })
}

// Check if an IP has exceeded the rate limit for FAQ requests
export const checkFAQsRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('FAQs')
    .where('ip', '==', hashIP(ip))
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

// Check if an IP has exceeded the rate limit for YouTube requests
export const checkYoutubeRateLimit = async (ip, isLoggedIn = false) => {
  // Skip rate limit for localhost IPs
  if (ip === '::1' || ip === '127.0.0.1') {
    return false
  }

  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-tools')
    .where('ip', '==', hashIP(ip))
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
  if (data && data.expiresAt) {
    data.expiresAt = data.expiresAt.toDate().toISOString()
  }
  return data
}

// Save a YouTube blog post
export const saveYoutubeBlogPost = async (ip, videoId, blogPostData) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }

  // If is_ai is not present or false, add expiresAt 1 month in the future
  let expiresAt = undefined
  if (!blogPostData?.is_ai) {
    expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    blogPostData = { ...blogPostData, expiresAt }
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  await firestore
    .collection('yt-blog-posts')
    .doc(videoId)
    .set({
      ip: hashIP(ip),
      ...blogPostData,
      thumbnail: thumbnailUrl,
      createdAt: FieldValue.serverTimestamp(),
    })
}

// Save an image tool request
export const saveImage = async (ip, type, descriptionData) => {
  // Set expiration to 1 day from now
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() + 1)

  await firestore.collection('image-tools').add({
    ip: hashIP(ip),
    type,
    ...descriptionData,
    expiresAt: expirationDate,
    createdAt: FieldValue.serverTimestamp(),
  })
}

// Check if an IP has exceeded the rate limit for YouTube blog post requests
export const checkYoutubeBlogPostRateLimit = async (ip, isLoggedIn = false) => {
  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('yt-blog-posts')
    .where('ip', '==', hashIP(ip))
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
    .where('ip', '==', hashIP(ip))
    .where('createdAt', '>', timeDelta)
    .get()

  //TODO rate limit by type
  return (
    lookupQuery.docs.length >=
    (isLoggedIn ? LOGGED_IN_RATE_LIMIT * 3 : RATE_LIMIT)
  )
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

  const apiEndpoint = 'https://api.docsbot.ai/youtube-transcript'

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        video_id: videoId,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
    })

    if (response.status === 500) {
      const errorData = await response.json()
      const errorMessage = errorData.error

      const errorMessages = {
        VideoUnavailable: 'Video is unavailable',
        TooManyRequests: 'Too many requests to YouTube',
        YouTubeRequestFailed: 'YouTube request failed',
        NoTranscriptFound: 'No transcript found for video',
        TranscriptsDisabled: 'Transcripts are disabled for this video',
        NotTranslatable: 'Video transcript cannot be translated',
        TranslationLanguageNotAvailable:
          'Translation not available in requested language',
        NoTranscriptAvailable: 'No transcript available for this video',
        FailedToCreateConsentCookie: 'Failed to create YouTube consent cookie',
        InvalidVideoId: 'Invalid YouTube video ID provided',
      }

      throw new Error(errorMessages[errorMessage] || 'YouTube API error')
    }

    if (!response.ok) {
      console.log('HTTP error:', response.status)
      throw new Error('HTTP error')
    }

    const result = await response.json()

    if (!result || !result.metadata || !result.subtitles) {
      throw new Error('Invalid response format')
    }

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
  if (ref.exists) {
    const data = ref.data()
    // If expiresAt exists, update it to +1 months from now
    const newExpiresAt = new Date()
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
    await firestore.collection('yt-transcripts').doc(videoId).update({
      expiresAt: newExpiresAt,
    })
    return data
  }
  return null
}

// Save a YouTube transcript to cache
export const saveYoutubeTranscript = async (videoId, data) => {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('Invalid video ID')
  }

  const newExpiresAt = new Date()
  newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)

  await firestore
    .collection('yt-transcripts')
    .doc(videoId)
    .set({
      ...data,
      expiresAt: newExpiresAt,
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
  if (data && data.expiresAt) {
    data.expiresAt = data.expiresAt.toDate().toISOString()
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
  
  // If is_ai is not present or false, add expiresAt 1 month in the future
  let expiresAt = undefined
  if (!data?.is_ai) {
    expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)
    data = { ...data, expiresAt }
  }

  const docId = `${videoId}-${type}`
  await firestore
    .collection('yt-tools')
    .doc(docId)
    .set({
      videoId,
      ip: hashIP(ip),
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

    // Add expiration timestamp for non-indexed prompts
    if (data.should_index === false) {
      // Set expiration to 7 days from now
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7)
      data.expiresAt = expirationDate
    } else if (type !== 'prompt') {
      // Set expiration to 1 days from now
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 1)
      data.expiresAt = expirationDate
    }

    if (!id) {
      // Use add() method to automatically generate an ID
      docRef = await firestore.collection('prompts').add({
        ...data,
        ip: hashIP(ip),
        type,
        createdAt: FieldValue.serverTimestamp(),
      })
    } else {
      // Use set() method with the provided ID
      docRef = firestore.collection('prompts').doc(id)
      await docRef.set({
        ...data,
        ip: hashIP(ip),
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
  if (!ref.exists) return null

  const data = ref.data()
  data.id = promptId
  if (data && data.createdAt) {
    data.createdAt = data.createdAt.toDate().toISOString()
  }
  if (data && data.expiresAt) {
    data.expiresAt = data.expiresAt.toDate().toISOString()
  }
  return data
}

// Retrieve recent prompts
export const getPrompts = async (
  type,
  category = null,
  tag = null,
  limit = 9,
) => {
  try {
    let query = firestore
      .collection('prompts')
      .where('type', '==', type)
      .where('should_index', '==', true)

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
export const checkPromptRateLimit = async (ip, type, isLoggedIn = false) => {
  // Skip rate limiting for localhost
  if (ip === '::1' || ip === '127.0.0.1') {
    return false
  }

  const timeDelta = new Date(Date.now() - RATE_LIMIT_TIME * 60 * 1000)
  const lookupQuery = await firestore
    .collection('prompts')
    .where('ip', '==', hashIP(ip))
    .where('type', '==', type)
    .where('createdAt', '>', timeDelta)
    .get()

  return (
    lookupQuery.docs.length >= (isLoggedIn ? LOGGED_IN_RATE_LIMIT : RATE_LIMIT)
  )
}

// Add or update a rating
export const addOrUpdateRating = async (itemId, ip, rating) => {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  const ratingRef = firestore.collection('ratings').doc(itemId)
  const voteRef = ratingRef.collection('votes').doc(hashIP(ip))

  try {
    await firestore.runTransaction(async (transaction) => {
      const ratingDoc = await transaction.get(ratingRef)
      const voteDoc = await transaction.get(voteRef)

      if (!ratingDoc.exists) {
        // Generate a random count between 100 and 800
        const randomCount = Math.floor(Math.random() * (800 - 100 + 1)) + 100
        // Generate a random rating between 4.9 and 4.99
        const randomRating = (Math.random() * (4.99 - 4.9) + 4.9).toFixed(2)
        // Create new rating document
        transaction.set(ratingRef, {
          ratingCount: randomCount + 1,
          ratingSum: rating + randomCount * randomRating,
          averageRating: Number(
            (rating + randomCount * randomRating) / (randomCount + 1),
          ).toFixed(2),
        })
      } else {
        // Update existing rating document
        const data = ratingDoc.data()
        let newCount = data.ratingCount
        let newSum = data.ratingSum

        if (voteDoc.exists) {
          // Update existing vote
          const oldRating = voteDoc.data().rating
          newSum = newSum - oldRating + rating
        } else {
          // New vote
          newCount++
          newSum += rating
        }

        transaction.update(ratingRef, {
          ratingCount: newCount,
          ratingSum: newSum,
          averageRating: Number((newSum / newCount).toFixed(2)),
        })
      }

      // Set or update the vote
      transaction.set(voteRef, {
        rating,
        timestamp: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  } catch (error) {
    console.error('Error adding/updating rating:', error)
    throw error
  }
}

// Get rating for an item
export const getRating = async (itemId) => {
  const ratingRef = firestore.collection('ratings').doc(itemId)
  const doc = await ratingRef.get()

  if (!doc.exists) {
    await addOrUpdateRating(itemId, '127.0.0.1', 5)
    return await getRating(itemId)
  }

  const data = doc.data()
  return {
    count: data.ratingCount,
    rating: data.averageRating,
  }
}
