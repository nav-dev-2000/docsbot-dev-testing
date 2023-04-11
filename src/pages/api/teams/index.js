import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import userTeamCheck from '@/lib/userTeamCheck'
import { isSuperAdmin } from '@/utils/helpers'
import { getTeams, assignDefaultTeamTransaction, getInvitesFromEmailAndTeamIdTransaction } from '@/lib/dbQueries'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()
  let userId

  try {
    const context = { req, res }
    const { uid } = await getAuthorizedUser(context)
    userId = uid
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  if (req.method === 'GET') {
    //get teams for user list
    return res.json(await getTeams(userId))
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}
