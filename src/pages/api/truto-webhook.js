import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { QueueSourceRegest } from '@/lib/service'
import { stripePlan } from '@/utils/helpers'
import { getSource, getTeam } from '@/lib/dbQueries'
import crypto from 'crypto'

// const findTrutoSourceByIntegrationId = async (integrationId) => {
//     const db = getFirestore()
//     const sources = await db.collectionGroup('sources').where('trutoIntegrationID', '==', integrationId).limit(1).get()
//     if (!sources.empty) {
//         return sources.docs[0]  // return the first document
//     } else {
//         return null  // return null if no document matches
//     }
// }

const verifyTrutoWebhook = (signature, secret, rawBody) => {
  try {
    // Get HMAC from header
    const hmacFromHeader = Buffer.from(signature.split("v=")[1], "base64")

    // Convert rawBody to string if it's not already
    const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)

    // Calculate the SHA256 HMAC of the request body
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(bodyString)

    // Calculate the Base64 encoded version of the data
    const calculatedHmac = Buffer.from(hmac.digest("hex"), "hex")
    return crypto.timingSafeEqual(hmacFromHeader, calculatedHmac)
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return false
  }
}

// allow raw body parsing so we can verify the webhook signature
export const config = {
  api: {
    bodyParser: {
      raw: {
        type: '*/*',
        limit: '3mb'
      }
    }
  }
}

export default async function handler(req, res) {
  configureFirebaseApp()
  const db = getFirestore()

  if (req.method === 'POST') {
    const signature = req.headers['x-truto-signature']
    const webhookSecret = process.env.TRUTO_WEBHOOK_SIGNATURE

    if (!signature || !webhookSecret) {
      return res.status(401).send({ message: 'Missing signature or webhook secret' })
    }

    const rawBody = req.body
    const isVerified = verifyTrutoWebhook(signature, webhookSecret, rawBody)

    if (!isVerified) {
      return res.status(401).send({ message: 'Invalid webhook signature' })
    }

    // Since we're using raw body parser, we need to parse the body only if it's a string
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody
    const { id: sync_job_id, event, payload, webhook_id, tenant_id } = body

    console.log('sync_job_id', sync_job_id, 'event', event)
    if (event.startsWith('sync_job_run:record')) {
      console.log(JSON.stringify(payload, null, 2))
    }

    if (!sync_job_id || !event || !payload) {
      return res.status(400).send({ message: 'Missing required fields' })
    }

    // ignore events that we don't care about
    if (event !== 'sync_job_run:completed') {
      console.log(JSON.stringify(payload, null, 2))
      return res.status(200).send({ message: 'OK' })
    }

    const { id, args } = payload
    const { integrated_account_id, team_id, bot_id, source_id } = args

    const source = await getSource({id: team_id}, {id: bot_id}, source_id)
    if (!source) {
        console.log('no source found for integration_id', integrated_account_id)
        return res.status(200).send({ message: 'OK' })
    }

    // await QueueSourceIngest(
    //   team_id,
    //   bot_id,
    //   source_id,
    //   stripePlan(team).pages - team.pageCount,
    //   null,
    //   'truto',
    //   source?.title,
    //   source?.url,
    //   null,
    //   null,
    //   null
    // )
    await QueueSourceRegest(team_id, bot_id, source_id)
    return res.status(200).send({ message: 'OK' })
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}