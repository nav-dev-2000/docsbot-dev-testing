import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import clsx from 'clsx'
import { NextSeo } from 'next-seo'
import {
  ClockIcon,
  GlobeAltIcon,
  UserIcon,
  CloudIcon,
  MagnifyingGlassCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import { CheckIcon, MinusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import SocialFaces from '@/components/SocialFaces'
import conversationImg from '@/images/docsbot-conversation.png'
import researchImg from '@/images/research-mode.png'
import Image from 'next/image'
import TrustedBy from '@/components/TrustedBy'
import RegisterCTA from '@/components//RegisterCTA'
import { ALTERNATIVES } from '@/constants/alternatives.constants'

const docsbotFeatures = [
  {
    name: 'Training Sources',
    features: [
      { name: 'Web', value: 'URL, Sitemap, WordPress, URL List, RSS Feed', key: 'websites' },
      {
        name: 'Document Files',
        value:
          '.pdf, .docx, .pptx, .txt, .md, .html, .eml, .xlsx, .csv, .tsv + .rtf from cloud sources',
        key: 'document_files',
      },
      {
        name: 'Cloud Sources',
        value: 'Slack, Notion, Google Drive, Dropbox, OneDrive, Box, SharePoint, Zotero, S3, GCS, Zendesk, Intercom, Freshdesk, ServiceNow,Confluence, Salesforce, GitBook, Guru, GitHub',
        key: 'cloud_sources',
      },
      { name: 'Q&A', value: true, key: 'q_a' },
      { name: 'Raw Data (CSV)', value: true, key: 'raw_data' },
      { name: 'Video', value: 'YouTube - Videos & Playlists', key: 'video' },
      { name: 'Images', value: '.png, .jpg description & OCR', key: 'images' },
      {
        name: 'Audio',
        value: '.mp3, .mp4, .mp2, .aac, .wav, .flac, .pcm, .m4a, .ogg, .opus, .webm',
        key: 'audio',
      },
      {
        name: 'Continuous training',
        value: 'Monthly, Weekly, Daily source refresh',
        key: 'continuous_training',
      },
    ],
  },
  {
    name: 'Embeddable Chat Widget',
    features: [
      {
        name: 'Customizable',
        value: 'Fully via settings, in embed code, Custom CSS',
        key: 'customizable',
      },
      {
        name: 'Multiple languages',
        value: '29 languages, customizable labels',
        key: 'widget_languages',
      },
      {
        name: 'Human Escalation',
        value: 'Link, JS integration with other support widgets',
        key: 'human_escalation',
      },
      { name: 'Answer rating', value: true, key: 'answer_rating' },
      { name: 'Customer metadata', value: 'Name, Email, Custom', key: 'customer_metadata' },
      {
        name: 'Recommended questions',
        value: 'AI-generated & customizable',
        key: 'recommended_questions',
      },
      { name: 'Show sources', value: 'Clickable source links', key: 'show_sources' },
      { name: 'Remove Branding', value: true, key: 'remove_branding' },
    ],
  },
  {
    name: 'Reports & Analytics',
    features: [
      {
        name: 'Chat logs',
        value: 'CSV exports, Escalation/Rating/Answered filters, Source details, Answer rating',
        key: 'chat_logs',
      },
      {
        name: 'Advanced analytics',
        value: 'Questions, Ratings, Escalations, Could answer',
        key: 'advanced_analytics',
      },
      {
        name: 'AI question reports',
        value: 'Advanced AI topic clustering & analysis',
        key: 'ai_question_reports',
      },
    ],
  },
  {
    name: 'Integrations',
    features: [
      { name: 'Embeddable widget', value: true, key: 'widget' },
      { name: 'Share link', value: true, key: 'share_link' },
      { name: 'API', value: 'Chat & bot management/training', key: 'api' },
      { name: 'OpenAI GPTs', value: 'Custom action', key: 'gpts' },
      { name: 'Zapier', value: true, key: 'zapier' },
      { name: 'Make', value: true, key: 'make' },
      { name: 'Pabbly Connect', value: true, key: 'pabbly_connect' },
      { name: 'Pipedream', value: true, key: 'pipedream' },
      { name: 'Help Scout', value: 'Auto-reply, Agent-assist', key: 'helpscout' },
    ],
  },
  {
    name: 'Security',
    features: [
      { name: 'Private bots', value: 'Including Signed widget support', key: 'private_bots' },
      { name: 'Domain restrictions', value: true, key: 'domain_restrictions' },
      { name: 'Rate limiting', value: 'Including IP allowlist', key: 'rate_limiting' },
    ],
  },
  {
    name: 'Other',
    features: [
      { name: 'Invite Team Members', value: true, key: 'invite_team_members' },
      { name: 'Assign User Roles', value: true, key: 'assign_user_roles' },
      { name: 'Custom Prompt/Instructions', value: true, key: 'custom_prompt' },
      {
        name: 'Multilingual bots',
        value: 'Training & chats in 95+ languages',
        key: 'multilingual',
      },
      { name: 'Search', value: 'Hybrid/Semantic search of training data', key: 'search' },
      { name: 'Research mode', value: true, key: 'research_mode' },
      { name: 'Anti-hallucination', value: 'TrueURL & strict RAG', key: 'anti_hallucination' },
    ],
  },
]

const featuresSupport = [
  {
    name: '24/7 Availability and Real-Time Responses',
    description:
      "DocsBot AI's chatbots offer round-the-clock support, allowing customers to receive immediate responses to their queries at any time, which improves customer satisfaction and enhances your brand's reputation for reliable service.",
    icon: ClockIcon,
  },
  {
    name: 'Multilingual Support',
    description:
      'DocsBot AI can perform real-time conversations in more than 95 languages, ensuring that customers receive support in their native language without delays, no matter the language of your training documentation.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Improved Customer Experience',
    description:
      'With continuous access to your knowledge base, DocsBot AI chatbots can quickly provide accurate and personalized answers and recommendations, improving the overall customer experience.',
    icon: UserIcon,
  },
]

const featuresQA = [
  {
    name: 'Advanced Document Q&A',
    description:
      'Upload any source of information, including documents, images, and audio files, and DocsBot AI will automatically extract the relevant information and answer questions based on the content. Our research mode does deep semantic search of your training data to craft detailed answers and summaries in your desired format, all with full source attribution and context.',
    icon: MagnifyingGlassCircleIcon,
  },
  {
    name: 'Cloud Knowledge Base Access',
    description:
      'Connect DocsBot to Google Drive, Notion, DropBox, and more to continuously update its knowledge base. Search and perform research on your freshest data.',
    icon: CloudIcon,
  },
  {
    name: 'Internal Knowledge Bots',
    description:
      'Train your bot on your company internal knowledge base or SOPs to provide your team with instant answers to their questions. Expose it via a signed widget, API, or integrate it into Slack, Microsoft Teams, or any app via Zapier/Pabbly Connect.',
    icon: ChatBubbleLeftEllipsisIcon,
  },
]

export default function AlternativePage({
  name,
  description,
  support,
  research,
  competitorFeatures,
}) {
  return (
    <>
      <NextSeo
        title={`${name} Alternative - DocsBot AI`}
        description={`Compare the differences between DocsBot AI and ${name == 'DocsBot' ? 'Competitors' : name} to discover why DocsBot is the preferred choice for businesses looking for a ${name} alternative.`}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/og-alternative.png',
              alt: 'Chatbot builder alternative',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <div
            className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a4e2ff] to-[#32aa9c] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-2 text-xl font-semibold leading-7 text-teal-500">DocsBot AI</p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              The {name} alternative you've been looking for
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">{description}</p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <Link href="#support">
                For Customer Support <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#qa">
                For Q&A/Research <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#comparison">
                Comparison Table <span aria-hidden="true">&darr;</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-20 max-w-7xl">
            <h2 className="mb-6 text-center text-lg font-semibold leading-8 text-white">
              Trusted by
            </h2>
            <TrustedBy />
          </div>
        </div>

        <div id="support" className="overflow-hidden bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
              <div className="lg:ml-auto lg:pl-4 lg:pt-4">
                <div className="lg:max-w-lg">
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    AI Customer Support
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">{support}</p>
                  <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                    {featuresSupport.map((feature) => (
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
              <div className="flex items-center justify-end lg:order-first">
                <Image
                  src={conversationImg}
                  alt="Conversation screenshot"
                  className="w-[32rem] max-w-none rounded-xl shadow-xl sm:w-[41rem] md:-ml-4 lg:-ml-0"
                  width={788}
                  height={976}
                />
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-center gap-x-6 bg-white lg:flex-shrink-0">
            <Link
              href="/register"
              className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              <span>Automate Your Customer Support</span>
            </Link>
            <Link
              href="/tools/support/ai-savings-calculator"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="bg-white pt-5">
          <SocialFaces />
        </div>
        <div id="qa" className="overflow-hidden bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
              <div className="lg:pr-8 lg:pt-4">
                <div className="lg:max-w-lg">
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Document Q&A/Research
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">{research}</p>
                  <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                    {featuresQA.map((feature) => (
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

              <div className="flex items-center justify-start lg:order-last">
                <Image
                  src={researchImg}
                  alt="Research mode screenshot"
                  className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
                  width={1274}
                  height={968}
                />
              </div>
            </div>
          </div>
          <div className="mt-20 flex items-center justify-center gap-x-6 bg-white lg:flex-shrink-0">
            <Link
              href="/register"
              className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              <span>Start researching now</span>
            </Link>
            <Link href="/#uses" className="text-sm font-semibold leading-6 text-gray-900">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="bg-white py-16 sm:py-24" id="comparison">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">Comparison</h2>
              <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                DocsBot AI vs {name == 'DocsBot' ? 'Competitors' : name}
              </p>
            </div>
            <p className="ma x-w-2xl mx-auto mt-6 text-center text-lg leading-8 text-gray-600">
              Compare the differences between DocsBot AI and {name == 'DocsBot' ? 'Competitors' : name} with our detailed feature
              comparison table.
            </p>

            {/* xs to md */}
            <div className="mx-auto mt-12 max-w-md space-y-8 sm:mt-16 md:hidden">
              {/* DocsBot */}
              <section className="rounded-xl bg-gray-400/5 p-8 ring-1 ring-inset ring-gray-200">
                <h3 className="text-center text-xl font-semibold leading-6 text-gray-900">
                  DocsBot AI
                </h3>

                <ul role="list" className="mt-10 space-y-4 text-base leading-6 text-gray-900">
                  {docsbotFeatures.map((section) => (
                    <li key={section.name}>
                      <div className="mb-4 mt-6 font-semibold">{section.name}</div>
                      <ul role="list" className="space-y-4">
                        {section.features.map((feature) =>
                          feature.value ? (
                            <li key={feature.name} className="flex gap-x-3">
                              <CheckIcon
                                className="h-6 w-5 flex-none text-cyan-600"
                                aria-hidden="true"
                              />
                              <span>
                                {feature.name}{' '}
                                {typeof feature.value === 'string' ? (
                                  <span className="text-center text-sm leading-6 text-gray-500">
                                    ({feature.value})
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          ) : (
                            <li key={feature.name} className="flex gap-x-3">
                              <XMarkIcon
                                className="h-6 w-5 flex-none text-gray-400"
                                aria-hidden="true"
                              />
                              <span>
                                {feature.name}{' '}
                                {typeof feature.value === 'string' ? (
                                  <span className="text-center text-xl leading-6 text-gray-500">
                                    ({feature.value})
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>

              {name !== 'DocsBot' && (
              <section className="p-8">
                <h3 className="text-center text-xl font-semibold leading-6 text-gray-900">
                  {name}
                </h3>

                <ul role="list" className="mt-10 space-y-4 text-base leading-6 text-gray-900">
                  {docsbotFeatures.map((section) => (
                    <li key={section.name}>
                      <div className="mb-4 mt-6 font-semibold">{section.name}</div>
                      <ul role="list" className="space-y-4">
                        {section.features.map((feature) =>
                          competitorFeatures[feature.key] ? (
                            <li key={feature.name} className="flex gap-x-3">
                              <CheckIcon
                                className="h-6 w-5 flex-none text-cyan-600"
                                aria-hidden="true"
                              />
                              <span>
                                {feature.name}{' '}
                                {typeof competitorFeatures[feature.key] === 'string' ? (
                                  <span className="text-center text-sm leading-6 text-gray-500">
                                    ({competitorFeatures[feature.key]})
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          ) : (
                            <li key={feature.name} className="flex gap-x-3">
                              <XMarkIcon
                                className="h-6 w-5 flex-none text-gray-400"
                                aria-hidden="true"
                              />
                              <span>
                                {feature.name}{' '}
                                {typeof competitorFeatures[feature.key] === 'string' ? (
                                  <span className="text-center text-sm leading-6 text-gray-500">
                                    ({competitorFeatures[feature.key]})
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
              )}
            </div>

            {/* md+ */}
            <div className="isolate mt-20 hidden md:block">
              <div className="relative -mx-8">
                <div className="absolute inset-x-4 inset-y-0 -z-10 flex">
                  <div className="flex w-1/3 px-4" aria-hidden="true" style={{ marginLeft: `33%` }}>
                    <div className="w-full rounded-t-xl border-x border-t border-gray-900/10 bg-gray-400/5" />
                  </div>
                </div>
                <table className="w-full table-fixed border-separate border-spacing-x-8 text-left">
                  <caption className="sr-only">Competitors comparison</caption>
                  <colgroup>
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                    <col className="w-1/3" />
                  </colgroup>
                  <thead>
                    <tr>
                      <td />
                      <th scope="col" className="px-6 pt-6 xl:px-8 xl:pt-8">
                        <div className="text-center text-2xl font-semibold leading-7 text-gray-900">
                          DocsBot AI
                        </div>
                      </th>
                      <th scope="col" className="px-6 pt-6 xl:px-8 xl:pt-8">
                        <div className="text-center text-2xl font-semibold leading-7 text-gray-900">
                          {name == 'DocsBot' ? 'Competitors' : name}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">
                        <span className="sr-only">Features</span>
                      </th>
                      <td className="px-6 pt-2 xl:px-8">
                        <div className="flex items-baseline gap-x-1 text-gray-900"></div>
                      </td>
                      <td className="px-6 pt-2 xl:px-8">
                        <div className="flex items-baseline gap-x-1 text-gray-900"></div>
                      </td>
                    </tr>
                    {docsbotFeatures.map((section, sectionIdx) => (
                      <Fragment key={section.name}>
                        <tr>
                          <th
                            scope="colgroup"
                            colSpan={3}
                            className={clsx(
                              sectionIdx === 0 ? 'pt-2' : 'pt-8',
                              'pb-4 text-base font-semibold leading-6 text-gray-900'
                            )}
                          >
                            {section.name}
                            <div className="absolute inset-x-8 mt-4 h-px bg-gray-900/10" />
                          </th>
                        </tr>
                        {section.features.map((feature) => (
                          <tr key={feature.name}>
                            <th
                              scope="row"
                              className="py-4 text-sm font-normal leading-6 text-gray-900"
                            >
                              {feature.name}
                              <div className="absolute inset-x-8 mt-4 h-px bg-gray-900/5" />
                            </th>
                            <td className="px-6 py-4 xl:px-8">
                              {typeof feature.value === 'string' ? (
                                <div className="text-center text-sm leading-6 text-gray-500">
                                  {feature.value}
                                </div>
                              ) : (
                                <>
                                  {feature.value === true ? (
                                    <CheckIcon
                                      className="mx-auto h-5 w-5 text-cyan-600"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <MinusIcon
                                      className="mx-auto h-5 w-5 text-gray-400"
                                      aria-hidden="true"
                                    />
                                  )}

                                  <span className="sr-only">
                                    {feature.value === true ? 'Included' : 'Not included'} in
                                    DocsBot AI
                                  </span>
                                </>
                              )}
                            </td>

                            <td className="px-6 py-4 xl:px-8">
                              {typeof competitorFeatures[feature.key] === 'string' ? (
                                <div className="text-center text-sm leading-6 text-gray-500">
                                  {competitorFeatures[feature.key]}
                                </div>
                              ) : (
                                <>
                                  {competitorFeatures[feature.key] === true ? (
                                    <CheckIcon
                                      className="mx-auto h-5 w-5 text-cyan-600"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <MinusIcon
                                      className="mx-auto h-5 w-5 text-gray-400"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {competitorFeatures[feature.key]}
                                  <span className="sr-only">
                                    {competitorFeatures[feature.key] === true
                                      ? 'Included'
                                      : 'Not included'}{' '}
                                    in {name}
                                  </span>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle={`Try the Best ${name} Alternative`}
          button="Switch now, it's free!"
        />
        <div className="mx-auto bg-white py-16 text-center">
          <h2 className="mx-auto max-w-2xl text-xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Discover why DocsBot AI is the best alternative to
          </h2>
          <div className="mt-10 flex-wrap justify-center bg-white text-xl font-semibold leading-7 text-gray-900">
            {ALTERNATIVES.filter((item) => item.slug !== 'docsbot').map((item) => (
              <Link
                key={item.slug}
                className="underline-offset-2 hover:underline m-4 inline-block"
                href={`/comparisons/${item.slug}-alternative`}
              >
                {item.name} <span aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
export async function getStaticPaths() {
  let paths = ALTERNATIVES.map((item) => {
    return { params: { index: `${item.slug}-alternative` } }
  })
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  return {
    props: { ...ALTERNATIVES.find((e) => `${e.slug}-alternative` == context.params.index) },
  }
}
