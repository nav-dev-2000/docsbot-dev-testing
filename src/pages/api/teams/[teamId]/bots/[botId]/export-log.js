import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot, getUser } from '@/lib/dbQueries';
import { stripePlan } from '@/utils/helpers';
import getFakeUserByIp from '@/utils/fakeUsers';
import sendEmail from '@/lib/sendEmail';

const sanitize = (str) => {
  return str.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '""')
}

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

    // grab questions
    const planLimit = stripePlan(team).logLimit
    const questions = await firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('questions')
      .orderBy('createdAt', 'desc')
      .limit(planLimit)
      .get()


    var csvData = [];

    // write questions to csv file
    csvData.push('alias,timestamp,rating,question,answer,sources\n')
    questions.forEach((doc) => {
      const question = { id: doc.id, ...doc.data(), alias: doc.data().ip ? getFakeUserByIp(doc.data().ip) : 'unknown-user'}
      // remove newlines, convert quotes from data
      const cleanedQuestion = sanitize(question.question)
      const cleanedAnswer = sanitize(question.answer)

      // build sources string
      let sources = ''
      if (question.sources && Array.isArray(question.sources)) {
        question.sources.forEach((source) => {
          sources += `${sanitize(source.title)}`
          if (source.url) {
            sources += ` (${source.url})`
          }
          sources += '; '
        })
      }


      const ratingValue = question.rating == 0 ? 'N/A' : (question.rating > 0 ? 'Positive' : 'Negative');
      const rating = question?.escalation ? 'Contacted Support' : ratingValue;

      csvData.push(`"${question.alias}","${question.createdAt.toDate().toJSON()}","${rating}","${cleanedQuestion}","${cleanedAnswer}","${sources}"\n`)
    })

    const countSnapshot = await firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)
      .collection('questions')
      .count()
      .get()

    // let user know they're missing data, and to upgrade their plan to view full log
    const totalCount = countSnapshot.data().count
    if (totalCount > planLimit) {
      csvData.push('This log has been truncated. Upgrade your plan to view the full log.\n')
    }

    // upload csv file to storage
    const file = bucket.file(`user/${userId}/team/${team.id}/bot/${bot.id}/export/questions.csv`)
    await file.save(csvData.join(''))

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

    res.status(200).json({ url: url })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default handler