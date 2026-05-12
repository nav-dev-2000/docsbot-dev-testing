import Image from 'next/image'
import {
  BoltIcon,
  CalendarDaysIcon,
  CodeBracketSquareIcon,
  CreditCardIcon,
  CursorArrowRaysIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Button } from '@/components/elements'

const capabilityIcons = {
  skills: PuzzlePieceIcon,
  mcp: LinkIcon,
  apis: CodeBracketSquareIcon,
  webhooks: BoltIcon,
  buttons: CursorArrowRaysIcon,
  booking: CalendarDaysIcon,
  billing: CreditCardIcon,
  search: MagnifyingGlassIcon,
}

const baseCapabilities = [
  { key: 'skills', label: 'Skills', angle: -90 },
  { key: 'apis', label: 'APIs', angle: -45 },
  { key: 'webhooks', label: 'Webhooks', angle: 0 },
  { key: 'billing', label: 'Billing', iconSrc: '/branding/action-icons/stripe-white.svg', angle: 45 },
  { key: 'buttons', label: 'Buttons', angle: 90 },
  { key: 'mcp', label: 'MCP', iconSrc: '/branding/mcp/mcp-icon-white.svg', angle: 135 },
  { key: 'booking', label: 'Booking', angle: 180 },
  { key: 'search', label: 'Search', angle: 225 },
]

const variants = {
  home: {
    eyebrow: 'AI agents that can act',
    title: 'Move from answers to action',
    description:
      'DocsBot can automate processes and connect to the systems your business already uses, so your AI agent can do more than explain the next step.',
  },
  support: {
    eyebrow: 'Support automation that acts',
    title: 'Resolve more customer requests',
    description:
      'When a support question needs a lookup, policy check, billing action, booking, or handoff, AI Actions let DocsBot complete governed workflows inside your tools.',
  },
  internal: {
    eyebrow: 'Internal agents that get work done',
    title: 'Turn team questions into completed processes',
    description:
      'Employees can ask in plain language while DocsBot follows SOPs, starts approvals, creates tasks, updates records, and connects the tools your teams already use.',
  },
  docs: {
    eyebrow: 'Documentation that starts workflows',
    title: 'Turn documentation answers into next steps',
    description:
      'When a docs answer exposes missing information or a follow-up action, DocsBot can collect feedback, create issues, route support requests, book implementation help, or trigger product workflows.',
  },
}

function ActionSurfaceMap({ activeKeys }) {
  return (
    <div className="relative flex min-h-[30rem] flex-1 flex-col w-full overflow-hidden rounded-3xl border border-cyan-200 lg:border-r-0 lg:rounded-r-none bg-gradient-to-br from-gray-900 to-cyan-950 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute left-1/2 top-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20" />

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="flex size-36 flex-col items-center justify-center rounded-3xl bg-white text-center shadow-2xl ai-action-agent-pulse">
          <Image
            src="/branding/docsbot-icon-sq.svg"
            width={40}
            height={40}
            alt=""
            className="mb-2 size-10"
          />
          <p className="text-sm font-semibold text-gray-900">DocsBot agent</p>
          <p className="mt-1 text-xs text-gray-500">Knowledge + action</p>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 hidden size-[min(76%,22rem)] -translate-x-1/2 -translate-y-1/2 sm:block">
        {baseCapabilities.map((capability) => {
          const Icon = capabilityIcons[capability.key]
          const isActive = activeKeys.includes(capability.key)
          return (
            <div
              key={capability.key}
              className="orbit-arm absolute left-1/2 top-1/2 h-0 w-1/2 origin-left"
              style={{ '--orbit-angle': `${capability.angle}deg` }}
            >
              <div className="orbit-label absolute left-full top-0">
                <div
                  className={`flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xl ${
                    isActive ? 'ring-2 ring-cyan-300' : ''
                  }`}
                >
                  {capability.iconSrc ? (
                    <span className="flex size-5 items-center justify-center rounded-md bg-cyan-600">
                      <Image src={capability.iconSrc} width={18} height={18} alt="" className="size-4 object-contain" />
                    </span>
                  ) : (
                    <Icon className="size-5 text-cyan-600" aria-hidden="true" />
                  )}
                  {capability.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="absolute inset-x-5 bottom-5 z-20 flex flex-wrap justify-center gap-2 sm:hidden">
        {baseCapabilities.map((capability) => {
          const Icon = capabilityIcons[capability.key]
          return (
            <span key={capability.key} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800">
              <Icon className="size-3.5 text-cyan-700" aria-hidden="true" />
              {capability.label}
            </span>
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

        @keyframes aiActionAgentPulse {
          0%, 100% {
            box-shadow: 0 18px 45px rgba(8, 145, 178, 0.18), 0 0 0 0 rgba(34, 211, 238, 0.28);
          }
          50% {
            box-shadow: 0 18px 45px rgba(8, 145, 178, 0.24), 0 0 0 12px rgba(34, 211, 238, 0);
          }
        }

        .ai-action-agent-pulse {
          animation: aiActionAgentPulse 3.2s ease-in-out infinite;
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
          .ai-action-agent-pulse,
          .orbit-arm,
          .orbit-label {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

export default function AIActionContextSection({ variant = 'home', className = '' }) {
  const content = variants[variant] ?? variants.home
  const activeKeysByVariant = {
    home: ['skills', 'mcp', 'apis', 'webhooks'],
    support: ['billing', 'booking', 'buttons', 'skills'],
    internal: ['mcp', 'apis', 'webhooks', 'skills'],
    docs: ['skills', 'apis', 'booking', 'buttons'],
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={clsx(
        'w-full px-6 py-16 lg:px-8 lg:py-32',
        'bg-white',
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="min-w-0 lg:py-8">
            <div className="lg:max-w-lg">
              <p className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                {content.eyebrow}
              </p>
              <h2 className="mt-2 text-pretty text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {content.title}
              </h2>
              <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
                {content.description}
              </p>
              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <Button theme="opalite" variant="primary" href="/register" label="Automate Processes" />
                <Button
                  theme="dark"
                  variant="secondary"
                  href="/ai-actions"
                  label="Learn more →"
                />
              </div>
            </div>
          </div>

          <div
            className={clsx(
              'relative isolate flex h-full min-h-[28rem] min-w-0 items-stretch pointer-events-none lg:order-last',
              // Bleed to viewport edge: include lg section padding (2rem) plus slack inside padded zone when viewport > max-w-7xl + padding.
              'lg:-mr-[calc(2rem+max(0px,(100vw-4rem-80rem)/2))] lg:w-[calc(100%+2rem+max(0px,(100vw-4rem-80rem)/2))]'
            )}
            aria-hidden="true"
          >
            <ActionSurfaceMap activeKeys={activeKeysByVariant[variant] ?? activeKeysByVariant.home} />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
