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
  const videoRef = useRef(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('Video in view, attempting to play...'); // Debug log
            
            // Set source and load video
            if (!video.src) {
              video.src = src;
            }
            
            video.load();
            
            // Attempt to play
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log('Video playback started'))
                .catch(error => console.error('Video playback failed:', error));
            }
            
            // Disconnect observer after successful intersection
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '100px 0px',
        threshold: 0.1
      }
    );

    observer.observe(video);
    
    return () => {
      observer.disconnect();
    };
  }, [src]);

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
  );
};

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
                    className="aspect-[1108/632] w-[69.25rem] h-[70rem] lg:h-[75rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20"
                  />
                </div>
                <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
                  <div className="mx-auto max-w-4xl text-center">
                    <div
                      className="mt-24 sm:mt-32 lg:mt-12 flex justify-center"
                    >
                      <div className="inline-flex items-center rounded-full bg-cyan-500/10 py-1 pl-3 pr-1 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20">
                        <span className="pr-1">Custom ChatGPT</span>
                        <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white">
                        for your business!
                        </span>
                      </div>
                    </div>

                    <h1
                      className="mt-8 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl leading-tight"
                    >
                      <span className="block text-7xl leading-none tracking-tighter lg:text-8xl md:leading-[0.8]">
                        Instant AI Answers 
                      </span>
                      <span className="block text-6xl md:text-7xl bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text text-transparent">
                      from your Docs
                      </span>
                    </h1>

                  </div>

                  <div className="mx-auto max-w-2xl text-center mt-8">
                    <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                      Get instant answers for you, your customers, or your team
                      with custom AI chatbots trained with your content
                      and documentation.
                    </p> 
                  </div>

                    <div className="mt-10 max-w-3xl mx-auto">
                      <div className="flex flex-col items-center justify-center">
                        <div className="max-w-md w-full mb-6">
                          <Link
                            href="/register"
                            type="button"
                            className="bg-animation block w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <SparklesIcon className="h-5 w-5" />
                              <span>Turn your content into AI answers</span>
                            </div>
                          </Link>
                          <p className="mt-1 text-center text-sm text-gray-300 sm:mt-2">
                            Try it free, <u>no credit card required</u>. Your customers (and team) will thank you!
                          </p>
                        </div>
                        <SocialFaces
                          ringColor="ring-gray-900"
                          className="flex justify-center items-center gap-4 scale-75"
                        />
                      </div>
                    </div>

                  <div className="mx-auto mt-12 sm:mt-16 lg:mt-12 max-w-6xl">
                    <VideoPlayer 
                      videoSrc="https://cdn.docsbot.com/docsbot-intro.mp4"
                      posterSrc="/video/docsbot-intro.webp"
                      className="mx-auto w-full"
                    />
                  </div>


                </div>
              </div>

              <div
                className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24"
              >
                <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                  Trusted by more than 3,000 businesses!
                </h2>
                <TrustedBy />
              </div>
            </div>

            <div id="uses" className="bg-white px-6 pt-24 sm:pt-32 lg:px-8">
              <div className="mx-auto max-w-5xl text-center">
                <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                  Use Cases
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  AI Solutions to Real Business Problems
                </p>
                <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
                  Unlock the potential of your existing content with AI-driven
                  chatbots. Automate customer journeys—leads, presales,
                  onboarding, support, and retention. Empower your team with
                  instant access to knowledge, repurpose content for marketing
                  and sales, and speed up research—all with DocsBot.
                </p>
              </div>
            </div>

            {/* Customer Facing Bots */}
            <div className="overflow-hidden bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                  <ScrollFadeIn>
                    <div className="lg:pr-8 lg:pt-4">
                      <div className="lg:max-w-lg">
                        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                          Customer Facing Bots
                        </h2>
                        <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                          Instant Responses to Customer Queries, 24/7
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-600">
                          Transform your pre-sales and customer support with
                          AI-powered chatbots that understand your business.
                          Provide instant, accurate responses while reducing
                          costs and improving customer satisfaction.
                        </p>
                        <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                          {customerBotFeatures.map((feature) => (
                            <div key={feature.name} className="relative pl-9">
                              <dt className="inline font-semibold text-gray-900">
                                <feature.icon
                                  aria-hidden="true"
                                  className="absolute left-1 top-1 size-5 text-cyan-600"
                                />
                                {feature.name}
                              </dt>{' '}
                              <dd className="inline">{feature.description}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-10 flex gap-4">
                          <Link
                            href="/register"
                            className="bg-animation flex-1 rounded-md bg-cyan-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700"
                          >
                            Get Instant Answers
                          </Link>
                          <Link
                            href="/customer-support"
                            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-cyan-600 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-cyan-600 hover:border-cyan-700 hover:text-cyan-700"
                          >
                            Learn More <ArrowRightIcon className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollFadeIn>

                  <ParallaxImage>
                    <LazyVideo
                      src="/video/uses-customer-facing.mp4"
                      poster="/video/uses-customer-facing.png"
                      className="lg:w-[32rem] max-w-none mx-auto w-full"
                    />
                  </ParallaxImage>
                </div>
              </div>
            </div>

            {/* Customer Support Bots */}
            <div className="overflow-hidden bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                  <ScrollFadeIn delay={0.2}>
                    <div className="lg:ml-auto lg:pl-4 lg:pt-4">
                      <div className="lg:max-w-lg">
                        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                          Customer Support Bots
                        </h2>
                        <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                          Enhance Support Quality with AI-Powered Excellence
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-600">
                          Transform your customer support from reactive to
                          proactive. Our AI-powered bots deliver instant,
                          accurate responses 24/7, ensuring consistent quality
                          while dramatically reducing response times and support
                          costs.
                        </p>
                        <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                          {supportFeatures.map((feature) => (
                            <div key={feature.name} className="relative pl-9">
                              <dt className="inline font-semibold text-gray-900">
                                <feature.icon
                                  aria-hidden="true"
                                  className="absolute left-1 top-1 size-5 text-cyan-600"
                                />
                                {feature.name}
                              </dt>{' '}
                              <dd className="inline">{feature.description}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-10 flex gap-4">
                          <Link
                            href="/customer-support"
                            className="bg-animation flex-1 rounded-md bg-cyan-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700"
                          >
                            Enhance Your Support Quality
                          </Link>
                          <Link
                            href="/customer-support"
                            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-cyan-600 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-cyan-600 hover:border-cyan-700 hover:text-cyan-700"
                          >
                            Learn More <ArrowRightIcon className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollFadeIn>

                  <ParallaxImage className="justify-end lg:order-first">
                    <LazyVideo
                      src="/video/uses-enhance-support.mp4"
                      poster="/video/uses-enhance-support.webp"
                      className="lg:w-[32rem] max-w-none mx-auto w-full"
                    />
                  </ParallaxImage>
                </div>
              </div>
            </div>

            {/* Internal Knowledge Management */}
            <div className="bg-white py-24">
              <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.8 }}
                  className="relative isolate overflow-hidden bg-gray-900 px-6 py-20 sm:rounded-3xl sm:px-10 sm:py-24 lg:py-24 xl:px-24"
                >
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center lg:gap-y-0">
                    <div className="lg:row-start-2 lg:max-w-md">
                      <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-teal-400">
                        Internal Knowledge Access
                      </h2>
                      <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Boost Productivity Through Instant Information Access
                      </p>
                      <p className="mt-6 text-lg/8 text-gray-300">
                        Transform how your team accesses information with
                        AI-powered knowledge retrieval. Our internal
                        documentation bots make finding answers as simple as
                        asking a question, dramatically reducing time spent
                        searching through documents and data from multiple
                        sources.
                      </p>
                      <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                        <Link
                          href="/register"
                          className="bg-animation flex-1 rounded-md bg-cyan-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700"
                        >
                          Boost Your Team Productivity
                        </Link>
                        {/* <Link
                          href="/features"
                          className="flex flex-1 items-center justify-center gap-2 text-center text-sm/6 font-semibold text-white lg:justify-start"
                        >
                          Learn More <ArrowRightIcon className="size-4" />
                        </Link> */}
                      </div>
                    </div>

                    <ParallaxImage className="min-w-full max-w-xl lg:row-span-4 lg:-mt-48 lg:w-[32rem] lg:max-w-none">
                      <LazyVideo
                        src="/video/uses-knowledgebase.mp4"
                        poster="/video/uses-knowledgebase.webp"
                        className="relative -z-20 w-full mx-auto lg:w-[32rem]"
                      />
                    </ParallaxImage>
                    <div className="max-w-xl lg:row-start-3 lg:mt-10 lg:max-w-md lg:border-t lg:border-white/10 lg:pt-10">
                      <dl className="max-w-xl space-y-8 text-base/7 text-gray-300 lg:max-w-none">
                        {internalBotFeatures.map((feature) => (
                          <div key={feature.name} className="relative">
                            <dt className="ml-9 inline-block font-semibold text-white">
                              <feature.icon
                                aria-hidden="true"
                                className="absolute left-1 top-1 size-5 text-cyan-500"
                              />
                              {feature.name}
                            </dt>{' '}
                            <dd className="inline">{feature.description}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-12 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl lg:bottom-[-12rem] lg:top-auto lg:translate-y-0 lg:transform-gpu"
                  >
                    <div
                      style={{
                        clipPath:
                          'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                      }}
                      className="hidden aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-cyan-500 to-cyan-600 opacity-25"
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Research use case */}
            <div className="overflow-hidden bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
                  <ScrollFadeIn>
                    <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
                      <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
                        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                          Research Assistant & Document Q&A Bots
                        </h2>
                        <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                          Accelerate Research with Fast Reference Discovery
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-600">
                          Transform your research process with AI-powered
                          document analysis, structured reporting, and our new
                          Deep Research agent. Combine your DocsBot knowledge
                          base with optional live web search and Code
                          Interpreter to surface cited insights in minutes.
                        </p>
                        <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                          {researchFeatures.map((feature) => (
                            <div key={feature.name} className="relative pl-9">
                              <dt className="inline font-semibold text-gray-900">
                                <feature.icon
                                  aria-hidden="true"
                                  className="absolute left-1 top-1 size-5 text-cyan-600"
                                />
                                {feature.name}
                              </dt>{' '}
                              <dd className="inline">{feature.description}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-10 flex gap-4">
                          <Link
                            href="/register"
                            className="bg-animation flex-1 rounded-md bg-cyan-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-700"
                          >
                            Accelerate Your Research
                          </Link>
                          <Link
                            href="/article/deep-research-is-now-available-on-docsbot"
                            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-cyan-600 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-cyan-600 hover:border-cyan-700 hover:text-cyan-700"
                          >
                            Learn More <ArrowRightIcon className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollFadeIn>

                  <ParallaxImage className="sm:px-6 lg:px-0">
                    <div className="relative isolate overflow-hidden bg-cyan-600 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-12 sm:pr-0 sm:pt-12 lg:mx-0 lg:max-w-none">
                      <div
                        aria-hidden="true"
                        className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-teal-500 opacity-20 ring-1 ring-inset ring-white"
                      />
                      <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                        <Image
                          alt="Deep Research screenshot"
                          src="/video/uses-deep-research.webp"
                          width={1200}
                          height={886}
                          className="-mb-12 w-[36rem] max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10"
                        />
                      </div>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
                      />
                    </div>
                  </ParallaxImage>
                </div>
              </div>
            </div>

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
