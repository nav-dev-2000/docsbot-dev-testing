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
import { StarRating, RatingSchema } from '@/components/StarRating'

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
  const router = useRouter()
  const posthog = usePostHog()

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
          posthog?.capture('Free Tool', {
            tool: 'AI Prompt Generator',
            action: 'Error',
            error: 'Usage Limit Exceeded',
            category: 'Prompt',
          })
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
    }

    setIsComputing(false)
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
                placeholder="Enter your task, goal, or simple prompt"
                className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                rows={4}
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
                  <>Generate Prompt</>
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              NOTE: Generated prompts may be published publicly.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function PromptGeneratorPage() {
  return (
    <>
      <NextSeo
        title="Free AI Prompt Generator | No Login | For ChatGPT, Claude, Gemini"
        description="Create powerful custom prompts for ChatGPT, Anthropic Claude, Gemini, and more with our free AI tool. No sign-up needed. Generate amazing system prompts and instructions for chatbots instantly."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/prompt-generator.png',
              alt: 'AI Prompt Generator',
            },
          ],
        }}
      />
      <RatingSchema name="AI Prompt Generator - DocsBot" base={136} />
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
                  Free AI Prompt Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate powerful custom prompts and system instructions for
                  ChatGPT, Claude, Gemini, and more, powered by DocsBot AI.
                </p>
                <PromptGenerator />
                <StarRating
                  base={136}
                  className="mx-auto mt-12 flex justify-center text-white"
                />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />

        {/* Update the content sections to reflect the new tool */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Simple 3-Step Process
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Create Powerful AI Prompts Instantly
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Generate custom prompts and instructions for any AI model
                effortlessly with our AI-powered generator. No sign-up required!
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

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}
