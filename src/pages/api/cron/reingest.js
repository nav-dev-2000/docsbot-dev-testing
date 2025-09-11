/**
 * Source Reingest Cron Job
 * 
 * This cron job runs every hour to reingest scheduled sources.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/reingest"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import { QueueSourceRegest } from '@/lib/service'
import { checkSourceScheduledFromInterval } from '@/utils/helpers'
import { getTeam } from '@/lib/dbQueries'
import { isTrutoSourceType } from '@/constants/sourceTypes.constants'
import { RunSyncJob, GetSyncJobID } from '@/lib/truto'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // Check for CRON_SECRET authorization (bypass in development if not set)
  const authHeader = request.headers.authorization
  const expectedSecret = process.env.CRON_SECRET
  
  // In development, bypass protection if CRON_SECRET is not set
  if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
    response.status(401).json({ message: 'Unauthorized' })
    return
  }

  console.log('cron reingest started!')

  // select scheduled sources based on current time
  const currentTime = Timestamp.now()
  const sourcesRef = await firestore
    .collectionGroup('sources')
    .where('scheduled', '<=', currentTime)
    .get()
  try {
    sourcesRef.forEach(async (doc) => {
      const source = doc.data()
      console.log(
        'source',
        doc.id,
        'is scheduled to be reingested at',
        source.scheduled.toDate(),
        ' -- reingesting...',
      )

      const botRef = doc.ref.parent.parent
      const botId = botRef.id
      const botName = (await botRef.get()).data().name

      const teamRef = botRef.parent.parent
      const teamId = teamRef.id

      try {

        // grab next schedule date
        const nextSchedule = checkSourceScheduledFromInterval(
          await getTeam(teamId),
          source.scheduleInterval,
        )

        // Check if it's a truto source type, we are not supporting truto sources for cron jobs anymore
        if (isTrutoSourceType(source.type)) {
          try {
            try {
              console.log('Deleting files from bucket')
              const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
              await bucket.deleteFiles({ prefix: `teams/${teamId}/bots/${botId}/sources/${doc.id}` })
            } catch (error) {
              console.log('Error deleting files from bucket', error)
            }

            // start Truto sync job
            const trutoSyncRun = await RunSyncJob(GetSyncJobID(source.type), source?.trutoIntegrationID, teamId, botId, doc.id)
            console.log("Starting Trutosync job with ID:", trutoSyncRun)

            // add sync job id to source
            await doc.ref.update({
              status: 'indexing',
              createdAt: FieldValue.serverTimestamp(), // prevent expiration failure, not sure if this is needed?
              trutoSyncRun,
              scheduled: nextSchedule,
            })

            return // we don't want to reingest the source here, we just want to start the sync job which will reingest the source when it's done via webhook
    
          } catch (error) {
            console.log('Error starting Truto sync job', error)
            return
          }
        }

        // update and reingest source
        await doc.ref.update({
          scheduled: nextSchedule,
        })
        
        await QueueSourceRegest(teamId, botId, doc.id)
      } catch (error) {
        console.log(doc.id, 'refresh error:', error)

        const lastError = {
          'botId': botId,
          'botName': botName,
          'type': 'source',
          'sourceId': doc.id,
          'message': error.message,
          'emailSent': false,
          'descriptive': `Failed to refresh source: ${error.message}.`,
        }

        // remove schedule
        doc.ref.update({
          scheduled: FieldValue.delete(),
          scheduleInterval: 'none',
          status: 'failed',
          error: error.message,
        })

        // report error on team doc
        teamRef.update({
          lastError: lastError,
        })

        // ignore reingestion errors
        return
      }
    })
  } catch (error) {
    console.warn('Error getting document:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}
