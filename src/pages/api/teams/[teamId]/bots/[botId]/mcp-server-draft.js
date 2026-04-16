import userTeamCheck from '@/lib/userTeamCheck'
import { getBot } from '@/lib/dbQueries'
import { phTrack } from '@/lib/posthog'
import OpenAI from 'openai'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MCP_LABEL_PATTERN = /^[a-zA-Z0-9_-]+$/

const SYSTEM_PROMPT = `
## Role

You help administrators register an external Model Context Protocol (MCP) server for a chat agent. You receive the MCP server HTTPS URL in the user message. Sometimes the user message also includes an **Enabled tools** section listing which tools the administrator turned on for this connector—the tool names and descriptions appear **only** in that user message, not here. Produce a short internal label and a concise description that tells the agent when to use tools from this server.

## Tools

You may call the web_search tool when public documentation, announcements, or product pages would improve accuracy (for example, to learn what tools the remote server exposes). Prefer brief searches; the URL itself is always the primary anchor.

## Output (JSON)

Return one JSON object with:

| Field | Description |
| --- | --- |
| \`serverLabel\` | 3–64 characters. Only letters, digits, underscore (_), and hyphen (-). No spaces. **Do not include the letters “mcp” anywhere** (the UI already implies this is an MCP connection). Name the **service or product** this URL connects to—short, descriptive, lowercase words with underscores (e.g. \`docsbot_knowledge\`, \`stripe_billing\`, \`notion_workspace\`). |
| \`serverDescription\` | One or two short sentences (about 25–70 words). **Start with the word \`Use\`** (sentence case: “Use …”). **Do not name the product, vendor, brand, or website** in this field—\`serverLabel\` already identifies the service. Focus on **outcomes and uses**: what questions or tasks it helps with, what data or actions it supports (e.g. “Use to answer questions about keywords, backlinks, and rankings when users ask about SEO performance.” or “Use when the user needs invoice history, payment status, or subscription changes from their connected account.”). **Banned openings** (do not use): “Connects…”, “Enables the agent…”, “Allows the agent…”, “Integrates…”, “Links…”, “Provides access…”, “This server…”, “Official…”, or any phrase that explains MCP/protocol wiring. **Do not** use the word “MCP” or “Model Context Protocol” in the description. **Do not** include any URLs, links, markdown links, citations, parenthetical source references, or domains (the web search tool may add these—your JSON output must be plain sentences only). No markdown, no emojis. Do not mention OAuth, API keys, client IDs, or implementation steps. |

## Rules

- \`serverLabel\` must not contain the substring \`mcp\` in any casing (e.g. avoid \`docs_mcp\`, \`MCPHub\`).
- \`serverDescription\` must begin with the word \`Use\` and must **not** repeat the product or vendor name from the URL or label. Describe outcomes and when to invoke tools, not branding. Never include \`http://\`, \`https://\`, \`www.\`, \`[text](url)\`, or citation parentheses with domains.
- **If** the user message includes an **Enabled tools** section, use it as the primary context for \`serverDescription\`: align with those tools’ purposes (names and descriptions from the user message only). Do not imply access to tools not listed there. **If** there is no such section, infer capabilities from the URL and web search only.
- Never fabricate vendor names; if the URL is generic, describe capabilities cautiously.
- If web search returns nothing useful, infer a reasonable description from the hostname and path only.
`.trim()

/** @public Exported for tests */
export const MCP_SERVER_DRAFT_SYSTEM_PROMPT = SYSTEM_PROMPT

/**
 * @param {unknown} raw
 * @returns {Array<{ name: string, description?: string }>}
 */
export function normalizeEnabledToolsFromBody(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const item of raw.slice(0, 200)) {
    if (typeof item === 'string') {
      const name = item.trim().slice(0, 256)
      if (name) out.push({ name })
    } else if (item && typeof item === 'object' && typeof item.name === 'string') {
      const name = item.name.trim().slice(0, 256)
      if (!name) continue
      const o = { name }
      if (typeof item.description === 'string' && item.description.trim()) {
        o.description = item.description.trim().slice(0, 2000)
      }
      out.push(o)
    }
  }
  return out
}

/**
 * Remove markdown links, angle-bracket URLs, bare http(s)/www URLs, and empty
 * citation parens left behind (e.g. when web_search injects inline sources).
 */
export function stripLinksAndUrlsFromDescription(text) {
  if (typeof text !== 'string') return ''
  let s = text
  // Markdown images and links: [label](url), ![alt](url)
  s = s.replace(/!?\[[^\]]*\]\([^)]*\)/g, '')
  // <https://...>
  s = s.replace(/<\s*https?:\/\/[^>]+>/gi, '')
  // Bare http(s) URLs
  s = s.replace(/https?:\/\/[^\s<>\])]+/gi, '')
  // www. without scheme
  s = s.replace(/\bwww\.[^\s<>\])]+/gi, '')
  // Leftover empty parentheses from stripped citations
  s = s.replace(/\s*\(\s*\)/g, '')
  s = s.replace(/\s{2,}/g, ' ')
  s = s.replace(/\s+([.,;:!?])/g, '$1')
  return s.trim()
}

function stripMcpSubstring(label) {
  let s = label.replace(/mcp/gi, '')
  s = s.replace(/_+/g, '_').replace(/^_|_$/g, '')
  return s
}

function normalizeMcpServerLabel(raw, serverUrl) {
  let s = typeof raw === 'string' ? raw.trim() : ''
  if (s) {
    s = stripMcpSubstring(s)
  }
  if (!MCP_LABEL_PATTERN.test(s) || s.length < 3) {
    s = ''
  }
  if (!s) {
    try {
      const host = new URL(serverUrl).hostname.replace(/^www\./i, '')
      const parts = host.split('.').filter((p) => p && !/^mcp$/i.test(p))
      const first = parts[0] || 'service'
      s = first.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
      s = stripMcpSubstring(s)
      if (s.length < 3) {
        s = 'connected_service'
      }
    } catch {
      s = 'connected_service'
    }
  }
  if (s.length > 255) {
    s = s.slice(0, 255)
  }
  return s
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

  const serverUrl =
    typeof req.body?.serverUrl === 'string' ? req.body.serverUrl.trim() : ''

  if (!serverUrl) {
    return res.status(400).json({ message: 'Missing serverUrl parameter' })
  }

  if (serverUrl.length > 255) {
    return res.status(400).json({ message: 'serverUrl is too long' })
  }

  if (!/^https:\/\//i.test(serverUrl)) {
    return res.status(400).json({
      message: 'Server URL must start with https://',
    })
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

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const enabledTools = Object.prototype.hasOwnProperty.call(body, 'enabledTools')
    ? normalizeEnabledToolsFromBody(body.enabledTools)
    : []

  if (!checkPlanPermission(team, 'personal', 'mcpServers').allowed) {
    return res.status(403).json({
      message:
        'Remote MCP connectors are only available on the Personal plan or higher.',
    })
  }

  let input = `Remote connector URL (HTTPS):\n${serverUrl}\n\nGenerate serverLabel (service name only, no “mcp” in the label) and serverDescription (must start with “Use”, no product name in the description, outcomes and uses only).`
  if (enabledTools.length > 0) {
    input += `\n\n## Enabled tools\n\nThe administrator enabled these tools on this connector (use as context for serverDescription):\n${enabledTools
      .map((t) =>
        t.description ? `- ${t.name}: ${t.description}` : `- ${t.name}`,
      )
      .join('\n')}`
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-5.4-mini',
      instructions: SYSTEM_PROMPT,
      input,
      tools: [
        {
          type: 'web_search',
          search_context_size: 'low',
        },
      ],
      reasoning: {
        effort: 'low',
      },
      store: true,
      text: {
        format: {
          type: 'json_schema',
          name: 'mcp_server_draft',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              serverLabel: {
                type: 'string',
                description:
                  '3–64 chars, letters/digits/underscore/hyphen only. Descriptive name of the connected service or product; must not contain the substring mcp.',
                pattern: MCP_LABEL_PATTERN.source,
                minLength: 3,
                maxLength: 64,
              },
              serverDescription: {
                type: 'string',
                description:
                  'Must start with Use. No product or vendor names; outcomes and use cases only. No URLs or markdown.',
                minLength: 10,
                maxLength: 2000,
              },
            },
            required: ['serverLabel', 'serverDescription'],
            additionalProperties: false,
          },
        },
      },
    })

    const responseData = JSON.parse(response.output_text || '{}')

    const description = stripLinksAndUrlsFromDescription(
      typeof responseData?.serverDescription === 'string'
        ? responseData.serverDescription.trim()
        : '',
    )

    const serverLabel = normalizeMcpServerLabel(
      responseData?.serverLabel,
      serverUrl,
    )

    phTrack(
      userId,
      'MCP Server Draft Generated',
      { 'Bot name': bot.name, 'MCP URL': serverUrl, 'MCP Label': serverLabel, 'MCP Description': description },
      team.id,
    )

    return res.status(200).json({
      serverLabel,
      serverDescription: description,
    })
  } catch (error) {
    console.error('Error generating MCP server draft:', error)
    return res.status(500).json({
      message: 'Error generating MCP server metadata',
    })
  }
}
