import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBot, getSource } from '@/lib/dbQueries'
import { QueueSourceIngest, QueueSourceExpel } from '@/lib/service'
import { stripePlan } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import userTeamCheck from '@/lib/userTeamCheck'
import { isCarbonSourceType } from '@/constants/sourceTypes.constants'
import { deleteSource } from '@/lib/apiFunctions'
import { canUserModifySources } from '@/utils/function.utils'
import { clearLastError } from '@/lib/apiFunctions'
import { isSuperAdmin } from '@/utils/helpers'

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

    //check user is allowed to edit this source or not
    if (!canUserModifySources(team, userId)) {
      return res.status(402).json({
        message: 'You are not allowed to edit this source',
      })
    }
    //error if source is not in failed state
    if (source.status !== 'failed' || source.refreshing) {
      return res
        .status(409)
        .json({ message: 'Only new failed sources can be retried currently.' })
    }

    // Error if it's a YouTube source
    if (source.type === 'youtube') {
      return res.status(400).json({ message: 'YouTube sources cannot be retried manually. Please delete and recreate the source.' })
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

        phTrack(userId, 'Source Retried', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      //skip pubsub if carbon, as it uses NextJS Vercel cron
      if (!isCarbonSourceType(source.type)) {
        //add source event to pub/sub queue for processing
        await QueueSourceIngest(
          team.id,
          botId,
          sourceId,
          stripePlan(team).pages - team.pageCount,
          bot.indexId,
          source.type,
          source.title,
          source.url,
          source.file,
          source.faqs,
        )
      }

      //done, return source object
      return res.status(201).json(await getSource(team, bot, sourceId))
    } catch (error) {
      console.warn('Error updating source doc:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {

    //check user is allowed to delete this source or not
    if (!canUserModifySources(team, userId)) {
      return res.status(402).json({
        message: 'You are not allowed to delete this source',
      })
    }
    //if source is in a ready state, we need to delete it from weaviate
    if (source.status !== 'ready' && source.status !== 'failed') {
      return res
        .status(409)
        .json({
          message:
            'Please wait until indexing is complete before deleting this source.',
        })
    }

    // check if lastError is related to this source
    if (team?.lastError && team?.lastError?.sourceId === sourceId) {
      // remove it!
      await clearLastError(team)
    }

    //delete source from db
    try {
      await deleteSource(team.id, bot, sourceId)

      //track custom prompt
      try {
        bentoTrack(userId, 'track', {
          type: 'deleteSource',
        })

        phTrack(userId, 'Source Deleted', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      // send response
      return res.status(200).json({ message: 'Source deleted successfully' })
    } catch (error) {
      console.warn('Error deleting source doc:', error)
      return res.status(500).json({ message: error })
    }
  } else if (req.method === 'GET') {
    return res.json(source)
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
