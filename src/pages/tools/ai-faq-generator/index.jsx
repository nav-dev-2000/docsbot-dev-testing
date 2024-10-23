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
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import { ChatBubbleLeftRightIcon, GlobeAltIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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

export default function FAQGenerator({ FAQs, starRatingData }) {
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
                  itemId="ai-faq-generator"
                  name="AI Website FAQ Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />
        
        {/* New SEO-optimized content section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Simple 3-Step Process
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Generate FAQs From Any URL
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create comprehensive frequently asked questions or quizes for any webpage effortlessly with our AI-powered generator. No sign-up required!
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Enter Any URL
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Simply paste any webpage URL - be it a homepage, product page, or course description. Our tool works with any type of web content.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    AI-Powered Analysis
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Our AI agent crawls the page content and visual layout, and generates a comprehensive set of FAQs tailored to your content.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Review and Use
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Instantly view your generated FAQs. Copy and paste them directly into your website, knowledge base, or any other application.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Versatile Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Unlock the Power of AI-Generated FAQs
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Explore the many ways our AI FAQ Generator can enhance your website and improve user engagement.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Enhance Customer Support
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Create a comprehensive FAQ section from your documentation to address common customer queries, reducing support tickets and improving customer satisfaction. Perfect for <Link href="/" className="hover:underline text-cyan-600">training a custom AI support chatbot</Link>.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                      <GlobeAltIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Improve Website Navigation
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Use AI-generated questions to create intuitive navigation menus and improve overall user experience on your website.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                      <PencilSquareIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    Content Ideation
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Use generated questions as inspiration for new blog posts, articles, and other content to address your audience's needs.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    SEO Optimization
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Boost your search engine rankings with FAQ-rich content that targets long-tail keywords and provides valuable information to users.
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

// Change this function from getServerSideProps to getStaticProps
export const getStaticProps = async () => {
  const FAQs = await getRecentFAQs();
  const starRatingData = await getRating('ai-faq-generator')

  return {
    props: {
      FAQs,
      starRatingData,
    },
    // This enables ISR with a revalidation period of 1 hour (3600 seconds)
    revalidate: 3600,
  }
}
