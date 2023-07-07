import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBot, getSource } from '@/lib/dbQueries'
import { QueueSourceIngest, QueueSourceExpel } from '@/lib/service'
import { stripePlan } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import userTeamCheck from '@/lib/userTeamCheck'

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

  if (req.method === 'PUT') {
    //error if source is not in failed state
    if (source.status !== 'failed') {
      return res.status(409).json({ message: 'Only failed sources can be retried currently.' })
    }

    //update source status in db
    try {
      await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .doc(sourceId)
        .update({
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(), //update timestamp so that it doesn't timeout
        })

      //track custom prompt
      try {
        bentoTrack(userId, 'track', {
          type: 'retrySource',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      //increment sourceCounts on team
      try {
        await firestore.runTransaction(async (transaction) => {
          const teamRef = firestore.collection('teams').doc(team.id)
          const sfDoc = await transaction.get(teamRef)
          if (!sfDoc.exists) {
            throw 'Team does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(teamRef, {
            sourceCount: newSourceCount,
          })
        })

        //increment source counts on bot
        await firestore.runTransaction(async (transaction) => {
          const botRef = firestore.collection('teams').doc(team.id).collection('bots').doc(botId)
          const sfDoc = await transaction.get(botRef)
          if (!sfDoc.exists) {
            throw 'Bot does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(botRef, {
            sourceCount: newSourceCount,
          })
        })
      } catch (e) {
        console.warn('Increment transaction failed: ', e)
      }

      //add source event to pub/sub queue for processing
      await QueueSourceIngest(team.id, botId, sourceId, stripePlan(team).pages - team.pageCount, bot.indexId, source.type, source.title, source.url, source.file, source.faqs)

      //done, return source object
      return res.status(201).json(await getSource(team, bot, sourceId))
    } catch (error) {
      console.warn('Error updating source doc:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    //if source is in a ready state, we need to delete it from weaviate\
    if (source.status === 'ready' || source.status === 'failed') {
      QueueSourceExpel(team.id, bot.indexId, source.id)
    } else {
      return res.status(409).json({ message: 'Please wait until indexing is complete before deleting this source.' })
    }

    //delete source from db
    try {
      await firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(team.id)
        const botRef = teamRef.collection('bots').doc(botId)
        const sourceRef = botRef.collection('sources').doc(sourceId)
        const teamDoc = await transaction.get(teamRef)
        const botDoc = await transaction.get(botRef)
        const sourceDoc = await transaction.get(sourceRef)
        if (!teamDoc.exists) {
          throw 'Team does not exist!'
        }

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
          const newBotStatus = (newBotSourceCount == 0 ? 'pending' : 'ready')
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

      //track custom prompt
      try {
        bentoTrack(userId, 'track', {
          type: 'deleteSource',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      // send response
      return res.status(200).json({ message: 'Source deleted successfully' })
    } catch (error) {
      console.warn('Error deleting source doc:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    return res.json(source)
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
