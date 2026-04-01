import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { phTrack } from '@/lib/posthog'
import {
  HERO_ICON_ENUM,
  normalizeWhitelistedHeroIcon,
} from '@/constants/heroIcons.constants'
import {
  buildCustomButtonFunctionKey,
  CUSTOM_BUTTON_FUNCTION_KEY_PATTERN,
  RESERVED_CUSTOM_BUTTON_TOOL_SUFFIXES,
} from '@/lib/botActions'
import OpenAI from 'openai'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/** Example drafts serialized into the system prompt (valid JSON inside fenced code blocks). */
const CUSTOM_BUTTON_DRAFT_EXAMPLE_EN = {
  functionKey: 'pricing',
  name: 'Pricing',
  instructions:
    'Call this tool when the user asks about plans, pricing tiers, billing, or how much the product costs. The tool displays your reply and shows a button to view pricing.',
  buttonText: 'View pricing',
  icon: 'BanknotesIcon',
}

const CUSTOM_BUTTON_DRAFT_EXAMPLE_JA = {
  functionKey: 'book_demo',
  name: 'デモ予約',
  instructions:
    'ユーザーが製品デモ、説明会、またはオンライン見学を希望したときにこのツールを呼び出す。返答を表示し、予約ページへ進むボタンを表示する。',
  buttonText: 'デモを予約',
  icon: 'CalendarIcon',
}

const SYSTEM_PROMPT = `
## Role

You are an expert at generating tool configurations for a chatbot custom button action. This will be used as the AI agent tool schema to help the agent decide when to call the tool and what the output should be. You will be given a description of the button purpose from the user which you will use to generate the tool configuration to the best of your ability, without asking for any additional feedback. You will not ask for any additional information or clarification, you will simply generate the tool configuration based on the user description provided.

## Output

Return one concise JSON object with these fields:

| Field | Description |
| --- | --- |
| \`functionKey\` | Stable internal ID from the button’s purpose (schema: ASCII \`a–z\`, \`0–9\`, underscores only; no spaces). |
| \`name\` | Short dashboard label (about 1–4 words). |
| \`instructions\` | When the AI should call this tool so it displays the assistant message and shows a button (1–4 sentences). Do not phrase this as “show this button” or similar—instead describe invoking the tool and what the message should convey. |
| \`buttonText\` | Short CTA on the button (usually 1–4 words). |
| \`icon\` | Single best Heroicon name from the provided enum. |

## Language

- Write \`name\`, \`instructions\`, and \`buttonText\` in the same language as the user’s message (match locale and tone when possible).
- \`functionKey\` must stay ASCII, per the schema.

## Rules

- Do not include a URL.
- Assume this will be shown in a customer-facing chat widget.
- Keep \`instructions\` specific and actionable: when to call this tool, that it displays the reply and shows a button—not wording like “show this button.”
- If the user names an outcome or destination, turn that into a useful CTA in \`buttonText\`.
- Avoid unnecessary quotation marks.

## Examples

> Illustrative only—the user’s real message and topic will differ. Always follow their actual request.

### English (pricing)

Input message:

> Send users to our pricing page when they ask about plans, tiers, or how much it costs.

Example output:

\`\`\`json
${JSON.stringify(CUSTOM_BUTTON_DRAFT_EXAMPLE_EN, null, 2)}
\`\`\`

### Japanese (demo booking)

Input message:

> ユーザーがデモや説明会を希望したとき、予約ページへのボタンを表示したい。

Example output:

\`\`\`json
${JSON.stringify(CUSTOM_BUTTON_DRAFT_EXAMPLE_JA, null, 2)}
\`\`\`
`.trim()

function normalizeDraftFunctionKey(raw, name) {
  let key = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  key = key.replace(/^button(?:_|$)/, '')
  if (!CUSTOM_BUTTON_FUNCTION_KEY_PATTERN.test(key)) {
    key = buildCustomButtonFunctionKey(name || '')
  }
  if (!key) {
    key = 'custom_button'
  }
  let suffix = 0
  while (RESERVED_CUSTOM_BUTTON_TOOL_SUFFIXES.has(key)) {
    suffix += 1
    key = buildCustomButtonFunctionKey(`${name || 'btn'}_${suffix}`)
  }
  return key
}

export default async function handler(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check
  const { botId } = req.query

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const input =
    typeof req.body?.input === 'string' ? req.body.input.trim() : ''

  if (!input) {
    return res.status(400).json({ message: 'Missing input parameter' })
  }

  const bot = await getBot(team.id, botId)
  if (!bot) {
    return res.status(404).json({ message: 'Bot not found' })
  }

  if (!canUserManageBotSettings(team, userId, bot)) {
    return res.status(403).json({
      message: 'You are not allowed to edit this bot.',
    })
  }

  if (!checkPlanPermission(team, 'personal', 'customButtons').allowed) {
    return res.status(403).json({
      message:
        'Custom CTA buttons are only available on the Personal plan or higher.',
    })
  }

  const existingCustomButtonCount = Array.isArray(bot.tools?.customButtons)
    ? bot.tools.customButtons.length
    : 0
  if (
    !checkPlanPermission(team, 'standard', 'multipleCustomButtons').allowed &&
    existingCustomButtonCount >= 1
  ) {
    return res.status(403).json({
      message:
        'Your plan includes one custom CTA button. Upgrade to Standard or higher to add another.',
    })
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-5.4-mini',
      instructions: SYSTEM_PROMPT,
      input: `Create a custom button draft from this description:\n${input}`,
      reasoning: {
        effort: 'medium',
      },
      store: true,
      text: {
        format: {
          type: 'json_schema',
          name: 'custom_button_draft',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              functionKey: {
                type: 'string',
                description:
                  'Lowercase ASCII only: letters a–z, digits 0–9, and underscores; words separated by single underscores (e.g. pricing_page). No spaces or punctuation.',
                pattern: CUSTOM_BUTTON_FUNCTION_KEY_PATTERN.source,
              },
              name: {
                type: 'string',
              },
              instructions: {
                type: 'string',
              },
              buttonText: {
                type: 'string',
              },
              icon: {
                type: 'string',
                enum: HERO_ICON_ENUM,
              },
            },
            required: [
              'functionKey',
              'name',
              'instructions',
              'buttonText',
              'icon',
            ],
            additionalProperties: false,
          },
        },
      },
    })

    const responseData = JSON.parse(response.output_text || '{}')

    const name =
      typeof responseData?.name === 'string' ? responseData.name.trim() : ''
    const functionKey = normalizeDraftFunctionKey(
      responseData?.functionKey,
      name,
    )

    phTrack(
      userId,
      'Custom Button Draft Generated',
      { 'Bot name': bot.name },
      team.id,
    )

    return res.status(200).json({
      functionKey,
      name,
      instructions:
        typeof responseData?.instructions === 'string'
          ? responseData.instructions.trim()
          : '',
      buttonText:
        typeof responseData?.buttonText === 'string'
          ? responseData.buttonText.trim()
          : '',
      icon: normalizeWhitelistedHeroIcon(responseData?.icon),
    })
  } catch (error) {
    console.error('Error generating custom button draft:', error)
    return res.status(500).json({
      message: 'Error generating custom button draft',
    })
  }
}
