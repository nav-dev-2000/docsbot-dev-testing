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
  UserIcon,
  BoltIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Analyzing your email...',
  'Crafting professional responses...',
  'Applying selected tone...',
  'Generating response options...',
  'Finalizing email suggestions...',
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
  {
    name: 'Professional',
    emoji: '💼',
    description: 'Formal and business-appropriate tone',
  },
  {
    name: 'Friendly',
    emoji: '😊',
    description: 'Warm and approachable communication',
  },
  {
    name: 'Apologetic',
    emoji: '🙏',
    description: 'Sincere and understanding for service issues',
  },
  {
    name: 'Persuasive',
    emoji: '🎯',
    description: 'Compelling and convincing language',
  },
]

const AIEmailResponseComponent = () => {
  const [emailContext, setEmailContext] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [generatedResponses, setGeneratedResponses] = useState([])
  const [selectedTone, setSelectedTone] = useState(tones[0])
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  const generateEmailResponses = async (emailInput, keyPointsInput, tone) => {
    setIsGenerating(true)
    setErrorText('')

    if (!emailInput.trim()) {
      setErrorText('Please enter the email conversation you want to respond to.')
      setIsGenerating(false)
      posthog?.capture('Free Tool', {
        tool: 'AI Email Response Generator',
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
          type: 'email-response',
          input: emailInput,
          keyPoints: keyPointsInput,
          tone: tone.name + ' - ' + tone.description,
          responseCount: 3,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText('Daily usage limit exceeded, please try again tomorrow.')
          setShowSignupModal(true)
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'AI Email Response Generator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        const responses = Array.isArray(data) ? data : [data]
        setGeneratedResponses((prevResults) => [
          {
            responses: responses,
            tone: tone,
            timestamp: new Date().toISOString(),
          },
          ...prevResults,       
        ])
        posthog?.capture('Free Tool', {
          tool: 'AI Email Response Generator',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Email Response Generator',
        action: 'Error',
        error: e.message,
        category: 'Writing',
      })
    }

    setIsGenerating(false)
  }

  const resetFlow = () => {
    setEmailContext('')
    setKeyPoints('')
    setGeneratedResponses([])
    setErrorText('')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-4">
          <Alert title={errorText} type="error" />

          <label
            htmlFor="emailContext"
            className="block w-full text-left text-sm font-medium text-gray-700"
          >
            Email Conversation <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-xs text-gray-500 mb-2">
            Paste the entire email conversation thread, or just the single email you want to respond to.
          </p>
          <textarea
            id="emailContext"
            rows={8}
            value={emailContext}
            onChange={(e) => setEmailContext(e.target.value)}
            placeholder="Paste your email conversation here... For example:

From: john@example.com
Subject: Order Status Inquiry

Hi, I'm following up about my recent order #12345. I placed it last week but haven't received any shipping updates. Can you please provide an update on the status? Thanks, John

---

From: support@company.com
Subject: Re: Order Status Inquiry

Hi John, thanks for reaching out. Let me check on that for you..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
          />
          
          <label
            htmlFor="keyPoints"
            className="mt-4 block w-full text-left text-sm font-medium text-gray-700"
          >
            Key Points to Include (Optional)
          </label>
          <input
            id="keyPoints"
            type="text"
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="Order shipped yesterday, tracking number, expected delivery..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Response Tone
            </label>
            <select
              value={selectedTone.name}
              onChange={(e) =>
                setSelectedTone(tones.find((t) => t.name === e.target.value))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            >
              {tones.map((tone) => (
                <option key={tone.name} value={tone.name}>
                  {tone.emoji} {tone.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {selectedTone.description}
            </p>
          </div>

          {!isGenerating && generatedResponses.length === 0 && (
            <button
              type="submit"
              onClick={() => generateEmailResponses(emailContext, keyPoints, selectedTone)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              ✉️ Generate Email Responses
            </button>
          )}

          {isGenerating && (
            <div className="mt-6 flex items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <LoadingSpinner />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">Generating Responses...</h3>
                <p className="text-sm text-blue-700">Creating personalized email responses based on conversation context</p>
              </div>
            </div>
          )}

          <CarbonAd className="flex justify-center mt-4" /> 
          
          {generatedResponses.map((result, index) => (
            <GeneratedEmailResult key={index} result={result} />
          ))}

          {generatedResponses.length > 0 && (
            <button
              type="button"
              onClick={resetFlow}
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
        toolName="AI Email Response Generator"
        toolCategory="Writing"
      />
    </div>
  )
}

const GeneratedEmailResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState({})

  const copyToClipboard = (responseText, index) => {
    navigator.clipboard.writeText(responseText).then(() => {
      setCopySuccess({ ...copySuccess, [index]: true })
      setTimeout(() => setCopySuccess({ ...copySuccess, [index]: false }), 2000)
    })
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  return (
    <div className="relative mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {result.tone.emoji} {result.tone.name} Response Options
        </h3>
        <div className="grid gap-4">
          {result.responses.map((response, index) => {
            const wordCount = response.trim().split(/\s+/).length
            
            return (
              <div key={index} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Option {index + 1} • {wordCount} words
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(response, index)}
                      type="button"
                      className="rounded-md bg-white p-1 transition-colors hover:bg-gray-100 border border-gray-300"
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    {copySuccess[index] && (
                      <span className="absolute right-10 top-0 text-sm text-cyan-600 bg-white px-2 py-1 rounded shadow">
                        Copied!
                      </span>
                    )}
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-left">
                  <Streamdown
                    mode="static"
                    isAnimating={false}
                    remarkPlugins={streamdownRemarkPlugins}
                  >
                    {preprocessMath(response)}
                  </Streamdown>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Customer Service Responses',
    description:
      'Generate professional replies to customer inquiries, complaints, and support requests with the appropriate tone and resolution.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Business Correspondence',
    description:
      'Create polished responses to business emails, partnership inquiries, and professional communications.',
    icon: ClipboardDocumentIcon,
  },
  {
    name: 'Sales Follow-ups',
    description:
      'Craft persuasive follow-up emails to prospects, leads, and potential customers to drive conversions.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Appointment Scheduling',
    description:
      'Generate professional responses for meeting requests, scheduling conflicts, and calendar coordination.',
    icon: UserIcon,
  },
  {
    name: 'Project Updates',
    description:
      'Create clear and informative email responses about project status, deliverables, and team communication.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Apology & Resolution',
    description:
      'Generate sincere apology emails for service issues, delays, or mistakes with appropriate resolution steps.',
    icon: CheckIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Email Response Generator?',
    answer:
      'An AI Email Response Generator is a powerful tool that uses artificial intelligence to create professional email responses based on the context of incoming emails. Simply paste the email you need to reply to, select your desired tone, and get 3 different response options instantly.',
  },
  {
    question: 'How does the AI Email Response Generator work?',
    answer:
      'Our AI analyzes the context of the incoming email you provide, understands the key points and intent, then generates appropriate responses in your selected tone. You can choose from professional, friendly, apologetic, or persuasive tones to match your communication needs.',
  },
  {
    question: 'Is the AI Email Response Generator free to use?',
    answer:
      'Yes, our AI Email Response Generator is free to use with a daily limit. You can generate multiple email response sets in various tones without creating an account. For increased usage and additional features, consider signing up for a free account.',
  },
  {
    question: 'What tones are available for email responses?',
    answer:
      'We offer 4 different response tones: Professional (formal business communication), Friendly (warm and approachable), Apologetic (sincere and understanding for service issues), and Persuasive (compelling and convincing language).',
  },
  {
    question: 'How many response options do I get?',
    answer:
      'You get 3 different email response options for each generation. Each response maintains the same tone and addresses the same key points but provides variety in wording and approach.',
  },
  {
    question: 'Can I customize the generated responses?',
    answer:
      'Yes, you can specify key points you want included in the response through the optional "Key Points" field. You can also edit any generated response before using it to ensure it perfectly matches your needs.',
  },
  {
    question: 'Is the generated content appropriate for business use?',
    answer:
      'Yes, all generated email responses are professional and suitable for business use. However, we recommend reviewing and editing the content to ensure it aligns with your company\'s communication style and policies.',
  },
  {
    question: 'How can I get the best results?',
    answer:
      'For optimal results, provide clear context by pasting the complete incoming email, select the most appropriate tone for the situation, and specify any key points you want to include. Review and customize the generated responses as needed.',
  },
  {
    question: 'What makes this email response generator different?',
    answer: 'Our AI email response generator provides 3 response options instantly without requiring signup, offers 4 distinct communication tones, and allows you to specify key points for personalized responses.',
  },
  {
    question: 'Can I use this for customer service emails?',
    answer: 'Absolutely! Our email response generator is perfect for customer service, sales follow-ups, business correspondence, and any professional email communication. The apologetic tone is especially useful for service recovery situations.',
  },
]

export default function AIEmailResponseGeneratorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Email Response Generator | No Login | Professional Email Replies"
        description="Generate professional email responses instantly with our free AI email response generator. No signup needed. Get 3 response options in different tones for any email."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/email-response-generator.png',
              alt: 'Free AI Email Response Generator Tool',
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
                AI Email Response Generator
                <span className="block text-2xl mt-2 font-normal">Free Online Tool - No Login Required</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate professional email responses instantly with our free AI email response generator. 
                  Get 3 different response options in multiple tones for any email - 
                  no signup required.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "100% Free",
                      description: "Use our AI email response generator without any cost or signup"
                    },
                    {
                      title: "Instant Results", 
                      description: "Generate professional email responses in seconds"
                    },
                    {
                      title: "Multiple Options",
                      description: "Get 3 different response variations in your chosen tone"
                    }
                  ].map((benefit) => (
                    <div key={benefit.title} className="rounded-lg bg-white/10 p-4">
                      <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{benefit.description}</p>
                    </div>
                  ))}
                </div>
                <AIEmailResponseComponent />
                <StarRating
                  itemId="ai-email-response-generator"
                  name="AI Email Response Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Create Email Templates with Custom Trained Chatbots"
          description="Leverage your own custom trained chatbots to generate email responses based on your company's communication style and documentation. Use internally or deploy to your support team."
          button="Create your Free Chatbot"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Simple & Powerful
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Email Response Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create professional email responses in just a few clicks
                with our intuitive interface.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:max-w-none xl:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Email Conversation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Paste the entire email conversation thread or just the single email you want to respond to.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Select Tone
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Choose from Professional, Friendly, Apologetic, or Persuasive tones to match your communication style.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Generate &amp; Use
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click generate to get 3 response options based on your conversation context and copy your favorite.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Powerful Features
              </h2>
              <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Advanced AI Email Response Capabilities
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Our AI email response generator combines powerful features to help
                you create professional, contextual email responses quickly and easily.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Context-Aware Analysis',
                    description:
                      'Our AI analyzes the incoming email context to understand the intent, sentiment, and key information needed for an appropriate response.',
                    icon: LightBulbIcon,
                  },
                  {
                    name: 'Multiple Response Options',
                    description:
                      'Generate 3 different response variations to choose from, each maintaining the same tone but offering different approaches.',
                    icon: DocumentDuplicateIcon,
                  },
                  {
                    name: '4 Professional Tones',
                    description:
                      'Choose from Professional, Friendly, Apologetic, and Persuasive tones to match your communication needs perfectly.',
                    icon: ChatBubbleBottomCenterTextIcon,
                  },
                  {
                    name: 'Key Points Integration',
                    description:
                      'Specify important points to include in your response, ensuring all necessary information is covered.',
                    icon: CheckBadgeIcon,
                  },
                  {
                    name: 'Professional Quality',
                    description:
                      'Every generated response is business-appropriate, well-structured, and ready to send with minimal editing.',
                    icon: CheckBadgeIcon,
                  },
                  {
                    name: 'Instant Generation',
                    description:
                      'Get your email responses instantly with no sign-up required. Free users can generate multiple response sets daily.',
                    icon: BoltIcon,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold text-white">
                      <feature.icon
                        className="h-5 w-5 flex-none text-cyan-400"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
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
        
        {/* Use Cases Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Many Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our AI Email Response Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Email Response Generator can improve your
                communication efficiency and boost productivity across various scenarios.
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

        {/* New section: Tips for Better Email Responses */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div>
                <h2 className="text-base font-semibold leading-7 text-cyan-600">
                  Email Excellence
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  How to Perfect AI-Generated Email Responses
                </p>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Follow these tips to enhance and customize your AI-generated
                  email responses:
                </p>
              </div>
              <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
                {[
                  {
                    name: 'Provide complete context',
                    description:
                      'Include the full email thread for better context understanding.',
                  },
                  {
                    name: 'Choose appropriate tone',
                    description:
                      'Select the tone that matches your relationship with the sender.',
                  },
                  {
                    name: 'Review before sending',
                    description:
                      'Always review and personalize the generated response.',
                  },
                  {
                    name: 'Add specific details',
                    description:
                      'Include relevant names, dates, and specific information.',
                  },
                  {
                    name: 'Maintain your voice',
                    description:
                      'Edit the response to match your personal communication style.',
                  },
                  {
                    name: 'Check for accuracy',
                    description:
                      'Verify all facts and information in the generated response.',
                  },
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
  const starRatingData = await getRating('ai-email-response-generator')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
