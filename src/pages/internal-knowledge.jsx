import React, { useState } from 'react'
import {
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  UserGroupIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid'

import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AIActionContextSection from '@/components/AIActionContextSection'
import { SplitSection, Section, SectionContent, Highlights, Button } from "@/components/elements"
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

// Import: Elements
import { DataConnection, DeepResearch } from '@/components/customer-support/animations'
import { ConsistentInfo, FastResponses, Productivity, ReduceFrustration, Onboarding } from '@/components/internal-knowledge/animations'
import { VideoOverlay } from '@/components/elements'
import { InternalPricingCalculator } from '@/components/internal-knowledge/InternalPricingCalculator'

// Import: Page Sections
import { Hero, HighlightWord } from '@/components/customer-support/Hero'
import { Brands } from '@/components/customer-support/Brands'
import { Overview } from '@/components/customer-support/Overview'
import { Integrations } from '@/components/customer-support/Integrations'
import { Security } from '@/components/customer-support/Security'
import { Analytics } from '@/components/customer-support/Analytics'
import { Design } from '@/components/customer-support/Design'
import { Pricing } from '@/components/customer-support/Pricing'
import { Results } from '@/components/customer-support/Results'
import { CaseStudies } from '@/components/internal-knowledge/CaseStudies'
import { Testimonials } from '@/components/customer-support/Testimonials'
import { Faq } from '@/components/customer-support/FAQs'
import { Benefits } from '@/components/customer-support/Benefits'
import { SectionReveal } from '@/components/customer-support/transitions'

// Import: Images
import screenshotLogs from "@/images/app-demo/docsbot-insights-questions.webp"
import screenshotReports from "@/images/app-demo/docsbot-insights-reports.webp"
import screenshotVisualization from "@/images/app-demo/docsbot-insights-visualization.webp"
import heroImage from "@/images/app-demo/internal-knowledge-hero.webp"
import avatar from "@/images/app-demo/internal-knowledge-avatar.png"
// Define: Data
const heroFaqs = [
  {
    question: 'How does this help new hires?',
    answer: 'It gives them instant access to all company knowledge, reducing ramp-up time and dependency on mentors.'
  },
  {
    question: 'Is my internal data secure?',
    answer: 'Yes, we use enterprise-grade security, encryption, and strict access controls to keep your data safe.'
  },
  {
    question: 'Does it work with our existing tools?',
    answer: 'Absolutely. We integrate with Slack, Microsoft Teams, Confluence, Google Drive, and more.'
  },
  {
    question: 'Can it handle multiple languages?',
    answer: 'Yes, DocsBot instantly translates and answers questions in over 100 languages.'
  },
  {
    question: 'Can I upload PDF files?',
    answer: 'Yes, you can upload PDFs, Word documents, and text files directly to train your bots.'
  },
  {
    question: 'How do I update the knowledge base?',
    answer: 'Simply add or update your source documents, and DocsBot will automatically retrain to reflect the changes.'
  },
  {
    question: 'Can I view chat history?',
    answer: 'Yes, you can access detailed logs of all conversations to understand what your team is asking.'
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, our robust API allows you to integrate DocsBot into your own internal applications and workflows.'
  }
]

const personas = {
  hr: {
    label: "HR & People Ops",
    headline: "Your Always-Available HR Assistant",
    question: "How can DocsBot help our HR team and employees?",
    paragraphs: [
      "DocsBot transforms your employee handbook, policies, and HR documents into an instant self-service resource. Employees get immediate answers to questions about PTO, benefits, expense policies, and company procedures—without waiting for an HR response.",
      "For new hires, it's like having a dedicated onboarding buddy. They can ask about everything from setting up direct deposit to understanding the org chart, all while HR focuses on strategic people initiatives instead of answering the same questions repeatedly.",
      "Plus, DocsBot ensures every employee gets the same accurate, up-to-date information—no more outdated policy confusion or inconsistent answers across teams.",
    ],
  },
  itHelpdesk: {
    label: "IT Helpdesk",
    headline: "Deflect Tickets. Empower Employees.",
    question: "What can DocsBot do for our IT helpdesk team?",
    paragraphs: [
      "DocsBot handles the repetitive IT questions that clog your ticket queue—password resets, VPN setup, software installation guides, printer troubleshooting, and more. Employees get instant resolutions instead of waiting in a queue.",
      "It learns from your IT documentation, runbooks, and knowledge base articles, delivering step-by-step guidance that's always accurate and consistent. Your IT team can focus on complex infrastructure issues instead of explaining how to connect to WiFi for the hundredth time.",
      "With 24/7 availability, DocsBot supports employees across time zones and outside business hours, reducing after-hours escalations and improving employee satisfaction.",
    ],
  },
  marketing: {
    label: "Marketing & Creative",
    headline: "Unleash Creative Productivity",
    question: "How does DocsBot help marketing and creative teams?",
    paragraphs: [
      "DocsBot becomes your team's brand guardian and creative accelerator. Instantly access brand guidelines, messaging frameworks, approved imagery, and past campaign assets without digging through folders or pinging colleagues.",
      "Need to quickly check the approved product positioning? Wondering about the tone of voice for a specific audience? Looking for competitor messaging from last quarter's analysis? DocsBot has it all at your fingertips.",
      "For content ideation, use DocsBot as a brainstorming partner—it knows your brand inside and out, making it perfect for generating on-brand content ideas, repurposing existing materials, and ensuring consistency across all channels.",
    ],
  },
  sales: {
    label: "Sales & Revenue",
    headline: "Close Deals Faster with Instant Knowledge",
    question: "What's the value of DocsBot for sales teams?",
    paragraphs: [
      "DocsBot puts your entire sales playbook, competitive battle cards, pricing guidelines, and product specs at every rep's fingertips. No more scrambling before calls or pinging product managers for basic feature questions.",
      "New reps ramp faster because they can instantly access tribal knowledge, objection handling scripts, and customer success stories. It's like giving every rep the knowledge of your top performer from day one.",
      "During live calls, reps can quickly pull up technical details, integration requirements, or case studies—keeping conversations flowing and demonstrating expertise that builds buyer confidence.",
    ],
  },
  engineering: {
    label: "Engineering & DevOps",
    headline: "Documentation That Actually Gets Used",
    question: "How can DocsBot help engineering teams?",
    paragraphs: [
      "DocsBot makes your technical documentation actually discoverable. Engineers can instantly find architecture decisions, API references, code standards, deployment procedures, and runbooks without context-switching or interrupting teammates.",
      "For on-call rotations, it's invaluable—surface incident response playbooks, troubleshooting guides, and system dependencies in seconds. Reduce MTTR by getting answers faster when every minute counts.",
      (
        <>
          Onboarding new engineers becomes seamless. They can ask questions about the codebase, development environment setup, and team conventions without feeling like a burden. Your senior engineers get their focus time back. For public-facing technical documentation sites, see our{' '}
          <Link href="/documentation-chatbot" className="text-cyan-400 hover:text-cyan-300 underline">
            documentation chatbot solution
          </Link>
          .
        </>
      ),
    ],
  },
  operations: {
    label: "Operations & Compliance",
    headline: "Streamline Processes, Ensure Compliance",
    question: "What does DocsBot offer for operations and compliance teams?",
    paragraphs: [
      "DocsBot turns your SOPs, compliance documentation, and process guides into an interactive knowledge base. Team members can quickly find the right procedure for any situation, reducing errors and ensuring consistency.",
      "For compliance-heavy industries, DocsBot helps employees understand and follow regulations correctly. Instead of misinterpreting policy documents, they get clear, contextual guidance that reduces risk and audit findings.",
      "Track what questions employees are asking to identify process gaps, training needs, and documentation improvements. Use these insights to proactively strengthen your operational foundation.",
    ],
  },
  finance: {
    label: "Finance & Accounting",
    headline: "Financial Clarity at Everyone's Fingertips",
    question: "How does DocsBot support finance teams?",
    paragraphs: [
      "DocsBot empowers employees to self-serve on expense policies, approval workflows, budget guidelines, and procurement procedures. No more back-and-forth emails asking if something requires a PO or how to submit a reimbursement.",
      "For finance team members, it provides instant access to accounting standards, month-end procedures, audit documentation, and vendor policies. New analysts get up to speed faster with institutional knowledge always available.",
      "Reduce policy violations and processing delays by ensuring everyone understands the rules upfront. DocsBot answers questions before they become compliance issues or bottleneck your finance workflows.",
    ],
  },
  legal: {
    label: "Legal & Contracts",
    headline: "Legal Knowledge Without the Wait",
    question: "Can DocsBot help with legal and contract questions?",
    paragraphs: [
      "DocsBot gives employees instant guidance on contract terms, legal policies, NDA requirements, and approval processes. Sales can quickly check if a contract clause is acceptable without waiting days for legal review.",
      "Train it on your contract playbook, approved terms, and negotiation guidelines so teams know exactly what's standard, what requires approval, and what's a hard no. Reduce legal bottlenecks while maintaining governance.",
      "For the legal team, DocsBot surfaces precedents, template language, and policy references instantly. Spend less time on routine inquiries and more time on strategic legal work that protects the business.",
    ],
  },
}

const dataOverview = [
  {
    title: "Connect",
    description: "Connect your internal wikis, Google Drive, Notion, Confluence, and more to create a unified knowledge base.",
    icon: DocumentTextIcon,
  },
  {
    title: "Train",
    description: "DocsBot automatically indexes and learns from your documents, becoming an expert on your company's internal knowledge.",
    icon: SparklesIcon,
  },
  {
    title: "Empower",
    description: "Give every employee instant access to accurate information via chat, Slack, or Microsoft Teams.",
    icon: UserGroupIcon,
  }
]

const dataFeatures = [
  {
    theme: 'light',
    name: 'No Code Required',
    title: "Become an AI Hero - No Special Skills Required",
    description: "No code or AI expertise required. Launch an internal chatbot for employees within minutes. Think Notion, but interactive and always instant. No bot flow charts. Just answers.",
    animation: DataConnection,
    background: 'bg-gradient-to-tr from-teal-200 to-cyan-300',
    highlights: []
  },
  {
    theme: 'medium',
    name: 'Consistent Info',
    title: "Get Everyone on the Same Page with Up-To-Date & Accurate Info",
    description: "Ensure every team member has access to the same single source of truth. Updates to documentation are instantly reflected in answers, keeping everyone aligned.",
    animation: ConsistentInfo,
    background: 'bg-gradient-to-r from-cyan-400 to-cyan-900',
    highlights: []
  },
  {
    theme: 'light',
    name: 'Fast Responses',
    title: "Fast, Intelligent Responses 24/7",
    description: "Get instant answers to internal queries, reducing wait times and enabling employees to solve problems independently around the clock.",
    animation: FastResponses,
    background: 'bg-gradient-to-tr from-teal-200 to-cyan-300',
    highlights: []
  },
  {
    theme: 'medium',
    name: 'Productivity',
    title: "Let Employees Focus More On What Matters Most",
    description: "Free up your team from searching through folders and files. Instant answers mean more time for strategic work and less time digging for information.",
    animation: Productivity,
    background: 'bg-gradient-to-tr from-teal-100 to-cyan-200',
    highlights: []
  },
  {
    theme: 'light',
    name: 'Reduce Frustration',
    title: "Reduce Employee Frustration",
    description: "Eliminate the frustration of not finding what you need. A happy team is a productive team. DocsBot reduces the cognitive load of information retrieval.",
    animation: ReduceFrustration,
    background: 'bg-gradient-to-tr from-slate-100 to-zinc-200',
    highlights: []
  },
  {
    theme: 'medium',
    name: 'Onboarding',
    title: "Onboard Faster & More Effectively",
    description: "New hires can ask your internal chatbot questions immediately without waiting for a mentor, speeding up their ramp-up time significantly.",
    animation: Onboarding,
    background: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    highlights: []
  }
]

const dataSecurity = [
    {
        title: 'SOC 2 Type II Certification',
        description: 'Independent auditors validate our controls annually so your organization can rely on consistent safeguards.',
    },
    {
        title: 'Granular access controls',
        description: 'Role-based permissions let you control who can access what, ensuring your team sees only what they need.',
    },
    {
        title: 'GDPR-ready governance',
        description: 'Built-in data protection tools, export capabilities, and EU storage options keep you compliant from day one.',
    },
    {
        title: 'Encryption end-to-end',
        description: 'Your data is encrypted in transit and at rest, protecting sensitive information throughout its entire lifecycle.',
    },
];

const dataAnalytics = [
    {
        title: 'Search Logs',
        description:
        "See what your employees are asking.",
        image: screenshotLogs,
    },
    {
        title: 'Knowledge Gaps',
        description:
        "Automatically identify questions your bot couldn't answer and identify missing documentation to improve your knowledge base.",
        image: screenshotReports,
    },
    {
        title: 'Usage Trends',
        description:
        "Track adoption and usage across different teams and departments.",
        image: screenshotVisualization,
    },
]

const dataResults = [
  {
    title: 'Faster Onboarding',
    description: 'New hires reach full productivity significantly faster with instant access to knowledge.',
    note: '50%',
    background: 'neutral-100',
    foreground: 'gray-900',
    className: 'lg:flex-1 lg:self-stretch',
  },
  {
    title: 'Ticket Reduction',
    description: 'Reduction in internal IT and HR support tickets for routine questions.',
    note: '60%',
    background: 'gray-900',
    foreground: 'neutral-50',
    className: 'sm:w-9/12 lg:w-full lg:flex-1 lg:gap-y-[5rem]',
  },
  {
    title: 'Time Saved',
    description: 'Reduction in time spent searching for information.',
    note: '90%',
    background: 'teal-500',
    foreground: 'neutral-50',
    className: 'sm:w-11/12 lg:w-full lg:flex-1 lg:gap-y-[12rem] lg:mt-12',
  },
  {
    title: 'Employee Satisfaction',
    description: "Employees report higher satisfaction when they can find what they need instantly.",
    note: '4.8/5',
    background: 'teal-100',
    foreground: 'gray-900',
    className: 'sm:w-9/12 lg:w-full flex-1 sm:gap-x-4',
  },
]

const dataFaq = [
    {
        id: 1,
        question: "What is an internal chatbot for employees?",
        answer:
        "An internal chatbot is an AI assistant trained on your company's documents, SOPs, and knowledge bases. It lets employees instantly get answers about policies, procedures, and company information without searching through files or waiting for colleagues.",
    },
    {
        id: 2,
        question: "How does an internal knowledge base chatbot work?",
        answer: (
            <>
                It connects to your existing documentation—wikis, Google Drive, Notion, Confluence, PDFs, and more. DocsBot indexes this content and uses AI to understand questions and provide accurate, contextual answers with source citations. For public-facing technical documentation, see our{' '}
                <Link href="/documentation-chatbot" className="text-cyan-600 hover:text-cyan-700 underline">
                    documentation chatbot solution
                </Link>
                .
            </>
        ),
    },
    {
        id: 3,
        question: "Can AI answer questions from SOPs and internal documentation?",
        answer:
        "Yes! Upload your standard operating procedures, process guides, and policy documents. Employees can instantly get step-by-step guidance without searching through lengthy documents.",
    },
    {
        id: 4,
        question: "Is an internal AI assistant secure for company documents?",
        answer:
        "Yes. Your data is isolated and encrypted, we never use it to train public models, and we offer SOC 2 Type II certified controls, granular permissions, and GDPR compliance.",
        moreInfoHref: 'https://trust.docsbot.ai',
    },
    {
        id: 5,
        question: "How do I connect my internal documents?",
        answer:
        "You can upload files (PDF, DOCX, etc.), connect Google Drive, Notion, Confluence, or simply point DocsBot to your internal wiki URL.",
    },
    {
        id: 6,
        question: 'Can I restrict access to certain bots?',
        answer:
        "Yes, you can set permissions so that only specific teams or individuals can access sensitive bots or knowledge bases.",
    },
    {
        id: 7,
        question: 'Does it integrate with Slack?',
        answer:
        "Yes, our Slack integration allows employees to ask questions directly in Slack and get instant answers from DocsBot.",
    },
    {
        id: 8,
        question: 'Does it work with Microsoft Teams?',
        answer:
        "Yes, DocsBot integrates with Microsoft Teams so your team can ask questions and get instant answers right in their chat workspace.",
    },
    {
        id: 9,
        question: 'Does it work with languages other than English?',
        answer:
        "Yes. DocsBot understands and responds in any language you need, even when your documentation is English-only. Supports over 100 languages!",
    },
    {
        id: 10,
        question: 'How does DocsBot work?',
        answer:
        "We clean and chunk your sources, and use a cutting-edge agentic RAG pipeline to retrieve, rerank, and use the most relevant matches as context for the AI to answer the question.",
    },
    {
        id: 11,
        question: 'What types of content sources can I use?',
        answer: (
            <>
                Use websites, PDFs, Word docs, Markdown, HTML, RSS feeds, spreadsheets, manual entries, or our API. We support 28+ source types. Perfect for{' '}
                <Link href="/documentation-chatbot" className="text-cyan-600 hover:text-cyan-700 underline">
                    technical documentation chatbots
                </Link>
                {' '}and knowledge bases.
            </>
        ),
    },
    {
        id: 12,
        question: 'Can I automatically update my DocsBot sources?',
        answer: (
            <>
                Schedule refreshes for compatible sources like web, cloud storage, or help desk platforms daily, weekly, or monthly, and trigger manual updates anytime. Great for keeping{' '}
                <Link href="/documentation-chatbot" className="text-cyan-600 hover:text-cyan-700 underline">
                    documentation sites
                </Link>
                {' '}in sync automatically.
            </>
        ),
    },
    {
        id: 13,
        question: 'Do you have an API I can use?',
        answer:
        "Yes. Our developer docs cover the public API along with admin endpoints and usage guides.",
        moreInfoHref: '/documentation/developer',
    },
    {
        id: 14,
        question: 'How accurate is the AI?',
        answer:
        "Accuracy comes from using your own documentation, guides, and internal knowledge, ensuring answers match your company's policies and procedures.",
    },
    {
        id: 15,
        question: 'Can I create multiple bots for different teams?',
        answer:
        "Yes, you can create separate bots for different departments (HR, IT, Sales, etc.) each trained on their specific knowledge base.",
    },
    {
        id: 16,
        question: 'What kind of analytics do you provide?',
        answer:
        "Analytics vary by plan. Basics cover usage, while higher tiers unlock deeper reports, topics, sentiment, resolution rates, satisfaction, and AI-driven analysis.",
    },
    {
        id: 17,
        question: 'Are you GDPR compliant?',
        answer:
        "Yes. We act as your data processor, provide DPAs, exports, deletion tools, and EU storage or protected transfers.",
        moreInfoHref: '/legal/gdpr',
    },
    {
        id: 18,
        question: 'What support options are available?',
        answer:
        "All plans include docs, AI, and email support with response times based on plan. Enterprise customers can add custom SLAs and dedicated channels.",
    },
]

const dataDeepResearch = {
    theme: 'light',
    title: 'Deep Research',
    subtitle: 'Your Team\'s Research Superpower',
    subtitleClassName: '!text-wrap',
    description: 'Empower your teams to dig deeper. Deep Research combines your knowledge base with live web search and Code Interpreter to surface verified insights and analyze data—all in one powerful research agent.',
    highlights: [
        {
            icon: MagnifyingGlassIcon,
            title: 'Docs & Data Analysis',
            content: 'Instantly search across your internal documentation, wikis, and data sources. Get comprehensive answers with direct citations to help teams find verified information faster.',
        },
        {
            icon: GlobeAltIcon,
            title: 'Web-Enhanced Insights',
            content: 'Augment your internal knowledge with live web research. Compare industry trends, verify external information, and bring outside context into your team\'s workflows.',
        },
    ],
    buttonPrimary: {
        label: "Try Deep Research",
        href: "/register",
    },
    buttonSecondary: {
        label: "Learn More →",
        href: "/article/deep-research-is-now-available-on-docsbot",
    },
    animation: DeepResearch,
    background: 'bg-gradient-to-r from-teal-300 to-cyan-700',
}

export default function InternalKnowledge() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const propsHero = {
    title: <>Turn <HighlightWord word="every"/> <HighlightWord word="employee"/> into an instant expert (even new hires)</>,
    subtitle: "Internal AI Knowledge Assistants for Teams",
    description: "Turn your internal documents, SOPs, and company knowledge into instant answers available 24/7 and in any language.",
    primaryButton: {
      href: '/register',
      label: 'Start for free',
    },
    secondaryButton: {
      label: 'See It In Action →',
      onClick: () => setIsVideoOpen(true), 
    }
  }

  const propsOverview = {
    title: <>Unlock Your Company's<br/>Hidden Knowledge.</>,
    description: 'Stop the endless searching. Turn your disparate documents into an AI knowledge assistant your whole team can use.',
    data: dataOverview,
  }

  const propsIntegrations = {
    title: <>Integrates With Your<br />Other Tools & Systems.</>,
    description: 'Your internal chatbot connects with the tools you already use, ensuring knowledge is accessible where your team works.',
    primaryButton: {
      href: '/integrations',
      label: 'View all integrations',
    },
  }

  const propsSecurity = {
    title: 'Enterprise-Grade Security',
    description: 'Your internal data is sensitive. Our enterprise AI assistant protects it with the highest standards of security and compliance.',
    data: dataSecurity,
  }

  const propsAnalytics = {
    title: 'Gain Insights into Internal Knowledge',
    description: 'Understand what your team is looking for and where your documentation needs improvement.',
    data: dataAnalytics,
    banner: {
      title: "Turn Internal Signals Into Improvements",
      content: "Use search analytics to continuously improve your internal documentation and onboarding materials.",
      primaryButton: {
        href: "/register",
        label: "Start Analyzing",
      },
      secondaryButton: {
        label: "Watch a Demo →",
        onClick: () => setIsVideoOpen(true),
      },
    },
  }

  const propsPricing = {
    title: 'Prices that Make the ROI Conversation Easy',
    description: 'Scalable plans for teams of all sizes.',
    primaryButton: {
      href: '/pricing',
      label: 'See Plans & Pricing',
    },
  }

  const propsBenefits = {
    title: 'Upgrade How You Work',
    description: 'Choose your role and see how an AI assistant for employees transforms your team\'s knowledge access.',
    initialPersonaKey: 'hr',
    personas: personas,
  }

  const propsResults = {
    title: 'Real Impact',
    description: 'See how companies are improving efficiency with an internal knowledge base chatbot.',
    data: dataResults,
  }

  const propsCaseStudies = {
    title: 'Success Stories',
    description:
      'See how other businesses are leveraging DocsBot for internal knowledge.',
  }

  const propsTestimonials = {
    title: 'Testimonials',
    description: "What our customers are saying",
    aiPrompt: "Tell me why DocsBot is a great choice for an internal knowledge base and employee self-service",
  }

  const propsFaq = {
    title: 'Frequently Asked Questions',
    data: dataFaq,
    banner: {
      variant: 'confetti',
      title: 'Ready to enable your team?',
      content: "Start your free trial today and experience the power of instant internal knowledge.",
      primaryButton: {
        href: '/register',
        label: 'Start for free',
      },
      secondaryButton: {
        label: "See It In Action →",
        onClick: () => setIsVideoOpen(true),
      },
      isReversed: true,
    },
  }

  // Helper function to extract text from JSX or string
  const extractText = (content) => {
    if (typeof content === 'string') return content;
    if (React.isValidElement(content)) {
      if (content.props && content.props.children) {
        return React.Children.toArray(content.props.children)
          .map(child => extractText(child))
          .join('');
      }
      return '';
    }
    return String(content);
  };

  // Combine all FAQs for JSON-LD schema
  const allFaqs = [
    // Hero FAQs
    ...heroFaqs.map(faq => ({
      questionName: faq.question,
      acceptedAnswerText: faq.answer,
    })),
    // Persona chat responses (questions + paragraphs as answers)
    ...Object.values(personas).map(persona => ({
      questionName: persona.question,
      acceptedAnswerText: persona.paragraphs.map(p => extractText(p)).join('\n\n'),
    })),
    // Main FAQ data
    ...dataFaq.map(faq => ({
      questionName: faq.question,
      acceptedAnswerText: extractText(faq.answer),
    })),
  ]

  const pageUrl = buildPageUrl('/internal-knowledge')
  const pageTitle = 'Internal Chatbot for Employees | AI Knowledge Assistant | DocsBot AI'
  const pageDescription =
    'Deploy an internal knowledge base chatbot that gives employees instant answers from SOPs, company documents, and internal documentation. Enterprise AI assistant with 24/7 access.'

  const webPage = buildWebPage({
    url: pageUrl,
    name: pageTitle,
    description: pageDescription,
  })

  const faqPage = buildFaqPage({
    url: pageUrl,
    mainEntity: buildFaqEntities(allFaqs),
  })

  const service = buildService({
    url: pageUrl,
    name: 'DocsBot AI Internal Knowledge Chatbot',
    description: pageDescription,
    serviceType: 'Internal knowledge base chatbot',
  })

  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, faqPage, service],
  }

  return (
    <>
      <JsonLd id="internal-knowledge-schema" data={schema} />
      <NextSeo
        title="Internal Chatbot for Employees | AI Knowledge Assistant | DocsBot AI"
        description="Deploy an internal knowledge base chatbot that gives employees instant answers from SOPs, company documents, and internal documentation. Enterprise AI assistant with 24/7 access."
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: 'https://docsbot.ai/internal-knowledge',
          siteName: 'DocsBot AI',
          title: 'Internal Chatbot for Employees | AI Knowledge Assistant | DocsBot AI',
          description: 'Deploy an internal knowledge base chatbot that gives employees instant answers from SOPs and company documents.',
        }}
      />
      
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />

          <main>
            <Hero
              { ...propsHero }
              heroFaqs={heroFaqs}
              heroImage={heroImage}
              avatar={avatar}
            />

            <Brands title="Trusted by innovative teams and enterprises globally" />

            <SectionReveal direction="down" amount={0.5}>
              <Overview { ...propsOverview } />
            </SectionReveal>

            <Section className="!gap-0 !lg:gap-0 pb-0 lg:pb-0 !pt-8 lg:!pt-8">
                {dataFeatures.map((feature, index) => {
                    const Cover = feature.animation ? feature.animation : () => (
                        <div className="h-[28rem] w-full relative">
                            <Image src={feature.image} alt="" fill className="object-contain" />
                        </div>
                    )

                    return (
                        <SplitSection
                            key={index}
                            theme={feature.theme}
                            title={feature.name}
                            subtitle={feature.title}
                            description={feature.description}
                            cover={Cover}
                            coverBackground={feature.background}
                            isReversed={index % 2 !== 0}
                        >
                            <Highlights data={feature.highlights} />
                        </SplitSection>
                    )
                })}
            </Section>

            <SectionReveal direction="down" amount={0.25}>
              <SplitSection
                theme={dataDeepResearch.theme}
                title={dataDeepResearch.title}
                subtitle={dataDeepResearch.subtitle}
                subtitleClassName={dataDeepResearch.subtitleClassName}
                description={dataDeepResearch.description}
                cover={dataDeepResearch.animation}
                coverBackground={dataDeepResearch.background}
                isReversed={false}
              >
                <Highlights data={dataDeepResearch.highlights} />

                <div className="flex flex-col md:flex-row md:items-center gap-4 mt-8">
                  <Button
                    theme="opalite"
                    variant="primary"
                    {...dataDeepResearch.buttonPrimary}
                  />
                  <Button
                    theme="dark"
                    variant="secondary"
                    {...dataDeepResearch.buttonSecondary}
                  />
                </div>
              </SplitSection>
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <AIActionContextSection variant="internal" className="bg-gray-50" />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Benefits { ...propsBenefits } personas={personas} />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Results { ...propsResults } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Integrations { ...propsIntegrations } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Security { ...propsSecurity } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Analytics { ...propsAnalytics } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Pricing { ...propsPricing } Calculator={InternalPricingCalculator} />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <CaseStudies { ...propsCaseStudies } />
            </SectionReveal>

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
    </>
  )
}
