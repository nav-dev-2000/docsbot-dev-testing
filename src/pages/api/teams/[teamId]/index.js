import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import userTeamCheck from '@/lib/userTeamCheck'
import { isSuperAdmin, stripePlan } from '@/utils/helpers'
import { getTeam } from '@/lib/dbQueries'
import { encryptKey } from '@/lib/encryption'
import { Configuration, OpenAIApi } from 'openai'
import { deleteBot } from '@/lib/apiFunctions'
import { mpTrack } from '@/lib/mixpanel'
import { phTrack } from '@/lib/posthog'
import { canUserModifyTeam, canUserDeleteTeam } from '@/utils/function.utils'
import { validateOpenAIKey } from '@/utils/helpers'

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
    // sanity check user permissions
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    }

    let { name, openAIKey } = req.body
    let newTeam = {}
    if (name) {
      newTeam.name = name
      newTeam.name.trim()

      mpTrack(userId, 'Team Name Updated', { ip: req.headers['x-forwarded-for'] })
      phTrack(userId, 'Team Name Updated', {}, team.id)
    }
    if (openAIKey) {
      if (!validateOpenAIKey(team, openAIKey)) {
        return res.status(400).json({ message: 'Invalid OpenAI Key' })
      }

      try {
        let isGPT4 = false
        if (!team.AzureDeploymentBase) {
          //check if key is valid
          const configuration = new Configuration({
            apiKey: openAIKey,
          })
          const openai = new OpenAIApi(configuration)
          //list models available
          const models = await openai.listModels()
          isGPT4 = !!models.data.data.find((model) => model.id === 'gpt-4-turbo')
        } else {
          isGPT4 = true
        }

        newTeam.openAIKey = encryptKey(openAIKey)
        newTeam.openAIKeyPreview = openAIKey.substring(0, 3) + '...' + openAIKey.substring(47, 51)
        newTeam.supportsGPT4 = isGPT4

        mpTrack(userId, 'OpenAI Key Updated', { ip: req.headers['x-forwarded-for'] })
        phTrack(userId, 'OpenAI Key Updated', {}, team.id)
      } catch (error) {
        return res.status(400).json({ message: 'Invalid OpenAI Key. Please check and try again.' })
      }
    }

    try {
      await firestore.collection('teams').doc(team.id).update(newTeam)
      return res.json(await getTeam(team.id))
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    // sanity check user permissions
    if (!canUserDeleteTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    }

    //delete team from db
    try {
      //delete all bots
      const botsSnapshot = await firestore.collection('teams').doc(team.id).collection('bots').get()
      botsSnapshot.forEach(function (doc) {
        deleteBot(team.id, doc.id)
      })

      //delete all team data from bucket
      const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
      await bucket.deleteFiles({ prefix: `teams/${team.id}` })

      //delete team
      await firestore.collection('teams').doc(team.id).delete()

      //delete team from user
      if (!isSuperAdmin(userId)) {
        await firestore.collection('users').doc(userId).update({ currentTeam: null })
      } else {
        await firestore
          .collection('users')
          .doc(userId)
          .update({ currentTeam: 'ZrbLG98bbxZ9EFqiPvyl' })
      }

      mpTrack(userId, 'Team Deleted', {
        'Team name': team.name,
        ip: req.headers['x-forwarded-for'],
      })
      phTrack(userId, 'Team Deleted', {
        'Team name': team.name,
      })

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
