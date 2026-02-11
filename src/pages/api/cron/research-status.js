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

import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import crypto from 'crypto'
import webpush from 'web-push'
import { getURL } from '@/utils/helpers'
import { deliverWebhookEvent } from '@/lib/webhookDelivery'
import { WEBHOOK_EVENT_DEEP_RESEARCH_DONE } from '@/lib/webhooks'

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])
const NOTIFY_STATUSES = new Set(['completed', 'failed']) // Only notify for these statuses

const getUserPushSubscriptions = async (firestore, userId) => {
  try {
    if (!userId) return []

    const userDoc = await firestore.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return []
    }

    const userData = userDoc.data()
    const subscriptions = userData.pushSubscriptions || []

    // Return subscriptions with index for removal tracking
    return subscriptions.map((sub, index) => ({
      ...sub,
      index, // Store index for removal
      userId, // Store userId for removal tracking
    }))
  } catch (error) {
    console.warn(`Error fetching push subscriptions for user ${userId}:`, error)
    return []
  }
}

const sendPushNotifications = async (subscriptions, payload) => {
  const results = { sent: 0, removed: [] }

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        JSON.stringify(payload),
      )
      results.sent += 1
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        // Store subscription info for removal (index and userId)
        if (subscription.index !== undefined && subscription.userId) {
          results.removed.push({
            userId: subscription.userId,
            index: subscription.index,
          })
        }
        continue
      }
      console.warn('Push notification error', error?.statusCode, error?.message)
    }
  }

  return results
}

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY &&
    process.env.WEB_PUSH_PRIVATE_KEY &&
    !webpush.getVapidDetails?.()
  ) {
    webpush.setVapidDetails(
      `mailto:${process.env.WEB_PUSH_CONTACT_EMAIL || 'support@docsbot.ai'}`,
      process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
      process.env.WEB_PUSH_PRIVATE_KEY,
    )
  }

  // Check for CRON_SECRET authorization (bypass in development if not set)
  const authHeader = request.headers.authorization
  const expectedSecret = process.env.CRON_SECRET

  // In development, bypass protection if CRON_SECRET is not set
  if (
    expectedSecret &&
    (!authHeader || authHeader !== `Bearer ${expectedSecret}`)
  ) {
    response.status(401).json({ message: 'Unauthorized' })
    return
  }

  console.log('cron research-status started!')

  try {
    // Only check jobs created in the last 24 hours to avoid checking very old jobs
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // 1. Find running jobs (for status sync, push notify, webhook when we detect completion)
    const researchJobsSnapshot = await firestore
      .collectionGroup('research')
      .where('status', 'in', ['queued', 'in_progress'])
      .where('createdAt', '>=', twentyFourHoursAgo)
      .get()

    // 2. Find completed jobs that haven't had webhook sent yet (catch jobs that completed
    //    via page polling or other updater, so webhook always fires regardless of who updated status)
    //    Uses existing (status, createdAt, __name__) index
    const completedNoWebhookSnapshot = await firestore
      .collectionGroup('research')
      .where('status', '==', 'completed')
      .where('createdAt', '>=', twentyFourHoursAgo)
      .get()

    const pendingWebhookDocs = completedNoWebhookSnapshot.docs.filter(
      (doc) => !doc.data()?.webhookDeepResearchDoneAt,
    )
    const pendingWebhookJobIds = new Set(
      pendingWebhookDocs.map((d) => d.id),
    )

    console.log(
      `Found ${researchJobsSnapshot.size} running research tasks to check, ${pendingWebhookJobIds.size} completed jobs pending webhook`,
    )

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
              console.log(
                `Job ${jobId} (team: ${teamId}, bot: ${botId}) - not found in external API (may have expired), current DB status: ${jobData.status || 'unknown'}`,
              )
            } else {
              console.warn(
                `Job ${jobId} (team: ${teamId}, bot: ${botId}) - failed to fetch: ${apiResponse.status} ${apiResponse.statusText}, current DB status: ${jobData.status || 'unknown'}`,
              )
            }
            return
          }

          // The API call itself triggers the database update on the API side
          // We just need to make the call to refresh the status
          const apiJob = await apiResponse.json()
          const status = apiJob.status || 'unknown'
          console.log(
            `Job ${jobId} (team: ${teamId}, bot: ${botId}) - status: ${status}${jobData.status !== status ? ` (was: ${jobData.status || 'unknown'})` : ''}`,
          )

          try {
            const refreshedDoc = await jobDoc.ref.get()
            const refreshedData = refreshedDoc.data() || {}
            const isTerminal = TERMINAL_STATUSES.has(refreshedData.status)
            const shouldNotify = NOTIFY_STATUSES.has(refreshedData.status) // Only notify for completed/failed
            const hasNotified = Boolean(refreshedData.pushNotifiedAt)
            const jobCreatorUid = refreshedData.metadata?.uid

            // Debug logging
            console.log(`Job ${jobId} notification check:`, {
              status: refreshedData.status,
              isTerminal,
              shouldNotify,
              hasNotified,
              jobCreatorUid,
              hasWebPushKeys: !!(
                process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY &&
                process.env.WEB_PUSH_PRIVATE_KEY
              ),
              metadata: refreshedData.metadata,
            })

            const shouldSendWebhook =
              refreshedData.status === 'completed' &&
              !refreshedData.webhookDeepResearchDoneAt

            if (shouldSendWebhook) {
              const answer =
                refreshedData.result ?? apiJob.result ?? null

              const webhookPayload = {
                event: WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
                teamId,
                botId,
                research: {
                  jobId,
                  status: refreshedData.status,
                  title: refreshedData.title || null,
                  question: refreshedData.question || null,
                  createdAt:
                    refreshedData.createdAt?.toDate?.()?.toISOString?.() ||
                    null,
                  completedAt:
                    refreshedData.completedAt?.toDate?.()?.toISOString?.() ||
                    null,
                  metadata: refreshedData.metadata || null,
                  answer,
                },
              }

              try {
                await deliverWebhookEvent({
                  teamId,
                  botId,
                  event: WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
                  payload: webhookPayload,
                })
                await jobDoc.ref.update({
                  webhookDeepResearchDoneAt: FieldValue.serverTimestamp(),
                })
              } catch (webhookError) {
                console.warn(
                  `Error delivering deep research done webhook for job ${jobId}`,
                  webhookError,
                )
              }
            }

            if (
              isTerminal &&
              shouldNotify &&
              !hasNotified &&
              jobCreatorUid && // Only notify if we know who created the job
              process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY &&
              process.env.WEB_PUSH_PRIVATE_KEY
            ) {
              // Get subscriptions for the user who created the job (works across all teams)
              const subscriptions = await getUserPushSubscriptions(
                firestore,
                jobCreatorUid,
              )

              console.log(
                `Found ${subscriptions.length} push subscription(s) for user ${jobCreatorUid}`,
              )

              if (subscriptions.length > 0) {
                const statusLabel =
                  refreshedData.status === 'completed' ? 'completed' : 'failed'
                const baseUrl = getURL()
                const jobUrl = `${baseUrl}/app/bots/${botId}/research?jobId=${jobId}`
                const payload = {
                  title:
                    refreshedData.title ||
                    refreshedData.question ||
                    'Deep research task',
                  body: `Deep research task ${statusLabel}. Click to view results.`,
                  tag: `research-${jobId}`,
                  url: jobUrl,
                }

                const results = await sendPushNotifications(
                  subscriptions,
                  payload,
                )
                console.log(`Push notification results for job ${jobId}:`, {
                  sent: results.sent,
                  removed: results.removed.length,
                })

                // Remove invalid subscriptions from user's pushSubscriptions array
                if (results.removed.length > 0) {
                  // Group removals by userId
                  const removalsByUser = {}
                  results.removed.forEach((removal) => {
                    if (!removalsByUser[removal.userId]) {
                      removalsByUser[removal.userId] = []
                    }
                    removalsByUser[removal.userId].push(removal.index)
                  })

                  // Update each user's subscriptions array
                  const batch = firestore.batch()
                  for (const [userId, indices] of Object.entries(
                    removalsByUser,
                  )) {
                    const userRef = firestore.collection('users').doc(userId)
                    const userDoc = await userRef.get()

                    if (userDoc.exists) {
                      const userData = userDoc.data()
                      const subscriptions = userData.pushSubscriptions || []

                      // Remove subscriptions at the specified indices
                      const updatedSubscriptions = subscriptions.filter(
                        (_, index) => !indices.includes(index),
                      )

                      batch.update(userRef, {
                        pushSubscriptions: updatedSubscriptions,
                        updatedAt: FieldValue.serverTimestamp(),
                      })
                    }
                  }
                  await batch.commit()
                }

                await jobDoc.ref.update({
                  pushNotifiedAt: FieldValue.serverTimestamp(),
                })
                console.log(`Marked job ${jobId} as notified`)
              } else {
                console.log(
                  `No push subscriptions found for user ${jobCreatorUid}, skipping notification`,
                )
              }
            } else {
              const reasons = []
              if (!isTerminal) reasons.push('not terminal')
              if (!shouldNotify) reasons.push('should not notify')
              if (hasNotified) reasons.push('already notified')
              if (!jobCreatorUid) reasons.push('no jobCreatorUid')
              if (
                !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
                !process.env.WEB_PUSH_PRIVATE_KEY
              )
                reasons.push('web push keys not configured')
              console.log(
                `Skipping notification for job ${jobId}: ${reasons.join(', ')}`,
              )
            }
          } catch (notifyError) {
            console.warn(
              `Error sending push notification for job ${jobId}`,
              notifyError,
            )
          }
        } catch (error) {
          console.warn(`Error updating job ${jobId}:`, error)
        }
      })
    }

    // Process running-job updates with concurrency limit to avoid overwhelming the API
    const concurrency = 5
    for (let i = 0; i < updateTasks.length; i += concurrency) {
      const batch = updateTasks.slice(i, i + concurrency)
      await Promise.all(batch.map((task) => task()))
    }

    // Process completed jobs that still need webhook (e.g. completed via page poll)
    for (const jobDoc of pendingWebhookDocs) {
      const data = jobDoc.data() || {}
      if (data.webhookDeepResearchDoneAt) continue

      let botRef, teamRef, botId, teamId
      try {
        botRef = jobDoc.ref.parent.parent
        teamRef = botRef.parent.parent
        if (!botRef?.id || !teamRef?.id) continue
        botId = botRef.id
        teamId = teamRef.id
      } catch {
        continue
      }

      try {
        const botDoc = await botRef.get()
        if (!botDoc.exists) continue

        const botData = botDoc.data()
        if (!botData.signatureKey) continue

        // Optionally fetch from API to get result if missing
        let result = data.result || null
        if (!result) {
          try {
            const hmac = crypto.createHmac('sha256', botData.signatureKey)
            const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12
            hmac.update(`${botId}:${expires}`)
            const signature = `${hmac.digest('hex')}:${expires}`
            const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${teamId}/bots/${botId}/research/${jobDoc.id}`
            const apiRes = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${signature}`,
              },
            })
            if (apiRes.ok) {
              const apiJob = await apiRes.json()
              result = apiJob.result ?? null
            }
          } catch (err) {
            console.warn(
              `Failed to fetch result for pending webhook job ${jobDoc.id}:`,
              err,
            )
          }
        }

        const webhookPayload = {
          event: WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
          teamId,
          botId,
          research: {
            jobId: jobDoc.id,
            status: data.status || 'completed',
            title: data.title || null,
            question: data.question || null,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() || null,
            completedAt:
              data.completedAt?.toDate?.()?.toISOString?.() || null,
            metadata: data.metadata || null,
            answer: result,
          },
        }

        await deliverWebhookEvent({
          teamId,
          botId,
          event: WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
          payload: webhookPayload,
        })
        await jobDoc.ref.update({
          webhookDeepResearchDoneAt: FieldValue.serverTimestamp(),
        })
        console.log(
          `Sent pending deep research webhook for job ${jobDoc.id} (team: ${teamId}, bot: ${botId})`,
        )
      } catch (err) {
        console.warn(
          `Error sending pending webhook for job ${jobDoc.id}:`,
          err,
        )
      }
    }

    console.log(
      `Completed checking ${researchJobsSnapshot.size} research tasks`,
    )
    response.status(200).json({
      success: true,
      checked: researchJobsSnapshot.size,
      updated: updateTasks.length,
    })
  } catch (error) {
    console.error('Error in research-status cron:', error)
    response.status(500).json({ message: error.message || 'Error' })
  }
}
