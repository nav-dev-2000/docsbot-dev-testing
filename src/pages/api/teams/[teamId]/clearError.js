import userTeamCheck from '@/lib/userTeamCheck'
import { clearLastError } from '@/lib/apiFunctions'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

export default async function handler(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  if (req.method === 'POST') {
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({
        message: 'Unauthorized action; please contact your team owner.',
      })
    }

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
