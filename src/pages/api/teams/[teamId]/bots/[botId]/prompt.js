import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { phTrack } from '@/lib/posthog'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// https://platform.openai.com/docs/guides/prompt-generation
const META_PROMPT = `
Given a task description or existing prompt, produce a detailed system prompt to guide a language model based on user input.

Understand the main objective, goals, requirements, constraints, and expected output of the task. If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.

# Steps

1. Analyze the user's input to understand the context and requirements.
2. Determine the appropriate tone, style, and complexity for the custom prompt.
3. Incorporate relevant elements from the user's input into the custom prompt.
4. Ensure the custom prompt is clear, concise, and actionable.
5. Include any necessary constraints or guidelines within the custom prompt.

# Output Format

The output should be a single paragraph or a short series of sentences, typically between 50-150 words. The custom prompt should be directly usable by an AI model without further modification.

# Examples

Input: "Create a writing prompt for a science fiction story"
Output: Imagine a world where humans have developed the ability to transfer consciousness between bodies. Write a short story exploring the ethical and social implications of this technology, focusing on a character who must decide whether to use this ability to save a loved one's life. Consider the potential consequences and moral dilemmas that arise from such a decision.

Input: "Generate a prompt for a creative problem-solving exercise"
Output: You're the CEO of a struggling eco-friendly packaging company. Your main product, biodegradable plastic alternatives, is being outperformed by a competitor's cheaper, non-biodegradable option. Develop a comprehensive strategy to innovate your product line, reduce costs, and educate consumers about the importance of sustainable packaging. Consider technological advancements, marketing approaches, and potential partnerships in your solution.

# Notes

- Ensure that the generated custom prompts are open-ended enough to encourage creativity and critical thinking.
- Avoid overly specific details that might limit the user's imagination or problem-solving approach.
- Tailor the complexity of the custom prompt to match the perceived skill level or needs of the end-user.
- Include elements that challenge assumptions or encourage novel perspectives when appropriate.
`.trim()


// Meta prompt for task completion
const META_PROMPT_2 = `
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

Understand the main objective, goals, requirements, constraints, and expected output of the task. If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.

Encourage reasoning steps before any conclusions are reached. If the user provides examples where the reasoning happens afterward, reverse the order. Never start examples with conclusions. Ensure conclusions, classifications, or results always appear last.

Include high-quality examples if helpful, using placeholders [in brackets] for complex elements. Use clear, specific language and avoid unnecessary instructions or bland statements. Use markdown features for readability.

Keep any details, guidelines, examples, variables, or placeholders provided by the user intact. Include constants in the prompt. Explicitly state the most appropriate output format, including length and syntax.

# Output Format

The final prompt should adhere to the following structure:

[Concise instruction describing the task]

[Additional details as needed]

[Optional sections with headings or bullet points for detailed steps]

# Steps [optional]

[Detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specific instructions on how the output should be formatted]

# Examples [optional]

[1-3 well-defined examples with placeholders if necessary]

# Notes [optional]

[Edge cases, details, and specific important considerations]

You are trained on data up to October 2023.
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
          { role: 'user', content: 'Chatbot Custom Prompt:' }
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
