import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getRecentFAQs } from '@/lib/tools'
import { sanitizeURL } from '@/utils/helpers'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating, RatingSchema } from '@/components/StarRating'

const loadingText = [
  'Loading website...',
  'Generating screenshot...',
  "Reading content...",
  'Generating FAQs...',
  'Consulting with DocsBot...',
  'Writing answers...',
]

// uses DDG's undocumented favicon api
export const Favicon = ({ url }) => {
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${url}.ico`}
      alt="favicon"
      className="max-h-full max-w-full"
    />
  )
}

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

const RecentAIFAQs = ({ FAQs }) => {
  return (
    <div className="mx-auto py-4 mt-16">
      <div className="mb-3 text-center text-3xl font-bold tracking-tight text-white">
        Recently Generated FAQs
      </div>
      <div className="mx-none text-left">
        <div className="prose mx-auto mt-6 w-full max-w-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FAQs.map((faq) => {
            const siteUrl = new URL(faq.url)
            return (
              <div className="w-full items-center justify-start" key={faq.url}>
                <Link
                  href={`/tools/ai-faq-generator/${siteUrl.hostname}`}
                  className="ml-auto hover:underline no-underline text-white text-xl flex items-center overflow-hidden"
                >
                  <div className="flex h-10 w-10 overflow-hidden items-center rounded-md justify-center mr-2">
                    <Favicon url={siteUrl.hostname} />
                  </div>
                  <div>{siteUrl.hostname}</div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const AiFAQGenerator = () => {
  const [site, setSite] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const posthog = usePostHog()

  const genFAQs = async (url) => {
    setIsComputing(true)
    setErrorText('')

    url = sanitizeURL(url)
    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)
      
      // Track invalid URL error
      posthog?.capture('Free Tool', {
        tool: 'AI FAQ Generator',
        action: 'Error',
        error: 'Invalid URL',
        category: 'Website'
      })
      return
    }

    setSite(url)
    const endpoint = `/api/tools/faq`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteURL: url,
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        // Track successful FAQ generation
        posthog?.capture('Free Tool', {
          tool: 'AI FAQ Generator',
          action: 'Used',
          category: 'Website'
        })
        
        // redirect to share page
        console.log(url, new URL(url).hostname)
        await router.push(`/tools/ai-faq-generator/${new URL(url).hostname}`)
      } else if (response.status === 429) {
        setErrorText('Daily usage limit exceeded, please try again tomorrow or create a free account.')
        
        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'AI FAQ Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'Website'
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')
        
        // Track error
        posthog?.capture('Free Tool', {
          tool: 'AI FAQ Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Website'
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)
      
      // Track error
      posthog?.capture('Free Tool', {
        tool: 'AI FAQ Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Website'
      })
    }

    setIsComputing(false)
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          <form>
            <div className="grid grid-cols-12 items-center gap-3">
              <input
                type="text"
                onChange={(e) => {
                  setSite(e.target.value)
                }}
                disabled={isComputing}
                placeholder="Website URL"
                className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm sm:col-span-8"
              />
              <button
                onClick={() => genFAQs(site)}
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-4"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />{' '}
                  </>
                ) : (
                  <>Generate FAQ</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function FAQGenerator({ FAQs }) {
  return (
    <>
      <NextSeo
        title="Free AI Website FAQ Generator | No Login | Instant Results"
        description="Create a comprehensive FAQ from any website URL instantly with our free AI tool. No sign-up needed. Generate frequently asked questions and answers for your site to boost SEO and user engagement."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/website-faq-generator.png',
              alt: 'AI-Powered site FAQ Generator',
            },
          ],
        }}
      />
      <RatingSchema name="AI Webiste FAQ Generator - DocsBot" base={1936} />
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
                  AI-Powered FAQ Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate a list of frequently asked questions about a website for free, powered by
                  DocsBot AI.
                </p>
                <AiFAQGenerator />
                <RecentAIFAQs FAQs={FAQs} />
                <StarRating
                  base={1936}
                  className="mx-auto mt-12 flex justify-center text-white"
                />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getServerSideProps = async (context) => {
  const FAQs = await getRecentFAQs();

  return {
    props: {
      FAQs,
    },
  }
}
