import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getValidChannelEntries } from '@/lib/slackHelpers'

const sanitizeSlackDoc = (data = {}) => {
  if (!data || typeof data !== 'object') {
    return { workspaces: {} }
  }

  const rawWorkspaces = data.workspaces && typeof data.workspaces === 'object' ? data.workspaces : {}
  const workspaces = {}
  for (const [id, ws] of Object.entries(rawWorkspaces)) {
    if (!ws || typeof ws !== 'object') continue
    const { slackBotToken, ...rest } = ws
    workspaces[id] = rest // strip token from response
  }

  return { workspaces }
}

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check
  const integrationRef = firestore
    .collection('teams')
    .doc(team.id)
    .collection('integrations')
    .doc('slack')

  if (req.method === 'GET') {
    const integrationDoc = await integrationRef.get()
    return res.status(200).json(sanitizeSlackDoc(integrationDoc.data()))
  }

  if (req.method === 'PATCH') {
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.' })
    }

    const payloadWorkspaces = req.body?.workspaces
    if (!payloadWorkspaces || typeof payloadWorkspaces !== 'object') {
      return res.status(400).json({ message: 'Missing workspaces payload.' })
    }

    const integrationDoc = await integrationRef.get()
    const existingWorkspaces = integrationDoc.data()?.workspaces || {}

    const mergedWorkspaces = {}
    for (const [slackTeamId, workspaceConfig] of Object.entries(payloadWorkspaces)) {
      if (!slackTeamId || typeof workspaceConfig !== 'object' || !workspaceConfig) continue

      const existing = existingWorkspaces[slackTeamId] || {}
      const merged = { ...existing }

      if (Object.prototype.hasOwnProperty.call(workspaceConfig, 'defaultBotId')) {
        merged.defaultBotId = workspaceConfig.defaultBotId || FieldValue.delete()
      }
      if (Object.prototype.hasOwnProperty.call(workspaceConfig, 'channelBotMap')) {
        const validEntries = getValidChannelEntries(workspaceConfig.channelBotMap || {})
        merged.channelBotMap = validEntries.length > 0 ? Object.fromEntries(validEntries) : FieldValue.delete()
      }

      if (Object.keys(merged).some((k) => merged[k] !== undefined)) {
        mergedWorkspaces[slackTeamId] = merged
      }
    }

    if (Object.keys(mergedWorkspaces).length === 0) {
      return res.status(400).json({ message: 'No valid Slack integration updates provided.' })
    }

    // Write nested objects under workspaces.<slackTeamId> (no dotted literal keys for nested maps)
    const updatePayload = {}
    for (const [slackTeamId, config] of Object.entries(mergedWorkspaces)) {
      updatePayload[`workspaces.${slackTeamId}`] = config
    }
    await integrationRef.update(updatePayload)

    const updatedDoc = await integrationRef.get()
    return res.status(200).json(sanitizeSlackDoc(updatedDoc.data()))
  }

  if (req.method === 'DELETE') {
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.' })
    }

    const { slackTeamId } = req.query
    if (!slackTeamId) {
      return res.status(400).json({ message: 'Missing slackTeamId query parameter.' })
    }

    const integrationDoc = await integrationRef.get()
    const data = integrationDoc.data() || {}
    const workspaces = { ...(data.workspaces || {}) }
    delete workspaces[slackTeamId]

    await integrationRef.set({ workspaces }, { merge: true })

    // Remove from team.slackWorkspaceIds
    const teamRef = firestore.collection('teams').doc(team.id)
    await teamRef.update({
      slackWorkspaceIds: FieldValue.arrayRemove(slackTeamId),
    })

    const updatedDoc = await integrationRef.get()
    return res.status(200).json(sanitizeSlackDoc(updatedDoc.data()))
  }

  return res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
}
