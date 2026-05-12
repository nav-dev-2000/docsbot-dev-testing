import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LinkIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid'

import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
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

const pageTitle = 'DocsBot AI Affiliate Program - DocsBot AI'
const pageDescription =
  'Join the DocsBot Partner Program and earn a 25% commission for a full year on every referral. Share the AI revolution and get rewarded!'
const affiliateSignupUrl = 'https://docsbot.firstpromoter.com'
const affiliateDashboardUrl = 'https://docsbot.firstpromoter.com/home'

const metrics = [
  { label: 'Commission', value: '25%', detail: 'Recurring revenue share' },
  { label: 'Earning window', value: '12 months', detail: 'Paid for a full year' },
  { label: 'Tracking cookie', value: '60 days', detail: 'Long referral attribution' },
  { label: 'Program cost', value: 'Free', detail: 'No fee to join' },
]

const steps = [
  {
    name: 'Apply',
    description:
      'Create your affiliate account through FirstPromoter and get your unique DocsBot referral link.',
    icon: UserGroupIcon,
  },
  {
    name: 'Share',
    description:
      'Recommend DocsBot to your audience, clients, community, or customers wherever AI agents can help.',
    icon: LinkIcon,
  },
  {
    name: 'Earn',
    description:
      'Receive 25% recurring commission for a full year on every referred DocsBot customer.',
    icon: CurrencyDollarIcon,
  },
]

const reasons = [
  {
    name: 'A product businesses already need',
    description:
      'DocsBot helps companies turn docs, websites, support content, and internal knowledge into useful AI agents.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Built for practical AI adoption',
    description:
      'Promote a platform that helps teams answer questions, automate support, and deploy agents without heavy engineering.',
    icon: SparklesIcon,
  },
  {
    name: 'Recurring SaaS upside',
    description:
      'Subscriptions can generate commissions for 12 months, so strong referrals keep paying after the first signup.',
    icon: ChartBarIcon,
  },
  {
    name: 'Clear tracking and reporting',
    description:
      'FirstPromoter gives affiliates a dashboard for links, referrals, customers, and commission activity.',
    icon: ShieldCheckIcon,
  },
]

const affiliateMockActivity = [
  { label: 'Clicks', value: '1,248', pct: '92%', color: 'bg-cyan-400' },
  { label: 'Trials', value: '86', pct: '68%', color: 'bg-teal-400' },
  { label: 'Customers', value: '24', pct: '42%', color: 'bg-emerald-400' },
]

const COMMISSION_MOCK_AMOUNT = 1875

const faqItems = [
  {
    question: 'How much can DocsBot affiliates earn?',
    answer:
      'DocsBot affiliates earn a 25% recurring commission for one year on each referred customer who signs up through their affiliate link.',
  },
  {
    question: 'How long does the affiliate tracking cookie last?',
    answer:
      'DocsBot uses a 60-day cookie window, giving referred visitors time to evaluate the product before creating a paid account.',
  },
  {
    question: 'Is the DocsBot affiliate program free to join?',
    answer:
      'Yes. Applying for the DocsBot affiliate program through FirstPromoter is free.',
  },
  {
    question: 'Who is a good fit for the program?',
    answer:
      'Agencies, consultants, creators, educators, software reviewers, and partners with an audience interested in AI agents, customer support automation, documentation, or business productivity are a good fit.',
  },
  {
    question: 'Where do affiliates track referrals and commissions?',
    answer:
      'Affiliates can use the FirstPromoter dashboard to access referral links and track clicks, signups, customers, and commission activity.',
  },
]

function PrimaryAffiliateButton({ className = '' }) {
  return (
    <a
      href={affiliateSignupUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-animation inline-flex items-center justify-center gap-2 rounded-md px-6 py-4 text-base font-semibold text-white shadow transition-transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${className}`}
    >
      <SparklesIcon className="size-5" />
      Join the Affiliate Program
    </a>
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
              id="affiliate-hero-grid"
              x="50%"
              y={-1}
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <rect fill="url(#affiliate-hero-grid)" width="100%" height="100%" strokeWidth={0} />
        </svg>
        <div
          aria-hidden="true"
          className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
        >
          <div className="aspect-[1108/632] h-[70rem] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20 lg:h-[75rem]" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-32 sm:pt-40 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
            <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-1 pr-3 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
              <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                25% recurring
              </span>
              <span className="pl-2">for a full year on every referral</span>
            </div>
            <h1 className="mt-8 text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
              DocsBot Affiliate Program
            </h1>
            <p className="mt-6 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
              Share DocsBot with businesses adopting AI agents and earn recurring commissions when your referrals become customers.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:items-start lg:justify-start">
              <PrimaryAffiliateButton />
              <a
                href={affiliateDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-4 text-base font-semibold text-white transition hover:bg-white hover:text-gray-900"
              >
                Affiliate dashboard
                <ArrowRightIcon className="size-5" />
              </a>
            </div>
          </div>

          <AffiliateDashboardMockup />
        </div>
      </div>
    </div>
  )
}

function AffiliateDashboardMockup() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.35 })
  const prefersReducedMotion = useReducedMotion()
  const [commission, setCommission] = useState(0)

  useEffect(() => {
    if (!isInView) return
    if (prefersReducedMotion) {
      setCommission(COMMISSION_MOCK_AMOUNT)
      return
    }
    const controls = animate(0, COMMISSION_MOCK_AMOUNT, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setCommission(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [isInView, prefersReducedMotion])

  return (
    <motion.div
      ref={ref}
      className="mx-auto w-full max-w-xl lg:mt-10"
      initial={
        prefersReducedMotion
          ? false
          : {
              opacity: 0,
              y: 28,
            }
      }
      whileInView={
        prefersReducedMotion
          ? {}
          : {
              opacity: 1,
              y: 0,
            }
      }
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-2xl bg-white/10 p-2 shadow-2xl ring-1 ring-white/15 backdrop-blur">
        <div className="rounded-xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-semibold text-cyan-700">Affiliate overview</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                Referral earnings
              </h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Active
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-900 p-4 text-white">
              <p className="text-sm text-gray-300">Estimated commission</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {commission.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="mt-1 text-sm text-cyan-200">25% for 12 months</p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-4">
              <p className="text-sm font-medium text-cyan-800">Cookie window</p>
              <div className="mt-4 flex items-center gap-3">
                <ClockIcon className="size-8 text-cyan-600" />
                <p className="text-3xl font-semibold text-gray-900">60d</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {affiliateMockActivity.map((item, index) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className={`h-2 rounded-full ${item.color}`}
                    initial={{
                      width: prefersReducedMotion ? item.pct : 0,
                    }}
                    animate={{
                      width: isInView || prefersReducedMotion ? item.pct : 0,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.95,
                      delay: prefersReducedMotion ? 0 : 0.2 + index * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
                <LinkIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Your referral link</p>
                <p className="truncate text-sm text-gray-500">docsbot.ai/?ref=partner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MetricsStrip() {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <dt className="text-sm font-semibold text-gray-500">{metric.label}</dt>
              <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{metric.value}</dd>
              <dd className="mt-1 text-sm text-gray-600">{metric.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-wide text-cyan-600">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">{title}</h2>
      <p className="mt-5 text-lg/8 text-gray-600">{description}</p>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Start referring in three steps"
          description="The program is built around a simple affiliate flow: apply once, share your link, and track the customers you send to DocsBot."
        />
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.name} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <div className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-600 text-white">
                  <step.icon className="size-6" />
                </div>
                <span className="text-sm font-semibold text-gray-500">Step {index + 1}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">{step.name}</h3>
              <p className="mt-3 text-base/7 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyPromoteSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <p className="font-mono text-sm font-semibold uppercase tracking-wide text-cyan-600">
              Why promote DocsBot
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Recommend AI agents with clear business value
            </h2>
            <p className="mt-5 text-lg/8 text-gray-600">
              DocsBot is easy to explain: businesses connect their knowledge and launch AI agents that answer questions, support customers, and help teams work faster.
            </p>
            <div className="mt-8">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-base font-semibold text-cyan-700 hover:text-cyan-600"
              >
                See DocsBot plans
                <ArrowRightIcon className="size-5" />
              </Link>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.name} className="rounded-lg border border-gray-200 p-6">
                <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <reason.icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{reason.name}</h3>
                <p className="mt-2 text-sm/6 text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardSection() {
  return (
    <section className="bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Affiliate dashboard
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Track referrals without spreadsheet work
          </h2>
          <p className="mt-5 text-lg/8 text-gray-300">
            FirstPromoter gives every affiliate a dedicated place to manage referral links and monitor the funnel from click to commission.
          </p>
          <ul className="mt-8 space-y-4">
            {['Unique affiliate links', 'Click and conversion tracking', 'Customer and commission visibility'].map((item) => (
              <li key={item} className="flex gap-3 text-base/7 text-gray-200">
                <CheckCircleIcon className="mt-1 size-5 flex-none text-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <AffiliateDashboardMockup />
      </div>
    </section>
  )
}

function FAQSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Affiliate program details"
          description="The essentials for partners, creators, agencies, and consultants who want to recommend DocsBot."
        />
        <dl className="mt-12 divide-y divide-gray-200">
          {faqItems.map((item) => (
            <div key={item.question} className="py-6">
              <dt className="text-lg font-semibold text-gray-900">{item.question}</dt>
              <dd className="mt-3 text-base/7 text-gray-600">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export default function AffiliatesPage() {
  const pageUrl = buildPageUrl('/affiliates')
  const webPage = buildWebPage({
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
  })
  const faqPage = buildFaqPage({
    url: pageUrl,
    mainEntity: buildFaqEntities(faqItems),
  })
  const service = buildService({
    url: pageUrl,
    name: 'DocsBot Affiliate Program',
    description: pageDescription,
    serviceType: 'Affiliate partner program',
  })

  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, faqPage, service],
  }

  return (
    <>
      <JsonLd id="affiliates-schema" data={schema} />
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
        }}
        twitter={{
          handle: '@docsbotai',
          site: '@docsbotai',
          cardType: 'summary_large_image',
        }}
      />
      <Head>
        <link rel="preconnect" href="https://docsbot.firstpromoter.com" />
      </Head>

      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />
          <main>
            <HeroSection />
            <MetricsStrip />
            <HowItWorksSection />
            <WhyPromoteSection />
            <DashboardSection />
            <FAQSection />
            <CTASection
              heading="Ready to earn with DocsBot?"
              description="Join the affiliate program, share DocsBot with businesses adopting AI agents, and earn 25% recurring commission for a full year on every referral."
              buttonText="Join the Affiliate Program"
              buttonHref={affiliateSignupUrl}
              infoText="View pricing"
              infoHref="/pricing"
            />
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
}
