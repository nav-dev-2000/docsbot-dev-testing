import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import clsx from 'clsx'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { getPrompts } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import PromptIcon from '@/components/PromptIcon'
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/20/solid'
import LoadingSpinner from '@/components/LoadingSpinner'

const PromptPage = ({ initialPrompts }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [prompts, setPrompts] = useState(initialPrompts)
  const [isSearching, setIsSearching] = useState(false)
  const [isSearch, setIsSearch] = useState(false)
  useEffect(() => {
    const searchPrompts = async () => {
      if (searchTerm.length >= 3) {
        setIsSearching(true)
        try {
          const response = await fetch(
            `/api/tools/prompt-search?query=${encodeURIComponent(searchTerm)}`,
          )
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          const data = await response.json()
          setPrompts(data)
          setIsSearch(true)
        } catch (error) {
          console.error('Error searching prompts:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setPrompts(initialPrompts)
        setIsSearch(false)
      }
    }

    const debounceTimer = setTimeout(searchPrompts, 1000)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, initialPrompts])

  // Get categories with prompts
  const categoriesWithPrompts = [
    ...new Set(prompts.map((prompt) => prompt.category)),
  ]

  return (
    <>
      <NextSeo
        title="Ultimate AI Prompt Library: ChatGPT, Gemini, Claude - DocsBot AI"
        description="Explore our free, curated collection of best AI prompts for ChatGPT, Gemini, and Claude. Enhance your AI productivity with our free prompt library. Unlock the full potential of AI chatbots and boost your creativity."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/prompts.png',
              alt: 'Ultimate AI Prompt Library',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900">
          <div className="px-6 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="text-center">
              <h1 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Ultimate AI Prompt Library: Best ChatGPT Prompts & More
              </h1>
              <p className="mx-auto mt-6 max-w-5xl text-xl leading-8 text-gray-300">
                Discover our extensive collection of the best AI prompts,
                including top ChatGPT prompts, Anthropic prompts, and Gemini
                prompts. Explore our free prompt library to enhance your AI
                productivity. Unlock the full potential of AI chatbots with our
                curated selection of prompts for ChatGPT and other leading
                models.
              </p>

              <div className="mx-auto mt-8 max-w-xl">
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                    placeholder={`Search all prompts...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setPrompts(initialPrompts)
                        setIsSearch(false)
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {isSearching ? (
                        <LoadingSpinner className="h-5 w-5 text-gray-400" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-x-6 pt-12 lg:pt-16">
                <Link
                  href="/tools/ai-prompt-generator"
                  className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                >
                  Generate a Custom Prompt
                </Link>
              </div>
            </div>
            
          </div>
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
          >
            <circle
              r={512}
              cx={512}
              cy={512}
              fill="url(#cyan-gradient)"
              fillOpacity="0.7"
            />
            <defs>
              <radialGradient id="cyan-gradient">
                <stop stopColor="#0891B2" />
                <stop offset={1} stopColor="#065E6F" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mb-10 text-center px-6 lg:px-8 max-w-5xl mx-auto">
              <div className="flex flex-wrap justify-center gap-4">
                {Object.entries(PROMPT_CATEGORIES).map(([key, value]) => (
                  <Link
                    key={key}
                    href={`#${key}`}
                    className="text-sm text-white hover:text-cyan-500 focus:underline focus:outline-none font-semibold hover:underline"
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          {categoriesWithPrompts.map((category) => {
            const categoryPrompts = prompts.filter(
              (prompt) => prompt.category === category,
            )
            if (categoryPrompts.length === 0) return null

            return (
              <div key={category} id={category} className="mb-12">
                <h2 className="mb-4 text-2xl font-bold">
                  {PROMPT_CATEGORIES[category]}
                </h2>
                <ul className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {categoryPrompts.map((prompt) => (
                    <li
                      key={prompt.id}
                      className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow"
                    >
                      <Link
                        href={`/prompts/${prompt.category}/${prompt.id}`}
                        className="flex h-full w-full items-center justify-between space-x-4 p-4 hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0">
                          <div className="rounded-lg bg-cyan-600 p-3">
                            <PromptIcon
                              icon={prompt.icon}
                              className="h-6 w-6 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-md truncate font-medium text-gray-900">
                              {prompt.name}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {prompt.short_description}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {!isSearch && (
                  <div className="text-center">
                    <Link
                      href={`/prompts/${category}`}
                      className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                    >
                      View all {PROMPT_CATEGORIES[category]} prompts &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mb-10 text-center">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Browse by Category
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(PROMPT_CATEGORIES).map(([key, value]) => (
              <Link
                key={key}
                href={`/prompts/${key}`}
                className="inline-flex items-center rounded-md bg-cyan-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                {value}
              </Link>
            ))}
          </div>
        </div>

        <RegisterCTA
          customTitle="Use these prompts with a custom-trained chatbot!"
          description="Create your own custom GPT chatbots with your own data and knowledge. Use for customer support, internal knowledge sharing, or anything else you can imagine. Embed them in your website, app,Slack, Discord, or anywhere else you want."
          button="Create Your Free AI Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default PromptPage

export const getServerSideProps = async (context) => {
  // Fetch related prompts in the same category
  const prompts = await getPrompts('prompt', null, null, 10000)

  // Create an array of limited prompts for each category
  const limitedPrompts = Object.keys(PROMPT_CATEGORIES).flatMap((category) => {
    return prompts.filter((prompt) => prompt.category === category).slice(0, 18)
  })

  return {
    props: {
      initialPrompts: limitedPrompts,
    },
  }
}
