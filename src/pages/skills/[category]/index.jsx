import fs from 'fs'
import path from 'path'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { NextSeo } from 'next-seo'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JsonLd from '@/components/seo/JsonLd'
import SkillIntegrationCard from '@/components/skills/SkillIntegrationCard'
import {
  buildFaqEntities,
  buildFaqPage,
  buildOrganization,
  buildPageUrl,
  buildService,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'
import { resolveSkillCategoryNameFromSlug, skillCategorySlug } from '@/lib/skillsIntegrationPaths'

const CATEGORY_PSEO_PATH = path.join(process.cwd(), 'src/data/skills/category-pseo.json')

function readCategoryPseoFile() {
  try {
    const raw = fs.readFileSync(CATEGORY_PSEO_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { categories: {} }
  }
}

function normalizeCategoryPseo(categoryName, fileData) {
  const raw = fileData?.categories?.[categoryName]
  if (!raw || typeof raw !== 'object') return null
  const introParagraph =
    typeof raw.introParagraph === 'string' && raw.introParagraph.trim() ? raw.introParagraph.trim() : ''
  const whatYouCanBuild = Array.isArray(raw.whatYouCanBuild)
    ? raw.whatYouCanBuild.map((s) => String(s).trim()).filter(Boolean)
    : []
  const faq = Array.isArray(raw.faq)
    ? raw.faq
        .map((item) => ({
          question: typeof item?.question === 'string' ? item.question.trim() : '',
          answer: typeof item?.answer === 'string' ? item.answer.trim() : '',
        }))
        .filter((item) => item.question && item.answer)
    : []
  if (!introParagraph && whatYouCanBuild.length === 0 && faq.length === 0) return null
  return { introParagraph, whatYouCanBuild, faq }
}

function buildCategoryMetaDescription(intro, categoryName, totalCount) {
  if (intro) {
    const t = intro.replace(/\s+/g, ' ').trim()
    if (t.length <= 170) return t
    const cut = t.slice(0, 167).trim()
    const lastSpace = cut.lastIndexOf(' ')
    const end = lastSpace > 120 ? lastSpace : cut.length
    return `${cut.slice(0, end)}…`
  }
  return `Explore ${totalCount} DocsBot Skill ideas for ${categoryName}. Build secure agent skills for customer support and internal workflows.`
}

export async function getStaticPaths() {
  const { getSkillsIndexRecords } = await import('@/lib/skillsIntegrations')
  const records = getSkillsIndexRecords()
  const categorySegments = [...new Set(records.map((r) => skillCategorySlug(r.category)))]

  return {
    paths: categorySegments.map((category) => ({ params: { category } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const {
    getSkillsIndexRecords,
    getSkillCategoryCounts,
    mapSkillIntegrationToLibraryCard,
  } = await import('@/lib/skillsIntegrations')

  const records = getSkillsIndexRecords()
  const categoryName = resolveSkillCategoryNameFromSlug(params?.category, records)
  if (!categoryName) {
    return { notFound: true }
  }

  const libraryRecords = records
    .filter((record) => record.category === categoryName)
    .map(mapSkillIntegrationToLibraryCard)
    .filter(Boolean)

  const pseo = normalizeCategoryPseo(categoryName, readCategoryPseoFile())
  const otherCategories = getSkillCategoryCounts(records).filter((item) => item.name !== categoryName)

  return {
    props: {
      categoryName,
      categorySlug: params.category,
      records: libraryRecords,
      totalCount: libraryRecords.length,
      pseo,
      otherCategories,
    },
  }
}

export default function SkillCategoryHubPage({
  categoryName,
  categorySlug,
  records,
  totalCount,
  pseo,
  otherCategories,
}) {
  const [query, setQuery] = useState('')

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return records.filter((record) => {
      if (!normalizedQuery) return true
      return [record.name, record.category, record.description, record.domain]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [records, query])

  const searchActive = query.trim().length > 0

  const h1Text = `${categoryName} AI Skills`
  const pageTitle = `${h1Text} | DocsBot AI`
  const introBody =
    pseo?.introParagraph ||
    `Browse DocsBot Skill Builder ideas for integrations and workflows in ${categoryName}. Each Skill packages guidance and executable actions your agents can load when needed.`
  const pageDescription = buildCategoryMetaDescription(pseo?.introParagraph, categoryName, totalCount)
  const canonical = `https://docsbot.ai/skills/${categorySlug}`
  const pageUrl = buildPageUrl(`/skills/${categorySlug}`)

  const faqEntities = pseo?.faq?.length ? buildFaqEntities(pseo.faq) : []
  const faqPage =
    faqEntities.length > 0 ? buildFaqPage({ url: pageUrl, mainEntity: faqEntities }) : null
  const service = buildService({
    url: pageUrl,
    name: h1Text,
    description: pageDescription,
    serviceType: `${categoryName} AI agent skills`,
  })
  const webPage = buildWebPage({ url: pageUrl, name: pageTitle, description: pageDescription })
  webPage.mainEntity = { '@id': service['@id'] }
  if (faqPage) {
    webPage.hasPart = [{ '@id': faqPage['@id'] }]
  }
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Skills',
        item: buildPageUrl('/skills'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: h1Text,
        item: pageUrl,
      },
    ],
  }
  const schemaGraph = [buildOrganization(), buildWebSite(), webPage, service, breadcrumb]
  if (faqPage) schemaGraph.push(faqPage)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': schemaGraph,
  }

  return (
    <>
      <JsonLd id={`skills-category-${categorySlug}-schema`} data={schema} />
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        openGraph={{
          type: 'website',
          url: canonical,
          siteName: 'DocsBot AI',
          title: pageTitle,
          description: pageDescription,
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
                id="skills-category-hero-grid"
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
            <rect fill="url(#skills-category-hero-grid)" width="100%" height="100%" strokeWidth={0} />
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
          <div className="relative mx-auto max-w-7xl px-6 pt-6 text-left lg:px-8 lg:pt-8">
            <Link
              href="/skills#skills-library"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Skills Library
            </Link>
          </div>
          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-16 pt-8 text-center lg:px-8 lg:pb-24 lg:pt-10">
            <div className="flex w-full max-w-6xl flex-col items-center justify-center">
              <h1 className="text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {h1Text}
              </h1>
              <p className="mx-auto mt-6 max-w-6xl text-pretty text-lg leading-8 text-cyan-50/90">{introBody}</p>
              <div className="mt-10 flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Link
                  href="/register"
                  className="bg-animation inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-center text-base/6 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden />
                  Start building
                </Link>
                <Link
                  href="#category-skills-library"
                  className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/[0.03] px-6 py-4 text-base/6 font-semibold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  View {totalCount.toLocaleString()} {categoryName} Skills
                </Link>
              </div>
            </div>
          </div>
        </section>

        {pseo?.whatYouCanBuild?.length ? (
          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">What you can build</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Agent Skills for {categoryName}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Examples of outcomes teams create with DocsBot Skill Builder for this category—then tune, secure, and
                  publish them to customer-facing or internal agents.
                </p>
              </div>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pseo.whatYouCanBuild.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                      <BoltIcon className="h-5 w-5" />
                    </span>
                    <p className="text-sm leading-6 text-slate-800">{line}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section id="category-skills-library" className="scroll-mt-24 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-6 text-left lg:flex-row lg:items-end lg:justify-between">
              <div className="lg:mx-0 lg:max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {`${searchActive ? filteredRecords.length : totalCount} ${categoryName} Agent Skills`}
                </h2>
                <p className="mt-2 w-full max-w-none text-sm leading-6 text-slate-600 lg:max-w-xl">
                  {searchActive
                    ? 'Keep filtering until you see your stack, then review example flows you can mirror in your helpdesk or team chat.'
                    : 'Look for systems your team already uses and see how to build DocsBot AI agents that deliver real wins for customer support and internal workflows.'}
                </p>
              </div>
              <div className="relative w-full lg:mx-0 lg:max-w-sm">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search in ${categoryName}`}
                  className="w-full rounded-full border border-slate-300 bg-white py-3 pl-11 pr-11 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  aria-label={`Search skills in ${categoryName}`}
                />
                {query ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault()
                      setQuery('')
                    }}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecords.map((record) => (
                <SkillIntegrationCard
                  key={record.slug}
                  record={record}
                  showDescription
                  showFooterCta={false}
                />
              ))}
            </div>

            {!filteredRecords.length ? (
              <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-slate-900">No matching Skills in this category</p>
                <p className="mt-2 text-sm text-slate-600">Try a different search term.</p>
              </div>
            ) : null}

            <div className="mt-10 border-t border-slate-200 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Browse other categories</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/skills#skills-library"
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  All
                </Link>
                {otherCategories.map((item) => (
                  <Link
                    key={item.name}
                    href={`/skills/${skillCategorySlug(item.name)}`}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    {item.name} ({item.count})
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {pseo?.faq?.length ? (
          <section className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">FAQ</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {categoryName} AI Skills questions
                </h2>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {pseo.faq.map((item, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-6">
                    <h3 className="text-base font-semibold text-slate-950">{item.question}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

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
                    Ready to ship {categoryName} skills your agents can rely on?
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                    Combine Ideas from this category with plain-language goals. Skill Builder researches, tightens the
                    design, tests customer and internal scenarios, and helps you publish secure Skills to the right
                    DocsBot agent—even when you need tools outside {categoryName}.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/register"
                      className="bg-animation inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-base/6 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden />
                      Start building skills
                    </Link>
                    <Link
                      href="/ai-actions"
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-base/6 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      See all AI Actions
                      <ArrowRightIcon className="h-5 w-5" aria-hidden />
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
