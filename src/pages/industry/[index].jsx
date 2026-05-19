import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import TrustedBy from '@/components/TrustedBy'
import RegisterCTA from '@/components//RegisterCTA'
import { AskAIModels } from '@/components/customer-support/call-to-action/AskModels'
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
import { getIndustryCategoryPath } from '@/lib/industryCategoryPaths.mjs'
import { INDUSTRIES } from '@/constants/industries.constants'
import reviewLibrary from '@/data/industries/v2/reviews.json'
import generatedIndustryIndex from '@/data/industries/v2/generated.index.json'
import aoyagiAvatar from '@/images/avatars/aoyagi.jpg'
import messageAvatar1 from '@/images/avatars/avatar-1.png'
import messageAvatar2 from '@/images/avatars/avatar-2.png'
import messageAvatar3 from '@/images/avatars/avatar-3.png'
import messageAvatar4 from '@/images/avatars/avatar-4.png'
import messageAvatar5 from '@/images/avatars/avatar-5.png'
import messageAvatar6 from '@/images/avatars/avatar-6.png'
import messageAvatar7 from '@/images/avatars/avatar-7.png'
import messageAvatar8 from '@/images/avatars/avatar-8.png'
import messageAvatar9 from '@/images/avatars/avatar-9.png'
import arturoAvatar from '@/images/avatars/testimony1.jpeg'
import averyAvatar from '@/images/avatars/testimony7.png'
import cromwellAvatar from '@/images/avatars/thumb-matt-cromwell.jpg'
import defaultAvatar from '@/images/avatars/avatar-default.jpg'
import tejedaAvatar from '@/images/avatars/testimony8.jpeg'
import gobindaAvatar from '@/images/avatars/testimony2.jpeg'
import davidSacksAvatar from '@/images/avatars/davids.jpeg'
import lizaMockAvatar from '@/images/avatars/liza-mock.jpg'
import boweAvatar from '@/images/avatars/testimony3.jpeg'
import zachKatzAvatar from '@/images/avatars/zach-katz.jpg'
import steveBurgeAvatar from '@/images/avatars/steve-burge.jpg'
import musaSitholeAvatar from '@/images/avatars/musa-sithole.jpg'
import sanchayRoyAvatar from '@/images/avatars/sanchay-roy.jpg'
import habloAvatar from '@/images/avatars/hablo-logo.jpg'
import sonyAvatar from '@/images/avatars/sony-logo.jpg'
import wingarcAvatar from '@/images/avatars/wingarc.png'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Disclosure, Tab, TabGroup, TabList } from '@headlessui/react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import React from 'react'
import fs from 'fs'
import path from 'path'

// Function to dynamically import icons
const dynamicIconImport = (iconName) => {
  return dynamic(() =>
    import('@heroicons/react/20/solid').then((icons) => {
      const IconComponent = icons[iconName]
      if (!IconComponent) {
        return icons['LightBulbIcon']
      }
      return IconComponent
    })
  )
}

const getIndustryV2Path = (slug) =>
  path.join(process.cwd(), 'src', 'data', 'industries', 'v2', 'generated', `${slug}.json`)

const loadGeneratedIndustry = (slug) => {
  const filePath = getIndustryV2Path(slug)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const IconGlyph = ({ name, className = 'h-5 w-5', ariaHidden = true }) => {
  const Icon = dynamicIconImport(name)
  return <Icon className={className} aria-hidden={ariaHidden} />
}

const sourceNumberMap = (sources = []) =>
  sources.reduce((acc, source, index) => {
    acc[source.id] = index + 1
    return acc
  }, {})

const SourceRefs = ({ ids = [], sourceNumbers = {}, dark = false }) => {
  const visibleIds = (ids || []).filter((id) => sourceNumbers[id])
  if (!visibleIds.length) return null
  return (
    <span className={`ml-1 whitespace-nowrap align-super text-[11px] font-semibold leading-none ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>
      {visibleIds.map((id, index) => (
        <React.Fragment key={id}>
          <a href={`#source-${id}`} className="underline-offset-2 hover:underline">
            {sourceNumbers[id]}
          </a>
          {index < visibleIds.length - 1 ? ',' : ''}
        </React.Fragment>
      ))}
    </span>
  )
}

const SectionHeader = ({ eyebrow, title, children, align = 'left', dark = false, maxWidth = 'max-w-3xl' }) => (
  <div className={`${align === 'center' ? 'mx-auto text-center' : ''} ${maxWidth}`}>
    <h2
      className={`font-bold tracking-tight ${
        dark ? 'text-white' : 'text-gray-950'
      }`}
    >
      {eyebrow && (
        <span className={`block text-md/5 font-mono font-semibold uppercase tracking-widest ${
          dark ? 'text-cyan-300' : 'text-cyan-600'
        }`}>
          {eyebrow}
        </span>
      )}
      {eyebrow && <span className="sr-only">: </span>}
      <span className={`${eyebrow ? 'mt-2 block' : 'block'} text-3xl sm:text-4xl`}>{title}</span>
    </h2>
    {children && (
      <div className={`mt-5 text-base leading-7 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
        {children}
      </div>
    )}
  </div>
)

const SectionCtas = ({ primaryText = 'Get started for free', infoText = 'More info', infoHref, dark = false, align = 'left' }) => (
  <div className={`mt-6 flex flex-col gap-4 sm:flex-row ${align === 'center' ? 'justify-center' : ''}`}>
    <Link
      href="/register"
      className="bg-animation inline-flex items-center justify-center rounded-md px-6 py-4 text-base font-semibold text-white shadow transition-transform duration-300 hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
    >
      {primaryText}
    </Link>
    {infoHref && (
      <Link
        href={infoHref}
        className={`inline-flex items-center justify-center rounded-md border px-6 py-4 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 ${
          dark
            ? 'border-white/30 text-white hover:bg-white hover:text-gray-950 focus:ring-offset-gray-950'
            : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white focus:ring-offset-white'
        }`}
      >
        <span>{infoText}</span>
        <IconGlyph name="ArrowRightIcon" className="ml-2 h-4 w-4" />
      </Link>
    )}
  </div>
)

const DarkGridBackground = ({ variant = 'right' }) => (
  <>
    <svg
      aria-hidden="true"
      className={`absolute inset-0 -z-10 size-full stroke-white/10 ${
        variant === 'left'
          ? '[mask-image:radial-gradient(100%_100%_at_top_left,white,transparent)]'
          : '[mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]'
      }`}
    >
      <defs>
        <pattern
          x={variant === 'left' ? '0%' : '50%'}
          y={-1}
          id={`industry-dark-grid-${variant}`}
          width={200}
          height={200}
          patternUnits="userSpaceOnUse"
        >
          <path d="M.5 200V.5H200" fill="none" />
        </pattern>
      </defs>
      <svg
        x={variant === 'left' ? '0%' : '50%'}
        y={-1}
        className="overflow-visible fill-gray-800/20"
      >
        <path
          d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
          strokeWidth={0}
        />
      </svg>
      <rect
        fill={`url(#industry-dark-grid-${variant})`}
        width="100%"
        height="100%"
        strokeWidth={0}
      />
    </svg>
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-gray-950/85 via-gray-950/60 to-transparent"
    />
    <div
      aria-hidden="true"
      className={`absolute top-0 -z-10 transform-gpu blur-3xl ${
        variant === 'left'
          ? 'right-[calc(50%-12rem)] lg:right-[calc(50%+12rem)]'
          : 'left-[calc(50%-12rem)] lg:left-[calc(50%+10rem)]'
      }`}
    >
      <div
        className="aspect-[1108/632] h-[32rem] w-[46rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20"
        style={{
          clipPath:
            'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
        }}
      />
    </div>
  </>
)

const LightGridBackground = ({ variant = 'left' }) => (
  <svg
    aria-hidden="true"
    className={`absolute inset-0 -z-10 size-full stroke-gray-300/25 ${
      variant === 'left'
        ? '[mask-image:radial-gradient(80%_80%_at_top_left,white,transparent)]'
        : '[mask-image:radial-gradient(80%_80%_at_top_right,white,transparent)]'
    }`}
  >
    <defs>
      <pattern
        x={variant === 'left' ? '-20%' : '50%'}
        y={-1}
        id={`industry-light-grid-${variant}`}
        width={120}
        height={120}
        patternUnits="userSpaceOnUse"
      >
        <path d="M.5 120V.5H120" fill="none" />
      </pattern>
    </defs>
    <rect
      fill={`url(#industry-light-grid-${variant})`}
      width="100%"
      height="100%"
      strokeWidth={0}
    />
  </svg>
)

const groupBy = (items = [], getKey) =>
  items.reduce((acc, item) => {
    const key = getKey(item)
    acc[key] = [...(acc[key] || []), item]
    return acc
  }, {})

const formatPromptList = (items = []) => {
  const cleanItems = items.filter(Boolean)
  if (cleanItems.length <= 2) {
    return cleanItems.join(' and ')
  }

  return `${cleanItems.slice(0, -1).join(', ')}, and ${cleanItems[cleanItems.length - 1]}`
}

const slugify = (value = '') =>
  value
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

const generatedIndustrySlugs = new Set(generatedIndustryIndex.records.map((item) => item.slug))

const reviewAvatarById = {
  'sony-nuro-resolution-rate': sonyAvatar,
  'wingarc-ai-operations': aoyagiAvatar,
  'jack-arturo-wordpress-support': arturoAvatar,
  'brian-avery-education': averyAvatar,
  'matt-cromwell-content-library': cromwellAvatar,
  'gareth-it-marketing': defaultAvatar,
  'musa-40k-traders-self-service': musaSitholeAvatar,
  'sanchay-indned-ebike-support': sanchayRoyAvatar,
  'russell-hablo-travel-training': habloAvatar,
  'geovanny-rag-build-vs-buy': tejedaAvatar,
  'gobinda-training-materials': gobindaAvatar,
  'david-sacks-frontline-support': davidSacksAvatar,
  'liza-sentry-docs': lizaMockAvatar,
  'bowe-dollie-support': boweAvatar,
  'zach-katz-gravitykit': zachKatzAvatar,
  'steve-burge-publishpress': steveBurgeAvatar,
  'jpa-health-internal-decisioning': wingarcAvatar,
}

const balancedColumnCount = (itemCount, maxColumns = 3) => {
  const count = itemCount || 0
  if (count <= 1) return 1
  if (count === 2) return 2
  if (count === 3) return Math.min(3, maxColumns)
  if (count === 4) return Math.min(2, maxColumns)
  if (count === 5) return Math.min(3, maxColumns)
  if (count % 4 === 0 && maxColumns >= 4) return 4
  if (count % 3 === 0 && maxColumns >= 3) return 3
  if (count % 2 === 0) return Math.min(2, maxColumns)
  return Math.min(maxColumns, count)
}

const responsiveGridColumns = (items = [], maxColumns = 3) => {
  const columns = balancedColumnCount(items.length, maxColumns)
  const classNames = {
    1: '',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }
  return classNames[columns] || classNames[3]
}

const useRotatingIndex = (length, delay = 4200, offset = 0) => {
  const prefersReducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = React.useState(offset % Math.max(length, 1))

  React.useEffect(() => {
    if (prefersReducedMotion || length <= 1) return undefined
    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % length)
    }, delay)
    return () => window.clearInterval(interval)
  }, [delay, length, prefersReducedMotion])

  return activeIndex
}

const userMessageAvatars = [
  messageAvatar1,
  messageAvatar2,
  messageAvatar3,
  messageAvatar4,
  messageAvatar5,
  messageAvatar6,
  messageAvatar7,
  messageAvatar8,
  messageAvatar9,
]

const UseCaseWorkflowCard = ({ useCase, index }) => {
  const examples = useCase.exampleQuestionsOrRequests || []
  const activeExampleIndex = useRotatingIndex(examples.length, 2400, 0)
  const activeExample = examples[activeExampleIndex]
  const activeAvatar = userMessageAvatars[(index + activeExampleIndex) % userMessageAvatars.length]

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative isolate overflow-hidden bg-slate-950">
        <svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(85%_80%_at_top_right,white,transparent)]"
        >
          <defs>
            <pattern id={`use-case-chat-grid-${index}`} width={96} height={96} patternUnits="userSpaceOnUse">
              <path d="M.5 96V.5H96" fill="none" />
            </pattern>
          </defs>
          <rect fill={`url(#use-case-chat-grid-${index})`} width="100%" height="100%" strokeWidth={0} />
        </svg>
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-20 bottom-0 -z-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"
        />

        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/25">
                <IconGlyph name={useCase.icon} className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold leading-8 text-white sm:text-2xl sm:leading-9">
                  {useCase.name}
                </h3>
              </div>
            </div>
            <span className="hidden rounded-full bg-white/5 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200 ring-1 ring-white/10 sm:inline-flex">
              {(index + 1).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:p-6">
          <div className="flex min-h-[13rem] flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-cyan-950/20 sm:min-h-[22rem]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-sm font-semibold text-white">Example requests</p>
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                Online
              </span>
            </div>

            <div className="mt-4 flex flex-1 items-center sm:hidden">
              <AnimatePresence mode="wait">
                {activeExample && (
                  <motion.div
                    key={activeExample}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex w-full items-start gap-3"
                  >
                    <span className="relative mt-1 h-9 w-9 flex-none overflow-hidden rounded-full bg-slate-800 shadow-lg ring-2 ring-cyan-200">
                      <Image
                        src={activeAvatar}
                        alt=""
                        loading="eager"
                        sizes="36px"
                        className="h-full w-full object-cover"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-gray-950 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-200">
                      <span className="sr-only">Active request: </span>
                      {activeExample}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ul className="mt-4 hidden flex-1 flex-col justify-center gap-3 sm:flex">
              {examples.map((example, exampleIndex) => {
                const isActive = exampleIndex === activeExampleIndex
                const avatar = userMessageAvatars[(index + exampleIndex) % userMessageAvatars.length]

                return (
                  <motion.li
                    key={example}
                    layout
                    initial={{ opacity: 0, x: -12, y: 8 }}
                    animate={{
                      opacity: isActive ? 1 : 0.62,
                      x: 0,
                      y: isActive ? 0 : 4,
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: exampleIndex * 0.16 }}
                    className={`flex items-start gap-3 ${isActive ? '' : 'lg:scale-[0.98]'}`}
                  >
                    <span
                      className={`relative mt-1 h-9 w-9 flex-none overflow-hidden rounded-full bg-slate-800 shadow-lg ring-2 ${
                        isActive ? 'ring-cyan-200' : 'ring-white/10'
                      }`}
                    >
                      <Image
                        src={avatar}
                        alt=""
                        loading="eager"
                        sizes="36px"
                        className="h-full w-full object-cover"
                        aria-hidden="true"
                      />
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 transition ${
                        isActive
                          ? 'bg-white text-gray-950 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-200'
                          : 'bg-white/10 text-gray-200 ring-1 ring-white/10'
                      }`}
                    >
                      <span className="sr-only">{isActive ? 'Active request: ' : ''}</span>
                      {example}
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/20">
                  <img
                    src="/branding/docsbot-icon-sq.svg"
                    alt=""
                    className="h-5 w-5 object-contain"
                    aria-hidden="true"
                  />
                </span>
                <p className="text-sm font-semibold">Agent workflow</p>
              </div>
              <p className="mt-3 text-base leading-7 text-gray-300">{useCase.agentWorkflow}</p>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white p-4 text-gray-950 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700">Outcome</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">{useCase.businessOutcome}</p>
              </div>
              {useCase.liveContextOrTools && (
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-cyan-950 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] leading-6">TAKES ACTION</p>
                  <p className="mt-2 text-sm leading-6 text-cyan-900">{useCase.liveContextOrTools}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
        <p className="text-lg leading-8 text-gray-600">
          {useCase.problem}
          <SourceRefs ids={useCase.sourceIds} sourceNumbers={useCase.sourceNumbers} />
        </p>
      </div>
    </article>
  )
}

const UseCaseWorkflows = ({ useCases = [], sourceNumbers }) => {
  const hydratedUseCases = React.useMemo(
    () => useCases.map((useCase) => ({ ...useCase, sourceNumbers })),
    [sourceNumbers, useCases]
  )
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeUseCase = hydratedUseCases[activeIndex]
  const canSlide = hydratedUseCases.length > 1

  const goToPrevious = React.useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? hydratedUseCases.length - 1 : currentIndex - 1
    )
  }, [hydratedUseCases.length])

  const goToNext = React.useCallback(() => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % hydratedUseCases.length)
  }, [hydratedUseCases.length])

  if (!activeUseCase) return null

  return (
    <div className="mt-16 sm:mt-20">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
          {(activeIndex + 1).toString().padStart(2, '0')} / {hydratedUseCases.length.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="group relative">
        {canSlide && (
          <>
            <button
              type="button"
              onClick={(event) => {
                goToPrevious()
                event.currentTarget.blur()
              }}
              className="absolute left-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg border border-white/30 bg-white/75 text-gray-700 opacity-0 shadow-lg shadow-gray-950/10 backdrop-blur transition hover:bg-white hover:text-cyan-700 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-500 group-hover:opacity-100"
              aria-label="Show previous use case"
            >
              <IconGlyph name="ChevronLeftIcon" className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                goToNext()
                event.currentTarget.blur()
              }}
              className="absolute right-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg border border-white/30 bg-white/75 text-gray-700 opacity-0 shadow-lg shadow-gray-950/10 backdrop-blur transition hover:bg-white hover:text-cyan-700 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-500 group-hover:opacity-100"
              aria-label="Show next use case"
            >
              <IconGlyph name="ChevronRightIcon" className="h-6 w-6" />
            </button>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeUseCase.name}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <UseCaseWorkflowCard useCase={activeUseCase} index={activeIndex} />
          </motion.div>
        </AnimatePresence>
      </div>

      {canSlide && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {hydratedUseCases.map((useCase, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={useCase.name}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition ${
                  isActive ? 'w-10 bg-cyan-600' : 'w-2.5 bg-gray-300 hover:bg-cyan-300'
                }`}
                aria-label={`Show use case ${index + 1}: ${useCase.name}`}
                aria-current={isActive ? 'true' : undefined}
              />
            )
          })}
        </div>
      )}

      <div className="sr-only">
        {hydratedUseCases.map((useCase) => {
          const steps = [
            { label: 'Agent workflow', body: useCase.agentWorkflow },
            { label: 'Takes action', body: useCase.liveContextOrTools },
            { label: 'Outcome', body: useCase.businessOutcome },
          ].filter((step) => step.body)
          const examples = useCase.exampleQuestionsOrRequests || []

          return (
            <article key={`semantic-${useCase.name}`}>
              <h3>{useCase.name}</h3>
              <p>
                {useCase.problem}
                <SourceRefs ids={useCase.sourceIds} sourceNumbers={useCase.sourceNumbers} />
              </p>
              <ol>
                {steps.map((step) => (
                  <li key={step.label}>
                    <h4>{step.label}</h4>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
              {!!examples.length && (
                <>
                  <h4>Example requests</h4>
                  <ul>
                    {examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

const HeroProofBulletCard = ({ bullet }) => (
  <div className="flex h-32 gap-4 rounded-lg bg-white/[0.06] p-5 ring-1 ring-white/10">
    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20">
      <IconGlyph name={bullet.icon} className="h-6 w-6" />
    </span>
    <p className="line-clamp-3 text-lg font-semibold leading-8 text-gray-100">{bullet.text}</p>
  </div>
)

const HeroProofBulletTicker = ({ bullets = [] }) => {
  const prefersReducedMotion = useReducedMotion()
  const [isHydrated, setIsHydrated] = React.useState(false)
  const shouldAnimate = isHydrated && !prefersReducedMotion && bullets.length > 3
  const repeatedBullets = [...bullets, ...bullets.slice(0, 3)]
  const cardStepRem = 9
  const scrollYValues = [`0rem`]
  const scrollTimes = [0]

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  for (let index = 0; index < bullets.length; index += 1) {
    scrollYValues.push(`-${index * cardStepRem}rem`)
    scrollTimes.push((index + 0.7) / bullets.length)
    scrollYValues.push(`-${(index + 1) * cardStepRem}rem`)
    scrollTimes.push((index + 1) / bullets.length)
  }

  if (!shouldAnimate) {
    return (
      <div className="mt-5 space-y-4">
        {bullets.map((bullet) => (
          <HeroProofBulletCard key={bullet.text} bullet={bullet} />
        ))}
      </div>
    )
  }

  return (
    <div className="relative h-[26rem] overflow-hidden">
      <motion.div
        className="space-y-4"
        animate={{ y: scrollYValues }}
        transition={{
          duration: Math.max(14, bullets.length * 4),
          ease: 'easeInOut',
          repeat: Infinity,
          times: scrollTimes,
        }}
      >
        {repeatedBullets.map((bullet, index) => (
          <HeroProofBulletCard key={`${bullet.text}-${index}`} bullet={bullet} />
        ))}
      </motion.div>
      <div className="sr-only">
        {bullets.map((bullet) => (
          <p key={`crawler-${bullet.text}`}>{bullet.text}</p>
        ))}
      </div>
    </div>
  )
}

const RoleVisualPanel = ({ role, isReversed = false }) => {
  const panelRef = React.useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ['start end', 'end start'],
  })
  const gridY = useTransform(scrollYProgress, [0, 0.5, 1], [-18, 0, 18])
  const glowY = useTransform(scrollYProgress, [0, 0.5, 1], [-14, 0, 14])
  const largeY = useTransform(scrollYProgress, [0, 0.5, 1], [-16, 0, 16])
  const middleY = useTransform(scrollYProgress, [0, 0.5, 1], [-32, 0, 32])
  const smallY = useTransform(scrollYProgress, [0, 0.5, 1], [-50, 0, 50])

  return (
  <div className={`-mx-6 sm:mx-0 sm:px-6 lg:h-full lg:px-0 ${isReversed ? 'lg:order-first' : ''}`}>
    <div ref={panelRef} className="relative isolate flex h-full min-h-[24rem] overflow-hidden bg-gray-950 px-6 py-12 shadow-2xl shadow-cyan-950/20 ring-1 ring-gray-900/10 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:px-12 sm:py-16 lg:mx-0 lg:max-w-none">
      <motion.svg
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { y: gridY }}
        className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(80%_80%_at_center,white,transparent)]"
      >
        <defs>
          <pattern
            id={`role-visual-grid-${slugify(role.role)}`}
            width={96}
            height={96}
            x="50%"
            y={-1}
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 96V.5H96" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#role-visual-grid-${slugify(role.role)})`} strokeWidth={0} />
      </motion.svg>
      <div
        aria-hidden="true"
        className={`absolute -inset-y-px -z-10 w-full origin-bottom-left skew-x-[-24deg] bg-cyan-200/10 ring-1 ring-inset ring-white/10 ${
          isReversed ? '-right-10' : '-left-10'
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-3xl"
      >
        <motion.div
          style={prefersReducedMotion ? undefined : { y: glowY }}
          className="h-full w-full rounded-full bg-cyan-400/20"
        />
      </div>
      <div aria-hidden="true" className="absolute bottom-0 right-0 -z-10 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl" />
      <div aria-hidden="true" className="absolute left-8 top-8 h-20 w-20 rounded-full border border-cyan-200/10 bg-white/[0.03] blur-sm" />
      <div aria-hidden="true" className="absolute bottom-8 right-10 h-28 w-28 rounded-full border border-cyan-200/10 bg-cyan-300/[0.04] blur-md" />
      <div
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 ${
          isReversed ? '-left-24 sm:-left-32' : '-right-24 sm:-right-32'
        }`}
      >
        <motion.div style={prefersReducedMotion ? undefined : { y: largeY }}>
          <IconGlyph
            name={role.roleIcon}
            className="h-[36rem] w-[36rem] text-cyan-200/[0.07] drop-shadow-[0_0_90px_rgba(34,211,238,0.45)] sm:h-[46rem] sm:w-[46rem]"
          />
        </motion.div>
      </div>
      <div
        aria-hidden="true"
        className={`absolute top-[53%] -translate-y-1/2 ${
          isReversed ? 'left-10 sm:left-14' : 'right-10 sm:right-14'
        }`}
      >
        <motion.div style={prefersReducedMotion ? undefined : { y: middleY }}>
          <IconGlyph
            name={role.roleIcon}
            className="h-[24rem] w-[24rem] text-cyan-100/[0.12] blur-[1px] sm:h-[32rem] sm:w-[32rem]"
          />
        </motion.div>
      </div>
      <div
        aria-hidden="true"
        className={`absolute top-[58%] -translate-y-1/2 ${
          isReversed ? 'left-28 sm:left-44' : 'right-28 sm:right-44'
        }`}
      >
        <motion.div style={prefersReducedMotion ? undefined : { y: smallY }}>
          <IconGlyph
            name={role.roleIcon}
            className="h-[12rem] w-[12rem] text-cyan-300/[0.16] [filter:drop-shadow(0_0_32px_rgba(103,232,249,0.55))] sm:h-[17rem] sm:w-[17rem]"
          />
        </motion.div>
      </div>
      <div
        aria-hidden="true"
        className={`absolute top-1/2 h-40 w-80 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-3xl ${
          isReversed ? 'left-10' : 'right-10'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-y-8 w-px bg-gradient-to-b from-transparent via-cyan-200/30 to-transparent ${
          isReversed ? 'left-1/3' : 'right-1/3'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute bottom-10 h-px w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent ${
          isReversed ? 'left-8' : 'right-8'
        }`}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 sm:rounded-3xl" />
    </div>
  </div>
  )
}

const RoleAudienceSections = ({ roles = [], roleFaqs = {}, sourceNumbers = {} }) => (
  <div>
    {roles.map((role, index) => {
      const matchingFaqs = (roleFaqs[role.role] || []).slice(0, 2)
      const isReversed = index % 2 === 1

      return (
        <article
          key={role.role}
          className="py-16 first:pt-0 lg:py-24"
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-stretch">
            <div className="px-0 lg:pt-4">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                <h3 className="text-pretty text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                  {role.role}
                </h3>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  {role.roleContext}
                  <SourceRefs ids={role.sourceIds} sourceNumbers={sourceNumbers} />
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                  {(role.bullets || []).map((bullet) => (
                    <div key={bullet.text} className="relative pl-9">
                      <dt className="inline font-semibold text-gray-950">
                        <IconGlyph name={bullet.icon} className="absolute left-1 top-1 h-5 w-5 text-cyan-700" />
                        {bullet.text}
                        <SourceRefs ids={bullet.sourceIds} sourceNumbers={sourceNumbers} />
                      </dt>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <RoleVisualPanel role={role} isReversed={isReversed} />
          </div>

          {!!matchingFaqs.length && (
            <div className="mt-12">
              <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                {matchingFaqs.map((faq) => (
                  <a
                    key={faq.question}
                    href={`#faq-${slugify(faq.category || 'General buyer questions')}-${slugify(faq.question)}`}
                    className="text-sm font-semibold leading-6 text-cyan-700 transition hover:text-cyan-900"
                  >
                    <span>{faq.question}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      )
    })}
  </div>
)

const CustomerAgentRequestCard = ({ request, sourceNumbers, compact = false }) => {
  const sourceTypes = request.sourceTypes || []
  const action = request.optionalAction || 'Route the conversation to the right team with context attached.'

  return (
    <motion.article
      key={request.request}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-left shadow-2xl shadow-cyan-950/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20">
            <img src="/branding/docsbot-icon-sq.svg" alt="" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-6 text-white">DocsBot support agent</p>
            <p className="text-xs font-medium text-gray-400">Grounded response preview</p>
          </div>
        </div>
        <span className="flex-none rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
          Online
        </span>
      </div>

      <div className={`grid gap-5 p-4 sm:p-5 ${compact ? '' : 'xl:grid-cols-[minmax(0,1fr)_18rem]'}`}>
        <div className="min-w-0 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: compact ? 0 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.25, ease: 'easeOut' }}
            className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-base font-semibold leading-7 text-gray-950 shadow-lg sm:max-w-[74%]"
          >
            {request.request}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: compact ? 0 : -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.13, duration: 0.28, ease: 'easeOut' }}
            className="max-w-[96%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.07] p-4 shadow-lg sm:max-w-[86%]"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-200">Answer strategy</p>
            </div>
            <p className="text-sm leading-6 text-gray-200">
              {request.agentResponseStrategy}
              <SourceRefs ids={request.sourceIds} sourceNumbers={sourceNumbers} dark />
            </p>

            {!!sourceTypes.length && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Sources used</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sourceTypes.map((sourceType, index) => (
                    <motion.span
                      key={sourceType}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + index * 0.04, duration: 0.2, ease: 'easeOut' }}
                      className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-300/20"
                    >
                      {sourceType}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.28, ease: 'easeOut' }}
          className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4"
        >
          <div className="flex items-center gap-2 text-cyan-100">
            <IconGlyph name="BoltIcon" className="h-5 w-5" />
            <p className="text-sm font-semibold">Actions</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-300">{action}</p>
          <div className="mt-5 rounded-lg border border-white/10 bg-gray-950/70 p-3">
            <div className="space-y-3" aria-label="Bot action animation">
              {[
                { icon: 'MagnifyingGlassIcon', width: 88 },
                { icon: 'ClipboardDocumentListIcon', width: 76 },
                { icon: 'PaperAirplaneIcon', width: 68 },
              ].map((item, index) => (
                <motion.div
                  key={item.icon}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + index * 0.08, duration: 0.28, ease: 'easeOut' }}
                  className="flex items-center gap-3"
                >
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.08, 1] }}
                    transition={{ delay: 0.3 + index * 0.12, duration: 0.45, ease: 'easeOut' }}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20"
                  >
                    <IconGlyph name={item.icon} className="h-4 w-4" />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-1 items-center gap-2">
                        <motion.span
                          initial={{ opacity: 0.35, width: '42%' }}
                          animate={{ opacity: 0.85, width: `${item.width}%` }}
                          transition={{ delay: 0.3 + index * 0.08, duration: 0.45, ease: 'easeOut' }}
                          className="h-2 rounded-full bg-white/18"
                        />
                        <motion.span
                          initial={{ opacity: 0, width: '12%' }}
                          animate={{ opacity: 0.55, width: `${Math.max(14, item.width - 50)}%` }}
                          transition={{ delay: 0.42 + index * 0.08, duration: 0.35, ease: 'easeOut' }}
                          className="h-2 rounded-full bg-white/10"
                        />
                      </div>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.48 + index * 0.1, duration: 0.2, ease: 'easeOut' }}
                        className="h-1.5 w-1.5 flex-none rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]"
                      />
                    </div>
                    <motion.div
                      initial={{ width: '20%' }}
                      animate={{ width: `${item.width}%` }}
                      transition={{ delay: 0.28 + index * 0.08, duration: 0.5, ease: 'easeOut' }}
                      className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-cyan-300/70 to-teal-300/40"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>
    </motion.article>
  )
}

const CustomerAgentRequests = ({ requests = [], sourceNumbers }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const tabListRef = React.useRef(null)
  const tabRefs = React.useRef([])
  const prefersReducedMotion = useReducedMotion()
  const activeRequest = requests[selectedIndex]
  const lastIndex = Math.max(requests.length - 1, 0)
  const goToPrevious = () => setSelectedIndex((current) => (current === 0 ? lastIndex : current - 1))
  const goToNext = () => setSelectedIndex((current) => (current === lastIndex ? 0 : current + 1))

  React.useEffect(() => {
    const tabList = tabListRef.current
    const selectedTab = tabRefs.current[selectedIndex]
    if (!tabList || !selectedTab) return

    const tabListCenter = tabList.clientWidth / 2
    const selectedTabCenter = selectedTab.offsetLeft + selectedTab.offsetWidth / 2
    tabList.scrollTo({
      left: Math.max(0, selectedTabCenter - tabListCenter),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [prefersReducedMotion, selectedIndex])

  return (
    <>
      <div className="mt-16 grid gap-8 lg:hidden">
        {requests.map((request) => (
          <CustomerAgentRequestCard
            key={request.request}
            request={request}
            sourceNumbers={sourceNumbers}
            compact
          />
        ))}
      </div>

      <TabGroup
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
        className="mt-24 hidden lg:block"
      >
        <div className="relative">
          <TabList ref={tabListRef} className="flex max-w-full gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {requests.map((request, index) => (
              <Tab
                key={request.request}
                ref={(node) => {
                  tabRefs.current[index] = node
                }}
                className="w-[18rem] flex-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {({ selected }) => (
                  <div
                    className={`group relative flex h-full w-full items-center gap-3 rounded-xl border p-3 text-left outline-none ring-1 transition duration-200 ${
                      selected
                        ? 'border-cyan-200/90 bg-white/[0.07] text-white ring-2 ring-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_18px_45px_-24px_rgba(103,232,249,0.95)]'
                        : 'border-white/10 bg-white/[0.05] text-white ring-transparent hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/10 hover:ring-cyan-300/20 hover:shadow-lg hover:shadow-cyan-950/30'
                    }`}
                  >
                    {selected && (
                      <span className="pointer-events-none absolute inset-x-5 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    )}
                    <span
                      className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ring-1 ${
                        selected
                          ? 'bg-cyan-400/15 text-cyan-100 ring-cyan-300/40'
                          : 'bg-cyan-400/10 text-cyan-200 ring-cyan-400/20'
                      }`}
                    >
                      <IconGlyph name={request.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                        {request.request}
                      </p>
                    </div>
                  </div>
                )}
              </Tab>
            ))}
          </TabList>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent" />
        </div>

        <div className="relative mx-auto mt-5 max-w-5xl">
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-x-[calc(100%+0.35rem)] -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-2xl shadow-gray-950/35 backdrop-blur-md transition hover:bg-white/25 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 xl:flex"
            aria-label="Show previous customer request"
          >
            <IconGlyph name="ChevronLeftIcon" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 translate-x-[calc(100%+0.35rem)] -translate-y-1/2 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-2xl shadow-gray-950/35 backdrop-blur-md transition hover:bg-white/25 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 xl:flex"
            aria-label="Show next customer request"
          >
            <IconGlyph name="ChevronRightIcon" className="h-5 w-5" />
          </button>
          <AnimatePresence mode="wait">
            <div
              key={activeRequest?.request}
              role="tabpanel"
              aria-live="polite"
            >
              {activeRequest && (
                <CustomerAgentRequestCard request={activeRequest} sourceNumbers={sourceNumbers} />
              )}
            </div>
          </AnimatePresence>
        </div>
      </TabGroup>

      <div className="sr-only">
        {requests.map((request) => {
          const sourceTypes = request.sourceTypes || []
          const action = request.optionalAction || 'Route the conversation to the right team with context attached.'

          return (
            <article key={`semantic-${request.request}`}>
              <h3>{request.request}</h3>
              <h4>Answer strategy</h4>
              <p>
                {request.agentResponseStrategy}
                <SourceRefs ids={request.sourceIds} sourceNumbers={sourceNumbers} dark />
              </p>
              {!!sourceTypes.length && (
                <>
                  <h4>Sources used</h4>
                  <ul>
                    {sourceTypes.map((sourceType) => (
                      <li key={sourceType}>{sourceType}</li>
                    ))}
                  </ul>
                </>
              )}
              <h4>Actions</h4>
              <p>{action}</p>
            </article>
          )
        })}
      </div>
    </>
  )
}

const InternalAgentWorkflowBoard = ({ workflows = [], sourceNumbers = {} }) => {
  const [activeIndex, setActiveIndex] = React.useState(0)

  if (!workflows.length) return null

  const getWorkflowSteps = (workflow) => [
    {
      label: 'Workflow',
      body: workflow.agentWorkflow,
      icon: workflow.icon,
      tone: 'white',
    },
    {
      label: 'Takes Action',
      body: workflow.optionalAction,
      icon: 'BoltIcon',
      tone: 'cyan',
    },
    {
      label: 'Outcome',
      body: workflow.outcome,
      icon: 'CheckCircleIcon',
      tone: 'white',
    },
  ].filter((step) => step.body)
  const activeWorkflow = workflows[activeIndex] || workflows[0]
  const activeSteps = getWorkflowSteps(activeWorkflow)

  return (
    <div className="mt-16 sm:mt-20">
      <div className="space-y-6 lg:hidden">
        {workflows.map((workflow) => {
          const steps = getWorkflowSteps(workflow)

          return (
            <article key={`mobile-${workflow.name}`} id={`internal-workflow-mobile-${slugify(workflow.name)}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-950/5">
              <div className="relative isolate overflow-hidden border-b border-gray-200 bg-gray-50 p-6">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_42%)]" />
                <h3 className="text-3xl font-semibold leading-tight text-gray-950">
                  {workflow.name}
                </h3>
                <p className="mt-4 text-base leading-7 text-gray-700">
                  {workflow.problem}
                  <SourceRefs ids={workflow.sourceIds} sourceNumbers={sourceNumbers} />
                </p>
              </div>
              <ol className="grid gap-4 p-5">
                {steps.map((step) => (
                  <li
                    key={`${workflow.name}-${step.label}`}
                    className={`relative rounded-xl border p-5 shadow-sm ${
                      step.tone === 'cyan'
                        ? 'border-cyan-300 bg-cyan-950 text-white shadow-cyan-950/10'
                        : 'border-gray-200 bg-white text-gray-950'
                    }`}
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
                        step.tone === 'cyan'
                          ? 'bg-cyan-300 text-cyan-950 ring-1 ring-cyan-200'
                          : 'bg-gray-950 text-cyan-100 ring-1 ring-gray-800'
                      }`}>
                        <IconGlyph name={step.icon} className="h-5 w-5" />
                      </span>
                      <h4 className="text-base font-semibold leading-6">
                        {step.label}
                      </h4>
                    </div>
                    <p className={`mt-5 text-base leading-7 ${
                      step.tone === 'cyan' ? 'text-cyan-50' : 'text-gray-700'
                    }`}>
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </article>
          )
        })}
      </div>

      <div className="hidden gap-0 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-stretch">
      <aside className="hidden lg:block">
        <div className="sticky top-28 flex h-full min-h-[29rem] flex-col rounded-l-2xl border border-r-0 border-gray-200 bg-gray-950 p-3 text-white shadow-xl shadow-gray-950/10">
          <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">Workflows</p>
          <nav className="mt-5 flex flex-1 flex-col gap-3 pb-2" aria-label="Internal workflow index">
            {workflows.map((workflow, index) => {
              const isActive = activeIndex === index

              return (
                <button
                  type="button"
                  key={workflow.name}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={`group flex items-center gap-4 rounded-xl px-3 py-4 text-left transition ${
                    isActive
                      ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(20,184,166,0.32),0_10px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/10'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl ring-1 ${
                    isActive
                      ? 'bg-cyan-300/20 text-cyan-100 ring-cyan-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(20,184,166,0.28)]'
                      : 'bg-cyan-300/10 text-cyan-100 ring-cyan-300/20'
                  }`}>
                    <IconGlyph name={workflow.icon} className="h-6 w-6" />
                  </span>
                  <span className={`text-base font-semibold leading-6 ${
                    isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
                  }`}>
                    {workflow.name}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      <div>
        <AnimatePresence mode="wait">
            <motion.article
              key={activeWorkflow.name}
              id={`internal-workflow-${slugify(activeWorkflow.name)}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-950/5 lg:min-h-[29rem] lg:rounded-l-none"
            >
              <div>
                  <div className="relative isolate overflow-hidden border-b border-gray-200 bg-gray-50 p-6 sm:p-7">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_42%)]" />
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <h3 className="text-3xl font-semibold leading-tight text-gray-950 sm:text-4xl">
                          {activeWorkflow.name}
                        </h3>
                        <p className="mt-4 max-w-4xl text-base leading-7 text-gray-700">
                          {activeWorkflow.problem}
                          <SourceRefs ids={activeWorkflow.sourceIds} sourceNumbers={sourceNumbers} />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-white">
                    <motion.div
                      key={`connector-${activeWorkflow.name}`}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      className="pointer-events-none absolute left-12 top-12 hidden h-px w-[calc(100%-6rem)] origin-left bg-gradient-to-r from-cyan-200 via-cyan-400 to-emerald-300 lg:block"
                    />
                    <ol className="relative grid gap-4 p-5 sm:p-6 lg:grid-cols-3 lg:gap-5 lg:p-7">
                      {activeSteps.map((step, stepIndex) => (
                        <motion.li
                          key={`${activeWorkflow.name}-${step.label}`}
                          initial={{ opacity: 0, y: 14, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.34, delay: 0.18 + stepIndex * 0.16, ease: 'easeOut' }}
                          className={`relative rounded-xl border p-5 shadow-sm ${
                            step.tone === 'cyan'
                              ? 'border-cyan-300 bg-cyan-950 text-white shadow-cyan-950/10'
                              : 'border-gray-200 bg-white text-gray-950'
                          }`}
                        >
                          <div className="relative z-10 flex items-center gap-3">
                            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
                              step.tone === 'cyan'
                                ? 'bg-cyan-300 text-cyan-950 ring-1 ring-cyan-200'
                                : 'bg-gray-950 text-cyan-100 ring-1 ring-gray-800'
                            }`}>
                              <IconGlyph name={step.icon} className="h-5 w-5" />
                            </span>
                            <div>
                              <h4 className="text-base font-semibold leading-6">
                                {step.label}
                              </h4>
                            </div>
                          </div>
                          <p className={`mt-5 text-base leading-7 ${
                            step.tone === 'cyan' ? 'text-cyan-50' : 'text-gray-700'
                          }`}>
                            {step.body}
                          </p>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
              </div>
            </motion.article>
        </AnimatePresence>
      </div>
      </div>

      <div className="sr-only">
        {workflows.map((workflow) => {
          const steps = [
            { label: 'Workflow', body: workflow.agentWorkflow },
            { label: 'Takes Action', body: workflow.optionalAction },
            { label: 'Outcome', body: workflow.outcome },
          ].filter((step) => step.body)

          return (
            <article key={`semantic-${workflow.name}`}>
              <h3>{workflow.name}</h3>
              <p>{workflow.problem}</p>
              <ol>
                {steps.map((step) => (
                  <li key={step.label}>
                    <h4>{step.label}</h4>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
            </article>
          )
        })}
      </div>
    </div>
  )
}

const IndustryFAQSection = ({ business, faqGroups = {}, faqCategoryLinks = [], sourceNumbers = {} }) => {
  const categoryEntries = React.useMemo(() => Object.entries(faqGroups), [faqGroups])
  const categoryNames = React.useMemo(() => categoryEntries.map(([category]) => category), [categoryEntries])
  const [activeCategory, setActiveCategory] = React.useState(categoryNames[0] || '')
  const firstFaqId = categoryEntries[0]?.[1]?.[0]
    ? `faq-${slugify(categoryEntries[0][0])}-${slugify(categoryEntries[0][1][0].question)}`
    : ''
  const [expandedFaqId, setExpandedFaqId] = React.useState(firstFaqId)

  const categoryNav = React.useMemo(
    () => (faqCategoryLinks.length ? faqCategoryLinks.map(([category]) => category) : categoryNames),
    [categoryNames, faqCategoryLinks]
  )
  const getFaqId = React.useCallback((category, question) => `faq-${slugify(category)}-${slugify(question)}`, [])
  const openFirstFaqForCategory = React.useCallback((category) => {
    const firstFaq = faqGroups[category]?.[0]
    setActiveCategory(category)
    if (firstFaq) setExpandedFaqId(getFaqId(category, firstFaq.question))
  }, [faqGroups, getFaqId])

  React.useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (!hash) return

      for (const [category, faqs] of categoryEntries) {
        const categoryId = `faq-${slugify(category)}`
        if (hash === categoryId) {
          openFirstFaqForCategory(category)
          return
        }

        const matchedFaq = faqs.find((faq) => hash === getFaqId(category, faq.question))
        if (matchedFaq) {
          setActiveCategory(category)
          setExpandedFaqId(getFaqId(category, matchedFaq.question))
          return
        }
      }
    }

    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [categoryEntries, getFaqId, openFirstFaqForCategory])

  if (!categoryEntries.length) return null

  return (
    <section className="bg-gray-50 px-6 py-20 lg:px-8" id="faq">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Buyer FAQs" title={`${business} AI Agent Evaluation Questions`} align="center">
          <p>Practical questions from the roles that evaluate AI agents, automation fit, rollout effort, controls, reporting, and vendor trust.</p>
        </SectionHeader>

        {!!categoryNav.length && (
          <nav className="mt-10 flex gap-2 overflow-x-auto pb-2 text-sm lg:hidden" aria-label="FAQ categories">
            {categoryNav.map((category) => {
              const isActive = activeCategory === category
              return (
                <a
                  key={category}
                  href={`#faq-${slugify(category)}`}
                  onClick={() => openFirstFaqForCategory(category)}
                  className={`shrink-0 rounded-full px-3 py-1.5 font-semibold ring-1 transition ${
                    isActive
                      ? 'bg-gray-950 text-white shadow-sm ring-gray-950'
                      : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </a>
              )
            })}
          </nav>
        )}

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          {!!categoryNav.length && (
            <aside className="sticky top-28 hidden border-l border-gray-200 pl-4 lg:block">
              <nav className="space-y-1" aria-label="FAQ categories">
                {categoryNav.map((category) => {
                  const isActive = activeCategory === category
                  return (
                    <a
                      key={category}
                      href={`#faq-${slugify(category)}`}
                      onClick={() => openFirstFaqForCategory(category)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`block border-l-2 px-4 py-2.5 text-sm font-semibold leading-5 transition ${
                        isActive
                          ? 'border-cyan-600 text-gray-950'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-950'
                      }`}
                    >
                      {category}
                    </a>
                  )
                })}
              </nav>
            </aside>
          )}

          <div className="space-y-12">
            {categoryEntries.map(([category, faqs]) => (
              <section
                key={category}
                id={`faq-${slugify(category)}`}
                className="scroll-mt-28"
                onMouseEnter={() => setActiveCategory(category)}
                onFocus={() => setActiveCategory(category)}
              >
                <h3 className="border-b border-cyan-700 pb-4 text-2xl font-semibold leading-8 text-cyan-800">{category}</h3>
                <div className="divide-y divide-gray-200">
                  {faqs.map((faq) => {
                    const faqId = getFaqId(category, faq.question)

                    return (
                    <div key={faqId} className="group">
                      <h4 id={faqId} className="scroll-mt-32">
                        <button
                          type="button"
                          aria-expanded={expandedFaqId === faqId}
                          aria-controls={`${faqId}-answer`}
                          className="flex w-full items-start justify-between gap-8 py-5 text-left"
                          onClick={() => setExpandedFaqId(expandedFaqId === faqId ? '' : faqId)}
                        >
                          <span className="text-lg font-semibold leading-8 text-gray-900 group-hover:text-cyan-900">{faq.question}</span>
                          <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition ${
                            expandedFaqId === faqId
                              ? 'bg-transparent text-cyan-700 ring-cyan-700'
                              : 'bg-gray-50 text-gray-500 ring-gray-200 group-hover:bg-white group-hover:text-cyan-700'
                          }`} aria-hidden="true">
                            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${expandedFaqId === faqId ? 'rotate-180' : ''}`} />
                          </span>
                        </button>
                      </h4>
                      <div
                        id={`${faqId}-answer`}
                        className={`mb-5 border-l-2 border-cyan-800 pl-5 text-base leading-7 text-gray-700 ${
                          expandedFaqId === faqId ? '' : 'hidden'
                        }`}
                      >
                        {faq.answer}
                        <SourceRefs ids={faq.sourceIds} sourceNumbers={sourceNumbers} />
                      </div>
                    </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function IndustryPage({ business, industry, backgroundImage, data }) {
  const sourceNumbers = sourceNumberMap(data.evidenceSources)
  const reviewsById = Object.fromEntries(reviewLibrary.reviews.map((review) => [review.id, review]))
  const selectedReviews = (data.trustAndProof?.selectedReviewIds || [])
    .map((id) => reviewsById[id])
    .filter(Boolean)
  const roles = data.businessClarity.whoItHelps || []
  const agentUseCases = data.agentUseCases || []
  const internalWorkflows = data.internalAgent.workflows || []
  const featureMappings = data.docsbotFeatureMapping || []
  const trustClaims = data.trustAndProof.trustClaims || []
  const proofReviewItems = Array.from({
    length: Math.max(trustClaims.length, selectedReviews.length),
  }).flatMap((_, index) => {
    const proofItem = trustClaims[index]
      ? {
        type: 'proof',
        id: `proof-${index}`,
        text: trustClaims[index],
        icon: data.trustAndProof.trustClaimIcons?.[index] || 'ShieldCheckIcon',
      }
      : null
    const reviewItem = selectedReviews[index]
      ? {
        type: 'review',
        review: selectedReviews[index],
        id: `review-${selectedReviews[index].id}`,
      }
      : null
    return index % 2 === 0
      ? [proofItem, reviewItem].filter(Boolean)
      : [reviewItem, proofItem].filter(Boolean)
  })
  const faqGroups = groupBy(data.faq || [], (faq) => faq.category || 'General buyer questions')
  const faqCategoryLinks = Object.entries(faqGroups).filter(([, items]) => items.length > 1)
  const roleFaqs = groupBy(data.faq || [], (faq) => faq.role || 'General')
  const rolePromptList = formatPromptList(roles.map((role) => role.role))
  const rolePromptClause = rolePromptList ? `, especially for ${rolePromptList},` : ''
  const askAiPrompt = `Tell me why DocsBot is a good fit for ${business} teams${rolePromptClause} that need AI agents for customer-facing support, internal knowledge, and workflow automation.`
  const relatedIndustries = (data.relatedIndustrySlugs || [])
    .map((relatedSlug) => INDUSTRIES.find((item) => item.slug === relatedSlug))
    .filter((item) => item && generatedIndustrySlugs.has(item.slug))
  const pageUrl = buildPageUrl(data.pageMeta.canonicalPath)
  const pageTitle = `${data.pageMeta.title} - DocsBot`
  const pageDescription = data.pageMeta.description
  const industryCategoryPath = getIndustryCategoryPath(industry)
  const industryCategoryUrl = buildPageUrl(industryCategoryPath)
  const webPage = buildWebPage({
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
  })
  const faqPage = buildFaqPage({
    url: pageUrl,
    mainEntity: buildFaqEntities(data.faq || []),
  })
  const service = buildService({
    url: pageUrl,
    name: `${business} AI Agents by DocsBot`,
    description: pageDescription,
    serviceType: `${industry} AI agent automation`,
  })
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://docsbot.ai',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${industry} AI Agents`,
        item: industryCategoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business,
        item: pageUrl,
      },
    ],
  }

  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]
  webPage.breadcrumb = { '@id': breadcrumb['@id'] }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, service, faqPage, breadcrumb],
  }

  return (
    <>
      <JsonLd id={`industry-${data.slug}-schema`} data={schema} />
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        canonical={pageUrl}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/industry.jpeg',
              width: 1200,
              height: 630,
              alt: `${business} AI agents by DocsBot`,
              type: 'image/jpeg',
            },
          ],
        }}
      />
      <Header />
      <main className="bg-white">
        <section className="relative isolate overflow-hidden bg-gray-950 px-6 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:px-8">
          <img
            src={backgroundImage.url}
            alt={backgroundImage.alt}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950/55 via-gray-950/35 to-gray-950/10" />
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex text-sm font-semibold leading-6 text-cyan-100/90">
              <ol className="flex min-w-0 items-center gap-2">
                <li>
                  <Link href={industryCategoryPath} className="transition hover:text-white hover:underline hover:underline-offset-4">
                    {industry} AI Agents
                  </Link>
                </li>
                <li className="text-cyan-200/50" aria-hidden="true">/</li>
                <li className="min-w-0 truncate text-white" aria-current="page">{business}</li>
              </ol>
            </nav>
            <div className="inline-flex max-w-full items-center rounded-full bg-cyan-500/10 py-1 pl-1 pr-3 text-sm/6 font-semibold text-cyan-100 ring-1 ring-inset ring-cyan-500/20">
              <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                {industry}
              </span>
              <span className="truncate pl-2">{data.hero.eyebrow}</span>
            </div>
            <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <h1 className="text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
                  {data.hero.headline}
                </h1>
                <p className="mt-6 max-w-3xl text-pretty text-lg font-medium leading-8 text-gray-300 sm:text-xl/8">
                  {data.hero.subheadline}
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/register"
                    className="bg-animation inline-flex items-center justify-center rounded-md px-6 py-4 text-base font-semibold text-white shadow transition-transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {data.hero.primaryCta}
                  </Link>
                  <Link
                    href="#use-cases"
                    className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-gray-900"
                  >
                    {data.hero.secondaryCta}
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <div className="rounded-xl bg-gray-950/80 p-5 ring-1 ring-white/10">
                  <HeroProofBulletTicker bullets={data.hero.proofBullets || []} />
                </div>
              </div>
            </div>

          </div>
          <nav aria-label="Industry page sections" className="mx-auto mt-12 flex w-full justify-center px-6 lg:px-8">
            <div className="flex max-w-full flex-wrap justify-center gap-3 text-sm font-semibold text-white">
              <Link href="#roles" className="rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                Roles
              </Link>
              <Link href="#use-cases" className="rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                Use Cases
              </Link>
              <Link href="#customer-agent" className="rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                Customer Agents
              </Link>
              <Link href="#internal-agent" className="rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                Internal Agents
              </Link>
              <Link href="#faq" className="rounded-full border border-white/15 bg-white/10 px-5 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                FAQs
              </Link>
            </div>
          </nav>
          <div className="mx-auto mt-16 max-w-7xl border-t border-white/10 pt-10">
            <p className="mb-6 text-center text-sm font-semibold leading-6 text-gray-300">Trusted by teams using DocsBot</p>
            <TrustedBy />
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50 px-6 py-20 lg:px-8" id="roles">
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow={industry} title={`How DocsBot Helps ${business} Teams`} align="center" maxWidth="max-w-5xl">
              <p>{data.businessClarity.whatDocsBotDoes}</p>
            </SectionHeader>
            <div className="mt-16 sm:mt-20">
              <RoleAudienceSections roles={roles} roleFaqs={roleFaqs} sourceNumbers={sourceNumbers} />
            </div>
          </div>
        </section>

        <section className="px-6 py-20 lg:px-8" id="use-cases">
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow="Agent Workflows" title={`${business} AI Agent Use Cases`} align="center">
              <p>
                Each use case connects industry-specific work to DocsBot capabilities: source-grounded answers, live context, approved actions, and workflow guardrails where judgment matters.
              </p>
              <SectionCtas
                primaryText="Build an agent"
                infoText="More info"
                infoHref="/"
                align="center"
              />
            </SectionHeader>
            <UseCaseWorkflows useCases={agentUseCases} sourceNumbers={sourceNumbers} />
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-gray-950 px-6 py-20 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-cyan-300/30 after:to-transparent lg:px-8" id="customer-agent">
          <DarkGridBackground variant="left" />
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow="Customer-Facing Agents" title={data.customerFacingAgent.headline} align="center" dark>
              <p>{data.customerFacingAgent.intro}</p>
              <SectionCtas
                primaryText="Automate support"
                infoText="More info"
                infoHref="/customer-support"
                dark
                align="center"
              />
            </SectionHeader>
            <CustomerAgentRequests
              requests={data.customerFacingAgent.requests}
              sourceNumbers={sourceNumbers}
            />
          </div>
        </section>

        <section className="px-6 pb-20 pt-24 lg:px-8" id="internal-agent">
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow="Internal Knowledge Agents" title={data.internalAgent.headline} align="center">
              <p>{data.internalAgent.intro}</p>
              <SectionCtas
                primaryText="Create internal agent"
                infoText="More info"
                infoHref="/internal-knowledge"
                align="center"
              />
            </SectionHeader>
            <InternalAgentWorkflowBoard workflows={internalWorkflows} sourceNumbers={sourceNumbers} />
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-50 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow="Platform Capabilities" title={`AI Agents Trained on Your ${business} Knowledge`} align="center">
              <p>Connect service information, operating procedures, support content, and approved workflow actions so your agent can answer clearly and move requests forward.</p>
            </SectionHeader>
            <div className={`mt-16 grid gap-5 sm:mt-20 ${responsiveGridColumns(featureMappings, 4)}`}>
              {featureMappings.map((feature) => (
                <article key={feature.feature} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <IconGlyph name={feature.icon} className="h-6 w-6 text-cyan-700" />
                  <h3 className="mt-4 text-base font-semibold leading-7 text-gray-950">
                    {feature.feature}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {feature.industryApplication}
                    <SourceRefs ids={feature.sourceIds} sourceNumbers={sourceNumbers} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader eyebrow="Proof" title="Built for Teams That Need Accurate Answers and Clear Workflows" align="center" />
            <div className={`mt-16 grid gap-4 sm:mt-20 ${responsiveGridColumns(proofReviewItems, 3)}`}>
              {proofReviewItems.map((item) => {
                if (item.type === 'proof') {
                  return (
                    <figure key={item.id} className="relative isolate flex h-full flex-col overflow-hidden rounded-xl bg-gray-950 p-6 text-white shadow-lg">
                      <svg
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(85%_80%_at_top_right,white,transparent)]"
                      >
                        <defs>
                          <pattern id={`${item.id}-proof-grid`} width={64} height={64} patternUnits="userSpaceOnUse">
                            <path d="M.5 64V.5H64" fill="none" />
                          </pattern>
                        </defs>
                        <rect fill={`url(#${item.id}-proof-grid)`} width="100%" height="100%" strokeWidth={0} />
                      </svg>
                      <div className="absolute -right-16 -top-16 -z-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
                      <blockquote className="flex-1 text-sm font-medium leading-6 text-gray-100">{item.text}</blockquote>
                      <figcaption className="mt-6 flex items-center gap-3 text-sm font-semibold text-white">
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-300/20">
                          <IconGlyph name={item.icon} className="h-5 w-5" />
                        </span>
                      </figcaption>
                    </figure>
                  )
                }

                const review = item.review
                return (
                  <figure key={item.id} className="relative isolate flex h-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 p-6 text-white shadow-lg shadow-cyan-950/10 ring-1 ring-cyan-200/10">
                    <div className="absolute -right-12 -top-16 -z-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
                    <div className="absolute -bottom-20 left-6 -z-10 h-40 w-40 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true" />
                    <blockquote className="flex-1 text-sm leading-6 text-gray-200">“{review.quote}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 text-sm font-semibold text-white">
                      {reviewAvatarById[review.id] ? (
                        <Image
                          src={reviewAvatarById[review.id]}
                          alt=""
                          className="h-11 w-11 flex-none rounded-full bg-gray-800 object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-100 ring-1 ring-cyan-300/20">
                          {review.author?.slice(0, 1) || 'D'}
                        </span>
                      )}
                      <span>{review.author}</span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
            <div className="sr-only">
              {proofReviewItems.map((item) => {
                if (item.type === 'proof') {
                  return (
                    <article key={`semantic-${item.id}`}>
                      <h3>Proof point</h3>
                      <p>{item.text}</p>
                    </article>
                  )
                }

                const review = item.review
                return (
                  <article key={`semantic-${item.id}`}>
                    <h3>{review.author ? `Customer review from ${review.author}` : 'Customer review'}</h3>
                    <blockquote>{review.quote}</blockquote>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AskAIModels aiPrompt={askAiPrompt} />
          </div>
        </section>

        <IndustryFAQSection
          business={business}
          faqGroups={faqGroups}
          faqCategoryLinks={faqCategoryLinks}
          sourceNumbers={sourceNumbers}
        />

        <RegisterCTA customTitle={`Build a DocsBot AI agent for ${business}`} button="Get started for free!" />

        <section className="px-6 py-16 lg:px-8" aria-labelledby="sources-heading">
          <div className="mx-auto max-w-5xl">
            <h2 id="sources-heading" className="text-xl font-bold tracking-tight text-gray-950">Sources</h2>
            <ol className="mt-6 space-y-4 text-sm leading-6 text-gray-600">
              {(data.evidenceSources || []).map((source) => (
                <li key={source.id} id={`source-${source.id}`} className="scroll-mt-24">
                  <span className="font-semibold text-gray-950">{sourceNumbers[source.id]}. </span>
                  <a href={source.sourceUrl} className="font-semibold text-cyan-700 underline-offset-2 hover:underline">
                    {source.sourceTitle}
                  </a>
                  {source.sourceDate && <span> ({source.sourceDate})</span>}
                  <span className="block">{source.claim}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {!!relatedIndustries.length && (
          <section className="bg-gray-50 px-6 py-16 text-center lg:px-8">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">Related Industry Pages</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {relatedIndustries.map((item) => (
                  <Link key={item.slug} href={`/industry/${item.slug}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 ring-1 ring-gray-200 hover:bg-cyan-50">
                    {item.business}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-gray-200 bg-gray-50 px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Industry category breadcrumb" className="text-sm font-semibold leading-6 text-gray-600">
              <ol className="flex min-w-0 flex-wrap items-center gap-2">
                <li>
                  <Link href={industryCategoryPath} className="text-cyan-700 transition hover:text-cyan-900 hover:underline hover:underline-offset-4">
                    {industry} AI Agents
                  </Link>
                </li>
                <li className="text-gray-300" aria-hidden="true">/</li>
                <li className="min-w-0 truncate text-gray-950" aria-current="page">{business}</li>
              </ol>
            </nav>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
export async function getStaticPaths() {
  const paths = generatedIndustryIndex.records.map((item) => {
    return { params: { index: item.slug } }
  })
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const slug = context.params.index
  const data = loadGeneratedIndustry(slug)

  if (!data?.backgroundImage?.url) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      business: data.business,
      industry: data.industryCategory,
      backgroundImage: data.backgroundImage,
      data,
    },
  }
}
