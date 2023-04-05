import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'

export default async function createCheckoutSession(req, res) {
    configureFirebaseApp()
    const firestore = getFirestore()

    let check = null
    try {
      check = await userTeamCheck(req, res)
    } catch (error) {
      return res.status(403).json({ message: error?.message })
    }
    const { userId, team } = check

    //TODO check if their role has billing access
    if (req.method === 'POST') {
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
            console.log('data:', teamDoc.data().roles, typeof teamDoc.data().roles)
            const alreadyAdded = teamDoc.data().roles[userRecord.uid]
            if (alreadyAdded !== undefined) {
              throw new Error('User is already part of the team!')
            }

            await transaction.update(teamRef, {
              roles: {
                [userRecord.uid]: 'admin',
                ...teamDoc.data().roles
              }
            })
          })

          return res.status(200).send({ message: `Successfully added ${inviteEmail} to the team!`})
        } else {
          // user doesn't exist, add invite!
          await firestore.runTransaction(async (transaction) => {
            const inviteRef = firestore.collection('teams').doc(team.id).collection('invites')
            const docRef = await transaction.add(inviteRef, {
              createdAt: FieldValue.serverTimestamp(),
              email: inviteEmail,
            });
          })

          // TODO: send email
          return res.status(200).send({ message: `An invite email has been sent to ${inviteEmail}`})
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