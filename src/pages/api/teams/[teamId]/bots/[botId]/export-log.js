import { configureFirebaseApp } from '@/config/firebase-server.config'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries';
import { stripePlan } from '@/utils/helpers';

const sanitize = (str) => {
  return str.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '""')
}

// this handler will export the question log of a bot to a csv file
const handler = async (req, res) => {
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

    // respond with csv file
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=\"' + bot.id + '-questions.csv\"')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Pragma', 'no-cache')

    // write questions to csv file
    res.write('alias,timestamp,question,answer,sources\n')
    questions.forEach((doc) => {
      const question = { id: doc.id, ...doc.data(), alias: doc.data().ip ? getFakeUserByIp(doc.data().ip) : 'unknown-user'}
      // remove newlines, convert quotes from data
      const cleanedQuestion = sanitize(question.question)
      const cleanedAnswer = sanitize(question.answer)

      // build sources string
      let sources = ''
      if (question.sources) {
        question.sources.forEach((source) => {
          sources += `${sanitize(source.title)}`
          if (source.url) {
            sources += ` (${source.url})`
          }
          sources += '; '
        })
      }

      res.write(`"${question.alias}","${question.createdAt.toDate().toJSON()}","${cleanedQuestion}","${cleanedAnswer}","${sources}"\n`)
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
      res.write('This log has been truncated. Upgrade your plan to view the full log.\n')
    }

    res.status(200).end()
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default handler