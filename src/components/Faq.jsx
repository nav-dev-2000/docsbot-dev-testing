/* This example requires Tailwind CSS v3.0+ */
import Link from 'next/link'
import { useRouter } from 'next/router'
import JsonLd from '@/components/seo/JsonLd'
import { buildFaqEntities, buildFaqPage, buildPageUrl } from '@/lib/structuredData'

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
      "GPT-4o, 4.1, and GPT-5 mini models are included, perfect for most use cases. Bring your own OpenAI key to use other models; we encrypt and use it only for API calls.",
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
    question: 'What happens if I exceed my monthly message limit?',
    answer:
      "Your bot keeps running but warns visitors. Upgrade for a higher limit or wait for the monthly limit reset in the next calendar month.",
  },
  {
    id: 7,
    question: 'Can I customize the chat widget appearance?',
    answer:
      "All plans can adjust basic colors, styling, and placement; higher tiers unlock custom CSS and unbranded widgets.",
  },
  {
    id: 8,
    question: 'What kind of analytics do you provide?',
    answer:
      "Analytics vary by plan. Basics cover usage, while higher tiers unlock deeper reports, topics, sentiment, resolution rates, satisfaction, and AI-driven analysis.",
  },
  {
    id: 9,
    question: 'How secure is DocsBot?',
    answer:
      "We take security seriously with end-to-end encryption, granular access controls, data segmentation, and SOC 2 Type II audited controls.",
    moreInfoHref: 'https://trust.docsbot.ai',
  },
  {
    id: 10,
    question: 'What support options are available?',
    answer:
      "All plans include docs, AI, and email support with response times based on plan. Enterprise customers can add custom SLAs and dedicated channels.",
  },
  {
    id: 11,
    question: 'Can I import my existing ticket history?',
    answer:
      "Yes. Import chat logs or tickets via CSV, or integrations like Zendesk, Intercom, Freshdesk, Help Scout, and more.",
  },
  {
    id: 12,
    question: 'What types of content sources can I use?',
    answer:
      "Use websites, PDFs, Word docs, Markdown, HTML, RSS feeds, spreadsheets, manual entries, or our API. We support 28+ source types.",
  },
  {
    id: 13,
    question: 'Can I automatically update my DocsBot sources?',
    answer:
      "Schedule refreshes for compatible sources like web, cloud storage, or help desk platforms daily, weekly, or monthly, and trigger manual updates anytime.",
  },
  {
    id: 14,
    question: "What are source 'Pages'?",
    answer:
      "A page is about 5k characters of cleaned text. Plan limits vary with how many pages you ingest. UTF-8 languages like Chinese, Japanese, and Korean can use more characters per page.",
  },
  {
    id: 15,
    question: 'Do you have an API I can use?',
    answer: 'Yes. Our developer docs cover the public API along with admin endpoints and usage guides.',
    moreInfoHref: '/documentation/developer',
  },
  {
    id: 16,
    question: 'What are your privacy protections?',
    answer:
      "We store queries to run the service and don't retain PII unless you upload it. Review our privacy policy for details.",
    moreInfoHref: '/legal/privacy-policy',
  },
  {
    id: 17,
    question: 'Are you GDPR compliant?',
    answer:
      "Yes. We act as your data processor, provide DPAs, exports, deletion tools, and EU storage or protected transfers.",
      moreInfoHref: '/legal/gdpr'
  },
  {
    id: 18,
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
                <div key={faq.id}>
                  <h3 className="text-base/7 font-semibold text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-base/7 text-gray-600">{faq.answer}</p>
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
