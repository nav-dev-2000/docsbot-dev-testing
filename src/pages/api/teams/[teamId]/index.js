import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import userTeamCheck from '@/lib/userTeamCheck'
import { isSuperAdmin, stripePlan } from '@/utils/helpers'
import { getTeam } from '@/lib/dbQueries'
import crypto from 'crypto'
import { deleteSchema } from '@/lib/weaviate'


export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  if (req.method === 'PUT') {
    let { name, openAIKey } = req.body
    let newTeam = {}
    if (name) {
      newTeam.name.trim()
    }
    if (openAIKey) {
      if (!/^sk\-[a-zA-Z0-9]{48}$/.test(openAIKey)) {
        return res.status(400).json({ message: 'Invalid OpenAI Key' })
      }
      //encrypt openAIKey with aes256
      const algorithm = 'aes-256-cbc'
      const password = process.env.OPENAI_KEY_ENCRYPTION_PASSWORD
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(algorithm, password, iv)
      //encrypt, prepend iv, and encode to base64
      const encrypted = Buffer.concat([iv, cipher.update(openAIKey), cipher.final()]).toString(
        'base64'
      )
      newTeam.openAIKey = encrypted
      newTeam.openAIKeyPreview = openAIKey.substring(0, 3) + '...' + openAIKey.substring(47, 51)
    }

    try {
      await firestore.collection('teams').doc(team.id).update(newTeam)
      return res.json(await getTeam(team.id))
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    //delete team from db
    try {
      //delete all bots
      const botsSnapshot = await firestore.collection('teams').doc(team.id).collection('bots').get()

      // Once we get the results, begin a batch
      const botBatch = firestore.batch()
      botsSnapshot.forEach(async function (doc) {
        const botId = doc.id
        botBatch.delete(doc.ref)

        // Delete all sources for bot
        const querySnapshot = await firestore
          .collection('teams')
          .doc(team.id)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .get()
        // Once we get the results, begin a batch
        const batch = firestore.batch()
        querySnapshot.forEach(function (doc) {
          // For each doc, add a delete operation to the batch
          batch.delete(doc.ref)
        })
        // Commit the batch
        batch.commit()

        // Delete all questions for bot
        const questionsSnapshot = await firestore
          .collection('teams')
          .doc(team.id)
          .collection('bots')
          .doc(botId)
          .collection('questions')
          .get()
        // Once we get the results, begin a batch
        const questionsBatch = firestore.batch()
        questionsSnapshot.forEach(function (doc) {
          // For each doc, add a delete operation to the batch
          questionsBatch.delete(doc.ref)
        })
        // Commit the batch
        questionsBatch.commit()


        //delete schema in weaviate
        if (doc.indexId) {
          try {
            deleteSchema(doc.indexId)
          } catch (error) {
            console.warn('Error deleting Weaviate Schema:', error)
          }
        }

      })

      // Commit the batch
      botBatch.commit()

      //delete all team data from bucket
      const bucket = getStorage().bucket('gs://docsbotai.appspot.com')
      await bucket.deleteFiles({ prefix: `teams/${team.id}` })

      //delete team
      await firestore.collection('teams').doc(team.id).delete()

      //delete team from user
      if (!isSuperAdmin(userId)) {
        await firestore.collection('users').doc(userId).update({currentTeam: null})
      } else {
        await firestore.collection('users').doc(userId).update({currentTeam: 'ZrbLG98bbxZ9EFqiPvyl'})
      }
      
      return res.status(200).json({ message: 'Team deleted' })
    } catch (error) {
      console.warn('Error deleting team:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    const filteredTeam = { ...team }
    //delete sensitive data keys starting with stripe
    Object.keys(filteredTeam).forEach((key) => {
      if (key.startsWith('stripe')) {
        delete filteredTeam[key]
      }
    })
    //add stripe plan
    filteredTeam.plan = stripePlan(team)

    return res.json(filteredTeam)
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
