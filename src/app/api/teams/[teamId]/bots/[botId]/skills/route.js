import { NextResponse } from 'next/server'
import OpenAI from 'openai'

import { getAuthorizedBotContext } from '@/lib/appRouteAuth'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { checkPlanPermission } from '@/utils/helpers'
import {
  HERO_ICON_ENUM,
  normalizeWhitelistedHeroIcon,
} from '@/constants/heroIcons.constants'
import {
  SKILL_AUDIENCE_CUSTOMER,
  SKILL_AUDIENCE_INTERNAL,
  allocateUniqueSkillName,
  createSkillMarkdownTemplate,
  ensureSkillDraft,
  listSkillDrafts,
  listSkillDraftSummaries,
  normalizeSkillName,
  skillRecordWithDecryptedSecretBindings,
  updateSkillDraft,
  upsertSkillFile,
} from '@/lib/skills-builder'

export const dynamic = 'force-dynamic'

const MODEL = 'gpt-5.4'
const SKILLS_BUILDER_MESSAGE_MAX_LENGTH = 50000

const SKILL_NAME_SLUG_PATTERN = '^[a-z0-9]+(-[a-z0-9]+)*$'
const SKILL_NAME_SLUG_REGEX = new RegExp(SKILL_NAME_SLUG_PATTERN)

const NAME_MIN_LENGTH = 3
const NAME_MAX_LENGTH = 64
const DESCRIPTION_MIN_LENGTH = 1
const DESCRIPTION_MAX_LENGTH = 1024

const SYSTEM_PROMPT = `You create the initial dashboard name, stable slug, YAML frontmatter \`description\`, and icon for a DocsBot skill. A skill is a bundle the agent may load: markdown instructions, optionally plus TypeScript under \`scripts/\` for APIs, actions, or sandbox files.

## Field: \`name\` (required)

Output a short, user-friendly display name for the dashboard and search. It may contain spaces and normal title casing.

**Constraints:**
- Length **3–64** characters.
- Plain text only; no markdown, no line breaks.
- Specific and memorable, e.g. “PDF Processing”, “Customer Refunds”, “CRM Lead Lookup”.

## Field: \`slug\` (required)

Output the \`slug\` value as a **single slug string** the platform stores as the immutable skill identifier and package path.

**Constraints (must all hold):**
- Length **3–64** characters.
- **Only** Unicode lowercase letters \`a-z\`, digits \`0-9\`, and hyphens \`-\` (no spaces, underscores, slashes, or uppercase).
- **Must not** start or end with a hyphen.
- **Must not** contain consecutive hyphens (\`--\`).

**Valid examples:** \`pdf-processing\`, \`data-analysis\`, \`code-review\`

**Invalid examples:** \`PDF-Processing\` (uppercase), \`-pdf\` (leading hyphen), \`pdf--processing\` (consecutive hyphens), \`my_skill\` (underscore).

Choose a slug derived from the display name or user intent that is **specific and memorable**—not generic labels like \`helper\` or \`misc-tools\`.

## Field: \`description\` (required)

**Constraints:**
- Length **1–1024** characters, non-empty.
- **Plain text** for YAML (no markdown, no line breaks in the string you return, no surrounding quotes in the content).

**Content:** Describe **both** (1) **what** the skill does and (2) **when** to use it. Include **specific keywords** that help agents match user tasks (domains, formats, APIs, workflows users might name or imply).

**Triggering (critical):** At startup, agents only see each skill’s \`name\` and \`description\` to decide whether to load the full SKILL.md. The description must carry the full burden of **when** this skill is relevant. Under-specified → skill won’t load when it should; over-broad → loads when it shouldn’t.

**Style (follow these):**
- **Imperative / directive:** Tell the agent when to act—e.g. start with “Use this skill when…” rather than only “This skill does…”.
- **User intent, not implementation:** What the user is trying to achieve; not internal code layout.
- **Be explicit about scope:** List contexts where it applies, including cases where the user doesn’t name the domain directly (e.g. “even if they don’t explicitly mention CSV”).
- **Concise:** A few sentences or a short paragraph—enough coverage, within 1024 characters, without fluff.

**Good example:** “Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.”

**Poor example:** “Helps with PDFs.”

## Field: \`icon\` (required)

Pick **one** Heroicon name from the fixed enum returned by the schema. The icon is used in the dashboard and widget list when the skill does not yet have a network/API hostname; choose the single best match for the skill’s purpose (e.g. document work → \`DocumentTextIcon\`, shipping → \`TruckIcon\`, security → \`ShieldCheckIcon\`).

## Nuance
Agents often reach for skills when the task needs **specialized** knowledge or workflows—not every trivial one-liner. Still write the description so matching tasks clearly qualify.

## Web search (when helpful)
You can use **web search** tool for quick research when it improves the \`name\` slug or \`description\`—for example: unfamiliar products, APIs, libraries, vendor names, acronyms, or domain terminology the user mentions. Use it **sparingly**: only when a short lookup would materially improve accuracy or triggering keywords. If the request is already clear, skip search and answer from context.

## Output
Return only JSON matching the schema (including \`name\`, \`slug\`, and \`icon\`). Infer details conservatively from the user message, any images, and any brief research you performed.`

function buildResponsesInput(prompt, images, audienceHint) {
  const text = String(prompt || '').trim()
  const audienceLine = `Audience context for routing and tone: ${audienceHint}. Apply this when scoping the description (e.g. internal-only workflows vs customer-safe language).`

  const bodyText = text
    ? `${audienceLine}\n\nUser request:\n${text}`
    : `${audienceLine}\n\nThe user only attached image(s). Infer what skill they want from the visuals and name it accordingly.`

  const content = [{ type: 'input_text', text: bodyText }]

  for (const img of images.slice(0, 4)) {
    const url = img?.url
    if (typeof url === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(url)) {
      content.push({
        type: 'input_image',
        image_url: url,
        detail: 'auto',
      })
    }
  }

  return [
    {
      type: 'message',
      role: 'user',
      content,
    },
  ]
}

const SKILL_METADATA_JSON_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description:
        'Dashboard display name: friendly plain-text label, 3–64 chars, spaces and title casing allowed.',
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
    },
    slug: {
      type: 'string',
      description:
        'Stable skill identifier slug: 3–64 chars; only a-z, 0-9, hyphens; no leading/trailing hyphen; no consecutive hyphens.',
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
      pattern: SKILL_NAME_SLUG_PATTERN,
    },
    description: {
      type: 'string',
      description:
        'SKILL.md `description`: 1–1024 chars; what the skill does, when to use it, and keywords for triggering. Imperative “use when…” style; plain text, no markdown.',
      minLength: DESCRIPTION_MIN_LENGTH,
      maxLength: DESCRIPTION_MAX_LENGTH,
    },
    icon: {
      type: 'string',
      description:
        'Single best Heroicon name for dashboard/widget lists (fallback when no API hostname is configured).',
      enum: HERO_ICON_ENUM,
    },
  },
  required: ['name', 'slug', 'description', 'icon'],
  additionalProperties: false,
}

function hasMissingEnvBindingValues(record) {
  const bindings = record?.envBindings || record?.manifest?.envBindings
  return (
    Array.isArray(bindings) &&
    bindings.some(
      (binding) =>
        typeof binding?.value !== 'string' || binding.value.trim().length === 0,
    )
  )
}

function hasMissingSecretBindingValues(record) {
  const bindings = record?.secretBindings || record?.manifest?.secretBindings
  return (
    Array.isArray(bindings) &&
    bindings.some(
      (binding) =>
        typeof binding?.secret !== 'string' || binding.secret.trim().length === 0,
    )
  )
}

export async function GET(request, context) {
  try {
    const params = await context.params
    const { team, bot, firestore } = await getAuthorizedBotContext(request, params)
    const drafts = await listSkillDraftSummaries(team.id, bot.id, firestore)

    return NextResponse.json({
      skills: drafts.map((draft) => ({
        id: draft.id,
        draftId: draft.draftId,
        skillName: draft.skillName,
        name: draft.name,
        displayName: draft.displayName,
        description: draft.description,
        internal: draft.internal,
        enabled: draft.enabled,
        enabledWidget: draft.enabledWidget,
        mode: draft.mode,
        hasFunctions: draft.hasFunctions,
        updatedAt: draft.updatedAt,
        publishedAt: draft.publishedAt,
        icon: draft.icon,
        networkPolicy: draft.networkPolicy,
        envBindings: draft.envBindings,
        authProviders: draft.authProviders,
        hasMissingEnvBindings: hasMissingEnvBindingValues(draft),
        hasMissingSecretBindings: hasMissingSecretBindingValues(draft),
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || 'Failed to load skills.' },
      { status: error?.status || 500 },
    )
  }
}

/** POST: create a skill draft using the LLM (prompt and/or images). */
export async function POST(request, context) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: 'OPENAI_API_KEY is not configured for the skills builder.' },
        { status: 500 },
      )
    }

    const routeParams = await context.params
    const { team, bot, userId, firestore } = await getAuthorizedBotContext(request, routeParams)

    if (!canUserManageBotSettings(team, userId, bot)) {
      return NextResponse.json(
        { message: 'You are not allowed to manage bot skills.' },
        { status: 403 },
      )
    }

    if (!checkPlanPermission(team, 'standard').allowed) {
      return NextResponse.json(
        { message: 'DocsBot skills require the Standard plan or higher.' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const prompt = typeof body?.prompt === 'string' ? body.prompt : ''
    const images = Array.isArray(body?.images) ? body.images : []
    const audienceRaw = body?.audience
    const audienceHint =
      audienceRaw === 'internal' || body?.internal === true
        ? 'internal (operators only)'
        : 'customer-facing'

    if (!prompt.trim() && images.length === 0) {
      return NextResponse.json(
        { message: 'Enter a description or attach at least one image.' },
        { status: 400 },
      )
    }

    if (prompt.length > SKILLS_BUILDER_MESSAGE_MAX_LENGTH) {
      return NextResponse.json({ message: 'Description is too long.' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const input = buildResponsesInput(prompt, images, audienceHint)

    const response = await openai.responses.create({
      model: MODEL,
      store: true,
      instructions: SYSTEM_PROMPT,
      input,
      reasoning: { effort: 'medium' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      max_output_tokens: 3200,
      text: {
        format: {
          type: 'json_schema',
          name: 'skill_metadata_suggestion',
          description: 'Skill slug phrase and SKILL.md YAML description line for agent routing.',
          strict: true,
          schema: SKILL_METADATA_JSON_SCHEMA,
        },
      },
    })

    if (response.error) {
      return NextResponse.json(
        { message: response.error.message || 'The model could not generate skill metadata.' },
        { status: 502 },
      )
    }

    const raw = response.output_text?.trim()
    if (!raw) {
      return NextResponse.json(
        { message: 'The model did not return skill metadata.' },
        { status: 502 },
      )
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { message: 'Invalid structured response from the model. Try again.' },
        { status: 502 },
      )
    }

    const displayName = typeof parsed.name === 'string' ? parsed.name.trim() : ''
    const slugRaw = typeof parsed.slug === 'string' ? parsed.slug.trim() : displayName
    const description =
      typeof parsed.description === 'string' ? parsed.description.trim() : ''
    const icon = normalizeWhitelistedHeroIcon(parsed.icon)

    if (!displayName || !description) {
      return NextResponse.json(
        { message: 'The model returned an incomplete name or description.' },
        { status: 502 },
      )
    }

    if (displayName.length < NAME_MIN_LENGTH || displayName.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          message: `Generated skill name must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`,
        },
        { status: 502 },
      )
    }

    if (
      description.length < DESCRIPTION_MIN_LENGTH ||
      description.length > DESCRIPTION_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          message: `Generated description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`,
        },
        { status: 502 },
      )
    }

    const skillName = normalizeSkillName(slugRaw)
    if (!skillName || skillName === 'new-skill') {
      return NextResponse.json(
        { message: 'Could not derive a valid skill name. Try a clearer description.' },
        { status: 502 },
      )
    }

    if (
      skillName.length < NAME_MIN_LENGTH ||
      skillName.length > NAME_MAX_LENGTH ||
      !SKILL_NAME_SLUG_REGEX.test(skillName)
    ) {
      return NextResponse.json(
        {
          message: `Generated skill name must be a valid slug (a-z, 0-9, hyphens; no leading/trailing or consecutive hyphens; ${NAME_MIN_LENGTH}-${NAME_MAX_LENGTH} characters).`,
        },
        { status: 502 },
      )
    }

    const audience =
      audienceRaw === 'internal' || body?.internal === true
        ? SKILL_AUDIENCE_INTERNAL
        : SKILL_AUDIENCE_CUSTOMER

    const uniqueSkillName = await allocateUniqueSkillName(team.id, bot.id, skillName, firestore)

    let draft = await ensureSkillDraft({
      firestore,
      teamId: team.id,
      botId: bot.id,
      skillName: uniqueSkillName,
      displayName,
      audience,
    })

    const skillMd = createSkillMarkdownTemplate(uniqueSkillName, audience, draft.mode, {
      description,
    })
    const nextFiles = upsertSkillFile(draft.files, {
      path: 'SKILL.md',
      content: skillMd,
    })

    draft = await updateSkillDraft(
      team.id,
      bot.id,
      uniqueSkillName,
      {
        manifest: { displayName, description, icon },
        files: nextFiles,
        audience,
      },
      firestore,
    )

    return NextResponse.json(
      { skill: skillRecordWithDecryptedSecretBindings(draft) },
      { status: 201 },
    )
  } catch (error) {
    console.error('skills POST (create):', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to create skill.' },
      { status: error?.status || 500 },
    )
  }
}
