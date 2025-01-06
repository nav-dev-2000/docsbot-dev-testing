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
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const loadingText = [
  'Analyzing ticket content...',
  'Extracting key points...',
  'Identifying main issues...',
  'Generating summary...',
  'Finalizing summary...',
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

const TicketSummarizer = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [summaryResults, setSummaryResults] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const summarizeTicket = async (userInput) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a support ticket to summarize.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Summarizer',
        action: 'Error',
        error: 'Empty Input',
        category: 'Support',
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
          type: 'summarize',
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
            tool: 'Support Ticket Summarizer',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Support',
          })
        }
      } else {
        const data = await response.json()
        setSummaryResults((prevResults) => [
          ...prevResults,
          {
            text: data
          },
        ])
        posthog?.capture('Free Tool', {
          tool: 'Support Ticket Summarizer',
          action: 'Used',
          category: 'Support',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Summarizer',
        action: 'Error',
        error: e.message,
        category: 'Support',
      })
    }

    setIsComputing(false)
  }

  const copyLatestSummary = () => {
    if (summaryResults.length > 0) {
      navigator.clipboard.writeText(summaryResults[summaryResults.length - 1].text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleNewTicket = () => {
    setInput('')
    setSummaryResults([])
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {summaryResults.length === 0 && (
            <>
              <textarea
                id="original-text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isComputing}
                placeholder="Paste your support ticket conversation here..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm"
                rows={6}
                maxLength={10000}
              />
            </>
          )}

          {summaryResults.map((result, index) => (
            <SummaryResult key={index} result={result} />
          ))}

          {/* Only show the form if there are no results */}
          {summaryResults.length === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                summarizeTicket(input)
              }}
            >
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={isComputing}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> <LoadingText />
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Summarize Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {summaryResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={handleNewTicket}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
              >
                <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Summarize New Ticket
              </button>
              <button
                onClick={copyLatestSummary}
                type="button"
                className={`rounded-lg text-center bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-md ring-1 ring-inset transition-all duration-200 hover:shadow-lg ${
                  isCopied ? 'ring-green-500' : 'ring-gray-300'
                } hover:bg-gray-50`}
                title="Copy to clipboard"
              >
                <div className="flex items-center justify-center">
                  <ClipboardDocumentIcon className={`h-5 w-5 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-600'
                  }`} />
                  <span className={`ml-2 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {isCopied ? 'Copied!' : 'Copy Summary'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Ticket Summarizer"
        toolCategory="Support"
      />
    </div>
  )
}

const SummaryResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(result.text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const processMarkdown = (text) => {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
      .toString()
  }

  const processedSummaryMarkdown = processMarkdown(result.text)

  return (
    <div className="relative">
      <div className="prose prose-h2:mt-0 min-h-16 max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200">
        <div
          dangerouslySetInnerHTML={{
            __html: processedSummaryMarkdown,
          }}
        />
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Quick Ticket Analysis',
    description: 'Rapidly analyze and categorize support tickets to identify core issues, priority levels, and required actions.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Helpdesk Efficiency',
    description:
      'Streamline your helpdesk workflow by automatically generating concise summaries of lengthy support conversations and ticket threads.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Customer Service Reports',
    description:
      'Create quick summaries for internal reports and handoffs. Transform detailed support conversations into clear, actionable briefings for team members.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Multi-Thread Consolidation',
    description:
      'Consolidate long email threads and multi-channel support conversations into single, comprehensive summaries for better ticket management.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Knowledge Base Creation',
    description:
      'Convert resolved support tickets into knowledge base articles by summarizing common issues and their solutions for future reference.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Team Handoff Support',
    description:
      'Facilitate smooth shift transitions by providing clear, concise summaries of ongoing support conversations for the next support agent.',
    icon: PencilIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Support Ticket Summarizer?',
    answer: 'An AI Support Ticket Summarizer is a specialized tool that uses artificial intelligence to analyze support tickets and generate concise summaries highlighting key issues, customer needs, and required actions. It helps support teams quickly understand ticket context and prioritize responses.',
  },
  {
    question: 'How does the Support Ticket Summarizer work with helpdesk platforms?',
    answer:
      'Our Support Ticket Summarizer works with any text-based support content. Simply copy and paste your ticket content from platforms like Zendesk, Freshdesk, or any other helpdesk system, and our AI will generate a clear, actionable summary.',
  },
  {
    question: 'Can this tool handle long support conversations?',
    answer:
      'Yes, our AI Support Ticket Summarizer excels at processing lengthy support conversations and email threads. It extracts the most relevant information and presents it in a concise, easy-to-understand format, saving valuable time for support teams.',
  },
  {
    question: 'How can this improve my customer support workflow?',
    answer:
      'The Support Ticket Summarizer streamlines ticket management by quickly identifying key issues, reducing time spent reading lengthy conversations, facilitating faster handoffs between support agents, and helping prioritize urgent matters more effectively.',
  },
  {
    question: 'Is my support ticket data secure?',
    answer:
      'We take data security seriously. All support tickets processed by our summarizer are encrypted in transit and not stored on our servers. Your ticket content and summaries remain confidential and are automatically deleted after processing.',
  },
  {
    question: 'Can it handle technical support tickets?',
    answer:
      'Yes, our AI is trained to understand and summarize technical support tickets effectively. It can identify technical issues, error messages, troubleshooting steps taken, and resolution status while maintaining technical accuracy in the summary.',
  },
  {
    question: 'How accurate are the ticket summaries?',
    answer:
      'Our AI Support Ticket Summarizer uses advanced natural language processing to ensure high accuracy. It effectively captures key issues, customer sentiments, and action items while maintaining context. However, we recommend reviewing summaries for critical tickets.',
  },
  {
    question: 'Can I integrate this with my helpdesk system?',
    answer:
      'While our free tool works through copy-paste functionality, DocsBot offers API access and direct integrations with popular helpdesk platforms through our premium plans. Custom train a bot to not only summarize, but respond to tickets with AI trained on your knowledge base, documentation, and previous conversations.',
  },
]

export default function TicketSummarizerPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="AI Support Ticket Summarizer | Free Customer Service Tool"
        description="Improve customer service with our AI-powered ticket summarizer. Quickly extract key issues and action items from helpdesk support conversations."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/support-ticket-summarizer.png',
              alt: 'AI Support Ticket Summarizer',
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
                  Free AI Support Ticket Summarizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Quickly summarize support tickets to extract key issues and action items. Streamline your customer service workflow with AI-powered summaries of helpdesk tickets or email threads.
                </p>
                <TicketSummarizer />
                <StarRating
                  itemId="ticket-summarizer"
                  name="Support Ticket Summarizer - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Automate Your Customer Support Now!"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Easy Ticket Analysis
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our Free AI Support Ticket Summarizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Transform your support tickets into clear, actionable summaries in seconds with these simple steps.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Your Ticket
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Copy your support ticket content from any helpdesk platform and paste it into the input box. Our tool works with any type of support conversation.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Generate Summary
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click the 'Summarize' button and let our AI analyze the ticket content. We'll identify key issues, customer needs, and action items.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Use Your Summary
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the generated summary and copy it for your records. Use it for ticket handoffs, internal reports, or knowledge base articles.
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
                Use Cases for Our Free AI Support Ticket Summarizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Support Ticket Summarizer can improve your support workflow and boost productivity across various domains.
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
          <FreeToolsGrid category="Customer Support" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ticket-summarizer')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
