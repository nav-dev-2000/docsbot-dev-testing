import { getAuth } from 'firebase-admin/auth'
import cookie from 'cookie'
import * as jose from 'jose'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { authDefaults, TWO_WEEKS_IN_MILLISECONDS } from '@/constants/auth.constants'
import { bentoTrack } from '@/lib/bento'

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
      // Add team based on user id with 'owner' as default permission
      const teamRef = await firestore.collection('teams').add({
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

      const teamId = teamRef.id

      // Create user with current team set
      await firestore.collection('users').doc(userId).set({
        createdAt: FieldValue.serverTimestamp(),
        currentTeam: teamId,
      })

      //track with bento
      bentoTrack(userId, 'addSubscriber')
    } catch (error) {
      return res.status(500).send({ message: error?.message })
    }
  }

  res.setHeader('set-cookie', serializedCookie)

  return res.send({ message: 'success' })
}
