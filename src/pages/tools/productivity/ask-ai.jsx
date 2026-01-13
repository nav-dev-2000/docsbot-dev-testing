import { NextSeo, FAQPageJsonLd } from 'next-seo'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'
import {
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'

const loadingText = [
  'Ask AI is reviewing your question for precise guidance...',
  'Matching your ask AI context with trusted knowledge and tone...',
  'Designing the ideal AI question answer format for easy reading...',
  'Refining clarity so the AI answers questions you actually asked...',
  'Finalizing your ask AI free response—ready in a moment...',
]

const LoadingText = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev < loadingText.length - 1) {
          return prev + 1
        }
        clearInterval(interval)
        return prev
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return <p className="animate-pulse text-sm text-white">{loadingText[index]}</p>
}

const tones = [
  {
    name: 'Neutral Expert',
    emoji: '🧠',
    description: 'Reliable ask AI answers with confident, professional clarity.',
  },
  {
    name: 'Academic Researcher',
    emoji: '🎓',
    description: 'Structured explanations with references for AI questions and answers.',
  },
  {
    name: 'Friendly Guide',
    emoji: '😊',
    description: 'Conversational AI answers that keep complex topics easy to follow.',
  },
  {
    name: 'Persuasive Pitch',
    emoji: '🎯',
    description: 'Convince stakeholders with answer AI insights and clear benefits.',
  },
  {
    name: 'Support Hero',
    emoji: '💡',
    description: 'Empathetic responses for help desk and customer ask AI interactions.',
  },
  {
    name: 'Technical Mentor',
    emoji: '🛠️',
    description: 'Precise walkthroughs for engineers asking AI detailed questions.',
  },
]

const answerLengths = [
  {
    name: 'Quick Snapshot',
    description: 'Fast ask AI answers when you just need the gist.',
  },
  {
    name: 'Balanced Breakdown',
    description: 'Question answering AI depth with clear takeaways.',
  },
  {
    name: 'Deep Dive',
    description: 'Comprehensive AI question answerer output with full detail.',
  },
]

const formats = [
  {
    name: 'Guided Paragraphs',
    description: 'Natural paragraphs for blogs, docs, and ask AI articles.',
  },
  {
    name: 'Bullet Answers',
    description: 'Skimmable bullet lists when you ask AI for quick points.',
  },
  {
    name: 'Step-by-Step Playbook',
    description: 'Sequential instructions for tutorials and troubleshooting.',
  },
]

const faqs = [
  {
    question: 'What is Ask AI?',
    answer:
      'Ask AI is a free question answering AI experience that lets you ask AI a question and get a polished response instantly. Pick your tone, answer length, and format to match every workflow.',
  },
  {
    question: 'Is it really free to ask AI questions online?',
    answer:
      'Yes. You can ask AI for free with no sign up required. Enjoy generous daily limits, then upgrade to DocsBot when you need higher usage, team collaboration, or custom knowledge bases.',
  },
  {
    question: 'What are the daily rate limits?',
    answer:
      'Anonymous users get 3 answers per day, free DocsBot users get 6, and paid plans multiply limits by 5x. Upgrade for more runs.',
  },
  {
    question: 'Can I use Ask AI for homework or work projects?',
    answer:
      'Absolutely. Students and professionals use the tool to ask AI questions, summarize research, draft support answers, and plan content. Always double-check academic or compliance requirements before submitting.',
  },
  {
    question: 'How accurate are the AI answers?',
    answer:
      'The hub uses GPT-5 reasoning through DocsBot to deliver accurate answers AI can provide with context you share. Review each response, especially for niche or regulated topics, and ground answers in your own sources when needed.',
  },
  {
    question: 'Which AI model powers Ask AI?',
    answer:
      "DocsBot routes your request to OpenAI's GPT-5 reasoning model so you can ask AI anything and get up-to-date context with strong logic and structure.",
  },
  {
    question: 'Can I embed an ask AI widget on my website?',
    answer:
      'Yes. Upgrade to DocsBot, train it on your content, and embed an unbranded ask AI assistant anywhere. Visitors can ask AI questions online and receive answers grounded in your knowledge base.',
  },
  {
    question: 'Is my data private when I ask AI a question?',
    answer:
      'We do not store the question, context, or answer you generate in Ask AI. For enterprise-grade privacy controls, audit logs, and regional hosting, DocsBot Pro has you covered.',
  },
]

const benefits = [
  {
    name: 'Ask AI in any format',
    description:
      'Switch between guides, bullet lists, or step-by-step plans. Ask AI free and tailor the answer to your workflow.',
    icon: SparklesIcon,
  },
  {
    name: 'Control tone and depth',
    description:
      'Guide the AI questions and answers experience with tone, length, and format settings that match your brand.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Designed for every team',
    description:
      'Students, marketers, and support pros can ask AI anything—from FAQ drafts to persuasive replies and more.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Private by default',
    description:
      'Ask AI a question online without storing prompts. Upgrade to DocsBot for access controls and tailored knowledge bases.',
    icon: ShieldCheckIcon,
  },
]

const useCases = [
  {
    title: 'Ask AI questions for learning',
    description:
      'Students can ask AI a question, get a plain-language explanation, and request alternative examples for better study sessions.',
    icon: AcademicCapIcon,
  },
  {
    title: 'Customer support answer AI',
    description:
      'Paste a ticket and let the AI answer questions in your preferred tone. Draft replies faster while keeping empathy and accuracy.',
    icon: CheckBadgeIcon,
  },
  {
    title: 'Documentation and knowledge',
    description:
      'Turn raw questions into clean FAQ entries, SOPs, or wiki updates. The AI question answering experience keeps everything on brand.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: 'Sales, marketing, and outreach',
    description:
      'Ask AI to write persuasive responses, thought leadership answers, or social captions that highlight your value quickly.',
    icon: LightBulbIcon,
  },
]

const steps = [
  {
    name: '1. Ask AI your question',
    description:
      'Share the question, add context, or paste source material so the AI knows exactly how to answer.',
  },
  {
    name: '2. Tune the response',
    description:
      'Select tone, length, and format controls that keep your AI answers aligned with your goal.',
  },
  {
    name: '3. Review and reuse',
    description:
      'Copy, export, or rerun the ask AI free tool until the answer fits perfectly. Train DocsBot for grounded answers with citations.',
  },
]

const parseErrorResponse = async (response) => {
  const fallbackMessage = 'Something went wrong. Please try again later.'

  try {
    const responseText = await response.text()

    if (!responseText) {
      return fallbackMessage
    }

    try {
      const parsed = JSON.parse(responseText)
      if (typeof parsed === 'string') {
        return parsed
      }
      if (parsed && typeof parsed === 'object' && parsed.message) {
        return parsed.message
      }
    } catch (jsonError) {
      if (responseText.trim().length > 0) {
        return responseText
      }
    }
  } catch (error) {
    console.error('Failed to parse error response:', error)
  }

  return fallbackMessage
}

const AIAnswerGeneratorForm = () => {
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [selectedTone, setSelectedTone] = useState(tones[0])
  const [selectedLength, setSelectedLength] = useState(answerLengths[1])
  const [selectedFormat, setSelectedFormat] = useState(formats[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [generatedAnswer, setGeneratedAnswer] = useState(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const posthog = usePostHog()
  const isFormDisabled = isGenerating

  const stats = useMemo(() => {
    if (!generatedAnswer?.text) return null
    const words = generatedAnswer.text.trim().split(/\s+/).filter(Boolean).length
    const characters = generatedAnswer.text.length
    const readingMinutes = Math.max(1, Math.round(words / 180))

    return {
      words,
      characters,
      readingMinutes,
    }
  }, [generatedAnswer])

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  const handleGenerate = async (event) => {
    event.preventDefault()

    if (!question.trim()) {
      setErrorText('Please add a question or prompt so Ask AI knows what to solve.')
      posthog?.capture('Free Tool', {
        tool: 'Ask AI',
        action: 'Error',
        error: 'Empty question',
        category: 'Productivity',
      })
      return
    }

    setIsGenerating(true)
    setErrorText('')

    try {
      const endpoint = `/api/tools/text-prompter`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'answer-generator',
          input: question,
          context,
          tone: selectedTone.name,
          answerLength: selectedLength.name,
          formatPreference: selectedFormat.name,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText('Daily usage limit exceeded, please try again tomorrow or create a free DocsBot account for higher limits.')
          setShowSignupModal(true)
        } else {
          const errorMessage = await parseErrorResponse(response)
          setErrorText(errorMessage)
        }
        posthog?.capture('Free Tool', {
          tool: 'Ask AI',
          action: 'Error',
          error: response.status,
          category: 'Productivity',
        })
        return
      }

      const data = await response.json()
      const textResponse = typeof data === 'string' ? data : Array.isArray(data) ? data.join('\n\n') : JSON.stringify(data)

      setGeneratedAnswer({
        text: textResponse,
      })

      posthog?.capture('Free Tool', {
        tool: 'Ask AI',
        action: 'Generated Answer',
        tone: selectedTone.name,
        length: selectedLength.name,
        format: selectedFormat.name,
        category: 'Productivity',
      })
    } catch (error) {
      console.error('Ask AI error:', error)
      setErrorText('Unexpected error generating your AI answer. Please try again.')
      posthog?.capture('Free Tool', {
        tool: 'Ask AI',
        action: 'Error',
        error: error.message,
        category: 'Productivity',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedAnswer?.text) return
    try {
      await navigator.clipboard.writeText(generatedAnswer.text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
      posthog?.capture('Free Tool', {
        tool: 'Ask AI',
        action: 'Copied Answer',
        category: 'Productivity',
      })
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  return (
    <div className="mt-12 overflow-hidden rounded-3xl bg-white shadow-xl">
      {generatedAnswer ? (
        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Ask AI Response</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGeneratedAnswer(null)}
                className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-200"
              >
                Ask AI Again
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-100"
              >
                {isCopied ? (
                  <CheckIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            <div className="">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-semibold">Review AI-generated answers before using</p>
                  <p className="mt-1">
                    AI can hallucinate or fabricate facts, especially for topics that are not well known such as your business or product. Train a custom DocsBot ask AI assistant on your own content for grounded answers with citations.
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="mt-4 ms-6 inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                Create a Free DocsBot Ask AI Assistant
              </Link>
            </div>
          </div>

          {stats && (
            <p className="mt-3 text-xs text-gray-500">
              {stats.words} words · {stats.characters} characters · ~{stats.readingMinutes} min read · {selectedTone.emoji}{' '}
              {selectedTone.name} tone · {selectedLength.name} length · {selectedFormat.name}
            </p>
          )}

          <article
            className="mt-5 max-w-none text-gray-800"
          >
            <Streamdown
              mode="static"
              isAnimating={false}
              remarkPlugins={streamdownRemarkPlugins}
            >
              {preprocessMath(generatedAnswer.text)}
            </Streamdown>
          </article>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="border-b border-gray-200 bg-gray-50 p-8 lg:col-span-2 lg:border-r">
            <h2 className="text-lg font-semibold text-gray-900">Customize your AI answer</h2>
            <p className="mt-2 text-sm text-gray-500">
              Choose tone, answer length, and structure so the AI-generated answer matches your exact needs.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Select Tone</h3>
                <div className="mt-3 grid gap-3">
                  {tones.map((tone) => {
                    const isActive = tone.name === selectedTone.name
                    return (
                      <button
                        key={tone.name}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        disabled={isFormDisabled}
                        className={`flex items-start rounded-xl border p-3 text-left transition ${
                          isActive ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        } disabled:opacity-75 disabled:cursor-not-allowed disabled:pointer-events-none`}
                      >
                        <span className="mr-3 text-2xl" aria-hidden>
                          {tone.emoji}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">{tone.name}</span>
                          <span className="mt-1 block text-sm text-gray-500">{tone.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Answer Length</h3>
                <div className="mt-3 grid gap-3">
                  {answerLengths.map((length) => {
                    const isActive = length.name === selectedLength.name
                    return (
                      <button
                        key={length.name}
                        type="button"
                        onClick={() => setSelectedLength(length)}
                        disabled={isFormDisabled}
                        className={`rounded-xl border p-3 text-left transition ${
                          isActive ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        } disabled:opacity-75 disabled:cursor-not-allowed disabled:pointer-events-none`}
                      >
                        <span className="block text-sm font-semibold text-gray-900">{length.name}</span>
                        <span className="mt-1 block text-sm text-gray-500">{length.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Format Preference</h3>
                <div className="mt-3 grid gap-3">
                  {formats.map((format) => {
                    const isActive = format.name === selectedFormat.name
                    return (
                      <button
                        key={format.name}
                        type="button"
                        onClick={() => setSelectedFormat(format)}
                        disabled={isFormDisabled}
                        className={`rounded-xl border p-3 text-left transition ${
                          isActive ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                        } disabled:opacity-75 disabled:cursor-not-allowed disabled:pointer-events-none`}
                      >
                        <span className="block text-sm font-semibold text-gray-900">{format.name}</span>
                        <span className="mt-1 block text-sm text-gray-500">{format.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="p-8 lg:col-span-3">
            {errorText && <Alert type="error" title="" text={errorText} className="mb-6" />}
            <div>
              <label htmlFor="question" className="text-sm font-semibold text-gray-700">
                Ask AI a Question
              </label>
              <textarea
                id="question"
                name="question"
                rows={5}
                className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-75 disabled:cursor-not-allowed"
                placeholder="Ask AI anything: e.g. 'Ask AI to explain quantum computing simply' or 'Ask AI a question about our refund policy.'"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="context" className="text-sm font-semibold text-gray-700">
                Optional Context or Source Material
              </label>
              <textarea
                id="context"
                name="context"
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-75 disabled:cursor-not-allowed"
                placeholder="Paste notes, documentation excerpts, or rubrics so the AI answers questions with your context."
                value={context}
                onChange={(event) => setContext(event.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-75 disabled:cursor-not-allowed disabled:pointer-events-none"
              disabled={isFormDisabled}
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner />
                  <LoadingText />
                </>
              ) : (
                'Ask AI for an Answer'
              )}
            </button>

            <CarbonAd className="mt-6 flex justify-center" />
          </form>
        </div>
      )}

      <ToolsSignupModal
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Ask AI"
        toolCategory="Productivity"
      />
    </div>
  )
}

export default function AskAIAnswerHubPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Ask AI | Free GPT-5 Tool to Ask AI Questions Online"
        description="Ask AI questions online for free and get instant answers. Tune tone, length, and format to match your needs with the Ask AI powered by DocsBot."
        canonical="https://docsbot.ai/tools/productivity/ask-ai"
        openGraph={{
          url: 'https://docsbot.ai/tools/productivity/ask-ai',
          title: 'Ask AI | Free GPT-5 Tool to Ask AI Questions Online',
          description:
            'Ask AI anything and receive fast, accurate answers powered by GPT-5. Customize tone, format, and depth in the Ask AI.',
          images: [
            {
              url: 'https://docsbot.ai/images/og/ask-ai.png',
              alt: 'DocsBot Ask AI Tool',
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
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#34d399] to-[#38bdf8] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-16 sm:py-28">
            <div className="mx-auto max-w-5xl px-6 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-cyan-200">
                <SparklesIcon className="h-4 w-4" /> Ask AI · Free GPT-5 Answers · No Sign Up Required
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Ask AI – Ask AI a Question and Get Instant Answers
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Ask the AI a question about anything and get a fast, accurate response. The Ask AI lets you ask AI free, ask AI a question online, and get AI answers you can reuse for study, support, or content without friction.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-cyan-100">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <InformationCircleIcon className="h-4 w-4" /> Ask AI questions online free
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <InformationCircleIcon className="h-4 w-4" /> Ask AI a question and get answers
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <InformationCircleIcon className="h-4 w-4" /> Question answering AI powered by DocsBot
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <InformationCircleIcon className="h-4 w-4" /> Ask AI anything in seconds
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                  <InformationCircleIcon className="h-4 w-4" /> AI answers questions for work or study
                </span>
              </div>
            </div>
            <div className="mx-auto mt-12 max-w-6xl px-6">
              <AIAnswerGeneratorForm />
            </div>
              <StarRating
                itemId="ask-ai-answer-hub"
                name="Ask AI - DocsBot"
                className="mx-auto mt-10 flex justify-center text-white"
                starRatingData={starRatingData}
              />
          </div>
        </div>

        <RegisterCTA
          customTitle="Launch your own Ask AI assistant in minutes"
          description="Train a DocsBot agent on your website or docs so visitors can ask AI questions and get grounded answers with citations. Deploy it on your website, Slack, helpdesk, or anywhere else you want."
          button="Create your Free DocsBot Ask AI Assistant"
        />

        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">Why Ask AI?</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ask AI questions faster with GPT-5-powered accuracy
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Built on GPT-5 reasoning, Ask AI adapts to every workflow—from studying and customer support to marketing answers and knowledge base drafting.
              </p>
            </div>
            <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.name} className="rounded-2xl border border-gray-200 p-6">
                  <benefit.icon className="h-10 w-10 text-cyan-600" />
                  <dt className="mt-4 text-lg font-semibold text-gray-900">{benefit.name}</dt>
                  <dd className="mt-3 text-sm leading-6 text-gray-600">{benefit.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">How it works</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ask AI for answers faster than ever
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow three simple steps to turn any question into a polished AI-generated answer using our ask AI tool.
              </p>
            </div>
            <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.name} className="rounded-2xl bg-white p-6 shadow-sm">
                  <dt className="text-lg font-semibold text-gray-900">{step.name}</dt>
                  <dd className="mt-3 text-sm leading-6 text-gray-600">{step.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">Ask AI use cases</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Built for students, support teams, marketers, and experts
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Whether you need an ask AI question answerer for quick facts or a long-form explanation, DocsBot keeps every response on brand.
              </p>
            </div>
            <dl className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <useCase.icon className="h-10 w-10 text-cyan-600" />
                  <dt className="mt-4 text-xl font-semibold text-gray-900">{useCase.title}</dt>
                  <dd className="mt-3 text-sm leading-6 text-gray-600">{useCase.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ask AI FAQs</h2>
            <p className="mt-4 text-lg text-gray-300">
              Everything you need to know about asking AI questions for free, accuracy controls, and DocsBot upgrades.
            </p>
            <div className="mt-10 space-y-6 text-left">
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl bg-white/5 p-6">
                  <h3 className="text-xl font-semibold text-white">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-200">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <FreeToolsGrid category="Productivity" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ask-ai-answer-hub')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
