import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot, getUser } from '@/lib/dbQueries';
import { stripePlan } from '@/utils/helpers';
import getFakeUserByIp from '@/utils/fakeUsers';
import sendEmail from '@/lib/sendEmail';
import { stringify } from '@vanillaes/csv'

// this handler will export the question log of a bot to a csv file
const handler = async (req, res) => {
  configureFirebaseApp()
  const firestore = getFirestore()
  const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'GET') {
    // grab bot
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      console.log('Missing startDate or endDate', startDate, endDate)
      return res.status(400).json({ message: 'Missing startDate or endDate' })
    }

    if (stripePlan(team).bots !== 1) {
      console.log(stripePlan(team))
      return res.status(402).json({
        message: 'Please upgrade to a paid plan to export logs.',
      })
    }

    // make sure startDate and endDate are valid dates
    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0)
      end.setHours(23, 59, 59)

      // grab questions
      const questions = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('questions')
        .orderBy('createdAt', 'desc')
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .limit(5000)
        .get()
      var csvData = [];

      console.log('questions', questions.size)
      // write questions to csv file
      csvData.push(['alias','timestamp','rating','question','answer','sources','referrer'])
      questions.forEach((doc) => {
        let alias = doc.data().ip ? getFakeUserByIp(doc.data().ip) : 'unknown-user'
        //if we identified the user, use the provided data for alias
        if (doc.data().metadata) {
          if (doc.data().metadata.name) {
            alias = doc.data().metadata.name
            if (doc.data().metadata.email) {
              alias += ' (' + doc.data().metadata.email + ')'
            }
          } else if (doc.data().metadata.email) {
            alias = doc.data().metadata.email
          }
        }

        const question = { id: doc.id, ...doc.data(), alias: alias }
        // remove newlines, convert quotes from data
        const cleanedQuestion = question.question
        const cleanedAnswer = question.answer

        // build sources string
        let sources = ''
        if (question.sources && Array.isArray(question.sources)) {
          question.sources.forEach((source) => {
            if (source.title) {
              sources += source.title
              if (source.url) {
                sources += ` (${source.url})`
              }
              sources += '; '
            }
          })
        }

        const ratingValue = question.rating == 0 ? 'N/A' : (question.rating > 0 ? 'Positive' : 'Negative');
        const rating = question?.escalation ? 'Contacted Support' : ratingValue;
        const referrer = question?.metadata?.referrer ? question.metadata.referrer : '';

        csvData.push([question.alias, question.createdAt.toDate().toJSON(), rating, cleanedQuestion, cleanedAnswer, sources, referrer])
      })

      // upload csv file to storage
      const file = bucket.file(`user/${userId}/team/${team.id}/bot/${bot.id}/export/questions.csv`)
      await file.save(stringify(csvData))

      // sign url for 7 days
      const url = (await file.getSignedUrl({
        action: 'read',
        promptSaveAs: `questions-${bot.id}.csv`,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
      }))[0];

      // disabled for now
      // // email user with link to download csv file
      // const emailBody = `You can download your exported log for ${bot.name} here: ${url}`
      // await sendEmail(userId, `Your exported log for ${bot.name} is ready`, emailBody)

      return res.status(200).json({ url: url })
    } catch (error) {
      return res.status(400).json({ message: error?.message })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default handler