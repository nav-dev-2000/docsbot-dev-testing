import { PubSub } from '@google-cloud/pubsub'
import { getFirestore } from 'firebase-admin/firestore'

const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
const PUBSUB_CLIENT = new PubSub({
  projectId: SERVICE_ACCOUNT.project_id,
  credentials: SERVICE_ACCOUNT,
})
const PUBSUB_TOPIC = 'docsbot-ingest'

export const QueueSourceIngest = async (teamId, botId, sourceId, pageLimit, indexId, type, title, url, file) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'ingest',
      teamId,
      botId,
      sourceId,
      pageLimit,
      indexId,
      type,
      title,
      url,
      file,
    })
  )
  // console.log(JSON.stringify({
  //   action: 'ingest',
  //   teamId,
  //   botId,
  //   sourceId,
  //   pageLimit,
  //   indexId,
  //   type,
  //   title,
  //   url,
  //   file,
  // }))
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueSourceExpel = async (teamId, indexId, sourceId) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'expel',
      teamId,
      indexId,
      sourceId,
    })
  )
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueSourceRegest = async (teamId, botId, sourceId) => {
  const firestore = getFirestore()

  // check and update status to 'pending'
  const sourceRef = firestore.collection('teams').doc(teamId).collection('bots').doc(botId).collection('sources').doc(sourceId)
  firestore.runTransaction(async (transaction) => {
    const source = await transaction.get(sourceRef)
    if (source.data().status !== 'ready') {
      throw new Error("Cannot refresh source that is not 'ready'." + source.data().status)
    }

    transaction.update(sourceRef, {
      status: 'pending',
      createdAt: new Date(),
    })
  })

  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'regest',
      teamId,
      botId,
      sourceId,
    })
  )

  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}