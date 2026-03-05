/**
 * POST /api/slack/oauth/claim
 * Body: { slack_team_id, teamId }
 * Attaches a pending Slack install (from Marketplace) to the given DocsBot team.
 * Requires auth; user must be admin/owner of the team.
 */
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getTeam, getBot } from '@/lib/dbQueries'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let uid
  try {
    const auth = await getAuthorizedUser({ req, res })
    uid = auth.uid
  } catch {
    return res.status(401).json({ message: 'Please sign in to connect Slack.' })
  }

  const { slack_team_id: slackTeamId, teamId, defaultBotId: requestedDefaultBotId } = req.body || {}
  if (!slackTeamId || !teamId) {
    return res.status(400).json({ message: 'Missing slack_team_id or teamId.' })
  }

  const team = await getTeam(teamId)
  if (!team) {
    return res.status(404).json({ message: 'Team not found.' })
  }
  if (!canUserModifyTeam(team, uid) && !isSuperAdmin(uid)) {
    return res.status(403).json({ message: 'Only team admins can connect Slack.' })
  }

  if (requestedDefaultBotId) {
    const bot = await getBot(teamId, requestedDefaultBotId)
    if (!bot) {
      return res.status(400).json({ message: 'Selected default bot not found in this team.' })
    }
  }

  configureFirebaseApp()
  const firestore = getFirestore()

  const pendingRef = firestore.collection('slackInstallPending').doc(slackTeamId)
  const pendingSnap = await pendingRef.get()
  const data = pendingSnap.data()

  if (!data) {
    return res.status(404).json({ message: 'No pending Slack install found. It may have expired.' })
  }

  // expiresAt is a Firestore Timestamp when read from the document
  const expiresAtMs = data.expiresAt?.toMillis?.() ?? (data.expiresAt ? new Date(data.expiresAt).getTime() : 0)
  if (!expiresAtMs || Date.now() > expiresAtMs) {
    await pendingRef.delete()
    return res.status(404).json({ message: 'This connection link has expired. Please install from Slack again.' })
  }

  const integrationRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('integrations')
    .doc('slack')

  const integrationSnap = await integrationRef.get()
  const existingData = integrationSnap.data() || {}
  const existingWorkspace = existingData.workspaces?.[slackTeamId] || {}

  const workspaceUpdate = {
    slackBotToken: data.slackBotToken,
    slackBotUserId: data.slackBotUserId,
    slackTeamId: data.slackTeamId,
    slackTeamName: data.slackTeamName,
    slackIsEnterprise: data.slackIsEnterprise,
    slackConnectedAt: data.slackConnectedAt || new Date().toISOString(),
    defaultBotId: requestedDefaultBotId || existingWorkspace.defaultBotId || null,
    channelBotMap: existingWorkspace.channelBotMap || {},
    ...(data.slackEnterpriseId
      ? {
          slackIsEnterprise: true,
          slackEnterpriseId: data.slackEnterpriseId,
          slackEnterpriseName: data.slackEnterpriseName,
        }
      : {}),
  }

  await integrationRef.set(
    {
      workspaces: {
        ...(existingData.workspaces || {}),
        [slackTeamId]: workspaceUpdate,
      },
    },
    { merge: true },
  )

  const teamRef = firestore.collection('teams').doc(teamId)
  const teamDoc = await teamRef.get()
  const teamData = teamDoc.data() || {}
  const existingIds = teamData.slackWorkspaceIds || []
  if (!existingIds.includes(slackTeamId)) {
    await teamRef.update({
      slackWorkspaceIds: FieldValue.arrayUnion(slackTeamId),
    })
  }

  await pendingRef.delete()

  return res.status(200).json({
    ok: true,
    teamId,
    slackTeamId,
    slackTeamName: data.slackTeamName,
    redirectPath: '/app/api#slack-settings',
  })
}
