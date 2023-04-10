import { getAuth } from 'firebase-admin/auth'
import cookie from 'cookie'
import * as jose from 'jose'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { authDefaults, TWO_WEEKS_IN_MILLISECONDS } from '@/constants/auth.constants'
import { bentoTrack } from '@/lib/bento'
import { stripePlan } from '@/utils/helpers'
import { getTeams } from '@/lib/dbQueries'

export default async function handler(req, res) {
  configureFirebaseApp()

  const authorizationHeader = req.headers.authorization
  const accessToken = authorizationHeader.slice(7)

  const auth = getAuth()

  const sessionCookie = await auth.createSessionCookie(accessToken, {
    expiresIn: TWO_WEEKS_IN_MILLISECONDS,
  })
  const decodedJwt = jose.decodeJwt(sessionCookie)
  const userId = decodedJwt?.user_id

  const serializedCookie = cookie.serialize(
    authDefaults.COOKIE_NAME,
    sessionCookie,
    authDefaults.COOKIE_OPTIONS
  )

  const { name, isNewUser } = req.body

  if (isNewUser) {
    const firestore = getFirestore()

    try {
      await firestore.runTransaction(async (transaction) => {
        // first, sanity check that a team for this user doesn't already exist
        const teamsSnapshot = await transaction.get(await firestore
          .collection('teams')
          .where('roles.' + userId, '!=', null))
        let teams = []
        teamsSnapshot.forEach((doc) => {
          let team = { id: doc.id, ...doc.data() }
          team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string
          //use preview key if available otherwise use fake one or null
          team.openAIKey = team.openAIKey
            ? team.openAIKeyPreview
              ? team.openAIKeyPreview
              : 'sk-*...****'
            : null
          delete team.openAIKeyPreview
    
          //delete sensitive data keys starting with stripe
          Object.keys(team).forEach((key) => {
            if (key.startsWith('stripe')) {
              delete team[key]
            }
          })
          //add stripe plan
          team.plan = stripePlan(team)
    
          teams.push(team)
        })

        let teamId = ''
        if (teams.length >= 1) {
          teamId = teams[0].id
        } else {
            // Add team based on user id with 'owner' as default permission
            const teamRef = firestore.collection('teams').doc()
            await transaction.set(teamRef, {
              createdAt: FieldValue.serverTimestamp(),
              name: `${name.trim()}'s Team`,
              botCount: 0,
              sourceCount: 0,
              pageCount: 0,
              chunkCount: 0,
              questionCount: 0,
              openAIKey: null,
              roles: {
                [userId]: 'owner',
              },
            })
            teamId = teamRef.id
        }

        await transaction.set(firestore.collection('users').doc(userId), {
          createdAt: FieldValue.serverTimestamp(),
          currentTeam: teamId,
        })
      })

      //track with bento
      bentoTrack(userId, 'addSubscriber')
    } catch (error) {
      console.error(error)
      return res.status(500).send({ message: error?.message })
    }
  }

  res.setHeader('set-cookie', serializedCookie)

  return res.send({ message: 'success' })
}
