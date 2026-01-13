import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import {
  AcademicCapIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  PencilIcon,
  UserGroupIcon,
  LightBulbIcon,
  SparklesIcon as SparklesIconOutline,
  HeartIcon,
  HandThumbUpIcon,
  ArrowRightIcon,
  TargetIcon,
  BookOpenIcon,
  PaintBrushIcon,
  UserIcon,
  HandshakeIcon,
  FireIcon,
  BriefcaseIcon,
  FaceSmileIcon,
  ChatBubbleLeftRightIcon,
  ArrowLongRightIcon,
  PresentationChartLineIcon,
  SunIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon, SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'
import React from 'react'

const loadingText = [
  'Analyzing your sentence...',
  'Applying sentence rewriting techniques...',
  'Enhancing sentence structure...',
  'Refining word choice...',
  'Finalizing rewritten sentence...',
]

// text that slowly fades in and out walking through the above array
const LoadingText = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex < loadingText.length - 1) {
          return prevIndex + 1
        }
        clearInterval(interval)
        return prevIndex
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return <p className="animate-pulse">{loadingText[index]}</p>
}

const tones = [
  { name: 'Casual', icon: UserIcon },
  { name: 'Formal', icon: EnvelopeIcon },
  { name: 'Professional', icon: BriefcaseIcon },
  { name: 'Academic', icon: AcademicCapIcon },
  { name: 'Creative', icon: PaintBrushIcon },
  { name: 'Friendly', icon: FaceSmileIcon },
  { name: 'Confident', icon: FireIcon },
  { name: 'Simplified', icon: BookOpenIcon },
  { name: 'Vivid', icon: SunIcon },
  { name: 'Empathetic', icon: HeartIcon },
  { name: 'Engaging', icon: HandThumbUpIcon },
  { name: 'Direct', icon: ArrowLongRightIcon },
  { name: 'Persuasive', icon: PresentationChartLineIcon },
]

const AISentenceRewriter = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [rewrittenResults, setRewrittenResults] = useState([])
  const [selectedTone, setSelectedTone] = useState(tones[0])
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const rewriteSentences = async (userInput, tone) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a sentence to rewrite.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'AI Sentence Rewriter',
        action: 'Error',
        error: 'Empty Input',
        category: 'Writing',
      })
      return
    }

    const endpoint = `/api/tools/text-prompter`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'paraphrase',
          input: userInput,
          tone: tone.name,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText(
            'Daily usage limit exceeded, please try again tomorrow.',
          )
          setShowSignupModal(true)
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'AI Sentence Rewriter',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        const newResult = {
          text: data,
          tone: tone,
          timestamp: Date.now(),
          stats: {
            characters: data.length,
            words: data.trim().split(/\s+/).length,
          },
        }
        setRewrittenResults((prevResults) => [newResult, ...prevResults])
        posthog?.capture('Free Tool', {
          tool: 'AI Sentence Rewriter',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Sentence Rewriter',
        action: 'Error',
        error: e.message,
        category: 'Writing',
      })
    }

    setIsComputing(false)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-4">
          <Alert title={errorText} type="error" />

          <label
            htmlFor="original-text"
            className="w-full text-left text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" aria-hidden="true" />
            <span>Your Sentence to Transform</span>
            <span className="text-gray-400 text-xs font-normal">— Let's give it a new tone!</span>
          </label>
          <textarea
            id="original-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isComputing || rewrittenResults.length > 0}
            placeholder="Enter a sentence to rewrite..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm disabled:resize-none disabled:max-h-48"
            rows={3}
            maxLength={1000}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault()
              rewriteSentences(input, selectedTone)
            }}
          >
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-2">
                {/* All buttons in a flex container that wraps */}
                <div className="flex flex-wrap md:flex-nowrap md:flex-col justify-center gap-2">
                  {/* First row for md+ screens */}
                  <div className="flex flex-wrap md:flex-nowrap justify-center gap-2">
                    {tones.slice(0, 6).map((tone) => {
                      const Icon = tone.icon;
                      return (
                        <button
                          key={tone.name}
                          type="button"
                          onClick={() => setSelectedTone(tone)}
                          className={`w-[calc(50%-4px)] sm:w-[calc(33.333%-8px)] md:w-[120px] relative flex flex-col items-center justify-center rounded-lg border py-2 px-3 focus:outline-none transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                            selectedTone.name === tone.name
                              ? 'border-cyan-500 ring-2 ring-cyan-500 bg-cyan-50'
                              : 'border-gray-300 hover:border-cyan-300'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <Icon className={`h-4 w-4 transition-all duration-300 ${
                              selectedTone.name === tone.name ? 'text-cyan-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <p className={`text-xs font-medium text-center transition-colors duration-200 mt-0.5 ${
                            selectedTone.name === tone.name ? 'text-cyan-600' : 'text-gray-700'
                          }`}>
                            {tone.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {/* Second row for md+ screens */}
                  <div className="flex flex-wrap md:flex-nowrap justify-center gap-2">
                    {tones.slice(6).map((tone) => {
                      const Icon = tone.icon;
                      return (
                        <button
                          key={tone.name}
                          type="button"
                          onClick={() => setSelectedTone(tone)}
                          className={`w-[calc(50%-4px)] sm:w-[calc(33.333%-8px)] md:w-[120px] relative flex flex-col items-center justify-center rounded-lg border py-2 px-3 focus:outline-none transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                            selectedTone.name === tone.name
                              ? 'border-cyan-500 ring-2 ring-cyan-500 bg-cyan-50'
                              : 'border-gray-300 hover:border-cyan-300'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <Icon className={`h-4 w-4 transition-all duration-300 ${
                              selectedTone.name === tone.name ? 'text-cyan-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <p className={`text-xs font-medium text-center transition-colors duration-200 mt-0.5 ${
                            selectedTone.name === tone.name ? 'text-cyan-600' : 'text-gray-700'
                          }`}>
                            {tone.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isComputing}
                  className="group flex-[6] inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> <LoadingText />
                    </>
                  ) : (
                    <>
                      <div className="relative mr-2 h-5 w-5">
                        <SparklesIconOutline 
                          className="absolute inset-0 transition-opacity duration-200 ease-in-out group-hover:opacity-0" 
                          aria-hidden="true" 
                        />
                        <SparklesIconSolid 
                          className="absolute inset-0 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100" 
                          aria-hidden="true" 
                        />
                      </div>
                      Rewrite Sentence
                    </>
                  )}
                </button>
                {rewrittenResults.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput('')
                      setRewrittenResults([])
                    }}
                    className="group flex-[4] inline-flex items-center justify-center rounded-md border border-cyan-600 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  >
                    <ArrowPathIcon className="mr-2 h-5 w-5 transition-transform duration-200 ease-in-out group-hover:rotate-180" aria-hidden="true" />
                    New Sentence
                  </button>
                )}
              </div>
            </div>
          </form>

          {rewrittenResults.length > 0 && (
            <div className="mt-6">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Results</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {rewrittenResults.map((result, index) => (
                    <RewrittenResult 
                      key={result.timestamp} 
                      result={result} 
                      isNewest={result.timestamp === Math.max(...rewrittenResults.map(r => r.timestamp))}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <CarbonAd className="flex justify-center mt-4" /> 
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Sentence Rewriter"
        toolCategory="Writing"
      />
    </div>
  )
}

const RewrittenResult = ({ result, isNewest }) => {
  const [copySuccess, setCopySuccess] = useState(false)
  const [isNew, setIsNew] = useState(isNewest)
  const Icon = result.tone.icon;

  useEffect(() => {
    // Update isNew when isNewest changes
    setIsNew(isNewest);
    
    // Remove the "new" status after animation completes
    const timer = setTimeout(() => {
      setIsNew(false)
    }, 1000);
    return () => clearTimeout(timer);
  }, [isNewest]);

  const copyToClipboard = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(result.text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  return (
    <div className="relative mt-6 animate-fade-in">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <div className="mb-1 ml-1 flex items-center justify-between">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span>{result.stats.characters} characters · {result.stats.words} words</span>
          <span className="inline-flex items-center text-cyan-600 font-medium">
            <span className="text-gray-600">·</span>
            <Icon className="h-4 w-4 ml-2 mr-1" />
            {result.tone.name}
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          type="button"
          className="rounded-md bg-gray-100 p-1 transition-colors hover:bg-gray-200"
          title="Copy to clipboard"
        >
          <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
        </button>
        {copySuccess && (
          <span className="absolute right-10 top-2 text-sm text-cyan-600">
            Copied!
          </span>
        )}
      </div>
      <div className="min-h-16 max-w-none rounded-md bg-gray-50 p-4 text-left">
        <Streamdown
          mode="static"
          isAnimating={false}
          remarkPlugins={streamdownRemarkPlugins}
        >
          {preprocessMath(result.text)}
        </Streamdown>
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Professional Communication',
    description:
      'Transform casual messages into polished, professional content. Perfect for converting informal notes into business-ready emails, reports, or LinkedIn posts while maintaining your core message.',
    icon: BriefcaseIcon,
  },
  {
    name: 'Academic Writing',
    description:
      'Elevate your writing to meet academic standards. Convert simple explanations into scholarly language suitable for research papers, essays, or academic publications while preserving the original meaning.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Creative Content',
    description:
      'Add flair and vibrancy to your writing. Turn plain statements into engaging, vivid content that captures attention and sparks imagination, ideal for storytelling or creative projects.',
    icon: SparklesIconOutline,
  },
  {
    name: 'Casual Communication',
    description:
      'Make formal text more approachable and friendly. Perfect for adapting corporate content into casual blog posts, social media updates, or friendly emails that connect with your audience.',
    icon: FaceSmileIcon,
  },
  {
    name: 'Persuasive Writing',
    description:
      'Enhance the impact of your message. Transform basic statements into compelling, persuasive content that effectively conveys your point and motivates action.',
    icon: PresentationChartLineIcon,
  },
  {
    name: 'Simplified Explanations',
    description:
      'Make complex information more accessible. Convert technical or complicated sentences into clear, easy-to-understand language while retaining the important details.',
    icon: BookOpenIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Sentence Rewriter?',
    answer:
      'An AI Sentence Rewriter is a sophisticated language processing system that rephrases and restructures a single sentence while preserving its original meaning. It uses advanced algorithms to generate alternative expressions, making your writing more diverse and engaging.',
  },
  {
    question: 'How does the AI Sentence Rewriter work?',
    answer:
      'Our AI Sentence Rewriter utilizes state-of-the-art natural language processing models to analyze your input sentence, understand its context and meaning, and then generate alternative phrasings. It considers factors like sentence structure, vocabulary, and the selected tone to produce high-quality rewritten content.',
  },
  {
    question: 'Is the AI Sentence Rewriter free to use?',
    answer:
      'Yes, our AI Sentence Rewriter is completely free to use. You can rephrase and rewrite any sentence without any cost. However, there may be usage limits to ensure fair use for all users.',
  },
  {
    question: 'Can the AI Sentence Rewriter handle different tones?',
    answer:
      'Absolutely! Our AI Sentence Rewriter allows you to choose from multiple tones to suit your needs, whether it\'s formal, casual, academic, or creative. This ensures that the rewritten sentence aligns with your desired style.',
  },
  {
    question: 'Is my data safe with the AI Sentence Rewriter?',
    answer:
      'We take your privacy seriously. All data processed by our AI Sentence Rewriter is encrypted in transit and not stored on our servers. Your input sentence and rewritten content are secure and confidential, and not stored.',
  },
  {
    question: 'Can the AI Sentence Rewriter help with academic writing?',
    answer:
      'Yes, the AI Sentence Rewriter is perfect for academic writing. It can help you rephrase complex sentences into clearer, more concise language while maintaining academic integrity. This is ideal for essays, research papers, and other academic documents.',
  },
  {
    question: 'How accurate is the AI Sentence Rewriter?',
    answer:
      'Our AI Sentence Rewriter utilizes advanced natural language processing models to ensure high accuracy. It effectively understands the context and meaning of your input sentence, generating high-quality rewritten content that retains the original message.',
  },
  {
    question:
      'Will the AI Sentence Rewriter bypass common AI detectors like Turnitin, NoGPT, etc.?',
    answer:
      'While our AI Sentence Rewriter is designed to rephrase and rewrite sentences to make them more human-like, we cannot guarantee that it will bypass all AI detectors. Tools like Turnitin and NoGPT use advanced algorithms to detect AI-generated content, and their effectiveness can vary. It is always recommended to review and edit the rewritten content to ensure it meets your specific requirements.',
  },
]

export default function AISentenceRewriterPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Sentence Rewriter Tool | No Login | Any Tone"
        description="Effortlessly rewrite any sentence with our free AI Sentence Rewriter Tool. Perfect for emails, articles, and more. Choose from multiple tones to suit your needs."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/text-reworder.png',
              alt: 'AI Sentence Rewriter Tool',
            },
          ],
        }}
      />
      <FAQPageJsonLd
        mainEntity={faqs.map((faq) => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
      />
      <Header />
      <main>
        <div className="relative isolate bg-gray-900">
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
          <div className="py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Free AI Sentence Rewriter Tool
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Quickly rewrite any sentence for emails, articles, and more. Choose from multiple tones to perfectly suit your needs.
                </p>
                <AISentenceRewriter />
                <StarRating
                  itemId="ai-sentence-rewriter"
                  name="AI Sentence Rewriter Tool - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Create Content with Custom Trained Chatbots"
          description="Leverage your own custom trained chatbots to generate content in any style or tone, grounded in your documentation and content. Use internally or deploy to your website."
          button="Create your Free Chatbot"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Easy Sentence Transformation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Sentence Rewriter Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to transform your sentence into a fresh, rewritten version in seconds.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Your Sentence
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Simply paste a single sentence into the input box. Our tool works with any type of content to create a rewritten version.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Choose Your Tone
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select the desired tone for your rewritten sentence from our dropdown menu. Options include formal, casual, professional, and more.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Get Rewritten Sentence
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click 'Rewrite Sentence' and watch as our AI transforms your content. View the rewritten version and copy it for your use.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Many Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our AI Sentence Rewriter Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Sentence Rewriter Tool can improve your writing and boost productivity across various domains.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-300">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                            <span className="text-base font-semibold leading-7">
                              {faq.question}
                            </span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              ) : (
                                <PlusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">
                            {faq.answer}
                          </p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* New section: How to Rewrite AI-Generated Text */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div>
                <h2 className="text-base font-semibold leading-7 text-cyan-600">Effective Sentence Rewriting</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How to Rewrite AI-Generated Sentences</p>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Follow these steps to effectively rewrite AI-generated content:
                </p>
              </div>
              <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
                {[
                  { name: 'Use our AI sentence rewriter tool', description: 'Rewrite the original sentence using our advanced AI tool.' },
                  { name: 'Review and edit', description: 'Ensure the rewritten sentence is natural and flows well.' },
                  { name: 'Incorporate your own voice', description: 'Add your personal style to the sentence.' },
                  { name: 'Use synonyms and alternatives', description: 'Differentiate the content with varied vocabulary.' },
                  { name: 'Restructure the sentence', description: 'Create a unique composition by changing sentence structure.' },
                  { name: 'Add personal insights', description: 'Enhance originality with your own examples and insights.' },
                ].map((step, index) => (
                  <div key={step.name} className="relative pl-9">
                    <dt className="font-semibold text-gray-900">
                      <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-medium text-white">
                        {index + 1}
                      </span>
                      {step.name}
                    </dt>
                    <dd className="mt-2">{step.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-sentence-rewriter')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
