import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
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
  } if (req.method === 'DELETE') {
    let check = null
    try {
      check = await userTeamCheck(req, res)
    } catch (error) {
      return res.status(403).json({ message: error?.message })
    }
    const { team } = check
    const { removeUserId, removeUserEmail } = req.body

    await firestore.runTransaction(async (transaction) => {
      // remove member from teamRoles
      if (removeUserId !== null) {
        const teamRef = firestore.collection('teams').doc(team.id)
        const teamDoc = await transaction.get(teamRef)
        const isAdded = teamDoc.data().roles[removeUserId]
  
        if (isAdded === undefined) {
          throw new Error('User is not part of this team!')
        }
  
        // remove from team roles
        let newRoles = teamDoc.data().roles
        delete newRoles[removeUserId]
        await transaction.update(teamRef, {
          roles: newRoles
        })
  
        // set the user's currentTeam to their default team
        await assignDefaultTeamTransaction(transaction, removeUserId, 'User')
      } else if (removeUserEmail !== null) { // remove invite
        const invites = await getInvitesFromEmailAndTeamIdTransaction(transaction, removeUserEmail, team.id)
        if (invites.length <= 0) {
          throw new Error('Email was not invited!')
        }
        const invite = invites[0];

        await transaction.delete(firestore.collection('invites').doc(invite.id))
      }
    })
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}
