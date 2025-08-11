import { getFirestore, Filter } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getQuestionStats, getConversationStats } from '@/lib/dbQueries'
import { teamOwner, bentoTrack } from '@/lib/bento'
import { sendErrorEmail } from '@/utils/emails'
import { phTrack } from '@/lib/posthog'
import { stripePlan } from '@/utils/helpers'

// Helper function to clean up daily stats objects by removing entries older than 93 days
function cleanDailyStats(dailyStats) {
  if (!dailyStats || typeof dailyStats !== 'object') {
    return dailyStats
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 93)

  const cleanedStats = {}
  for (const [date, stats] of Object.entries(dailyStats)) {
    // Use Date object comparison like in getStats()
    const dateObj = new Date(date)
    if (dateObj.getTime() > cutoffDate.getTime()) {
      cleanedStats[date] = stats
    }
  }

  return cleanedStats
}

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

          // this list is temporary. maybe have a flag in the team document instead?
          if (['ZrbLG98bbxZ9EFqiPvyl', 'qgLhgCi4fr7IrqJT3Pcj'].includes(teamDoc.id)) {
            await sendErrorEmail(teamData, lastError)
          }

          // update lastError.emailSent state
          await teamDoc.ref.update({
            lastError: {
              ...lastError,
              emailSent: true,
            }
          })

          // continue on
        }

        const botsSnapshot = await teamDoc.ref
          .collection('bots')
          .select('questionHistory', 'questionHistoryDaily', 'conversationHistory', 'conversationHistoryDaily', 'name', 'embedded')
          .get()

        let questionTotal = 0
        let questionLookupTotal = 0
        let pageTotal = 0
        let sourceTotal = 0
        let upVotesTotal = 0
        let downVotesTotal = 0
        let escalationsTotal = 0
        let couldAnswerTotal = 0
        let couldNotAnswerTotal = 0
        let conversationTotal = 0
        let resolvedConfirmedTotal = 0
        let resolvedAssumedTotal = 0
        let unresolvedTotal = 0
        let escalatedHandledTotal = 0
        let escalatedTriggeredTotal = 0
        let sentimentPositiveTotal = 0
        let sentimentNegativeTotal = 0
        let sentimentNeutralTotal = 0
        let answeredTotal = 0
        let unansweredTotal = 0
        let questionHistoryDailyNew = {}
        let conversationHistoryDailyNew = {}

        const botCounts = []

        for (const botDoc of botsSnapshot.docs) {
          const { monthly, daily } = await getQuestionStats(teamDoc.id, botDoc.id)
          const { monthly: conversationMonthly, daily: conversationDaily } = await getConversationStats(teamDoc.id, botDoc.id)

          // grab the # of source pages
          const sourcesSnapshot = await botDoc.ref.collection('sources').select('pageCount').get()
          const sourceCount = sourcesSnapshot.size
          const sourcePages = sourcesSnapshot.docs.map((sourceDoc) => sourceDoc.data().pageCount)
          const pageCount = sourcePages.reduce((accumulator, count) => accumulator + count, 0)

          const prevHistory = botDoc.data().questionHistory || {}
          const prevHistoryDaily = botDoc.data().questionHistoryDaily || {}
          const prevConversationHistory = botDoc.data().conversationHistory || {}
          const prevConversationHistoryDaily = botDoc.data().conversationHistoryDaily || {}

          const botData = {
            questionCount: monthly.messages,
            questionLookupCount: monthly.questions,
            conversationCount: conversationMonthly.conversations,
            pageCount: pageCount,
            sourceCount: sourceCount,
            questionHistory: {
              ...prevHistory,
              [`${currentYear}-${currentMonth}`]: monthly,
            },
            questionHistoryDaily: cleanDailyStats({
              ...prevHistoryDaily,
              ...daily,
            }),
            conversationHistory: {
              ...prevConversationHistory,
              [`${currentYear}-${currentMonth}`]: conversationMonthly,
            },
            conversationHistoryDaily: cleanDailyStats({
              ...prevConversationHistoryDaily,
              ...conversationDaily,
            }),
          }

          const embedded = botDoc.data().embedded || false
          if (embedded == 'yes') {
            try {
              bentoTrack(teamOwner(teamData), 'track', {
                type: 'botUsed',
                botName: botDoc.data().name,
              })
              phTrack(teamOwner(teamData), 'Bot Used', { 'Bot name': botDoc.data().name }, teamDoc.id)
            } catch (error) {
              console.warn('Error tracking bot used:', error)
            }
            botData.embedded = 'recorded'
          }

          // update bot count
          await botDoc.ref.update(botData)

          botCounts.push({ pageCount, sourceCount, monthly, daily, conversationMonthly, conversationDaily })
        }

        // take and sum the results
        for (const { pageCount, sourceCount, monthly, daily, conversationMonthly, conversationDaily } of botCounts) {
          questionTotal += monthly.messages
          questionLookupTotal += monthly.questions
          pageTotal += pageCount
          sourceTotal += sourceCount
          upVotesTotal += monthly.upVotes
          downVotesTotal += monthly.downVotes
          escalationsTotal += monthly.escalations
          couldAnswerTotal += monthly.couldAnswer
          couldNotAnswerTotal += monthly.couldNotAnswer

          // Add conversation totals
          conversationTotal += conversationMonthly.conversations
          resolvedConfirmedTotal += conversationMonthly.resolvedConfirmed
          resolvedAssumedTotal += conversationMonthly.resolvedAssumed
          unresolvedTotal += conversationMonthly.unresolved
          escalatedHandledTotal += conversationMonthly.escalatedHandled
          escalatedTriggeredTotal += conversationMonthly.escalatedTriggered
          sentimentPositiveTotal += conversationMonthly.sentimentPositive
          sentimentNegativeTotal += conversationMonthly.sentimentNegative
          sentimentNeutralTotal += conversationMonthly.sentimentNeutral
          answeredTotal += conversationMonthly.answered
          unansweredTotal += conversationMonthly.unanswered

          //loop through daily question stats
          for (const [day, value] of Object.entries(daily)) {
            questionHistoryDailyNew[day] = questionHistoryDailyNew[day] || {
              questions: 0,
              messages: 0,
              upVotes: 0,
              downVotes: 0,
              escalations: 0,
              couldAnswer: 0,
              couldNotAnswer: 0,
            }
            questionHistoryDailyNew[day].questions += value.questions
            questionHistoryDailyNew[day].messages += value.messages
            questionHistoryDailyNew[day].upVotes += value.upVotes
            questionHistoryDailyNew[day].downVotes += value.downVotes
            questionHistoryDailyNew[day].escalations += value.escalations
            questionHistoryDailyNew[day].couldAnswer += value.couldAnswer
            questionHistoryDailyNew[day].couldNotAnswer += value.couldNotAnswer
          }

          //loop through daily conversation stats
          for (const [day, value] of Object.entries(conversationDaily)) {
            const {
              conversations = 0,
              resolvedConfirmed = 0,
              resolvedAssumed = 0,
              unresolved = 0,
              escalatedHandled = 0,
              escalatedTriggered = 0,
              sentimentPositive = 0,
              sentimentNegative = 0,
              sentimentNeutral = 0,
              answered = 0,
              unanswered = 0,
            } = value

            conversationHistoryDailyNew[day] = conversationHistoryDailyNew[day] || {
              conversations: 0,
              resolvedConfirmed: 0,
              resolvedAssumed: 0,
              unresolved: 0,
              escalatedHandled: 0,
              escalatedTriggered: 0,
              sentimentPositive: 0,
              sentimentNegative: 0,
              sentimentNeutral: 0,
              answered: 0,
              unanswered: 0,
            }
            conversationHistoryDailyNew[day].conversations += conversations
            conversationHistoryDailyNew[day].resolvedConfirmed += resolvedConfirmed
            conversationHistoryDailyNew[day].resolvedAssumed += resolvedAssumed
            conversationHistoryDailyNew[day].unresolved += unresolved
            conversationHistoryDailyNew[day].escalatedHandled += escalatedHandled
            conversationHistoryDailyNew[day].escalatedTriggered += escalatedTriggered
            conversationHistoryDailyNew[day].sentimentPositive += sentimentPositive
            conversationHistoryDailyNew[day].sentimentNegative += sentimentNegative
            conversationHistoryDailyNew[day].sentimentNeutral += sentimentNeutral
            conversationHistoryDailyNew[day].answered += answered
            conversationHistoryDailyNew[day].unanswered += unanswered
          }
        }

        console.log(
          'team',
          teamDoc.id,
          'has',
          questionTotal,
          'questions,',
          conversationTotal,
          'conversations,',
          sourceTotal,
          'sources,',
          pageTotal,
          'source pages'
        )

        // update team count && needsUpdate
        const prevHistory = teamData.questionHistory || {}
        const prevHistoryDaily = teamData.questionHistoryDaily || {}
        const prevConversationHistory = teamData.conversationHistory || {}
        const prevConversationHistoryDaily = teamData.conversationHistoryDaily || {}
        const questionLimit = stripePlan(teamData).questions
        await teamDoc.ref.update({
          questionCount: questionTotal,
          questionLookupCount: questionLookupTotal,
          conversationCount: conversationTotal,
          questionLimit: questionLimit,
          pageCount: pageTotal,
          sourceCount: sourceTotal,
          questionHistory: {
            ...prevHistory,
            [`${currentYear}-${currentMonth}`]: {
              messages: questionTotal,
              questions: questionLookupTotal,
              upVotes: upVotesTotal,
              downVotes: downVotesTotal,
              escalations: escalationsTotal,
              couldAnswer: couldAnswerTotal,
              couldNotAnswer: couldNotAnswerTotal,
            },
          },
          questionHistoryDaily: cleanDailyStats({
            ...prevHistoryDaily,
            ...questionHistoryDailyNew,
          }),
          conversationHistory: {
            ...prevConversationHistory,
            [`${currentYear}-${currentMonth}`]: {
              conversations: conversationTotal,
              resolvedConfirmed: resolvedConfirmedTotal,
              resolvedAssumed: resolvedAssumedTotal,
              unresolved: unresolvedTotal,
              escalatedHandled: escalatedHandledTotal,
              escalatedTriggered: escalatedTriggeredTotal,
              sentimentPositive: sentimentPositiveTotal,
              sentimentNegative: sentimentNegativeTotal,
              sentimentNeutral: sentimentNeutralTotal,
              answered: answeredTotal,
              unanswered: unansweredTotal,
            },
          },
          conversationHistoryDaily: cleanDailyStats({
            ...prevConversationHistoryDaily,
            ...conversationHistoryDailyNew,
          }),
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
