import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BoltIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketSquareIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  CursorArrowRaysIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  KeyIcon,
  LinkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PlayCircleIcon,
  PuzzlePieceIcon,
  QueueListIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/20/solid'
import {
  ChartBarIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Tooltip from '@/components/Tooltip'
import JsonLd from '@/components/seo/JsonLd'
import { Brands } from '@/components/customer-support/Brands'
import { Security } from '@/components/customer-support/Security'
import { Testimonials } from '@/components/customer-support/Testimonials'
import { Faq } from '@/components/customer-support/FAQs'
import { SectionReveal } from '@/components/customer-support/transitions'
import { Banner } from '@/components/customer-support/call-to-action'
import { ChatBubble, LoadingDots } from '@/components/customer-support/animation-elements'
import { Button, Description, Section, SectionContent } from '@/components/elements'
import { StripeSubscriptionDemoCard } from '@/components/StripeSubscriptionPreview'
import {
  buildFaqEntities,
  buildFaqPage,
  buildOrganization,
  buildPageUrl,
  buildService,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'

const pageTitle = 'AI agents that take action | DocsBot'
const pageDescription =
  'AI Actions: agentic workflows for support & internal ops—MCP, booking, billing, Skills. ~76% of requests answered; Actions finish the rest.'
const aiActionsDefinition =
  "AI Actions are DocsBot's workflow automation layer—we built them for teams running customer-facing support and internal operations, from lean product-led SMBs to enterprise service centers."
const mcpIconSrc = '/branding/mcp/mcp-icon.png'
const mcpIconWhiteSrc = '/branding/mcp/mcp-icon-white.svg'

const actionCategories = [
  {
    title: 'Capture and qualify demand',
    description:
      'Collect the details your team needs, qualify intent, and route conversations with context already attached.',
    icon: UserGroupIcon,
  },
  {
    title: 'Resolve account workflows',
    description:
      'Look up account state, open self-serve paths, collect approval context, and complete agentic requests.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: 'Book and route next steps',
    description:
      'Schedule a call, reserve a session, start onboarding, or hand the customer to the right next workflow.',
    icon: CalendarDaysIcon,
  },
  {
    title: 'Trigger in-product actions',
    description:
      'Launch modals, forms, checkout flows, analytics events, settings screens, and backend workflows.',
    icon: CursorArrowRaysIcon,
  },
  {
    title: 'Reach live context',
    description:
      'Use live web context, approved domains, citations, and link safety when your docs need fresh data.',
    icon: GlobeAltIcon,
  },
]

const actionFeatures = [
  {
    name: 'Action pipeline',
    summary: 'The agent answers, chooses an approved tool, and closes the loop.',
    description:
      'AI Actions turn a chat into a workflow. DocsBot can collect missing information, decide which approved path applies, call a tool, and return the result to the customer.',
    animation: ActionPipelineAnimation,
    icon: BoltIcon,
  },
  {
    name: 'Account workflows',
    summary: 'Resolve customer requests that require a lookup, policy, or system update.',
    description:
      'Keep the concept broad: subscriptions, memberships, orders, account access, warranty checks, eligibility, approvals, and other customer records all fit the same action model.',
    animation: AccountWorkflowAnimation,
    icon: ClipboardDocumentCheckIcon,
    platforms: 'billing',
  },
  {
    name: 'Booking and scheduling',
    summary: 'Collect the lead, qualify intent, and book a demo or next step.',
    description:
      'Your agent can handle sales enablement workflows by capturing lead details, qualifying fit, and confirming a demo or scheduling path in the platform your business uses.',
    animation: BookingWorkflowAnimation,
    icon: CalendarDaysIcon,
    platforms: 'booking',
  },
]

const actionFeatureHashes = {
  'action-pipeline': 0,
  'account-workflows': 1,
  'booking-and-routing': 2,
}

const controlFeatures = [
  {
    title: 'Approved tools only',
    description:
      'Enable the exact actions your bot can use, then control where and how each action appears.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Clear trigger instructions',
    description:
      'Define when an action should run, what the agent must ask first, and when it should escalate.',
    icon: QueueListIcon,
  },
  {
    title: 'Credentials and metadata',
    description:
      'Use OAuth, API credentials, trusted metadata, and private values for secure per-user context.',
    icon: KeyIcon,
  },
  {
    title: 'Visible tool activity',
    description:
      'Review tool calls, conversation history, outcomes, and metadata so teams can keep improving.',
    icon: ChartBarIcon,
  },
]

const mcpConnectorHighlights = [
  {
    title: 'Connect remote MCP servers',
    description:
      'Add a secure MCP server URL, authenticate when needed, and let DocsBot discover the tools that server exposes.',
    iconSrc: mcpIconWhiteSrc,
  },
  {
    title: 'Enable only the right tools',
    description:
      'Many servers expose read and write tools. Review the list and turn on the smallest useful set for your bot.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Use live systems in chat',
    description:
      'Answer questions and complete work from analytics, CRM, SEO, billing, support, project, and internal systems.',
    icon: LinkIcon,
  },
]

const mcpUseCases = [
  'Analytics queries',
  'CRM records',
  'SEO rankings',
  'Support history',
  'Subscription status',
  'Project tasks',
  'Internal APIs',
  'Operational reports',
]

const useCases = [
  {
    name: 'Customer Success',
    title: 'Guide customers into better outcomes',
    description:
      'Book onboarding, collect implementation details, surface usage guidance, and trigger handoffs before customers stall.',
    highlights: ['Onboarding flows', 'Health checks', 'Success handoffs'],
    icon: CheckCircleIcon,
  },
  {
    name: 'Sales',
    title: 'Turn qualified interest into the next step',
    description:
      'Capture the visitor, qualify their need, answer objections, then route them to a demo, quote, checkout, or sales workflow.',
    highlights: ['Lead capture', 'Demo routing', 'Quote requests'],
    icon: PaperAirplaneIcon,
  },
  {
    name: 'RevOps',
    title: 'Keep go-to-market systems accurate without ticket ping-pong',
    description:
      'Route leads, enrich records, update CRM stages, sync subscription or usage signals, and trigger the right follow-up so reps and marketers stay focused while the agent handles repeatable GTM hygiene.',
    highlights: ['CRM updates', 'Lead routing', 'Lifecycle handoffs'],
    icon: ArrowTrendingUpIcon,
  },
  {
    name: 'Support Ops',
    title: 'Close requests that need more than an answer',
    description:
      'Resolve account, order, access, membership, or policy workflows while keeping your escalation rules intact.',
    highlights: ['Account lookups', 'Policy checks', 'Escalation context'],
    icon: WrenchScrewdriverIcon,
  },
  {
    name: 'IT & Service Desk',
    title: 'Deflect internal tier-1 with agentic actions',
    description:
      'Give employees and contractors a single place to reset access, request software, open tickets with full context, or look up device and policy answers—whether you are a lean SMB or a centralized enterprise service desk.',
    highlights: ['Access requests', 'Ticket creation', 'Policy Q&A'],
    icon: ComputerDesktopIcon,
  },
  {
    name: 'Finance & Procurement',
    title: 'Speed up approvals and lookups with audit-friendly steps',
    description:
      'Handle PO status, vendor onboarding checklists, invoice questions, expense policy guidance, and lightweight procurement intake so finance teams spend less time on repetitive routing at SMB and enterprise scale.',
    highlights: ['Invoice help', 'Policy routing', 'Procurement intake'],
    icon: BanknotesIcon,
  },
  {
    name: 'Internal Ops',
    title: 'Company-wide portals for HR, workplace, and ops',
    description:
      'Run one internal agent for HR questions, workplace policy, facilities requests, and cross-team intake—ideal when a small business shares hats across roles or when an enterprise standardizes on a single employee front door.',
    highlights: ['Employee intake', 'Policy & HR routing', 'Multi-team handoffs'],
    icon: Cog6ToothIcon,
  },
  {
    name: 'Developers',
    title: 'Expose real systems through agentic skills',
    description:
      'Use Skills, APIs, MCP, webhooks, and widget actions to connect DocsBot to internal tools, line-of-business APIs, and employee portals without rebuilding your chat UI.',
    highlights: ['APIs', 'MCP', 'Webhooks'],
    icon: CodeBracketSquareIcon,
  },
]

const actionSurfaces = [
  { label: 'Skills', icon: PuzzlePieceIcon },
  { label: 'MCP', iconSrc: mcpIconWhiteSrc },
  { label: 'APIs', icon: CodeBracketSquareIcon },
  { label: 'Webhooks', icon: BoltIcon },
  { label: 'Buttons', icon: CursorArrowRaysIcon },
  { label: 'Booking', icon: CalendarDaysIcon },
  { label: 'Billing', iconSrc: '/branding/action-icons/stripe-white.svg' },
  { label: 'Live search', icon: MagnifyingGlassIcon },
]

const security = [
  {
    title: 'Enterprise-grade controls',
    description:
      'Use permissions, private metadata, credentials, and approval rules to keep actions bounded.',
    icon: LockClosedIcon,
  },
  {
    title: 'Auditable outcomes',
    description:
      'Conversation history and tool activity make each action easier to inspect, tune, and improve.',
    icon: DocumentCheckIcon,
  },
  {
    title: 'Connected systems',
    description:
      'Bring business workflows into chat without forcing customers or teams to switch channels.',
    icon: ServerStackIcon,
  },
  {
    title: 'Agentic automation',
    description:
      'Let agents act only inside the lanes, workflows, and policies your team configures.',
    icon: ShieldCheckIcon,
  },
]

const faqs = [
  {
    question: 'What are AI Actions in DocsBot?',
    answer:
      "AI Actions are DocsBot's workflow automation layer—we built them for teams running customer-facing support and internal operations, from lean product-led SMBs to enterprise service centers. They let your DocsBot agent use approved tools and workflows during a conversation—collecting structured information, booking a next step, looking up account context, triggering custom UI, searching live information, or calling a custom Skill—so those teams can finish work in chat.",
  },
  {
    question: 'Do AI Actions only work with specific billing or scheduling platforms?',
    answer:
      'No. The concept is platform-agnostic. DocsBot can connect to many services through built-in actions, custom buttons, APIs, webhooks, MCP connectors, and DocsBot Skills.',
  },
  {
    question: 'What is DocsBot Skill Builder?',
    answer:
      'DocsBot Skill Builder is an AI coding agent built into DocsBot. Describe a custom capability in a prompt, and it helps create a DocsBot Skill that can include instructions, reference files, and executable functions for APIs, workflows, artifacts, and business logic.',
  },
  {
    question: 'How do MCP Connectors fit with AI Actions?',
    answer:
      'MCP Connectors let DocsBot connect to remote MCP servers that expose tools from services your team already uses. You review and enable the tools your bot can call, then DocsBot can use them as agentic actions during a conversation.',
  },
  {
    question: 'How do actions stay controlled?',
    answer:
      'You choose which actions are available, what instructions govern them, what metadata or credentials they can use, and when the agent should ask follow-up questions or escalate to a human.',
  },
  {
    question: 'Can actions help with the requests DocsBot does not resolve today?',
    answer:
      'Yes. DocsBot already resolves an average 76% of support requests. Actions cover much of the rest: cases where the right outcome is to use an approved Skill or connector—live lookups, bookings, structured intake, or writing updates back to your systems.',
  },
  {
    question: 'Do I need developers to use AI Actions?',
    answer:
      'Many actions are no-code or low-code. Developers can extend the surface further with Skills, APIs, MCP connectors, webhooks, and custom widget events.',
  },
  {
    question: 'Can DocsBot AI Actions update customer accounts or billing records?',
    answer:
      'Yes, when you enable the right agentic workflow. DocsBot can collect the required details, check your instructions and metadata, then call approved tools for account updates, billing lookups, invoices, cancellations, refunds, or other platform-specific processes.',
  },
  {
    question: 'Can AI Actions work with my CRM, help desk, calendar, or internal tools?',
    answer:
      'Yes. DocsBot can connect through Skills, APIs, webhooks, MCP servers, custom buttons, and widget events, so actions can reach CRMs, help desks, calendars, billing systems, project tools, analytics, and internal services.',
  },
  {
    question: 'Are AI Actions safe for customer support automation?',
    answer:
      'AI Actions are designed to be bounded by the rules you define. Teams can limit available tools, require metadata, use credentials securely, set approval or escalation rules, and review tool-call activity in conversation logs.',
  },
]

function MotionLine({ className, delay = 0 }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{ scaleX: 0, opacity: 0.35 }}
      animate={prefersReducedMotion ? { scaleX: 1, opacity: 1 } : { scaleX: [0, 1, 1], opacity: [0.35, 1, 0.75] }}
      transition={prefersReducedMotion ? undefined : { duration: 2.8, delay, repeat: Infinity, repeatDelay: 1.5 }}
      style={{ transformOrigin: 'left' }}
    />
  )
}

const stripePreviewLabels = {
  stripeSubscription: 'Current plan',
  stripeCurrentPeriod: 'Current period',
  stripeAmount: 'Amount',
  stripeQty: 'Qty',
  stripeItem: 'Plan',
  stripeStatusActive: 'Active',
  stripeIntervalMonth: 'month',
  stripeIntervalYear: 'year',
  stripeCancelsAtPeriodEnd: 'Cancels at period end',
}

const heroConversationScenes = [
  {
    id: 'booking',
    agent: 'DocsBot support agent',
    badge: 'Booking',
    user: 'I have a few questions before choosing a plan.',
    bot: 'I can help with that. Would you like to book a demo?',
    action: 'calendar',
  },
  {
    id: 'plan',
    agent: 'DocsBot support agent',
    badge: 'Billing',
    user: 'What plan am I on right now?',
    bot: 'You are on the active Pro plan. Here is the subscription record from billing.',
    action: 'subscription',
  },
  {
    id: 'invoice',
    agent: 'DocsBot support agent',
    badge: 'Invoice',
    user: 'Can I download my recent invoice?',
    bot: 'Yes. I found your most recent paid invoice and prepared the download.',
    action: 'invoice',
  },
  {
    id: 'internal',
    agent: 'DocsBot internal agent',
    badge: 'Internal ops',
    user: 'Turn this support issue into an engineering task and link it back to the ticket.',
    bot: 'All right, I created a task from the ticket and linked both records for follow-up.',
    action: 'internal',
  },
  {
    id: 'bug-report',
    agent: 'DocsBot internal agent',
    badge: 'Bug triage',
    user: 'Convert this bug report into an engineering task with repro steps and priority.',
    bot: 'Done. I created the task, added repro steps, set the priority, and attached the source conversation.',
    action: 'bug-report',
  },
  {
    id: 'call-summary',
    agent: 'DocsBot internal agent',
    badge: 'Customer success',
    user: 'Summarize this customer call and create the follow-up work.',
    bot: 'I summarized the call, added CRM notes, and assigned the follow-up tasks to the right owners.',
    action: 'call-summary',
  },
]

function EmbeddedCalendarCard() {
  const days = ['Tue 14', 'Wed 15', 'Thu 16']
  const times = ['10:30 AM', '1:00 PM', '3:30 PM']

  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-3 text-gray-900 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Choose a demo time</p>
          <p className="text-xs text-gray-500">Qualified lead context is attached.</p>
        </div>
        <CalendarDaysIcon className="size-5 text-cyan-600" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {days.map((day, index) => (
          <div
            key={day}
            className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
              index === 1 ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {times.map((time, index) => (
          <div
            key={time}
            className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${
              index === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {time}
          </div>
        ))}
      </div>
    </div>
  )
}

function StripeInvoiceCard() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-3 text-gray-900 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image src="/branding/action-icons/stripe.svg" alt="" width={22} height={22} className="size-5" />
          <div>
            <p className="text-sm font-semibold">Invoice ready</p>
            <p className="text-xs text-gray-500">Paid invoice from Stripe</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Paid</span>
      </div>
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">INV-2026-0418</span>
          <span className="font-semibold">$49.00</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Pro plan - Apr 18, 2026</p>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white">
        <DocumentCheckIcon className="size-4 text-cyan-300" />
        Download PDF
      </div>
    </div>
  )
}

function InternalActionCard() {
  const steps = [
    { label: 'Support ticket', detail: 'Issue details copied over', icon: ChatBubbleLeftRightIcon },
    { label: 'Task tracker', detail: 'Engineering issue created', icon: QueueListIcon },
    { label: 'Records linked', detail: 'Status sync enabled', icon: LinkIcon },
  ]

  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-3 text-gray-900 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Cross-system action complete</p>
        <CheckCircleIcon className="size-5 text-emerald-600" />
      </div>
      <div className="grid gap-2">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[11px] text-gray-500">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BugReportActionCard() {
  const steps = [
    { label: 'Bug task created', detail: 'Issue and impact added', icon: QueueListIcon },
    { label: 'Repro steps added', detail: 'Steps copied in', icon: ClipboardDocumentCheckIcon },
    { label: 'Priority set', detail: 'P1 + source attached', icon: BoltIcon },
  ]

  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-2.5 text-gray-900 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Bug triage ready</p>
        <CheckCircleIcon className="size-5 text-emerald-600" />
      </div>
      <div className="grid gap-1.5">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[11px] text-gray-500">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CustomerCallActionCard() {
  const steps = [
    { label: 'Call summarized', detail: 'Key asks and risks extracted', icon: ChatBubbleLeftRightIcon },
    { label: 'CRM note added', detail: 'Account record updated', icon: DocumentCheckIcon },
    { label: 'Follow-ups assigned', detail: 'Tasks routed to owners', icon: UserGroupIcon },
  ]

  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-2.5 text-gray-900 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">Customer follow-up created</p>
        <CheckCircleIcon className="size-5 text-emerald-600" />
      </div>
      <div className="grid gap-1.5">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-1.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[11px] text-gray-500">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HeroConversationResult({ action }) {
  if (action === 'calendar') return <EmbeddedCalendarCard />
  if (action === 'subscription') {
    return (
      <div className="rounded-xl bg-white p-2 shadow-lg">
        <StripeSubscriptionDemoCard labels={stripePreviewLabels} />
      </div>
    )
  }
  if (action === 'invoice') return <StripeInvoiceCard />
  if (action === 'bug-report') return <BugReportActionCard />
  if (action === 'call-summary') return <CustomerCallActionCard />
  return <InternalActionCard />
}

function HeroConversationWidget() {
  const prefersReducedMotion = useReducedMotion()
  const [sceneIndex, setSceneIndex] = useState(0)
  const stagedMotion = (delay = 0) => ({
    initial: prefersReducedMotion ? false : { height: 0, opacity: 0, y: 12, scale: 0.98 },
    animate: { height: 'auto', opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.32, delay: prefersReducedMotion ? 0 : delay, ease: 'easeOut' },
  })
  const actionFadeMotion = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 4, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.18, delay: prefersReducedMotion ? 0 : 1.05, ease: 'easeOut' },
  }

  useEffect(() => {
    if (prefersReducedMotion) return undefined
    const timer = window.setInterval(() => {
      setSceneIndex((index) => (index + 1) % heroConversationScenes.length)
    }, 6400)
    return () => window.clearInterval(timer)
  }, [prefersReducedMotion])

  const scene = heroConversationScenes[sceneIndex]

  return (
    <div className="flex h-[31rem] flex-col rounded-xl border border-white/10 bg-gray-950/70 p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="text-xs font-medium text-gray-400">{scene.agent}</span>
        <span className="ml-auto rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">
          {scene.badge}
        </span>
      </div>

      <motion.div
        key={scene.id}
        className="flex-1 space-y-4 overflow-hidden"
      >
        <motion.div className="overflow-hidden" {...stagedMotion(0.1)}>
          <ChatBubble
            isBot={false}
            content={scene.user}
            shadowSize="md"
            shadowColor="gray-950/50"
          />
        </motion.div>
        <motion.div className="overflow-hidden" {...stagedMotion(0.7)}>
          <ChatBubble
            isBot
            content={scene.bot}
            shadowSize="md"
            shadowColor="gray-950/50"
          />
        </motion.div>
        <motion.div {...actionFadeMotion}>
          <HeroConversationResult action={scene.action} />
        </motion.div>
      </motion.div>

      <div className="mt-auto flex justify-center gap-2 pt-4">
        {heroConversationScenes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show ${item.badge} example`}
            onClick={() => setSceneIndex(index)}
            className={`size-2 rounded-full transition ${
              index === sceneIndex ? 'bg-cyan-300' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const actionableRequestCards = [
  { label: 'Book demo', detail: 'Qualified lead', icon: CalendarDaysIcon },
  { label: 'Find invoice', detail: 'Billing lookup', icon: DocumentCheckIcon },
  { label: 'Create task', detail: 'Internal workflow', icon: QueueListIcon },
]

function HeroResolutionPanel() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="relative flex h-[31rem] flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-900/80 p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,.12),transparent_34%),radial-gradient(circle_at_20%_78%,rgba(20,184,166,.12),transparent_30%)]" />
      <div className="relative grid grid-cols-2 gap-3">
        {[
          { value: '76%', label: 'Resolved by answers' },
          { value: '89%', label: 'Escalations deflected' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2 + index * 0.15 }}
          >
            <p className="text-2xl font-semibold text-cyan-200">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.45 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-gray-950/70 shadow-lg shadow-cyan-950/30">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 201 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.55, ease: 'easeOut' }}
              />
            </svg>
            <p className="relative inline-flex translate-x-1 items-baseline text-3xl font-semibold text-cyan-200">
              24
              <span className="ml-0.5 text-base">%</span>
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Actionable requests</p>
            <p className="mt-1 text-sm leading-6 text-cyan-100/75">
              Often these are requests your agent can close with tools—live status from billing or CRM, a booked slot, a ticket or task created—not just another explanatory reply.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="relative mt-4 grid flex-1 grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <div className="grid content-center gap-2">
          {actionableRequestCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                className="rounded-xl bg-white text-gray-900 shadow-lg"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.85 + index * 0.16 }}
              >
                <motion.div
                  className="flex h-full items-center gap-2 p-2.5"
                  animate={prefersReducedMotion ? undefined : { x: [0, 4, 0] }}
                  transition={{
                    duration: 1.7,
                    delay: 1.7 + index * 0.5,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{card.label}</p>
                    <p className="text-[11px] text-gray-500">{card.detail}</p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <motion.div
            className="h-px w-8 origin-left bg-gradient-to-r from-transparent to-cyan-300/70"
            initial={{ scaleX: 0 }}
            animate={prefersReducedMotion ? { scaleX: 1 } : { scaleX: [0, 1, 1], opacity: [0.35, 1, 0.55] }}
            transition={prefersReducedMotion ? undefined : { delay: 1.15, duration: 1.7, repeat: Infinity, repeatDelay: 1.5 }}
          />
          <motion.div
            className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-950/40"
            initial={prefersReducedMotion ? false : { scale: 0.92 }}
            animate={prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.08, 1] }}
            transition={prefersReducedMotion ? undefined : { delay: 1.25, duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
          >
            <BoltIcon className="size-7" />
          </motion.div>
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-cyan-100">AI Actions</p>
          <motion.div
            className="h-px w-8 origin-left bg-gradient-to-r from-cyan-300/70 to-transparent"
            initial={{ scaleX: 0 }}
            animate={prefersReducedMotion ? { scaleX: 1 } : { scaleX: [0, 1, 1], opacity: [0.35, 1, 0.55] }}
            transition={prefersReducedMotion ? undefined : { delay: 1.3, duration: 1.7, repeat: Infinity, repeatDelay: 1.5 }}
          />
        </div>

        <motion.div
          className="flex flex-col justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3"
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 1.45, duration: 0.35 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <CheckCircleIcon className="size-5 text-cyan-300" />
            <p className="text-sm font-semibold text-white">Resolved</p>
          </div>
          <div className="space-y-2">
            {['Details collected', 'System checked', 'Workflow completed'].map((label, index) => (
              <motion.div
                key={label}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-2"
                animate={prefersReducedMotion ? undefined : { backgroundColor: ['rgba(255,255,255,.10)', 'rgba(34,211,238,.18)', 'rgba(255,255,255,.10)'] }}
                transition={{
                  duration: 1.5,
                  delay: 1.9 + index * 0.35,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: 'easeInOut',
                }}
              >
                <CheckCircleIcon className="size-4 shrink-0 text-cyan-300" />
                <span className="text-xs font-medium text-cyan-50">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function HeroActionAnimation() {
  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,.14),transparent_30%)]" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <HeroConversationWidget />
        <HeroResolutionPanel />
      </div>
    </div>
  )
}

function ActionPipelineAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const steps = [
    { label: 'Understand', icon: ChatBubbleLeftRightIcon },
    { label: 'Choose tool', icon: WrenchScrewdriverIcon },
    { label: 'Run action', icon: BoltIcon },
    { label: 'Return result', icon: CheckCircleIcon },
  ]

  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500 to-gray-900 p-6">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl bg-white/95 p-4 shadow-2xl">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <SparklesIcon className="size-5 text-cyan-600" />
            Action pipeline
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="relative">
                  <motion.div
                    className="relative z-10 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.25 }}
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
                      <Icon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold leading-snug text-gray-900">{step.label}</p>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <MotionLine className="absolute left-[calc(100%-0.5rem)] top-1/2 z-0 hidden h-0.5 w-6 bg-white/70 sm:block" delay={index * 0.25} />
                  )}
                </div>
              )
            })}
          </div>
          <motion.div
            className="mt-4 rounded-xl bg-gray-900 p-4 text-white"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 1.1 }}
          >
            <p className="text-sm font-semibold">Outcome completed</p>
            <p className="mt-1 text-xs text-gray-300">The customer gets the result and your team gets the record.</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const billingPlatforms = [
  { name: 'Stripe', mark: 'S', tone: 'bg-[#635BFF] text-white', iconSrc: '/branding/action-icons/stripe.svg' },
  { name: 'POLAR.SH', mark: 'P', tone: 'bg-gray-950 text-white', iconSrc: '/branding/action-icons/polar.png' },
  { name: 'EDD', mark: 'E', tone: 'bg-[#0f7dc2] text-white', iconSrc: '/branding/action-icons/edd.png' },
  { name: 'Shopify', mark: 'S', tone: 'bg-[#95bf47] text-gray-950', iconSrc: '/branding/action-icons/shopify.png' },
  { name: 'WooCommerce', mark: 'W', tone: 'bg-[#7f54b3] text-white', iconSrc: '/branding/action-icons/woocommerce.png' },
  { name: 'MemberPress', mark: 'M', tone: 'bg-[#f59e0b] text-gray-950', iconSrc: '/branding/action-icons/memberpress.png' },
  { name: 'Paddle', mark: 'P', tone: 'bg-[#ff6a3d] text-white', iconSrc: '/branding/action-icons/paddle.png' },
  { name: 'Lemon Squeezy', mark: 'L', tone: 'bg-[#fef08a] text-gray-950', iconSrc: '/branding/action-icons/lemon-squeezy.png' },
  { name: 'Dodo Payments', mark: 'D', tone: 'bg-[#8b5cf6] text-white', iconSrc: '/branding/action-icons/dodo-payments.png' },
  { name: 'Chargebee', mark: 'C', tone: 'bg-[#6b46ff] text-white', iconSrc: '/branding/action-icons/chargebee.png' },
  { name: 'Recurly', mark: 'R', tone: 'bg-[#1d4ed8] text-white', iconSrc: '/branding/action-icons/recurly.png' },
  { name: 'BigCommerce', mark: 'B', tone: 'bg-[#121118] text-white', iconSrc: '/branding/action-icons/bigcommerce.png' },
  { name: 'Magento', mark: 'M', tone: 'bg-[#f26322] text-white', iconSrc: '/branding/action-icons/magento.png' },
  { name: 'PayPal', mark: 'P', tone: 'bg-[#003087] text-white', iconSrc: '/branding/action-icons/paypal.png' },
  { name: 'FastSpring', mark: 'F', tone: 'bg-[#0ea5e9] text-white', iconSrc: '/branding/action-icons/fastspring.png' },
  { name: 'Square', mark: 'Sq', tone: 'bg-gray-950 text-white', iconSrc: '/branding/action-icons/square.png' },
  { name: 'Any platform', mark: '+', tone: 'bg-cyan-300 text-gray-950', flexible: true },
]

const bookingPlatforms = [
  { name: 'Calendly', mark: 'C', tone: 'bg-[#006bff] text-white', iconSrc: '/branding/scheduling-icons/calendly.svg' },
  { name: 'Cal.com', mark: 'Cal', tone: 'bg-gray-950 text-white', iconSrc: '/branding/scheduling-icons/calcom.svg' },
  { name: 'TidyCal', mark: 'T', tone: 'bg-[#2563eb] text-white', iconSrc: '/branding/scheduling-icons/tidycal.svg' },
  { name: 'Acuity', mark: 'A', tone: 'bg-[#7c3aed] text-white', iconSrc: '/branding/scheduling-icons/acuity.png' },
  { name: 'SavvyCal', mark: 'S', tone: 'bg-[#f97316] text-white', iconSrc: '/branding/scheduling-icons/savvycal.png' },
  { name: 'HubSpot Meetings', mark: 'H', tone: 'bg-[#ff5c35] text-white', iconSrc: '/branding/scheduling-icons/hubspot-meetings.png' },
  { name: 'Chili Piper', mark: 'C', tone: 'bg-[#ef4444] text-white', iconSrc: '/branding/scheduling-icons/chili-piper.png' },
  { name: 'YouCanBookMe', mark: 'Y', tone: 'bg-[#14b8a6] text-gray-950', iconSrc: '/branding/scheduling-icons/youcanbookme.png' },
  { name: 'Google Calendar', mark: 'G', tone: 'bg-[#34a853] text-white', iconSrc: '/branding/scheduling-icons/google-calendar.png' },
  { name: 'Microsoft Bookings', mark: 'M', tone: 'bg-[#0078d4] text-white', iconSrc: '/branding/scheduling-icons/microsoft-bookings.png' },
  { name: 'OnceHub', mark: 'O', tone: 'bg-[#4f46e5] text-white', iconSrc: '/branding/scheduling-icons/oncehub.png' },
  { name: 'Any scheduler', mark: '+', tone: 'bg-cyan-300 text-gray-950', flexible: true },
]

function InlinePlatformIcons({ platforms }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Example platforms">
      {platforms.map((platform) => {
        const title = platform.flexible
          ? 'Supports any platform with DocsBot Skills'
          : platform.name

        return (
          <Tooltip key={platform.name} content={title}>
            <span
              aria-label={title}
              className={`flex size-6 items-center justify-center overflow-hidden rounded-md text-[9px] font-bold ${
                platform.flexible || !platform.iconSrc ? 'bg-gray-200 text-gray-700' : 'bg-white'
              }`}
            >
              {platform.iconSrc ? (
                <Image
                  src={platform.iconSrc}
                  width={20}
                  height={20}
                  alt=""
                  className="size-5 object-contain"
                />
              ) : (
                platform.mark
              )}
            </span>
          </Tooltip>
        )
      })}
    </div>
  )
}

function AccountWorkflowAnimation() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-200 via-cyan-100 to-white p-6">
      <div className="w-full max-w-2xl">
        <motion.div
          className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-gray-900/5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
        >
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <CircleStackIcon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Account workflow</p>
                <p className="text-xs text-gray-500">Customer request with context</p>
              </div>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">Ready</span>
          </div>
          <div className="grid gap-3">
            {[
              ['Verify details', 'Use conversation metadata and trusted fields.'],
              ['Check guardrails', 'Match the request to policy, approvals, and access boundaries.'],
              ['Complete action', 'Refunds, cancellations, purchases, status lookups.'],
            ].map(([title, copy], index) => (
              <motion.div
                key={title}
                className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-900/5"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.18 }}
              >
                <div className="flex gap-3">
                  <CheckCircleIcon className="mt-0.5 size-5 flex-none text-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="mt-1 text-xs text-gray-500">{copy}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function BookingWorkflowAnimation() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-800 to-gray-950 p-6">
      <div className="w-full max-w-2xl">
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-white shadow-2xl backdrop-blur"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Lead to scheduled next step</p>
              <p className="mt-1 text-xs text-cyan-100/70">Sales enablement from capture to qualification to booking.</p>
            </div>
            <CalendarDaysIcon className="size-7 flex-none text-cyan-300" />
          </div>

          <div className="rounded-xl bg-white p-4 text-gray-900">
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-500">
              <span className="rounded-lg bg-gray-100 py-2">Lead</span>
              <span className="rounded-lg bg-gray-100 py-2">Qualified</span>
              <span className="rounded-lg bg-gray-100 py-2">Scheduled</span>
            </div>
            <div className="space-y-3">
              {['Collect lead details', 'Qualify need and fit', 'Schedule demo or next step'].map((item, index) => (
                <motion.div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-900/5"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.18 }}
                >
                  <CheckCircleIcon className="size-5 flex-none text-cyan-600" />
                  <p className="text-sm font-semibold">{item}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-gray-900 p-4 text-white">
              <p className="text-sm font-semibold">Demo booked</p>
              <p className="mt-1 text-xs text-gray-300">The prospect gets a clear confirmation while your team receives the qualified context.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SkillBuilderAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const files = ['SKILL.md', 'scripts/index.ts', 'publish']

  return (
    <div className="relative flex min-h-[34rem] items-center justify-center overflow-hidden rounded-2xl bg-gray-950 p-6 shadow-2xl shadow-cyan-950/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.22),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,.20),transparent_28%)]" />
      <div className="relative grid w-full max-w-3xl gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <SparklesIcon className="size-5 text-cyan-300" />
            DocsBot Skill Builder
          </div>
          <div className="rounded-xl bg-gray-900 p-4 text-sm text-cyan-50 ring-1 ring-white/10">
            Build a skill that checks warranty eligibility, creates a support record, and sends the customer the next approved step.
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-100">
            <LoadingDots className="text-white/90" />
            Building custom capability
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {files.map((file, index) => (
            <motion.div
              key={file}
              className="rounded-xl border border-white/10 bg-white p-4 shadow-xl"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.25 + index * 0.25 }}
            >
              <div className="flex items-start gap-3">
                {file === 'publish' ? (
                  <CheckCircleIcon className="mt-0.5 size-5 flex-none text-teal-600" />
                ) : (
                  <DocumentCheckIcon className="mt-0.5 size-5 flex-none text-cyan-600" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {file === 'publish' ? 'Validated and published' : file}
                  </p>
                  <p className="text-xs text-gray-500">
                    {file === 'publish'
                      ? 'Ready as a widget action'
                      : file === 'scripts/index.ts'
                        ? 'Executable functions that work with files and APIs'
                        : 'Instructions and references for the agent'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function McpConnectorAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const servers = [
    { label: 'CRM', icon: UserGroupIcon, className: 'left-[8%] top-[20%]' },
    { label: 'Analytics', icon: ChartBarIcon, className: 'right-[9%] top-[18%]' },
    { label: 'Billing', icon: CircleStackIcon, className: 'left-[7%] bottom-[18%]' },
    { label: 'Projects', icon: QueueListIcon, className: 'right-[7%] bottom-[18%]' },
  ]
  const lines = [
    { id: 'crm', x1: 28, y1: 27, x2: 50, y2: 43, c1x: 37, c1y: 31, c2x: 42, c2y: 39, duration: 2.2 },
    { id: 'analytics', x1: 75, y1: 26, x2: 50, y2: 43, c1x: 66, c1y: 31, c2x: 58, c2y: 38, duration: 2.4 },
    { id: 'billing', x1: 27, y1: 74, x2: 50, y2: 58, c1x: 37, c1y: 70, c2x: 42, c2y: 62, duration: 2.6 },
    { id: 'projects', x1: 76, y1: 74, x2: 50, y2: 58, c1x: 66, c1y: 70, c2x: 58, c2y: 62, duration: 2.8 },
  ]
  const tools = ['search_records', 'get_status', 'create_task']

  return (
    <div className="relative min-h-[32rem] overflow-hidden rounded-2xl bg-gray-950 p-6 shadow-2xl shadow-cyan-950/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_82%_76%,rgba(20,184,166,.18),transparent_30%)]" />
      <svg className="absolute inset-0 z-[1] size-full opacity-90" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="mcp-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#cffafe" stopOpacity=".35" />
            <stop offset="50%" stopColor="#67e8f9" stopOpacity=".95" />
            <stop offset="100%" stopColor="#99f6e4" stopOpacity=".35" />
          </linearGradient>
        </defs>
        {lines.map((line) => (
          <motion.path
            key={line.id}
            d={`M ${line.x1} ${line.y1} C ${line.c1x} ${line.c1y}, ${line.c2x} ${line.c2y}, ${line.x2} ${line.y2}`}
            fill="none"
            stroke="url(#mcp-line)"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeDasharray="9 9"
            animate={prefersReducedMotion ? undefined : { strokeDashoffset: [0, -36] }}
            transition={{ duration: line.duration, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>

      {servers.map((server, index) => {
        const Icon = server.icon
        return (
          <motion.div
            key={server.label}
            className={`absolute z-10 rounded-2xl border border-white/10 bg-white px-4 py-3 text-gray-900 shadow-xl ${server.className}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : index * 0.12 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{server.label}</p>
                <p className="text-[11px] text-gray-500">MCP server</p>
              </div>
            </div>
          </motion.div>
        )
      })}

      <div className="absolute left-1/2 top-1/2 z-20 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-cyan-300/20 bg-gray-900/95 p-5 shadow-2xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-gray-950 ring-1 ring-white/10">
          <Image src={mcpIconSrc} width={56} height={56} alt="" className="size-full object-cover" />
        </div>
        <p className="text-center text-sm font-semibold text-white">DocsBot MCP Connector</p>
        <p className="mt-1 text-center text-xs text-cyan-100/70">Review tools, set auth, then enable</p>
        <div className="mt-4 grid gap-2">
          {tools.map((tool, index) => (
            <motion.div
              key={tool}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"
              animate={prefersReducedMotion ? undefined : { opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 1.8, delay: index * 0.3, repeat: Infinity, repeatDelay: 1.2 }}
            >
              <CheckCircleIcon className="size-4 text-cyan-300" />
              <span className="font-mono text-[11px] text-cyan-50">{tool}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function McpConnectorsSection() {
  return (
    <Section theme="medium">
      <SectionContent
        theme="medium"
        title="Connect to tools through MCP servers"
        description="MCP Connectors give DocsBot a standard way to reach the services your team already uses. Add a remote MCP server, review the available tools, enable the ones your bot should use, and let the agent act with live business context."
      >
        <div className="grid gap-10">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div className="grid gap-5">
              {mcpConnectorHighlights.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex gap-4">
                      <div className="flex size-11 flex-none items-center justify-center rounded-xl bg-cyan-600 text-white">
                        {item.iconSrc ? (
                          <Image src={item.iconSrc} width={30} height={30} alt="" className="size-7 object-contain" />
                        ) : (
                          <Icon className="size-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="mt-2 text-sm/6 text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <McpConnectorAnimation />
          </div>
          <div className="rounded-2xl bg-gray-900 p-6 text-white lg:p-8">
            <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Best for existing tool ecosystems</p>
                <p className="mt-2 text-sm/6 text-gray-300">
                  Use MCP when a service already exposes a server with useful tools. Use DocsBot Skill Builder when you need a custom workflow, business rule, or integration built for your exact process.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {mcpUseCases.map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionContent>
    </Section>
  )
}

function EcosystemMapAnimation() {
  const prefersReducedMotion = useReducedMotion()
  const nodes = [
    { label: 'Skills', icon: PuzzlePieceIcon, angle: -90 },
    { label: 'APIs', icon: CodeBracketSquareIcon, angle: -30 },
    { label: 'Webhooks', icon: BoltIcon, angle: 30 },
    { label: 'Buttons', icon: CursorArrowRaysIcon, angle: 90 },
    { label: 'MCP', iconSrc: mcpIconSrc, angle: 150 },
    { label: 'Search', icon: MagnifyingGlassIcon, angle: 210 },
  ]

  return (
    <div className="relative min-h-[30rem] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-cyan-950 p-6">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute left-1/2 top-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="flex size-36 flex-col items-center justify-center rounded-3xl bg-white text-center shadow-2xl"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    '0 0 0 8px rgba(34, 211, 238, 0.16), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  ],
                }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/branding/docsbot-icon-sq.svg"
            width={40}
            height={40}
            alt=""
            className="mb-2 size-10"
          />
          <p className="text-sm font-semibold text-gray-900">DocsBot Agent</p>
          <p className="mt-1 text-xs text-gray-500">Knowledge + action</p>
        </motion.div>
      </div>
      <div className="absolute left-1/2 top-1/2 z-10 size-[min(72%,22rem)] -translate-x-1/2 -translate-y-1/2">
        {nodes.map((node) => {
          const Icon = node.icon
          return (
            <div
              key={node.label}
              className={clsx('orbit-arm absolute left-1/2 top-1/2 h-0 w-1/2 origin-left', prefersReducedMotion && 'motion-safe:animate-none')}
              style={{ '--orbit-angle': `${node.angle}deg` }}
            >
              <div className={clsx('orbit-label absolute left-full top-0', prefersReducedMotion && 'motion-safe:animate-none')}>
                <div className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xl">
                  {node.iconSrc ? (
                    <span className="flex size-5 items-center justify-center rounded-md bg-gray-950">
                      <Image src={node.iconSrc} width={18} height={18} alt="" className="size-4 object-contain" />
                    </span>
                  ) : (
                    <Icon className="size-5 text-cyan-600" />
                  )}
                  {node.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <style jsx>{`
        .orbit-arm {
          animation: orbit-spin 42s linear infinite;
          transform: rotate(var(--orbit-angle));
        }

        .orbit-label {
          animation: orbit-counter-spin 42s linear infinite;
          transform: rotate(calc(-1 * var(--orbit-angle)));
          transform-origin: 0 0;
        }

        @keyframes orbit-spin {
          from {
            transform: rotate(var(--orbit-angle));
          }
          to {
            transform: rotate(calc(var(--orbit-angle) + 360deg));
          }
        }

        @keyframes orbit-counter-spin {
          from {
            transform: rotate(calc(-1 * var(--orbit-angle)));
          }
          to {
            transform: rotate(calc(-1 * var(--orbit-angle) - 360deg));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-arm,
          .orbit-label {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

function ActionCategoryGrid() {
  return (
    <Section>
      <SectionContent
        title="Actions for the work behind the question"
        description="Support conversations often expose a workflow, not just an information gap. DocsBot can collect, check, route, trigger, and confirm the next step."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {actionCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.title} className="rounded-xl bg-gray-100 p-5">
                <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{category.title}</h3>
                <p className="mt-3 text-sm/6 text-gray-600">{category.description}</p>
              </div>
            )
          })}
        </div>
      </SectionContent>
    </Section>
  )
}

function ActionOpportunitySection() {
  const proofStats = [
    {
      value: '76',
      label: 'Average support resolution',
      description: 'DocsBot already resolves most support requests before a human needs to step in.',
    },
    {
      value: '89',
      label: 'Escalation deflection',
      description: 'Accurate answers and the right next step prevent most escalations.',
    },
  ]
  const remainingWork = [
    { label: 'Book demos and onboarding sessions', icon: CalendarDaysIcon },
    { label: 'Look up invoices, orders, or subscriptions', icon: CircleStackIcon },
    { label: 'Process requests like refunds or cancellations', icon: ArrowPathIcon },
    { label: 'Create tasks, handoffs, and internal records', icon: ClipboardDocumentCheckIcon },
  ]

  return (
    <Section>
      <SectionContent title="The next frontier is the remaining work">
        <Description
          className="w-full"
          content={`${aiActionsDefinition} Documentation answers most questions on its own. Actions cover what is left: your agent runs approved Skills and connectors to read live data from your systems, perform a task in another tool, or trigger the next step—so people leave with work done, not homework.`}
        />
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-2xl bg-gray-900 p-6 text-white shadow-xl lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Already handled by answers</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {proofStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="inline-flex items-baseline gap-0.5 text-4xl font-semibold tracking-tight text-cyan-100">
                    <span>{stat.value}</span>
                    <span className="text-xl font-semibold tracking-tight text-cyan-100/90">%</span>
                  </p>
                  <p className="mt-4 text-base font-semibold text-white">{stat.label}</p>
                  <p className="mt-2 text-sm/6 text-gray-300">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-cyan-50 p-6 shadow-sm ring-1 ring-cyan-900/10 lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Expanded by Actions</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
                  Resolve more of the remaining work
                </h3>
                <p className="mt-4 text-base/7 text-gray-600">
                  Actions let DocsBot follow your SOPs, integrate with your own systems, take action, and resolve tickets instantly.
                </p>
              </div>
              <div className="flex size-24 shrink-0 items-center justify-center gap-0.5 rounded-3xl bg-white font-semibold text-cyan-700 shadow-sm ring-1 ring-cyan-900/10">
                <span className="text-3xl leading-none">24</span>
                <span className="text-lg leading-none text-cyan-700/95">%</span>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {remainingWork.map((item) => {
                const Icon = item.icon
                return (
                <div key={item.label} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-cyan-900/5">
                  <span className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-lg bg-cyan-600 text-white">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Ways your agent can act</p>
              <p className="mt-2 max-w-2xl text-sm/6 text-gray-600">
                Pick the right action surface for each workflow: standard connectors where they exist, custom Skills when the workflow is unique, and UI or backend triggers when the product needs to respond.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {actionSurfaces.map((surface) => {
                const Icon = surface.icon
                return (
                  <div key={surface.label} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                    <span className={clsx('flex size-6 items-center justify-center rounded-full bg-cyan-600 text-white', surface.iconClassName)}>
                      {surface.iconSrc ? (
                        <Image src={surface.iconSrc} width={18} height={18} alt="" className="size-4 object-contain" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </span>
                    {surface.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SectionContent>
    </Section>
  )
}

function Feature({ feature, isActive, onClick }) {
  const Icon = feature.icon
  const platforms = feature.platforms === 'billing'
    ? billingPlatforms
    : feature.platforms === 'booking'
      ? bookingPlatforms
      : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl p-5 text-left transition ${
        isActive ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      }`}
    >
      <div className={`mb-4 flex size-10 items-center justify-center rounded-lg ${isActive ? 'bg-cyan-400 text-gray-950' : 'bg-cyan-600 text-white'}`}>
        <Icon className="size-5" />
      </div>
      <h3 className="text-base font-semibold">{feature.name}</h3>
      <p className={`mt-2 text-sm/6 ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>{feature.summary}</p>
      {platforms && <InlinePlatformIcons platforms={platforms} />}
    </button>
  )
}

function ActionFeaturesSection() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = actionFeatures[selectedIndex]
  const Animation = selected.animation

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')

    if (hash in actionFeatureHashes) {
      setSelectedIndex(actionFeatureHashes[hash])
    }
  }, [])

  return (
    <Section>
      <SectionContent
        title="From conversation to completion"
        description="AI Actions follow the same pattern regardless of platform: understand the request, choose an approved capability, complete the workflow, and return a clear result."
      >
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.2fr] lg:items-stretch">
          <div className="grid gap-4">
            {actionFeatures.map((feature, index) => (
              <Feature
                key={feature.name}
                feature={feature}
                isActive={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-xl ring-1 ring-gray-900/5">
            <div className="h-[34rem] sm:h-[28rem] lg:h-full">
              <Animation />
            </div>
          </div>
        </div>
      </SectionContent>
    </Section>
  )
}

function SkillBuilderSection() {
  const highlights = [
    {
      icon: PuzzlePieceIcon,
      title: 'Custom instructions',
      content:
        'Teach the agent policies, workflows, checklists, and domain rules that only load when relevant.',
    },
    {
      icon: CodeBracketSquareIcon,
      title: 'Executable functions',
      content:
        'Let Skills call APIs, transform data, generate files, create records, or return structured results.',
    },
    {
      icon: ArrowPathIcon,
      title: 'Iterate and publish',
      content:
        'Build, validate, test, improve, and enable Skills as customer-facing widget actions.',
    },
  ]

  return (
    <section id="docsbot-skill-builder" className="bg-gray-900 px-6 py-20 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-300">
            DocsBot Skill Builder
          </p>
          <h2 className="mt-4 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The sky is the limit
          </h2>
          <p className="mt-6 text-lg/8 text-gray-300">
            Describe the business capability you need, and DocsBot Skill Builder, an AI coding agent built right into DocsBot, helps create a custom Skill that can integrate with services, call APIs, run workflows, generate artifacts, or perform support functions for your customers and team.
          </p>
          <div className="mt-10 space-y-6">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="relative pl-10 text-base/7 text-gray-300">
                  <Icon className="absolute left-1 top-1 size-5 text-cyan-300" aria-hidden="true" />
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1">{item.content}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
            <Button theme="opalite" variant="primary" href="/register" label="Build your first Skill" />
            <Button
              theme="light"
              variant="secondary"
              href="/skills"
              label="Explore Skills"
            />
          </div>
        </div>
        <div>
          <SkillBuilderAnimation />
        </div>
      </div>
    </section>
  )
}

function UseCaseTabsSection() {
  const [active, setActive] = useState(0)
  const selected = useCases[active]
  const Icon = selected.icon

  return (
    <Section theme="medium">
      <SectionContent
        theme="medium"
        title="Built for revenue, support, and internal operators"
        description="The same action model scales from lean SMBs to enterprise shared-services teams: success and support, sales and RevOps, IT and service desk, finance, HR-facing intake, and engineering extensibility."
      >
        <div className="flex flex-wrap justify-center gap-3">
          {useCases.map((useCase, index) => (
            <button
              key={useCase.name}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                index === active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {useCase.name}
            </button>
          ))}
        </div>
        <div className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:grid-cols-[.9fr_1.1fr] lg:p-8">
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-cyan-600 text-white">
              <Icon className="size-7" />
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-gray-900">{selected.title}</h3>
            <p className="mt-4 text-base/7 text-gray-600">{selected.description}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {selected.highlights.map((highlight) => (
                <span key={highlight} className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                  {highlight}
                </span>
              ))}
            </div>
          </div>
          <EcosystemMapAnimation />
        </div>
      </SectionContent>
    </Section>
  )
}

function HeroSection() {
  return (
    <div className="-mt-24 bg-gray-900">
      <div className="relative isolate overflow-hidden bg-gray-900">
        <svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        >
          <defs>
            <pattern
              id="ai-actions-grid"
              x="50%"
              y={-1}
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <rect fill="url(#ai-actions-grid)" width="100%" height="100%" strokeWidth={0} />
        </svg>
        <div
          aria-hidden="true"
          className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
        >
          <div className="aspect-[1108/632] h-[70rem] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20 lg:h-[75rem]" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-32 sm:pt-40 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-1 pr-3 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
              <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                Actions
              </span>
              <span className="pl-2">AI agents that close the loop</span>
            </div>
            <h1 className="mt-8 text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
              AI agents that take action
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
              DocsBot already resolves an average 76% of support requests and deflects 89% of escalations. AI Actions extend that same agentic automation to customer-facing teams—support, success, and sales—and to internal operators in IT, finance, RevOps, and company-wide service desks, so your agent completes the work instead of only explaining it.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="bg-animation inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-base font-semibold text-white shadow transition-transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <SparklesIcon className="size-5" />
                Start building Actions
              </Link>
              <Link
                href="#docsbot-skill-builder"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-gray-900"
              >
                <PlayCircleIcon className="size-5" />
                See Skill Builder
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-14">
            <HeroActionAnimation />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
          <Brands
            title="Trusted by support, success, revenue, and internal teams building practical AI agents"
            transparent
          />
        </div>
      </div>
    </div>
  )
}

export default function AiActionsPage() {
  const pageUrl = buildPageUrl('/ai-actions')
  const webPage = buildWebPage({
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
  })
  const faqPage = buildFaqPage({
    url: pageUrl,
    mainEntity: buildFaqEntities(faqs),
  })
  const service = buildService({
    url: pageUrl,
    name: 'DocsBot AI Actions',
    description: pageDescription,
    serviceType: 'AI agent actions and workflow automation',
  })

  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, faqPage, service],
  }

  return (
    <>
      <JsonLd id="ai-actions-schema" data={schema} />
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: pageUrl,
          siteName: 'DocsBot',
          title: pageTitle,
          description: pageDescription,
          images: [
            {
              url: 'https://docsbot.ai/og-ai-actions.jpeg',
              width: 1200,
              height: 630,
              alt: 'DocsBot AI agents that take action',
              type: 'image/jpeg',
            },
          ],
        }}
        twitter={{
          handle: '@docsbotai',
          site: '@docsbotai',
          cardType: 'summary_large_image',
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content:
              'AI actions, AI agents, customer support automation, AI workflow automation, RevOps automation, IT service desk AI, internal AI agents, MCP connectors, MCP servers, DocsBot Skills, DocsBot Skill Builder, AI support agent',
          },
        ]}
      />
      <Head>
        <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>

      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />
          <main>
            <HeroSection />

            <SectionReveal direction="down" amount={0.25}>
              <ActionOpportunitySection />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <ActionCategoryGrid />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <ActionFeaturesSection />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <McpConnectorsSection />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <SkillBuilderSection />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <UseCaseTabsSection />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Security
                title="Actions with the right controls"
                description="Give your agent real capabilities while keeping every workflow inside the access, policy, and visibility boundaries your team defines."
                data={security}
              />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Testimonials
                title="Built for teams that need outcomes"
                description="From public help centers to private employee portals, DocsBot helps SMBs and enterprises move from faster answers to completed workflows across support, RevOps, IT, finance, and operations."
              />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Faq
                title="AI Actions FAQ"
                description="How DocsBot turns knowledge-backed conversations into agentic customer and business workflows."
                data={faqs}
                banner={{
                  variant: 'confetti',
                  title: 'Give your DocsBot real skills',
                  content:
                    'Start with your knowledge base, then add the actions, tools, and Skills your agent needs to finish more customer workflows.',
                  primaryButton: {
                    href: '/register',
                    label: 'Start free',
                  },
                  secondaryButton: {
                    href: '/skills',
                    label: 'Explore Skills',
                  },
                  isReversed: true,
                }}
              />
            </SectionReveal>
          </main>
          <Footer />
        </div>
      </div>

      <div className="bg-neutral-100 text-neutral-100" />
      <div className="bg-teal-100 text-teal-100" />
      <div className="bg-teal-500 text-teal-500" />
    </>
  )
}
