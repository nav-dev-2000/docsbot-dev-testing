import { useState } from 'react'
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
import Breadcrumb from '@/components/Breadcrumb'
import CarbonAd from '@/components/CarbonAd'

const PromptPage = ({ prompts, tag }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPrompts = prompts.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.short_description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const breadcrumbPages = [
    { name: 'Prompts', href: '/prompts', current: false },
    {
      name: tag,
      href: `/prompts/tags?tag=${encodeURIComponent(tag)}`,
      current: true,
    },
  ]

  return (
    <>
      <NextSeo
        title={`Best ${tag} AI Prompts - DocsBot AI`}
        description={`A library of free ${tag} prompts for ChatGPT, Gemini, and Claude.`}
        canonical={`https://docsbot.ai/prompts/tags?tag=${encodeURIComponent(tag)}`}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/prompt-library.png',
              alt: 'Ultimate AI Prompt Library',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1674027444484-cf52149ea050?ixid=M3w1OTc2MjN8MHwxfGFsbHx8fHx8fHx8fDE3Mjk2NDk3MDh8&ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2830&h=820&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ffdb] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 sm:-mt-20 mb-16">
            <Breadcrumb pages={breadcrumbPages} />
          </div>
          <div className="px-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Best {tag} AI Prompts
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-xl leading-8 text-gray-300">
                Discover our extensive collection of the best {tag} AI prompts,
                including top ChatGPT prompts, Anthropic prompts, and Gemini
                prompts.
              </p>
              <CarbonAd className="flex justify-center mt-4" />
              <div className="mt-8">
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
                    placeholder={`Search ${tag} prompts...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mx-auto mt-10 max-w-7xl px-6 text-center lg:px-8">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Other Categories
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {Object.entries(PROMPT_CATEGORIES).map(
                  ([key, value]) =>
                    key !== tag && (
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
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPrompts.map((prompt) => (
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
        </div>
        <div className="flex items-center justify-center gap-x-6 py-12 lg:py-16">
          <Link
            href="/tools/prompt/ai-prompt-generator"
            className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Generate a Custom Prompt
          </Link>
          <Link
            href="/prompts"
            className="text-sm font-semibold leading-6 text-cyan-600"
          >
            View all Prompts <span aria-hidden="true">→</span>
          </Link>
        </div>
        <RegisterCTA
          customTitle="Use these prompts with a custom-trained chatbot!"
          description="Create your own custom GPT chatbots with your own data and knowledge. Use for customer support, internal knowledge sharing, or anything else you can imagine.  Embed them in your website, app,Slack, Discord, or anywhere else you want."
          button="Create Your Free AI Bot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Prompt" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default PromptPage


export const getServerSideProps = async (context) => {
  const { tag } = context.query

  // Check if the tag is set
  if (!tag) {
    return {
      redirect: {
        destination: '/prompts',
        permanent: true,
      },
    }
  }
  // Fetch related prompts in the same category
  const prompts = await getPrompts('prompt', null, tag, 2000)

  // If no prompts are found, redirect to the main prompts page
  if (prompts.length === 0) {
    return {
      redirect: {
        destination: '/prompts',
        permanent: false,
      },
    }
  }
  
  return {
    props: {
      tag,
      prompts,
    },
  }
}
