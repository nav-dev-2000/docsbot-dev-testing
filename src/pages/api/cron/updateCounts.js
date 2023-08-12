import { getFirestore, FieldPath } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getQuestionCount } from '@/lib/dbQueries'

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
      .where('needsUpdate', '==', true)
      //.limit(5)
      .get()

    const teamsPromises = teamsSnapshot.docs.map(async (teamDoc) => {
      console.log('team', teamDoc.id, 'is scheduled to have the counts updated...')

      try {
        let currentDate = new Date()
        let currentMonth = currentDate.getMonth()
        let currentYear = currentDate.getFullYear()

        const teamData = teamDoc.data()
        const botsSnapshot = await teamDoc.ref.collection('bots').select('questionCountHistory').get()

        let questionTotal = 0
        let sourcePageTotal = 0
        const botCounts = []

        for (const botDoc of botsSnapshot.docs) {
          const questionCount = await getQuestionCount(
            teamDoc.id,
            botDoc.id
          )

          // grab the # of source pages
          const sourcesSnapshot = await botDoc.ref.collection('sources').select('pageCount').get()
          const sourceCounts = sourcesSnapshot.docs.map((sourceDoc) => sourceDoc.data().pageCount)
          const sourceCountTotal = sourceCounts.reduce((accumulator, count) => accumulator + count, 0)

          const prevHistory = botDoc.data().questionCountHistory || {}

          // update bot count
          await botDoc.ref.update({
            questionCount: questionCount,
            pageCount: sourceCountTotal,
            questionCountHistory: {
              ...prevHistory,
              [`${currentYear}-${currentMonth}`]: questionCount,
            },
          })

          botCounts.push({ questionCount, sourceCountTotal })
        }

        // take and sum the results
        for (const { questionCount, sourceCountTotal } of botCounts) {
          questionTotal += questionCount
          sourcePageTotal += sourceCountTotal
        }

        console.log(
          'team',
          teamDoc.id,
          'has',
          questionTotal,
          'questions,',
          sourcePageTotal,
          'source pages'
        )

        // update team count && needsUpdate
        const prevHistory = teamData.questionCountHistory || {}
        await teamDoc.ref.update({
          questionCount: questionTotal,
          pageCount: sourcePageTotal,
          questionCountHistory: {
            ...prevHistory,
            [`${currentYear}-${currentMonth}`]: questionTotal,
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