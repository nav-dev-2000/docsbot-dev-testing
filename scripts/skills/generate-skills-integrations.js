#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const TRUTO_INTEGRATIONS_URL = 'https://truto.one/integrations'
const TRUTO_ORIGIN = 'https://truto.one'
const BRANDDEV_RETRIEVE_URL = 'https://api.brand.dev/v1/brand/retrieve'
const BRANDDEV_RETRIEVE_BY_NAME_URL = 'https://api.brand.dev/v1/brand/retrieve-by-name'
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'src/data/skills')
const DEFAULT_MODEL = 'gpt-5.4'
const DEFAULT_CONCURRENCY = 10

const SKILL_CATEGORIES = [
  'Default',
  'Accounting & Finance',
  'Analytics & BI',
  'Application Development',
  'Automation',
  'Cloud Storage',
  'Communications',
  'Customer Support',
  'Data Management',
  'E-Commerce',
  'Education & Training',
  'Email',
  'Events & Scheduling',
  'HR & Recruiting',
  'Identity & Access',
  'Incident Management',
  'Knowledge Management',
  'Legal & Compliance',
  'Marketing',
  'Payments & Billing',
  'Productivity',
  'Project Management',
  'Sales',
  'Security & Verification',
  'Subscriptions',
  'Surveys & Feedback',
  'Voice & Video',
]

const TRUTO_CATEGORY_TO_SKILL_CATEGORY = {
  ATS: 'HR & Recruiting',
  Accounting: 'Accounting & Finance',
  Analytics: 'Analytics & BI',
  'Application Development': 'Application Development',
  'Background Verification': 'Security & Verification',
  'Business Intelligence': 'Analytics & BI',
  'CI/CD': 'Application Development',
  CRM: 'Sales',
  'Cloud Storage': 'Cloud Storage',
  'Conversational Intelligence': 'Communications',
  Default: 'Automation',
  'E-Commerce': 'E-Commerce',
  'E-Signature': 'Legal & Compliance',
  Email: 'Email',
  'Event Management': 'Events & Scheduling',
  HRIS: 'HR & Recruiting',
  Helpdesk: 'Customer Support',
  IM: 'Communications',
  'Incident Management': 'Incident Management',
  'Knowledge Management': 'Knowledge Management',
  'Marketing Automation': 'Marketing',
  'Payment Gateway': 'Payments & Billing',
  'Remote Support': 'Customer Support',
  SSO: 'Identity & Access',
  'Sales Enablement': 'Sales',
  'Sales Intelligence': 'Sales',
  Scheduling: 'Events & Scheduling',
  'Subscription Platform': 'Subscriptions',
  Survey: 'Surveys & Feedback',
  Ticketing: 'Project Management',
  'User Directory': 'Identity & Access',
  Video: 'Voice & Video',
  Voice: 'Voice & Video',
  WhatsApp: 'Communications',
}

const DOMAIN_OVERRIDES = {
  akoya: 'akoya.com',
  'avalara-avatax': 'avalara.com',
  blackline: 'blackline.com',
  brex: 'brex.com',
  brightpearl: 'brightpearl.com',
  clearbooks: 'clearbooks.co.uk',
  coupa: 'coupa.com',
  erpnext: 'erpnext.com',
  freeagent: 'freeagent.com',
  freshbooks: 'freshbooks.com',
  moneybird: 'moneybird.com',
  quickbooks: 'quickbooks.intuit.com',
  xero: 'xero.com',
  amplitude: 'amplitude.com',
  databricks: 'databricks.com',
  fullstory: 'fullstory.com',
  'google-analytics': 'analytics.google.com',
  metabase: 'metabase.com',
  mixpanel: 'mixpanel.com',
  posthog: 'posthog.com',
  adobe: 'adobe.com',
  browserstack: 'browserstack.com',
  cloudflare: 'cloudflare.com',
  datadog: 'datadoghq.com',
  heroku: 'heroku.com',
  miro: 'miro.com',
  sentry: 'sentry.io',
  supabase: 'supabase.com',
  twilio: 'twilio.com',
  zapier: 'zapier.com',
  greenhouse: 'greenhouse.com',
  lever: 'lever.co',
  workable: 'workable.com',
  box: 'box.com',
  docusign: 'docusign.com',
  dropbox: 'dropbox.com',
  'google-drive': 'drive.google.com',
  onedrive: 'onedrive.live.com',
  sharepoint: 'microsoft.com',
  anthropic: 'anthropic.com',
  openai: 'openai.com',
  activecampaign: 'activecampaign.com',
  attio: 'attio.com',
  brevo: 'brevo.com',
  close: 'close.com',
  freshsales: 'freshworks.com',
  hubspot: 'hubspot.com',
  keap: 'keap.com',
  pipedrive: 'pipedrive.com',
  'pivotal-tracker': 'pivotaltracker.com',
  salesforce: 'salesforce.com',
  'zendesk-sell': 'zendesk.com',
  'zoho-crm': 'zoho.com',
  canva: 'canva.com',
  figma: 'figma.com',
  google: 'google.com',
  'google-chat': 'chat.google.com',
  'microsoft-365': 'microsoft.com',
  notion: 'notion.so',
  redis: 'redis.io',
  snowflake: 'snowflake.com',
  vercel: 'vercel.com',
  webflow: 'webflow.com',
  wordpress: 'wordpress.org',
  bigcommerce: 'bigcommerce.com',
  shopify: 'shopify.com',
  woocommerce: 'woocommerce.com',
  affiliatewp: 'affiliatewp.com',
  'easy-digital-downloads': 'easydigitaldownloads.com',
  freemius: 'freemius.com',
  givewp: 'givewp.com',
  learndash: 'learndash.com',
  lifterlms: 'lifterlms.com',
  membermouse: 'membermouse.com',
  memberpress: 'memberpress.com',
  'paid-memberships-pro': 'paidmembershipspro.com',
  'restrict-content-pro': 'restrictcontentpro.com',
  sensei: 'senseilms.com',
  surecart: 'surecart.com',
  'the-events-calendar': 'theeventscalendar.com',
  'ultimate-member': 'ultimatemember.com',
  'wishlist-member': 'wishlistmember.com',
  gmail: 'gmail.com',
  mailchimp: 'mailchimp.com',
  sendgrid: 'sendgrid.com',
  eventbrite: 'eventbrite.com',
  desk365: 'desk365.io',
  freshchat: 'freshworks.com',
  freshdesk: 'freshdesk.com',
  front: 'front.com',
  gorgias: 'gorgias.com',
  'help-scout': 'helpscout.com',
  intercom: 'intercom.com',
  kustomer: 'kustomer.com',
  liveagent: 'liveagent.com',
  zendesk: 'zendesk.com',
  'zoho-desk': 'zoho.com',
  bamboohr: 'bamboohr.com',
  deel: 'deel.com',
  gusto: 'gusto.com',
  hibob: 'hibob.com',
  personio: 'personio.com',
  rippling: 'rippling.com',
  workday: 'workday.com',
  discord: 'discord.com',
  livechat: 'livechat.com',
  'microsoft-teams': 'microsoft.com',
  slack: 'slack.com',
  pagerduty: 'pagerduty.com',
  confluence: 'atlassian.com',
  discourse: 'discourse.org',
  'google-docs': 'docs.google.com',
  'google-sheets': 'sheets.google.com',
  klaviyo: 'klaviyo.com',
  segment: 'segment.com',
  adyen: 'adyen.com',
  braintree: 'braintreepayments.com',
  paypal: 'paypal.com',
  stripe: 'stripe.com',
  calendly: 'calendly.com',
  'google-calendar': 'calendar.google.com',
  'outlook-calendar': 'microsoft.com',
  auth0: 'auth0.com',
  okta: 'okta.com',
  chargebee: 'chargebee.com',
  paddle: 'paddle.com',
  typeform: 'typeform.com',
  airtable: 'airtable.com',
  asana: 'asana.com',
  'azure-devops': 'azure.microsoft.com',
  clickup: 'clickup.com',
  gitlab: 'gitlab.com',
  jira: 'atlassian.com',
  linear: 'linear.app',
  'monday-com': 'monday.com',
  servicenow: 'servicenow.com',
  trello: 'trello.com',
  truto: 'truto.one',
  wrike: 'wrike.com',
  'drift-video': 'drift.com',
  'gong-io': 'gong.io',
  zoom: 'zoom.us',
  aircall: 'aircall.io',
  dialpad: 'dialpad.com',
}

const INSTALLED_SKILL_OVERRIDES = new Set([
  'cal-com',
  'calendly',
  'freshdesk',
  'help-scout',
  'intercom',
  'slack',
  'stripe',
  'zendesk',
])

const EXCLUDED_INTEGRATION_SLUGS = new Set([
  'drift-video',
  'pivotal-tracker',
])

const MANUAL_INTEGRATIONS = [
  {
    slug: 'easy-digital-downloads',
    name: 'Easy Digital Downloads',
    trutoCategory: 'E-Commerce',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'freemius',
    name: 'Freemius',
    trutoCategory: 'E-Commerce',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'memberpress',
    name: 'MemberPress',
    trutoCategory: 'Subscription Platform',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'paid-memberships-pro',
    name: 'Paid Memberships Pro',
    trutoCategory: 'Subscription Platform',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'restrict-content-pro',
    name: 'Restrict Content Pro',
    trutoCategory: 'Subscription Platform',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'wishlist-member',
    name: 'WishList Member',
    trutoCategory: 'Subscription Platform',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'ultimate-member',
    name: 'Ultimate Member',
    trutoCategory: 'User Directory',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'surecart',
    name: 'SureCart',
    trutoCategory: 'E-Commerce',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'givewp',
    name: 'GiveWP',
    trutoCategory: 'Payment Gateway',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'learndash',
    name: 'LearnDash',
    trutoCategory: 'Default',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'lifterlms',
    name: 'LifterLMS',
    trutoCategory: 'Default',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'sensei',
    name: 'Sensei LMS',
    trutoCategory: 'Default',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'affiliatewp',
    name: 'AffiliateWP',
    trutoCategory: 'Marketing Automation',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'the-events-calendar',
    name: 'The Events Calendar',
    trutoCategory: 'Event Management',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
  {
    slug: 'gong-io',
    name: 'Gong',
    trutoCategory: 'Conversational Intelligence',
    trutoDetailUrl: '',
    trutoIconUrl: '',
    statusLabel: 'Buildable',
  },
]

const DOCSBOT_SKILL_BUILDER_CONTEXT = [
  'DocsBot Skill Builder lets a non-technical customer describe a new agent ability in plain language and have DocsBot create a reusable Skill package.',
  'The Skill Builder itself behaves like an AI agent for building agent abilities: it asks for missing context, suggests safer workflow designs, drafts the Skill, reviews it, tests it, improves it, and helps publish it to the right DocsBot agent.',
  'A DocsBot Skill can include routing instructions, runtime behavior guidance, reference material, and optional executable TypeScript functions for API calls, lookups, record updates, workflow triggers, summaries, generated artifacts, and other approved actions.',
  'Skills are validated, published, logged, and configured with environment values, secrets, metadata bindings, network policy, and approval boundaries so customers can control what the AI agent is allowed to do.',
  'Security is central to Skill Builder and is part of how it designs Skills by default. Skill Builder identifies the required configuration values, defines secure secret and authentication handling, keeps credentials out of chat transcripts and Skill source, proxies secrets through approved runtime configuration, and scopes access to the minimum users, actions, records, and systems required for the workflow.',
  'Skill Builder includes an automated testing agent. After a Skill is built, the testing agent can exercise imagined customer support and internal team scenarios, identify bugs, weak instructions, missing permission checks, or workflow gaps, then feed those findings into an automated self-improvement loop before deployment.',
  'When describing setup, avoid making the user sound technical. The user describes the outcome in plain language, and Skill Builder handles design, secure configuration, testing, improvement, and deployment details.',
  'For customer support, a published Skill is used by a DocsBot customer-facing chat widget on a website or product, or by a DocsBot agent connected to a helpdesk that replies to customer tickets. The listed service does not trigger the Skill; the customer conversation or ticket triggers the DocsBot agent, and the Skill lets that agent communicate with or act inside the listed service.',
  'For support pages, explain how the agent can use the listed service from that customer-facing context to look up information, create records, modify records, summarize state, prepare handoffs, or trigger approved workflows while responding to customers.',
  'For internal use cases, published Skills are used by AI agents available only to employees and teams through a private chat interface, Slack, or Microsoft Teams. Team members chat with the agent to perform actions across business services, improve information retrieval and research, and complete workflows or SOPs across their systems.',
  'DocsBot AI Actions are the broader product promise: an AI agent should answer, decide the next step, and take bounded action inside customer-defined rules instead of only explaining what a person should do next.',
  'These integration pages should help buyers imagine an AI agent that works with the named software to resolve support questions, perform safe lookups, gather missing context, update records, create handoffs, trigger workflows, and summarize outcomes.',
].join(' ')

const FAQ_GUIDANCE = [
  'FAQ strategy: write search-intent questions a buyer might type into Google or ask an AI search engine when looking for AI agents, customer support automation, internal AI assistants, or workflow automation that integrates with this software.',
  'Good FAQ topics include: using an AI agent with the software, customer support workflows, internal team/employee workflows, safe API actions, data lookups, handoffs/escalations, approval controls, setup expectations, and how the software can work with DocsBot Skills.',
  'Do not ask whether this exact Skill already exists in DocsBot. Do not write questions like "Is this a prebuilt skill?", "Does this skill exist?", "Can I install this skill?", or "Is there a one-click template?".',
  'Frame buildable entries around potential and creation: "How can I build an AI agent for [software]?", "Can an AI support agent use [software] data?", "What workflows can an internal AI assistant automate with [software]?", and similar.',
  'Answers should be confident but honest: describe what DocsBot Skill Builder can create and what the customer can configure, without claiming a live prebuilt integration unless availability is install.',
].join(' ')

function loadLocalEnv(files = ['.env.local', '.env']) {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file)
    if (!fs.existsSync(filePath)) return

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) return
      const [, key, rawValue] = match
      if (process.env[key] !== undefined) return
      process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '')
    })
  })
}

function decodeHtml(value = '') {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  }

  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, key) => named[key] || `&${key};`)
}

function stripTags(value = '') {
  return decodeHtml(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function slugify(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/@/g, ' at ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase()
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function absoluteTrutoUrl(href) {
  if (!href) return ''
  try {
    return new URL(href, TRUTO_ORIGIN).toString()
  } catch {
    return ''
  }
}

function parseTrutoIntegrations(html) {
  const records = []
  const cardRegex =
    /<a\s+href="([^"]+)"\s+class="integration-card"[^>]*data-category="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g

  let match
  while ((match = cardRegex.exec(html))) {
    const [, href, rawCategory, body] = match
    const labelMatch = body.match(/<span\s+class="integration-card-label">([\s\S]*?)<\/span>/)
    const iconMatch = body.match(/<img[^>]+src="([^"]+)"/)
    const badgeMatches = [...body.matchAll(/<span\s+class="integration-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/g)]

    const name = stripTags(labelMatch?.[1] || '')
    if (!name) continue

    const trutoCategory = decodeHtml(rawCategory).trim()
    const statusLabels = badgeMatches.map((badge) => stripTags(badge[1])).filter(Boolean)
    const slug = slugify(name)

    records.push({
      slug,
      name,
      trutoCategory,
      trutoDetailUrl: absoluteTrutoUrl(href),
      trutoIconUrl: iconMatch ? decodeHtml(iconMatch[1]).trim() : '',
      statusLabel: statusLabels.length ? statusLabels.join(', ') : 'Available',
    })
  }

  return uniqueBy(records, (record) => record.slug)
}

function mergeManualIntegrations(records, manualIntegrations = MANUAL_INTEGRATIONS) {
  return uniqueBy([...records, ...manualIntegrations], (record) => record.slug).filter(
    (record) => !EXCLUDED_INTEGRATION_SLUGS.has(record.slug),
  )
}

function mapTrutoCategoryToSkillCategory(trutoCategory) {
  return TRUTO_CATEGORY_TO_SKILL_CATEGORY[trutoCategory] || 'Automation'
}

function normalizeDomain(value = '') {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''

  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return raw
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim()
  }
}

function resolveDomain(record, overrides = DOMAIN_OVERRIDES) {
  const override = overrides[record.slug]
  if (override) return normalizeDomain(override)

  const cleaned = record.slug
    .replace(/-scim$/, '')
    .replace(/-beta$/, '')
    .replace(/-partner$/, '')
    .replace(/-business$/, '')
    .replace(/-personal$/, '')

  if (overrides[cleaned]) return normalizeDomain(overrides[cleaned])

  return normalizeDomain(`${cleaned}.com`)
}

const LOGO_MODES = new Set(['light', 'dark', 'has_opaque_background'])

function normalizeLogoVariant(logo) {
  if (!logo?.url) return null

  return {
    url: logo.url,
    type: logo.type === 'icon' ? 'icon' : 'logo',
    mode: LOGO_MODES.has(logo.mode) ? logo.mode : 'unknown',
    width: logo.resolution?.width || logo.width || null,
    height: logo.resolution?.height || logo.height || null,
    aspectRatio: logo.resolution?.aspect_ratio || logo.aspectRatio || null,
  }
}

function scoreLogoForLightSurface(logo) {
  let score = 0

  if (logo.type === 'logo') score += 100
  if (logo.type === 'icon') score += 10
  if (logo.mode === 'light') score += 40
  if (logo.mode === 'has_opaque_background') score += 28
  if (logo.mode === 'dark') score += 18
  if ((logo.aspectRatio || 0) > 1.5) score += 12
  if ((logo.aspectRatio || 0) > 3) score += 8

  return score
}

function scoreIconForLightSurface(logo) {
  let score = 0

  if (logo.type === 'icon') score += 100
  if (logo.type === 'logo') score += 10
  if (logo.mode === 'light') score += 40
  if (logo.mode === 'has_opaque_background') score += 28
  if (logo.mode === 'dark') score += 18
  if ((logo.aspectRatio || 0) >= 0.75 && (logo.aspectRatio || 0) <= 1.5) score += 14

  return score
}

function selectBrandLogoForLightSurface(brand = {}) {
  const variants = (brand.logoVariants || [])
    .map(normalizeLogoVariant)
    .filter(Boolean)
    .sort((a, b) => scoreLogoForLightSurface(b) - scoreLogoForLightSurface(a))

  return (
    variants[0] || {
      url: brand.logoUrl || brand.iconUrl || '',
      type: brand.logoUrl ? 'logo' : 'icon',
      mode: 'unknown',
      width: null,
      height: null,
      aspectRatio: null,
    }
  )
}

function selectBrandIconForLightSurface(brand = {}) {
  const variants = (brand.logoVariants || [])
    .map(normalizeLogoVariant)
    .filter(Boolean)
    .sort((a, b) => scoreIconForLightSurface(b) - scoreIconForLightSurface(a))

  return (
    variants[0] || {
      url: brand.iconUrl || brand.logoUrl || '',
      type: brand.iconUrl ? 'icon' : 'logo',
      mode: 'unknown',
      width: null,
      height: null,
      aspectRatio: null,
    }
  )
}

function selectBrandLogo(logos = [], preferredType = 'logo') {
  const pool = Array.isArray(logos) ? logos.map(normalizeLogoVariant).filter(Boolean) : []
  if (!pool.length) return ''

  const typed = pool.filter((logo) => logo.type === preferredType)
  const candidates = typed.length ? typed : pool
  return selectBrandLogoForLightSurface({ logoVariants: candidates }).url
}

function normalizeBrandForPage(brand) {
  if (!brand || brand.isError) {
    return {
      cacheStatus: brand?.isError ? 'error' : 'missing',
      title: '',
      domain: '',
      description: '',
      slogan: '',
      logoUrl: '',
      iconUrl: '',
      primaryColor: '',
      accentColor: '',
      colors: [],
      backdropUrl: '',
      industries: [],
      links: {},
    }
  }

  const colors = Array.isArray(brand.colors)
    ? brand.colors
        .map((color) => ({
          hex: typeof color === 'string' ? color : color?.hex,
          name: typeof color === 'string' ? '' : color?.name || '',
        }))
        .filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color.hex || ''))
    : []
  const backdropUrl = Array.isArray(brand.backdrops)
    ? brand.backdrops.find((backdrop) => backdrop?.url)?.url || ''
    : ''
  const logoVariants = Array.isArray(brand.logos) ? brand.logos.map(normalizeLogoVariant).filter(Boolean) : []
  const preferredLogo = selectBrandLogoForLightSurface({
    logoUrl: selectBrandLogo(brand.logos, 'logo'),
    iconUrl: selectBrandLogo(brand.logos, 'icon'),
    logoVariants,
  })
  const preferredIcon = selectBrandIconForLightSurface({
    logoUrl: selectBrandLogo(brand.logos, 'logo'),
    iconUrl: selectBrandLogo(brand.logos, 'icon'),
    logoVariants,
  })

  return {
    cacheStatus: 'ok',
    title: brand.title || '',
    domain: normalizeDomain(brand.domain || ''),
    description: brand.description || '',
    slogan: brand.slogan || '',
    logoUrl: preferredLogo.type === 'logo' ? preferredLogo.url : selectBrandLogo(brand.logos, 'logo'),
    iconUrl: selectBrandLogo(brand.logos, 'icon'),
    logoVariants,
    preferredLogo,
    preferredIcon,
    primaryColor: colors[0]?.hex || '',
    accentColor: colors[1]?.hex || colors[0]?.hex || '',
    colors,
    backdropUrl,
    industries: Array.isArray(brand.industries) ? brand.industries : [],
    links: brand.links && typeof brand.links === 'object' ? brand.links : {},
  }
}

function defaultGeneratedMetadata(record, brand = null) {
  const category = mapTrutoCategoryToSkillCategory(record.trutoCategory)
  const brandDescription = brand?.description || ''
  const serviceContext = brandDescription
    ? ` ${record.name} is ${brandDescription.replace(/\.$/, '')}.`
    : ''

  return {
    h1: `${record.name} AI Agent Skill`,
    metaTitle: `${record.name} AI Agent Skill | DocsBot Skills`,
    metaDescription: `Build or install a DocsBot Skill that helps your AI agent work with ${record.name} for customer support, internal workflows, lookups, updates, and approved actions.`,
    intro: `Create a DocsBot Skill for ${record.name} so your AI agent can follow the right process, collect the right context, and take approved action when a conversation needs more than an answer.${serviceContext}`,
    supportUseCases: [
      `Look up ${record.name} records while helping customers with account, billing, order, or support questions.`,
      `Collect missing details from the customer before creating or updating a ${record.name} workflow.`,
      `Summarize the outcome in plain language and hand off to a human when the request needs approval.`,
    ],
    internalUseCases: [
      `Help internal teams search ${record.name} data without switching tools.`,
      `Create repeatable operating procedures for ${record.name} updates, reporting, and follow-up tasks.`,
      `Generate concise summaries, checklists, or artifacts from ${record.name} workflow data.`,
    ],
    whatYouCanBuild: [
      `${record.name} lookup and status-check actions`,
      `${record.name} record creation or update workflows`,
      `${record.name} support triage and escalation helpers`,
      `${record.name} reporting or summary generators`,
    ],
      howItWorks: [
      {
        title: `Choose the ${record.name} workflow`,
        description:
          'Tell Skill Builder what the customer-facing or internal agent should do, what information it should collect first, and which outcomes need approval.',
      },
      {
        title: 'Let Skill Builder draft it',
        description:
          'Skill Builder drafts the instructions, references, and executable functions, then suggests safer ways to handle edge cases and missing context.',
      },
      {
        title: 'Connect it securely',
        description:
          'Skill Builder defines the required configuration, protects secrets and authentication, proxies credentials safely, and scopes access so sensitive values stay out of chat and Skill files.',
      },
      {
        title: 'Test and deploy',
        description:
          'Skill Builder uses its automated testing agent to run realistic scenarios, find bugs or improvements, refine the Skill, and publish it to the right DocsBot agent.',
      },
    ],
    faq: [
      {
        question: `Can DocsBot build a ${record.name} Skill?`,
        answer: `Yes. DocsBot Skill Builder can create a ${record.name} Skill that gives your AI agent structured instructions and, when needed, executable actions for approved ${record.name} workflows.`,
      },
      {
        question: `What can a ${record.name} Skill do?`,
        answer: `A ${record.name} Skill can help an agent look up context, collect required fields, trigger approved workflows, create summaries, and route exceptions to a human team.`,
      },
      {
        question: `Do I need a developer to use a ${record.name} Skill?`,
        answer:
          'The Skill Builder is prompt-driven, but API credentials, account identifiers, or approval rules may still need an administrator to configure them safely.',
      },
      {
        question: `How can I build an AI agent that works with ${record.name}?`,
        answer:
          `Use DocsBot Skill Builder to describe the ${record.name} workflow, define the information the agent should collect, configure safe actions, validate the Skill, and publish it for customer support or internal team use.`,
      },
    ],
    category,
  }
}

function buildIntegrationRecord(record, options = {}) {
  const normalizedBrand = normalizeBrandForPage(options.brand)
  const generated = options.generated || defaultGeneratedMetadata(record, normalizedBrand)
  const category = generated.category || mapTrutoCategoryToSkillCategory(record.trutoCategory)
  const availability = INSTALLED_SKILL_OVERRIDES.has(record.slug) ? 'install' : 'build'

  return {
    slug: record.slug,
    name: record.name,
    domain: options.domain || normalizedBrand.domain || '',
    category,
    trutoCategory: record.trutoCategory,
    availability,
    statusLabel: record.statusLabel || 'Available',
    h1: generated.h1,
    metaTitle: generated.metaTitle,
    metaDescription: generated.metaDescription,
    intro: generated.intro,
    supportUseCases: generated.supportUseCases || [],
    internalUseCases: generated.internalUseCases || [],
    whatYouCanBuild: generated.whatYouCanBuild || [],
    howItWorks: generated.howItWorks || [],
    faq: generated.faq || [],
    relatedSlugs: generated.relatedSlugs || [],
    brand: normalizedBrand,
  }
}

function validateIntegrationRecord(record) {
  const errors = []
  const requiredStrings = [
    'slug',
    'name',
    'category',
    'trutoCategory',
    'availability',
    'statusLabel',
    'h1',
    'metaTitle',
    'metaDescription',
    'intro',
  ]

  requiredStrings.forEach((field) => {
    if (!record[field] || typeof record[field] !== 'string') {
      errors.push(`${field} is required`)
    }
  })

  if (!SKILL_CATEGORIES.includes(record.category)) {
    errors.push(`category must be one of the DocsBot skill categories`)
  }
  if (!['install', 'build'].includes(record.availability)) {
    errors.push('availability must be install or build')
  }

  ;['supportUseCases', 'internalUseCases', 'whatYouCanBuild', 'howItWorks', 'faq', 'relatedSlugs'].forEach(
    (field) => {
      if (!Array.isArray(record[field])) errors.push(`${field} must be an array`)
    },
  )

  if (!record.faq?.length) errors.push('faq must include at least one item')
  if (!record.howItWorks?.length) errors.push('howItWorks must include at least one item')
  if (!record.brand || typeof record.brand !== 'object') errors.push('brand object is required')
  errors.push(...validateGeneratedCopyQuality(record))
  errors.push(...validateFaqSearchIntent(record.faq || []))

  return {
    valid: errors.length === 0,
    errors,
  }
}

function collectStrings(value, prefix = '') {
  if (typeof value === 'string') return [{ path: prefix, value }]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${prefix}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectStrings(item, prefix ? `${prefix}.${key}` : key),
    )
  }
  return []
}

function cleanGeneratedCopyValue(value) {
  if (typeof value === 'string') {
    return value.trim().replace(/\s+([,.!?;:])/g, '$1').replace(/[,{;:]\s*$/g, '.')
  }
  if (Array.isArray(value)) return value.map(cleanGeneratedCopyValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanGeneratedCopyValue(item)]),
    )
  }
  return value
}

function cleanGeneratedMetadata(metadata) {
  return cleanGeneratedCopyValue(metadata)
}

function validateGeneratedCopyQuality(record) {
  const errors = []
  const fieldsToScan = {
    h1: record.h1,
    metaTitle: record.metaTitle,
    metaDescription: record.metaDescription,
    intro: record.intro,
    supportUseCases: record.supportUseCases,
    internalUseCases: record.internalUseCases,
    whatYouCanBuild: record.whatYouCanBuild,
    howItWorks: record.howItWorks,
    faq: record.faq,
  }

  collectStrings(fieldsToScan).forEach(({ path: stringPath, value }) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (
      /\\[nrta]/.test(trimmed) ||
      trimmed.includes('","') ||
      trimmed.includes('", "') ||
      /['"]\s*,\s*['"]/.test(trimmed) ||
      /[\]}]\s*,\s*['"]?\w+['"]?\s*:/.test(trimmed) ||
      /['"]\s*]\s*,/.test(trimmed) ||
      /['"]\s*}\s*,/.test(trimmed)
    ) {
      errors.push(`${stringPath} contains escaped or embedded JSON fragments`)
    }
    if (/[,{;:]$/.test(trimmed)) {
      errors.push(`${stringPath} ends with dangling punctuation`)
    }
    if (/\b\w{28,}\b/.test(trimmed)) {
      errors.push(`${stringPath} contains a suspiciously long token`)
    }
  })

  return errors
}

function validateFaqSearchIntent(faq = []) {
  const errors = []
  const bannedQuestionPattern =
    /\b(prebuilt|pre-built|one[- ]click|already exist|currently exist|does .*exist|is there .*skill|installable|can i install)\b/i

  faq.forEach((item, index) => {
    const question = String(item?.question || '')
    if (bannedQuestionPattern.test(question)) {
      errors.push(`faq[${index}].question asks about product availability instead of search intent`)
    }
  })

  return errors
}

function isUsableBrand(brand) {
  return Boolean(brand && typeof brand === 'object' && !brand.isError)
}

function isTransientBrandError(brand) {
  const status = brand?.status ?? brand?.code
  return status === 0 || status === 429 || String(status) === '429' || brand?.transient === true
}

function shouldFallbackBrandLookupByName(error) {
  if (!error || isTransientBrandError(error)) return false
  const status = error.status ?? error.code
  const message = String(error.message || '').toLowerCase()
  return (
    status === 400 ||
    status === 404 ||
    String(status) === '400' ||
    String(status) === '404' ||
    message.includes('dns') ||
    message.includes('brand not found') ||
    message.includes('brand lookup failed') ||
    message.includes('branding not present')
  )
}

function shouldFetchBrandCacheEntry(entry, refreshBrandCache = false) {
  if (refreshBrandCache) return true
  if (isTransientBrandError(entry?.brand)) return true
  if (shouldFallbackBrandLookupByName(entry?.brand) && entry?.lookupMethod !== 'domain_then_name') {
    return true
  }
  return !entry?.brand
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    limit: null,
    offset: 0,
    sample: '',
    concurrency: DEFAULT_CONCURRENCY,
    only: [],
    refreshBrandCache: false,
    skipBrand: false,
    skipAi: false,
    outDir: DEFAULT_OUT_DIR,
    model: DEFAULT_MODEL,
    categoryPseo: false,
    categoryPseoPrint: false,
    categoryPseoOnly: '',
    categoryPseoOutput: '',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]
    const readValue = () => {
      if (arg.includes('=')) return arg.split('=').slice(1).join('=')
      i += 1
      return next
    }

    if (arg === '--refresh-brand-cache') args.refreshBrandCache = true
    else if (arg === '--skip-brand') args.skipBrand = true
    else if (arg === '--skip-ai') args.skipAi = true
    else if (arg.startsWith('--limit')) args.limit = Number(readValue())
    else if (arg.startsWith('--concurrency')) {
      args.concurrency = Math.max(1, Number(readValue()) || DEFAULT_CONCURRENCY)
    }
    else if (arg.startsWith('--offset')) args.offset = Number(readValue()) || 0
    else if (arg.startsWith('--sample')) args.sample = readValue() || ''
    else if (arg.startsWith('--only')) {
      args.only = String(readValue() || '')
        .split(',')
        .map((value) => slugify(value))
        .filter(Boolean)
    } else if (arg.startsWith('--out-dir')) {
      args.outDir = path.resolve(readValue())
    } else if (arg.startsWith('--model')) {
      args.model = readValue() || DEFAULT_MODEL
    } else if (arg === '--category-pseo') {
      args.categoryPseo = true
    } else if (arg === '--category-pseo-print') {
      args.categoryPseoPrint = true
    } else if (arg.startsWith('--category-pseo-only')) {
      args.categoryPseoOnly = readValue() || ''
    } else if (arg.startsWith('--category-pseo-output')) {
      args.categoryPseoOutput = path.resolve(readValue() || '')
    }
  }

  return args
}

function selectRecords(records, args) {
  let selected = records

  if (args.only?.length) {
    const only = new Set(args.only)
    selected = selected.filter((record) => only.has(record.slug))
  } else if (args.sample === 'mixed') {
    const preferred = [
      ['zendesk', 'help-scout', 'intercom', 'freshdesk'],
      ['slack', 'asana', 'jira', 'notion'],
      ['moneybird', 'clearbooks', 'aircall', 'canny'],
    ]
    const picked = []
    preferred.forEach((group) => {
      const hit = group.map((slug) => records.find((record) => record.slug === slug)).find(Boolean)
      if (hit) picked.push(hit)
    })
    selected = picked.length ? picked : records
  } else if (args.offset) {
    selected = selected.slice(args.offset)
  }

  if (Number.isFinite(args.limit) && args.limit > 0) {
    selected = selected.slice(0, args.limit)
  }

  return selected
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function readJsonFileStrict(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readReusableIntegrationRecord(filePath, expectedSlug) {
  if (!fs.existsSync(filePath)) return null

  try {
    const record = readJsonFileStrict(filePath)
    if (record?.slug !== expectedSlug) return null
    if (!record.brand || record.brand.cacheStatus !== 'ok') return null
    const validation = validateIntegrationRecord(record)
    return validation.valid ? record : null
  } catch {
    return null
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(data, null, 2)}\n`)
  fs.renameSync(`${filePath}.tmp`, filePath)
}

function removeJsonFilesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return
  fs.readdirSync(dirPath)
    .filter((file) => file.endsWith('.json'))
    .forEach((file) => fs.unlinkSync(path.join(dirPath, file)))
}

function buildIntegrationIndexRecord(record) {
  return {
    slug: record.slug,
    name: record.name,
    domain: record.domain,
    category: record.category,
    trutoCategory: record.trutoCategory,
    availability: record.availability,
    statusLabel: record.statusLabel,
    h1: record.h1,
    metaTitle: record.metaTitle,
    metaDescription: record.metaDescription,
    intro: record.intro,
    brand: {
      title: record.brand?.title || '',
      domain: record.brand?.domain || '',
      logoUrl: record.brand?.logoUrl || '',
      iconUrl: record.brand?.iconUrl || '',
      preferredLogo: record.brand?.preferredLogo || null,
      preferredIcon: record.brand?.preferredIcon || null,
      primaryColor: record.brand?.primaryColor || '',
      accentColor: record.brand?.accentColor || '',
      backdropUrl: record.brand?.backdropUrl || '',
      cacheStatus: record.brand?.cacheStatus || 'missing',
    },
  }
}

function writeSplitIntegrationData({ outDir, records, sourceUrl, generatedAt, clean = true }) {
  const integrationsDir = path.join(outDir, 'integrations')
  if (clean) removeJsonFilesInDir(integrationsDir)

  const recordsBySlug = new Map()
  if (!clean && fs.existsSync(integrationsDir)) {
    fs.readdirSync(integrationsDir)
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const existingRecord = readJsonFile(path.join(integrationsDir, file), null)
        if (existingRecord?.slug) recordsBySlug.set(existingRecord.slug, existingRecord)
      })
  }

  records.forEach((record) => {
    recordsBySlug.set(record.slug, record)
    writeJsonFile(path.join(integrationsDir, `${record.slug}.json`), record)
  })

  const indexRecords = [...recordsBySlug.values()]
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    .map(buildIntegrationIndexRecord)

  const indexPath = path.join(outDir, 'integrations.index.json')
  writeJsonFile(indexPath, {
    generatedAt,
    sourceUrl,
    count: indexRecords.length,
    records: indexRecords,
  })

  return {
    indexPath,
    integrationsDir,
  }
}

function validateWrittenIntegrationData({ indexPath, integrationsDir }) {
  const errors = []
  let index = null

  try {
    index = readJsonFileStrict(indexPath)
  } catch (error) {
    errors.push(`index JSON could not be parsed: ${error.message}`)
  }

  if (!index || !Array.isArray(index.records)) {
    errors.push('index JSON must include records array')
  }

  const files = fs.existsSync(integrationsDir)
    ? fs.readdirSync(integrationsDir).filter((file) => file.endsWith('.json'))
    : []
  if (!files.length) errors.push('integrations directory must include JSON files')

  files.forEach((file) => {
    const filePath = path.join(integrationsDir, file)
    let record = null
    try {
      record = readJsonFileStrict(filePath)
    } catch (error) {
      errors.push(`${file} could not be parsed: ${error.message}`)
      return
    }

    const validation = validateIntegrationRecord(record)
    if (!validation.valid) {
      errors.push(`${file} failed final validation: ${validation.errors.join(', ')}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

async function runWithConcurrency(items, concurrency, worker) {
  const limit = Math.max(1, Math.min(Number(concurrency) || DEFAULT_CONCURRENCY, items.length || 1))
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      await worker(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(
    Array.from({ length: limit }, () => runWorker()),
  )
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfterMs(value) {
  if (!value) return 0
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const dateMs = Date.parse(value)
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : 0
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DocsBot skills integration generator (+https://docsbot.ai)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

async function retrieveBrandByDomain(domain, apiKey) {
  if (!apiKey) {
    throw new Error('BRANDDEV_API_KEY is required unless --skip-brand is used')
  }

  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      const url = `${BRANDDEV_RETRIEVE_URL}?domain=${encodeURIComponent(domain)}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })
      let body = null
      try {
        body = await response.json()
      } catch {
        body = null
      }

      if (response.ok && body?.status === 'ok' && body.brand) {
        return { ok: true, brand: body.brand }
      }

      const status = body?.code || response.status
      if (status === 429 && attempt < 3) {
        const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after')) || 15000 * attempt
        console.warn(`brand.dev rate limited for ${domain}; retrying in ${Math.ceil(retryAfterMs / 1000)}s`)
        await sleep(retryAfterMs)
        continue
      }

      return {
        ok: false,
        error: {
          isError: true,
          status,
          transient: status === 429,
          message: body?.message || body?.error || 'Brand lookup failed',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    ok: false,
    error: {
      isError: true,
      status: 0,
      transient: true,
      message: lastError?.message || 'Brand lookup request failed',
      code: lastError?.name || 'BrandLookupError',
      timestamp: new Date().toISOString(),
    },
  }
}

function normalizeCompanyNameForBrandLookup(name) {
  return String(name || '')
    .replace(/\bSCIM\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30)
}

async function retrieveBrandByName(name, apiKey) {
  if (!apiKey) {
    throw new Error('BRANDDEV_API_KEY is required unless --skip-brand is used')
  }

  const companyName = normalizeCompanyNameForBrandLookup(name)
  if (companyName.length < 3) {
    return {
      ok: false,
      error: {
        isError: true,
        status: 422,
        message: 'Company name is too short for brand lookup',
        timestamp: new Date().toISOString(),
      },
    }
  }

  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      const url = `${BRANDDEV_RETRIEVE_BY_NAME_URL}?name=${encodeURIComponent(companyName)}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })
      let body = null
      try {
        body = await response.json()
      } catch {
        body = null
      }

      if (response.ok && body?.status === 'ok' && body.brand) {
        return { ok: true, brand: body.brand }
      }

      const status = body?.code || response.status
      if (status === 429 && attempt < 3) {
        const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after')) || 15000 * attempt
        console.warn(`brand.dev rate limited for ${companyName}; retrying in ${Math.ceil(retryAfterMs / 1000)}s`)
        await sleep(retryAfterMs)
        continue
      }

      return {
        ok: false,
        error: {
          isError: true,
          status,
          transient: status === 429,
          message: body?.message || body?.error || 'Brand lookup by name failed',
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    ok: false,
    error: {
      isError: true,
      status: 0,
      transient: true,
      message: lastError?.message || 'Brand lookup by name request failed',
      code: lastError?.name || 'BrandLookupError',
      timestamp: new Date().toISOString(),
    },
  }
}

async function retrieveBrandForRecord(record, domain, apiKey) {
  const domainResult = await retrieveBrandByDomain(domain, apiKey)
  if (domainResult.ok || !shouldFallbackBrandLookupByName(domainResult.error)) {
    return {
      ...domainResult,
      lookupMethod: 'domain',
    }
  }

  console.log(`brand.dev by-name fallback: ${record.name}`)
  const nameResult = await retrieveBrandByName(record.name, apiKey)
  return {
    ...nameResult,
    lookupMethod: nameResult.ok ? 'name' : 'domain_then_name',
    domainError: domainResult.error,
  }
}

function metadataJsonSchema() {
  return {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: SKILL_CATEGORIES,
      },
      h1: {
        type: 'string',
        minLength: 8,
        description: 'Clear page H1. Aim for 45-85 characters, but never truncate a phrase.',
      },
      metaTitle: {
        type: 'string',
        minLength: 20,
        description:
          'SEO title. Aim for 50-75 characters, but prioritize a complete natural phrase.',
      },
      metaDescription: {
        type: 'string',
        minLength: 80,
        description:
          'SEO meta description. Aim for 130-170 characters. Must be complete and must not end mid-sentence.',
      },
      intro: {
        type: 'string',
        minLength: 120,
        description:
          'Intro paragraph. Aim for 2-4 concise sentences explaining the service, DocsBot Skill Builder, and the support/internal AI agent value.',
      },
      supportUseCases: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        description:
          'Customer-facing support use cases. The Skill is triggered by the customer chat widget or helpdesk ticket context, then uses the listed service to look up, create, modify, summarize, or trigger actions.',
        items: {
          type: 'string',
          minLength: 30,
          description:
            'One complete customer support use case. Aim for one concise sentence and never cut off the ending.',
        },
      },
      internalUseCases: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        description:
          'Internal employee/team use cases for private DocsBot agents accessed in chat, Slack, or Microsoft Teams.',
        items: {
          type: 'string',
          minLength: 30,
          description:
            'One complete internal team use case. Mention employees chatting with the agent to retrieve information, research, or complete workflows/SOPs when appropriate.',
        },
      },
      whatYouCanBuild: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        description:
          'Concrete Skill ideas the customer can build. Each item must be a complete phrase or sentence.',
        items: {
          type: 'string',
          minLength: 20,
          description:
            'One complete build idea. Aim for 10-22 words. Do not end with dangling punctuation or a partial phrase.',
        },
      },
      howItWorks: {
        type: 'array',
        minItems: 4,
        maxItems: 5,
        description:
          'A Skill Builder-centered process for non-technical users. The user describes the desired outcome in plain language; Skill Builder decides the secure design, required configuration values, secret and authentication handling, scoped permissions, approval boundaries, testing plan, self-improvements, and deployment path.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 4,
              description: 'Short step title. Aim for 3-8 words.',
            },
            description: {
              type: 'string',
              minLength: 35,
              description:
                'Complete step description. Aim for one concise sentence; never stop mid-sentence. Write through the Skill Builder agent. Do not make the user ask for security details; explain that Skill Builder automatically defines secure configuration, protects/proxies secrets, scopes access, adds approval boundaries, runs automated scenario tests, identifies bugs or improvements, and improves the Skill before deployment across the set of steps.',
            },
          },
          required: ['title', 'description'],
          additionalProperties: false,
        },
      },
      faq: {
        type: 'array',
        minItems: 4,
        maxItems: 6,
        description:
          'SEO-focused FAQs about building or deploying AI agents that integrate with this service. Do not ask whether this exact skill exists or is prebuilt.',
        items: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              minLength: 15,
              description:
                'A complete natural search-style question about using DocsBot, AI agents, customer support automation, or internal AI assistants with this software.',
            },
            answer: {
              type: 'string',
              minLength: 45,
              description:
                'A complete helpful answer focused on potential workflows and safe configuration, not on whether a prebuilt skill exists. Aim for 1-2 sentences.',
            },
          },
          required: ['question', 'answer'],
          additionalProperties: false,
        },
      },
      relatedSlugs: {
        type: 'array',
        maxItems: 6,
        items: { type: 'string' },
      },
    },
    required: [
      'category',
      'h1',
      'metaTitle',
      'metaDescription',
      'intro',
      'supportUseCases',
      'internalUseCases',
      'whatYouCanBuild',
      'howItWorks',
      'faq',
      'relatedSlugs',
    ],
    additionalProperties: false,
  }
}

function categoryPseoPageJsonSchema() {
  return {
    type: 'object',
    properties: {
      introParagraph: {
        type: 'string',
        minLength: 120,
        description:
          'Category hub intro: 2-4 sentences on why DocsBot Skills matter for this category (customer-facing and internal agents). Unique to the category.',
      },
      whatYouCanBuild: {
        type: 'array',
        minItems: 6,
        maxItems: 6,
        description: 'Exactly six concrete Skill or agent capabilities for this category.',
        items: {
          type: 'string',
          minLength: 25,
          maxLength: 220,
          description:
            'One line capability (no leading numbers or bullets). Mix support and internal examples when both apply.',
        },
      },
      faq: {
        type: 'array',
        minItems: 8,
        maxItems: 12,
        description: 'Search-intent FAQs for this category hub page.',
        items: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              minLength: 15,
              maxLength: 220,
              description: 'Natural search-style question about AI agents, automation, or Skills in this category.',
            },
            answer: {
              type: 'string',
              minLength: 50,
              maxLength: 1400,
              description:
                'Complete answer about DocsBot Skills and Skill Builder; avoid claiming unnamed integrations are pre-installed.',
            },
          },
          required: ['question', 'answer'],
          additionalProperties: false,
        },
      },
    },
    required: ['introParagraph', 'whatYouCanBuild', 'faq'],
    additionalProperties: false,
  }
}

function findTextMaxLengthPaths(schema, currentPath = 'schema') {
  if (!schema || typeof schema !== 'object') return []
  const paths = []
  if (schema.type === 'string' && Object.prototype.hasOwnProperty.call(schema, 'maxLength')) {
    paths.push(currentPath)
  }
  if (schema.properties && typeof schema.properties === 'object') {
    Object.entries(schema.properties).forEach(([key, value]) => {
      paths.push(...findTextMaxLengthPaths(value, `${currentPath}.properties.${key}`))
    })
  }
  if (schema.items) {
    paths.push(...findTextMaxLengthPaths(schema.items, `${currentPath}.items`))
  }
  return paths
}

function loadSkillsIndexRecordsForCategoryPseo(outDir) {
  const indexPath = path.join(path.resolve(outDir), 'integrations.index.json')
  const index = readJsonFile(indexPath, { records: [] })
  return Array.isArray(index.records) ? index.records : []
}

function getCategoryPseoInstructionsParts(lastErrors = []) {
  return [
    'Generate programmatic SEO copy for a DocsBot AI Skills Library category hub page.',
    DOCSBOT_SKILL_BUILDER_CONTEXT,
    'Audience: SaaS support, customer success, operations, IT, and internal automation leaders. Write in practical language that does not require the reader to be a developer.',
    'The page covers a whole category of integrations (for example Customer Support, CRM & Sales, or Automation), not a single product.',
    'Write introParagraph as a strong category-level pitch: why teams adopt DocsBot Skills here, how customer-facing agents (website chat widget, helpdesk-connected bots) and internal employee agents (in private chat, Slack, Microsoft Teams) benefit from AI agent skills in this category.',
    'The intro must be specific to the named category—typical systems, workflows, and pains—without inventing statistics or fake customer quotes.',
    'If sampleIntegrationsInCategory lists real integration names from our index, you may mention one or two of the  most popular or most relevant as representative examples of what appears in the library; otherwise stay generic to the category.',
    'whatYouCanBuild must contain exactly six items. Each is one concrete outcome an AI agent Skill could deliver (lookups, updates, CRUD operations, handoffs, summaries, triggers, artifacts). No numbering or bullet characters at the start of any item.',
    'Spread customer-support value and internal-team value across the six lines when both are plausible for this category.',
    'faq must contain at least eight entries. Questions should match expected Google or AI assistant search intent. Answers explain what teams can build with DocsBot Skill Builder for this category and how Skills deploy in support versus internal contexts.',
    FAQ_GUIDANCE,
    'Do not ask whether this specific category page or any individual Skill is prebuilt or one-click install. Assume most Skills are created with Skill Builder unless sample data explicitly says install-ready.',
    'Use only categoryName and the provided sampleIntegrationsInCategory array.',
    'Every string must be clean prose: no markdown tables, no HTML, no escaped JSON fragments, no half-finished sentences or dangling commas.',
    lastErrors.length
      ? `Previous output failed validation: ${lastErrors.join('; ')}. Fix every issue.`
      : '',
  ].filter(Boolean)
}

function buildCategoryPseoUserPayload(categoryName, sampleIntegrations) {
  return JSON.stringify(
    {
      categoryName,
      sampleIntegrationsInCategory: sampleIntegrations,
      task: 'Produce introParagraph, whatYouCanBuild (exactly 6 strings), and faq (at least 8 question/answer pairs) for this category hub.',
    },
    null,
    2,
  )
}

function validateCategoryPseoPage(parsed) {
  const errors = []
  if (!parsed || typeof parsed !== 'object') {
    errors.push('missing parsed object')
    return { valid: false, errors }
  }
  if (!parsed.introParagraph || String(parsed.introParagraph).length < 120) {
    errors.push('introParagraph too short or missing')
  }
  if (!Array.isArray(parsed.whatYouCanBuild) || parsed.whatYouCanBuild.length !== 6) {
    errors.push('whatYouCanBuild must have exactly 6 items')
  }
  if (!Array.isArray(parsed.faq) || parsed.faq.length < 8) {
    errors.push('faq must have at least 8 items')
  }
  ;(parsed.faq || []).forEach((item, i) => {
    if (!item?.question || !item?.answer) errors.push(`faq[${i}] missing question or answer`)
  })
  return { valid: errors.length === 0, errors }
}

function parseCategoryPseoResult(raw) {
  if (!raw || !raw.trim()) {
    return { valid: false, page: null, errors: ['empty model output'] }
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return { valid: false, page: null, errors: [`invalid JSON: ${error.message}`] }
  }
  const validation = validateCategoryPseoPage(parsed)
  if (!validation.valid) return { valid: false, page: parsed, errors: validation.errors }
  return { valid: true, page: parsed, errors: [] }
}

async function generateCategoryPseoPageWithOpenAi(categoryName, sampleIntegrations, args) {
  if (!args.openaiClient && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for --category-pseo')
  }
  let openai = args.openaiClient
  if (!openai) {
    const OpenAI = require('openai')
    const OpenAIClient = OpenAI.default || OpenAI
    openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })
  }
  let lastErrors = []
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await openai.responses.create({
      model: args.model || DEFAULT_MODEL,
      store: false,
      instructions: getCategoryPseoInstructionsParts(lastErrors).join('\n'),
      input: [
        {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: buildCategoryPseoUserPayload(categoryName, sampleIntegrations) }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'docsbot_skill_category_hub',
          strict: true,
          schema: categoryPseoPageJsonSchema(),
        },
      },
      max_output_tokens: 4096,
    })

    const raw = response.output_text || ''
    const parseResult = parseCategoryPseoResult(raw)
    lastErrors = parseResult.errors
    if (parseResult.valid) return parseResult.page
  }

  throw new Error(`${categoryName}: category PSEO generation failed: ${lastErrors.join(', ')}`)
}

function printCategoryPseoPrompts(args) {
  const categoryName =
    args.categoryPseoOnly && SKILL_CATEGORIES.includes(args.categoryPseoOnly)
      ? args.categoryPseoOnly
      : 'Automation'
  const records = loadSkillsIndexRecordsForCategoryPseo(args.outDir)
  const sample = records
    .filter((r) => r.category === categoryName)
    .slice(0, 15)
    .map((r) => ({ slug: r.slug, name: r.name, domain: r.domain || '' }))

  console.log('=== category PSEO: instructions (full system prompt) ===\n')
  console.log(getCategoryPseoInstructionsParts([]).join('\n'))
  console.log('\n=== category PSEO: user message (JSON, example category) ===\n')
  console.log(buildCategoryPseoUserPayload(categoryName, sample))
  console.log('\n=== note ===')
  console.log(
    'Use --category-pseo-only="Exact Category Name" with --category-pseo-print to preview another category (must match SKILL_CATEGORIES in generate-skills-integrations.js).',
  )
}

async function generateCategoryPseoFile(args) {
  const outPath = args.categoryPseoOutput || path.join(path.resolve(args.outDir), 'category-pseo.json')
  const records = loadSkillsIndexRecordsForCategoryPseo(args.outDir)
  let categories = [...SKILL_CATEGORIES]
  if (args.categoryPseoOnly) {
    if (!SKILL_CATEGORIES.includes(args.categoryPseoOnly)) {
      throw new Error(
        `--category-pseo-only must match a SKILL_CATEGORIES entry exactly (got: ${JSON.stringify(args.categoryPseoOnly)})`,
      )
    }
    categories = [args.categoryPseoOnly]
  }

  const existing = readJsonFile(outPath, { version: 1, generatedAt: null, model: null, categories: {} })
  const result = {
    version: 1,
    generatedAt: new Date().toISOString(),
    model: args.model || DEFAULT_MODEL,
    categories: { ...(existing.categories || {}) },
  }

  for (const cat of categories) {
    const sample = records
      .filter((r) => r.category === cat)
      .slice(0, 15)
      .map((r) => ({ slug: r.slug, name: r.name, domain: r.domain || '' }))
    process.stderr.write(`category-pseo: generating ${cat} (${sample.length} sample integrations)\n`)
    const page = await generateCategoryPseoPageWithOpenAi(cat, sample, args)
    result.categories[cat] = page
    fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`)
  }

  console.log(JSON.stringify({ wrote: outPath, categoriesUpdated: categories.length }, null, 2))
}

async function generateMetadataWithOpenAi(record, brand, args) {
  if (!args.openaiClient && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required unless --skip-ai is used')
  }

  let openai = args.openaiClient
  if (!openai) {
    const OpenAI = require('openai')
    const OpenAIClient = OpenAI.default || OpenAI
    openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY })
  }
  const fallbackCategory = mapTrutoCategoryToSkillCategory(record.trutoCategory)
  const brandForPrompt = brand && !brand.isError ? normalizeBrandForPage(brand) : null
  let lastErrors = []

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await openai.responses.create({
      model: args.model || DEFAULT_MODEL,
      store: false,
      instructions: [
        'Generate programmatic SEO content for a DocsBot AI Skill landing page.',
        DOCSBOT_SKILL_BUILDER_CONTEXT,
        'Audience: SaaS support, customer success, operations, and internal team leaders. Write in practical non-technical language.',
        'Create content for a page whose goal is to make the user confident DocsBot can help them build an AI support agent or internal AI agent that integrates with the named service.',
        'Support context: the Skill is deployed in a customer-facing chat widget on the customer website/product or in a DocsBot agent connected to a helpdesk that responds to customer tickets. Customer messages or tickets trigger the DocsBot agent; the listed service is the system the agent uses to retrieve information or perform approved actions.',
        'Internal context: the Skill is deployed to a private AI agent for employees and teams, accessible through a chat interface, Slack, or Microsoft Teams. Employees chat with the agent to retrieve information, research, and execute workflows or SOPs across business services.',
        'Cover both user-facing customer support and private employee/team agents when the service plausibly supports both. If one side is weak, still mention it lightly rather than inventing unrealistic examples.',
        'How it works context: Skill Builder is the AI agent that creates the Skill for non-technical users. The user describes the desired agent ability in plain language; Skill Builder decides how to design, secure, test, improve, and deploy it. Do not make setup sound like a manual developer checklist.',
        'Security context: explain that Skill Builder knows how to connect services safely, define required configuration values, store and proxy secrets/authentication through secure runtime configuration, keep credentials out of chats and generated copy, scope actions to appropriate users and permissions, and add approval boundaries for sensitive actions.',
        'Testing context: Skill Builder has an automated testing agent that can run every imagined support and internal scenario, identify bugs or improvements, and feed those results into an automated self-improvement loop before deployment.',
        'Emphasize AI Actions: lookups, updates, handoffs, approvals, workflow triggers, summaries, generated artifacts, and bounded actions the customer defines.',
        'Do not claim the Skill is prebuilt unless availability is install. Most entries are buildable with Skill Builder.',
        'Never write clipped copy. Every field must be a complete sentence or complete phrase, even if that makes it slightly longer than typical SEO guidance.',
        FAQ_GUIDANCE,
        'Do not use web search. Use only the provided integration and brand data.',
        'Every string must be clean human-readable copy. Never include escaped JSON fragments, stray quote/comma sequences, markdown tables, unfinished words, or dangling punctuation.',
        'Meta descriptions must be a complete sentence or sentence fragment that does not end with a comma, colon, semicolon, or incomplete phrase.',
        `Pick one DocsBot category. The default mapped category is ${fallbackCategory}.`,
        lastErrors.length
          ? `The previous attempt failed these quality checks: ${lastErrors.join('; ')}. Fix those issues.`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(
                {
                  integration: record,
                  availability: INSTALLED_SKILL_OVERRIDES.has(record.slug)
                    ? 'install'
                    : 'build',
                  fallbackCategory,
                  brand: brandForPrompt,
                  useCaseFocus:
                    'Programmatic SEO page for DocsBot Skill Builder. Explain how customers could create AI agents that integrate with this service. For support, the agent is deployed in a customer-facing website/product chat widget or connected helpdesk, and uses the service to look up, create, modify, summarize, or trigger actions while responding to customers. For internal teams, the agent is private and accessed via chat, Slack, or Microsoft Teams so employees can retrieve information, research, and complete workflows or SOPs across services. Prioritize practical AI Actions: live lookups, approved record updates, workflow triggers, handoffs, escalation prep, summaries, and artifact generation.',
                  howItWorksRequirements: [
                    'The Skill Builder is an AI agent that helps build, review, test, improve, secure, and deploy the Skill for non-technical users.',
                    'Frame user actions as describing the desired outcome in plain language, not manually configuring implementation details.',
                    'Explain that Skill Builder knows how to define required configuration values and secure connection/authentication handling.',
                    'Explain that Skill Builder protects and proxies secrets by design where relevant.',
                    'Mention scoped permissions, appropriate users, approval boundaries, or safe action limits as Skill Builder design decisions.',
                    'Mention the automated testing agent that runs imagined scenarios, finds bugs or improvements, and supports an automated self-improvement loop before deployment.',
                    'Avoid implying the user manually writes code or manually wires every integration step.',
                  ],
                  faqRequirements: [
                    'FAQs must target web/AI-search intent for AI agents integrated with this service.',
                    'Include at least one customer support automation FAQ when plausible.',
                    'Include at least one internal team or employee AI assistant FAQ when plausible.',
                    'Do not ask whether this exact DocsBot Skill currently exists.',
                    'Do not ask whether it is prebuilt or installable.',
                    'Avoid product-status questions; focus on what users can build, deploy, automate, connect, or safely control.',
                  ],
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'docsbot_skill_integration_page',
          strict: true,
          schema: metadataJsonSchema(),
        },
      },
      max_output_tokens: 3200,
    })

    const raw = response.output_text || ''
    const parseResult = parseGeneratedMetadataResult(raw, record, brand)
    lastErrors = parseResult.errors
    if (parseResult.valid) return parseResult.metadata
  }

  throw new Error(`${record.slug} generated invalid metadata: ${lastErrors.join(', ')}`)
}

function parseGeneratedMetadataResult(raw, record, brand) {
  if (!raw || !raw.trim()) {
    return {
      valid: false,
      metadata: null,
      errors: [`OpenAI returned no metadata for ${record.slug}`],
    }
  }

  let parsed
  try {
    parsed = cleanGeneratedMetadata(JSON.parse(raw))
  } catch (error) {
    return {
      valid: false,
      metadata: null,
      errors: [`OpenAI returned invalid JSON for ${record.slug}: ${error.message}`],
    }
  }

  const candidate = buildIntegrationRecord(record, {
    domain: resolveDomain(record),
    brand,
    generated: parsed,
  })
  const validation = validateIntegrationRecord(candidate)
  if (!validation.valid) {
    return {
      valid: false,
      metadata: parsed,
      errors: validation.errors,
    }
  }

  return {
    valid: true,
    metadata: parsed,
    errors: [],
  }
}

async function buildDatabase(args = parseArgs()) {
  const brandCachePath = path.join(args.outDir, 'brand-cache.json')
  const generatedAt = new Date().toISOString()

  const html = await fetchText(TRUTO_INTEGRATIONS_URL)
  const allRecords = mergeManualIntegrations(parseTrutoIntegrations(html))
  const selectedRecords = selectRecords(allRecords, args)

  const brandCache = readJsonFile(brandCachePath, {
    version: 1,
    updatedAt: null,
    entries: {},
  })
  if (!brandCache.entries || typeof brandCache.entries !== 'object') {
    brandCache.entries = {}
  }
  if (!brandCache.version) brandCache.version = 1
  if (!brandCache.updatedAt) brandCache.updatedAt = null
  writeJsonFile(brandCachePath, brandCache)

  const finalRecordsBySlug = new Map()
  const recordOrder = new Map(selectedRecords.map((record, index) => [record.slug, index]))
  const integrationsDir = path.join(args.outDir, 'integrations')
  const brandLookups = new Map()
  const orderedFinalRecords = () =>
    [...finalRecordsBySlug.values()].sort(
      (a, b) => (recordOrder.get(a.slug) || 0) - (recordOrder.get(b.slug) || 0),
    )
  const checkpoint = () =>
    writeSplitIntegrationData({
      outDir: args.outDir,
      records: orderedFinalRecords(),
      sourceUrl: TRUTO_INTEGRATIONS_URL,
      generatedAt,
      clean: false,
    })
  const writeExistingRecordForRepair = (record) => {
    finalRecordsBySlug.set(record.slug, record)
    checkpoint()
  }
  const getBrandForRecord = async (record, domain, cacheKey) => {
    let brand = brandCache.entries[cacheKey]?.brand || null
    if (args.skipBrand || !shouldFetchBrandCacheEntry(brandCache.entries[cacheKey], args.refreshBrandCache)) {
      return brand
    }

    if (brandLookups.has(cacheKey)) {
      return brandLookups.get(cacheKey)
    }

    const lookup = (async () => {
      console.log(`brand.dev: ${record.name} -> ${domain}`)
      const result = await retrieveBrandForRecord(record, domain, process.env.BRANDDEV_API_KEY)
      const nextBrand = result.ok ? result.brand : result.error
      brandCache.entries[cacheKey] = {
        slug: record.slug,
        name: record.name,
        domain,
        fetchedAt: new Date().toISOString(),
        status: result.ok ? 'ok' : 'error',
        lookupMethod: result.lookupMethod || 'domain',
        domainError: result.domainError || null,
        brand: nextBrand,
      }
      brandCache.updatedAt = new Date().toISOString()
      writeJsonFile(brandCachePath, brandCache)
      return nextBrand
    })()

    brandLookups.set(cacheKey, lookup)
    try {
      brand = await lookup
      return brand
    } finally {
      brandLookups.delete(cacheKey)
    }
  }

  await runWithConcurrency(selectedRecords, args.concurrency, async (record) => {
    const existingRecordPath = path.join(integrationsDir, `${record.slug}.json`)
    const rawExistingRecord = fs.existsSync(existingRecordPath)
      ? readJsonFile(existingRecordPath, null)
      : null
    const existingRecord = !args.refreshBrandCache
      ? readReusableIntegrationRecord(existingRecordPath, record.slug)
      : null
    if (existingRecord) {
      console.log(`reuse: ${record.name}`)
      finalRecordsBySlug.set(record.slug, existingRecord)
      checkpoint()
      return
    }

    const domain = resolveDomain(record)
    const cacheKey = domain || record.slug
    const brand = await getBrandForRecord(record, domain, cacheKey)
    if (!args.skipBrand && !isUsableBrand(brand)) {
      const status = brand?.status || brand?.code || 'missing'
      console.warn(`skip: ${record.name} missing brand data (${status})`)
      if (rawExistingRecord?.slug === record.slug) {
        writeExistingRecordForRepair(rawExistingRecord)
      }
      return
    }

    if (rawExistingRecord?.slug === record.slug && isUsableBrand(brand)) {
      console.log(`repair brand: ${record.name}`)
    }

    let generated = null
    if (!args.skipAi) {
      console.log(`openai: ${record.name}`)
      generated = await generateMetadataWithOpenAi(record, brand, args)
    }

    const finalRecord = buildIntegrationRecord(record, {
      domain,
      brand,
      generated,
    })
    const validation = validateIntegrationRecord(finalRecord)
    if (!validation.valid) {
      throw new Error(`${record.slug} failed validation: ${validation.errors.join(', ')}`)
    }
    finalRecordsBySlug.set(record.slug, finalRecord)
    checkpoint()
  })

  const finalRecords = orderedFinalRecords()

  const writtenPaths = writeSplitIntegrationData({
    outDir: args.outDir,
    records: finalRecords,
    sourceUrl: TRUTO_INTEGRATIONS_URL,
    generatedAt,
    clean: false,
  })
  const writtenValidation = validateWrittenIntegrationData({
    indexPath: writtenPaths.indexPath,
    integrationsDir: writtenPaths.integrationsDir,
  })
  if (!writtenValidation.valid) {
    throw new Error(`Generated integration JSON failed validation: ${writtenValidation.errors.join('; ')}`)
  }

  return {
    brandCachePath,
    indexPath: writtenPaths.indexPath,
    integrationsDir: writtenPaths.integrationsDir,
    rawCount: allRecords.length,
    selectedCount: selectedRecords.length,
    records: finalRecords,
  }
}

async function main() {
  loadLocalEnv()
  const args = parseArgs()
  if (args.categoryPseoPrint) {
    printCategoryPseoPrompts(args)
    return
  }
  if (args.categoryPseo) {
    await generateCategoryPseoFile(args)
    return
  }
  const result = await buildDatabase(args)
  console.log(
    JSON.stringify(
      {
        brandCachePath: result.brandCachePath,
        indexPath: result.indexPath,
        integrationsDir: result.integrationsDir,
        rawCount: result.rawCount,
        selectedCount: result.selectedCount,
        slugs: result.records.map((record) => record.slug),
      },
      null,
      2,
    ),
  )
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  BRANDDEV_RETRIEVE_URL,
  BRANDDEV_RETRIEVE_BY_NAME_URL,
  DEFAULT_MODEL,
  DOMAIN_OVERRIDES,
  MANUAL_INTEGRATIONS,
  SKILL_CATEGORIES,
  TRUTO_CATEGORY_TO_SKILL_CATEGORY,
  buildDatabase,
  buildIntegrationRecord,
  buildIntegrationIndexRecord,
  cleanGeneratedMetadata,
  defaultGeneratedMetadata,
  loadLocalEnv,
  mapTrutoCategoryToSkillCategory,
  mergeManualIntegrations,
  metadataJsonSchema,
  findTextMaxLengthPaths,
  buildCategoryPseoUserPayload,
  categoryPseoPageJsonSchema,
  generateCategoryPseoFile,
  generateCategoryPseoPageWithOpenAi,
  getCategoryPseoInstructionsParts,
  loadSkillsIndexRecordsForCategoryPseo,
  printCategoryPseoPrompts,
  generateMetadataWithOpenAi,
  isTransientBrandError,
  isUsableBrand,
  normalizeBrandForPage,
  normalizeDomain,
  parseArgs,
  parseGeneratedMetadataResult,
  parseRetryAfterMs,
  parseTrutoIntegrations,
  retrieveBrandByDomain,
  retrieveBrandByName,
  retrieveBrandForRecord,
  resolveDomain,
  selectRecords,
  shouldFallbackBrandLookupByName,
  shouldFetchBrandCacheEntry,
  slugify,
  validateGeneratedCopyQuality,
  validateFaqSearchIntent,
  validateIntegrationRecord,
  validateWrittenIntegrationData,
  writeSplitIntegrationData,
}
