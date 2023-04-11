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

  if (req.method === 'DELETE') {
    let check = null
    try {
      check = await userTeamCheck(req, res)
    } catch (error) {
      return res.status(403).json({ message: error?.message })
    }
    const { team } = check
    const { removeUserId, removeUserEmail } = req.body
    console.log(removeUserId, removeUserEmail)

    try {
      await firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(team.id)
        const teamDoc = await transaction.get(teamRef)

        // sanity check that only owners can remove members
        if (teamDoc.data().roles[userId] !== 'owner' && !isSuperAdmin(userId)) {
          throw new Error('Only team owners can remove members!')
        }

        // remove member from teamRoles
        if (removeUserId !== undefined) {
          const isAdded = teamDoc.data().roles[removeUserId]
  
          // sanity check that they're not removing themselves lol
          if (userId === removeUserId) {
            throw new Error('You cannot remove yourself!')
          }

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
        } else if (removeUserEmail !== undefined) { // remove invite
          const invites = await getInvitesFromEmailAndTeamIdTransaction(transaction, removeUserEmail, team.id)
          if (invites.length <= 0) {
            throw new Error('Email was not invited!')
          }
          const invite = invites[0];

          await transaction.delete(firestore.collection('invites').doc(invite.uid))
        } else {
            // something's wrong
            return res.status(500).json({ message: "Something went wrong, please try again" })
        }
      })

      return res.status(200).send({ message: `Removed user successfully`})
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: error?.message })
    }
  } else {
    res.status(400).send({ message: 'Invalid HTTP method' })
  }
}
