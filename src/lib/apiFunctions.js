import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
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
