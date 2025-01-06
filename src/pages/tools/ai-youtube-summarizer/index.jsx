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
import RecentAIVideos from '@/components/RecentAIVideos'
import {
  ShieldCheckIcon,
  UserCircleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  MinusIcon,
  PlusIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  FingerPrintIcon,
  LockClosedIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import { FAQPageJsonLd } from 'next-seo'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

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
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
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
          'Daily usage limit exceeded, please try again tomorrow.',
        )
        setShowSignupModal(true)
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

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="YouTube Summarizer"
        toolCategory="YouTube"
      />
    </div>
  )
}

const faqs = [
  {
    question: 'What is a YouTube Video Summarizer?',
    answer:
      'A YouTube Video Summarizer is an AI-powered tool that automatically generates concise summaries of YouTube videos, extracting key points and main ideas to save you time and enhance your understanding of the content.',
  },
  {
    question: 'Is this YouTube Summarizer really free?',
    answer:
      'Yes, our YouTube Video Summarizer is completely free to use. There are no hidden costs or premium features. You can summarize videos without creating an account or paying anything. You can also signup for a free account to create a custom AI chatbot from your videos.',
  },
  {
    question: 'How accurate are the summaries?',
    answer:
      'Our AI-powered summarizer uses the latest AI LLM models from OpenAI and Google to ensure high accuracy. However, the quality may vary depending on the video content and audio clarity. We recommend reviewing the summary for the best results.',
  },
  {
    question:
      'Are there any limitations on video length or number of summaries?',
    answer:
      'There are no strict limitations on video length, as long as subtitles are available on YouTube for it to be processed. We do have a daily limit for summaries to ensure the service remains free for everyone. Signup for a free account to increase your daily limit!',
  },
  {
    question: 'Can I use this tool for other video platforms besides YouTube?',
    answer:
      'Currently, our tool is optimized for YouTube videos only. We may consider adding support for other video platforms in the future based on user demand.',
  },
  {
    question: 'How can I use the video summaries?',
    answer:
      "You can use the summaries to quickly understand video content, prepare for exams, research topics, or create content. They're great for students, researchers, content creators, and anyone looking to save time while consuming video content. We make it simple to copy and paste the summaries anywhere you want.",
  },
]

const useCases = [
  {
    name: 'Generate Quick Video Summaries for SEO',
    description:
      'Summarize YouTube videos in seconds, helping to create SEO-rich summaries that boost content discoverability and engagement.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Create Video Summaries for Busy Professionals',
    description:
      'Automatically generate concise summaries of long YouTube videos, ideal for professionals looking to save time while staying informed.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Summarize Webinars and Online Courses',
    description:
      'Use the summarizer to distill key points from educational YouTube videos, webinars, or online courses, making content easier to consume.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Video Summary Generation for Content Creators',
    description:
      'Provide your audience with short, engaging summaries of your YouTube content, perfect for increasing watch times and user retention.',
    icon: ArrowPathIcon,
  },
  {
    name: 'SEO-Boosting Summaries for Video Blog Posts',
    description:
      'Generate concise summaries of your YouTube videos to include in blog posts, enhancing the SEO of your content with keyword-rich summaries.',
    icon: FingerPrintIcon,
  },
  {
    name: 'Research and Fact-Checking',
    description:
      'Quickly extract key information from multiple YouTube videos for research purposes or fact-checking, saving hours of manual video watching.',
    icon: LockClosedIcon,
  },
]

export default function YoutubeSummarizerPage({ recentVideos, starRatingData }) {
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
                  Free AI YouTube Video Summarizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Get straight to the key points of any YouTube video without
                  spending hours watching with the AI-Powered YouTube Video
                  Summarizer. This free tool uses advanced AI technology to
                  generate accurate, concise summaries that capture the most
                  important information from long videos. Whether you're
                  researching, learning, or simply trying to digest content more
                  quickly, this tool can save you significant time and effort.
                </p>
                <CarbonAd className="flex justify-center mt-4" />  
                <YoutubeSummarizer />
                <RecentVideos
                  heading="Recently Summarized Videos"
                  slug="ai-youtube-summarizer"
                  recentVideos={recentVideos}
                />
                <StarRating 
                  itemId="ai-youtube-summarizer"
                  name="AI YouTube Video Summarizer - DocsBot"
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
              Get an AI YouTube Summary in 4 Easy Steps
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              How It Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our AI-powered YouTube Video Summarizer simplifies the process of
              extracting key information from any video. Follow these four
              simple steps to save time and enhance your understanding.
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
                  Enter the YouTube video URL you want to summarize.
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
                  Our AI analyzes the video content and transcript.
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
                  Generate Summary
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Get a concise summary with key points in seconds.
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
                  Save Time
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Quickly grasp video content without watching the full video.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Effortless Summarization
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Why Choose Our YouTube Video Summarizer?
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Our AI-powered tool offers quick, accurate, and free summaries
                of YouTube videos, saving you time and enhancing your
                understanding of content.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <BanknotesIcon
                      className="h-5 w-5 flex-none text-cyan-400"
                      aria-hidden="true"
                    />
                    100% Free
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      Summarize YouTube videos without any cost. No hidden fees
                      or premium features.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <UserCircleIcon
                      className="h-5 w-5 flex-none text-cyan-400"
                      aria-hidden="true"
                    />
                    No Login Required
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      Start summarizing videos instantly. No need to create an
                      account or sign up.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <ShieldCheckIcon
                      className="h-5 w-5 flex-none text-cyan-400"
                      aria-hidden="true"
                    />
                    AI-Powered Accuracy
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                    <p className="flex-auto">
                      Get high-quality summaries using advanced AI technology
                      for precise results.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Versatile Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Use Cases for Our YouTube Video Summarizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Discover how our AI-powered YouTube Video Summarizer can
                revolutionize the way you consume and create content across
                various domains.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-gray-900">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-900">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-white/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-white">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-white/10">
                {faqs.map((faq) => (
                  <Disclosure key={faq.question} as="div" className="pt-6">
                    <dt>
                      <DisclosureButton className="group flex w-full items-start justify-between text-left text-white">
                        <span className="text-base font-semibold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          <PlusIcon
                            aria-hidden="true"
                            className="h-6 w-6 group-data-[open]:hidden"
                          />
                          <MinusIcon
                            aria-hidden="true"
                            className="h-6 w-6 [.group:not([data-open])_&]:hidden"
                          />
                        </span>
                      </DisclosureButton>
                    </dt>
                    <DisclosurePanel as="dd" className="mt-2 pr-12">
                      <p className="text-base leading-7 text-gray-300">
                        {faq.answer}
                      </p>
                    </DisclosurePanel>
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
          heading="More Recently Analyzed Videos"
          slug="ai-youtube-summarizer"
          recentVideos={recentVideos}
        />
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async (context) => {
  const recentVideos = await getRecentYoutubeVideos('summary')
  const starRatingData = await getRating('ai-youtube-summarizer')

  return {
    props: {
      recentVideos,
      starRatingData,
    },
    revalidate: 3600,
  }
}