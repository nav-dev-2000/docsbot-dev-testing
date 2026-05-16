
import {
  SparklesIcon,
} from '@heroicons/react/20/solid'
import {InfiniteTypewriter} from '@/components/customer-support/animation-elements'
import AskAIModels from '@/components/AskAIModels'
import Link from 'next/link'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import Faq from '@/components/Faq'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Testimonials } from '@/components/Testimonials'
import MattCromwellQuote from '@/components/MattCromwellQuote'
import TrustedBy from '@/components/TrustedBy'
import SocialFaces from '@/components/SocialFaces'
import HowItWorks from '@/components/HowItWorks'
import AIHero from '@/components/AIHero'
import IntegrationsFeatures from '@/components/IntegrationsFeatures'
import DeployFeatures from '@/components/DeployFeatures'
import CTASection from '@/components/CTASection'
import VideoPlayer from '@/components/VideoPlayer'
import SecuritySection from '@/components/SecuritySection'
import { UseCases } from '@/components/home/UseCases'
import AIActionContextSection from '@/components/AIActionContextSection'
import JsonLd from '@/components/seo/JsonLd'
import { HOW_IT_WORKS_FEATURES } from '@/data/howItWorks'
import {
  buildHowTo,
  buildOrganization,
  buildPageUrl,
  buildWebPage,
  buildWebSite,
} from '@/lib/structuredData'








export default function Home() {
  const pageUrl = buildPageUrl('/')
  const pageTitle =
    'DocsBot - AI Agents for Business | AI Customer Support & Team Automation'
  const pageDescription =
    'Build AI agents that combine trusted knowledge with real actions for customers and teams across your business tools and workflows.'

  const howToSteps = HOW_IT_WORKS_FEATURES.map((feature) => ({
    name: feature.name,
    text: feature.description,
  }))

  const webPage = buildWebPage({
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
  })

  const howTo = buildHowTo({
    url: pageUrl,
    name: 'How DocsBot Works',
    description: 'Create, train, refine, and launch your DocsBot AI agents.',
    steps: howToSteps,
  })

  webPage.mainEntity = { '@id': howTo['@id'] }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization({ includeContactPoint: true }), buildWebSite(), webPage, howTo],
  }

  return (
    <>
      <JsonLd id="home-schema" data={schema} />
      <NextSeo title={pageTitle} description={pageDescription} />
      <Head>
        <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />
          <main>
            {/* START: Hero Section */}
            <div className="-mt-24 bg-gray-900">
              <div className="relative isolate overflow-hidden bg-gray-900">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
                >
                  <defs>
                    <pattern
                      x="50%"
                      y={-1}
                      id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
                      width={200}
                      height={200}
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M.5 200V.5H200" fill="none" />
                    </pattern>
                  </defs>
                  <svg
                    x="50%"
                    y={-1}
                    className="overflow-visible fill-gray-800/20"
                  >
                    <path
                      d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                      strokeWidth={0}
                    />
                  </svg>
                  <rect
                    fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
                    width="100%"
                    height="100%"
                    strokeWidth={0}
                  />
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
                <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
                  <div className="mx-auto max-w-6xl text-center">
                    <div className="mt-24 flex justify-center sm:mt-32 lg:mt-12">
                      <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-3 pr-1 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
                        <span className="pr-1">Custom AI Agents</span>
                        <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                          for your business!
                        </span>
                      </div>
                    </div>

                    <h1 className="mt-8 text-pretty font-semibold leading-tight tracking-tight text-white">
                      <span className="block text-4xl leading-none tracking-tighter sm:text-5xl md:leading-[0.95] lg:text-6xl xl:text-7xl">
                        Instant Answers & Actions
                      </span>
                      <span className="mt-2 block text-4xl leading-none tracking-tighter sm:text-5xl md:leading-[0.95] lg:text-6xl xl:text-7xl">
                        for{' '}
                        <InfiniteTypewriter
                          ssrFallback="Customers and Your Team"
                          words={[
                            'Customers',
                            'Your Team',
                            'Support',
                            'Sales Reps',
                            'Product',
                            'Partners',
                            'New Hires',
                            'Members',
                          ]}
                          className="text-cyan-400"
                        />
                      </span>
                    </h1>
                  </div>

                  <div className="mx-auto mt-8 max-w-2xl text-center">
                    <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                      DocsBot turns your knowledge base into AI agents that deliver instant, accurate answers and
                      take action across your tools, workflows, and support operations.
                    </p>
                  </div>

                  <div className="mx-auto mt-10 max-w-3xl">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-6 w-full max-w-md">
                        <Link
                          href="/register"
                          type="button"
                          className="bg-animation block w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow transition-transform duration-300 hover:scale-105 hover:from-teal-600 hover:to-cyan-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <SparklesIcon className="h-5 w-5" />
                            <span>Turn Your Content Into AI Agents</span>
                          </div>
                        </Link>
                        <p className="mt-1 text-center text-sm text-gray-300 sm:mt-2">
                          Try it free, <u>no credit card required</u>. Your
                          customers (and team) will thank you!
                        </p>
                      </div>
                      <SocialFaces
                        ringColor="ring-gray-900"
                        className="flex scale-75 items-center justify-center gap-4"
                      />
                    </div>
                  </div>

                  <div className="mx-auto mt-12 max-w-6xl sm:mt-16 lg:mt-12">
                    <VideoPlayer
                      videoSrc="https://cdn.docsbot.com/docsbot-intro.mp4"
                      posterSrc="/video/docsbot-intro.webp"
                      className="mx-auto w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24">
                <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                  Trusted by more than 3,000 businesses!
                </h2>
                <TrustedBy />
              </div>
            </div>
            {/* END: Hero Section */}

            <UseCases
              id="uses"
              title="Use Cases"
              subtitle="AI Solutions to Real Business Problems"
              description="Give your customers and teams expert AI chatbots trained on your knowledge base. Capture more leads, deliver fast, concise answers, boost efficiency, and drive growth with instant, accurate responses tailored to your business."
            />

            <AIActionContextSection variant="home" className="bg-gray-50" />

            <HowItWorks />

            <IntegrationsFeatures />

            <DeployFeatures />

            <SecuritySection />

            <MattCromwellQuote />

            <Testimonials />

            <AIHero />

            <CTASection
              heading="Enough excuses. Create your free chatbot today."
              description="Join the thousands of companies using DocsBot to turn their existing content into instant, accurate answers for customers and employees. Reduce costs, increase productivity, and become the AI hero of your organization."
              infoHref="/pricing"
              infoText="Pricing & Plans"
            />

            <AskAIModels />

            <Faq />
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
}
