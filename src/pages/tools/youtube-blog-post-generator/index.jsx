import { NextSeo, FAQPageJsonLd } from 'next-seo'
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
import RecentAIVideos from '@/components/RecentAIVideos'
import { usePostHog } from 'posthog-js/react'
import {
  GlobeAltIcon,
  ClockIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowPathRoundedSquareIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ToolsSignupModal from '@/components/ToolsSignupModal'

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
  const [showSignupModal, setShowSignupModal] = useState(false)

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
          'Daily usage limit exceeded, please try again tomorrow.',
        )
        setShowSignupModal(true)

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

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="YouTube Blog Post Generator"
        toolCategory="Writing"
      />
    </div>
  )
}

const faqs = [
  {
    question: 'What is a YouTube Blog Post Generator?',
    answer: 'A YouTube Blog Post Generator is an AI-powered tool that automatically converts YouTube video content into well-structured, SEO-optimized blog posts. It extracts key information from the video and creates a written article, saving time for content creators and marketers.',
  },
  {
    question: 'Is this YouTube Blog Post Generator really free?',
    answer: 'Yes, our YouTube Blog Post Generator is completely free to use. There are no hidden costs or premium features. You can generate blog posts from videos without creating an account or paying anything.',
  },
  {
    question: 'How accurate are the generated blog posts?',
    answer: 'Our AI-powered generator uses advanced language models to ensure high accuracy. However, the quality may vary depending on the video content and subtitles. We recommend reviewing and editing the generated post for the best results.',
  },
  {
    question: 'Are there any limitations on video length or number of generations?',
    answer: 'There are no strict limitations on video length, as long as there are user or auto-generated subtitles available on YouTube for it. We do have a daily limit for generations to ensure the service remains free for everyone. Sign up for a free account to increase your daily limit!',
  },
  {
    question: 'Can I edit the generated blog post?',
    answer: 'Yes, you can edit the generated blog post. We provide the content in various formats (Markdown, HTML, and plain text) so you can easily copy and paste it into your preferred editor for further customization.',
  },
  {
    question: 'How can I use the generated blog posts?',
    answer: 'You can use the generated blog posts to repurpose your YouTube content for your website, improve SEO, reach a wider audience, and provide written content for those who prefer reading over watching videos. Always ensure you have the right to use the video content in written form.',
  },
]

const useCases = [
  {
    name: 'Content Repurposing',
    description: 'Transform your YouTube videos into engaging blog posts, extending the reach of your content to readers who prefer written format.',
    icon: ArrowPathRoundedSquareIcon,
  },
  {
    name: 'SEO Optimization',
    description: 'Generate SEO-friendly blog posts from your videos, improving your search engine rankings and driving more organic traffic to your website.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Time-Saving for Content Creators',
    description: 'Automatically create blog post drafts from your videos, saving hours of writing time and allowing you to focus on creating more video content.',
    icon: ClockIcon,
  },
  {
    name: 'Enhance Content Marketing',
    description: 'Use generated blog posts as a foundation for your content marketing strategy, providing valuable written content alongside your video offerings.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Improve Accessibility',
    description: 'Make your video content accessible to a wider audience, including those who prefer reading or have hearing impairments.',
    icon: SpeakerXMarkIcon,
  },
  {
    name: 'Content Analysis',
    description: 'Use the generated blog posts to analyze your video content, identify key themes, and gather insights for future content creation.',
    icon: ChartBarIcon,
  },
]

export default function YoutubeBlogPostGeneratorPage({ recentVideos, starRatingData }) {
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
      <FAQPageJsonLd
        mainEntity={faqs.map((faq) => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
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
                <StarRating
                  itemId="youtube-blog-post-generator"
                  name="AI YouTube Video to Blog Post Generator - DocsBot"
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

        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto mb-24 max-w-2xl text-center">
            <p className="text-base font-semibold leading-7 text-cyan-600">
              Get an AI-Generated Blog Post in 4 Easy Steps
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              How It Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our AI-powered YouTube Video to Blog Post Generator simplifies the process of
              transforming video content into engaging articles. Follow these four
              simple steps to save time and enhance your content strategy.
            </p>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
              <div>
                <span
                  className="flex items-center text-sm font-semibold leading-6 text-cyan-600"
                >
                  <svg
                    viewBox="0 0 4 4"
                    className="mr-4 h-1 w-1 flex-none"
                    aria-hidden="true"
                  >
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 1
                  <div
                    className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                    aria-hidden="true"
                  ></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Paste URL
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Enter the YouTube video URL you want to convert into a blog post.
                </p>
              </div>
              <div>
                <span
                  className="flex items-center text-sm font-semibold leading-6 text-cyan-600"
                >
                  <svg
                    viewBox="0 0 4 4"
                    className="mr-4 h-1 w-1 flex-none"
                    aria-hidden="true"
                  >
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 2
                  <div
                    className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                    aria-hidden="true"
                  ></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  AI Analysis
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Our AI analyzes the video content, including speech, captions, and visual elements.
                </p>
              </div>
              <div>
                <span
                  className="flex items-center text-sm font-semibold leading-6 text-cyan-600"
                >
                  <svg
                    viewBox="0 0 4 4"
                    className="mr-4 h-1 w-1 flex-none"
                    aria-hidden="true"
                  >
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 3
                  <div
                    className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                    aria-hidden="true"
                  ></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Generate Blog Post
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Get a well-structured, SEO-friendly blog post based on the video's content in seconds.
                </p>
              </div>
              <div>
                <span
                  className="flex items-center text-sm font-semibold leading-6 text-cyan-600"
                >
                  <svg
                    viewBox="0 0 4 4"
                    className="mr-4 h-1 w-1 flex-none"
                    aria-hidden="true"
                  >
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 4
                  <div
                    className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0"
                    aria-hidden="true"
                  ></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Publish
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Copy your post as Markdown or HTML to publish on the platform of your choice like WordPress, Medium, etc.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Versatile Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our YouTube Blog Post Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered YouTube Blog Post Generator can revolutionize your content creation process across various domains.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-300">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <DisclosureButton className="flex w-full items-start justify-between text-left text-gray-900">
                            <span className="text-base font-semibold leading-7">{faq.question}</span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusIcon className="h-6 w-6" aria-hidden="true" />
                              ) : (
                                <PlusIcon className="h-6 w-6" aria-hidden="true" />
                              )}
                            </span>
                          </DisclosureButton>
                        </dt>
                        <DisclosurePanel as="dd" className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </DisclosurePanel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>

        <RecentAIVideos
          heading="More YouTube Articles"
          slug="youtube-blog-post-generator"
          recentVideos={recentVideos}
        />
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const recentVideos = await getRecentVideoBlogPosts()
  const starRatingData = await getRating('youtube-blog-post-generator')

  return {
    props: {
      recentVideos,
      starRatingData,
    },
    revalidate: 3600,
  }
}
