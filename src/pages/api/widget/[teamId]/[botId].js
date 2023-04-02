import { getBot } from '@/lib/dbQueries'
import Cors from 'cors'

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['GET'],
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async function handler(req, res) {
  // Run the middleware
  await runMiddleware(req, res, cors)
  const { teamId, botId } = req.query

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=359'
  )
  
  if (req.method === 'GET') {
    try {
      const bot = await getBot(teamId, botId)
      if (bot) {
        if (bot.privacy === 'private') {
          return res.status(403).json({ message: 'Bot is private.' })
        }

        if (bot.status !== 'ready') {
          return res.status(409).json({ message: 'Bot is not ready.' })
        }

        const widget = {
          botId: botId,
          teamId: teamId,
          botName: bot.name,
          description: bot.description,
          color: bot.color || '#1292EE',
          icon: 'default',
          botIcon: 'robot',
          branding: true,
          supportLink: bot.supportLink || 'https://docsbot.ai',
          labels: {
            poweredBy: 'Powered by',
            inputPlaceholder: 'Send a message...',
            firstMessage: 'What can I help you with?',
            sources: 'Sources',
            helpful: 'Rate as helpful',
            unhelpful: 'Rate as unhelpful',
            getSupport: 'Contact support',
          }
        }

        return res.json(widget)
      } else {
        return res.status(404).json({ message: "botId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
