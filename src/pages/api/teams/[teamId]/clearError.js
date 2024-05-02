import userTeamCheck from '@/lib/userTeamCheck'
import { getTeam } from '@/lib/dbQueries'
import { clearLastError } from '@/lib/apiFunctions'

export default async function handler(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  if (req.method === 'POST') {
    // sanity check user permissions
    // for now, all team members are allowed to clear errors
    // if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
    //   return res.status(403).json({ message: 'Unauthorized action; please contact your team owner.'})
    // }

    try {
      await clearLastError(team)
      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
