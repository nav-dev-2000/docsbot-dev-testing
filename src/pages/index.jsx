import {
  ShieldCheckIcon,
  MapIcon,
  DocumentMagnifyingGlassIcon,
  TableCellsIcon,
  RssIcon,
  CursorArrowRippleIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline'
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/20/solid'
import qaHeader from '@/images/header-screenshot.png'
import demoScreenshot from '@/images/demo-screenshot.png'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import Faq from '@/components/Faq'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Pricing from '@/components/Pricing'
import { Testimonials } from '@/components/Testimonials'
import TrustedBy from '@/components/TrustedBy'

const integrations = [
  {
    name: 'URL & Sitemaps',
    description:
      'Index a webpage, your support docs, or an entire website including inline images in minutes with our url and sitemap importers. Simply add a link and we take care of the rest. Schedule regular updates to keep your content fresh.',
    icon: MapIcon,
  },
  {
    name: 'Document Files',
    description:
      'Upload any files in TXT, DOC, PPT, EML, HTML, MD, PDF format, or in bulk via ZIP. We will index your content and turn it into a ChatGPT-powered bot for you or your users.',
    icon: DocumentMagnifyingGlassIcon,
  },
  {
    name: 'Blog Posts',
    description:
      "Quickly train your DocsBot on your blog content via WordPress export files or RSS feeds. It's a simple way to surface your best content to those looking for answers.",
    icon: RssIcon,
  },
  {
    name: 'Bulk Import',
    description:
      'Add your content in bulk by uploading a specially formatted CSV file containing text blocks and sources to index.',
    icon: TableCellsIcon,
  },
  {
    name: 'Zapier Integration',
    description:
      'Connect DocsBot to thousands of apps via Zapier. Pass your trained bots questions and route answers to your favorite apps.',
    icon: CursorArrowRippleIcon,
  },
  {
    name: 'Cloud Sources',
    description:
      'Connect your Notion, Google Drive, Dropbox, Intercom, or OneDrive account to DocsBot and we will index your files & content automatically.',
    icon: CloudArrowDownIcon,
  },
]

const features = [
  {
    name: 'Embeddable Widgets',
    description:
      'We make it simple to add DocsBot to your website in minute with fully customizable widgets. Just add a script tag or WordPress plugin (coming soon) and you are ready to go.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Reply to Support Tickets',
    description:
      'Tired of writing the same responses to support tickets over and over again? Train your DocBot on your support history and docs so it can reply to new tickets automatically, saving you time and money! Enable our Help Scout integration or create your own.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Question/Answer Bots',
    description:
      'Make your documentation interactive with our Q/A bot. Get detailed and direct answers about your product, including code examples and formatted output.',
    icon: ChatBubbleLeftEllipsisIcon,
  },
  {
    name: 'Internal Knowledge Bots',
    description:
      'Employees spend too much time just searching for what they need. DocsBot can help them find answers instantly by indexing your internal knowledge base and documentation.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Custom Copywriting',
    description:
      'Need help writing marketing copy and blog posts? With DocsBot, you can do that too. Use a customized ChatGPT that knows everything about your product, so it can help you generate high-quality content in no time.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Powerful API',
    description:
      'Our API allows you to integrate AI chat into your own products. Provide answers to your users from your site, app, or WordPress plugin.',
    icon: Cog6ToothIcon,
  },
]

export default function Home() {
  return (
    <>
      <Head />
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />
          <main>
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
                    className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20"
                  />
                </div>
                <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
                  <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
                    <div className="mt-24 sm:mt-32 lg:mt-12">
                      <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-3 pr-1 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
                        <span className="pr-1">Powered by</span>
                        <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                          ChatGPT & GPT-4o!
                        </span>
                      </div>
                    </div>
                    <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                      <span className="block text-6xl leading-[0.8] tracking-tighter md:text-8xl md:leading-[0.8]">
                        Instant AI Answers from your Docs
                      </span>
                      <span className="mt-2 block bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text pb-3 text-3xl text-transparent sm:pb-5 sm:text-4xl">
                        Custom ChatGPT for your business
                      </span>
                    </h1>
                    <p className="mt-6 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                      Get instant answers for you, your customers, or your team
                      with custom AI ChatGPT chatbots trained with your content
                      and documentation. Save money and improve the support
                      experience for your customers, the productivity of your
                      team, and generate new content with existing knowledge of
                      your business!
                    </p>
                    <div className="mt-10">
                      <Link
                        href="/register"
                        type="button"
                        className="bg-animation block w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Create your own free DocsBot
                      </Link>
                      <p className="mt-3 text-center text-sm text-gray-300 sm:mt-4">
                        Transform your business with AI,{' '}
                        <u>no credit card required</u>!
                      </p>
                    </div>
                  </div>
                  <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-16 lg:max-w-none lg:flex-none xl:ml-32">
                    <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                      <Image
                        className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10 ring-offset-4 ring-offset-gray-900/50"
                        src={qaHeader}
                        alt="DocsBot dashboard screenshot"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24">
                <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                  Trusted by more than 2,000 businesses!
                </h2>
                <TrustedBy />
              </div>
            </div>

            {/* Feature section with screenshot */}
            <div id="features" className="bg-gray-50 py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                <div className="">
                  <h2 className="text-lg font-semibold text-cyan-600">
                    ChatGPT-powered customer support
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Train and deploy custom chatbots in minutes!
                  </p>
                  <p className="mx-auto mt-5 max-w-7xl text-xl text-gray-500">
                    Are you tired of answering the same questions over and over
                    again? Do you wish you had a way to automate your customer
                    support and give your team more time to focus on other
                    tasks? With DocsBot, you can do just that. We make it simple
                    to build ChatGPT-powered bots that are trained with your
                    content and documentation, so they can provide instant
                    answers to your customers' most detailed questions.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden pt-16">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <Image
                    src={demoScreenshot}
                    alt="Application screenshot"
                    className="mb-[-2%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
                  />
                  <div className="relative" aria-hidden="true">
                    <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-gray-50 pt-[7%]" />
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
                <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
                  {features.map((feature) => (
                    <div key={feature.name} className="relative pl-9">
                      <dt className="inline font-semibold text-gray-900">
                        <feature.icon
                          className="absolute left-1 top-1 h-5 w-5 text-cyan-600"
                          aria-hidden="true"
                        />
                        {feature.name}
                      </dt>{' '}
                      <dd className="inline">{feature.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Feature section with grid */}
            <div className="relative bg-white pb-12 pt-16 sm:pt-24 lg:pt-32">
              <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
                <h2 className="text-lg font-semibold text-cyan-600">
                  A simple managed chatbot service
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Powerful integrations and API
                </p>
                <p className="mx-auto mt-5 max-w-7xl text-xl text-gray-500">
                  Our intuitive interface makes it easy to index your
                  documentation, blog posts, or any other content with just a
                  few clicks. Then use our simple API and embeddable widgets to
                  integrate your custom DocsBot into your website, WordPress,
                  app/plugin, Slack, or anywhere else you want to use it!
                </p>
                <div className="mt-12">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {integrations.map((feature) => (
                      <div key={feature.name} className="pt-6">
                        <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                          <div className="-mt-6">
                            <div>
                              <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-3 shadow-lg">
                                <feature.icon
                                  className="h-6 w-6 text-white"
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                            <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">
                              {feature.name}
                            </h3>
                            <p className="mt-5 text-base text-gray-500">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Testimonials />

            {/* Pricing section */}
            <Pricing />

            <Faq />
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
}
