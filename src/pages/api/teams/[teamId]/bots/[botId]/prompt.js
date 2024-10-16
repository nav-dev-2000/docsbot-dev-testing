import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { phTrack } from '@/lib/posthog'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// https://platform.openai.com/docs/guides/prompt-generation
const META_PROMPT = `
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
    - Conclusion, classifications, or results should ALWAYS appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability. DO NOT USE \`\`\` CODE BLOCKS UNLESS SPECIFICALLY REQUESTED.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Access to Knowledge: Make sure the prompt reflects that when answering questions, you will be provided context to answer the question truthfully and accurately.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.
- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, JSON, etc.)
    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a JSON.
    - JSON should never be wrapped in code blocks (\`\`\`) unless explicitly requested.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---")

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]
[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]
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
    // Grab bot
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    const { input } = req.body

    if (!input) {
      return res.status(400).json({ message: 'Missing input parameter' })
    }

    try {
      // Generate the custom prompt using the META_PROMPT
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: META_PROMPT },
          { role: 'user', content: `Task, Goal, or Current Prompt:\n${input}` },
        ],
        max_tokens: 1000,
      })

      const generatedPrompt = completion.choices[0]?.message?.content

      phTrack(userId, 'Custom Prompt Generated', { "Bot name": bot.name }, team.id)

      return res.status(200).json({ prompt: generatedPrompt })
    } catch (error) {
      console.error('Error generating prompt:', error)
      return res.status(500).json({ message: 'Error generating prompt' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

export default handler
