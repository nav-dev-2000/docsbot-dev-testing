import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { deleteSchema } from '@/lib/weaviate'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'PUT') {
    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' })
      }

      const { name, description, customPrompt, privacy } = req.body
      const botData = {}

      if (name) {
        botData.name = name.trim()
      }

      if (description) {
        botData.description = description.trim()
      }

      if (privacy) {
        if (privacy !== 'public' && privacy !== 'private') {
          return res.status(400).send({ message: 'Invalid param "privacy".' })
        } else {
          botData.privacy = privacy
        }
      }

      if (customPrompt !== undefined) {
        botData.customPrompt = customPrompt
      }

      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).update(botData)

      return res.status(200).json({ message: 'Bot updated' })
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    const bot = await getBot(team.id, botId)
    //delete bot from db
    try {
      // Delete all sources for bot
      const querySnapshot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .get()
      // Once we get the results, begin a batch
      const batch = firestore.batch()
      querySnapshot.forEach(function (doc) {
        // For each doc, add a delete operation to the batch
        batch.delete(doc.ref)
      })
      // Commit the batch
      await batch.commit()

      //delete schema in weaviate
      if (bot.indexId) {
        await deleteSchema(bot.indexId)
      }

      // Delete all questions for bot
      const questionsSnapshot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('questions')
        .get()
      // Once we get the results, begin a batch
      const questionsBatch = firestore.batch()
      questionsSnapshot.forEach(function (doc) {
        // For each doc, add a delete operation to the batch
        questionsBatch.delete(doc.ref)
      })
      // Commit the batch
      await questionsBatch.commit()

      //delete bot
      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).delete()

      //decrement botCounts on team
      await firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(team.id)
        const sfDoc = await transaction.get(teamRef)
        if (!sfDoc.exists) {
          throw 'Team does not exist!'
        }

        const newBotCount = Math.max(0, (sfDoc.data().botCount || 0) - 1)
        const newSourceCount = Math.max(0, (sfDoc.data().sourceCount || 0) - (bot.sourceCount || 0))
        const newPageCount = Math.max(0, (sfDoc.data().pageCount || 0) - (bot.pageCount || 0))
        const newChunkCount = Math.max(0, (sfDoc.data().chunkCount || 0) - (bot.chunkCount || 0))
        transaction.update(teamRef, {
          botCount: newBotCount,
          sourceCount: newSourceCount,
          pageCount: newPageCount,
          chunkCount: newChunkCount,
        })
      })

      //delete all bot data from bucket
      const bucket = getStorage().bucket('gs://docsbotai.appspot.com')
      await bucket.deleteFiles({ prefix: `teams/${team.id}/bots/${botId}` })

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBot',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Bot deleted' })
    } catch (error) {
      console.warn('Error deleting bot:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    try {
      const bot = await getBot(team.id, botId)
      if (bot) {
        return res.json(bot)
      } else {
        // doc.data() will be undefined in this case
        return res.status(404).json({ message: "botId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
