import { getAuth } from 'firebase-admin/auth'
import * as cookie from 'cookie'
import * as jose from 'jose'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { authDefaults, TWO_WEEKS_IN_MILLISECONDS } from '@/constants/auth.constants'
import { bentoTrack } from '@/lib/bento'
import { stripePlan } from '@/utils/helpers'
import { assignDefaultTeam, getInvitesFromEmail, acceptInvite } from '@/lib/dbQueries'

export default async function handler(req, res) {
  configureFirebaseApp()

  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No valid authorization header provided' })
  }
  
  const accessToken = authorizationHeader.slice(7)
  const auth = getAuth()

  try {
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

    const invites = await getInvitesFromEmail(decodedJwt?.email.toLowerCase())
    const invited = isNewUser && invites.length > 0

    //TODO track invited status with posthog

    if (isNewUser) {
      try {
        await assignDefaultTeam(userId, name)

        // if the new user is invited to just one team, accept the invite on registration, no confirmation needed
        if (invited && invites.length === 1) {
          await acceptInvite(invites[0].teamId, userId, invites[0].inviteId, invites[0].role)
        }

        //track with bento
        bentoTrack(userId, 'addSubscriber', {
          email: decodedJwt?.email,
          fields: {
            invited,
            name: name ? name.replace(/https?:\/\/\S+/gi, '').trim() : '',
          },
        })
      } catch (error) {
        console.error(error)
        return res.status(500).send({ message: error?.message })
      }
    }

    res.setHeader('set-cookie', serializedCookie)
    return res.send({ message: 'success' })
    
  } catch (error) {
    console.error('Authentication error:', error)
    if (error.codePrefix === 'auth') {
      return res.status(401).json({ 
        message: error.errorInfo?.message || 'Invalid authentication token provided'
      })
    }
    return res.status(500).json({ message: 'Internal server error during authentication' })
  }
}
