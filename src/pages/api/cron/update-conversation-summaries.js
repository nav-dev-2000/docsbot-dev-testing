/**
 * Update Conversation Summaries Cron Job
 * 
 * This cron job runs every hour to generate summaries for conversations.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/update-conversation-summaries"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { checkPlanPermission } from '@/utils/helpers'
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

  console.log('cron update-conversation-summaries started!')

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const teamsSnapshot = await firestore
      .collection('teams')
      .where('stripeSubscriptionStatus', 'in', ['active', 'trialing'])
      .get()

    const fetchTasks = []

    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = { id: teamDoc.id, ...teamDoc.data() }
      if (!checkPlanPermission(teamData, 'standard').allowed) {
        continue
      }

      const botsSnapshot = await teamDoc.ref.collection('bots').get()
      for (const botDoc of botsSnapshot.docs) {
        const conversationsSnapshot = await botDoc.ref
          .collection('conversations')
          .where('updatedAt', '<=', twelveHoursAgo)
          .where('updatedAt', '>=', twentyFourHoursAgo)
          .where('summary', '==', null)
          .get()

        let botData = { id: botDoc.id, ...botDoc.data() }
        if (!botData.signatureKey) {
          botData.signatureKey = crypto.randomBytes(32).toString('hex')
          await botDoc.ref.update({ signatureKey: botData.signatureKey })
        }

        const hmac = crypto.createHmac('sha256', botData.signatureKey)
        const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12
        hmac.update(`${botDoc.id}:${expires}`)
        const signature = `${hmac.digest('hex')}:${expires}`

        conversationsSnapshot.docs.forEach((convoDoc) => {
          const url = `https://api.docsbot.ai/teams/${teamDoc.id}/bots/${botDoc.id}/conversations/${convoDoc.id}/summarize`
          fetchTasks.push(() =>
            fetch(url, {
              headers: { Authorization: `Bearer ${signature}` },
            }).catch((error) =>
              console.warn(
                'Error calling summarize for',
                teamDoc.id,
                botDoc.id,
                convoDoc.id,
                error
              )
            )
          )
        })
      }
    }

    const concurrency = 5
    for (let i = 0; i < fetchTasks.length; i += concurrency) {
      await Promise.all(fetchTasks.slice(i, i + concurrency).map((fn) => fn()))
    }
    console.log(`cron update-conversation-summaries completed with ${fetchTasks.length} summaries generated`)
  } catch (error) {
    console.warn('Error running update-conversation-summaries:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}
