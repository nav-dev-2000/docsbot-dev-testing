import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { getUserRole } from '@/utils/function.utils'

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
  const { teamId } = req.query

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // Check if user has permission (owner or admin)
    const role = getUserRole(team, userId)
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({
        message: 'You are not allowed to revoke MCP OAuth access.',
      })
    }

    const { client_id } = req.body

    if (!client_id) {
      return res.status(400).json({ message: 'client_id is required' })
    }

    // Query Firestore for all tokens with this client_id and team_id
    const tokensSnapshot = await firestore
      .collection('mcpOauthTokens')
      .where('team_id', '==', teamId)
      .where('client_id', '==', client_id)
      .get()

    let deletedCount = 0
    const botIdsToRemove = new Set()

    // Delete all tokens for this client
    for (const doc of tokensSnapshot.docs) {
      const tokenData = doc.data()
      const accessBotIds = tokenData.access_bot_ids || []
      accessBotIds.forEach((botId) => botIdsToRemove.add(botId))
      
      await doc.ref.delete()
      deletedCount++
    }

    // Update team document to remove mcpAccessBotIds if needed
    if (botIdsToRemove.size > 0) {
      const teamRef = firestore.collection('teams').doc(teamId)
      const teamDoc = await teamRef.get()
      
      if (teamDoc.exists) {
        const teamData = teamDoc.data()
        const mcpAccessBotIds = teamData.mcpAccessBotIds || []
        
        // Remove bot IDs that are no longer referenced by any tokens
        const remainingTokensSnapshot = await firestore
          .collection('mcpOauthTokens')
          .where('team_id', '==', teamId)
          .get()
        
        const remainingBotIds = new Set()
        remainingTokensSnapshot.forEach((doc) => {
          const tokenData = doc.data()
          const accessBotIds = tokenData.access_bot_ids || []
          accessBotIds.forEach((botId) => remainingBotIds.add(botId))
        })
        
        // Update mcpAccessBotIds to only include bots that still have tokens
        const updatedMcpAccessBotIds = mcpAccessBotIds.filter((botId) =>
          remainingBotIds.has(botId)
        )
        
        await teamRef.update({
          mcpAccessBotIds: updatedMcpAccessBotIds,
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Revoked ${deletedCount} token(s) for client ${client_id}`,
      deleted_count: deletedCount,
    })
  } catch (error) {
    console.error('Error revoking MCP OAuth access:', error)
    return res.status(500).json({ message: 'Error revoking MCP OAuth access' })
  }
}
