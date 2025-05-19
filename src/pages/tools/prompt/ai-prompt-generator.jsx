import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import { ChatBubbleLeftRightIcon, PencilSquareIcon, MegaphoneIcon, AcademicCapIcon, UserGroupIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const loadingText = [
  'Analyzing your input...',
  'Crafting the perfect prompt...',
  'Optimizing for AI models...',
  'Enhancing prompt effectiveness...',
  'Finalizing custom instructions...',
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

const PromptGenerator = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const router = useRouter()
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const generatePrompt = async (userInput) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a task, goal, or simple prompt.')
      setIsComputing(false)

      posthog?.capture('Free Tool', {
        tool: 'AI Prompt Generator',
        action: 'Error',
        error: 'Empty Input',
        category: 'Prompt',
      })
      return
    }

    if (!consentChecked) {
      setErrorText('Please confirm that you understand generated prompts may be published publicly.')
      setIsComputing(false)
      
      posthog?.capture('Free Tool', {
        tool: 'AI Prompt Generator',
        action: 'Error',
        error: 'Consent Not Checked',
        category: 'Prompt',
      })
      return
    }

    const endpoint = `/api/tools/prompt-generator`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText(
            'Daily usage limit exceeded, please try again tomorrow or create a free account.',
          )
          setShowSignupModal(true)
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'AI Prompt Generator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Prompt',
          })
        }
        setIsComputing(false)
      } else {
        const data = await response.json()
        posthog?.capture('Free Tool', {
          tool: 'AI Prompt Generator',
          action: 'Used',
          category: 'Prompt',
        })

        router.push(`/prompts/${data.category}/${data.slug}`)
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Prompt Generator',
        action: 'Error',
        error: e.message,
        category: 'Prompt',
      })
      setIsComputing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              generatePrompt(input)
            }}
          >
            <div className="grid grid-cols-12 items-center gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isComputing}
                placeholder="Enter your task, goal, or a simple prompt to optimize"
                className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm disabled:opacity-75"
                rows={4}
              />
              <div className="col-span-12 flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={() => setConsentChecked(!consentChecked)}
                    className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div className="ml-2 text-sm text-left">
                  <label htmlFor="consent" className="font-medium text-gray-700">
                    I understand that generated prompts may be published publicly.
                  </label>
                </div>
              </div>
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
                  <>Generate Prompt</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Prompt Generator"
        toolCategory="Prompt"
      />
    </div>
  )
}

const useCases = [
  {
    name: 'Enhance Generative AI Output',
    description:
      'Generate optimized prompts to improve the quality and relevance of AI-generated content across various platforms like ChatGPT, Claude, and Gemini.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Boost Creative Writing',
    description:
      'Create inspiring prompts for writers, helping to overcome writer\'s block and generate new ideas for stories, articles, and blog posts.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Improve Content Marketing',
    description:
      'Generate engaging prompts for social media posts, email campaigns, and other marketing materials to increase audience engagement.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Enhance Educational Resources',
    description:
      'Create thought-provoking prompts for students and educators, fostering critical thinking and creativity in various subjects.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Streamline Customer Support',
    description:
      'Generate effective prompts for customer service chatbots, improving response quality and reducing human intervention.',
    icon: UserGroupIcon,
  },
  {
    name: 'Facilitate Brainstorming Sessions',
    description:
      'Create diverse prompts to stimulate innovative thinking and problem-solving in team brainstorming sessions.',
    icon: LightBulbIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Prompt Generator?',
    answer:
      'An AI Prompt Generator is a tool that uses artificial intelligence to create optimized prompts for various AI models like ChatGPT, Claude, and Gemini. It helps users formulate effective instructions or questions to get the best possible responses from AI systems.',
  },
  {
    question: 'How does the AI Prompt Generator work?',
    answer:
      'Our AI Prompt Generator analyzes your input and uses advanced language models to create an optimized, detailed prompt. It considers factors like clarity, specificity, and context to generate prompts that are more likely to produce high-quality AI responses.',
  },
  {
    question: 'Can I use this tool for free?',
    answer:
      'Yes, our AI Prompt Generator is free to use. You can generate a limited number of prompts per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit.',
  },
  {
    question: 'What types of prompts can I generate?',
    answer:
      'You can generate prompts for a wide range of purposes, including creative writing, content creation, problem-solving, coding tasks, and more. The tool is versatile and can be used for any scenario where you need to interact with AI language models.',
  },
  {
    question: 'How can I improve the quality of generated prompts?',
    answer:
      'To get better results, provide clear and specific information about your desired outcome. You can also use the generated prompt as a starting point and refine it manually to add specific details or context relevant to your needs.',
  },
  {
    question: 'Are the generated prompts compatible with all AI models?',
    answer:
      'While our prompts are optimized for popular AI tools like ChatGPT, Claude, and Gemini, they can be used with most AI large language models. However, you may need to make minor adjustments based on the specific requirements of the LLM you\'re using.',
  },
]

export default function PromptGeneratorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Prompt Generator & Optimizer | No Login | ChatGPT, Claude, Gemini"
        description="Create powerful, optimized prompts for ChatGPT, Anthropic Claude, Gemini, and more with our free AI Prompt Generator. No sign-up needed. Generate amazing system prompts and instructions for chatbots instantly."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/prompt-generator.png',
              alt: 'AI Prompt Generator and Optimizer',
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
                  Free AI Prompt Generator & Optimizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate powerful, optimized prompts for ChatGPT, Claude, Gemini, and more. 
                  Enhance your AI outputs, productivity, and get better results from AI tools. 
                  No sign-up required!
                </p>
                <PromptGenerator />
                <StarRating
                  itemId="ai-prompt-generator"
                  name="AI Prompt Generator and Optimizer - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
              <div className="mx-auto mt-10 max-w-7xl px-6 text-center lg:px-8">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Free Prompts by Category
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {Object.entries(PROMPT_CATEGORIES).map(
                  ([key, value]) => (
                      <Link
                        key={key}
                        href={`/prompts/${key}`}
                        className="inline-flex items-center rounded-md bg-cyan-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                      >
                        {value}
                      </Link>
                    ),
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Use your prompt with a custom-trained chatbot!"
          description="Create your own custom GPT chatbots with your own data and knowledge. Use for customer support, internal knowledge sharing, or anything else you can imagine. Embed them in your website, app, Slack, Discord, or anywhere else you want."
          button="Create Your Free AI Chatbot"
        />
        
        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Easy Prompt Creation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Prompt Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to create optimized prompts for AI models in seconds.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Enter Your Idea
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Simply enter your task, goal, or a simple prompt. Our tool
                      works with any type of input to create tailored AI
                      instructions.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    AI-Powered Enhancement
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Our AI analyzes your input and generates a comprehensive,
                      optimized prompt tailored for various AI models.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Use and Refine
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Instantly view your generated prompt. Copy and paste it
                      directly into ChatGPT, Claude, Gemini, or any other AI
                      model.
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
                Use Cases for Our AI Prompt Generator & Optimizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Prompt Generator can improve your results with Chat GPT and boost productivity across various domains.
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
          <FreeToolsGrid category="Prompt" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-prompt-generator')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}