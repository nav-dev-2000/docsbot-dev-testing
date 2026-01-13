import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'
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
  DocumentTextIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { diffWords } from 'diff'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import { DocumentDuplicateIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Analyzing your text...',
  'Applying human-like patterns...',
  'Enhancing natural language...',
  'Refining tone and style...',
  'Finalizing humanized text...',
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

const TextHumanizer = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [humanizedText, setHumanizedText] = useState('')
  const [diff, setDiff] = useState([])
  const [activeTab, setActiveTab] = useState('diff')
  const posthog = usePostHog()
  const [copySuccess, setCopySuccess] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const tabs = [
    { name: 'Diff View', id: 'diff', icon: DocumentDuplicateIcon },
    { name: 'Humanized', id: 'markdown', icon: DocumentTextIcon },
    { name: 'Original', id: 'original', icon: DocumentTextIcon },
  ]

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  useEffect(() => {
    if (input && humanizedText) {
      setDiff(diffWords(input, humanizedText))
    }
  }, [input, humanizedText])

  const humanizeText = async (userInput) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter some text to humanize.')
      setIsComputing(false)

      posthog?.capture('Free Tool', {
        tool: 'AI Text Humanizer',
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
          type: 'humanize',
          input: userInput,
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
            tool: 'AI Text Humanizer',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        setHumanizedText(data)
        posthog?.capture('Free Tool', {
          tool: 'AI Text Humanizer',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Text Humanizer',
        action: 'Error',
        error: e.message,
        category: 'Writing',
      })
    }

    setIsComputing(false)
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(humanizedText).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  return (
    <div className="mx-auto max-w-5xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:p-8">
          <Alert title={errorText} type="error" />
          {!humanizedText ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                humanizeText(input)
              }}
            >
              <div className="grid grid-cols-12 items-center gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isComputing}
                  placeholder="Paste your AI-generated text here"
                  className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-gray-100 sm:text-sm"
                  rows={10}
                  maxLength={10000}
                />
                <button
                  type="submit"
                  disabled={isComputing}
                  className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> <LoadingText />
                    </>
                  ) : (
                    <>Humanize Text</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="">
              <div className="sm:hidden">
                <label htmlFor="tabs" className="sr-only">
                  Select a tab
                </label>
                <select
                  id="tabs"
                  name="tabs"
                  className="block w-full rounded-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden sm:block">
                <nav className="flex space-x-4" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        tab.id === activeTab
                          ? 'bg-cyan-600 text-white'
                          : 'text-gray-500 hover:text-gray-700',
                        'px-3 py-2 font-medium text-sm rounded-md flex items-center'
                      )}
                    >
                      <tab.icon
                        className={clsx(
                          tab.id === activeTab ? 'text-white' : 'text-gray-400',
                          '-ml-0.5 mr-2 h-5 w-5 inline-block'
                        )}
                        aria-hidden="true"
                      />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="mt-4 relative">
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Copy to clipboard"
                >
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
                </button>
                {copySuccess && (
                  <span className="absolute top-2 right-12 text-sm text-green-600">
                    Copied!
                  </span>
                )}
                {activeTab === 'original' ? (
                  <div className="prose prose-sm max-w-none text-left rounded-md bg-gray-100 px-4 py-1">
                    <Streamdown
                      mode="static"
                      isAnimating={false}
                      remarkPlugins={streamdownRemarkPlugins}
                    >
                      {preprocessMath(input)}
                    </Streamdown>
                  </div>
                ) : activeTab === 'markdown' ? (
                  <div className="prose prose-sm max-w-none text-left rounded-md bg-gray-100 px-4 py-1">
                    <Streamdown
                      mode="static"
                      isAnimating={false}
                      remarkPlugins={streamdownRemarkPlugins}
                    >
                      {preprocessMath(humanizedText)}
                    </Streamdown>
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-100 p-4">
                    <pre className="whitespace-pre-wrap text-left text-sm text-gray-800">
                      {diff.map((part, index) => (
                        <span
                          key={index}
                          className={
                            part.added
                              ? 'bg-green-200'
                              : part.removed
                              ? 'bg-red-200 line-through'
                              : ''
                          }
                        >
                          {part.value}
                        </span>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={copyToClipboard}
                  className={clsx(
                    'flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                    copySuccess ? 'text-cyan-600' : 'text-gray-700'
                  )}
                >
                  <ClipboardDocumentIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  {copySuccess ? 'Copied!' : 'Copy Humanized Text'}
                </button>
                <button
                  onClick={() => {
                    setHumanizedText('')
                    setInput('')
                    setDiff([])
                    window.scrollTo({ top: 200, behavior: 'smooth' })
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Humanize More Text
                </button>
              </div>
            </div>
          )}
          <CarbonAd className="flex justify-center mt-4" /> 
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Text Humanizer"
        toolCategory="Writing"
      />
    </div>
  )
}

const useCases = [
  {
    name: 'Content Creation for Blogs',
    description:
      'Transform AI-generated drafts into engaging, human-like content for your blog posts. Increase reader engagement and retention with relatable writing.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Social Media Posts',
    description:
      'Turn AI-generated social media updates into authentic, human-sounding posts. Connect with your followers through personalized and captivating content.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Email Marketing',
    description:
      'Make AI-generated email campaigns feel more personal. Improve open and response rates with genuine and engaging promotional emails and newsletters.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Academic Writing Assistance',
    description:
      'Refine AI-generated drafts of essays, reports, and papers to meet academic standards and read naturally, improving clarity and comprehension.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Website Copy Enhancement',
    description:
      'Enhance AI-generated website content to make it more compelling and user-friendly. Improve user experience and conversion rates with natural-sounding copy.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Creative Writing Support',
    description:
      'Use the AI Text Humanizer to refine and polish AI-generated creative writing pieces, adding a more authentic and human touch to stories and narratives.',
    icon: LightBulbIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Text Humanizer?',
    answer:
      'An AI Text Humanizer is a tool that transforms AI-generated content into more natural, human-like writing. It helps to make the text sound more authentic, engaging, and less robotic.',
  },
  {
    question: 'How does the AI Text Humanizer work?',
    answer:
      'Our AI Text Humanizer uses advanced language models to analyze the input text and apply human-like patterns, tones, and styles. It considers factors like natural language flow, varied sentence structures, and appropriate use of idioms to create more authentic-sounding content.',
  },
  {
    question: 'Can I use this tool for free?',
    answer:
      'Yes, our AI Text Humanizer is free to use. You can humanize a limited number of texts per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit.',
  },
  {
    question: 'What types of text can I humanize?',
    answer:
      'You can humanize any type of text, including blog posts, social media updates, emails, essays, reports, and more. The tool is versatile and can be used for any scenario where you need to transform AI-generated content into more natural, human-like writing.',
  },
  {
    question: 'Can I customize the tone of the humanized text?',
    answer:
      'Yes, you can customize the tone of the humanized text. Our AI Text Humanizer allows you to select from various tones such as casual, formal, professional, and more. This helps ensure that the output matches the desired style and context of your content.',
  },
  {
    question: 'Is the humanized text detectable as AI-generated?',
    answer:
      "Our AI Text Humanizer significantly reduces the likelihood of the text being detected as AI-generated. However, it's important to note that as AI detection tools evolve, no method is 100% foolproof. For best results, we recommend reviewing and making minor edits to the humanized text to add your personal touch.",
  },
]

export default function TextHumanizerPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Text Humanizer | No Login | Make AI Writing Sound Natural"
        description="Turn AI-generated text into natural, human-like writing with our free AI Text Humanizer. No sign-up needed. Transform your ChatGPT, Gemini, and Claude content in seconds for more engaging and authentic communication."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/text-humanizer.png',
              alt: 'AI Text Humanizer',
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
                  Free AI Text Humanizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Turn AI-generated text from ChatGPT, Gemini, Claude, and other AI models into natural, human-like writing with our Free AI Text Humanizer. Just paste your text to transform it in seconds! View the original, humanized, and a diff view to preview the changes made.
                </p>
                <TextHumanizer />
                <StarRating
                  itemId="ai-text-humanizer"
                  name="AI Text Humanizer - DocsBot"
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
                How to Use Our AI Text Humanizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to transform AI-generated text into
                natural, human-like writing in seconds.
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
                      Simply paste your AI-generated text into the input box.
                      Our tool works with any type of content to create more
                      natural-sounding writing.
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
                      Select the desired tone for your humanized text from our
                      dropdown menu. Options include casual, formal, friendly,
                      and professional.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Get Humanized Text and Compare
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click 'Humanize Text' and watch as our AI transforms your content. View the original, humanized, and a diff view to see the changes made.
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
                Use Cases for Our AI Text Humanizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Text Humanizer can improve your
                results from Chat GPT and boost productivity across various
                domains.
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

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-text-humanizer')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}