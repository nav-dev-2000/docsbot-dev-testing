import { PubSub } from '@google-cloud/pubsub'
import { getFirestore } from 'firebase-admin/firestore'
import { getTeam } from '@/lib/dbQueries'
import { stripePlan } from '@/utils/helpers'

const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
const PUBSUB_CLIENT = new PubSub({
  projectId: SERVICE_ACCOUNT.project_id,
  credentials: SERVICE_ACCOUNT,
})
const PUBSUB_TOPIC = 'docsbot-ingest'

export const QueueSourceIngest = async (teamId, botId, sourceId, pageLimit, indexId, type, title, url, file, faqs) => {
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
      faqs,
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
  await firestore.runTransaction(async (transaction) => {
    const source = await transaction.get(sourceRef)
    const sourceData = source.data()
    if (sourceData.status !== 'ready') {
      throw new Error("Cannot refresh source that is not 'ready'." + sourceData.status)
    }

    transaction.update(sourceRef, {
      status: 'pending',
      createdAt: new Date(),
    })
  })

  // grab pageLimit
  const team = await getTeam(teamId)
  const pageLimit = stripePlan(team).pages - team.pageCount

  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'regest',
      teamId,
      botId,
      sourceId,
      pageLimit
    })
  )

  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}