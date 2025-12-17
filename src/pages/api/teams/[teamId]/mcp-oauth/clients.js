import userTeamCheck from '@/lib/userTeamCheck'
import { getUserRole } from '@/utils/function.utils'
import { getMcpOAuthClients } from '@/lib/dbQueries'

export default async function handler(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { teamId } = req.query

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    // Check if user has permission (owner or admin)
    const role = getUserRole(team, userId)
    if (role !== 'owner' && role !== 'admin') {
      return res.status(403).json({
        message: 'You are not allowed to view MCP OAuth clients.',
      })
    }

    // Fetch MCP OAuth clients using shared function
    const clients = await getMcpOAuthClients(teamId)

    return res.status(200).json({ clients })
  } catch (error) {
    console.error('Error fetching MCP OAuth clients:', error)
    return res.status(500).json({ message: 'Error fetching MCP OAuth clients' })
  }
}
