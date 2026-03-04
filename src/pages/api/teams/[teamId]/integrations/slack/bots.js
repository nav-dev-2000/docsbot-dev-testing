import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore } from 'firebase-admin/firestore'
import { getBotIdFromChannelMapping, getValidChannelEntries } from '@/lib/slackHelpers'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  }

  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { team } = check
  const { slackTeamId } = req.query

  try {
    const integrationRef = firestore.collection('teams').doc(team.id).collection('integrations').doc('slack')
    const integrationDoc = await integrationRef.get()
    const data = integrationDoc.data() || {}
    const workspaces = data.workspaces || {}

    // With workspace-level auth, linked bots = defaultBotId + all bots in channelBotMap
    const getBotsForWorkspace = (ws) => {
      const botIds = new Set()
      if (ws?.defaultBotId) botIds.add(ws.defaultBotId)
      getValidChannelEntries(ws?.channelBotMap || {}).forEach(([, mapping]) => {
        const id = getBotIdFromChannelMapping(mapping)
        if (id) botIds.add(id)
      })
      return Array.from(botIds)
    }

    let bots = []
    if (slackTeamId) {
      const ws = workspaces[slackTeamId]
      if (!ws?.slackTeamId) return res.status(200).json({ bots: [] })
      const botIds = getBotsForWorkspace(ws)
      const botDocs = await Promise.all(
        botIds.map((id) => firestore.collection('teams').doc(team.id).collection('bots').doc(id).get()),
      )
      bots = botDocs
        .filter((d) => d.exists)
        .map((d) => ({
          id: d.id,
          name: d.data()?.name,
          slackTeamId: ws.slackTeamId,
          slackTeamName: ws.slackTeamName,
          slackConnectedAt: ws.slackConnectedAt,
        }))
    } else {
      for (const ws of Object.values(workspaces)) {
        if (!ws?.slackTeamId) continue
        const botIds = getBotsForWorkspace(ws)
        const botDocs = await Promise.all(
          botIds.map((id) => firestore.collection('teams').doc(team.id).collection('bots').doc(id).get()),
        )
        bots.push(
          ...botDocs
            .filter((d) => d.exists)
            .map((d) => ({
              id: d.id,
              name: d.data()?.name,
              slackTeamId: ws.slackTeamId,
              slackTeamName: ws.slackTeamName,
              slackConnectedAt: ws.slackConnectedAt,
            })),
        )
      }
    }

    return res.status(200).json({ bots })
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
}
