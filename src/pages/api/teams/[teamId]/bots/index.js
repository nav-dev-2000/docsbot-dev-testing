import userTeamCheck from '@/lib/userTeamCheck'
import { getBots, getBot } from '@/lib/dbQueries'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { bentoTrack } from '@/lib/bento'
import { createRouter } from 'next-connect'
import { createTenant } from '@/lib/weaviate'
import { detectRegionFromHeaders } from '@/lib/regionUtils'
import { stripePlan } from '@/utils/helpers'
import { QueueBotCopy } from '@/lib/service'
import { phTrack } from '@/lib/posthog'
import { validateBotParams } from '@/lib/apiFunctions'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import { clearCloudflareCache } from '@/lib/cloudflare'
import {
  isVectorDbMaintenanceEnabled,
  vectorDbMaintenanceResponse,
} from '@/lib/maintenance'
import { copyDemoTemplateStatisticsToBot } from '@/lib/demoBotStatistics'

const router = createRouter()

router.post(async (req, res) => {
  configureFirebaseApp()
  const firestore = getFirestore()

  // Check if user has access to the team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  try {
    if (isVectorDbMaintenanceEnabled()) {
      return res.status(503).json(vectorDbMaintenanceResponse())
    }

    //check user is allowed to create bot or not
    if (!canUserCreateDeleteBot(team, userId)) {
      return res.status(403).json({
        message: 'You are not allowed to create bot.',
      })
    }

    // Check plan credits
    if (stripePlan(team).bots <= team.botCount) {
      return res.status(402).json({
        message: 'Bot limit exceeded. Please upgrade your plan.',
      })
    }

    const { copyFrom } = req.body

    // Data validation
    let botData = {}
    try {
      botData = await validateBotParams(req, team, userId, false, null)
    } catch (error) {
      return res.status(400).json({ message: error?.message })
    }

    const vectorDatabase = botData.vectorDatabase ?? 'turbopuffer'
    const region = botData.region ?? detectRegionFromHeaders(req.headers)

    //increment botCounts on team first to avoid race condition
    await firestore.runTransaction(async (transaction) => {
      const teamRef = firestore.collection('teams').doc(team.id)
      const sfDoc = await transaction.get(teamRef)
      if (!sfDoc.exists) {
        throw 'Team does not exist!'
      }

      const newBotCount = (sfDoc.data().botCount || 0) + 1
      transaction.update(teamRef, {
        botCount: newBotCount,
      })
    })

    // Create bot in db
    const docRef = await firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .add({
        ...botData,
        vectorDatabase,
        region,
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending',
        indexId: vectorDatabase === 'weaviate' ? 'TenantDocument' : 'turbopuffer',
        sourceCount: 0,
        pageCount: 0,
        chunkCount: 0,
        questionCount: 0,
        // No per-bot overrides by default; team role inheritance handles access.
        roles: {},
      })

    const botId = docRef.id

    if (vectorDatabase === 'weaviate') {
      try {
        await createTenant(team, botId)
      } catch (error) {
        console.error('Error creating bot DB', error)
        if (botId) {
          // Delete bot object
          await firestore
            .collection('teams')
            .doc(team.id)
            .collection('bots')
            .doc(botId)
            .delete()
        }
        // Decrement botCount on team since bot creation failed
        await firestore.runTransaction(async (transaction) => {
          const teamRef = firestore.collection('teams').doc(team.id)
          const sfDoc = await transaction.get(teamRef)
          if (!sfDoc.exists) {
            throw 'Team does not exist!'
          }

          const currentBotCount = sfDoc.data().botCount || 0
          const newBotCount = Math.max(currentBotCount - 1, 0) // Ensure count doesn't go below 0
          transaction.update(teamRef, {
            botCount: newBotCount,
          })
        })
        return res
          .status(500)
          .json({
            message:
              'Error creating bot DB. Please try again or contact support.',
          })
      }
    }

    // Copy demo template statistics to bot so that there will be pretty reports charts
    const demoTeamId = process.env.NEXT_PUBLIC_DEMO_TEAM_ID
    if (demoTeamId && team.id === demoTeamId) {
      await copyDemoTemplateStatisticsToBot(firestore, docRef)
    }

    // if copyFrom is defined, run the pubsub copy function
    if (copyFrom) {
      // Check if the user owns the copyFrom bot in the team
      const copyFromBot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(copyFrom)
        .get()
      if (!copyFromBot.exists) {
        throw new Error('The bot to copy from does not exist in this team.')
      }

      console.log(`copying ${copyFrom} to ${botId}...`)
      await QueueBotCopy(team.id, copyFrom, botId, region)
    }

    // Clear Cloudflare cache after creating the bot (asynchronously)
    await clearCloudflareCache(team.id, botId)

    try {
      bentoTrack(userId, 'track', {
        type: 'createBot',
        botName: botData.name,
      })
      phTrack(userId, 'Bot Created', { 'Bot name': botData.name }, team.id)
    } catch (e) {
      console.log('Error sending tracking', e)
    }

    return res.status(201).json(await getBot(team.id, botId))
  } catch (error) {
    console.error(error)
    // Restore botCount on team if error
    await firestore
    .collection('teams')
    .doc(team.id)
    .update({
      botCount: team.botCount,
    })
    return res.status(500).json({ message: error?.message })
  }
})

router.get(async (req, res) => {
  // Check if user has access to the team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  // TODO add pagination
  try {
    const recentSources = await getBots(team, req.params?.resultLimit || 1000)
    return res.json(recentSources)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
})

export default router.handler({
  onError(error, req, res) {
    res.status(500).json({ message: error?.message })
  },
  onNoMatch(req, res) {
    res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  },
})
