import { useState, useEffect } from 'react'
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
import CarbonAd from '@/components/CarbonAd'
import { isSuperAdmin } from '@/utils/helpers'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import PromptDisclaimer from '@/components/PromptDisclaimer'

const PromptDisplay = ({ prompt, category, slug, isSuperAdminUser }) => {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deletePrompt = async () => {
    if (confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      setIsDeleting(true)
      try {
        const response = await fetch(`/api/tools/prompt-generator?slug=${slug}&category=${category}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          alert('Prompt deleted successfully')
          router.push('/prompts')
        } else {
          const data = await response.json()
          alert(`Failed to delete prompt: ${data.message || 'Unknown error'}`)
          setIsDeleting(false)
        }
      } catch (error) {
        alert(`Error: ${error.message}`)
        setIsDeleting(false)
      }
    }
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
        <div className="flex gap-2">
          {isSuperAdminUser && (
            <button
              onClick={deletePrompt}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Prompt'}
            </button>
          )}
          <Link
            href="/tools/prompt/ai-prompt-generator"
            className="block rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Generate your own AI prompt
          </Link>
        </div>
      </div>
    </div>
  )
}

const PromptPage = ({ promptData, relatedPrompts }) => {
  const [user, loading] = useAuthState(auth)
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)
  
  useEffect(() => {
    if (user && !loading) {
      // Check if the user is a super admin
      setIsSuperAdminUser(isSuperAdmin(user.uid))
    }
  }, [user, loading])

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
          <img
            src="https://images.unsplash.com/photo-1675557009285-b55f562641b9?ixid=M3w1OTc2MjN8MHwxfGFsbHx8fHx8fHx8fDE3Mjk2NTA3NzJ8&ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2830&h=820&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-4">
            <Breadcrumb pages={breadcrumbPages} />
          </div>
          <div className="px-6 py-16 sm:px-6 sm:py-24 lg:px-8">
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
              <CarbonAd className="flex justify-center mt-4" /> 
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
        </div>
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <PromptDisplay
            {...promptData}
            slug={promptData.id}
            isSuperAdminUser={isSuperAdminUser}
          />
        </div>

        <PromptDisclaimer />

        <RegisterCTA
          customTitle="Use this prompt with a custom-trained chatbot!"
          description="Create your own custom GPT chatbot with your own data and knowledge. Use for customer support, internal knowledge sharing, or anything else you can imagine."
          button="Create Your Free Custom GPT"
        />

        <RelatedPromptsList
          prompts={relatedPrompts}
          category={promptData.category}
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

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps = async (context) => {
  const { slug, category } = context.params
  const REVALIDATE_SECONDS = 60*60*24*7 //1 week

  // Check if the category is valid
  if (!Object.keys(PROMPT_CATEGORIES).includes(category)) {
    console.error('Invalid category:', category)
    return {
      notFound: true, // This will return a 404 Not Found status
      revalidate: REVALIDATE_SECONDS
    }
  }

  // Fetch the prompt data using the slug
  let promptData
  try {
    promptData = await getPrompt(slug)
  } catch (error) {
    console.error('Error fetching prompt:', slug, error)
    return {
      notFound: true, // This will return a 404 Not Found status
      revalidate: REVALIDATE_SECONDS,
    }
  }

  if (!promptData) {
    console.error('Prompt not found:', slug)
    return {
      notFound: true, // This will return a 404 Not Found status
      revalidate: REVALIDATE_SECONDS,
    }
  }

  // Fetch related prompts in the same category
  const relatedPrompts = await getPrompts('prompt', category, null, 8)

  return {
    props: {
      promptData,
      relatedPrompts,
    },
    revalidate: REVALIDATE_SECONDS, // One week in seconds
  }
}
