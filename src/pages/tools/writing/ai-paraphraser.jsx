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
  PencilSquareIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Analyzing your text...',
  'Applying paraphrasing techniques...',
  'Enhancing language variety...',
  'Refining tone and style...',
  'Finalizing paraphrased text...',
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
  { name: 'Casual', emoji: '😊' },
  { name: 'Formal', emoji: '👔' },
  { name: 'Professional', emoji: '💼' },
  { name: 'Academic', emoji: '🎓' },
  { name: 'Creative', emoji: '🎨' },
  { name: 'Friendly', emoji: '😃' },
  { name: 'Diplomatic', emoji: '🤝' },
  { name: 'Confident', emoji: '💪' },
  { name: 'Middle school', emoji: '📗' },
  { name: 'High school', emoji: '📘' },
  { name: 'Simplified', emoji: '📖' },
  { name: 'Vivid', emoji: '🦄' },
  { name: 'Empathetic', emoji: '🤗' },
  { name: 'Luxury', emoji: '💎' },
  { name: 'Engaging', emoji: '👍' },
  { name: 'Direct', emoji: '➡️' },
  { name: 'Persuasive', emoji: '🎯' },
]

const AIParaphraser = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [paraphrasedResults, setParaphrasedResults] = useState([])
  const [selectedTone, setSelectedTone] = useState(tones[0])
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const paraphraseText = async (userInput, tone) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter some text to paraphrase.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'AI Paraphraser',
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
            tool: 'AI Paraphraser',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        setParaphrasedResults((prevResults) => [
          ...prevResults,
          {
            text: data,
            tone: tone,
            stats: {
              characters: data.length,
              words: data.trim().split(/\s+/).length,
            },
          },
        ])
        posthog?.capture('Free Tool', {
          tool: 'AI Paraphraser',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Paraphraser',
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
            className="block w-full text-left text-sm font-medium text-gray-700"
          >
            Original Text
          </label>
          <textarea
            id="original-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isComputing || paraphrasedResults.length > 0}
            placeholder="Enter your text to paraphrase..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm"
            rows={8}
            maxLength={10000}
          />

          {paraphrasedResults.map((result, index) => (
            <ParaphrasedResult key={index} result={result} />
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              paraphraseText(input, selectedTone)
            }}
          >
            <div className="mt-6 grid grid-cols-12 items-center gap-3">
              <div className="col-span-12 sm:col-span-6">
                <select
                  value={selectedTone.name}
                  onChange={(e) =>
                    setSelectedTone(
                      tones.find((t) => t.name === e.target.value),
                    )
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                >
                  {tones.map((tone) => (
                    <option key={tone.name} value={tone.name}>
                      {tone.emoji} {tone.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-6"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />
                  </>
                ) : (
                  <>Paraphrase</>
                )}
              </button>
            </div>
          </form>

          <CarbonAd className="flex justify-center mt-4" /> 

          {paraphrasedResults.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInput('')
                setParaphrasedResults([])
              }}
              className="mt-8 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Paraphraser"
        toolCategory="Writing"
      />
    </div>
  )
}

const ParaphrasedResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = (e) => {
    e.preventDefault() // Prevent default button behavior
    e.stopPropagation() // Stop event from bubbling up
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
    <div className="relative mt-6">
      <div className="mb-1 ml-1 flex items-baseline justify-between">
        <div className="text-sm text-gray-600">
          {result.stats.characters} characters · {result.stats.words} words ·{' '}
          {result.tone.emoji} {result.tone.name}
        </div>
        <button
          onClick={copyToClipboard}
          type="button" // Explicitly set button type to "button"
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
      <div className="prose prose-sm min-h-16 max-w-none rounded-md bg-gray-50 p-4 text-left">
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
    name: 'Academic Writing Enhancement',
    description:
      'Improve your essays and research papers by rephrasing complex ideas into clearer, more concise language while maintaining academic integrity.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Content Optimization',
    description:
      'Refresh and optimize your website content, blog posts, and articles to improve readability and engagement while preserving the core message.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Language Learning Support',
    description:
      'Enhance your language skills by exploring different ways to express ideas, expanding your vocabulary and improving your overall fluency.',
    icon: LightBulbIcon,
  },
  {
    name: 'Social Media Content Creation',
    description:
      'Generate fresh and engaging content for your social media platforms by rephrasing existing posts, ensuring your message stays relevant and captivating.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Email Communication',
    description:
      'Enhance your email communication by rephrasing your messages to be more clear, concise, and professional, ensuring effective and impactful correspondence.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Creative Writing',
    description:
      'Boost your creative writing process by exploring different ways to express your ideas, helping you overcome writer’s block and find new inspiration.',
    icon: LightBulbIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Paraphrasing Tool?',
    answer:
      'An AI Paraphrasing Tool is a sophisticated language processing system that rephrases and restructures text while preserving its original meaning. It uses advanced algorithms to generate alternative expressions, making your writing more diverse and engaging.',
  },
  {
    question: 'How does the AI Paraphrasing Tool work?',
    answer:
      'Our AI Paraphrasing Tool utilizes state-of-the-art natural language processing models to analyze your input text, understand its context and meaning, and then generate alternative phrasings. It considers factors like sentence structure, vocabulary, and the selected tone to produce high-quality paraphrased content.',
  },
  {
    question: 'Is the AI Paraphrasing Tool free to use?',
    answer:
      'Yes, our AI Paraphrasing Tool is completely free to use. You can rephrase and reword any text without any cost. However, there may be usage limits to ensure fair use for all users.',
  },
  {
    question: 'Can the AI Paraphrasing Tool handle different tones?',
    answer:
      'Absolutely! Our AI Paraphrasing Tool allows you to choose from multiple tones to suit your needs, whether it’s formal, casual, academic, or creative. This ensures that the paraphrased text aligns with your desired style.',
  },
  {
    question: 'Is my data safe with the AI Paraphrasing Tool?',
    answer:
      'We take your privacy seriously. All data processed by our AI Paraphrasing Tool is encrypted in transit and not stored on our servers. Your input text and paraphrased content are secure and confidential, and not stored.',
  },
  {
    question: 'Can the AI Paraphrasing Tool help with academic writing?',
    answer:
      'Yes, the AI Paraphrasing Tool is perfect for academic writing. It can help you rephrase complex ideas into clearer, more concise language while maintaining academic integrity. This is ideal for essays, research papers, and other academic documents.',
  },
  {
    question: 'How accurate is the AI Paraphrasing Tool?',
    answer:
      'Our AI Paraphrasing Tool utilizes advanced natural language processing models to ensure high accuracy. It effectively understands the context and meaning of your input text, generating high-quality paraphrased content that retains the original message.',
  },
  {
    question:
      'Will the AI Paraphrasing Tool bypass common AI detectors like Turnitin, NoGPT, etc.?',
    answer:
      'While our AI Paraphrasing Tool is designed to rephrase and reword text to make it more human-like, we cannot guarantee that it will bypass all AI detectors. Tools like Turnitin and NoGPT use advanced algorithms to detect AI-generated content, and their effectiveness can vary. It is always recommended to review and edit the paraphrased content to ensure it meets your specific requirements.',
  },
]

export default function AIParaphraserPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Paraphrasing Tool | No Login | Any Tone"
        description="Effortlessly rephrase and reword any text with our free AI Paraphrasing Tool. Perfect for essays, articles, and more. Choose from multiple tones to suit your needs."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/text-paraphraser.png',
              alt: 'AI Paraphrasing Tool',
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
                  Free AI Paraphrasing Tool
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Quickly rephrase and reword any text for essays, articles,
                  emails, and more. Choose from multiple tones to perfectly suit
                  your needs.
                </p>
                <AIParaphraser />
                <StarRating
                  itemId="ai-paraphraser"
                  name="AI Paraphrasing Tool - DocsBot"
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
                Easy Text Transformation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Paraphrasing Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to transform your text into a fresh,
                rephrased version in seconds.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Your Text
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Simply paste your text into the input box. Our tool works
                      with any type of content to create a rephrased version.
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
                      Select the desired tone for your paraphrased text from our
                      dropdown menu. Options include formal, casual,
                      professional, and more.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Get Paraphrased Text
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click 'Paraphrase' and watch as our AI transforms your
                      content. View the paraphrased version and copy it for your
                      use.
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
                Use Cases for Our AI Paraphrasing Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Paraphrasing Tool can improve your
                writing and boost productivity across various domains.
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

        {/* New section: How to Paraphrase AI-Generated Text */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div>
                <h2 className="text-base font-semibold leading-7 text-cyan-600">Effective Paraphrasing</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How to Paraphrase AI-Generated Text</p>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Follow these steps to effectively paraphrase AI-generated content:
                </p>
              </div>
              <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
                {[
                  { name: 'Use our AI paraphrase tool', description: 'Rephrase the original text using our advanced AI tool.' },
                  { name: 'Review and edit', description: 'Ensure the paraphrased content is natural and flows well.' },
                  { name: 'Incorporate your own voice', description: 'Add your personal style to the text.' },
                  { name: 'Use synonyms and alternatives', description: 'Differentiate the content with varied vocabulary.' },
                  { name: 'Restructure sentences', description: 'Create a unique composition by changing sentence and paragraph structures.' },
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
  const starRatingData = await getRating('ai-paraphraser')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}