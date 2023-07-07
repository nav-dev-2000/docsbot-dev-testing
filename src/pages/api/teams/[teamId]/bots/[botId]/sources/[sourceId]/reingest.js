import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBot, getSource } from '@/lib/dbQueries'
import { QueueSourceRegest } from '@/lib/service'
import { checkSourceScheduledFromInterval } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import { canSourceTypeSchedule } from '@/constants/sourceTypes.constants'
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
    if (!canSourceTypeSchedule(source.type)) {
      return res.status(403).json({ message: "Only sources of a dynamic type (URLs) can be refreshed!" })
    }

    try {
      const { interval } = req.body

      // if interval is none, remove the scheduled field
      if (interval === 'none') {
        firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('sources').doc(sourceId).update({
          scheduled: FieldValue.delete(),
          scheduleInterval: interval,
        });
        return res.status(200).json({ message: 'success' })
      }

      const scheduled = checkSourceScheduledFromInterval(team, interval);
      firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('sources').doc(sourceId).update({
        scheduled,
        scheduleInterval: interval,
      });

      return res.status(200).json({ newScheduled: scheduled.toJSON() })
    } catch (error) {
      console.warn('Error setting source interval:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'PATCH') {
    try {
      const { faqs } = req.body

      if (source.type !== 'qa') {
        return res.status(403).json({ message: "Only sources of type 'QA' can be updated!" })
      }

      firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('sources').doc(sourceId).update({
        faqs,
      }).then(() => {
        QueueSourceRegest(team.id, botId, sourceId);
      })

      return res.status(200).json({ message: 'success' })
    } catch (error) {
      console.warn('Error updating source:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'POST') {
    if (!canSourceTypeSchedule(source.type)) {
      return res.status(403).json({ message: "Only sources of a dynamic type (URLs) can be refreshed!" })
    }

    try {
      if (!source.scheduleInterval || source.scheduleInterval === 'none') {
        QueueSourceRegest(team.id, botId, sourceId);
        return res.status(200).json({ message: 'success' })
      }

      // grab next schedule date
      const nextSchedule = checkSourceScheduledFromInterval(team, source.scheduleInterval)

      // update and reingest source
      firestore.collection('teams').doc(team.id).collection('bots').doc(botId).collection('sources').doc(sourceId).update({
        'scheduled': nextSchedule,
      }).then(() => {
        QueueSourceRegest(team.id, botId, sourceId);
      })

      return res.status(200).json({ newScheduled: nextSchedule.toJSON() })
    } catch (error) {
      console.warn('Error setting source interval:', error)
      return res.status(500).json({ message: error?.message })
    }

  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
