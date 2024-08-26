import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'

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

  const summarizeVideo = async (url) => {
    setIsComputing(true)
    setErrorText('')

    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)
      return
    }

    setVideoUrl(url)
    const endpoint = `/api/tools/youtube-summarizer`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: url,
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        // Extract video ID from URL
        const videoId = url.split('v=')[1] || url.split('/').pop()
        await router.push(`/tools/ai-youtube-summarizer/${videoId}`)
      } else if (response.status === 429) {
        setErrorText('Rate limit exceeded, please try again later.')
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)
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
                className="col-span-12 block rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm sm:col-span-8"
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

export default function YoutubeSummarizerPage() {
  return (
    <>
      <NextSeo
        title="Free AI-Powered YouTube Video Summarizer - DocsBot AI"
        description="Generate a summary of any YouTube video, powered by DocsBot AI."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/og-youtube-summarizer.png',
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
                  AI-Powered YouTube Video Summarizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate concise, accurate summaries of any YouTube video for free using our AI-powered YouTube video summarizer. Save time and boost productivity by quickly grasping key points from long videos.                </p>
                <YoutubeSummarizer />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />
      </main>
      <Footer />
    </>
  )
}
