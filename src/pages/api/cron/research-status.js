/**
 * Research Status Sync Cron Job
 * 
 * This cron job runs every 5 minutes to sync the status of running research tasks
 * from the external API to the database. This ensures that job statuses are
 * updated even when users are not actively viewing the page, and captures
 * completion status before jobs expire from the external API.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/research-status"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import crypto from 'crypto'

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

  console.log('cron research-status started!')

  try {
    // Find all research tasks that are still running
    // Only check jobs created in the last 24 hours to avoid checking very old jobs
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const researchJobsSnapshot = await firestore
      .collectionGroup('research')
      .where('status', 'in', ['queued', 'in_progress'])
      .where('createdAt', '>=', twentyFourHoursAgo)
      .get()

    console.log(`Found ${researchJobsSnapshot.size} running research tasks to check`)

    const updateTasks = []

    for (const jobDoc of researchJobsSnapshot.docs) {
      const jobData = jobDoc.data()
      const jobId = jobDoc.id

      // Extract teamId and botId from the document reference
      // Structure: teams/{teamId}/bots/{botId}/research/{jobId}
      // jobDoc.ref.parent = research collection
      // jobDoc.ref.parent.parent = bot document
      // jobDoc.ref.parent.parent.parent = bots collection
      // jobDoc.ref.parent.parent.parent.parent = team document
      let botRef, teamRef, botId, teamId
      try {
        botRef = jobDoc.ref.parent.parent
        teamRef = botRef.parent.parent
        
        if (!botRef || !teamRef) {
          console.warn(`Invalid document structure for job ${jobId}`)
          continue
        }

        botId = botRef.id
        teamId = teamRef.id

        if (!teamId || !botId) {
          console.warn(`Missing teamId or botId for job ${jobId}`)
          continue
        }
      } catch (error) {
        console.warn(`Error extracting team/bot IDs for job ${jobId}:`, error)
        continue
      }

      updateTasks.push(async () => {
        try {
          const botDoc = await botRef.get()
          if (!botDoc.exists) {
            console.warn(`Bot ${botId} not found for job ${jobId}`)
            return
          }

          const botData = botDoc.data()
          
          // Generate bot signature for API authentication
          if (!botData.signatureKey) {
            botData.signatureKey = crypto.randomBytes(32).toString('hex')
            await botRef.update({ signatureKey: botData.signatureKey })
          }

          const hmac = crypto.createHmac('sha256', botData.signatureKey)
          const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12 // expires in 12 hours
          hmac.update(`${botId}:${expires}`)
          const signature = `${hmac.digest('hex')}:${expires}`

          // Fetch job status from external API
          const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${teamId}/bots/${botId}/research/${jobId}`
          const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${signature}`,
            },
          })

          if (!apiResponse.ok) {
            // If job is not found (404), it may have expired from the external API
            // In that case, we'll leave the status as-is in the database
            if (apiResponse.status === 404) {
              console.log(`Job ${jobId} (team: ${teamId}, bot: ${botId}) - not found in external API (may have expired), current DB status: ${jobData.status || 'unknown'}`)
            } else {
              console.warn(`Job ${jobId} (team: ${teamId}, bot: ${botId}) - failed to fetch: ${apiResponse.status} ${apiResponse.statusText}, current DB status: ${jobData.status || 'unknown'}`)
            }
            return
          }

          // The API call itself triggers the database update on the API side
          // We just need to make the call to refresh the status
          const apiJob = await apiResponse.json()
          const status = apiJob.status || 'unknown'
          console.log(`Job ${jobId} (team: ${teamId}, bot: ${botId}) - status: ${status}${jobData.status !== status ? ` (was: ${jobData.status || 'unknown'})` : ''}`)
        } catch (error) {
          console.warn(`Error updating job ${jobId}:`, error)
        }
      })
    }

    // Process updates with concurrency limit to avoid overwhelming the API
    const concurrency = 5
    for (let i = 0; i < updateTasks.length; i += concurrency) {
      const batch = updateTasks.slice(i, i + concurrency)
      await Promise.all(batch.map((task) => task()))
    }

    console.log(`Completed checking ${researchJobsSnapshot.size} research tasks`)
    response.status(200).json({ 
      success: true, 
      checked: researchJobsSnapshot.size,
      updated: updateTasks.length 
    })
  } catch (error) {
    console.error('Error in research-status cron:', error)
    response.status(500).json({ message: error.message || 'Error' })
  }
}

