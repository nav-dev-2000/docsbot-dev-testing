import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { PubSub } from '@google-cloud/pubsub'
import { getBot, getSources, getSource } from '@/lib/dbQueries'
import { stripePlan } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import { uuidv4 } from '@firebase/util'

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

  let bot = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  //create source
  if (req.method === 'POST') {
    //check plan credits
    if (stripePlan(team).sources <= team.sourceCount || stripePlan(team).pages <= team.pageCount) {
      return res.status(402).json({
        message: 'Source or page limit exceeded. Please upgrade your plan.',
      })
    }

    //data validation
    let { type, title, url, file } = req.body

    if (!type || !sourceTypes.find((sourceType) => sourceType.id === type)) {
      return res.status(400).send({ message: 'Invalid parameter "type".' })
    }

    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)

    //check if they are pro and can use the source type
    if (sourceType.isPro && stripePlan(team).name === 'Free') {
      return res.status(402).json({
        message: 'Source type not available on your plan. Please upgrade your plan.',
      })
    }

    url = url?.trim() || null
    if (
      sourceType.fieldUrl === 'required' &&
      (!url || !url.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/))
    ) {
      return res.status(400).send({ message: 'Invalid or missing parameter "url".' })
    }

    title = title?.trim() || null
    if (sourceType.fieldTitle === 'required' && !title) {
      return res.status(400).send({ message: 'Invalid or missing parameter "title".' })
    }

    if (sourceType.fieldFile === 'required' && !file) {
      return res.status(400).send({ message: 'Invalid or missing parameter "file".' })
    }

    //check file type, mostly for sanity
    if (file) {
      const extension = file.split('.').pop()
      if (!Object.keys(sourceType.fileTypes).includes(extension)) {
        return res.status(400).send({ message: 'Invalid file type.' })
      }

      //generate uuid for file name with same extension
      const uuid = uuidv4()
      //move the file to the correct location in bucket
      const newFile = `teams/${team.id}/bots/${botId}/${uuid}.${extension}`
      const bucket = getStorage().bucket('gs://customchat-bot.appspot.com')
      const fileRef = bucket.file(file)
      await fileRef.move(newFile)
      file = newFile
    }

    try {
      const docRef = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .add({
          createdAt: FieldValue.serverTimestamp(),
          type,
          title,
          url,
          file,
          status: 'pending',
          pageCount: 0,
          chunkCount: 0,
        })

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

      //TODO add source event to pub/sub queue for processing
      const pubSubClient = new PubSub()
      const topicName = 'docsbot_index'
      const dataBuffer = Buffer.from(
        JSON.stringify({
          teamId: team.id,
          botId,
          sourceId: docRef.id,
          pageLimit: stripePlan(team).pages - team.pageCount,
          indexId: bot.indexId,
          type,
          title,
          url,
          file,
        })
      )
      const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer })
      console.log(`Message ${messageId} published to ${topicName}.`)

      try {
        bentoTrack(userId, 'track', {
          type: 'createSource',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      //done, return source object
      return res.status(201).json(await getSource(team, bot, docRef.id))
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    const sourceLimit = parseInt(req.query.limit) || 10000
    const ascending = req.query.ascending || false
    try {
      return res.json(await getSources(team.id, bot, sourceLimit, ascending))
    } catch (e) {
      return res.status(500).json({ message: e?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
