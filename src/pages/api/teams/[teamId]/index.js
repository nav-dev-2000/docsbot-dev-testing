import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { isSuperAdmin } from '@/utils/helpers'
import { getTeam } from '@/lib/dbQueries'
import crypto from 'crypto'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
  const { userId, team } = check

  if (req.method === 'PUT') {
    let { name, openAIKey } = req.body
    let newTeam = {}
    if (name) {
      newTeam.name.trim()
    }
    if (openAIKey) {
      //encrypt openAIKey with aes256
      const algorithm = 'aes-256-ctr'
      const password = process.env.OPENAI_KEY_ENCRYPTION_PASSWORD
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(algorithm, password, iv)
      let encrypted = cipher.update(openAIKey, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      newTeam.openAIKey = encrypted
    }

    try {
      await firestore.collection('teams').doc(team.id).update(newTeam)
      return res.json(await getTeam(team.id))
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    return res.status(400).json({ message: 'Not implemented' })
  } else if (req.method === 'GET') {
    return res.json(team)
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
