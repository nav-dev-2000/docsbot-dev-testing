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
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const loadingText = [
  'Analyzing ticket content...',
  'Identifying customer needs...',
  'Crafting appropriate response...',
  'Polishing response tone...',
  'Finalizing response...',
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

const TicketResponseGenerator = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [responseResults, setResponseResults] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [selectedTone, setSelectedTone] = useState('professional')
  const [showToneSelector, setShowToneSelector] = useState(false)
  const [showComparisonView, setShowComparisonView] = useState(false)
  const [comparisonResponses, setComparisonResponses] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and conversational' },
    { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive' },
    { value: 'technical', label: 'Technical', description: 'Detailed and solution-focused' },
    { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
  ]

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const generateResponse = async (userInput, tone = selectedTone) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a support ticket to generate a response.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Response Generator',
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
          type: 'supportTicketResponseGenerator',
          input: userInput,
          tone: tone,
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
            tool: 'Support Ticket Response Generator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Support',
          })
        }
      } else {
        const data = await response.json()
        setResponseResults((prevResults) => [
          ...prevResults,
          {
            text: data,
            tone: tone,
          },
        ])
        posthog?.capture('Free Tool', {
          tool: 'Support Ticket Response Generator',
          action: 'Used',
          category: 'Support',
          tone: tone,
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'Support Ticket Response Generator',
        action: 'Error',
        error: e.message,
        category: 'Support',
      })
    }

    setIsComputing(false)
  }

  const copyLatestResponse = () => {
    if (responseResults.length > 0) {
      navigator.clipboard.writeText(responseResults[responseResults.length - 1].text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleNewTicket = () => {
    setInput('')
    setResponseResults([])
    setShowToneSelector(false)
    setShowComparisonView(false)
    setComparisonResponses([])
    setCurrentSlide(0)
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const regenerateWithDifferentTone = async (tone) => {
    setSelectedTone(tone)
    setIsComputing(true)
    setErrorText('')

    const endpoint = `/api/tools/text-prompter`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'supportTicketResponseGenerator',
          input: input,
          tone: tone,
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
        }
      } else {
        const data = await response.json()
        setComparisonResponses((prevResponses) => [
          ...prevResponses,
          {
            text: data,
            tone: tone,
          },
        ])
        setShowComparisonView(true)
        setCurrentSlide(comparisonResponses.length + 1) // Set to the new slide
        posthog?.capture('Free Tool', {
          tool: 'Support Ticket Response Generator',
          action: 'Used',
          category: 'Support',
          tone: tone,
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
    }

    setIsComputing(false)
  }

  const copyResponse = (text) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleSlideChange = (index) => {
    setCurrentSlide(index)
  }

  const goToNextSlide = () => {
    const maxSlide = comparisonResponses.length
    setCurrentSlide((prev) => (prev < maxSlide ? prev + 1 : prev))
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {responseResults.length === 0 && !showComparisonView && (
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
              
              <div className="mt-4">
                <label htmlFor="tone-selector" className="block text-base font-semibold text-gray-800 mb-2">
                  <span className="border-b-2 border-cyan-500 pb-1">Response Tone</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {toneOptions.map((tone) => (
                    <div 
                      key={tone.value}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md ${
                        selectedTone === tone.value 
                          ? 'border-cyan-500 ring-2 ring-cyan-500 bg-cyan-50' 
                          : 'border-gray-300 hover:border-cyan-300'
                      }`}
                      onClick={() => setSelectedTone(tone.value)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm text-left">
                            <p className={`font-medium transition-colors duration-200 ${
                              selectedTone === tone.value ? 'text-cyan-600' : 'text-gray-900'
                            }`}>
                              {tone.label}
                            </p>
                            <p className="text-gray-500 text-xs transition-colors duration-200">{tone.description}</p>
                          </div>
                        </div>
                        <div className={`shrink-0 transition-all duration-300 ${
                          selectedTone === tone.value ? 'text-cyan-600 scale-110' : 'text-gray-400'
                        }`}>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Original response view */}
          {responseResults.length > 0 && !showComparisonView && (
            <>
              {responseResults.map((result, index) => (
                <ResponseResult key={index} result={result} />
              ))}

              <div className="mt-8 space-y-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Try a different tone</h3>
                  <p className="text-sm text-gray-500">Generate another response with the same ticket using a different tone</p>
                  <div className="flex flex-wrap gap-2">
                    {toneOptions.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => regenerateWithDifferentTone(tone.value)}
                        disabled={isComputing}
                        className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
                          isComputing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : responseResults[responseResults.length - 1]?.tone === tone.value
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleNewTicket}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
                  >
                    <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Generate New Response
                  </button>
                  <button
                    onClick={copyLatestResponse}
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
              </div>
            </>
          )}

          {/* Comparison view */}
          {showComparisonView && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Tone Comparison</h2>
                <button
                  onClick={handleNewTicket}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Start New Ticket
                </button>
              </div>
              
              <div className="relative overflow-hidden">
                <div className="flex transition-transform duration-300 ease-in-out min-h-[400px] items-center" 
                     style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {/* Original response */}
                  <div className="w-full flex-shrink-0 p-4 flex items-center justify-center">
                    <div className="border rounded-lg p-4 w-full h-[500px] flex flex-col overflow-hidden">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Original Response</h3>
                      <div className="flex-grow">
                        {responseResults.length > 0 && (
                          <ResponseResult result={responseResults[responseResults.length - 1]} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* New responses */}
                  {comparisonResponses.map((response, index) => (
                    <div key={index} className="w-full flex-shrink-0 p-4 flex items-center justify-center">
                      <div className="border rounded-lg p-4 w-full h-[500px] flex flex-col overflow-hidden">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {toneOptions.find(t => t.value === response.tone)?.label || 'New Response'}
                        </h3>
                        <div className="flex-grow">
                          <ResponseResult result={response} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation arrows */}
                {currentSlide > 0 && (
                  <button
                    onClick={goToPrevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Previous response"
                  >
                    <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                  </button>
                )}
                
                {currentSlide < comparisonResponses.length && (
                  <button
                    onClick={goToNextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Next response"
                  >
                    <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                  </button>
                )}
                
                {/* Pagination dots */}
                <div className="flex justify-center mt-4 space-x-2">
                  <button
                    onClick={() => handleSlideChange(0)}
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentSlide === 0 ? 'bg-cyan-600' : 'bg-gray-300'
                    }`}
                    aria-label="Go to original response"
                  />
                  {comparisonResponses.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlideChange(index + 1)}
                      className={`w-2.5 h-2.5 rounded-full ${
                        currentSlide === index + 1 ? 'bg-cyan-600' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to ${toneOptions.find(t => t.value === comparisonResponses[index].tone)?.label || 'response'} ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Try another tone</h3>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => regenerateWithDifferentTone(tone.value)}
                      disabled={isComputing}
                      className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-left transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${
                        isComputing
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : comparisonResponses.some(r => r.tone === tone.value)
                          ? 'bg-cyan-100 text-cyan-800 shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Only show the form if there are no results and not in comparison view */}
          {responseResults.length === 0 && !showComparisonView && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                generateResponse(input)
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
                      Generate Response
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Ticket Response Generator"
        toolCategory="Support"
      />
    </div>
  )
}

const ResponseResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

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

  const getToneLabel = (toneValue) => {
    const toneOptions = {
      'professional': 'Professional',
      'friendly': 'Friendly',
      'empathetic': 'Empathetic',
      'technical': 'Technical',
      'concise': 'Concise'
    }
    return toneOptions[toneValue] || toneValue
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="mb-2 flex items-center justify-between sticky top-0 bg-white z-10 py-2">
        <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
          {getToneLabel(result.tone)} Tone
        </span>
        <button
          onClick={copyToClipboard}
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            copySuccess ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Copy to clipboard"
        >
          <ClipboardDocumentIcon className={`h-4 w-4 mr-1 ${
            copySuccess ? 'text-green-500' : 'text-gray-500'
          }`} />
          {copySuccess ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="prose prose-h2:mt-0 h-[350px] max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200 overflow-y-auto">
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
    name: 'Quick Response Generation',
    description: 'Rapidly generate professional, contextually appropriate responses to support tickets, saving time and ensuring consistency.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Helpdesk Efficiency',
    description:
      'Streamline your helpdesk workflow by automatically generating high-quality responses to customer inquiries, reducing response times and improving customer satisfaction.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Customer Service Consistency',
    description:
      'Maintain consistent tone, style, and quality across all customer interactions. Our AI ensures your responses align with your brand voice and support standards.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Multi-Channel Support',
    description:
      'Generate appropriate responses for tickets from any channel - email, chat, social media, or helpdesk platforms. Adapt the tone and format as needed.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Knowledge Base Integration',
    description:
      'Create responses that incorporate information from your knowledge base, ensuring accurate and helpful answers to customer questions.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Team Training Support',
    description:
      'Help new support agents learn best practices by providing AI-generated responses as examples and templates for common customer inquiries.',
    icon: PencilIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Support Ticket Response Generator?',
    answer: 'An AI Support Ticket Response Generator is a specialized tool that uses artificial intelligence to analyze support tickets and generate appropriate, contextually relevant responses. It helps support teams respond to customer inquiries quickly and consistently while maintaining a professional tone.',
  },
  {
    question: 'How does the Support Ticket Response Generator work with helpdesk platforms?',
    answer:
      'Our Support Ticket Response Generator works with any text-based support content. Simply copy and paste your ticket content from platforms like Zendesk, Freshdesk, or any other helpdesk system, and our AI will generate a professional response that you can use or customize.',
  },
  {
    question: 'Can I customize the tone of the generated responses?',
    answer:
      'Yes, our Support Ticket Response Generator allows you to select from multiple tone options including Professional, Friendly, Empathetic, Technical, and Concise. This ensures the generated responses match your brand voice and the specific needs of each customer interaction.',
  },
  {
    question: 'Can this tool handle complex support tickets?',
    answer:
      'Yes, our AI Support Ticket Response Generator excels at processing complex support inquiries. It understands the context of the ticket, identifies the customer\'s needs, and generates responses that address their specific concerns with appropriate detail and tone.',
  },
  {
    question: 'How can this improve my customer support workflow?',
    answer:
      'The Support Ticket Response Generator streamlines your support process by reducing response times, ensuring consistency across all customer interactions, and allowing your team to focus on more complex issues that require human expertise. It also helps maintain a high standard of customer service.',
  },
  {
    question: 'Is my support ticket data secure?',
    answer:
      'We take data security seriously. All support tickets processed by our response generator are encrypted in transit and not stored on our servers. Your ticket content and generated responses remain confidential and are automatically deleted after processing.',
  },
  {
    question: 'Can it handle technical support tickets?',
    answer:
      'Yes, our AI is trained to understand and respond to technical support tickets effectively. It can identify technical issues, provide appropriate troubleshooting guidance, and suggest solutions while maintaining technical accuracy in the response.',
  },
  {
    question: 'How accurate and helpful are the generated responses?',
    answer:
      'Our AI Support Ticket Response Generator uses advanced natural language processing to ensure high-quality, contextually appropriate responses. While the responses are designed to be helpful and accurate, we recommend reviewing them before sending to customers, especially for critical issues.',
  },
  {
    question: 'Can I integrate this with my helpdesk system?',
    answer:
      'While our free tool works through copy-paste functionality, DocsBot offers API access and direct integrations with popular helpdesk platforms through our premium plans. Custom train a bot to generate responses tailored to your specific products, services, and support policies.',
  },
]

export default function TicketResponseGeneratorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="AI Support Ticket Response Generator | Free Customer Service Tool"
        description="Improve customer service with our AI-powered ticket response generator. Quickly generate professional, contextually appropriate responses to customer support tickets."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/support-ticket-response-generator.png',
              alt: 'AI Support Ticket Response Generator',
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
                  Free AI Support Ticket Response Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Quickly generate professional, contextually appropriate responses to customer support tickets. Streamline your customer service workflow with AI-powered responses.
                </p>
                <TicketResponseGenerator />
                <StarRating
                  itemId="ticket-response-generator"
                  name="Support Ticket Response Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Create Support Replies from your Documentation"
          description="Our AI-powered customer support chatbot creates personalized replies from your documentation, content, and past support history. Try it now for free!"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Easy Response Generation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our Free AI Support Ticket Response Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Generate professional responses to support tickets in seconds with these simple steps.
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
                    Select Response Tone
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Choose the tone that best fits your brand and the customer's needs. Options include Professional, Friendly, Empathetic, Technical, and Concise.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Generate Response
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click the 'Generate Response' button and let our AI analyze the ticket content. We'll create a professional, contextually appropriate response in your selected tone.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      4
                    </span>
                    Use Your Response
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the generated response, make any necessary adjustments, and copy it to send to your customer. Save time while maintaining high-quality support.
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
                Use Cases for Our Free AI Support Ticket Response Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Support Ticket Response Generator can improve your support workflow and boost productivity across various domains.
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
  const starRatingData = await getRating('ticket-response-generator')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
