import { useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import clsx from 'clsx'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { getPrompt, getPrompts } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'
import PromptIcon from '@/components/PromptIcon'
import RelatedPromptsList from '@/components/RelatedPromptsList'
import Breadcrumb from '@/components/Breadcrumb'

const PromptDisplay = ({ prompt, category }) => {
  const [copied, setCopied] = useState(false)

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 lg:p-8">
      <div className="relative rounded-md bg-gray-100 p-6">
        <pre className="whitespace-pre-wrap overflow-auto">{prompt}</pre>
        <button
          onClick={copyPrompt}
          className={clsx(
            'absolute bottom-2 right-2 rounded-md px-3 py-1 text-sm font-medium',
            copied
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          )}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="mt-6 flex items-end justify-between gap-x-6">
        <div className="text-md text-gray-500">
          Category:{' '}
          <Link href={`/prompts/${category}`} className="text-cyan-600 hover:text-cyan-500 font-semibold hover:underline">
            {PROMPT_CATEGORIES[category]}
          </Link>
        </div>
        <Link
          href="/tools/ai-prompt-generator"
          className="block rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Generate your own AI prompt
        </Link>
      </div>
    </div>
  )
}

const PromptPage = ({ promptData, relatedPrompts }) => {
  const breadcrumbPages = [
    { name: 'Prompts', href: '/prompts', current: false },
    { name: PROMPT_CATEGORIES[promptData.category], href: `/prompts/${promptData.category}`, current: false },
    { name: promptData.name, href: `/prompts/${promptData.category}/${promptData.id}`, current: true },
  ]

  return (
    <>
      <NextSeo
        title={`${promptData.name} - AI Prompt`}
        description={`${promptData.short_description} Free ${PROMPT_CATEGORIES[promptData.category]} prompt for ChatGPT, Gemini, and Claude.`}
        noindex={!promptData.should_index}
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Breadcrumb pages={breadcrumbPages} />
          </div>
          <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-xl bg-cyan-600 p-4">
                  <PromptIcon icon={promptData.icon} className="h-12 w-12 text-white" />
                </div>
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
                {PROMPT_CATEGORIES[promptData.category]} AI Prompt
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                {promptData.name}
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-xl leading-8 text-gray-300">
                {promptData.short_description} Perfectly crafted free system
                prompt or custom instructions for ChatGPT, Gemini, and Claude chatbots and
                models.
              </p>
              {promptData.tags && promptData.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {promptData.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/prompts/tags?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center rounded-md bg-cyan-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
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
          <PromptDisplay {...promptData} />
        </div>

        <RelatedPromptsList 
          prompts={relatedPrompts} 
          category={promptData.category}
        />

        <RegisterCTA
          customTitle="Use this prompt with a custom-trained chatbot!"
          description="Create your own custom GPT chatbot with your own data and knowledge. Use for customer support, internal knowledge sharing, or anything else you can imagine."
          button="Create Your Free Custom GPT"
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
  const { slug, category } = context.params

  // Check if the category is valid
  if (!Object.keys(PROMPT_CATEGORIES).includes(category)) {
    console.error('Invalid category:', category)
    return {
      redirect: {
        destination: '/prompts',
        permanent: false,
      },
    }
  }

  // Fetch the prompt data using the slug
  const promptData = await getPrompt(slug)

  if (!promptData) {
    console.error('Prompt not found:', slug)
    return {
      redirect: {
        destination: '/prompts',
        permanent: false,
      },
    }
  }

  // Fetch related prompts in the same category
  const relatedPrompts = await getPrompts('prompt', category, null, 8)

  return {
    props: {
      promptData,
      relatedPrompts,
    },
  }
}
