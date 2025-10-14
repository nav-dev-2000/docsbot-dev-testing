import { PubSub } from '@google-cloud/pubsub'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getTeam } from '@/lib/dbQueries'
import { stripePlan } from '@/utils/helpers'
import { isTrutoSourceType } from '@/constants/sourceTypes.constants'

const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
const PUBSUB_CLIENT = new PubSub({
  projectId: SERVICE_ACCOUNT.project_id,
  credentials: SERVICE_ACCOUNT,
})
const PUBSUB_TOPIC = 'docsbot-ingest'
const PUBSUB_REPORTS_TOPIC = 'docsbot-report'

export const QueueSourceIngest = async (
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
  runId = null,
) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'ingest',
      teamId,
      botId,
      sourceId,
      pageLimit: Math.max(pageLimit, 0),
      indexId,
      type,
      title,
      url,
      file,
      faqs,
      runId,
    })
  )
  console.log(JSON.stringify({
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
    runId,
  }))
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueSourceExpel = async (teamId, indexId, botId, sourceId) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'expel',
      teamId,
      botId,
      indexId,
      sourceId,
    })
  )
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueIntegration = async (teamId, type, appID, appSecret) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'integration',
      teamId,
      type,
      appID,
      appSecret,
     })
  )
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueBotCopy = async (teamId, fromBotId, toBotId) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'copy',
      teamId,
      fromBotId,
      toBotId,
     })
  )
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

export const QueueSourceRegest = async (teamId, botId, sourceId, uData = {}) => {
  const firestore = getFirestore()

  // check and update status to 'pending'
  const sourceRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('sources')
    .doc(sourceId)
  const source = await sourceRef.get()
  const sourceData = source.data()
  
  // Prevent refreshing YouTube sources
  if (sourceData.type === 'youtube') {
    throw new Error("Refreshing YouTube sources is not allowed.")
  }

  // prevent refreshing sources that are not ready or failed. Truto will be in indexing state when we regest (new or refresh)
  if (sourceData.status !== 'ready' && sourceData.status !== 'failed' && (!isTrutoSourceType(sourceData.type) && sourceData.status !== 'indexing')) {
    throw new Error("Cannot refresh source that is not 'ready' or 'failed.")
  }

  const data = {
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    crawlId: FieldValue.delete(),
    refreshing: true,
    ...uData
  }

  await sourceRef.update(data)

  // grab pageLimit
  const team = await getTeam(teamId)
  const pageLimit = Math.max(stripePlan(team).pages - team.pageCount, 0)

  if (pageLimit === 0) {
    throw new Error('You have reached your page limit.')
  }

  if (
    team?.lastError?.type === 'source' &&
    team?.lastError?.botId === botId &&
    team?.lastError?.sourceId === sourceId
  ) {
    await firestore.collection('teams').doc(teamId).update({
      lastError: FieldValue.delete(),
    })
  }

  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'regest',
      type: isTrutoSourceType(sourceData.type) ? 'truto' : sourceData.type,
      teamId,
      botId,
      sourceId,
      pageLimit,
    })
  )

  console.log(JSON.stringify({
    action: 'regest',
    teamId,
    botId,
    sourceId,
    pageLimit,
  }))
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_TOPIC}.`)
  return messageId
}

/*
YOu can manually publish a message to trigger report like this:
https://console.cloud.google.com/cloudpubsub/topic/detail/docsbot-report?project=docsbotai&tab=messages
{
  "action": "report",
  "teamId": "dLbpMCFxf0DU53JB0aBU",
  "botId": "yeJDiVixfHo5yMe4ufHx"
}
*/
export const QueueReport = async (teamId, botId) => {
  const dataBuffer = Buffer.from(
    JSON.stringify({
      action: 'report',
      teamId,
      botId,
    })
  )
  const messageId = await PUBSUB_CLIENT.topic(PUBSUB_REPORTS_TOPIC).publishMessage({ data: dataBuffer })
  console.log(`Message ${messageId} published to ${PUBSUB_REPORTS_TOPIC}.`)
  return messageId
}
