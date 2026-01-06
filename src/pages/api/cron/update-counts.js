/**
 * Update Counts Cron Job
 * 
 * This cron job runs daily at midnight UTC to update team and bot statistics.
 * 
 * Development testing:
 * curl -X GET "http://localhost:3000/api/cron/update-counts"
 * 
 * Production: Protected by CRON_SECRET environment variable
 */

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

  // Check for CRON_SECRET authorization (bypass in development if not set)
  const authHeader = request.headers.authorization
  const expectedSecret = process.env.CRON_SECRET
  
  // In development, bypass protection if CRON_SECRET is not set
  if (expectedSecret && (!authHeader || authHeader !== `Bearer ${expectedSecret}`)) {
    response.status(401).json({ message: 'Unauthorized' })
    return
  }

  console.log('cron update-counts started!')

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
        let researchTotal = 0
        let questionHistoryDailyNew = {}
        let conversationHistoryDailyNew = {}

        const botCounts = []
        const botCount = botsSnapshot.size

        for (const botDoc of botsSnapshot.docs) {
          const { monthly, daily } = await getQuestionStats(teamDoc.id, botDoc.id)
          const { monthly: conversationMonthly, daily: conversationDaily } = await getConversationStats(teamDoc.id, botDoc.id)

          // grab the # of source pages
          const sourcesSnapshot = await botDoc.ref.collection('sources').select('pageCount').get()
          const sourceCount = sourcesSnapshot.size
          const sourcePages = sourcesSnapshot.docs.map((sourceDoc) => sourceDoc.data().pageCount)
          const pageCount = sourcePages.reduce((accumulator, count) => accumulator + count, 0)

          // Count research documents for current calendar month (excluding failed)
          let researchCount = 0
          const researchDaily = {}
          try {
            // Calculate time delta for current calendar month (same as questionCount)
            let timeDelta
            if (currentDay === 1) {
              // delta is the last 48 hours
              timeDelta = 48 * 60 * 60 * 1000
            } else {
              // delta between the first day of the month and today
              let startDate = new Date(currentYear, currentMonth - 1, 1)
              timeDelta = currentDate - startDate
            }

            const researchSnapshot = await botDoc.ref
              .collection('research')
              .where('createdAt', '>', new Date(Date.now() - timeDelta))
              .select('status', 'createdAt') // Fetch status and createdAt for daily tracking
              .get()

            // Count documents excluding those with status "failed" and track by day
            researchSnapshot.forEach((doc) => {
              const data = doc.data()
              if (data.status !== 'failed') {
                researchCount++
                
                // Track daily counts
                const createdDate = data?.createdAt?.toDate()
                if (createdDate) {
                  const day =
                    createdDate.getFullYear() +
                    '-' +
                    (createdDate.getMonth() + 1) +
                    '-' +
                    createdDate.getDate()
                  
                  researchDaily[day] = researchDaily[day] || 0
                  researchDaily[day] += 1
                }
              }
            })
          } catch (error) {
            console.warn(`Error counting research for bot ${botDoc.id}:`, error)
          }

          const prevHistory = botDoc.data().questionHistory || {}
          const prevHistoryDaily = botDoc.data().questionHistoryDaily || {}
          const prevConversationHistory = botDoc.data().conversationHistory || {}
          const prevConversationHistoryDaily = botDoc.data().conversationHistoryDaily || {}

          // Add research count to questionHistoryDaily for bot
          const botQuestionHistoryDailyNew = { ...prevHistoryDaily }
          
          // First, zero out research counts for current month days to avoid double-counting
          // (since we're recalculating them from the database each time)
          const currentMonthPrefix = `${currentYear}-${currentMonth}-`
          for (const day in botQuestionHistoryDailyNew) {
            if (day.startsWith(currentMonthPrefix)) {
              if (botQuestionHistoryDailyNew[day]) {
                botQuestionHistoryDailyNew[day] = {
                  ...botQuestionHistoryDailyNew[day],
                  research: 0,
                }
              }
            }
          }
          
          for (const [day, value] of Object.entries(daily)) {
            if (!botQuestionHistoryDailyNew[day]) {
              botQuestionHistoryDailyNew[day] = { ...value, research: 0 }
            } else {
              botQuestionHistoryDailyNew[day] = {
                ...botQuestionHistoryDailyNew[day],
                ...value,
                research: botQuestionHistoryDailyNew[day].research || 0,
              }
            }
          }
          // Add research counts to days that have research but no question data
          for (const [day, count] of Object.entries(researchDaily)) {
            if (!botQuestionHistoryDailyNew[day]) {
              botQuestionHistoryDailyNew[day] = {
                questions: 0,
                messages: 0,
                upVotes: 0,
                downVotes: 0,
                escalations: 0,
                couldAnswer: 0,
                couldNotAnswer: 0,
                research: 0,
              }
            }
            // Set research count directly (not add) since we zeroed it out above
            botQuestionHistoryDailyNew[day].research = count
          }

          const botData = {
            questionCount: monthly.messages,
            questionLookupCount: monthly.questions,
            conversationCount: conversationMonthly.conversations,
            researchCount: researchCount,
            pageCount: pageCount,
            sourceCount: sourceCount,
            questionHistory: {
              ...prevHistory,
              [`${currentYear}-${currentMonth}`]: {
                ...monthly,
                research: researchCount,
              },
            },
            questionHistoryDaily: cleanDailyStats(botQuestionHistoryDailyNew),
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

          botCounts.push({ pageCount, sourceCount, monthly, daily, conversationMonthly, conversationDaily, researchCount, researchDaily })
        }

        // take and sum the results
        for (const { pageCount, sourceCount, monthly, daily, conversationMonthly, conversationDaily, researchCount, researchDaily } of botCounts) {
          questionTotal += monthly.messages
          questionLookupTotal += monthly.questions
          pageTotal += pageCount
          sourceTotal += sourceCount
          upVotesTotal += monthly.upVotes
          downVotesTotal += monthly.downVotes
          escalationsTotal += monthly.escalations
          couldAnswerTotal += monthly.couldAnswer
          couldNotAnswerTotal += monthly.couldNotAnswer
          researchTotal += researchCount

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
              research: 0,
            }
            questionHistoryDailyNew[day].questions += value.questions
            questionHistoryDailyNew[day].messages += value.messages
            questionHistoryDailyNew[day].upVotes += value.upVotes
            questionHistoryDailyNew[day].downVotes += value.downVotes
            questionHistoryDailyNew[day].escalations += value.escalations
            questionHistoryDailyNew[day].couldAnswer += value.couldAnswer
            questionHistoryDailyNew[day].couldNotAnswer += value.couldNotAnswer
          }

          //loop through daily research stats
          for (const [day, count] of Object.entries(researchDaily)) {
            if (!questionHistoryDailyNew[day]) {
              questionHistoryDailyNew[day] = {
                questions: 0,
                messages: 0,
                upVotes: 0,
                downVotes: 0,
                escalations: 0,
                couldAnswer: 0,
                couldNotAnswer: 0,
                research: 0,
              }
            }
            // Add research count from each bot (sum across all bots)
            questionHistoryDailyNew[day].research = (questionHistoryDailyNew[day].research || 0) + count
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
          'source pages,',
          researchTotal,
          'research tasks',
        )

        // update team count && needsUpdate
        const prevHistory = teamData.questionHistory || {}
        const prevHistoryDaily = teamData.questionHistoryDaily || {}
        const prevConversationHistory = teamData.conversationHistory || {}
        const prevConversationHistoryDaily = teamData.conversationHistoryDaily || {}
        const questionLimit = stripePlan(teamData).questions
        const teamUpdateData = {
          questionCount: questionTotal,
          questionLookupCount: questionLookupTotal,
          conversationCount: conversationTotal,
          researchCount: researchTotal,
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
              research: researchTotal,
            },
          },
          questionHistoryDaily: cleanDailyStats(
            (() => {
              // Zero out research counts for current month days in prevHistoryDaily to avoid double-counting
              const currentMonthPrefix = `${currentYear}-${currentMonth}-`
              const merged = { ...prevHistoryDaily }
              for (const day in merged) {
                if (day.startsWith(currentMonthPrefix) && merged[day]) {
                  merged[day] = {
                    ...merged[day],
                    research: 0,
                  }
                }
              }
              // Merge in the new daily stats (which includes research counts from current run)
              return {
                ...merged,
                ...questionHistoryDailyNew,
              }
            })(),
          ),
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
          botCount: botCount,
          needsUpdate: false,
        }

        await teamDoc.ref.update(teamUpdateData)
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
