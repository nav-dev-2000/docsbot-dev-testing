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
  FaceSmileIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon as SparklesIconOutline,
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
  'Analyzing your response...',
  'Identifying tone and style...',
  'Rewriting with new style...',
  'Polishing the response...',
  'Finalizing your rewrite...',
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

const responseStyles = [
  {
    id: 'friendly',
    name: 'Friendly & Casual',
    description: 'Make your response more approachable and conversational',
    icon: FaceSmileIcon,
  },
  {
    id: 'professional',
    name: 'Professional & Formal',
    description: 'Transform your response into a polished, business-appropriate tone',
    icon: UserGroupIcon,
  },
  {
    id: 'detailed',
    name: 'Detailed & Explanative',
    description: 'Expand your response with more context and explanations',
    icon: DocumentTextIcon,
  },
  {
    id: 'concise',
    name: 'Concise & Direct',
    description: 'Make your response shorter and more to the point',
    icon: MagnifyingGlassIcon,
  },
  {
    id: 'empathetic',
    name: 'Empathetic & Understanding',
    description: 'Add more emotional support and understanding to your response',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    id: 'technical',
    name: 'Technical & Precise',
    description: 'Enhance your response with more technical details and precision',
    icon: AcademicCapIcon,
  },
]

const TicketResponseRewriter = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [rewrittenResults, setRewrittenResults] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('friendly')
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const rewriteResponse = async (userInput, style) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a support ticket response to rewrite.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Response Rewriter',
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
          type: 'ticketResponseRewriter',
          input: userInput,
          tone: style,
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
            tool: 'Support Ticket Response Rewriter',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Support',
          })
        }
      } else {
        const data = await response.json()
        setRewrittenResults((prevResults) => [
          ...prevResults,
          {
            text: data,
            style: style,
          },
        ])
        posthog?.capture('Free Tool', {
          tool: 'Support Ticket Response Rewriter',
          action: 'Used',
          style: style,
          category: 'Support',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Response Rewriter',
        action: 'Error',
        error: e.message,
        category: 'Support',
      })
    }

    setIsComputing(false)
  }

  const copyLatestRewrite = () => {
    if (rewrittenResults.length > 0) {
      navigator.clipboard.writeText(rewrittenResults[rewrittenResults.length - 1].text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleNewResponse = () => {
    setInput('')
    setRewrittenResults([])
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {rewrittenResults.length === 0 && (
            <>
              <textarea
                id="original-text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isComputing}
                placeholder="Paste or type your support ticket response here..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm"
                rows={6}
                maxLength={10000}
              />
              
              <div className="mt-4">
                <label htmlFor="style-selector" className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a style for your rewritten response:
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {responseStyles.map((style) => (
                    <div
                      key={style.id}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-300 ease-in-out transform hover:scale-105 ${
                        selectedStyle === style.id
                          ? 'border-cyan-500 ring-2 ring-cyan-500 shadow-md'
                          : 'border-gray-300 hover:border-cyan-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="flex w-full flex-col items-center justify-center text-center">
                        <div className="flex items-center justify-center mb-1">
                          <style.icon className={`h-5 w-5 mr-2 transition-colors duration-300 ${
                            selectedStyle === style.id ? 'text-cyan-600' : 'text-gray-500 group-hover:text-cyan-500'
                          }`} />
                          <p className={`font-medium transition-colors duration-300 ${
                            selectedStyle === style.id ? 'text-cyan-700' : 'text-gray-900'
                          }`}>{style.name}</p>
                        </div>
                        <p className={`text-xs transition-colors duration-300 ${
                          selectedStyle === style.id ? 'text-cyan-600' : 'text-gray-500'
                        }`}>{style.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {rewrittenResults.map((result, index) => (
            <RewriteResult key={index} result={result} />
          ))}

          {/* Only show the form if there are no results */}
          {rewrittenResults.length === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                rewriteResponse(input, selectedStyle)
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
                      Rewrite Response
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {rewrittenResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={handleNewResponse}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
              >
                <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Rewrite New Response
              </button>
              <button
                onClick={copyLatestRewrite}
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
                    {isCopied ? 'Copied!' : 'Copy Response'}
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
        toolName="Ticket Response Rewriter"
        toolCategory="Support"
      />
    </div>
  )
}

const RewriteResult = ({ result }) => {
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

  const processedRewriteMarkdown = processMarkdown(result.text)
  
  const getStyleName = (styleId) => {
    const style = responseStyles.find(s => s.id === styleId)
    return style ? style.name : 'Rewritten'
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {getStyleName(result.style)} Response:
        </h3>
      </div>
      <div className="prose prose-h2:mt-0 min-h-16 max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200">
        <div
          dangerouslySetInnerHTML={{
            __html: processedRewriteMarkdown,
          }}
        />
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Improve Response Tone',
    description: 'Transform unprofessional or too casual responses into appropriately toned messages that maintain professionalism while being friendly.',
    icon: FaceSmileIcon,
  },
  {
    name: 'Enhance Clarity',
    description:
      'Make your support responses clearer and more detailed to ensure customers understand your solutions completely.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Standardize Communication',
    description:
      'Maintain consistent tone and style across all customer support responses, ensuring a uniform brand voice.',
    icon: UserGroupIcon,
  },
  {
    name: 'Save Time on Responses',
    description:
      'Quickly transform draft responses into polished, professional communications without extensive editing.',
    icon: PencilIcon,
  },
  {
    name: 'Improve Customer Satisfaction',
    description:
      'Create more empathetic and understanding responses that show customers you truly care about their issues.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Technical Communication',
    description:
      'Enhance technical explanations to be more precise and detailed for complex support issues.',
    icon: AcademicCapIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Support Ticket Response Rewriter?',
    answer: 'An AI Support Ticket Response Rewriter is a specialized tool that uses artificial intelligence to transform your support ticket responses into different styles. It can make your responses friendlier, more professional, more detailed, or more concise while maintaining the core message.',
  },
  {
    question: 'How does the Support Ticket Response Rewriter work?',
    answer:
      'Our Support Ticket Response Rewriter works with any text-based support response. Simply paste your response, select your desired style (friendly, professional, detailed, etc.), and our AI will rewrite it while maintaining the original meaning but with the new tone and style.',
  },
  {
    question: 'What styles can I choose from?',
    answer:
      'Our tool offers multiple styles including Friendly & Casual, Professional & Formal, Detailed & Explanative, Concise & Direct, Empathetic & Understanding, and Technical & Precise. Each style transforms your response while preserving the essential information.',
  },
  {
    question: 'How can this improve my customer support workflow?',
    answer:
      'The Support Ticket Response Rewriter helps you quickly improve the quality of your responses, maintain consistent tone across your support team, save time on editing, and ensure your communications are always appropriate for the situation.',
  },
  {
    question: 'Is my support ticket data secure?',
    answer:
      'We take data security seriously. All support responses processed by our rewriter are encrypted in transit and not stored on our servers. Your response content and rewrites remain confidential and are automatically deleted after processing.',
  },
  {
    question: 'Can it handle technical support responses?',
    answer:
      'Yes, our AI is trained to understand and rewrite technical support responses effectively. It can maintain technical accuracy while improving clarity, tone, and professionalism.',
  },
  {
    question: 'How accurate are the rewritten responses?',
    answer:
      'Our AI Support Ticket Response Rewriter uses advanced natural language processing to ensure high accuracy. It effectively maintains the original meaning while transforming the style and tone. However, we recommend reviewing rewrites for critical responses.',
  },
  {
    question: 'Can I integrate this with my helpdesk system?',
    answer:
      'While our free tool works through copy-paste functionality, DocsBot offers API access and direct integrations with popular helpdesk platforms through our premium plans. Custom train a bot to not only rewrite, but respond to tickets with AI trained on your knowledge base, documentation, and previous conversations.',
  },
]

export default function TicketResponseRewriterPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="AI Support Ticket Response Rewriter | Free Customer Service Tool"
        description="Improve your support responses with our AI-powered rewriter. Transform unprofessional responses into friendly, professional, or detailed communications."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/support-ticket-response-rewriter.png',
              alt: 'AI Support Ticket Response Rewriter',
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
                  Free AI Support Ticket Response Rewriter
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Transform your support responses with different styles. Make unprofessional responses friendly, casual responses professional, or add more detail to your explanations.
                </p>
                <TicketResponseRewriter />
                <StarRating
                  itemId="ticket-response-rewriter"
                  name="Support Ticket Response Rewriter - DocsBot"
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
                Easy Response Improvement
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our Free AI Support Ticket Response Rewriter
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Transform your support responses into better versions in seconds with these simple steps.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Your Response
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Copy your support ticket response and paste it into the input box. Our tool works with any type of support communication.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Choose Your Style
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select your desired style (friendly, professional, detailed, etc.) and click the 'Rewrite Response' button to transform your text.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Use Your Rewritten Response
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the rewritten response and copy it for use in your support system. The original meaning is preserved with improved tone and style.
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
                Use Cases for Our Free AI Support Ticket Response Rewriter
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Support Ticket Response Rewriter can improve your support workflow and boost productivity across various domains.
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
  const starRatingData = await getRating('ticket-response-rewriter')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
