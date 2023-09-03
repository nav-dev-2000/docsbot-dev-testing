import userTeamCheck from '@/lib/userTeamCheck'
import { getBots, getBot } from '@/lib/dbQueries'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { bentoTrack } from '@/lib/bento'
import { createRouter } from 'next-connect'
import { createSchema } from '@/lib/weaviate'
import { stripePlan } from '@/utils/helpers'
import crypto from 'crypto'

const router = createRouter()

router.post(async (req, res) => {
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

  try {
    //check plan credits
    if (stripePlan(team).bots <= team.botCount) {
      return res.status(402).json({
        message: 'Bot limit exceeded. Please upgrade your plan.',
      })
    }

    //must have an openai key
    if (!team.openAIKey) {
      return res.status(402).json({
        message: 'Please add an OpenAI key to create bots.',
      })
    }

    //data validation
    let { name, description, privacy, model, language } = req.body

    name = name.trim()
    if (!name) {
      return res.status(400).send({ message: 'Invalid name' })
    }

    description = description.trim()

    if (privacy !== 'public' && privacy !== 'private') {
      return res.status(400).send({ message: 'Invalid param "privacy".' })
    }

    if ('private' === privacy && stripePlan(team).name === 'Free') {
      return res.status(402).json({
        message: 'Private bots are not available at your plan level.',
      })
    }

    if (model !== 'gpt-3.5-turbo' && model !== 'gpt-4') {
      return res.status(400).send({ message: 'Invalid param "model".' })
    }

    if ('gpt-4' === model && stripePlan(team).name === 'Free' && !isSuperAdmin(userId)) {
      return res.status(402).json({
        message: 'GPT-4 is not available at your plan level.',
      })
    }

    if (!team.supportsGPT4 && model === 'gpt-4') {
      return res.status(400).send({ message: 'Your OpenAI account is not approved for GPT-4 yet.' })
    }

    const languages = ['en', 'jp', 'de']
    if (!languages.includes(language)) {
      return res.status(400).send({ message: 'Invalid param "language".' })
    }

    //create classname with a random string
    const indexId = `Document_${Math.random().toString(36).substr(2, 10)}`

    //create schema in weaviate
    createSchema(team, indexId)

    //create bot in db
    const docRef = await firestore.collection('teams').doc(team.id).collection('bots').add({
      createdAt: FieldValue.serverTimestamp(),
      name,
      description,
      privacy,
      language,
      status: 'pending',
      indexId: indexId,
      customPrompt: '',
      model,
      sourceCount: 0,
      pageCount: 0,
      chunkCount: 0,
      questionCount: 0,
      signatureKey: crypto.randomBytes(32).toString('hex'),
    })

    const botId = docRef.id

    //increment botCounts on team
    await firestore.runTransaction(async (transaction) => {
      const teamRef = firestore.collection('teams').doc(team.id)
      const sfDoc = await transaction.get(teamRef)
      if (!sfDoc.exists) {
        throw 'Team does not exist!'
      }

      const newBotCount = (sfDoc.data().botCount || 0) + 1
      transaction.update(teamRef, {
        botCount: newBotCount,
      })
    })

    try {
      bentoTrack(userId, 'track', {
        type: 'createBot',
        botName: name,
      })
    } catch (e) {
      console.log('Error sending bento track', e)
    }

    return res.status(201).json(await getBot(team.id, botId))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: error?.message })
  }
})

router.get(async (req, res) => {
  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  //TODO add pagination
  try {
    const recentSources = await getBots(team, req.params?.resultLimit || 1000)
    return res.json(recentSources)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
})

export default router.handler({
  onError(error, req, res) {
    res.status(500).json({ message: error?.message })
  },
  onNoMatch(req, res) {
    res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  },
})
