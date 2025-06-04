/* This example requires Tailwind CSS v3.0+ */
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { FAQPageJsonLd } from 'next-seo';

const faqs = [
  {
    question: "Does it work with languages other than English?",
    answer: "Yes! Unlike traditional search, DocsBot inherits GPT's understanding of any language found on the Internet. So even if you train from your documentation in English, it can still find answers and respond in the language of the question!"
  },
  {
    question: 'How does DocsBot work?',
    answer:
      "It's a bit technical, but here is a brief overview. We use OpenAI's embedding and ChatGPT APIs, as well as vector databases to store our index. All ingested documentation is cleaned up and divided into smaller chunks and labeled by source. We then generate a vector representation of each chunk and store it in our vector DB index. When a user asks a question, we convert it to an embedding, and perform an advanced semantic & keyword search for closest matches to the user's query. Then we take the most relevant chunks, included them as context along with the original question, and use the ChatGPT API to generate a response in markdown format that we then convert to HTML and display to the user.",
  },
  {
    question: 'Do I need to provide my own OpenAI API key?',
    answer:
      'Access to the capable GPT-4o mini or GPT-4.1 nano models is included with your plan question limit, and works well for most use cases. To access other models such as the most powerful GPT-4o or GPT-4.1 you need to provide your own OpenAI API key. Instead of simply reselling API access at a premium, we think it is much fairer to have you only pay for the usage you need. We also think it is important for you to have full control and ownership of your data. This also prevents rate limits from causing outages for you if another of our customers has a spike in usage. Each question uses <$0.008 of credit, so costs are minimal. We store your API key securely with AES256 encryption, and it is only used to make calls to OpenAI on your behalf.',
  },
  {
    question: "Can a get a free trial of a higher plan?",
    answer: "Instead of a free trial, we have a free tier lifetime plan that allows you to experience our core features. For qualifying businesses, ask us to enable access to all features of the Standard plan for 14 days, including multiple DocsBots, advanced analytics, and team collaboration features. You can test all source types, integrations, and customization options without any commitment.",
  },
  {
    question: "How do I upgrade or downgrade my plan?",
    answer: "You can change your plan at any time from your account dashboard. When upgrading, the new features and limits become available immediately, and we'll prorate any remaining time from your current plan. When downgrading, the new limits take effect immediately as well, and any unused credit will be applied on next billing cycle.",
  },
  {
    question: "What happens if I exceed my monthly question limit?",
    answer: "If you reach your monthly question limit, your bot will continue to function but will display a message suggesting users try again later. You can upgrade your plan at any time to increase your limit, or wait for it to reset at the start of your next billing cycle. Business plan customers can customize rate limiting to better manage high traffic periods.",
  },
  {
    question: "Can I customize the chat widget appearance?",
    answer: "Yes! All plans include basic widget customization like colors and position. Higher plans also get access to advanced customization options including custom CSS, custom icons, and the ability to fully integrate the chat experience into your website's design. Business plans also get access to unbranded widgets.",
  },
  {
    question: "What kind of analytics do you provide?",
    answer: "Basic analytics (available on Personal plan and up) include question volume, answered stats, and satisfaction rates. Advanced analytics (Standard and up) add detailed user interaction data for questions and conversations with graphs, unanswered question reports, and AI-powered insights to improve your documentation and bot responses. Business plans also get access to sentiment, topic analysis, and our AI question reports for deeper analysis of topics and question topics with clustering.",
  },
  {
    question: "How secure is DocsBot?",
    answer: "We take security seriously. All data is encrypted in transit and at rest, and we use industry-standard security practices. Business and Enterprise plans include additional security features like IP logging and SSO options. For organizations with specific security requirements, we offer Enterprise plans with Azure OpenAI Service integration and self-hosted options for your training data.",
  },
  {
    question: "What support options are available?",
    answer: "All plans include access to our documentation, AI, and email support with 24-hour response times. Enterprise plans can include custom SLAs and dedicated support channels.",
  },
  {
    question: "Can I import my existing chat history?",
    answer: "Yes! You can import existing chat logs and support tickets to train your bot. This is especially useful for support teams looking to automate responses to common questions. We support importing from various formats including CSV, JSON, and direct integration with help desk platforms like Freshdesk, Zendesk, Intercom, and Help Scout.",
  },
  {
    question: "What types of content sources can I use?",
    answer: "All paid plans support a wide range of source types including websites (via sitemap or crawler), PDFs, Word documents, Markdown files, HTML, RSS feeds, GitHub repositories, and more. You can also manually add content or use our API to programmatically update your knowledge base.",
  },
  {
    question: "Can I automatically update my DocsBot sources?",
    answer: "Yes you can enable scheduled source updates for compatible sources like URLs, RSS feeds, and Sitemaps. Depending on your plan you can do this monthly, weekly, or daily. You can also manually refresh your sources at any time on all plans."
  },
  {
    question: "What are source 'Pages'?",
    answer: "When you train your bot using various sources we calculate how many pages were imported. Each page is equivalent to 5000 characters of cleaned-up raw text. For example if you import your website via sitemap that may have hundreds or thousands of pages depending on the URL count and how much text is on each. Different plans have different page limits depending on your needs."
  },
  {
    question: "Do you have an API I can use?",
    answer: "Yes! We have a public API that you can use to integrate DocsBot into your own applications. You can find the documentation here: https://docsbot.ai/documentation/developer. We also have our admin API for managing your DocsBots and sources."
  },
  {
    question: "What are your privacy protections?",
    answer: "We generally don't store PII unless you specifically upload it, or a user provides it in a question to your bots. We store queries and responses in our database to be able to provide and improve on the service. Queries and responses also pass through OpenAI and are subject to their privacy policy as well. Please see our privacy policy and DPAfor more details: https://docsbot.ai/legal/privacy-policy.",
  },
  {
    question: "Are you GDPR compliant?",
    answer: "Yes, we are GDPR compliant. We act as a data processor for our customers and provide all necessary tools and documentation to help you maintain GDPR compliance. This includes Data Processing Agreements (DPAs), data export capabilities, and the ability to delete user data on request. We also ensure that all data processing activities are conducted in accordance with GDPR principles and that data is stored securely within EU-based servers or has proper data transfer protections when required. For Enterprise customers, we can offer additional GDPR-specific features and customizations.",
  },
  {
    question: "Do you have an affiliate program?",
    answer: "Yes! We have a generous affiliate program that pays out 25% of the revenue from any customer you refer to us for the first 12 months of their account. This includes plan upgrades, and can provide as much as a $1,500 commission per referral! We provide a 60 day cookie and 45 day payout schedule via PayPal. You can signup here: https://docsbot.firstpromoter.com/.",
  },
]

export default function Faq() {
  return (
    <>
      <FAQPageJsonLd
        mainEntity={faqs.map(faq => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
      />
      <div id="faq" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
              {faqs.map((faq) => (
                <Disclosure key={faq.question} as="div" className="pt-6">
                  <dt>
                    <DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900">
                      <span className="text-base/7 font-semibold">{faq.question}</span>
                      <span className="ml-6 flex h-7 items-center">
                        <PlusIcon aria-hidden="true" className="size-6 group-data-[open]:hidden" />
                        <MinusIcon aria-hidden="true" className="size-6 [.group:not([data-open])_&]:hidden" />
                      </span>
                    </DisclosureButton>
                  </dt>
                  <DisclosurePanel as="dd" className="mt-2 pr-12">
                    <p className="text-base/7 text-gray-600">{faq.answer}</p>
                  </DisclosurePanel>
                </Disclosure>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}
