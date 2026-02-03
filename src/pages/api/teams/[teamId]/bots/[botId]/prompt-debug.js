import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { phTrack } from '@/lib/posthog'
import { checkPlanPermission, isSuperAdmin } from '@/utils/helpers'
import OpenAI from 'openai'
import { canUserEditBot } from '@/utils/function.utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DEBUG_META_PROMPT = `
When asked to optimize prompts, give answers from your own perspective - explain what specific phrases could be added to, or deleted from, this prompt to more consistently elicit the desired behavior or prevent the undesired behavior.

# Output Format

- Respond in markdown format with clear sections, headings, and specific actionable recommendations.
- Your response should be a single markdown string without any surrounding code blocks.
- Use Markdown **only where semantically correct** (e.g., \`inline code\`, \`\`\`code fences\`\`\`, lists, tables, headings, *bold*, _italic_, etc).
- Skip any H1/title/first heading.
`.trim()

const handler = async (req, res) => {
  // Check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'POST') {
    // Check if user has permission to debug prompts
    if (!checkPlanPermission(team, 'hobby').allowed && !isSuperAdmin(userId)) {
      return res.status(403).json({ 
        message: 'Custom prompts are not available at your plan level.' 
      })
    }

    // Grab bot
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    // Ensure per-bot permission
    if (!canUserEditBot(team, userId, bot)) {
      return res.status(403).json({ message: 'You are not allowed to edit this bot.' })
    }

    const { prompt, desiredBehavior, undesiredBehavior, image_urls } = req.body

    if (!prompt) {
      return res.status(400).json({ 
        message: 'Missing required parameter: prompt is required' 
      })
    }

    if (!desiredBehavior && !undesiredBehavior) {
      return res.status(400).json({ 
        message: 'At least one behavior field (desiredBehavior or undesiredBehavior) is required' 
      })
    }

    try {
      let userMessage = `Here's a prompt: 
<prompt>
${prompt}
</prompt>

`

      if (desiredBehavior && undesiredBehavior) {
        userMessage += `The desired behavior from this prompt is for the agent to ${desiredBehavior}, but instead it ${undesiredBehavior}.`
      } else if (desiredBehavior) {
        userMessage += `The desired behavior from this prompt is for the agent to ${desiredBehavior}.`
      } else if (undesiredBehavior) {
        userMessage += `The undesired behavior from this prompt is that the agent ${undesiredBehavior}.`
      }

      userMessage += `

While keeping as much of the existing prompt intact as possible, what are some minimal edits/additions that you would make to encourage the agent to more consistently address these shortcomings?`

      const messages = [
        { role: 'system', content: DEBUG_META_PROMPT },
      ]

      if (image_urls && image_urls.length > 0) {
        // Add images to the message
        const imageContents = image_urls.map((url, index) => ({
          type: 'image_url',
          image_url: { url }
        }))
        
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            ...imageContents
          ]
        })
      } else {
        messages.push({ role: 'user', content: userMessage })
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages,
        max_completion_tokens: 10000,
        reasoning_effort: 'medium',
        store: true,
      })

      const analysis = completion.choices[0]?.message?.content

      if (!analysis) {
        throw new Error('No analysis generated')
      }

      phTrack(userId, 'Prompt Debug Analysis Generated', { "Bot name": bot.name }, team.id)

      return res.status(200).json({ 
        analysis,
        success: true 
      })
    } catch (error) {
      console.error('Error in prompt debug API:', error)
      return res.status(500).json({ message: `Failed to analyze prompt: ${error.message}` })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default handler

