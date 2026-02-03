import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import { getStats } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserViewBot } from '@/utils/function.utils'

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
    let { timeDelta, startDate, endDate } = req.query

    // Backwards compatibility: default to timeDelta if provided/valid
    let useRange = false
    let range = null

    if (startDate || endDate) {
      // Validate and build range if both dates provided
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
        // Clamp to max 365 days for safety
        const dayMs = 24 * 60 * 60 * 1000
        const diffDays = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1
        if (diffDays > 365) {
          // If too large, shrink startDate to be 365 days before endDate
          const clampedStart = new Date(end.getTime() - 364 * dayMs)
          range = { startDate: clampedStart.toISOString(), endDate: end.toISOString() }
        } else if (diffDays >= 1) {
          range = { startDate: start.toISOString(), endDate: end.toISOString() }
        }
        useRange = !!range
      }
    }

    // Validate timeDelta if not using range
    if (!useRange) {
      // check if timeDelta is valid and a number
      if (!timeDelta || isNaN(timeDelta) || timeDelta < 0 || timeDelta > 365) {
        timeDelta = 30
      } else {
        timeDelta = Number(timeDelta)
      }
    }

    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: "botId doesn't exist." })
      }

      if (!canUserViewBot(team, bot, userId)) {
        return res.status(403).json({ message: 'You are not allowed to view stats for this bot.' })
      }

      return res
        .status(200)
        .json(useRange ? getStats(bot, range) : getStats(bot, timeDelta))
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
