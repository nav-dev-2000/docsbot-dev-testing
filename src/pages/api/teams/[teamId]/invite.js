import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getAuth } from 'firebase-admin/auth'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import sendEmail from '@/lib/sendEmail'
import { stripePlan } from '@/utils/helpers'

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  )
}

export default async function handleInvite(req, res) {
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

      // sanity check stripe plan
      const plan = stripePlan(team)
      if (Object.keys(team.roles).length >= plan.teamMembers) {
        // the user copy here isn't actually read by the user, the 403 status code is handled by showing the upgrade modal
        return res.status(403).send({ message: `You've reached your team member limit, please upgrade to our enterprise plan!`})
      }

      try {
        bentoTrack(userId, 'track', {
          type: 'inviteUser',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      try {
        // grab user and invite them (or send an email if they haven't signed up)
        const { inviteEmail } = req.body

        if (!validateEmail(inviteEmail)) {
          throw new Error("Please make sure the email is valid!")
        }

        let userRecord = null
        try {
          userRecord = await getAuth().getUserByEmail(inviteEmail)
        } catch {}

        if (userRecord !== null) {
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
            const invites = await inviteRef.where("email", "==", inviteEmail).where("teamId", "==", team.id).get()
            if (invites.size >= 1) {
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
          const inviteRef = firestore.collection('invites')
          const invites = await inviteRef.where("email", "==", inviteEmail).where("teamId", "==", team.id).get()
          if (invites.size >= 1) {
            throw new Error('User was already invited to the team!')
          }

          // user doesn't exist, add invite!
          await firestore.runTransaction(async (transaction) => {
            const inviteRef = firestore.collection('invites')
            const docRef = await inviteRef.add({
              createdAt: FieldValue.serverTimestamp(),
              email: inviteEmail,
              teamId: team.id, 
            });
          })

          const inviter = await getAuth().getUser(userId)
          const name = inviter.name || inviter.email
          const emailBody = `You have been invited by ${name} to join ${team.name} on DocsBot, a powerful platform for managing custom-trained AI chatbots!
          To get started, please follow these simple steps:
          <ol>
            <li>Click on the following link to accept your invitation and create your DocsBot account: <a href="https://docsbot.ai/register?redirect=/app/team">https://docsbot.ai/register?redirect=/app/team</a></li>
            <li>Once you've created your account, you'll be directed to the team's workspace on DocsBot. Here, you'll find all our bots, as well as any relevant documentation and resources.</li>
            <li>Feel free to explore the platform and familiarize yourself with its features. If you have any questions or need assistance, you can reach out to our support line by clicking on 'help' <a href="https://docsbot.ai/">here</a>.</li>
          </ol>`
          await sendEmail(inviteEmail, `You've been invited to ${team.name} on DocsBot`, emailBody)
          return res.status(200).send({ message: `An invite email has been sent to ${inviteEmail}`})
        }
      } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err?.message })
      }
    } else if (req.method === 'PUT') {
      const { uid, email } = await getAuthorizedUser({ req, res })

      try {
        bentoTrack(uid, 'track', {
          type: 'acceptInvite',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

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
          // remove invite
          await firestore.runTransaction(async (transaction) => {
            const inviteRef = firestore.collection('invites').doc(inviteId)
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