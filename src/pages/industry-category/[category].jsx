import fs from 'fs'
import path from 'path'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import JsonLd from '@/components/seo/JsonLd'
import generatedIndustryIndex from '@/data/industries/v2/generated.index.json'
import { getIndustryCategoryPath, industryCategorySlug, resolveIndustryCategoryNameFromSlug } from '@/lib/industryCategoryPaths.mjs'
import {
  buildOrganization,
  buildPageUrl,
  buildService,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'

const getIndustryV2Path = (slug) =>
  path.join(process.cwd(), 'src', 'data', 'industries', 'v2', 'generated', `${slug}.json`)

const loadGeneratedIndustry = (slug) => {
  const filePath = getIndustryV2Path(slug)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const sentenceCase = (value = '') =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : ''

const stripTrailingPunctuation = (value = '') => value.replace(/[.!?]+$/g, '')

const optimizedIndustryImageUrl = (imageUrl, width = 900, { colorize = false } = {}) => {
  if (!imageUrl) return ''

  try {
    const url = new URL(imageUrl)
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('w', String(width))
    url.searchParams.set('q', '70')
    url.searchParams.delete('blend')
    url.searchParams.delete('blend-mode')
    url.searchParams.delete('sat')
    url.searchParams.delete('exp')
    url.searchParams.delete('blend-alpha')
    if (colorize) {
      url.searchParams.set('blend', '111827')
      url.searchParams.set('blend-mode', 'multiply')
      url.searchParams.set('blend-alpha', '88')
      url.searchParams.set('sat', '-100')
      url.searchParams.set('exp', '15')
    }
    return url.toString()
  } catch {
    return imageUrl
  }
}

const uniqueBy = (items = [], getKey) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getCategoryRecords = () => {
  const categories = new Map()
  for (const record of generatedIndustryIndex.records) {
    const categoryName = record.industryCategory
    if (!categoryName) continue
    const slug = industryCategorySlug(categoryName)
    if (!slug) continue
    const category = categories.get(slug)
    if (category) {
      category.count += 1
    } else {
      categories.set(slug, { name: categoryName, slug, count: 1 })
    }
  }
  return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const toIndustryCard = (data) => {
  if (!data?.slug || !data?.business || !data?.hero) return null
  return {
    slug: data.slug,
    business: data.business,
    title: data.pageMeta?.title || data.hero.headline || `${data.business} AI Agents`,
    description: data.pageMeta?.description || data.hero.subheadline || '',
    headline: data.hero.headline || `${data.business} AI agents`,
    subheadline: data.hero.subheadline || '',
    proofBullets: (data.hero.proofBullets || []).slice(0, 2),
    backgroundImage: data.backgroundImage,
  }
}

export async function getStaticPaths() {
  const paths = getCategoryRecords().map((category) => ({
    params: { category: category.slug },
  }))

  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const categoryName = resolveIndustryCategoryNameFromSlug(params?.category, generatedIndustryIndex.records)
  if (!categoryName) {
    return { notFound: true }
  }

  const industries = generatedIndustryIndex.records
    .filter((record) => record.industryCategory === categoryName)
    .map((record) => loadGeneratedIndustry(record.slug))
    .map(toIndustryCard)
    .filter(Boolean)
    .sort((a, b) => a.business.localeCompare(b.business))

  if (!industries.length) {
    return { notFound: true }
  }

  const categories = getCategoryRecords().filter((category) => category.name !== categoryName)
  const proofBullets = uniqueBy(
    industries.flatMap((industry) => industry.proofBullets),
    (bullet) => bullet.text,
  ).slice(0, 6)

  return {
    props: {
      categoryName,
      categorySlug: params.category,
      industries,
      proofBullets,
      categories,
    },
  }
}

export default function IndustryCategoryPage({
  categoryName,
  categorySlug,
  industries,
  proofBullets,
  categories,
}) {
  const [query, setQuery] = useState('')
  const filteredIndustries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return industries.filter((industry) => {
      if (!normalizedQuery) return true
      return [
        industry.business,
        industry.title,
        industry.description,
        industry.headline,
        industry.subheadline,
        ...(industry.proofBullets || []).map((bullet) => bullet.text),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [industries, query])

  const totalCount = industries.length
  const searchActive = query.trim().length > 0
  const featuredIndustry = industries[0]
  const h1Text = `${categoryName} AI Agents`
  const pageTitle = `${h1Text} | DocsBot`
  const pageDescription = `Explore ${totalCount} DocsBot AI agent examples for ${categoryName}. Compare industry-specific customer support, internal knowledge, and workflow automation use cases.`
  const canonicalPath = getIndustryCategoryPath(categoryName)
  const canonical = buildPageUrl(canonicalPath)
  const pageUrl = buildPageUrl(canonicalPath)
  const service = buildService({
    url: pageUrl,
    name: h1Text,
    description: pageDescription,
    serviceType: `${categoryName} AI agent automation`,
  })
  const webPage = buildWebPage({ url: pageUrl, name: pageTitle, description: pageDescription })
  webPage.mainEntity = { '@id': service['@id'] }
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
        name: 'Industry Categories',
        item: pageUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: pageUrl,
      },
    ],
  }
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, service, breadcrumb],
  }

  return (
    <>
      <JsonLd id={`industry-category-${categorySlug}-schema`} data={schema} />
      <NextSeo
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        openGraph={{
          type: 'website',
          url: canonical,
          siteName: 'DocsBot',
          title: pageTitle,
          description: pageDescription,
          images: [
            {
              url: 'https://docsbot.ai/images/og/industry.jpeg',
              width: 1200,
              height: 630,
              alt: `${categoryName} AI agents by DocsBot`,
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
      <main className="bg-white">
        <section className="relative isolate overflow-hidden bg-gray-950 px-6 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:px-8">
          {featuredIndustry.backgroundImage?.url && (
            <img
              src={featuredIndustry.backgroundImage.url}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 -z-10 bg-gray-950/60" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-950/75 via-gray-950/55 to-gray-950/35" />
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex max-w-full items-center rounded-full bg-cyan-500/10 py-1 pl-1 pr-3 text-sm/6 font-semibold text-cyan-100 ring-1 ring-inset ring-cyan-500/20">
              <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                {totalCount} industries
              </span>
              <span className="truncate pl-2">{categoryName}</span>
            </div>
            <div className="mt-8">
              <h1 className="text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
                {h1Text}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg font-medium leading-8 text-gray-300 sm:text-xl/8">
                Compare proven AI agent use cases for {categoryName.toLowerCase()} teams. See how DocsBot answers customer questions, retrieves internal knowledge, and supports approved workflows with source-grounded AI.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="#industry-list"
                  className="bg-animation inline-flex items-center justify-center rounded-md px-6 py-4 text-base font-semibold text-white shadow transition-transform duration-300 hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Explore {totalCount} AI agent examples
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Build an AI agent
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-gray-50 px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-cyan-700">Category overview</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                AI agent patterns across {categoryName}
              </h2>
              <p className="mt-5 text-base leading-7 text-gray-600">
                These industry examples show approved knowledge sources, customer-facing requests, internal SOP access, workflow routing, analytics, and human handoff needs that DocsBot can support.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proofBullets.map((bullet, index) => {
                const ValueIcon = [ChatBubbleLeftRightIcon, BookOpenIcon, MagnifyingGlassIcon][index % 3]
                return (
                  <article key={bullet.text} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                      <ValueIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-medium leading-6 text-gray-700">{sentenceCase(stripTrailingPunctuation(bullet.text))}.</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="industry-list" className="scroll-mt-24 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-sm font-semibold uppercase tracking-widest text-cyan-700">Industry examples</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  {`${searchActive ? filteredIndustries.length : totalCount} ${categoryName} AI agent examples`}
                </h2>
              </div>
              <div className="w-full lg:max-w-md">
                {searchActive && (
                  <p className="mb-4 text-sm leading-6 text-gray-600">
                    Keep filtering until you find the closest business type or workflow pattern.
                  </p>
                )}
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search in ${categoryName}`}
                    className="w-full rounded-full border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    aria-label={`Search industry examples in ${categoryName}`}
                  />
                  {query ? (
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault()
                        setQuery('')
                      }}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                      aria-label="Clear search"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIndustries.map((industry) => (
                <Link
                  key={industry.slug}
                  href={`/industry/${industry.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  {industry.backgroundImage?.url && (
                    <div className="relative h-36 overflow-hidden bg-gray-950">
                      <Image
                        src={optimizedIndustryImageUrl(industry.backgroundImage.url, 900, { colorize: true })}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover opacity-100 transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/45 to-gray-950/15" />
                      <p className="absolute bottom-4 left-4 right-4 text-2xl font-bold leading-8 text-white">
                        {industry.business}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold leading-8 text-gray-950 group-hover:text-cyan-700">
                      {industry.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-gray-600">{industry.description}</p>
                    <ul className="mt-5 space-y-3">
                      {industry.proofBullets.map((bullet) => (
                        <li key={bullet.text} className="flex gap-2 text-base leading-7 text-gray-700">
                          <CheckCircleIcon className="mt-1.5 h-4 w-4 flex-none text-cyan-700" />
                          <span>{stripTrailingPunctuation(bullet.text)}.</span>
                        </li>
                      ))}
                    </ul>
                    <span className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-cyan-700 group-hover:text-cyan-900">
                      Explore {industry.business} use case
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {!filteredIndustries.length ? (
              <div className="mt-10 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-base font-semibold text-gray-950">No matching industry examples in this category</p>
                <p className="mt-2 text-sm text-gray-600">Try a different search term.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-gray-50 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="font-mono text-sm font-semibold uppercase tracking-widest text-cyan-700">More categories</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Compare AI agent examples across other industries
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Explore adjacent categories to see how DocsBot supports different customer support, internal knowledge, and workflow automation patterns.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/industry-category/${category.slug}`}
                  className="group flex h-full items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  <span>
                    <span className="block text-lg font-bold leading-7 text-gray-950 group-hover:text-cyan-800">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-6 text-gray-600">
                      {category.count} industry examples
                    </span>
                  </span>
                  <ArrowRightIcon className="mt-1 h-5 w-5 flex-none text-cyan-700 transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
