import { Fragment, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Menu, Transition } from '@headlessui/react'
import {
  ArrowRightIcon,
  ArrowUpIcon,
  BoltIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JsonLd from '@/components/seo/JsonLd'
import {
  buildFaqEntities,
  buildFaqPage,
  buildOrganization,
  buildPageUrl,
  buildService,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'
import clsx from 'clsx'

import SkillIntegrationCard from '@/components/skills/SkillIntegrationCard'
import { skillCategorySlug } from '@/lib/skillsIntegrationPaths'
import { Squares2X2Icon } from '@heroicons/react/24/outline'

const pageTitle = 'AI Agent Skill Builder and Skills Library | DocsBot AI'
const pageDescription =
  'Build AI agent skills that securely use business integrations for customer support, internal team workflows, lookups, updates, handoffs, and approved actions with DocsBot Skill Builder.'

const faqs = [
  {
    question: 'What is DocsBot Skill Builder?',
    answer:
      'DocsBot Skill Builder is an AI coding agent that helps create reusable agent skills for your DocsBot agents. Describe the outcome in plain language, and Skill Builder designs, secures, tests, improves, and helps publish the Skill.',
  },
  {
    question: 'What are AI agent skills?',
    answer:
      'AI agent skills are reusable capabilities an agent can load when a conversation calls for a specific workflow. They can include instructions, business rules, reference files, templates, and executable functions that help the agent answer better or take approved action.',
  },
  {
    question: 'What is the difference between informational and executable skills?',
    answer:
      'Informational skills guide how an agent should answer, follow policies, or use reference material. Executable skills can also run code to call APIs, retrieve live data, create or update records, generate files, and return structured results to the agent.',
  },
  {
    question: 'Can DocsBot Skills connect to business software?',
    answer:
      'Yes. Skills can be built to work with approved APIs and services so an AI agent can look up data, update records, create handoffs, trigger workflows, and summarize outcomes inside the rules you define.',
  },
  {
    question: 'How do Skills work for customer support?',
    answer:
      'A customer-facing DocsBot chat widget or helpdesk-connected agent can use Skills while responding to customers, such as checking order status, creating a ticket, or preparing an escalation.',
  },
  {
    question: 'How do Skills work for internal teams?',
    answer:
      'Internal DocsBot agents can be used by employees in chat, Slack, or Microsoft Teams to retrieve information, follow SOPs, and complete approved workflows across company systems.',
  },
  {
    question: 'How does Skill Builder handle security?',
    answer:
      'Skill Builder designs Skills with secure configuration, protected secrets, scoped access, approval boundaries, and automated testing so actions stay within the permissions and rules you define.',
  },
]

function cleanHex(value, fallback) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : fallback
}

const CategoryPill = forwardRef(function CategoryPill({ active, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
        active ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

function SkillsCategoryFilter({ categories, category, onChange }) {
  const containerRef = useRef(null)
  const measureRefs = useRef([])
  const moreMeasureRef = useRef(null)
  const [visibleIndexes, setVisibleIndexes] = useState(() => new Set([0]))

  const categoryItems = useMemo(
    () => [{ name: 'All', count: null }, ...categories.map((item) => ({ name: item.name, count: item.count }))],
    [categories],
  )

  const calculateVisibleCategories = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth || 0
    if (!containerWidth) return

    const widths = categoryItems.map((_, index) => measureRefs.current[index]?.offsetWidth || 0)
    const moreWidth = moreMeasureRef.current?.offsetWidth || 0
    const gap = 8
    const allWidth = widths.reduce((total, width, index) => total + width + (index === 0 ? 0 : gap), 0)

    if (allWidth <= containerWidth) {
      setVisibleIndexes(new Set(categoryItems.map((_, index) => index)))
      return
    }

    const activeIndex = Math.max(
      0,
      categoryItems.findIndex((item) => item.name === category),
    )
    const requiredIndexes = [...new Set([0, activeIndex])]
    const nextVisible = new Set(requiredIndexes)
    let usedWidth =
      moreWidth +
      requiredIndexes.reduce((total, index) => total + widths[index], 0) +
      gap * requiredIndexes.length

    for (let index = 1; index < categoryItems.length; index += 1) {
      if (nextVisible.has(index)) continue
      const nextWidth = widths[index]
      if (usedWidth + nextWidth + gap <= containerWidth) {
        nextVisible.add(index)
        usedWidth += nextWidth + gap
      }
    }

    setVisibleIndexes(nextVisible)
  }, [category, categoryItems])

  useEffect(() => {
    calculateVisibleCategories()

    const resizeObserver = new ResizeObserver(calculateVisibleCategories)
    const container = containerRef.current
    if (container) resizeObserver.observe(container)
    window.addEventListener('resize', calculateVisibleCategories)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', calculateVisibleCategories)
    }
  }, [calculateVisibleCategories])

  const hiddenItems = categoryItems.filter((_, index) => !visibleIndexes.has(index))

  return (
    <div ref={containerRef} className="relative flex w-full min-w-0 flex-nowrap items-center gap-2 md:flex-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex flex-nowrap items-center gap-2 overflow-hidden opacity-0"
      >
        {categoryItems.map((item, index) => (
          <CategoryPill
            key={item.name}
            ref={(node) => {
              measureRefs.current[index] = node
            }}
            tabIndex={-1}
          >
            {item.name}
          </CategoryPill>
        ))}
        <CategoryPill
          ref={moreMeasureRef}
          tabIndex={-1}
          className="inline-flex items-center gap-1.5 px-4"
        >
          More
          <ChevronDownIcon className="h-4 w-4" />
        </CategoryPill>
      </div>

      {categoryItems.map((item, index) =>
        visibleIndexes.has(index) ? (
          <CategoryPill key={item.name} active={category === item.name} onClick={() => onChange(item.name)}>
            {item.name}
          </CategoryPill>
        ) : null,
      )}

      {hiddenItems.length ? (
        <Menu as="div" className="relative shrink-0">
          <Menu.Button
            className={clsx(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
              hiddenItems.some((item) => item.name === category)
                ? 'bg-slate-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            More
            <ChevronDownIcon className="h-4 w-4" aria-hidden />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-auto rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-900/10 focus:outline-none">
              {hiddenItems.map((item) => (
                <Menu.Item key={item.name}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => onChange(item.name)}
                      className={clsx(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition',
                        category === item.name
                          ? 'bg-slate-950 text-white'
                          : active
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-700',
                      )}
                    >
                      <span>{item.name}</span>
                      {item.count != null ? (
                        <span className={clsx('text-xs', category === item.name ? 'text-white/70' : 'text-slate-400')}>
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      ) : null}
    </div>
  )
}

function SkillBuilderAnimation() {
  const steps = [
    ['Researches', 64, 315, '#22d3ee'],
    ['Clarifies', 204, 315, '#38bdf8'],
    ['Writes code', 344, 315, '#14b8a6'],
    ['Verifies & tests', 484, 315, '#67e8f9'],
    ['Deploys', 624, 315, '#2dd4bf'],
  ]
  const logLines = [
    '> Reading API docs and auth requirements',
    '> Asking about allowed billing actions',
    '> Drafting TypeScript actions and schemas',
    '> Adding scoped customer permissions',
    '> Running imagined support scenarios',
    '> Fixing edge cases before launch',
  ]
  const repeatedLogLines = [...logLines, ...logLines, ...logLines, ...logLines]

  return (
    <svg
      viewBox="0 0 760 420"
      role="img"
      aria-label="AI coding interface where Skill Builder researches, asks questions, codes, tests, and publishes a DocsBot Skill"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="skill-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="skill-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <filter id="skill-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#020617" floodOpacity="0.25" />
        </filter>
        <clipPath id="skill-log-clip">
          <rect x="88" y="234" width="250" height="38" rx="6" />
        </clipPath>
      </defs>

      <g filter="url(#skill-soft-shadow)">
        <rect x="42" y="36" width="676" height="348" rx="22" fill="url(#skill-panel)" stroke="#23344f" />
        <rect x="42" y="36" width="676" height="44" rx="22" fill="#020617" />
        <path d="M42 58C42 45.85 51.85 36 64 36H696C708.15 36 718 45.85 718 58V80H42V58Z" fill="#020617" />
        <circle cx="70" cy="58" r="6" fill="#fb7185" />
        <circle cx="92" cy="58" r="6" fill="#fbbf24" />
        <circle cx="114" cy="58" r="6" fill="#34d399" />
        <text x="382" y="64" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="700">
          DocsBot Skill Builder
        </text>

        <text x="70" y="104" fill="#64748b" fontSize="13" fontWeight="700">
          Outcome
        </text>
        <rect x="58" y="114" width="644" height="66" rx="14" fill="#08111f" stroke="#24344d" />
        <text
          x="82"
          y="142"
          fill="#e2e8f0"
          fontSize="10.5"
          fontWeight="700"
          textLength="500"
          lengthAdjust="spacing"
        >
          Check billing status, open an approved follow-up workflow, notify the account owner,
        </text>
        <text
          x="82"
          y="164"
          fill="#e2e8f0"
          fontSize="10.5"
          fontWeight="700"
          textLength="454"
          lengthAdjust="spacing"
        >
          and update CRM notes once the customer approves the next step
        </text>
        <rect x="622" y="131" width="48" height="32" rx="10" fill="url(#skill-accent)" />
        <path
          d="M6 12 3.269 3.125A59.77 59.77 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.875L6 12Zm0 0h7.5"
          transform="translate(636.5 136.5) scale(0.86)"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g>
          <rect x="66" y="194" width="310" height="88" rx="14" fill="#0b1220" stroke="#1e3a5f" />
          <text x="90" y="221" fill="#67e8f9" fontSize="13" fontWeight="800">
            AI coding log
          </text>
          <g clipPath="url(#skill-log-clip)">
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="0 -120"
                dur="7.5s"
                repeatCount="indefinite"
              />
              {repeatedLogLines.map((label, index) => (
                <text key={`${label}-${index}`} x="90" y={245 + index * 20} fill="#cbd5e1" fontSize="11">
                  {label}
                </text>
              ))}
            </g>
          </g>
        </g>

        <g>
          <rect x="400" y="194" width="294" height="88" rx="14" fill="#ecfeff" />
          <circle cx="436" cy="238" r="22" fill="url(#skill-accent)" />
          <path d="M425 238h22M436 227v22" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          <text x="478" y="224" fill="#0f172a" fontSize="17" fontWeight="800">
            Skill package
          </text>
          <text x="478" y="248" fill="#475569" fontSize="12.5">
            Instructions, secure config,
          </text>
          <text x="478" y="266" fill="#475569" fontSize="12.5">
            scoped tools, tests, and action rules
          </text>
        </g>

        <path d="M100 324H660" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M100 324H660"
          stroke="url(#skill-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="90 470"
          className="motion-safe:animate-pulse"
        />
        {steps.map(([label, x, y, color], index) => {
          const fadeInStart = (index * 0.11).toFixed(2)
          const fadeInEnd = (index * 0.11 + 0.08).toFixed(2)

          return (
            <g key={label} opacity="0">
              <animate
                attributeName="opacity"
                values="0;0;1;1;0;0"
                keyTimes={`0;${fadeInStart};${fadeInEnd};0.82;0.92;1`}
                dur="6s"
                repeatCount="indefinite"
              />
              <circle cx={x + 36} cy={y + 9} r="17" fill="#0b1220" stroke={color} strokeWidth="3" />
              <text x={x + 36} y={y + 14} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
                {index + 1}
              </text>
              <text x={x + 36} y={y + 53} textAnchor="middle" fill="#dbeafe" fontSize="13" fontWeight="800">
                {label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default function SkillsPage({ records, categories, totalCount }) {
  const router = useRouter()
  const skillsLibrarySectionRef = useRef(null)
  const skillsLibraryBarRef = useRef(null)
  const skillsLibraryBarSentinelRef = useRef(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [isSkillsBarSticky, setIsSkillsBarSticky] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    const raw = router.query.category
    const q = Array.isArray(raw) ? raw[0] : raw
    if (q == null || q === '' || String(q).toLowerCase() === 'all') {
      setCategory('All')
      return
    }
    const decoded = typeof q === 'string' ? decodeURIComponent(q) : String(q)
    const valid = categories.some((c) => c.name === decoded)
    const next = valid ? decoded : 'All'
    setCategory(next)
  }, [router.isReady, router.query.category, categories])

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return records.filter((record) => {
      const matchesCategory = category === 'All' || record.category === category
      const matchesQuery =
        !normalizedQuery ||
        [record.name, record.category, record.description, record.domain]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [records, query, category])

  const groupedByCategory = useMemo(() => {
    const map = new Map()
    for (const record of filteredRecords) {
      const cat = record.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat).push(record)
    }
    const orderIndex = new Map(categories.map((c, i) => [c.name, i]))
    return [...map.entries()].sort((a, b) => {
      const ai = orderIndex.has(a[0]) ? orderIndex.get(a[0]) : Number.MAX_SAFE_INTEGER
      const bi = orderIndex.has(b[0]) ? orderIndex.get(b[0]) : Number.MAX_SAFE_INTEGER
      if (ai !== bi) return ai - bi
      return a[0].localeCompare(b[0])
    })
  }, [filteredRecords, categories])

  const searchActive = query.trim().length > 0

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory)
    const hash = '#skills-library'
    if (!router.isReady) return
    if (nextCategory === 'All') {
      router.replace(`/skills${hash}`, undefined, { shallow: true })
    } else {
      router.replace(`/skills?category=${encodeURIComponent(nextCategory)}${hash}`, undefined, { shallow: true })
    }
  }
  const handleQueryChange = (event) => {
    setQuery(event.target.value)
  }
  const handleClearQuery = () => {
    setQuery('')
  }
  const handleBackToSkills = () => {
    document.getElementById('skills-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    let animationFrame = null

    const updateSkillsBarStickyState = () => {
      if (animationFrame) return

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null

        const bar = skillsLibraryBarRef.current
        const sentinel = skillsLibraryBarSentinelRef.current
        const section = skillsLibrarySectionRef.current
        if (!bar || !sentinel || !section) return

        const stickyTop = Number.parseFloat(window.getComputedStyle(bar).top) || 0
        const sectionRect = section.getBoundingClientRect()
        const sectionIsActive = sectionRect.top <= stickyTop && sectionRect.bottom > stickyTop + bar.offsetHeight
        setIsSkillsBarSticky(sentinel.getBoundingClientRect().top <= stickyTop && sectionIsActive)
      })
    }

    updateSkillsBarStickyState()
    window.addEventListener('scroll', updateSkillsBarStickyState, { passive: true })
    window.addEventListener('resize', updateSkillsBarStickyState)

    return () => {
      window.removeEventListener('scroll', updateSkillsBarStickyState)
      window.removeEventListener('resize', updateSkillsBarStickyState)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  const pageUrl = buildPageUrl('/skills')
  const faqPage = buildFaqPage({ url: pageUrl, mainEntity: buildFaqEntities(faqs) })
  const service = buildService({
    url: pageUrl,
    name: 'DocsBot AI Skill Builder and Skills Library',
    description: pageDescription,
    serviceType: 'AI agent skills builder',
  })
  const webPage = buildWebPage({ url: pageUrl, name: pageTitle, description: pageDescription })
  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, service, faqPage],
  }

  return (
    <>
      <JsonLd id="skills-schema" data={schema} />
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        canonical="https://docsbot.ai/skills"
        openGraph={{
          type: 'website',
          url: pageUrl,
          siteName: 'DocsBot AI',
          title: pageTitle,
          description: pageDescription,
          images: [
            {
              url: 'https://docsbot.ai/og-skills.jpeg',
              width: 1200,
              height: 630,
              alt: 'DocsBot AI agent skills and Skill Builder',
              type: 'image/jpeg',
            },
          ],
        }}
        twitter={{
          handle: '@docsbotai',
          site: '@docsbotai',
          cardType: 'summary_large_image',
        }}
      />
      <Header />
      <main>
        <section className="relative isolate overflow-hidden bg-gray-900 text-white">
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="skills-hero-grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201H200Z"
                strokeWidth={0}
              />
            </svg>
            <rect fill="url(#skills-hero-grid)" width="100%" height="100%" strokeWidth={0} />
          </svg>
          <div
            aria-hidden="true"
            className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
          >
            <div
              style={{
                clipPath:
                  'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
              }}
              className="aspect-[1108/632] h-[70rem] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20 lg:h-[75rem]"
            />
          </div>
          <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-16 text-center lg:px-8 lg:py-24">
            <div className="flex max-w-4xl flex-col items-center justify-center">
              <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pr-1 pl-3 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
                <span className="pr-2">From Idea to</span>
                <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                  Action
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
                Build bots with AI agent skills
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-cyan-50/90">
                DocsBot Skill Builder turns plain-language workflow ideas into secure, tested AI agent skills. Use
                informational Skills to guide answers and executable Skills to connect customer support agents and
                internal team assistants to the tools your business already runs on.
              </p>
              <div className="w-full mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-center md:gap-6">
                <Link
                  href="#skills-library"
                  className="bg-animation rounded-md px-6 py-4 text-center text-base/6 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Explore the library
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-transparent px-6 py-4 text-center text-base/6 font-semibold text-white ring-2 ring-inset ring-white transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Start building
                </Link>
                <Link
                  href="/ai-actions"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-2 py-4 text-center text-base/6 font-semibold text-cyan-100 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Explore all AI Actions
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="mt-6 w-full max-w-5xl">
              <SkillBuilderAnimation />
            </div>
          </div>
        </section>

        <section className="bg-gray-100">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">AI agent skills</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Give your agent focused abilities it can load when needed
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Skills package the rules, context, examples, and code for a specific job. Your agent does not need to
                carry every workflow in every conversation; it can discover the right Skill, read deeper guidance only
                when relevant, and run approved actions only when the workflow calls for them.
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-6 bg-white">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Informational skills</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Better answers, policies, and procedures</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Informational agent skills teach a DocsBot how to perform a specific task: what to ask, which SOP or
                  policy to follow, which examples matter, what edge cases to watch for, and how to respond. They are
                  useful for support guidance, sales qualification, onboarding steps, internal procedures, and technical
                  troubleshooting.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-6 bg-white">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Executable skills</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Live data, files, records, and actions</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Executable agent skills add code that runs in a controlled runtime. They can call APIs, look up fresh
                  account or order data, create tickets, update approved fields, generate CSVs or PDFs, and return
                  structured results so the agent can explain what happened.
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Live lookups',
                  text: 'Look up live account, order, ticket, billing, or project data.',
                  Icon: CircleStackIcon,
                },
                {
                  title: 'New records',
                  text: 'Create records, handoffs, notes, tasks, or follow-up requests.',
                  Icon: ClipboardDocumentCheckIcon,
                },
                {
                  title: 'Approved updates',
                  text: 'Update approved fields after collecting the right customer context.',
                  Icon: PencilSquareIcon,
                },
                {
                  title: 'Workflow triggers',
                  text: 'Trigger internal workflows and SOPs inside business systems.',
                  Icon: BoltIcon,
                },
                {
                  title: 'Context summaries',
                  text: 'Summarize service state, history, risks, and next steps.',
                  Icon: DocumentTextIcon,
                },
                {
                  title: 'Generated artifacts',
                  text: 'Generate artifacts such as briefs, checklists, replies, and reports.',
                  Icon: WrenchScrewdriverIcon,
                },
              ].map(({ title, text, Icon }) => (
                <div key={title} className="rounded-lg border border-slate-200 p-5 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Skill Builder</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Describe the outcome.<br/>Skill Builder handles the agent work.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Skill Builder creates the instructions, reference files, and executable TypeScript functions an agent
                skill needs. It defines secure configuration values, protects secrets, scopes permissions, runs
                automated scenario tests, improves the Skill, and helps publish it to the right DocsBot agent.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['No-code direction', 'Non-technical teams describe the workflow while Skill Builder handles implementation details.', SparklesIcon],
                ['Secure by design', 'Secrets, auth, scoped users, network policy, and approval boundaries are part of the Skill design.', ShieldCheckIcon],
                ['Action ready', 'Executable Skills can call APIs, look up data, update records, create handoffs, and trigger workflows.', BoltIcon],
                ['Tested before launch', 'An automated testing agent checks imagined support and internal scenarios.', CheckCircleIcon],
              ].map(([title, text, Icon]) => (
                <div key={title} className="rounded-lg border border-slate-200 p-6 text-center">
                  <Icon className="mx-auto h-6 w-6 text-cyan-600" />
                  <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 rounded-lg border border-cyan-200 bg-cyan-50/60 p-6 text-left sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                    Infinite skill compatibility
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    Safely adapt public skill libraries for DocsBot agents
                  </h3>
                  <p className="mt-4 text-base leading-7 text-slate-700">
                    Skill Builder can start from public skill patterns, examples, and libraries, then reshape them for
                    your DocsBot support or internal agent with the right instructions, auth, scoped actions, and tests.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ['Import ideas', 'Use public Skills and examples as starting points.', CircleStackIcon],
                    ['Adapt safely', 'Convert them into scoped DocsBot abilities with secure configuration.', ShieldCheckIcon],
                    ['Run anywhere', 'Publish the finished Skill to the customer or team agent that needs it.', SparklesIcon],
                  ].map(([title, text, Icon]) => (
                    <div key={title} className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm">
                      <Icon className="h-5 w-5 text-cyan-700" />
                      <h4 className="mt-3 text-sm font-semibold text-slate-950">{title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Where agent skills run</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  The same Skill Builder can power support and internal work
                </h2>
                <p className="mt-5 text-base leading-7 text-slate-300">
                  Build a Skill once, then publish it to the DocsBot agent that needs it. Customer-facing agents use
                  Skills during support conversations, while private team agents use the same pattern for employee
                  workflows in chat, Slack, or Microsoft Teams.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  {
                    title: 'Customer-facing support agents',
                    text:
                      'Deploy Skills in a DocsBot website chat widget or helpdesk-connected agent so actions are scoped to the customer in the current conversation, using only the account, order, ticket, or request context the agent is allowed to handle.',
                    Icon: ChatBubbleLeftRightIcon,
                    chips: ['Website chat', 'Customer-scoped actions', 'Helpdesk tickets'],
                  },
                  {
                    title: 'Private internal team agents',
                    text:
                      'Give employees a private DocsBot agent so they can retrieve context, follow SOPs, and complete approved workflows across internal services.',
                    Icon: UserGroupIcon,
                    chips: ['Team chat', 'Slack or Teams', 'Internal SOPs'],
                  },
                ].map(({ title, text, Icon, chips }) => (
                  <div
                    key={title}
                    className="relative overflow-hidden rounded-lg border border-cyan-300/20 bg-white/5 p-6 shadow-2xl"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_36%),linear-gradient(135deg,rgba(20,184,166,0.10),transparent_52%)]"
                    />
                    <div className="relative z-10">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/20">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-5 text-2xl font-semibold text-white">{title}</h3>
                      <p className="mt-4 text-sm leading-6 text-slate-300">{text}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-white/10"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section ref={skillsLibrarySectionRef} id="skills-library" className="bg-white">
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            {/* Section: Header */}
            <div id="skills-library--header" className="mb-4">
              <p className="-mb-1 text-sm font-semibold uppercase tracking-wide text-cyan-700">Skills Library</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                AI agent skills for your tools
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Find AI agent skills for your tools—then tune them for customer support or internal teams.
              </p>
            </div>

            {/* Section: Control Bar */}
            <div ref={skillsLibraryBarSentinelRef} aria-hidden="true" className="h-px" />
            <div ref={skillsLibraryBarRef} id="skills-library--bar" className="sticky top-0 z-10 md:top-4">
              <div
                className={clsx(
                  '-mx-6 rounded-lg bg-white px-6 pb-6 pt-4 transition-shadow',
                  'md:mx-0 md:flex md:gap-x-6 md:rounded-2xl md:border md:border-slate-200 md:px-4 md:py-4',
                  {
                    ['shadow-lg md:shadow-md md:shadow-slate-200']: isSkillsBarSticky,
                  },
                )}
              >
                <div
                  className={clsx(
                    'flex items-center gap-1 mb-2 text-slate-800',
                    'md:flex-none md:mb-0',
                  )}
                >
                  <Squares2X2Icon className="size-6" />
                  <p className="text-base/6 font-bold">Skills</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4 w-full md:mb-0 md:w-80 md:shrink-0 lg:w-[26rem] xl:w-[28rem]">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search integrations"
                    className={clsx(
                      'w-full rounded-full border border-slate-300 py-2 px-10 text-sm outline-none',
                      'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100',
                    )}
                  />

                  {query ? (
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleClearQuery()
                      }}
                      onClick={(event) => {
                        event.preventDefault()
                        handleClearQuery()
                      }}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Category Buttons */}
                <SkillsCategoryFilter categories={categories} category={category} onChange={handleCategoryChange} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleBackToSkills}
              aria-label="Back to Skills Library"
              aria-hidden={!isSkillsBarSticky}
              tabIndex={isSkillsBarSticky ? 0 : -1}
              className={clsx(
                'fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 ring-1 transition duration-200 ease-out motion-reduce:transition-none',
                'bg-slate-950 text-white ring-white/10 hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white md:bottom-8 md:right-8',
                isSkillsBarSticky
                  ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-3 scale-95 opacity-0',
              )}
            >
              <ArrowUpIcon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Back to Skills</span>
            </button>

            <div className="mt-10 flex flex-col gap-12">
              {groupedByCategory.map(([categoryName, sectionRecords]) => (
                <div key={categoryName}>
                  <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                      {categoryName} AI Skills
                    </h3>
                    <Link
                      href={`/skills/${skillCategorySlug(categoryName)}`}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-cyan-700 underline-offset-4 hover:text-cyan-800 hover:underline"
                    >
                      View all {categoryName} skills
                      <ArrowRightIcon className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {sectionRecords.map((record) => (
                      <SkillIntegrationCard
                        key={record.slug}
                        record={record}
                        showDescription={searchActive}
                        showFooterCta={searchActive}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!filteredRecords.length ? (
              <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center">
                <p className="text-sm font-semibold text-slate-900">No matching Skills found</p>
                <p className="mt-2 text-sm text-slate-600">Try another integration name or category.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="relative isolate overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-900 px-6 py-12 shadow-2xl sm:px-10 lg:px-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.25),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.4),rgba(8,47,73,0.55))]"
              />
              <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-300/20">
                    <LockClosedIcon className="h-4 w-4" />
                    Secure, tested agent skills
                  </div>
                  <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Give your DocsBot agent the skills your workflows need
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                    Start from the Skills Library or describe the outcome in plain language. Skill Builder researches,
                    asks clarifying questions, writes the Skill, tests it, and helps publish it to the right DocsBot
                    agent.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/register"
                      className="bg-animation inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-base/6 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden />
                      Start building skills
                    </Link>
                    <Link
                      href="#skills-library"
                      className="inline-flex items-center justify-center rounded-md border border-white/25 px-6 py-4 text-base/6 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      Explore the library
                    </Link>
                    <Link
                      href="/ai-actions"
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-300/30 px-6 py-4 text-base/6 font-semibold text-cyan-100 transition hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      See all AI Actions
                      <ArrowRightIcon className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    [
                      'Research',
                      'Search the web, docs, GitHub, libraries, and package managers to identify the right abilities, APIs, and workflow shape.',
                    ],
                    [
                      'Build',
                      'The agent creates secure actions scoped to the users chatting with the bot, plus instructions for any process or ability.',
                    ],
                    ['Test', 'Our AI testing agent runs imagined support and internal scenarios before launch.'],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-cyan-200">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export async function getStaticProps() {
  const {
    getSkillCategoryCounts,
    getSkillsIndexRecords,
    mapSkillIntegrationToLibraryCard,
  } = await import('@/lib/skillsIntegrations')

  const records = getSkillsIndexRecords()
  const libraryRecords = records.map(mapSkillIntegrationToLibraryCard).filter(Boolean)
  return {
    props: {
      records: libraryRecords,
      categories: getSkillCategoryCounts(records),
      totalCount: libraryRecords.length,
    },
  }
}
