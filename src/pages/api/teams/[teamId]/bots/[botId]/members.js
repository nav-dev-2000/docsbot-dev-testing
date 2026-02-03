import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserModifyTeam } from '@/utils/function.utils'
import { getBot } from '@/lib/dbQueries'
import { isSuperAdmin, checkPlanPermission } from '@/utils/helpers'

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
  const { botId } = req.query

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: `Method '${req.method}' Not Allowed` })
  }

  try {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    // only team admins/owners (or super admin) can change bot-specific roles
    if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
      return res.status(403).json({ message: 'Only team admins can change per-bot roles' })
    }

    const { memberId, role } = req.body
    if (!memberId || role === undefined) {
      return res.status(400).json({ message: 'memberId and role are required' })
    }

    // Check if team is on Business plan or higher before allowing per bot role changes
    // Only check if role is not 'default' (removing override is always allowed)
    if (role !== 'default') {
      const planCheck = checkPlanPermission(team, 'business')
      if (!planCheck.allowed) {
        return res.status(402).json({
          message: `Per-bot roles are only available on the ${planCheck.requiredPlanLabel} plan or higher. Please upgrade to use this feature.`,
        })
      }
    }

    const memberTeamRole = team?.roles?.[memberId]
    if (memberTeamRole === 'owner' || memberTeamRole === 'admin') {
      return res.status(403).json({
        message: 'Bot overrides are not allowed for owner or admin team roles.',
      })
    }

    const allowed = new Set(['default', 'admin', 'editor', 'viewer', 'none'])
    if (!allowed.has(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const botRef = firestore
      .collection('teams')
      .doc(team.id)
      .collection('bots')
      .doc(botId)

    const newRoles = { ...(bot.roles || {}) }
    if (role === 'default') {
      delete newRoles[memberId]
    } else {
      newRoles[memberId] = role
    }

    await botRef.update({ roles: newRoles })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating bot member role:', error)
    return res.status(500).json({ message: error?.message })
  }
}