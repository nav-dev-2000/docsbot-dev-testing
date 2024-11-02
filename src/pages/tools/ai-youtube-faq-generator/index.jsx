import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import RecentVideos from '@/components/RecentVideos'
import RecentAIVideos from '@/components/RecentAIVideos'
import { usePostHog } from 'posthog-js/react'
import { getRecentYoutubeVideos } from '@/lib/tools'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const loadingText = [
  'Fetching video details...',
  'Analyzing content...',
  'Extracting questions...',
  'Generating insightful answers...',
  'Finalizing FAQ...',
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

const YoutubeFAQGenerator = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  const generateFAQ = async (url) => {
    setIsComputing(true)
    setErrorText('')

    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)

      posthog?.capture('Free Tool', {
        tool: 'YouTube FAQ Generator',
        action: 'Error',
        error: 'Invalid URL',
        category: 'YouTube',
      })
      return
    }

    setVideoUrl(url)
    const endpoint = `/api/tools/youtube-prompter`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: url,
        type: 'faq',
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        // Get video ID from the response
        const { videoId } = data

        posthog?.capture('Free Tool', {
          tool: 'YouTube FAQ Generator',
          result: `https://docsbot.ai/tools/ai-youtube-faq-generator/${videoId}`,
          action: 'Used',
          category: 'YouTube',
        })

        await router.push(`/tools/ai-youtube-faq-generator/${videoId}`)
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )
        setShowSignupModal(true)

        posthog?.capture('Free Tool', {
          tool: 'YouTube FAQ Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'YouTube',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        posthog?.capture('Free Tool', {
          tool: 'YouTube FAQ Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'YouTube',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      posthog?.capture('Free Tool', {
        tool: 'YouTube FAQ Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'YouTube',
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
                  setVideoUrl(e.target.value)
                }}
                disabled={isComputing}
                placeholder="YouTube Video URL or ID"
                className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-50 sm:col-span-8 sm:text-sm"
              />
              <button
                onClick={() => generateFAQ(videoUrl)}
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-4"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />
                  </>
                ) : (
                  <>Generate FAQs</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="YouTube FAQ Generator"
        toolCategory="YouTube"
      />
    </div>
  )
}

export default function YoutubeFAQGeneratorPage({ recentVideos, starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI YouTube Video FAQ Generator | No Login Required"
        description="Generate insightful FAQs from any YouTube video using AI. Extract key questions and answers for learning, training, and education."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/youtube-faq-generator.png',
              alt: 'AI-Powered YouTube Video FAQ Generator',
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
                  Free AI YouTube Video FAQ Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Extract insightful frequently asked questions and answers from
                  any YouTube video for free using our AI-powered question
                  generator. Quickly capture key questions and answers to copy,
                  share, or use in your own content. Perfect for creating quizes
                  on presentations, lectures, and more for education and
                  training.
                </p>
                <YoutubeFAQGenerator />
                <RecentVideos
                  heading="Recently Generated FAQs"
                  slug="ai-youtube-faq-generator"
                  recentVideos={recentVideos}
                />
                <StarRating
                  itemId="ai-youtube-faq-generator"
                  name="AI YouTube Video FAQ Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA
          customTitle="Train an AI Chatbot from YouTube"
          description="Turn your favorite YouTube videos or playlists into an AI-powered chatbot. Effortlessly create a knowledgeable assistant that can answer questions based on video content, then embed it in your website or app."
          button="Create a Free YouTube Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>

        <RecentAIVideos
          heading="More Recently Generated FAQs"
          slug="ai-youtube-faq-generator"
          recentVideos={recentVideos}
        />
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const recentVideos = await getRecentYoutubeVideos('faq')
  const starRatingData = await getRating('ai-youtube-faq-generator')

  return {
    props: {
      recentVideos,
      starRatingData,
    },
    revalidate: 86400,
  }
}
