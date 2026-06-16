import { configureFirebaseApp } from '@/config/firebase-server.config'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getTeam, getTeams } from '@/lib/dbQueries'
import { stripePlan } from '@/utils/helpers'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()
  let userId
  let userName = ''
  let userEmail = ''

  try {
    const context = { req, res }
    const { uid, name, email } = await getAuthorizedUser(context)
    userId = uid
    userName = name || ''
    userEmail = email || ''
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  if (req.method === 'GET') {
    //get teams for user list
    return res.json(await getTeams(userId))
  } else if (req.method === 'POST') {
    const requestedName =
      typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const fallbackName =
      userName.trim() || userEmail.split('@')[0]?.trim() || 'New'
    const baseTeamName = requestedName || `${fallbackName}'s Team`

    try {
      const existingTeams = await getTeams(userId)
      const existingNames = new Set(existingTeams.map((team) => team.name))
      let teamName = baseTeamName
      let suffix = 2

      while (existingNames.has(teamName)) {
        teamName = `${baseTeamName} ${suffix}`
        suffix += 1
      }

      const teamRef = await firestore.collection('teams').add({
        createdAt: FieldValue.serverTimestamp(),
        name: teamName,
        botCount: 0,
        sourceCount: 0,
        pageCount: 0,
        chunkCount: 0,
        questionCount: 0,
        autoIncreaseAiCredits: true,
        openAIKey: null,
        roles: {
          [userId]: 'owner',
        },
      })

      await firestore.collection('users').doc(userId).set(
        {
          currentTeam: teamRef.id,
        },
        { merge: true },
      )

      const team = await getTeam(teamRef.id)
      return res.status(201).json({
        team: {
          ...team,
          plan: stripePlan(team),
        },
      })
    } catch (error) {
      return res
        .status(500)
        .json({ message: error?.message || 'Unable to create team.' })
    }
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}
