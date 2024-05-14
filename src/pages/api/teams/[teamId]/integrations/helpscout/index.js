import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getTeamIntegrations } from '@/lib/dbQueries'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import { stripePlan } from '@/utils/helpers'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  const integrations =  await getTeamIntegrations(team.id)
  const helpscout = integrations.find((i) => i.id === 'helpscout')

  if (req.method === 'POST') {
    const { assignedBots, assignedMailboxes, sourceResponse, noteResponse, saveMeta } = req.body

    // sanity check user permissions
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    }

    // must be pro plan or higher
    if (stripePlan(team).bots < 10) {
      return res.status(402).json({
        message: 'Please upgrade to the Power plan or higher to add integrations.',
      })
    }
    
    let newData = {}
    if (assignedBots) {
      let newTags = []
      try {
        // construct new tags array
        for (let tag of helpscout.tags) {
          const newBotId = assignedBots[tag.id]
          if (newBotId) {
            if (newBotId === 'none') {
              delete tag.assignedBot
            } else {
              tag.assignedBot = newBotId
            }
          }

          newTags.push(tag)
        }
      } catch(e) {
        return res.status(500).json({ message: 'invalid assignedBots format, should be: {\'tagid\': \'botid\' }!'})
      }

      newData.tags = newTags
    }


    if (assignedMailboxes) {
      let newAssignedMailboxes = helpscout?.assignedMailboxes || {}
      // verify mailboxes exist
      for (let mb of helpscout.mailboxes) {
        const newBotId = assignedMailboxes[mb.id]
        if (newBotId) {
          if (newBotId !== 'none') {
            newAssignedMailboxes[mb.id] = newBotId
          } else {
            delete newAssignedMailboxes[mb.id]
          }
        }
      }

      newData.assignedMailboxes = newAssignedMailboxes
    }

    // update sourceResponse
    if (typeof sourceResponse !== 'undefined') {
      newData.sourceResponse = sourceResponse
    }

    // update noteResponse
    if (typeof noteResponse !== 'undefined') {
      newData.noteResponse = noteResponse
    }

    // update saveMeta
    if (typeof saveMeta !== 'undefined') {
      newData.saveMeta = saveMeta
    }

    // update firestore doc
    await firestore.collection('teams').doc(team.id).collection('integrations').doc('helpscout').update({
      ...newData
    })

    return res.status(200).json({
      integration: {
        ...helpscout,
        ...newData
      }
    })
  }
}