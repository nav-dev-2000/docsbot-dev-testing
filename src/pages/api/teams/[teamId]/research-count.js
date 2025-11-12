import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  configureFirebaseApp()

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { team } = check
  const researchCount = Number(team?.researchCount ?? 0) || 0

  return res.json({ researchCount })
}
