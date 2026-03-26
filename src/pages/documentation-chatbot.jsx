import { useEffect, useId, useState } from 'react'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import {
  LockClosedIcon,
  SwatchIcon,
  ChartPieIcon,
  GlobeAltIcon,
  ServerStackIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  LinkIcon,
  AcademicCapIcon,
  ShareIcon
} from '@heroicons/react/20/solid'
import { motion, AnimatePresence } from 'framer-motion'

import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SentryQuote from '@/components/SentryQuote'
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
import { VideoOverlay, Button } from '@/components/elements'

// Import: Page Sections
import { Hero, HighlightWord } from '@/components/customer-support/Hero'
import { Brands } from '@/components/customer-support/Brands'
import { Overview } from '@/components/customer-support/Overview'
import { Integrations } from '@/components/customer-support/Integrations'
import { Features } from '@/components/customer-support/Features'
import { Security } from '@/components/customer-support/Security'
import { Analytics } from '@/components/customer-support/Analytics'
import { Design } from '@/components/customer-support/Design'
import { Results } from '@/components/customer-support/Results'
import { Testimonials } from '@/components/customer-support/Testimonials'
import { Faq } from '@/components/customer-support/FAQs'
import { SectionReveal } from '@/components/customer-support/transitions'
import { AskAIModels } from '@/components/customer-support/call-to-action'

// Import: Animations
import { AccurateAnswers } from '@/components/customer-support/animations'
import { ChatBubble } from '@/components/customer-support/animation-elements'
import RobotIconSolid from '@/components/RobotIconSolid'

// Import: Images
import screenshotLogs from "@/images/app-demo/docsbot-insights-questions.webp"
import screenshotTopicManagement from "@/images/app-demo/docsbot-insights-topic-management.webp"
import screenshotVisualization from "@/images/app-demo/docsbot-insights-visualization.webp"
import screenshotReports from "@/images/app-demo/docsbot-insights-reports.webp"
import womanHeroSm from '@/images/app-demo/woman-hero-sm.webp'
import womanAvatar from '@/images/app-demo/woman-avatar.webp'

// Custom Animations
// Original Source Citations Animation (for Features section)
const SourceCitationsAnimation = () => {
  const citations = [
    {
      title: 'API Reference v2.0',
      meta: 'Updated 2 days ago',
      icon: DocumentTextIcon,
    },
    {
      title: 'Rate Limiting Guide',
      meta: 'Product Docs → Authorization',
      icon: LinkIcon,
    },
  ]

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: 0.9,
        staggerChildren: 0.35,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  }

  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimationKey((prev) => prev + 1)
    }, 4000)
    return () => clearTimeout(timeout)
  }, [animationKey])

  return (
    <div className="size-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center overflow-hidden p-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <ChatBubble
            isBot={true}
            content="According to the API documentation, the rate limit is 100 requests per minute."
            shadowSize="md"
            shadowColor="gray-900/40"
          />
        </motion.div>

        <motion.div
          key={animationKey}
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3 items-center"
        >
          {citations.map((citation) => {
            const Icon = citation.icon
            return (
              <motion.div
                key={`${animationKey}-${citation.title}`}
                variants={itemVariants}
                className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium text-cyan-900 max-w-[20rem] w-full"
              >
                <div className="size-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                  <Icon className="size-4" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold leading-tight">{citation.title}</p>
                  <p className="text-[11px] text-cyan-700/80">{citation.meta}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

// Technical Documentation Animation (for "Built for Technical Documentation" section)
const TechnicalDocsAnimation = () => {
  const [screen, setScreen] = useState(1) // 1: question, 2: understanding, 3: answer
  const [showPages, setShowPages] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  const bubbleProps = {
    shadowSize: 'md',
    shadowColor: 'gray-900/60',
  }

  const slideIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  }

  // Document pages representing technical documentation
  const docs = [
    { title: 'API Reference', section: 'Authentication' },
    { title: 'API Reference', section: 'Rate Limits' },
    { title: 'Integration Guide', section: 'Webhooks' },
  ]

  useEffect(() => {
    // Screen 1: Show question (2 seconds)
    const timer1 = setTimeout(() => {
      setScreen(2)
    }, 2000)

    // Screen 2: Show "Understanding across pages" with pages appearing (3 seconds)
    const timer2 = setTimeout(() => {
      setShowPages(true)
    }, 2500)

    const timer3 = setTimeout(() => {
      setScreen(3)
      setShowPages(false)
      setShowAnswer(true) // Show answer immediately when screen 3 starts (delay handled in animation)
    }, 5000)

    const timer4 = setTimeout(() => {
      setScreen(1) // Reset to screen 1
      setShowAnswer(false)
    }, 9000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [screen === 1]) // Reset when back to screen 1

  return (
    <div className="size-full bg-gradient-to-r from-cyan-600 to-cyan-300">
      <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
        <AnimatePresence mode="wait">
          {/* Screen 1: Original Question Only */}
          {screen === 1 && (
            <motion.div
              key="screen1"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideIn}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
              className="w-full"
            >
              <ChatBubble
                isBot={false}
                content="How do I implement authentication with rate limiting across multiple API endpoints?"
                avatar={womanAvatar}
                {...bubbleProps}
              />
            </motion.div>
          )}

          {/* Screen 2: "Understanding across pages" with pages appearing */}
          {screen === 2 && (
            <motion.div
              key="screen2"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideIn}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col items-center gap-8"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideIn}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-white/90"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <ArrowPathIcon className="size-5" />
                </motion.div>
                <span className="text-sm font-medium">Understanding across pages...</span>
              </motion.div>

              {/* Document Pages - appearing with stagger */}
              {showPages && (
                <div className="flex items-center justify-center gap-3 relative">
                  {docs.map((doc, index) => (
                    <motion.div
                      key={`screen2-${doc.section}`}
                      initial="hidden"
                      animate="visible"
                      variants={slideIn}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                        delay: 0.3 + (index * 0.2),
                      }}
                      className="relative"
                    >
                      <div className="w-20 h-28 bg-white rounded-lg shadow-xl flex flex-col p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <DocumentTextIcon className="size-4 text-cyan-600" />
                          <span className="text-[10px] font-semibold text-cyan-900 truncate">{doc.title}</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="h-1 bg-cyan-100 rounded w-full"></div>
                          <div className="h-1 bg-cyan-100 rounded w-3/4"></div>
                          <div className="h-1 bg-cyan-100 rounded w-full"></div>
                        </div>
                        <div className="text-[9px] text-cyan-700 font-medium mt-auto">{doc.section}</div>
                      </div>
                      
                      {/* Connection lines between documents */}
                      {index < docs.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 + (index * 0.2) }}
                          className="absolute top-1/2 right-0 w-12 h-0.5 bg-white/60 transform -translate-y-1/2 translate-x-full"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Screen 3: Question with Answer */}
          {screen === 3 && (
            <motion.div
              key="screen3"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideIn}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full flex flex-col gap-8"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideIn}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
                className="w-full"
              >
                <ChatBubble
                  isBot={false}
                  content="How do I implement authentication with rate limiting across multiple API endpoints?"
                  {...bubbleProps}
                />
              </motion.div>

              {showAnswer && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={slideIn}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.6 }}
                  className="w-full"
                >
                  <ChatBubble
                    isBot={true}
                    content="Based on the Authentication and Rate Limits sections, you'll need to include an API key in the Authorization header. The rate limit is 100 requests per minute per key. For webhooks, use the same authentication method as documented in the Integration Guide."
                    {...bubbleProps}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const AlwaysSyncedAnimation = () => {
    const [docKey, setDocKey] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setDocKey((prev) => prev + 1)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="size-full bg-gradient-to-br from-teal-500 via-cyan-600 to-cyan-700 flex items-center justify-center overflow-hidden relative">
            <div className="relative z-10 flex items-center gap-12">
                 {/* Source Doc */}
                 <div className="relative">
                    {/* Stacked documents behind */}
                    <motion.div 
                        key={docKey - 1}
                        initial={{ opacity: 0.3, scale: 0.95, y: 0 }}
                        animate={{ opacity: 0.2, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.3 }}
                        className="absolute w-24 h-32 bg-white rounded-xl shadow-xl flex flex-col p-3 items-center justify-center gap-1.5"
                    />
                    <motion.div 
                        key={docKey - 2}
                        initial={{ opacity: 0.2, scale: 0.9, y: 0 }}
                        animate={{ opacity: 0.1, scale: 0.85, y: 8 }}
                        transition={{ duration: 0.3 }}
                        className="absolute w-24 h-32 bg-white rounded-xl shadow-lg flex flex-col p-3 items-center justify-center gap-1.5"
                    />
                    {/* New document appearing */}
                    <motion.div 
                        key={docKey}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                            filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"]
                        }}
                        transition={{ 
                            opacity: { duration: 0.4 },
                            scale: { duration: 0.4 },
                            y: { duration: 0.4 },
                            filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="relative w-24 h-32 bg-white rounded-xl shadow-2xl flex flex-col p-3 items-center justify-center gap-1.5"
                    >
                        <DocumentTextIcon className="size-8 text-slate-400" />
                        <div className="w-full h-1.5 bg-slate-200 rounded-full"></div>
                        <div className="w-3/4 h-1.5 bg-slate-200 rounded-full self-start"></div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full"></div>
                    </motion.div>
                 </div>

                 {/* Sync Indicator */}
                 <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 >
                    <ArrowPathIcon className="size-12 text-white" />
                 </motion.div>

                 {/* Bot Brain */}
                 <motion.div
                     animate={{ 
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                 >
                    <ServerStackIcon className="size-20 text-white drop-shadow-lg" />
                 </motion.div>
            </div>
        </div>
    )
}

// Define: Hero FAQs
const heroFaqs = [
  {
    question: 'How does DocsBot help with documentation?',
    answer:
      'DocsBot turns your technical documentation into an interactive AI assistant that answers questions instantly, helping users find information without searching through multiple pages.'
  },
  {
    question: 'What types of documentation can I use?',
    answer:
      'You can connect PDFs, Markdown files, API references, wikis, Notion pages, websites, and more. DocsBot supports 28+ source types and automatically stays in sync with your content.'
  },
  {
    question: 'Can DocsBot understand technical content?',
    answer:
      'Yes, DocsBot is optimized for technical documentation and can handle complex queries that span multiple pages, understand code snippets, and provide accurate answers with source citations.'
  },
  {
    question: 'How accurate are the answers?',
    answer:
      'Every answer includes source citations linking back to your documentation, so users can verify information and dive deeper when needed. DocsBot is trained specifically on your content.'
  },
  {
    question: 'Does it work with code examples?',
    answer:
      'Yes, DocsBot renders code blocks with syntax highlighting and understands technical queries about APIs, integrations, and implementation details from your documentation.'
  },
  {
    question: 'Can I use it for internal team documentation?',
    answer:
      'Absolutely. Many teams use DocsBot as an internal knowledge search engine, connecting it to Slack or Microsoft Teams to help employees find answers from wikis and SOPs instantly.'
  },
  {
    question: 'How often does it update with new documentation?',
    answer:
      'You can schedule automatic syncs daily, weekly, or monthly, or trigger manual updates whenever you deploy major changes. DocsBot stays current with your latest documentation.'
  },
  {
    question: 'Is my documentation secure?',
    answer:
      'Yes. We use encryption in transit and at rest, offer granular access controls, and are SOC 2 Type II certified. You can keep internal docs private or share public guides.'
  },
]

// Define: Data
const dataOverview = [
  {
    title: "Connect",
    description: "Connect your documentation, PDFs, wikis, Notion, and more. DocsBot reads and indexes your documentation so it is always ready to answer questions in plain language.",
    icon: ArrowPathIcon,
  },
  {
    title: "Share",
    description: "Deploy a chat widget directly on your site. Give readers a conversational way to explore and understand your docs without navigating page by page.",
    icon: ShareIcon,
  },
  {
    title: "Learn",
    description: "DocsBot stays in sync with your documentation automatically. When your docs change, your chatbot reflects the latest information without manual updates.",
    icon: AcademicCapIcon,
  }
]

const dataFeatures = [
  {
    name: 'Instant Answers',
    summary: "Get clear answers from your documentation without scrolling, guessing, or opening multiple pages.",
    description: "Your technical documentation is only useful if people can find what they need. DocsBot understands complex technical queries and delivers instant, code-aware answers directly from your manuals, API references, and internal guides, reducing support tickets and frustration.",
    animation: AccurateAnswers,
    icon: function SearchIcon() {
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
    name: 'Source Citations',
    summary: 'Every answer links to the source documents so users can verify accuracy and dive deeper when needed.',
    description: 'AI hallucinations are a risk you can’t afford with technical docs. DocsBot provides direct links to the source material for every answer, so your users can verify information and dive deeper when needed, increasing confidence in your documentation.',
    animation: SourceCitationsAnimation,
    icon: function CitationIcon() {
      return (
        <>
           <path opacity=".5" d="M8 17a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" fill="#fff" />
           <path d="M8 10a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2Z" fill="#fff" />
        </>
      )
    },
  },
  {
    name: 'Always Up-to-Date',
    summary: "Your chatbot evolves with your docs ensuring answers always reflect your most up-to-date product information.",
    description: 'Manual updates are a thing of the past. Schedule automatic re-indexing of your websites, help centers, and cloud files. When you push a new version or update a wiki page, DocsBot learns it immediately, ensuring your users always have the latest information.',
    animation: AlwaysSyncedAnimation,
    icon: function SyncIcon() {
      return (
         <path d="M12 28.395V28a6 6 0 0 1 12 0v.395A11.945 11.945 0 0 1 18 30c-2.186 0-4.235-.584-6-1.605ZM21 16.5c0-1.933-.5-3.5-3-3.5s-3 1.567-3 3.5 1.343 3.5 3 3.5 3-1.567 3-3.5Z" fill="#fff" />
      )
    },
  },
]

const dataFaq = [
    {
        id: 1,
        question: "What file formats can I train the chatbot on?",
        answer:
        "DocsBot supports a wide range of formats including PDF, DOCX, TXT, Markdown, CSV, and HTML. You can also ingest public URLs, sitemaps, Zendesk Help Centers, and Notion pages.",
    },
    {
        id: 2,
        question: 'How often does the bot sync with my documentation?',
        answer:
        "You can schedule automatic syncs (daily, weekly, monthly) for web sources and cloud integrations. You can also trigger a manual sync via the dashboard or API whenever you deploy major updates.",
    },
    {
        id: 3,
        question: 'Is my internal documentation secure?',
        answer:
        "Yes. We prioritize security with encryption in transit and at rest. You can control access to your bots, making them public for users or private for internal team use only. We are SOC 2 Type II certified.",
        moreInfoHref: 'https://trust.docsbot.ai',
    },
    {
        id: 4,
        question: 'Can I embed the chatbot on my documentation site?',
        answer:
        "Absolutely. We provide a simple copy-paste widget script that works on any website. We also have a React component and integrations for popular platforms like WordPress.",
    },
    {
        id: 5,
        question: 'Does it support code snippets?',
        answer:
        "Yes, DocsBot is optimized for technical content and renders code blocks with syntax highlighting in its responses, making it perfect for API docs and developer guides.",
    },
    {
        id: 6,
        question: 'Can I use it for internal team search?',
        answer: (
            <>
                Yes! Many teams use DocsBot as an internal knowledge search engine. Connect it to Slack or Microsoft Teams to let your employees find answers from your internal wikis and SOPs instantly. For internal knowledge bases, see our{' '}
                <Link href="/internal-knowledge" className="text-cyan-600 hover:text-cyan-700 underline">
                    internal knowledge chatbot solution
                </Link>
                .
            </>
        ),
    },
]

const propsSecurity = {
    title: 'Enterprise-Grade Security',
    description: 'Your proprietary documentation and internal data are safe with us. We employ industry-leading security measures to protect your knowledge base.',
    data: [
        {
            title: 'SOC 2 Type II Certification',
            description: 'Our security controls are independently audited annually.',
            icon: ShieldCheckIcon,
        },
        {
            title: 'Data Encryption',
            description: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256).',
            icon: LockClosedIcon,
        },
        {
            title: 'Access Controls',
            description: 'Granular permissions to control who can view or edit your bots.',
            icon: GlobeAltIcon,
        },
        {
            title: 'Private & Public Modes',
            description: 'Keep your internal docs private while sharing public guides with the world.',
            icon: ServerStackIcon,
        },
    ]
}

export default function DocumentationChatbot() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const propsHero = {
    title: <>Turn Your Documentation Into <HighlightWord word="Answers" /></>,
    subtitle: "AI Documentation Assistant",
    description: "Get instant answers from your technical docs, PDFs, and internal wikis with an AI chatbot designed for real-world, production documentation.",
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
    title: 'Search Across Platforms',
    description: 'No matter your stack, DocsBot pulls accurate answers directly from your documentation. Users do not need to know where information lives to find it.',
    data: dataOverview,
  }

  const propsFeatures = {
    title: '"I get what you mean."',
    description: 'Traditional search only works when users know what to ask. DocsBot lets users ask questions naturally and gives contextual answers directly from your docs.',
    data: dataFeatures,
    banner: {
      variant: "juggling",
      title: "Ready to upgrade your docs?",
      content: "Create a custom AI bot for your documentation in minutes.",
      primaryButton: {
        href: "/register",
        label: "Start Building Now",
      },
      secondaryButton: {
        label: "View Demo →",
        onClick: () => setIsVideoOpen(true),
      },
      isReversed: false,
    },
  }

  const propsFaq = {
    title: 'Frequently Asked Questions',
    data: dataFaq,
    banner: {
      variant: 'confetti',
      title: 'Make your documentation interactive in minutes.',
      content: "Join thousands of technical writers and companies using DocsBot to make answers easier to find and access.",
      primaryButton: {
        href: '/register',
        label: 'Create Free Account',
      },
      isReversed: true,
    },
  }

  // Reusing other sections with minimal customization or defaults
  const propsIntegrations = {
    title: <>More Sources.<br />Less Hassle.</>,
    description: 'Ingest data from anywhere. DocsBot connects the services you rely on, from your helpdesk knowledge base to your cloud files and website.',
    primaryButton: {
      href: '/register',
      label: 'View All Integrations',
    },
  }

  const extractText = (content) => {
    if (typeof content === 'string') return content
    if (content && typeof content === 'object' && content.props?.children) {
      return Array.isArray(content.props.children)
        ? content.props.children.map((child) => extractText(child)).join('')
        : extractText(content.props.children)
    }
    return ''
  }

  const allFaqs = [
    ...heroFaqs.map((faq) => ({
      questionName: faq.question,
      acceptedAnswerText: faq.answer,
    })),
    ...dataFaq.map((faq) => ({
      questionName: faq.question,
      acceptedAnswerText: extractText(faq.answer),
    })),
  ]

  const pageUrl = buildPageUrl('/documentation-chatbot')
  const pageTitle = 'AI Chatbot for Documentation | Document AI Search | DocsBot'
  const pageDescription =
    'Build a custom AI chatbot for your documentation, PDFs, and internal wikis. Instant answers with source citations. Perfect for technical docs and knowledge bases.'

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
    name: 'DocsBot AI Documentation Chatbot',
    description: pageDescription,
    serviceType: 'AI documentation chatbot',
  })

  webPage.mainEntity = { '@id': service['@id'] }
  webPage.hasPart = [{ '@id': faqPage['@id'] }]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganization(), buildWebSite(), webPage, faqPage, service],
  }

  return (
    <>
      <JsonLd id="documentation-chatbot-schema" data={schema} />
      <NextSeo
        title="AI Chatbot for Documentation | Document AI Search | DocsBot"
        description="Build a custom AI chatbot for your documentation, PDFs, and internal wikis. Instant answers with source citations. Perfect for technical docs and knowledge bases."
        openGraph={{
          title: 'AI Chatbot for Documentation | Document AI Search | DocsBot',
          description: 'Build a custom AI chatbot for your documentation, PDFs, and internal wikis. Instant answers with source citations.',
          images: [
            {
              url: 'https://docsbot.ai/og-customer-support.png', // Fallback or specific OG image if available
              width: 1200,
              height: 630,
              alt: 'DocsBot AI Documentation Chatbot',
            },
          ],
        }}
      />
      <Head>
         <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>

      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />

          <main>
            <Hero { ...propsHero } heroFaqs={heroFaqs} avatar={womanAvatar} />

            <Brands />

            <SectionReveal direction="down" amount={0.5}>
              <Overview { ...propsOverview } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <div className="overflow-hidden bg-white py-24 sm:py-32">
                <div className="px-6 lg:px-8">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-stretch">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.7 }}
                      className="lg:ml-auto lg:pl-4 lg:pt-4"
                    >
                      <div className="lg:max-w-lg">
                        <h2 className="text-5xl/[3.5rem] font-bold text-gray-900">
                          Built for Technical Documentation
                        </h2>
                        <p className="mt-6 text-lg/8 text-gray-600">
                          DocsBot understands your structured technical language for complex topics. Provide fast answers to questions that span multiple pages or sections with responses that stay grounded in your documentation.
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="relative -mx-6 sm:-mx-6 min-h-[24rem] sm:min-h-[28rem] lg:min-h-[32rem] lg:mr-[-2rem]"
                    >
                      <div className="w-screen sm:w-full lg:w-[calc(100%+2rem)] h-full lg:absolute lg:inset-0 lg:rounded-t-2xl lg:rounded-b-2xl shadow-xl overflow-hidden">
                        <TechnicalDocsAnimation />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Features { ...propsFeatures } />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
               <Integrations { ...propsIntegrations } />
            </SectionReveal>
            
            <SectionReveal direction="down" amount={0.25}>
              <Analytics 
                title="Find Knowledge Gaps"
                description="See what users are asking and plug the holes in your documentation."
                 banner={{
                    title: "Improve Your Docs with Data",
                    content: "Use search analytics to fill content gaps, identify UX problems, and fix confusing pages.",
                    primaryButton: {
                        href: "/register",
                        label: "Get Insights",
                    }
                 }}
                 data={[
                    {
                        title: 'Logs',
                        description: "Review every question asked to your documentation bot.",
                        image: screenshotLogs,
                    },
                    {
                        title: 'Topic Management',
                        description: "Cluster questions to find missing topics in your documentation.",
                        image: screenshotTopicManagement,
                    },
                    {
                        title: 'Visualization',
                        description: "Track search volume and success rates over time.",
                        image: screenshotVisualization,
                    },
                    {
                        title: 'Reports',
                        description: 'Use reports to spot documentation gaps and product UX issues before they escalate.',
                        image: screenshotReports,
                    },
                ]}
              />
            </SectionReveal>

            <SentryQuote />

            <SectionReveal direction="down" amount={0.25}>
              <Results 
                 title="Real Impact"
                 description="Giving your team accurate answers on-demand, reducing friction and speeding up communication."
                 data={[
                    {
                        title: 'Deflection Rate',
                        description: 'Percentage of questions answered by the docs bot without human help.',
                        note: '80%',
                        background: 'neutral-100',
                        foreground: 'gray-900',
                        className: 'lg:flex-1 lg:self-stretch',
                    },
                    {
                        title: 'Faster Answers',
                        description: 'Average time to find an answer in docs vs asking the bot.',
                        note: '10x',
                        background: 'gray-900',
                        foreground: 'neutral-50',
                        className: 'sm:w-10/12 lg:w-full lg:flex-1 lg:gap-y-[10rem]',
                    },
                    {
                         title: 'User Satisfaction',
                         description: 'Users prefer instant answers over searching manually.',
                         note: '4.8/5',
                         background: 'teal-500',
                         foreground: 'neutral-50',
                         className: 'sm:w-11/12 lg:w-full lg:flex-1 lg:gap-y-[12rem] lg:mt-12',
                    }
                 ]}
              />
            </SectionReveal>

            <SectionReveal direction="down" amount={0.25}>
              <Security { ...propsSecurity } />
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
