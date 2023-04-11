import { getAuth } from 'firebase-admin/auth'
import cookie from 'cookie'
import * as jose from 'jose'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { authDefaults, TWO_WEEKS_IN_MILLISECONDS } from '@/constants/auth.constants'
import { bentoTrack } from '@/lib/bento'
import { stripePlan } from '@/utils/helpers'
import { assignDefaultTeamTransaction } from '@/lib/dbQueries'

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
      await firestore.runTransaction(async (transaction) => await assignDefaultTeamTransaction(transaction, userId, name))

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
