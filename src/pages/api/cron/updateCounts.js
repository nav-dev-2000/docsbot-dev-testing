import { getFirestore, Filter } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getQuestionStats } from '@/lib/dbQueries'
import { mpTrack } from '@/lib/mixpanel'
import { teamOwner, bentoTrack } from '@/lib/bento'
import { sendErrorEmail } from '../../../utils/emails'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  if (!request.query.key || request.query.key !== 'aowidjaowd3721') {
    response.status(404).end()
    return
  }

  console.log('cron updateCounts started!')

  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where(
        Filter.or(
          Filter.where('needsUpdate', '==', true),
          Filter.where('lastError.emailSent', '==', false)
        )
      )
      //.limit(5)
      .get()

    const teamsPromises = teamsSnapshot.docs.map(async (teamDoc) => {
      console.log('team', teamDoc.id, 'is scheduled to have the counts updated...')

      try {
        let currentDate = new Date()
        let currentDay = currentDate.getDate()
        let currentMonth = currentDate.getMonth() + 1
        let currentYear = currentDate.getFullYear()

        const teamData = teamDoc.data()

        if (teamData?.lastError && teamData.lastError?.emailSent == false) {
          const lastError = teamData.lastError

          // send email (only send for staff account for now)
          if (['ZrbLG98bbxZ9EFqiPvyl'].includes(teamDoc.id)) {
            await sendErrorEmail(teamData, lastError)
          }

          // update lastError.emailSent state
          await teamDoc.ref.update({
            lastError: {
              ...lastError,
              emailSent: true,
            }
          })

          return
        }

        const botsSnapshot = await teamDoc.ref
          .collection('bots')
          .select('questionHistory', 'questionHistoryDaily', 'name', 'embedded')
          .get()

        let questionTotal = 0
        let pageTotal = 0
        let sourceTotal = 0
        let upVotesTotal = 0
        let downVotesTotal = 0
        let escalationsTotal = 0
        let questionHistoryDailyNew = {}

        const botCounts = []

        for (const botDoc of botsSnapshot.docs) {
          const { monthly, daily } = await getQuestionStats(teamDoc.id, botDoc.id)

          // grab the # of source pages
          const sourcesSnapshot = await botDoc.ref.collection('sources').select('pageCount').get()
          const sourceCount = sourcesSnapshot.size
          const sourcePages = sourcesSnapshot.docs.map((sourceDoc) => sourceDoc.data().pageCount)
          const pageCount = sourcePages.reduce((accumulator, count) => accumulator + count, 0)

          const prevHistory = botDoc.data().questionHistory || {}
          const prevHistoryDaily = botDoc.data().questionHistoryDaily || {}

          const botData = {
            questionCount: monthly.questions,
            pageCount: pageCount,
            sourceCount: sourceCount,
            questionHistory: {
              ...prevHistory,
              [`${currentYear}-${currentMonth}`]: monthly,
            },
            questionHistoryDaily: {
              ...prevHistoryDaily,
              ...daily,
            },
          }

          const embedded = botDoc.data().embedded || false
          if (embedded == 'yes') {
            try {
              bentoTrack(teamOwner(teamData), 'track', {
                type: 'botUsed',
                botName: botDoc.data().name,
              })
              mpTrack(teamOwner(teamData), 'Bot Used', { 'Bot name': botDoc.data().name })
            } catch (error) {
              console.warn('Error tracking bot used:', error)
            }
            botData.embedded = 'recorded'
          }

          // update bot count
          await botDoc.ref.update(botData)

          botCounts.push({ pageCount, sourceCount, monthly, daily })
        }

        // take and sum the results
        for (const { pageCount, sourceCount, monthly, daily } of botCounts) {
          questionTotal += monthly.questions
          pageTotal += pageCount
          sourceTotal += sourceCount
          upVotesTotal += monthly.upVotes
          downVotesTotal += monthly.downVotes
          escalationsTotal += monthly.escalations

          //loop through daily
          for (const [day, value] of Object.entries(daily)) {
            questionHistoryDailyNew[day] = questionHistoryDailyNew[day] || {
              questions: 0,
              upVotes: 0,
              downVotes: 0,
              escalations: 0,
            }
            questionHistoryDailyNew[day].questions += value.questions
            questionHistoryDailyNew[day].upVotes += value.upVotes
            questionHistoryDailyNew[day].downVotes += value.downVotes
            questionHistoryDailyNew[day].escalations += value.escalations
          }
        }

        console.log(
          'team',
          teamDoc.id,
          'has',
          questionTotal,
          'questions,',
          sourceTotal,
          'sources,',
          pageTotal,
          'source pages'
        )

        // update team count && needsUpdate
        const prevHistory = teamData.questionHistory || {}
        const prevHistoryDaily = teamData.questionHistoryDaily || {}
        await teamDoc.ref.update({
          questionCount: questionTotal,
          pageCount: pageTotal,
          sourceCount: sourceTotal,
          questionHistory: {
            ...prevHistory,
            [`${currentYear}-${currentMonth}`]: {
              questions: questionTotal,
              upVotes: upVotesTotal,
              downVotes: downVotesTotal,
              escalations: escalationsTotal,
            },
          },
          questionHistoryDaily: {
            ...prevHistoryDaily,
            ...questionHistoryDailyNew,
          },
          needsUpdate: false,
        })
      } catch (error) {
        console.warn(`Error updating team ${teamDoc.id} counts:`, error)
        return
      }
    })

    await Promise.all(teamsPromises)
  } catch (error) {
    console.warn('Error updating counts:', error)
    response.status(500).json({ message: error })
    return
  }
  response.status(200).json({ success: true })
}
