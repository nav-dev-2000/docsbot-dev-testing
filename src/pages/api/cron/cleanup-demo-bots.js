/**
 * Demo Bot Cleanup Cron Job
 * 
 * This cron job runs daily at 2:00 AM UTC to clean up demo bots older than 1 month.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/cleanup-demo-bots"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { deleteBot } from '@/lib/apiFunctions'

// Demo team ID from environment variables
const DEMO_TEAM_ID = process.env.NEXT_PUBLIC_DEMO_TEAM_ID

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check for CRON_SECRET authorization (bypass in development if not set)
  const authHeader = req.headers.authorization
  const expectedSecret = process.env.CRON_SECRET
  
  // In development, bypass protection if CRON_SECRET is not set
  if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (!DEMO_TEAM_ID) {
    return res.status(500).json({ 
      message: 'Demo team ID not configured. Please set NEXT_PUBLIC_DEMO_TEAM_ID environment variable.' 
    })
  }

  try {
    configureFirebaseApp()
    const firestore = getFirestore()

    // Calculate the cutoff date (1 month ago)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    console.log(`Starting demo bot cleanup for bots created before: ${oneMonthAgo.toISOString()}`)

    // Query all bots in the demo team
    const botsSnapshot = await firestore
      .collection('teams')
      .doc(DEMO_TEAM_ID)
      .collection('bots')
      .get()

    const botsToDelete = []
    let totalBots = 0

    // Check each bot's createdAt timestamp
    botsSnapshot.forEach((doc) => {
      totalBots++
      const botData = doc.data()
      const createdAt = botData.createdAt?.toDate()
      
      if (createdAt && createdAt < oneMonthAgo) {
        botsToDelete.push({
          id: doc.id,
          createdAt: createdAt.toISOString(),
          name: botData.name || 'Unnamed Bot'
        })
      }
    })

    console.log(`Found ${totalBots} total bots, ${botsToDelete.length} bots to delete`)

    // Delete bots that are older than 1 month
    const deletionResults = []
    for (const bot of botsToDelete) {
      try {
        console.log(`Deleting bot: ${bot.name} (${bot.id}) created at ${bot.createdAt}`)
        await deleteBot(DEMO_TEAM_ID, bot.id)
        deletionResults.push({
          id: bot.id,
          name: bot.name,
          createdAt: bot.createdAt,
          status: 'deleted'
        })
      } catch (error) {
        console.error(`Error deleting bot ${bot.id}:`, error)
        deletionResults.push({
          id: bot.id,
          name: bot.name,
          createdAt: bot.createdAt,
          status: 'error',
          error: error.message
        })
      }
    }

    const successCount = deletionResults.filter(r => r.status === 'deleted').length
    const errorCount = deletionResults.filter(r => r.status === 'error').length

    console.log(`Demo bot cleanup completed. Deleted: ${successCount}, Errors: ${errorCount}`)

    return res.status(200).json({
      message: 'Demo bot cleanup completed',
      summary: {
        totalBots,
        botsToDelete: botsToDelete.length,
        deleted: successCount,
        errors: errorCount
      },
      results: deletionResults
    })

  } catch (error) {
    console.error('Error during demo bot cleanup:', error)
    return res.status(500).json({ 
      message: 'Internal server error during cleanup',
      error: error.message 
    })
  }
}
