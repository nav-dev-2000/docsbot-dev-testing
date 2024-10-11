import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import { getRecentVideoBlogPosts } from '@/lib/tools'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import RecentVideos from '@/components/RecentVideos'
import { usePostHog } from 'posthog-js/react'

const loadingText = [
  'Fetching video details...',
  'Analyzing content...',
  'Generating blog post...',
  'Structuring content...',
  'Finalizing post...',
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

const YoutubeBlogPostGenerator = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const posthog = usePostHog()

  const generateBlogPost = async (url) => {
    setIsComputing(true)
    setErrorText('')

    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)

      // Track invalid URL error
      posthog?.capture('Free Tool', {
        tool: 'YouTube Blog Post Generator',
        action: 'Error',
        error: 'Invalid URL',
        category: 'YouTube',
      })
      return
    }

    setVideoUrl(url)
    const endpoint = `/api/tools/youtube-blog-post-generator`
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
        // Get video ID from the response
        const { id } = data

        // Track successful blog post generation
        posthog?.capture('Free Tool', {
          tool: 'YouTube Blog Post Generator',
          result: `https://docsbot.ai/tools/youtube-blog-post-generator/${id}`,
          action: 'Used',
          category: 'YouTube',
        })

        await router.push(`/tools/youtube-blog-post-generator/${id}`)
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )

        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'YouTube Blog Post Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'YouTube',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'YouTube Blog Post Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'YouTube',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'YouTube Blog Post Generator',
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
          <h2 className="mb-4 text-2xl font-bold">
            Convert Your YouTube Video to a Blog Post
          </h2>
          <p className="mb-4">
            Enter a YouTube video URL here to transform it into an SEO-optimized blog article in
            seconds.
          </p>
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
                onClick={() => generateBlogPost(videoUrl)}
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-4"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />
                  </>
                ) : (
                  <>Generate Blog Post</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function YoutubeBlogPostGeneratorPage({ recentVideos }) {
  return (
    <>
      <NextSeo
        title="Free AI YouTube Video to Blog Post Generator | Instant Converter | No Login"
        description="Transform YouTube videos into SEO-optimized blog posts instantly. Our AI-powered tool helps content creators repurpose video content into engaging articles. No login required!"
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/youtube-blog.png',
              alt: 'AI-Powered YouTube Video to Blog Post Converter',
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
                  Free AI YouTube Video to Blog Post Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Instantly convert YouTube videos into well-structured,
                  SEO-optimized blog posts. Our AI-powered tool helps content
                  creators, marketers, and bloggers effortlessly repurpose video
                  content into engaging articles. Save time and boost your
                  content strategy with our free YouTube to blog converter.
                </p>
                <YoutubeBlogPostGenerator />
                <RecentVideos
                  heading="Recently Generated Blog Posts"
                  slug="youtube-blog-post-generator"
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

        <div className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="mb-6 text-3xl font-bold text-center">
              Why Use Our YouTube Video to Blog Article Generator?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Instant conversion:</strong> Transform videos into blog posts in seconds
                  </li>
                  <li>
                    <strong>SEO-optimized content:</strong> Get articles ready for search engine
                    ranking
                  </li>
                  <li>
                    <strong>Preserve video essence:</strong> Maintain the original message and
                    perspective
                  </li>
                </ul>
              </div>
              <div>
                <ul className="list-disc space-y-2 pl-6">
                  <li><strong>Time-saving:</strong> Repurpose content quickly and efficiently</li>
                  <li>
                    <strong>Free to use:</strong> No login required, start converting right away
                  </li>
                  <li>
                    <strong>Multiple formats:</strong> Copy your blog post as Markdown, HTML, or
                    plain text
                  </li>
                </ul>
              </div>
            </div>
            
            <h3 className="mt-16 mb-4 text-2xl font-bold text-center">
              How Our AI-Powered YouTube to Blog Post Generator Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">1. Input YouTube URL</h4>
                <p>Simply paste the URL of any YouTube video you want to convert into a blog post.</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">2. AI Analysis</h4>
                <p>Our advanced AI analyzes the video content, including speech, captions, and visual elements.</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">3. Generate Blog Post</h4>
                <p>The AI creates a well-structured, SEO-friendly blog post based on the video's content.</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">4. Copy and Use</h4>
                <p>Copy your post as Markdown, HTML, or plain text and use it on your website or blog platform.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-lg">
                Whether you're a content creator, marketer, or blogger, our YouTube Video to Blog Article Generator 
                helps you repurpose your video content effortlessly. Save time, improve your SEO, and reach a wider 
                audience by converting your YouTube videos into engaging blog posts.
              </p>
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
  const recentVideos = await getRecentVideoBlogPosts()

  return {
    props: {
      recentVideos,
    },
  }
}