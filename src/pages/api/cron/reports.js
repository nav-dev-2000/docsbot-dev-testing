/**
 * Reports Generation Cron Job
 * 
 * This cron job runs monthly to queue report generation for eligible bots.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/reports"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

import { getFirestore, FieldPath } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { teamOwner, bentoTrack } from '@/lib/bento'
import { checkPlanPermission } from '@/utils/helpers'
import { QueueReport } from '@/lib/service'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()
  const staffTeamId = 'ZrbLG98bbxZ9EFqiPvyl'

  // Check for CRON_SECRET authorization (bypass in development if not set)
  const authHeader = request.headers.authorization
  const expectedSecret = process.env.CRON_SECRET
  
  // In development, bypass protection if CRON_SECRET is not set
  if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
    response.status(401).json({ message: 'Unauthorized' })
    return
  }

  let currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() - 1)
  let currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  let statsMonth = currentDate.getMonth() + 1
  let currentYear = currentDate.getFullYear()
  const reportId = `${currentYear}-${currentMonth}`
  const historyKey = `${currentYear}-${statsMonth}`

  console.log('Cron reports started for month', reportId)

  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('stripeSubscriptionStatus', '==', 'active')
      .get()

    const teamDocs = [...teamsSnapshot.docs]
    if (!teamDocs.some((teamDoc) => teamDoc.id === staffTeamId)) {
      const staffTeamDoc = await firestore.collection('teams').doc(staffTeamId).get()
      if (staffTeamDoc.exists) {
        teamDocs.push(staffTeamDoc)
      }
    }

    const teamsPromises = teamDocs.map(async (teamDoc) => {
      try {
        const team = teamDoc.data()
        //check if team is Business or staff account
        if (!checkPlanPermission(team, 'business').allowed && team.id !== staffTeamId) {
          //console.log('Skipping team', teamDoc.id, 'is not Business+')
          return
        } else {
          const botsSnapshot = await teamDoc.ref
            .collection('bots')
            .select('questionHistory', 'status')
            .get()

          const botPromises = botsSnapshot.docs.map(async (botDoc) => {
            const bot = botDoc.data()
            //check basic question counts
            if (
              bot.status !== 'ready' ||
              !bot.questionHistory ||
              !bot.questionHistory[historyKey] ||
              bot.questionHistory[historyKey].questions < 100
            ) {
              //console.log('Skipping bot', teamDoc.id, botDoc.id, 'has no question count for', reportId);
              return
            } else {
              const report = await botDoc.ref.collection('reports').doc(reportId).get()
              if (report.exists) {
                //console.log('Skipping bot', teamDoc.id, botDoc.id, 'already has report for', reportId)
                return
              } else {
                console.log('Queueing report for', teamDoc.id, botDoc.id, 'for', reportId)
                QueueReport(teamDoc.id, botDoc.id)
              }
            }
          })
          await Promise.all(botPromises)
        }
      } catch (error) {
        console.error('Error processing team', teamDoc.id, error)
      }
    })
    await Promise.all(teamsPromises)
  } catch (error) {
    console.warn('Error queuing reports:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}
