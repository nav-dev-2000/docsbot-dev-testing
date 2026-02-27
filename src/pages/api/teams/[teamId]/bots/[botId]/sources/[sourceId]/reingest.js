import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBot, getSource } from '@/lib/dbQueries'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import { QueueSourceRegest } from '@/lib/service'
import { checkSourceScheduledFromInterval, isSuperAdmin } from '@/utils/helpers'
import {
  canSourceTypeSchedule,
  isTrutoSourceType,
  sourceTypes,
  YOUTUBE_PLAYLIST_REGEX,
} from '@/constants/sourceTypes.constants'
import { phTrack } from '@/lib/posthog'
import userTeamCheck from '@/lib/userTeamCheck'
import { RunSyncJob, GetSyncJobID } from '@/lib/truto'
import {
  isVectorDbMaintenanceEnabled,
  vectorDbMaintenanceResponse,
  isBotSourcesFrozen,
  freezeSourcesResponse,
} from '@/lib/maintenance'
import { canUserModifySources } from '@/utils/function.utils'

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
  const { botId, sourceId } = req.query

  let bot = null
  let source = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
    source = await getSource(team, bot, sourceId)
    if (!source) {
      return res.status(404).json({ message: "sourceId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error?.message })
  }

  // Check per-bot permission to modify sources
  if (!canUserModifySources(team, userId, bot)) {
    return res.status(403).json({
      message: 'You are not allowed to modify sources in this bot.',
    })
  }

  if (req.method === 'PUT') {
    if (isVectorDbMaintenanceEnabled()) {
      return res.status(503).json(vectorDbMaintenanceResponse())
    }
    if (isBotSourcesFrozen(bot)) {
      return res.status(503).json(freezeSourcesResponse())
    }

    if (!canSourceTypeSchedule(source.type)) {
      return res
        .status(403)
        .json({ message: 'Only sources of a dynamic type (URLs) can be refreshed!' })
    }

    if (source.type === 'youtube' && !YOUTUBE_PLAYLIST_REGEX.test(source.url)) {
      return res.status(400).json({
        message:
          'Only YouTube playlist sources support refresh scheduling. Please delete and recreate this source with a playlist URL.',
      })
    }

    try {
      const { scheduleInterval } = req.body

      // if interval is none, remove the scheduled field
      if (scheduleInterval === 'none') {
        firestore
          .collection('teams')
          .doc(team.id)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .doc(sourceId)
          .update({
            scheduled: FieldValue.delete(),
            scheduleInterval: scheduleInterval,
          })
        return res.status(200).json({ message: 'success' })
      }

      const scheduled = checkSourceScheduledFromInterval(team, scheduleInterval)
      firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .doc(sourceId)
        .update({
          scheduled,
          scheduleInterval: scheduleInterval,
        })

      
      phTrack(userId, 'Source Refreshed', {}, team.id)

      return res.status(200).json({ newScheduled: scheduled.toJSON() })
    } catch (error) {
      console.warn('Error setting source interval:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'PATCH') {
    if (isVectorDbMaintenanceEnabled()) {
      return res.status(503).json(vectorDbMaintenanceResponse())
    }
    if (isBotSourcesFrozen(bot)) {
      return res.status(503).json(freezeSourcesResponse())
    }

    try {
      const { faqs } = req.body

      if (source.type !== 'qa') {
        return res.status(400).json({ message: "Only sources of type 'qa' can be updated!" })
      }

      // validate request body
      if (!faqs || !Array.isArray(faqs)) {
        return res.status(400).json({ message: 'Invalid request body' })
      }

      for (const faq of faqs) {
        console.log(faq)
        if (!faq.question || !faq.answer || faq.answer.length === 0 || faq.question.length === 0) {
          return res.status(400).json({ message: 'Invalid request body' })
        }
      }

      await QueueSourceRegest(team.id, botId, sourceId, {faqs})

      
      phTrack(userId, 'Q&A Source Updated', {}, team.id)

      return res.status(200).json(await getSource(team, bot, sourceId))
    } catch (error) {
      console.warn('Error updating source:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'POST') {
    if (isVectorDbMaintenanceEnabled()) {
      return res.status(503).json(vectorDbMaintenanceResponse())
    }
    if (isBotSourcesFrozen(bot)) {
      return res.status(503).json(freezeSourcesResponse())
    }

    if (isTrutoSourceType(source.type)) {
      try {
        try {
          console.log('Deleting files from bucket')
          const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
          await bucket.deleteFiles({ prefix: `teams/${team.id}/bots/${botId}/sources/${sourceId}` })
        } catch (error) {
          console.log('Error deleting files from bucket', error)
        }

        // start Truto sync job
        const trutoSyncRun = await RunSyncJob(GetSyncJobID(source.type), source?.trutoIntegrationID, team.id, botId, sourceId)
        console.log("starting sync job with ID:", trutoSyncRun)

        // add sync job id to source
        await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .doc(sourceId)
        .update({
          status: 'indexing',
          refreshing: true,
          createdAt: FieldValue.serverTimestamp(), // revent expiration failure
          trutoSyncRun
        })

      } catch (error) {
        console.log('Error starting Truto sync job', error)
        return res.status(500).json({ message: 'Error starting Truto sync job. Please try again.' })
      }
      return res.status(200).json({ message: 'success' })
    }

    if (!canSourceTypeSchedule(source.type)) {
      return res
        .status(403)
        .json({ message: 'Only sources of a dynamic type (URLs) can be refreshed!' })
    }

    if (source.type === 'youtube' && !YOUTUBE_PLAYLIST_REGEX.test(source.url)) {
      return res.status(400).json({
        message:
          'Only YouTube playlist sources support refresh scheduling. Please delete and recreate this source with a playlist URL.',
      })
    }

    let crawlerJSFlag = false
    let shouldUpdateCrawlerJS = false
    if (
      req.body &&
      Object.prototype.hasOwnProperty.call(req.body, 'crawlerJS')
    ) {
      if (typeof req.body.crawlerJS !== 'boolean') {
        return res
          .status(400)
          .json({ message: 'Invalid parameter "crawlerJS". Must be a boolean.' })
      }

      if (req.body.crawlerJS && !isSuperAdmin(userId)) {
        return res.status(403).json({
          message: 'Only super admins can enable JavaScript parsing for refreshes.',
        })
      }

      crawlerJSFlag = req.body.crawlerJS
      shouldUpdateCrawlerJS = true
    }

    const sourceRef = firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('sources')
      .doc(sourceId)

    try {
      if ((!source.scheduleInterval || source.scheduleInterval === 'none')) {
        if (shouldUpdateCrawlerJS) {
          await sourceRef.update({ crawlerJS: crawlerJSFlag })
        }

        await QueueSourceRegest(team.id, botId, sourceId)
        return res.status(200).json({ message: 'success' })
      }

      // grab next schedule date
      const nextSchedule = checkSourceScheduledFromInterval(team, source.scheduleInterval)

      // update and reingest source
      await sourceRef.update({
        scheduled: nextSchedule,
        ...(shouldUpdateCrawlerJS ? { crawlerJS: crawlerJSFlag } : {}),
      })

      await QueueSourceRegest(team.id, botId, sourceId)


      phTrack(userId, 'Source Refreshed', {}, team.id)

      return res.status(200).json({ newScheduled: nextSchedule.toJSON() })
    } catch (error) {
      console.warn('Error setting source interval:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
