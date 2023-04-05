import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getAuth } from 'firebase-admin/auth'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import sendEmail from '@/lib/sendEmail'

export default async function createCheckoutSession(req, res) {
    configureFirebaseApp()
    const firestore = getFirestore()

    if (req.method === 'POST') {
      let check = null
      try {
        check = await userTeamCheck(req, res)
      } catch (error) {
        return res.status(403).json({ message: error?.message })
      }
      const { userId, team } = check

      try {
        const { inviteEmail } = req.body
        let userRecord = null
        try {
          userRecord = await getAuth().getUserByEmail(inviteEmail)
        } catch {}

        if (userRecord !== null) {
          try {
            bentoTrack(userId, 'track', {
              type: 'inviteUser',
            })
          } catch (e) {
            console.log('Error sending bento track', e)
          }

          // add user to team roles
          await firestore.runTransaction(async (transaction) => {
            const teamRef = firestore.collection('teams').doc(team.id)
            const teamDoc = await transaction.get(teamRef)
            const alreadyAdded = teamDoc.data().roles[userRecord.uid]
            if (alreadyAdded !== undefined) {
              throw new Error('User is already part of the team!')
            }

            // get invites where the email && the teamId match
            const inviteRef = firestore.collection('invites')
            const alreadyInvited = await inviteRef.where("email", "==", inviteEmail).where("teamId", "==", team.id).get()
            if (alreadyInvited.length >= 1) {
              throw new Error('User was already invited to the team!')
            }

            const docRef = await inviteRef.add({
              createdAt: FieldValue.serverTimestamp(),
              email: inviteEmail,
              teamId: team.id, 
            });
          })

          return res.status(200).send({ message: `Successfully invited ${inviteEmail} to the team!`})
        } else {
          // user doesn't exist, add invite!
          await firestore.runTransaction(async (transaction) => {
            const inviteRef = firestore.collection('invites')
            const docRef = await inviteRef.add({
              createdAt: FieldValue.serverTimestamp(),
              email: inviteEmail,
              teamId: team.id, 
            });
          })

          await sendEmail(inviteEmail, `You've been invited to ${team.name}`, `<p>Please <a href="https://docsbot.ai/register">sign up</a> to get started! You'll be able to see the invite under your teams dashboard.</p>`)
          return res.status(200).send({ message: `An invite email has been sent to ${inviteEmail}`})
        }
      } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err?.message })
      }
    } else if (req.method === 'PUT') {
      const { uid, email } = await getAuthorizedUser({ req, res })

      // user is accepting/denying an invite request
      try {
        const { status, teamId, inviteId } = req.body
        console.log(status, teamId, inviteId)
        if (status === 'accept') {
          // add user to team roles
          let teamName = null
          await firestore.runTransaction(async (transaction) => {
            const teamRef = firestore.collection('teams').doc(teamId)
            const inviteRef = firestore.collection('invites').doc(inviteId)
            const teamDoc = await transaction.get(teamRef)
            const inviteDoc = await transaction.get(inviteRef)
            if (inviteDoc.data().email !== email || inviteDoc.data().teamId !== teamId) {
              throw new Error('You were not invited to this team!')
            }
            teamName = teamDoc.data().name

            console.log('data:', teamDoc.data().roles, typeof teamDoc.data().roles)
            const isAdded = teamDoc.data().roles[uid]
            if (isAdded === undefined) {
                await transaction.update(teamRef, {
                  roles: {
                    [uid]: 'admin',
                    ...teamDoc.data().roles
                  }
                })

                // set the user's currentTeam to the newly joined team
                await transaction.update(firestore.collection('users').doc(uid), {
                  currentTeam: teamId
                })
            }

            await transaction.delete(inviteRef)
          })

          return res.status(200).send({ message: `Successfully joined ${teamName}!`})
        } else if (status == 'deny') {
          // add user to team roles
          await firestore.runTransaction(async (transaction) => {
            const teamRef = firestore.collection('teams').doc(teamId)
            const inviteRef = firestore.collection('invites').doc(inviteId)
            const teamDoc = await transaction.get(teamRef)
            const inviteDoc = await transaction.get(inviteRef)
            if (inviteDoc.data().email !== email) {
              throw new Error('You were not invited to this team!')
            }

            await transaction.delete(inviteRef)
          })

          return res.status(200).send({ message: `Declined invite`})
        }
      } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err?.message })
      }
    } else {
      res.setHeader('Allow', 'POST')
      res.status(405).end('Method Not Allowed')
    }
  }