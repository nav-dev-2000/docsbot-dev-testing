import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  HeartIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowDownOnSquareStackIcon,
  LockClosedIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid'
import {InfiniteTypewriter} from '@/components/customer-support/animation-elements'
import imgDeepResearch from '@/images/app-demo/docsbot-deep-research.webp'
import AskAIModels from '@/components/AskAIModels'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import Faq from '@/components/Faq'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Testimonials } from '@/components/Testimonials'
import MattCromwellQuote from '@/components/MattCromwellQuote'
import TrustedBy from '@/components/TrustedBy'
import SocialFaces from '@/components/SocialFaces'
import HowItWorks from '@/components/HowItWorks'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import AIHero from '@/components/AIHero'
import IntegrationsFeatures from '@/components/IntegrationsFeatures'
import DeployFeatures from '@/components/DeployFeatures'
import CTASection from '@/components/CTASection'
import VideoPlayer from '@/components/VideoPlayer'
import SecuritySection from '@/components/SecuritySection'
import { UseCases } from '@/components/home/UseCases'

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

const customerBotFeatures = [
  {
    name: 'Reduce Support Workload',
    description:
      'Automatically handle common customer inquiries 24/7, reducing wait times and enabling smooth handovers to human support when needed.',
    icon: ClockIcon,
  },
  {
    name: 'Consistent & Accurate',
    description:
      'Deliver precise, consistent answers based on your documentation, ensuring customers always receive reliable information.',
    icon: CheckCircleIcon,
  },
  {
    name: 'Scale Your Support',
    description:
      'Handle unlimited concurrent conversations while maintaining high satisfaction rates and building customer loyalty.',
    icon: CloudArrowUpIcon,
  },
]

const supportFeatures = [
  {
    name: 'Minimize Repetitive Tasks',
    description:
      'Free your support team from answering the same questions repeatedly. Let AI handle routine inquiries while your agents focus on complex, high-value interactions that require human expertise.',
    icon: ArrowDownOnSquareStackIcon,
  },
  {
    name: 'Better Resource Allocation',
    description:
      'Optimize your support operations with first-contact resolution and seamless human handovers. Our AI ensures questions are answered instantly, accurately, or escalated to a human when needed.',
    icon: UserGroupIcon,
  },
  {
    name: 'Boost Team Morale',
    description:
      "Transform your support team's daily experience by eliminating mundane tasks. Watch agent satisfaction soar as they engage in meaningful problem-solving instead of repetitive responses.",
    icon: HeartIcon,
  },
]

const internalBotFeatures = [
  {
    name: 'Knowledge Retrieval',
    description:
      'Instantly surface relevant information from your internal documentation, eliminating time spent searching through multiple systems and databases.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Secure Access',
    description:
      'Keep your sensitive information protected with enterprise-grade security while providing seamless access to authorized team members.',
    icon: LockClosedIcon,
  },
  {
    name: 'Continuous Learning',
    description:
      'Your bot automatically stays up-to-date as your documentation evolves, ensuring teams always have access to the latest information.',
    icon: AcademicCapIcon,
  },
]

const researchFeatures = [
  {
    name: 'Instant Reference Discovery',
    description:
      'Quickly surface relevant citations, data points, and research materials from your document library. Save hours of manual searching and cross-referencing.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Comprehensive Analysis',
    description:
      'Get detailed insights and connections across your research materials. Our AI helps identify patterns and relationships you might have missed.',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Content Repurposing',
    description:
      'Transform existing content into new formats and insights. Extract key findings and data to create summaries, presentations, or training materials.',
    icon: ArrowPathIcon,
  },
]

// Add this component for reusability
const ScrollFadeIn = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  )
}

const ParallaxImage = ({ children, className = '' }) => {
  const ref = useRef(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['10%', '30%'])

  return (
    <motion.div
      ref={ref}
      className={`flex items-start will-change-transform ${className}`}
      style={{
        y: isLargeScreen ? y : 0,
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransform: 'translate3d(0, 0, 0)',
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  )
}

const LazyVideo = ({ src, poster, className }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('Video in view, attempting to play...') // Debug log

            // Set source and load video
            if (!video.src) {
              video.src = src
            }

            video.load()

            // Attempt to play
            const playPromise = video.play()
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log('Video playback started'))
                .catch((error) =>
                  console.error('Video playback failed:', error),
                )
            }

            // Disconnect observer after successful intersection
            observer.disconnect()
          }
        })
      },
      {
        root: null,
        rootMargin: '100px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      className={className}
      poster={poster}
      autoPlay={false}
      preload="metadata"
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

export default function Home() {
  return (
    <>
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
                  <div className="mx-auto max-w-4xl text-center">
                    <div className="mt-24 flex justify-center sm:mt-32 lg:mt-12">
                      <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-3 pr-1 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
                        <span className="pr-1">Custom ChatGPT</span>
                        <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                          for your business!
                        </span>
                      </div>
                    </div>

                    <h1 className="mt-8 text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
                      <span className="block text-7xl leading-none tracking-tighter md:leading-[0.8] lg:text-8xl">
                        Instant AI Answers
                      </span>
                      for your{' '}
                      <InfiniteTypewriter
                        words={[
                          'Customers',
                          'Sales Reps',
                          'Product',
                          'Partners',
                          'Support',
                          'New Hires',
                          'Members',
                        ]}
                        className="text-cyan-400"
                      />
                    </h1>
                  </div>

                  <div className="mx-auto mt-8 max-w-2xl text-center">
                    <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                    Turn your knowledge base into an AI assistant that builds trust with instant, accurate answers.
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
                            <span>Turn your content into AI answers</span>
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
