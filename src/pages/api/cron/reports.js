import { getFirestore, FieldPath } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { mpTrack } from '@/lib/mixpanel'
import { teamOwner, bentoTrack } from '@/lib/bento'
import { stripePlan } from '@/utils/helpers'
import { QueueReport } from '@/lib/service'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (!request.query.key || request.query.key !== '34hjslm8492hs521ds') {
    response.status(404).end()
    return
  }

  let currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() - 1)
  let currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  let currentYear = currentDate.getFullYear()
  const reportId = `${currentYear}-${currentMonth}`

  console.log('Cron reports started for month', reportId)

  let queuedCount = 0

  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('stripeSubscriptionStatus', '==', 'active')
      .get()

    teamLoop:
    for (const teamDoc of teamsSnapshot.docs) {
      try {
        const team = teamDoc.data()
        //check if team is Business
        if (stripePlan(team).bots < 100) {
          //console.log('Skipping team', teamDoc.id, 'is not Business+')
          return
        }

        //console.log('Checking team', teamDoc.id, 'for bots with no report for', reportId)

        const botsSnapshot = await teamDoc.ref
          .collection('bots')
          .select('questionCountHistory', 'status')
          .get()
        for (const botDoc of botsSnapshot.docs) {
          if (queuedCount >= 4) {
            console.log('Bailing till next cron run to avoid OpenAI rate limit')
            break teamLoop
          }
          const bot = botDoc.data()
          //check basic question counts
          if (!bot.questionCountHistory || bot.status !== 'ready') {
            console.log('Skipping bot', teamDoc.id, botDoc.id, 'has no question count for', reportId)
            continue
          }

          const report = await botDoc.ref.collection('reports').doc(reportId).get()
          if (report.exists) {
            console.log('Skipping bot', teamDoc.id, botDoc.id, 'already has report for', reportId)
            continue
          }

          console.log('Queueing report for', teamDoc.id, botDoc.id, 'for', reportId)
          QueueReport(teamDoc.id, botDoc.id)
          queuedCount++
        }
      } catch (error) {
        console.warn(`Error queuing reports team ${teamDoc.id}:`, error)
        return
      }
    }

  } catch (error) {
    console.warn('Error queuing reports:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}
