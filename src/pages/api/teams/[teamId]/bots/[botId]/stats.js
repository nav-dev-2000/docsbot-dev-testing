import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import { getStats } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'

export default async function handler(req, res) {
  configureFirebaseApp()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'GET') {
    let { timeDelta } = req.query

    // check if timeDelta is valid and a number
    if (!timeDelta || isNaN(timeDelta) || timeDelta < 0 || timeDelta > 90) {
      timeDelta = 30
    }

    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: "botId doesn't exist." })
      }

      return res
        .status(200)
        .json(getStats(bot, timeDelta))
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
