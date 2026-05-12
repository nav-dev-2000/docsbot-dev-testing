import { Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import JsonLd from '@/components/seo/JsonLd'
import docsbotLogo from '@/images/logos/docsbot-logo.svg'
import {
  buildFaqEntities,
  buildFaqPage,
  buildHowTo,
  buildOrganization,
  buildPageUrl,
  buildService,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'
import {
  getSkillIntegrationPath,
  skillCategorySlug,
} from '@/lib/skillsIntegrationPaths.mjs'

function cleanHex(value, fallback) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : fallback
}

function getReadableTextColor(backgroundColor) {
  const hex = cleanHex(backgroundColor, '#0891b2').slice(1)
  const channels = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  return luminance > 0.48 ? '#0f172a' : '#ffffff'
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Link known skill category names in plain text (word-boundary safe). */
function linkSkillCategoriesInText(text, categoryHubs, linkClassName) {
  if (typeof text !== 'string' || !text.length || !categoryHubs?.length) return text
  const sorted = [...categoryHubs].sort((a, b) => b.name.length - a.name.length)
  const pattern = sorted.map(({ name }) => `\\b${escapeRegExp(name)}\\b`).join('|')
  if (!pattern) return text
  const re = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(re)
  return parts.map((part, i) => {
    const hub = sorted.find((h) => h.name === part)
    if (hub) {
      return (
        <Link key={`${i}-${part}`} href={hub.href} className={linkClassName}>
          {part}
        </Link>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function buildSkillCategoryHubs(records = []) {
  const byName = new Map()
  for (const r of records) {
    if (r?.category) {
      byName.set(r.category, `/skills/${skillCategorySlug(r.category)}`)
    }
  }
  return [...byName.entries()].map(([name, href]) => ({ name, href }))
}

function SkillLinkCard({ record }) {
  const primaryColor = cleanHex(record.brand?.primaryColor, '#0891b2')
  const logo = record.brand?.preferredLogo || {
    url: record.brand?.logoUrl || record.brand?.iconUrl,
    mode: 'unknown',
  }
  const skillPath = getSkillIntegrationPath(record)
  const categoryPath = `/skills/${skillCategorySlug(record.category)}`

  return (
    <div
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTopColor: primaryColor, borderTopWidth: 4 }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={skillPath}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 transition group-hover:border-cyan-200 ${
            logo.mode === 'dark' ? 'bg-slate-950' : 'bg-white'
          }`}
        >
          <img
            src={logo.url}
            alt={`${record.name} logo`}
            className="max-h-7 max-w-7 object-contain"
            loading="lazy"
          />
        </Link>
        <div className="min-w-0">
          <Link href={skillPath}>
            <h3 className="truncate text-sm font-semibold text-slate-950 group-hover:text-cyan-700">{record.name}</h3>
          </Link>
          <Link
            href={categoryPath}
            className="mt-0.5 block truncate text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-cyan-700 hover:decoration-cyan-500"
          >
            {record.category}
          </Link>
        </div>
      </div>
      <Link href={skillPath} className="mt-4 block text-sm leading-6 text-slate-600 group-hover:text-slate-800">
        {record.metaDescription}
      </Link>
    </div>
  )
}

function Section({ eyebrow, title, children, className = 'bg-white' }) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">{eyebrow}</p> : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  )
}

const bodyCategoryLinkClass =
  'font-semibold text-cyan-700 underline decoration-cyan-700/35 underline-offset-2 hover:text-cyan-800 hover:decoration-cyan-800/50'

export default function SkillIntegrationPage({ record, relatedSkills, skillCategoryHubs }) {
  const primaryColor = cleanHex(record.brand?.primaryColor, '#0891b2')
  const accentColor = cleanHex(record.brand?.accentColor, '#14b8a6')
  const heroTextColor = getReadableTextColor(primaryColor)
  const mutedHeroTextColor = heroTextColor === '#ffffff' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(15, 23, 42, 0.78)'
  const subtleHeroTextColor = heroTextColor === '#ffffff' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.88)'
  const heroBorderColor = heroTextColor === '#ffffff' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(15, 23, 42, 0.24)'
  const heroBadgeBackground = heroTextColor === '#ffffff' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.72)'
  const ctaTextColor = getReadableTextColor(accentColor)
  const companyLogo = record.brand?.preferredLogo || {
    url: record.brand?.logoUrl || record.brand?.iconUrl,
    mode: 'unknown',
    type: record.brand?.logoUrl ? 'logo' : 'icon',
  }
  const usesDarkLogoCard = companyLogo.mode === 'dark' || companyLogo.mode === 'has_opaque_background'
  const companyLogoPanelClassName = usesDarkLogoCard ? 'px-4 py-3' : 'px-4 py-2'
  const heroCardClassName = usesDarkLogoCard
    ? 'relative overflow-hidden rounded-lg border border-cyan-300/20 bg-gray-900 p-6 text-white shadow-2xl'
    : 'rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-2xl'
  const heroCardLabelClassName = usesDarkLogoCard ? 'font-semibold text-slate-400' : 'font-semibold text-slate-500'
  const heroCardValueClassName = usesDarkLogoCard ? 'mt-1 text-slate-100' : 'mt-1 text-slate-900'
  const pageUrl = buildPageUrl(getSkillIntegrationPath(record))
  const ctaText =
    record.availability === 'install'
      ? 'Install this skill in your DocsBot agent'
      : 'Build this agent skill'

  const faqPage = buildFaqPage({ url: pageUrl, mainEntity: buildFaqEntities(record.faq) })
  const howTo = buildHowTo({
    url: pageUrl,
    name: `How to build a ${record.name} Skill with DocsBot`,
    description: record.metaDescription,
    steps: record.howItWorks.map((step) => ({
      name: step.title,
      text: step.description,
    })),
  })
  const service = buildService({
    url: pageUrl,
    name: record.h1,
    description: record.metaDescription,
    serviceType: `${record.name} AI agent Skill`,
  })
  const webPage = buildWebPage({ url: pageUrl, name: record.metaTitle, description: record.metaDescription })
  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }, { '@id': howTo['@id'] }]
  const categoryHubPath = `/skills/${skillCategorySlug(record.category)}`
  const heroIntroLinkClass =
    heroTextColor === '#ffffff'
      ? 'font-semibold text-white underline decoration-white/45 underline-offset-2 hover:decoration-white'
      : 'font-semibold text-slate-950 underline decoration-slate-900/30 underline-offset-2 hover:decoration-slate-900/60'
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
        name: record.category,
        item: buildPageUrl(categoryHubPath),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: record.name,
        item: pageUrl,
      },
    ],
  }
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, service, howTo, faqPage, breadcrumb],
  }

  return (
    <>
      <JsonLd id={`${record.slug}-skill-schema`} data={schema} />
      <NextSeo
        title={record.metaTitle}
        description={record.metaDescription}
        canonical={`https://docsbot.ai${getSkillIntegrationPath(record)}`}
        openGraph={{
          type: 'website',
          url: `https://docsbot.ai${getSkillIntegrationPath(record)}`,
          siteName: 'DocsBot',
          title: record.metaTitle,
          description: record.metaDescription,
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
        <section style={{ backgroundColor: primaryColor, color: heroTextColor }}>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={categoryHubPath}
                className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Skills Library
              </Link>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <Link
                  href={categoryHubPath}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-85"
                  style={{ backgroundColor: heroBadgeBackground, color: heroTextColor }}
                >
                  {record.category}
                </Link>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: heroBadgeBackground, color: heroTextColor }}
                >
                  {record.availability === 'install' ? 'Install ready' : 'Ready to build'}
                </span>
              </div>
            </div>
            <div
              className="mt-10 grid gap-10 [grid-template-areas:'intro'_'card'_'ctas'] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:[grid-template-areas:'intro_card'_'ctas_card']"
            >
              <div className="[grid-area:intro]">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">{record.h1}</h1>
                <p className="mt-6 max-w-3xl text-lg leading-8" style={{ color: mutedHeroTextColor }}>
                  {linkSkillCategoriesInText(record.intro, skillCategoryHubs, heroIntroLinkClass)}
                </p>
              </div>
              <aside className={`${heroCardClassName} [grid-area:card]`}>
                {usesDarkLogoCard ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_36%),linear-gradient(135deg,rgba(20,184,166,0.12),transparent_48%)]"
                  />
                ) : null}
                <div className="relative z-10 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.8fr)] sm:items-center lg:block">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-16 w-full min-w-0 items-center justify-center">
                      <img
                        src={companyLogo.url}
                        alt={`${record.name} logo`}
                        className={`max-h-16 w-full object-contain ${companyLogoPanelClassName}`}
                      />
                    </div>
                    <span className="text-xl font-semibold leading-none text-slate-300" aria-hidden="true">
                      +
                    </span>
                    <div className="flex h-9 w-full min-w-0 items-center justify-center">
                      <Image
                        src={docsbotLogo}
                        alt="DocsBot logo"
                        className="max-h-8 w-full object-contain"
                        style={usesDarkLogoCard ? { filter: 'brightness(0) invert(1)' } : null}
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{record.name}</h2>
                    <dl className="mt-5 space-y-4 text-sm">
                      <div>
                        <dt className={heroCardLabelClassName}>Domain</dt>
                        <dd className={heroCardValueClassName}>{record.brand.domain || record.domain}</dd>
                      </div>
                      <div>
                        <dt className={heroCardLabelClassName}>Skill category</dt>
                        <dd className={heroCardValueClassName}>
                          <Link
                            href={categoryHubPath}
                            className={
                              usesDarkLogoCard
                                ? 'underline decoration-cyan-300/40 underline-offset-2 transition hover:text-white hover:decoration-cyan-200'
                                : 'underline decoration-cyan-700/35 underline-offset-2 hover:decoration-cyan-700'
                            }
                          >
                            {record.category}
                          </Link>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </aside>
              <div className="[grid-area:ctas] flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-center text-base/6 font-semibold shadow-sm transition-transform hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: accentColor, color: ctaTextColor }}
                  >
                    <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden />
                    {ctaText}
                  </Link>
                  <a
                    href="#how-it-works"
                    className="rounded-md border-2 bg-transparent px-6 py-4 text-center text-base/6 font-semibold transition-colors hover:bg-white/10"
                    style={{ borderColor: heroBorderColor, color: subtleHeroTextColor }}
                  >
                    How it works
                  </a>
                </div>
                <Link
                  href="/ai-actions"
                  className="inline-flex w-fit items-center gap-2 rounded-md border-0 bg-transparent py-2 text-base/6 font-semibold outline-none transition-colors hover:bg-white/10 hover:opacity-90 focus-visible:underline focus-visible:underline-offset-4"
                  style={{ color: subtleHeroTextColor }}
                >
                  Explore all AI Actions
                  <ArrowRightIcon className="h-5 w-5 shrink-0" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Section eyebrow="What you can build" title={`Practical ${record.name} Skill ideas`}>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {record.whatYouCanBuild.map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
                <CheckCircleIcon className="h-5 w-5 text-cyan-600" />
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {linkSkillCategoriesInText(item, skillCategoryHubs, bodyCategoryLinkClass)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <section className="bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
            <div>
              <div className="lg:min-h-[116px]">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Customer support</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Use {record.name} from customer conversations
                </h2>
              </div>
              <div className="mt-8 space-y-4">
                {record.supportUseCases.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-sm leading-6 text-slate-700">
                      {linkSkillCategoriesInText(item, skillCategoryHubs, bodyCategoryLinkClass)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="lg:min-h-[116px]">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Internal teams</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Give employees a private AI assistant
                </h2>
              </div>
              <div className="mt-8 space-y-4">
                {record.internalUseCases.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-sm leading-6 text-slate-700">
                      {linkSkillCategoriesInText(item, skillCategoryHubs, bodyCategoryLinkClass)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Section id="how-it-works" eyebrow="How it works" title="Skill Builder designs, secures, tests, and improves the Skill">
          <div id="how-it-works" className="mt-10 grid gap-5 lg:grid-cols-5">
            {record.howItWorks.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-1 ring-inset"
                  style={{
                    backgroundColor: primaryColor,
                    color: getReadableTextColor(primaryColor),
                    '--tw-ring-color': primaryColor,
                  }}
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {linkSkillCategoriesInText(step.description, skillCategoryHubs, bodyCategoryLinkClass)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
              <div>
                <LockClosedIcon className="h-8 w-8 text-cyan-300" />
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Secure actions without technical setup work
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Skill Builder defines required configuration, keeps credentials out of chats and Skill source, scopes
                  permissions, adds approval boundaries, and uses automated tests before publishing.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <SparklesIcon className="h-6 w-6 text-cyan-300" />
                <p className="mt-4 text-lg font-semibold text-white">Ready to build a {record.name} Skill?</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start with the workflow you want your customer-facing or internal agent to complete.
                </p>
                <Link
                  href="/register"
                  className="bg-animation mt-6 inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-base/6 font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden />
                  {ctaText}
                </Link>
                <Link
                  href="/ai-actions"
                  className="mt-3 ml-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
                >
                  View all AI Actions
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Section eyebrow="FAQ" title={`${record.name} AI agent questions`} className="bg-white">
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {record.faq.map((item) => (
              <div key={item.question} className="rounded-lg border border-slate-200 p-6">
                <h3 className="text-base font-semibold text-slate-950">
                  {linkSkillCategoriesInText(item.question, skillCategoryHubs, bodyCategoryLinkClass)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {linkSkillCategoriesInText(item.answer, skillCategoryHubs, bodyCategoryLinkClass)}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {relatedSkills.length ? (
          <Section eyebrow="Related Skills" title="Explore more related Skills" className="bg-slate-50">
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedSkills.map((item) => (
                <SkillLinkCard key={item.slug} record={item} />
              ))}
            </div>
            <div className="mt-12 flex flex-col gap-3 border-b border-slate-200 pb-10 sm:flex-row sm:flex-wrap">
              <Link
                href={categoryHubPath}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700"
              >
                <ArrowLeftIcon className="h-4 w-4 shrink-0" />
                All {record.category} skills
              </Link>
              <Link
                href="/skills"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-cyan-300 hover:text-cyan-700"
              >
                AI agent skill library
              </Link>
            </div>
          </Section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}

export async function getStaticPaths() {
  const { getSkillsIndexRecords } = await import('@/lib/skillsIntegrations.mjs')

  const records = getSkillsIndexRecords()
  return {
    paths: records.map((record) => ({
      params: {
        category: skillCategorySlug(record.category),
        slug: record.slug,
      },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { getRelatedSkills, getSkillIntegrationBySlug, getSkillsIndexRecords } = await import(
    '@/lib/skillsIntegrations.mjs'
  )

  const record = getSkillIntegrationBySlug(params?.slug)
  if (!record) {
    return { notFound: true }
  }
  if (skillCategorySlug(record.category) !== params?.category) {
    return {
      redirect: {
        destination: getSkillIntegrationPath(record),
        permanent: true,
      },
    }
  }

  const records = getSkillsIndexRecords()
  return {
    props: {
      record,
      relatedSkills: getRelatedSkills(record, records),
      skillCategoryHubs: buildSkillCategoryHubs(records),
    },
  }
}
