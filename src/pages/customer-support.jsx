import { useId, useState } from 'react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import {
  LockClosedIcon,
  SwatchIcon,
  RocketLaunchIcon,
  ChartPieIcon,
  GlobeAltIcon,
  ServerStackIcon
} from '@heroicons/react/20/solid'

import Head from 'next/head'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MattCromwellQuote from '@/components/MattCromwellQuote'

// Import: Elements
import { AccurateAnswers, SmartEscalation, MultilingualChat } from '@/components/customer-support/animations'
import { VideoOverlay } from '@/components/customer-support/elements'

// Import: Page Sections
import { Hero } from '@/components/customer-support/Hero'
import { Brands } from '@/components/customer-support/Brands'
import { Overview } from '@/components/customer-support/Overview'
import { Integrations } from '@/components/customer-support/Integrations'
import { Features } from '@/components/customer-support/Features'
import { Benefits } from '@/components/customer-support/Benefits'
import { Tiers } from '@/components/customer-support/Tiers'
import { Security } from '@/components/customer-support/Security'
import { Analytics } from '@/components/customer-support/Analytics'
import { Design } from '@/components/customer-support/Design'
import { Pricing } from '@/components/customer-support/Pricing'
import { Results } from '@/components/customer-support/Results'
import { Testimonials } from '@/components/customer-support/Testimonials'
import { Faq } from '@/components/customer-support/FAQs'

import { SectionReveal } from '@/components/customer-support/transitions'

// Import: Images
import screenshotLogs from "@/images/app-demo/docsbot-insights-questions.webp"
import screenshotTopicManagement from "@/images/app-demo/docsbot-insights-topic-management.webp"
import screenshotVisualization from "@/images/app-demo/docsbot-insights-visualization.webp"
import screenshotReports from "@/images/app-demo/docsbot-insights-reports.webp"

// Define: Data
const dataOverview = [
  {
    title: "Build",
    description: "Create an AI chatbot in minutes that's trained on your knowledge from across more than 28 platforms and source types.",
    icon: SwatchIcon,
  },
  {
    title: "Launch",
    description: "Integrates seamlessly with your helpdesk and lets you easily share fully branded support bots where you need them with the built-in, no-code chat widget.",
    icon: RocketLaunchIcon,
  },
  {
    title: "Grow",
    description: "Learn from every interaction and continuously improve your AI agents' knowledge, accuracy, and customer experience.",
    icon: ChartPieIcon,
  }
]

const dataFeatures = [
  {
    name: 'Accurate Answers',
    summary: "Your customers don't care if it's AI. They care that it's fast and correct.",
    description: "Your AI customer support chatbot delivers instant, accurate answers in your voice—trained on your help center, docs, internal content, and even team conversations, with zero setup hassle. This AI chatbot for customer service understands long-form and technical content, and works across every support channel to deliver the right answer, right when it's needed.",
    animation: AccurateAnswers,
    icon: function ReportingIcon() {
      let id = useId()
      
      return (
        <>
          <defs>
            <linearGradient id={id} x1="11.5" y1={18} x2={36} y2="15.5" gradientUnits="userSpaceOnUse">
              <stop offset=".194" stopColor="#fff" />
              <stop offset={1} stopColor="#6692F1" />
            </linearGradient>
          </defs>
          <path
            d="m30 15-4 5-4-11-4 18-4-11-4 7-4-5"
            stroke={`url(#${id})`}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )
    },
  },
  {
    name: 'Smart Escalation',
    summary: 'DocsBot knows when to hand things off—no confusion, no dead ends.',
    description: 'It flags complex or sensitive queries and escalates them smoothly to your team, right inside your existing tools. With native support for Slack, Zendesk, HelpScout, and Freshdesk, agents can jump in exactly when they’re needed—never too early, never too late.',
    animation: SmartEscalation,
    icon: function InventoryIcon() {
      return (
        <>
          <path opacity=".5" d="M8 17a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" fill="#fff" />
          <path opacity=".3" d="M8 24a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" fill="#fff" />
          <path d="M8 10a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" fill="#fff" />
        </>
      )
    },
  },
  {
    name: 'Multilingual',
    summary: "DocsBot AI support agents speak your customers' language—literally.",
    description: 'It delivers fast, accurate answers in over 100 languages, right out of the box. No extra training, no localization effort. Just smart, on-brand support that works anywhere your customers are.',
    animation: MultilingualChat,
    icon: function ContactsIcon() {
      return (
        <>
          <path opacity=".5" d="M25.778 25.778c.39.39 1.027.393 1.384-.028A11.952 11.952 0 0 0 30 18c0-6.627-5.373-12-12-12S6 11.373 6 18c0 2.954 1.067 5.659 2.838 7.75.357.421.993.419 1.384.028.39-.39.386-1.02.036-1.448A9.959 9.959 0 0 1 8 18c0-5.523 4.477-10 10-10s10 4.477 10 10a9.959 9.959 0 0 1-2.258 6.33c-.35.427-.354 1.058.036 1.448Z" fill="#fff" />
          <path d="M12 28.395V28a6 6 0 0 1 12 0v.395A11.945 11.945 0 0 1 18 30c-2.186 0-4.235-.584-6-1.605ZM21 16.5c0-1.933-.5-3.5-3-3.5s-3 1.567-3 3.5 1.343 3.5 3 3.5 3-1.567 3-3.5Z" fill="#fff" />
        </>
      )
    },
  },
]

const dataTiers = [
  {
    id: 'tier-one',
    name: 'Tier 1 Support',
    title: 'Fully Automated. Always Improving.',
    description: "DocsBot's AI support bots automate the repetitive tickets that slow your team down. But they're not static—they learn from your human support agents, continuously improving based on how your team handles complex cases.",
    featured: false,
    highlights: [
      'Deflect up to 80% of FAQs and common tickets automatically.',
      'Deliver instant, on-brand answers across channels and in any language.',
      'Seamless human handoff when needed—no dead ends.',
      'Learns from human interactions and evolving documentation.',
    ],
  },
  {
    id: 'tier-two',
    name: 'Tier 2 Support',
    title: 'Make Your People More Efficient.',
    description: 'DocsBot becomes a real-time assistant for your Tier 2 team—surfacing accurate, contextual suggestions to help agents respond faster and with full confidence.',
    featured: true,
    highlights: [
      'Suggests replies based on docs, past tickets, and customer intent.',
      'Lives inside the tools your team already uses: Zendesk, Slack, HelpScout, Freshdesk.',
      'Reduces time spent searching, so agents focus on resolving.',
      'Captures feedback and trends to improve Tier 1 automation.',
    ],
  },
]

const dataSecurity = [
    {
        title: 'SOC 2 Type II Certification',
        description: 'Independent auditors validate our controls annually so your organization can rely on consistent safeguards.',
        icon: ShieldCheckIcon,
    },
    {
        title: 'Granular access controls',
        description: 'Role-based permissions let you control who can access what, ensuring your team sees only what they need.',
        icon: LockClosedIcon,
    },
    {
        title: 'GDPR-ready governance',
        description: 'Built-in data protection tools, export capabilities, and EU storage options keep you compliant from day one.',
        icon: GlobeAltIcon,
    },
    {
        title: 'Encryption end-to-end',
        description: 'Your data is encrypted in transit and at rest, protecting sensitive information throughout its entire lifecycle.',
        icon: ServerStackIcon,
    },
];

const dataAnalytics = [
    {
        title: 'Logs',
        description:
        "Review customer conversations and answers to continuously improve response quality.",
        image: screenshotLogs,
    },
    {
        title: 'Topic Management',
        description:
        "Automatically categorize conversations to uncover trends and knowledge gaps.",
        image: screenshotTopicManagement,
    },
    {
        title: 'Visualization',
        description:
        "Track performance with clear, interactive graphs and charts.",
        image: screenshotVisualization,
    },
    {
        title: 'Reports',
        description:
        'Share insights effortlessly with clients and teams across your organization.',
        image: screenshotReports,
    },
]

const dataResults = [
  {
    title: 'Questions Answered',
    description: 'Millions of customer questions have been accurately answered by DocsBot’s AI this year.',
    note: '4M',
    background: 'neutral-100',
    foreground: 'gray-900',
    className: 'lg:flex-1 lg:self-stretch',
  },
  {
    title: 'Automated Conversation Resolutions',
    description: 'Most customer conversations resolved automatically, no escalation to human agents needed.',
    note: '86%',
    background: 'gray-900',
    foreground: 'neutral-50',
    className: 'sm:w-10/12 lg:w-full lg:flex-1 lg:gap-y-[10rem]',
  },
  {
    title: 'Conversations Deflected',
    description: 'Resolve customer inquiries before they ever reach a human for lighter queues and happier customers.',
    note: '95%',
    background: 'teal-500',
    foreground: 'neutral-50',
    className: 'sm:w-11/12 lg:w-full lg:flex-1 lg:gap-y-[12rem] lg:mt-12',
  },
  {
    title: 'Hours Saved',
    description: "That's 261 hours per bot your team gets back each year to reinvest in your product.",
    note: '261 hrs',
    background: 'teal-100',
    foreground: 'gray-900',
    className: 'sm:w-9/12 lg:w-full flex-1 sm:gap-x-4',
  },
]

const dataFaq = [
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

export default function Home() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const propsHero = {
    title: 'Clone Your Team. AI for Customer Success.',
    subtitle: "AI Customer Support Agents",
    description: "AI bots for customer service that resolve 84% of support tickets instantly. DocsBot's AI support agents speak your tone, run 24/7, and need no code to set up.",
    primaryButton: {
      href: '/register',
      label: 'Get Started Free',
    },
    secondaryButton: {
      label: 'See It In Action →',
      onClick: () => setIsVideoOpen(true),
    }
  }

  const propsOverview = {
    title: <>Support is changing.<br/>We've got you.</>,
    description: 'Turn your knowledge base and ticket history into instant answers for your customers with our AI support automation platform.',
    data: dataOverview,
  }

  const propsIntegrations = {
    title: <>Unify Your Data.<br />Clarify Your Conversations.</>,
    description: 'With 28+ native integrations and over 7,000 app connections, DocsBot brings all your customer insights together, so your AI agents always respond with clarity and confidence.',
    primaryButton: {
      href: '/register',
      label: 'Integrate with 7000+ Apps',
    },
  }

  const propsFeatures = {
    title: 'AI Support is a Better Customer Experience.',
    description: 'DocsBot meets customers where they are—faster, and in their language.',
    data: dataFeatures,
    banner: {
      variant: "juggling",
      title: "See the power of AI-first customer service in action",
      content: "Implement Self-Serve AI agents and transform your customer support experience.",
      primaryButton: {
        href: "/register",
        label: "Get Started Free",
      },
      secondaryButton: {
        label: "Watch a Demo →",
        onClick: () => setIsVideoOpen(true),
      },
      isReversed: false,
    },
  }

  const propsBenefits = {
    title: 'Upgrade How You Work',
    description: 'Choose your role and see what DocsBot can do for you.',
    initialPersonaKey: 'supportManager',
  }

  const propsTiers = {
    title: 'Better Customer Success at Every Level',
    description: 'Automate Tier 1 and empower Tier 2 with smarter, faster answers.',
    data: dataTiers,
  }

  const propsSecurity = {
    title: 'Enterprise-Grade Protection',
    description: 'Earn customer trust with independently audited and certified security, compliance, and data protection at every layer.',
    data: dataSecurity,
  }

  const propsAnalytics = {
    title: 'Know What Your Customers Need',
    description: 'Share insights across your organization to improve CSAT, identify gaps, and strengthen every customer interaction.',
    data: dataAnalytics,
    banner: {
      title: "Turn Customer Signals Into Support Wins",
      content: "Unlock AI powered insights that highlight trends, improve CSAT, and guide smarter team decisions.",
      primaryButton: {
        href: "/register",
        label: "Unlock AI Insights",
      },
      secondaryButton: {
        label: "Watch a Demo →",
        onClick: () => setIsVideoOpen(true),
      },
    },
  }

  const propsDesign = {
    title: 'No Code. No Complexity.',
    description: 'DocsBot\'s AI support agents are easy to set up and even easier to love. Just connect your docs or help desk—no code, no AI expertise, no engineering help required. From first setup to embedding a fully branded chatbot in your website or app, everything is simple, fast, and designed to fit right into your workflow.',
  }

  const propsPricing = {
    title: 'Pricing That Grows With You',
    description: 'Simple, transparent pricing that makes ROI a no-brainer.',
    primaryButton: {
      href: '/pricing',
      label: 'See Plans & Pricing',
    },
  }

  const propsResults = {
    title: 'Real Results. Not Hype.',
    description: 'See how support teams are deflecting tickets, reducing costs, and improving CSAT—without writing a single line of code.',
    data: dataResults,
  }

  const propsTestimonials = {
    title: 'Testimonials',
    description: "What support professionals are saying (Don't take our word for it)",
  }

  const propsFaq = {
    title: '',
    data: dataFaq,
    banner: {
      variant: 'confetti',
      title: 'Deliver Faster, Smarter Customer Service',
      content: "It's time to use AI agents to handle common requests, reduce workload, and improve every customer touchpoint.",
      primaryButton: {
        href: '/register',
        label: 'Start Automating Support',
      },
      secondaryButton: {
        label: "See It In Action →",
        onClick: () => setIsVideoOpen(true),
      },
      isReversed: true,
    },
  }

  return (
    <>
      <NextSeo
        title="AI Customer Support Chatbot - Automate Support 24/7 | DocsBot AI"
        description="AI chatbot for customer service that resolves 84% of support tickets instantly. Customer service AI chatbot for websites that speaks your tone, runs 24/7, and needs no code. Automate customer support with AI."
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: 'https://docsbot.ai/customer-support',
          siteName: 'DocsBot AI',
          title: 'AI Customer Support Chatbot - Automate Support 24/7 | DocsBot AI',
          description: 'AI chatbot for customer service that resolves 84% of support tickets instantly. Customer service AI chatbot for websites that speaks your tone, runs 24/7, and needs no code.',
          images: [
            {
              url: 'https://docsbot.ai/og-customer-support.png',
              width: 1200,
              height: 630,
              alt: 'AI Customer Support Chatbot - DocsBot AI',
            },
          ],
        }}
        twitter={{
          handle: '@docsbotai',
          site: '@docsbotai',
          cardType: 'summary_large_image',
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content: 'AI customer support chatbot, AI chatbot customer support, AI chatbot for customer service, customer service AI chatbot for websites, customer support automation, AI support agent, automated customer service, AI helpdesk chatbot',
          },
        ]}
      />
      <Head>
        <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>

      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />

          <main>
            <Hero { ...propsHero } />

            <Brands />

            <SectionReveal direction="down" amount={0.5}>
              <Overview { ...propsOverview } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Integrations { ...propsIntegrations } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Features { ...propsFeatures } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Benefits { ...propsBenefits } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Tiers { ...propsTiers } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Security { ...propsSecurity } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Analytics { ...propsAnalytics } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Design { ...propsDesign } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Pricing { ...propsPricing } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Results { ...propsResults } />
            </SectionReveal>

            <MattCromwellQuote />

            <SectionReveal direction="down" amount={0.25}>
              <Testimonials { ...propsTestimonials } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Faq { ...propsFaq } />
            </SectionReveal>
          </main>

          <Footer />
        </div>
      </div>

      <VideoOverlay
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
      />

      {/* Remove Later */}
      <div className="bg-neutral-50 text-neutral-50"></div>
      <div className="bg-neutral-100 text-neutral-100"></div>
      <div className="bg-white text-white"></div>
      <div className="bg-gray-900 text-gray-900"></div>
      <div className="bg-slate-900 text-slate-900"></div>
      <div className="bg-slate-600 text-slate-600"></div>
      <div className="bg-slate-200 text-slate-200"></div>
      <div className="text-left transform-3d rotate-x-45"></div>
    </>
  )
}
