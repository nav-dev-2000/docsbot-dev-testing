import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'

export default async function userTeamCheck(req, res) {
  configureFirebaseApp()

  const { teamId } = req.query
  const context = { req, res }
  const { uid } = await getAuthorizedUser(context)

  //check if user has access to team
  const teamRef = await getFirestore().collection('teams').doc(teamId).get()
  if (teamRef.exists && ( teamRef.data().roles[uid] || isSuperAdmin(uid) )) {
    let team = { id: teamId, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //make serializable
    return { userId: uid, team }
  } else {
    throw new Error('User does not have access to team')
  }
}
