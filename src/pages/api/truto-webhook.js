import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { QueueSourceRegest } from '@/lib/service'
import { stripePlan } from '@/utils/helpers'
import { getSource, getSources, getTeam } from '@/lib/dbQueries'
import { GetIntegratedAccountsByTenantID, GetTenantId, DeleteIntegratedAccount } from '@/lib/truto'
import crypto from 'crypto'

const DEBUG_CONTENT_PREVIEW_LENGTH = 500

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



/**
 * Removes orphaned Truto integrations that no longer have corresponding sources
 * 
 * When a new integration is created, this checks all existing integrations for the tenant
 * and removes any that don't have an associated source in our system. This prevents
 * accumulation of stale/unused integrations.
 *
 * @param {string} team_id - The ID of the team
 * @param {string} bot_id - The ID of the bot
 * @param {string|null} integrated_account_id - Optional ID of a newly created integration to exclude from cleanup
 * @returns {Promise<void>}
 */
const purgeOrphans = async (team_id, bot_id, integrated_account_id = null) => {
  console.log("Purging orphans for", team_id, bot_id)
  const tenant_id = GetTenantId(team_id, bot_id)
  const { sources } = await getSources(team_id, {id: bot_id})
  const integratedAccounts = await GetIntegratedAccountsByTenantID(tenant_id)

  integratedAccounts.forEach(async integratedAccount => {
    const id = integratedAccount.id
    // check if source for this integrated account exists
    const source = sources.find(source => source.trutoIntegrationID === id)
    if (!source && id !== integrated_account_id) {
      console.log("Removing orphaned integration", id)
      await DeleteIntegratedAccount(id)
    }
  })
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
    const { id: sync_job_id, event, payload } = body

    console.log('sync_job_id', sync_job_id, 'event', event)
    if (event.startsWith('sync_job_run:record')) {
      console.log(JSON.stringify(payload, null, 2))
    }

    if (!sync_job_id || !event || !payload) {
      return res.status(400).send({ message: 'Missing required fields' })
    }

    // purge orphaned integrations on integration creation
    if (event === 'integrated_account:created') {
      const { id: integrated_account_id, tenant_id } = payload
      const [team_id, bot_id] = tenant_id.split('-')
      if (!team_id || !bot_id) {
        return res.status(400).send({ message: 'Invalid tenant_id format' })
      }

      await purgeOrphans(team_id, bot_id, integrated_account_id)
      return res.status(200).send({ message: 'OK' })
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

    if (process.env.NODE_ENV === 'development') {
      try {
        const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
        const prefix = `teams/${team_id}/bots/${bot_id}/sources/${source_id}`
        const [files] = await bucket.getFiles({ prefix })
        const account = { team_id, bot_id, source_id }
        const fileList = await Promise.all(
          files.map(async (file, index) => {
            const [metadata] = await file.getMetadata()
            const size = Number(metadata?.size ?? 0)
            const includeContent = index < 2
            let contentPreview = ''
            if (includeContent) {
              try {
                const [buf] = await file.download()
                const str = buf.toString('utf8')
                contentPreview = str.length > DEBUG_CONTENT_PREVIEW_LENGTH
                  ? str.slice(0, DEBUG_CONTENT_PREVIEW_LENGTH) + '...'
                  : str
              } catch (e) {
                contentPreview = `(failed to read: ${e.message})`
              }
            }
            return {
              name: file.name,
              size,
              ...(includeContent && { content: contentPreview }),
            }
          })
        )
        console.log('[Truto webhook] Firebase storage after sync:', JSON.stringify({
          account,
          fileCount: fileList.length,
          files: fileList,
        }, null, 2))
      } catch (debugErr) {
        console.error('[Truto webhook] Debug list storage failed:', debugErr)
      }
    }

    try {
      await QueueSourceRegest(team_id, bot_id, source_id)
    } catch (error) {
      // Save the failed source status to the DB
      try {
        await db
          .collection('teams')
          .doc(team_id)
          .collection('bots')
          .doc(bot_id)
          .collection('sources')
          .doc(source_id)
          .update({
            status: 'failed',
            error: error.message || 'Failed to process source from Truto webhook',
          });
      } catch (dbError) {
        console.error('Failed to update source status in DB:', dbError);
      }
      console.error(error)
    }
    try {
      await purgeOrphans(team_id, bot_id, integrated_account_id)
    } catch (error) {
      console.error('Failed to purge orphans:', error);
    }
    return res.status(200).send({ message: 'OK' })
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}