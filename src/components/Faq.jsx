/* This example requires Tailwind CSS v3.0+ */
import Link from 'next/link'
import { useRouter } from 'next/router'
import JsonLd from '@/components/seo/JsonLd'
import { buildFaqEntities, buildFaqPage, buildPageUrl } from '@/lib/structuredData'
import { getVisibleAiCreditModelMultipliers } from '@/lib/systemModels'

const aiCreditModelMultipliers = getVisibleAiCreditModelMultipliers()

const aiCreditModelMultiplierText = aiCreditModelMultipliers
  .map((model) => `${model.title}: ${model.creditMultiplier}x`)
  .join(', ')

const aiCreditsFaqIntro =
  'AI Credits are your monthly usage allowance. A standard chat message starts at 1 credit for a 1x model, while heavier work uses more. Larger AI models, AI actions, skill builder/tester runs, and longer or more complex requests can cost multiple credits. Usage is rounded to the nearest credit and counts against your plan limit.'

const aiCreditsFaqAnswer = `${aiCreditsFaqIntro} Current chat model multipliers are ${aiCreditModelMultiplierText}.`

const faqs = [
  {
    id: 1,
    question: "Does it work with languages other than English?",
    answer:
      "Yes. DocsBot understands and responds in any language you need, even when your documentation is English-only. Supports over 100 languages!",
  },
  {
    id: 2,
    question: 'How does DocsBot work?',
    answer:
      "We clean and chunk your sources, and use a cutting-edge agentic RAG pipeline to retrieve, rerank, and use the most relevant matches as context for the AI to answer the question.",
  },
  {
    id: 3,
    question: 'Do I need to provide my own OpenAI API key?',
    answer:
      "No. All supported models are available on every plan through your included AI Credits—usage starts at 1x per message and can cost more with larger models and AI actions. Optionally, connect your own OpenAI key for 1x credit usage on any model; we encrypt and use it only for API calls.",
  },
  {
    id: 4,
    question: 'Can a get a free trial of a higher plan?',
    answer:
      "We offer a free tier so you can test our core features. Eligible businesses can request a Standard plan trial with full features or rely on our 14-day money-back guarantee.",
  },
  {
    id: 5,
    question: 'How do I upgrade or downgrade my plan?',
    answer:
      "Change plans anytime in the dashboard. Upgrades and downgrades activate instantly and unused credit is applied to the next billing cycle.",
  },
  {
    id: 6,
    anchor: 'ai-credits',
    question: 'How do AI Credits work?',
    answer: aiCreditsFaqAnswer,
    displayAnswer: aiCreditsFaqIntro,
    modelMultipliers: aiCreditModelMultipliers,
  },
  {
    id: 7,
    question: 'What happens if I exceed my monthly AI Credit limit?',
    answer:
      "When you reach your monthly AI Credit limit, your bot stops responding and shows visitors a friendly error message. Upgrade for a higher limit, turn on auto-add AI credits in your account settings to automatically increase your add-on when you hit the limit, or wait for your limit to reset at the start of the next calendar month.",
  },
  {
    id: 8,
    question: 'Can I customize the chat widget appearance?',
    answer:
      "All plans can adjust basic colors, styling, and placement; higher tiers unlock custom CSS and unbranded widgets.",
  },
  {
    id: 9,
    question: 'What kind of analytics do you provide?',
    answer:
      "Analytics vary by plan. Basics cover usage, while higher tiers unlock deeper reports, topics, sentiment, resolution rates, satisfaction, and AI-driven analysis.",
  },
  {
    id: 10,
    question: 'How secure is DocsBot?',
    answer:
      "We take security seriously with end-to-end encryption, granular access controls, data segmentation, and SOC 2 Type II audited controls.",
    moreInfoHref: 'https://trust.docsbot.ai',
  },
  {
    id: 11,
    question: 'What support options are available?',
    answer:
      "All plans include docs, AI, and email support with response times based on plan. Enterprise customers can add custom SLAs and dedicated channels.",
  },
  {
    id: 12,
    question: 'Can I import my existing ticket history?',
    answer:
      "Yes. Import chat logs or tickets via CSV, or integrations like Zendesk, Intercom, Freshdesk, Help Scout, and more.",
  },
  {
    id: 13,
    question: 'What types of content sources can I use?',
    answer:
      "Use websites, PDFs, Word docs, Markdown, HTML, RSS feeds, spreadsheets, manual entries, or our API. We support 28+ source types.",
  },
  {
    id: 14,
    question: 'Can I automatically update my DocsBot sources?',
    answer:
      "Schedule refreshes for compatible sources like web, cloud storage, or help desk platforms daily, weekly, or monthly, and trigger manual updates anytime.",
  },
  {
    id: 15,
    question: "What are source 'Pages'?",
    answer:
      "A page is about 5k characters of cleaned text. Plan limits vary with how many pages you ingest. UTF-8 languages like Chinese, Japanese, and Korean can use more characters per page.",
  },
  {
    id: 16,
    question: 'Do you have an API I can use?',
    answer: 'Yes. Our developer docs cover the public API along with admin endpoints and usage guides.',
    moreInfoHref: '/documentation/developer',
  },
  {
    id: 17,
    question: 'What are your privacy protections?',
    answer:
      "We store queries to run the service and don't retain PII unless you upload it. Review our privacy policy for details.",
    moreInfoHref: '/legal/privacy-policy',
  },
  {
    id: 18,
    question: 'Are you GDPR compliant?',
    answer:
      "Yes. We act as your data processor, provide DPAs, exports, deletion tools, and EU storage or protected transfers.",
      moreInfoHref: '/legal/gdpr'
  },
  {
    id: 19,
    question: 'Do you have an affiliate program?',
    answer:
      'Yes. Earn 25% for 12 months on referrals with a 60-day cookie and 45-day PayPal payouts managed through FirstPromoter.',
    moreInfoHref: 'https://docsbot.firstpromoter.com/',
  },
]

export default function Faq() {
  const router = useRouter()
  const pageUrl = buildPageUrl(router.asPath)
  const faqSchema = {
    '@context': 'https://schema.org',
    ...buildFaqPage({
      url: pageUrl,
      mainEntity: buildFaqEntities(faqs),
    }),
  }

  return (
    <>
      <JsonLd id="faq-schema" data={faqSchema} />
      <div id="faq" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-6 text-base/7 text-gray-600">
              Have a question we haven't covered?{' '}
              <button
                type="button"
                className="text-cyan-600 hover:text-cyan-500 font-semibold underline focus:outline-none"
                onClick={() => {
                  if (window.DocsBotAI && typeof window.DocsBotAI.open === 'function') {
                    window.DocsBotAI.open();
                  } else {
                    // Optionally, dispatch a custom event if widget is loaded via event listeners
                    const event = new Event('docsbot_open_widget');
                    document.dispatchEvent(event);
                  }
                }}
              >
                Ask our DocsBot AI agent
              </button>
              .
            </p>
          </div>
          <div className="mt-20">
            <div className="space-y-16 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:space-y-0 lg:grid-cols-3 lg:gap-x-10">
              {faqs.map((faq) => (
                <div key={faq.id} id={faq.anchor || `faq-${faq.id}`} className="scroll-mt-24">
                  <h3 className="text-base/7 font-semibold text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-base/7 text-gray-600">
                    {faq.displayAnswer || faq.answer}
                  </p>
                  {faq.modelMultipliers?.length > 0 ? (
                    <div className="group relative mt-3 inline-block">
                      <button
                        type="button"
                        className="rounded-md bg-cyan-50 px-2.5 py-1 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-100 transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        View current model multipliers
                      </button>
                      <div className="invisible absolute left-0 top-full z-20 mt-2 w-72 rounded-lg bg-white p-3 text-left opacity-0 shadow-xl ring-1 ring-gray-200 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          AI credits per message
                        </p>
                        <dl className="grid grid-cols-1 gap-1.5 text-sm/6 text-gray-600">
                          {faq.modelMultipliers.map((model) => (
                            <div
                              key={model.value}
                              className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-1.5"
                            >
                              <dt className="font-medium text-gray-800">{model.title}</dt>
                              <dd className="shrink-0 font-semibold text-cyan-700">
                                {model.creditMultiplier}x
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  ) : null}
                  {faq.moreInfoHref ? (
                    <Link
                      href={faq.moreInfoHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-500"
                    >
                      More information &rarr;
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
