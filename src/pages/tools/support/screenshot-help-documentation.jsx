import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import {
  DocumentDuplicateIcon,
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  TagIcon,
  ArrowUpOnSquareStackIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import { Disclosure, Menu } from '@headlessui/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ImageDropZone from '@/components/ImageDropZone'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const ScreenshotHelpGenerator = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [helpDocumentation, setHelpDocumentation] = useState('')
  const [copiedFormat, setCopiedFormat] = useState(null) // 'markdown', 'html', 'plain', or null
  const [instructions, setInstructions] = useState('')
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  useEffect(() => {
    setHasResults(!!helpDocumentation)
  }, [helpDocumentation, setHasResults])

  const generateHelpDocumentation = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload a screenshot.')
      setIsComputing(false)
      return
    }

    const endpoint = `/api/tools/image-prompter`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'help',
        image: image.split(',')[1], // Remove the data URL prefix
        instructions: instructions || 'No specific instructions provided.',
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setHelpDocumentation(data)

        // Track successful help documentation generation
        posthog?.capture('Free Tool', {
          tool: 'Screenshot Help Documentation Generator',
          action: 'Used',
          category: 'Customer Support',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow.',
        )
        setShowSignupModal(true)
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Screenshot Help Documentation Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Customer Support',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Screenshot Help Documentation Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Customer Support',
      })
    }

    setIsComputing(false)
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  const copyContent = (format) => {
    let contentToCopy = ''
    let actionName = ''

    switch (format) {
      case 'markdown':
        contentToCopy = helpDocumentation
        actionName = 'Copy Markdown'
        break
      case 'html':
        // For HTML, we'll need to render the markdown to HTML first
        // Since we're using Streamdown, we can use a temporary approach
        // Note: This is a simplified version - for full HTML conversion,
        // you might want to use unified separately or keep a separate HTML state
        contentToCopy = helpDocumentation
        actionName = 'Copy HTML'
        break
      case 'plain':
        // Convert markdown to plain text by stripping markdown syntax
        contentToCopy = helpDocumentation
          .replace(/^#{1,6}\s+/gm, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/^\s*[-*+]\s+/gm, '• ') // Convert lists to bullets
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        actionName = 'Copy Plain Text'
        break
    }

    navigator.clipboard.writeText(contentToCopy)
    setCopiedFormat(format)
    setTimeout(() => setCopiedFormat(null), 1500)

    // Track copy action
    posthog?.capture('Free Tool', {
      tool: 'Screenshot Help Documentation Generator',
      action: actionName,
      category: 'Customer Support',
    })
  }

  const resetTool = () => {
    setImage(null)
    setHelpDocumentation('')
    setErrorText(null)
    setCopiedFormat(null)
    setInstructions('')
    // Scroll to the image upload input
    window.scrollTo({ top: 200, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          {!helpDocumentation && (
            <div className="mb-4">
              <ImageDropZone
                image={image}
                setImage={setImage}
                isComputing={isComputing}
                maxSize={512}
              />
            </div>
          )}
          {!helpDocumentation && (
            <>
              <div className="mb-4">
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Instructions/Context (Optional)
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Provide any specific context, focus areas, or instructions about what you want documented (e.g., 'Focus on the login process', 'This is an error screen', 'Document the checkout workflow')"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  disabled={isComputing}
                />
              </div>
              <button
                onClick={generateHelpDocumentation}
                disabled={isComputing || !image}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> Generating AI Help Documentation...
                  </>
                ) : (
                  <>Generate AI Help Documentation</>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Images are never saved
              </p>
            </>
          )}
          {helpDocumentation && (
            <>
              <div className="mb-4">
                <img
                  src={image}
                  alt="Preview"
                  className="mx-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-justify">
                <h3 className="text-md mb-2 font-medium">Help Documentation</h3>
                <div className="prose mb-4 min-w-full text-gray-700">
                  <Streamdown
                    mode="static"
                    isAnimating={false}
                    remarkPlugins={streamdownRemarkPlugins}
                  >
                    {preprocessMath(helpDocumentation)}
                  </Streamdown>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Menu as="div" className="relative inline-block text-left">
                    <div>
                      <Menu.Button className={clsx(
                        'inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                        copiedFormat ? 'text-cyan-600' : 'text-gray-700',
                      )}>
                        <DocumentDuplicateIcon
                          className="mr-2 h-5 w-5"
                          aria-hidden="true"
                        />
                        {copiedFormat ? 'Copied!' : 'Copy Documentation'}
                        <ChevronDownIcon
                          className="ml-2 h-5 w-5"
                          aria-hidden="true"
                        />
                      </Menu.Button>
                    </div>

                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => copyContent('markdown')}
                              className={clsx(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'group flex w-full items-center px-4 py-2 text-sm'
                              )}
                            >
                              <DocumentDuplicateIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                              />
                              Copy as Markdown
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => copyContent('html')}
                              className={clsx(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'group flex w-full items-center px-4 py-2 text-sm'
                              )}
                            >
                              <DocumentDuplicateIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                              />
                              Copy as HTML
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => copyContent('plain')}
                              className={clsx(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'group flex w-full items-center px-4 py-2 text-sm'
                              )}
                            >
                              <DocumentDuplicateIcon
                                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                aria-hidden="true"
                              />
                              Copy as Plain Text
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Menu>
                  <button
                    onClick={resetTool}
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                  >
                    <ArrowPathIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Try Another Screenshot
                  </button>
                </div>
              </div>
            </>
          )}
          <CarbonAd className="flex justify-center mt-4" /> 
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Screenshot Help Documentation Generator"
        toolCategory="Customer Support"
      />
    </div>
  )
}

const useCases = [
  {
    name: 'Create User Manuals',
    description:
      'Transform software screenshots into comprehensive user manuals and step-by-step guides for training and onboarding purposes.',
    icon: EyeIcon,
  },
  {
    name: 'Support Documentation',
    description:
      'Generate detailed help articles and troubleshooting guides by analyzing interface screenshots and error messages.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Training Materials',
    description:
      'Create training documentation and tutorials by converting interface screenshots into structured learning materials.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Software Documentation',
    description:
      'Document software features and workflows by generating comprehensive help content from application screenshots.',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Process Documentation',
    description:
      'Create process documentation and standard operating procedures by analyzing workflow screenshots and UI elements.',
    icon: TagIcon,
  },
  {
    name: 'Knowledge Base Articles',
    description:
      'Build knowledge base content by converting screenshots into detailed explanations and user guidance.',
    icon: ArrowUpOnSquareStackIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI help documentation generator?',
    answer:
      'An AI help documentation generator is an AI-powered documentation tool that creates help docs from screenshots automatically. This AI screenshot to documentation tool analyzes images of software interfaces and generates user guides from screenshots, creating comprehensive automated help documentation with step-by-step instructions and user guidance.',
  },
  {
    question: 'How accurate is the generated help documentation?',
    answer:
      'The accuracy is quite high for standard software interfaces and common UI patterns. The AI can identify buttons, menus, forms, and other interface elements to create relevant documentation. However, we recommend reviewing and customizing the output for your specific use case.',
  },
  {
    question: 'Can I use this tool for commercial purposes?',
    answer:
      'Yes, you can use the generated help documentation for commercial purposes, including user manuals, training materials, and customer support content. We recommend editing and customizing the output to match your brand and specific requirements.',
  },
  {
    question: 'What types of screenshots work best?',
    answer:
      'Clear, high-resolution screenshots of software interfaces, web applications, mobile apps, or any user interface work best. Ensure all text and UI elements are clearly visible for optimal results.',
  },
  {
    question: 'How can I improve the quality of my AI-generated help documentation?',
    answer:
      'To get the best results from our AI documentation tool, use clear, high-resolution screenshots with all relevant UI elements visible. Screenshots showing complete workflows work best for creating help docs from screenshots. Our automated help documentation system performs optimally with unobstructed interface images, and you can refine the AI-generated content manually.',
  },
  {
    question: 'Are there any usage limits for this tool?',
    answer:
      'You can generate a limited number of help documents per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit.',
  },
]

export default function ScreenshotHelpDocumentationPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="AI Help Documentation Generator | Create Help Docs from Screenshot | Free Tool"
        description="AI-powered documentation generator that transforms screenshots into comprehensive help docs. Generate user guides from screenshots with our automated help documentation tool. Create professional documentation instantly."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/screenshot-help-documentation.png',
              alt: 'AI Help Documentation Generator - Create Help Docs from Screenshots',
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
                  AI Help Documentation Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Create help docs from screenshots with our AI documentation tool.
                  Generate user guides from screenshots using automated help documentation powered by AI.
                  Perfect for creating user manuals, training materials, support guides,
                  and process documentation. Transform any screenshot into comprehensive documentation instantly!
                </p>
                <ScreenshotHelpGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="screenshot-help-documentation-generator"
                  name="Screenshot Help Documentation Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Effortless Documentation Creation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Documentation Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to create help docs from screenshots and generate user guides 
                with our AI-powered documentation generator in seconds.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Upload Your Screenshot
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select and upload the screenshot of the interface you want to document. Add optional 
                      instructions for specific focus areas or context. Our tool supports various image formats.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Generate Documentation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click the 'Generate Help Documentation' button and let our AI documentation tool
                      analyze your screenshot to create comprehensive help content with automated help documentation.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Review, Copy, Customize
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the generated help documentation and copy it with a
                      click for your training materials, user manuals, or support content.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Versatile Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our Screenshot Help Documentation Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Screenshot Help Documentation Generator can
                streamline your documentation process and improve user support across
                various applications.
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

        <RegisterCTA
          customTitle="Create AI Support Chatbots from Your Help Documentation"
          description="Transform your help docs and documentation into intelligent AI chatbots that provide instant customer support. Train your bot with screenshots, manuals, and guides to automate help desk responses and improve customer experience."
          button="Get Started for Free"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Customer Support" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('screenshot-help-documentation-generator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}
