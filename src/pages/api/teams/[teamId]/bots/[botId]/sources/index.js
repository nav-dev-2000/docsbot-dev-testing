import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import {
  getBot,
  getSources,
  getSource,
} from '@/lib/dbQueries'
import { stripePlan, checkPlanPermission, isSuperAdmin } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import {
  sourceTypes,
  isTrutoSourceType,
  YOUTUBE_PLAYLIST_REGEX,
} from '@/constants/sourceTypes.constants'
import { QueueSourceIngest, QueueSourceRegest } from '@/lib/service'
import { checkSourceScheduledFromInterval, isValidURL } from '@/utils/helpers'
import { canUserModifySources } from '@/utils/function.utils'
import { RunSyncJob, GetSyncJobID } from '@/lib/truto'
import {
  isVectorDbMaintenanceEnabled,
  vectorDbMaintenanceResponse,
} from '@/lib/maintenance'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  //create source
  if (req.method === 'POST') {
    if (isVectorDbMaintenanceEnabled()) {
      return res.status(503).json(vectorDbMaintenanceResponse())
    }

    //check user is allowed to edit bot or not
    if (!canUserModifySources(team, userId)) {
      return res.status(403).json({
        message: 'You are not allowed to add sources in this bot.',
      })
    }

    //check plan credits
    if (stripePlan(team).pages <= team.pageCount) {
      return res.status(402).json({
        message: 'Source page limit exceeded. Please upgrade your plan.',
      })
    }

    //data validation
    let {
      type,
      title,
      url,
      file,
      scheduleInterval,
      faqs,
      processImages,
      trutoIntegrationID,
      trutoFiles,
      urls,
      crawlerJS,
      freescoutUrl,
      freescoutKey,
      freescoutMailbox,
      freescoutMonths,
    } = req.body

    if (!type || !sourceTypes.find((sourceType) => sourceType.id === type)) {
      return res.status(400).send({ message: 'Invalid parameter "type".' })
    }

    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)

    //check plan credits
    const predictedPageCount = (!checkPlanPermission(team, 'free').allowed)
      ? team.pageCount + 5
      : team.pageCount + 1
    if (stripePlan(team).pages < predictedPageCount) {
      return res.status(402).json({
        message: 'Source page limit exceeded. Please upgrade your plan.',
      })
    }

    //check if they have access to the source type
    if (!checkPlanPermission(team, sourceType.minPlan, 'source').allowed) {
      return res.status(402).json({
        message:
          'Source type not available on your plan. Please upgrade your plan.',
      })
    }

    // https://mathiasbynens.be/demo/url-regex
    url = url?.trim() || null
    if (
      (sourceType.fieldUrl === 'required' &&
      (!url || !isValidURL(url))) || (url && !isValidURL(url))
    ) {
      return res
        .status(400)
        .send({ message: 'Invalid or missing parameter "url". Please remove or provide a valid full URL.' })
    }

    // check if they added a youtube url under a url source type. if so, swap the type
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?list=|live\/)[\w-]+/

    if (type === 'url' && youtubeRegex.test(url)) {
      type = 'youtube'
    }
    
    // Check if it's a YouTube source and validate the URL
    if (type === 'youtube') {
      if (!youtubeRegex.test(url)) {
        return res.status(400).send({
          message:
            'Invalid YouTube URL. Please provide a valid video or playlist URL; channel URLs are not supported.',
        })
      }

      if (scheduleInterval && scheduleInterval !== 'none' && !YOUTUBE_PLAYLIST_REGEX.test(url)) {
        return res.status(400).send({
          message: 'YouTube refresh scheduling is only available for playlist URLs.',
        })
      }
    }

    // Handle urls for urls source type
    let indexedUrls = null
    if (type === 'urls' && urls) {
      // Validate urls
      if (!Array.isArray(urls)) {
        return res.status(400).send({ message: 'Invalid parameter "urls". Must be an array.' })
      }

      // Validate each URL and remove duplicates
      const validatedUrls = []
      const seenUrls = new Set()

      for (const urlItem of urls) {
        const trimmedUrl = urlItem?.trim()
        if (!trimmedUrl) continue

        if (!isValidURL(trimmedUrl)) {
          return res.status(400).send({ 
            message: `Invalid URL in urls: ${trimmedUrl}. Please provide valid full URLs.` 
          })
        }

        // Remove duplicates
        if (!seenUrls.has(trimmedUrl)) {
          seenUrls.add(trimmedUrl)
          validatedUrls.push(trimmedUrl)
        }
      }

      indexedUrls = validatedUrls
    }

    // For urls source type, either file or urls should be provided
    if (type === 'urls' && !file && (!indexedUrls || indexedUrls.length === 0)) {
      return res.status(400).send({ 
        message: 'Invalid parameter. Either provide a file or urls for urls source type.' 
      })
    }

    // Handle urls for website source type
    if (type === 'website' && urls) {
      // Validate urls
      if (!Array.isArray(urls)) {
        return res.status(400).send({ message: 'Invalid parameter "urls". Must be an array.' })
      }

      // Validate each URL and remove duplicates
      const validatedUrls = []
      const seenUrls = new Set()

      for (const urlItem of urls) {
        const trimmedUrl = urlItem?.trim()
        if (!trimmedUrl) continue

        if (!isValidURL(trimmedUrl)) {
          return res.status(400).send({ 
            message: `Invalid URL in urls: ${trimmedUrl}. Please provide valid full URLs.` 
          })
        }

        // Remove duplicates
        if (!seenUrls.has(trimmedUrl)) {
          seenUrls.add(trimmedUrl)
          validatedUrls.push(trimmedUrl)
        }
      }

      indexedUrls = validatedUrls
    }

    // For website source type, require urls
    if (type === 'website' && (!indexedUrls || indexedUrls.length === 0)) {
      return res.status(400).send({ 
        message: 'Invalid parameter. Please select at least one URL for website source type.' 
      })
    }

    title = title?.trim() || null
    if (sourceType.fieldTitle === 'required' && !title) {
      return res
        .status(400)
        .send({ message: 'Invalid or missing parameter "title".' })
    }

    if (sourceType.fieldFile === 'required' && !file) {
      return res
        .status(400)
        .send({ message: 'Invalid or missing parameter "file".' })
    }

    if (sourceType.fieldQA === 'required' && !faqs) {
      return res
        .status(400)
        .send({ message: 'Invalid or missing parameter "faqs".' })
    }

    if (!sourceType.fieldQA) {
      faqs = null
    }

    // sanity check faqs
    if (faqs) {
      if (!Array.isArray(faqs)) {
        return res.status(400).json({ message: 'Invalid parameter "faqs".' })
      }

      for (const faq of faqs) {
        if (
          !faq.question ||
          !faq.answer ||
          faq.answer.length === 0 ||
          faq.question.length === 0
        ) {
          return res.status(400).json({ message: 'Invalid parameter "faqs".' })
        }
      }

      try {
        faqs.forEach((QA) => {
          if (!QA.question || !QA.answer) {
            throw new Error()
          }
        })
      } catch (error) {
        return res.status(400).send({ message: 'Invalid parameter "faqs".' })
      }
    }

    //check file type, mostly for sanity
    if (file) {
      const extension = file.split('.').pop()
      if (!Object.keys(sourceType.fileTypes).includes(extension)) {
        return res.status(400).send({ message: 'Invalid file type.' })
      }

      // zip files are only for non-free plans
      if (extension === 'zip' && !checkPlanPermission(team, 'free').allowed) {
        return res.status(402).json({
          message:
            'File type not available on your plan. Please upgrade your plan.',
        })
      }

      //we will move the file to the correct location in bucket after we have the source id
    } else {
      file = null
    }

    let pageCount = 0

    if (sourceType.isTruto) {
      console.log('trutoIntegrationID:', trutoIntegrationID)
      // check trutoId
      if (!trutoIntegrationID) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing parameter "trutoIntegrationID".' })
      }

      if (!trutoFiles) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing parameter "trutoFiles".' })
      }
    } else {
      trutoIntegrationID = null
    }

    // Add processImages validation after type validation
    if (processImages !== undefined) {
      // Ensure it's a boolean
      if (typeof processImages !== 'boolean') {
        return res.status(400).send({ message: 'Invalid parameter "processImages". Must be a boolean.' })
      }

      // Only allow true for supported source types
      if (processImages && !sourceType.fieldImages) {
        return res.status(400).send({ message: 'Image processing not supported for this source type.' })
      }

      // Only allow true for paid plans
      if (processImages && !checkPlanPermission(team, 'pro', 'image').allowed) {
        return res.status(402).send({ message: 'Image processing requires Standard plan or higher.' })
      }
    } else {
      processImages = false
    }

    if (crawlerJS !== undefined) {
      if (typeof crawlerJS !== 'boolean') {
        return res
          .status(400)
          .send({ message: 'Invalid parameter "crawlerJS". Must be a boolean.' })
      }

      if (!['urls', 'sitemap'].includes(type)) {
        return res.status(400).send({
          message: 'JavaScript parsing is only available for URL list and sitemap sources.',
        })
      }

      if (crawlerJS && !isSuperAdmin(userId)) {
        return res.status(403).send({
          message: 'Only super admins can enable JavaScript parsing for new crawler sources.',
        })
      }
    } else {
      crawlerJS = false
    }

    try {
      let data = {
        createdAt: FieldValue.serverTimestamp(),
        type,
        title,
        url,
        file,
        status: 'pending',
        pageCount: pageCount,
        chunkCount: 0,
        faqs,
        processImages,
        crawlerJS,
        indexedUrls,
      }

      if (scheduleInterval && scheduleInterval !== 'none') {
        // make sure the source type is supported
        if (!sourceType.fieldSchedule) {
          return res.status(400).send({
            message:
              'This source type does not currently support scheduled refreshes.',
          })
        }

        //this will throw an error if the interval is invalid or not allowed for plan
        const scheduled = checkSourceScheduledFromInterval(
          team,
          scheduleInterval,
        )
        data = { ...data, scheduled, scheduleInterval }
      }

      if (type === 'freescout') {
        data = {
          ...data,
          freescoutUrl: freescoutUrl || url,
          freescoutKey,
          freescoutMailbox,
          freescoutMonths:
            Math.min(Math.max(parseInt(freescoutMonths) || 3, 1), 12),
        }
      }

      // we only allow 1 qa source per bot, so we'll need to check if another qa source exists.
      // if it does, we'll need to add our faqs to it and queue a regest
      if (type === 'qa') {
        const qaSources = await firestore
          .collection('teams')
          .doc(team.id)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .where('type', '==', 'qa')
          .get()
        if (!qaSources.empty) {
          // add the faqs to the existing qa source
          const existingSource = {
            id: qaSources.docs[0].id,
            ...qaSources.docs[0].data(),
          }
          const existingFaqs = existingSource.faqs || []

          // loop through and remove old conflicting faqs
          const newFaqs = existingFaqs.filter((newFaq) => {
            const existingFaq = faqs.find(
              (faq) => faq.question === newFaq.question,
            )
            if (existingFaq) {
              return false
            }
            return true
          })

          // append our new faqs
          newFaqs.push(...faqs)

          await firestore
            .collection('teams')
            .doc(team.id)
            .collection('bots')
            .doc(botId)
            .collection('sources')
            .doc(existingSource.id)
            .update({
              faqs: newFaqs,
            })

          await QueueSourceRegest(team.id, botId, existingSource.id)

          //send bento track
          try {
            bentoTrack(userId, 'track', {
              type: 'addFAQ',
              sourceType: type,
            })
            phTrack(userId, 'FAQ Added', { 'Source type': type }, team.id)
          } catch (e) {
            console.log('Error sending bento track', e)
          }

          return res
            .status(201)
            .json(await getSource(team, bot, existingSource.id))
        }
      }

      // youtube sources we just start the apify crawler here and set the status to indexing. crawler cron will check status then ingest
      if (type === 'youtube') {
        // Get remaining page limit in plan
        const remainingPages = stripePlan(team).pages - team.pageCount
        // Limit the YouTube scraper to remaining pages or 100, whichever is smaller
        const maxResults = Math.min(remainingPages, 100)
        const apiEndpoint =
          'https://api.apify.com/v2/acts/streamers~youtube-scraper/runs?timeout=3600&maxItems=' +
          maxResults +
          '&token=' +
          process.env.APIFY_TOKEN

        const requestBody = {
          startUrls: [
            {
              url: url,
            },
          ],
          maxResults: maxResults,
          downloadSubtitles: true,
          subtitlesLanguage: 'any',
          subtitlesFormat: 'srt',
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
            throw new Error('HTTP error ' + response.status)
          }

          const result = await response.json()
          const crawlId = result.data.id

          // Add the crawlId to the data object
          data.crawlId = crawlId
          data.status = 'indexing'

          // Continue with the existing source creation logic...
        } catch (error) {
          console.error('Error starting APIFY crawler job:', error)
          return res
            .status(500)
            .json({ message: 'Error starting YouTube crawler' })
        }
      }

      if (isTrutoSourceType(type)) {
        // if sync job doesn't exist, throw error
        if (!GetSyncJobID(type)) {
          return res
            .status(500)
            .json({ message: 'Sync job does not exist for this source type!' })
        }
        data = { ...data, trutoIntegrationID, trutoFiles }
      }

      const docRef = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .add(data)

      if (isTrutoSourceType(type)) {
        try {
          // start Truto sync job
          const trutoSyncRun = await RunSyncJob(GetSyncJobID(type), trutoIntegrationID, team.id, botId, docRef.id)
          console.log("starting sync job with ID:", trutoSyncRun)

        // add sync job id to source
        await firestore
          .collection('teams')
          .doc(team.id)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .doc(docRef.id)
          .update({
            trutoSyncRun,
            status: 'indexing'
          })

          data = { ...data, trutoSyncRun }
        } catch (error) {
          console.log('Error starting Truto sync job', error)
          await docRef.update({
            status: 'failed',
            error: error.message
          })
          return res.status(500).json({ message: 'Error starting Truto sync job. Please try again.' })
        }
      }

      //move file to correct location in bucket
      if (file) {
        try {
          const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
          const fileRef = bucket.file(file)
          const fileName = file.split('/').pop().replace(/^.*[\\\/]/, '').replace(/\s+/g, '_').replace(/\0/g, '')
          // Add uuid to filename
          const extension = fileName.includes('.') ? fileName.split('.').pop() : ''
          const baseName = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName
          const uuid = Math.random().toString(36).substring(2, 5) // Get 3 characters from uuid
          const newFileName = `${baseName}_${uuid}${extension ? '.' + extension : ''}`

          //move the file to the correct location in bucket
          const newFile = `teams/${team.id}/bots/${botId}/sources/${docRef.id}/${newFileName}`
          await fileRef.move(newFile)
          
          await docRef.update({
            file: newFile
          })
          file = newFile
          data.file = newFile

          console.log(newFile, 'created!')
        } catch (error) {
          console.log('Error moving file', error)
          await docRef.update({
            status: 'failed',
            error: error.message
          })
          return res.status(500).json({ message: 'Error processing uploaded file. Please try again.' })
        }
      }

      //increment sourceCounts on team
      try {
        await firestore.runTransaction(async (transaction) => {
          const teamRef = firestore.collection('teams').doc(team.id)
          const sfDoc = await transaction.get(teamRef)
          if (!sfDoc.exists) {
            throw 'Team does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(teamRef, {
            sourceCount: newSourceCount,
          })
        })

        //increment source counts on bot
        await firestore.runTransaction(async (transaction) => {
          const botRef = firestore
            .collection('teams')
            .doc(team.id)
            .collection('bots')
            .doc(botId)
          const sfDoc = await transaction.get(botRef)
          if (!sfDoc.exists) {
            throw 'Bot does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(botRef, {
            sourceCount: newSourceCount,
          })
        })
      } catch (e) {
        console.warn('Increment transaction failed: ', e)
      }

      //add source event to pub/sub queue for processing (youtube handled by cron, truto handled by sync-hook)
      if (!isTrutoSourceType(type) && type !== 'youtube') {
        await QueueSourceIngest(
          team.id,
          botId,
          docRef.id,
          stripePlan(team).pages - team.pageCount,
          bot.indexId,
          type,
          title,
          url,
          file,
          faqs,
        )
      }


      //send bento track
      try {
        bentoTrack(userId, 'track', {
          type: 'addSource',
          sourceType: type,
        })
        phTrack(userId, 'Source Added', { 'Source type': type }, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      //done, return source object
      return res.status(201).json(await getSource(team, bot, docRef.id))
    } catch (error) {
      console.log('Error creating source', error, error?.stack)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    const page = parseInt(req.query.page) || 0
    const sourceLimit = parseInt(req.query.limit) || 100
    const ascending = req.query.ascending || false
    try {
      return res.json(
        await getSources(team.id, bot, page, sourceLimit, ascending),
      )
    } catch (e) {
      return res.status(500).json({ message: e?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
