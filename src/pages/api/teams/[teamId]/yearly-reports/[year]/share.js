import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()
  const { year } = req.query

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message || 'Unauthorized' })
  }

  const { userId, team } = check

  if (!canUserModifyTeam(team, userId) && !isSuperAdmin(userId)) {
    return res.status(403).json({
      message: 'Unauthorized action; please contact your team owner.',
    })
  }

  const { is_public } = req.body || {}

  if (typeof is_public !== 'boolean') {
    return res.status(400).json({ message: 'is_public must be a boolean' })
  }

  try {
    await firestore
      .collection('teams')
      .doc(team.id)
      .set(
        {
          yearlyReports: {
            [year]: {
              ...(team.yearlyReports?.[year] || {}),
              is_public,
            },
          },
        },
        { merge: true },
      )

    return res.status(200).json({ is_public })
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Unable to update yearly report share settings' })
  }
}
