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
import { usePostHog } from 'posthog-js/react'
import { getRecentYoutubeVideos } from '@/lib/tools'

const loadingText = [
  'Fetching video details...',
  'Analyzing content...',
  'Generating summary...',
  'Extracting key points...',
  'Finalizing results...',
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

const YoutubeSummarizer = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const posthog = usePostHog()

  const summarizeVideo = async (url) => {
    setIsComputing(true)
    setErrorText('')

    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)

      // Track invalid URL error
      posthog?.capture('Free Tool', {
        tool: 'YouTube Summarizer',
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
        type: 'summary',
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        // Get video ID from the response
        const { videoId } = data

        // Track successful summarization
        posthog?.capture('Free Tool', {
          tool: 'YouTube Summarizer',
          result: `https://docsbot.ai/tools/ai-youtube-summarizer/${videoId}`,
          action: 'Used',
          category: 'YouTube',
        })

        await router.push(`/tools/ai-youtube-summarizer/${videoId}`)
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )

        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'YouTube Summarizer',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'YouTube',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'YouTube Summarizer',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'YouTube',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'YouTube Summarizer',
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
                onClick={() => summarizeVideo(videoUrl)}
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-4"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />
                  </>
                ) : (
                  <>Summarize Video</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function YoutubeSummarizerPage({ recentVideos }) {
  return (
    <>
      <NextSeo
        title="Free AI YouTube Video Summarizer | No Login | Instant Summaries"
        description="Summarize YouTube videos instantly with our free AI-powered tool. Get key points and concise summaries to save time and enhance learning. No login required!"
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/youtube-summarize.png',
              alt: 'AI-Powered YouTube Video Summarizer',
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
                  Free AI YouTube Video Summarizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Instantly summarize any YouTube video with our AI-powered tool. Get concise summaries, key points, and transcripts to save time and boost your learning. Perfect for students, researchers, and content creators. No login required!
                </p>
                <YoutubeSummarizer />
                <RecentVideos
                  heading="Recently Summarized Videos"
                  slug="ai-youtube-summarizer"
                  recentVideos={recentVideos}
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

        <div className="bg-white py-12 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our YouTube Video Summarizer?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-2 border-gray-400 p-6 rounded-lg transition-colors hover:bg-gray-100">
                <h3 className="text-xl font-semibold mb-3">100% Free</h3>
                <p>Summarize YouTube videos without any cost. No hidden fees or premium features.</p>
              </div>
              <div className="border-2 border-gray-400 p-6 rounded-lg transition-colors hover:bg-gray-100">
                <h3 className="text-xl font-semibold mb-3">No Login Required</h3>
                <p>Start summarizing videos instantly. No need to create an account or sign up.</p>
              </div>
              <div className="border-2 border-gray-400 p-6 rounded-lg transition-colors hover:bg-gray-100">
                <h3 className="text-xl font-semibold mb-3">AI-Powered Accuracy</h3>
                <p>Get high-quality summaries using advanced AI technology for precise results.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-12 md:py-24 text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">1. Paste URL</h3>
                <p>Enter the YouTube video URL you want to summarize.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">2. AI Analysis</h3>
                <p>Our AI analyzes the video content and transcript.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">3. Generate Summary</h3>
                <p>Get a concise summary with key points in seconds.</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">4. Save Time</h3>
                <p>Quickly grasp video content without watching the full video.</p>
              </div>
            </div>
          </div>
        </div>



        <div className="bg-white py-12 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">What is a YouTube Video Summarizer?</summary>
                <p className="mt-2">A YouTube Video Summarizer is an AI-powered tool that automatically generates concise summaries of YouTube videos, extracting key points and main ideas to save you time and enhance your understanding of the content.</p>
              </details>
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">Is this YouTube Summarizer really free?</summary>
                <p className="mt-2">Yes, our YouTube Video Summarizer is completely free to use. There are no hidden costs or premium features. You can summarize videos without creating an account or paying anything. You can also <a href="/register" className="text-cyan-500 hover:text-cyan-700 underline font-semibold transition-colors duration-300">signup for a free account</a> to create a custom AI chatbot from your videos.</p>
              </details>
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">How accurate are the summaries?</summary>
                <p className="mt-2">Our AI-powered summarizer uses the latest AI LLM models from OpenAI and Google to ensure high accuracy. However, the quality may vary depending on the video content and audio clarity. We recommend reviewing the summary for the best results.</p>
              </details>
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">Are there any limitations on video length or number of summaries?</summary>
                <p className="mt-2">There are no strict limitations on video length, as long as subtitles are available on YouTube for it to be processed. We do have a daily limit for summaries to ensure the service remains free for everyone. <a href="/register" className="text-cyan-500 hover:text-cyan-700 underline font-semibold transition-colors duration-300">Signup for a free account</a> to increase your daily limit!</p>
              </details>
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">Can I use this tool for other video platforms besides YouTube?</summary>
                <p className="mt-2">Currently, our tool is optimized for YouTube videos only. We may consider adding support for other video platforms in the future based on user demand.</p>
              </details>
              <details className="bg-gray-100 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">How can I use the video summaries?</summary>
                <p className="mt-2">You can use the summaries to quickly understand video content, prepare for exams, research topics, or create content. They're great for students, researchers, content creators, and anyone looking to save time while consuming video content. We make it simple to copy and paste the summaries anywhere you want.</p>
              </details>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getServerSideProps = async (context) => {
  const recentVideos = await getRecentYoutubeVideos('summary')

  return {
    props: {
      recentVideos,
    },
  }
}