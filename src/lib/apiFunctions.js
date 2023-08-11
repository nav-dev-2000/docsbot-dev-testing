import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldPath } from 'firebase-admin/firestore'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import { getBot } from '@/lib/dbQueries'
import { deleteSchema } from '@/lib/weaviate'
import { QueueSourceExpel } from '@/lib/service'
import { isCarbonSourceType } from '@/constants/sourceTypes.constants'
import { getCarbonCustomerID } from '@/lib/carbon'
import axios from 'axios'

export const deleteSource = async (teamId, bot, sourceId, deleteCarbon = true) => {
  configureFirebaseApp()
  const firestore = getFirestore()

  //if source is in a ready state, we need to delete it from weaviate
  QueueSourceExpel(teamId, bot.indexId, sourceId)

  //delete source from db
  let source = null
  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('teams').doc(teamId)
    const botRef = teamRef.collection('bots').doc(bot.id)
    const sourceRef = botRef.collection('sources').doc(sourceId)
    const teamDoc = await transaction.get(teamRef)
    const botDoc = await transaction.get(botRef)
    const sourceDoc = await transaction.get(sourceRef)
    if (!teamDoc.exists) {
      throw 'Team does not exist!'
    }

    source = sourceDoc.data()

    // decrement team counts (if the source was ingested)
    if (sourceDoc.data().status == 'ready') {
      const newTeamSourceCount = (teamDoc.data().sourceCount || 0) - 1
      const newTeamChunkCount = (teamDoc.data().chunkCount || 0) - sourceDoc.data().chunkCount
      const newTeamPageCount = (teamDoc.data().pageCount || 0) - sourceDoc.data().pageCount
      transaction.update(teamRef, {
        sourceCount: newTeamSourceCount,
        chunkCount: newTeamChunkCount,
        pageCount: newTeamPageCount,
        needsUpdate: true,
      })

      // decrement bot counts
      const newBotSourceCount = (botDoc.data().sourceCount || 0) - 1
      const newBotChunkCount = (botDoc.data().chunkCount || 0) - sourceDoc.data().chunkCount
      const newBotPageCount = (botDoc.data().pageCount || 0) - sourceDoc.data().pageCount
      const newBotStatus = newBotSourceCount == 0 ? 'pending' : 'ready'
      transaction.update(botRef, {
        sourceCount: newBotSourceCount,
        chunkCount: newBotChunkCount,
        pageCount: newBotPageCount,
        status: newBotStatus,
      })
    }

    // remove source
    transaction.delete(sourceRef)
  })

  // for Carbon sources we need to delete the files from the Carbon API
  /*
  if (deleteCarbon && isCarbonSourceType(source.type)) {
    try {
      const headers = {
        headers: {
          'Content-Type': 'application/json',
          'customer-id': getCarbonCustomerID(teamId, bot.id),
          authorization: `Bearer ${process.env.CARBON_API_KEY}`,
        },
      }

      await Promise.all(
        source.carbonFiles.map(async (file) => {
          if (file.fileId) {
            // https://api.carbon.ai/redoc#tag/user_files/operation/del_file_deletefile__file_id__delete
            const resp = await axios.delete(
              `https://api.carbon.ai/deletefile/${file.fileId}`,
              {},
              headers
            )
            console.log('Deleted file from Carbon API', resp.status)
          }
        })
      )
    } catch (e) {
      console.log('Error deleting file from Carbon API', e)
    }
  }
  */

  return true
}

export const deleteBot = async (teamId, botId) => {
  configureFirebaseApp()
  const firestore = getFirestore()
  const bot = await getBot(teamId, botId)

  //delete bot from db

  // Delete all sources for bot
  const querySnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('sources')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()

  // Once we get the results, begin a batch
  let toDelete = []
  querySnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  //loop through toDelete and delete in batches of 500
  let counter = 0
  let sourcesBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    sourcesBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 500 operations
    if (counter % 500 === 0) {
      await sourcesBatch.commit()
      sourcesBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await sourcesBatch.commit()

  // Delete all questions for bot
  const questionsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()
  // Once we get the results, begin a batch
  toDelete = []
  questionsSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })
  //loop through toDelete and delete in batches of 500
  counter = 0
  let questionsBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    questionsBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 500 operations
    if (counter % 500 === 0) {
      await questionsBatch.commit()
      questionsBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await questionsBatch.commit()

  //delete bot
  await firestore.collection('teams').doc(teamId).collection('bots').doc(botId).delete()

  //decrement botCounts on team
  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('teams').doc(teamId)
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
  const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
  await bucket.deleteFiles({ prefix: `teams/${teamId}/bots/${botId}` })

  //delete schema in weaviate async
  if (bot.indexId) {
    try {
      deleteSchema(bot.indexId)
    } catch (error) {
      console.warn('Error deleting Weaviate Schema:', error)
    }
  }

  return true
}
