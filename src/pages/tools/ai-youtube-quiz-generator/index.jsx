import { NextSeo, FAQPageJsonLd } from 'next-seo'
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
import {
  GlobeAltIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  PuzzlePieceIcon,
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
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Fetching video details...',
  'Analyzing content...',
  'Generating quiz questions...',
  'Creating answer options...',
  'Finalizing quiz...',
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

const YoutubeQuizGenerator = () => {
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
  
  const generateQuiz = async (url) => {
    setIsComputing(true)
    setErrorText('')

    if (!url) {
      setErrorText('Invalid URL, please try again.')
      setIsComputing(false)

      posthog?.capture('Free Tool', {
        tool: 'YouTube Quiz Generator',
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
        type: 'quiz',
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        // Get video ID from the response
        const { videoId } = data

        posthog?.capture('Free Tool', {
          tool: 'YouTube Quiz Generator',
          result: `https://docsbot.ai/tools/ai-youtube-quiz-generator/${videoId}`,
          action: 'Used',
          category: 'YouTube',
        })

        await router.push(`/tools/ai-youtube-quiz-generator/${videoId}`)
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )
        setShowSignupModal(true)
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        posthog?.capture('Free Tool', {
          tool: 'YouTube Quiz Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'YouTube',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      posthog?.capture('Free Tool', {
        tool: 'YouTube Quiz Generator',
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
                onClick={() => generateQuiz(videoUrl)}
                type="submit"
                disabled={isComputing}
                className="col-span-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:col-span-4"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> <LoadingText />
                  </>
                ) : (
                  <>Generate Quiz</>
                )}
              </button>
            </div>
          </form>

          <CarbonAd className="flex justify-center mt-4" /> 

        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="YouTube Quiz Generator"
        toolCategory="YouTube"
      />
    </div>
  )
}

const faqs = [
  {
    question: 'What is an AI Quiz Generator and how does it work?',
    answer: 'An AI quiz generator is a tool that uses artificial intelligence to automatically create educational quizzes and practice tests from video content. Our free AI quiz generator analyzes video content and generates relevant multiple-choice questions, making it an invaluable tool for teachers and educators.',
  },
  {
    question: 'Is this AI Quiz Generator really free?',
    answer: 'Yes, our AI quiz generator is completely free to use. You can generate multiple quizzes and practice tests without creating an account or paying any fees. While there are daily usage limits to ensure fair access, our quiz generator remains free for all users.',
  },
  {
    question: 'How accurate are the AI-generated test questions?',
    answer: 'Our AI test question generator uses advanced language models to ensure high accuracy and relevance. The quality of questions depends on the video content clarity, but our quiz generator AI consistently produces professional-quality assessments suitable for educational use.',
  },
  {
    question: 'Can teachers customize the AI-generated quizzes?',
    answer: 'While our free AI quiz generator creates standardized multiple-choice questions, teachers can easily modify the generated content. You can edit questions, add your own, or adjust difficulty levels to match your teaching needs.',
  },
  {
    question: 'Are there any limitations on video length or quiz generation?',
    answer: 'Our AI test generator works best with educational videos between 5-30 minutes. While there\'s no strict limit on video length, the video must have available subtitles for our quiz AI generator to analyze the content effectively.',
  },
  {
    question: 'How can educators use these AI-generated practice tests?',
    answer: 'Teachers can use our AI test generator for various purposes including student assessment, homework assignments, exam preparation, and knowledge checks. Our free AI quiz generator is particularly useful for creating practice tests, pop quizzes, and interactive learning materials.',
  },
  {
    question: 'Which learning platforms support the quiz exports?',
    answer: 'Our quiz generator exports in QTI format, which is compatible with all major learning management systems including: Blackboard Learn, Canvas, Google Classroom, Moodle, and Schoology. We also support CSV exports for LearnDash and other WordPress LMS plugins.',
  },
]

const useCases = [
  {
    name: 'Educational Assessment with AI',
    description: 'Use our free AI quiz generator to create instant assessments from educational videos, exportable to popular platforms like Canvas, Blackboard Learn, Google Classroom, Moodle, and Schoology.',
    icon: AcademicCapIcon,
  },
  {
    name: 'AI Quiz Creation',
    description: 'Generate practice quizzes automatically using our AI quiz generator for teachers, saving hours of manual question writing.',
    icon: UserGroupIcon,
  },
  {
    name: 'Efficient Quiz Generation',
    description: 'Let our quiz AI generator create multiple assessments quickly, perfect for regular student evaluations and homework.',
    icon: ClockIcon,
  },
  {
    name: 'Interactive Learning Tests',
    description: 'Transform video content into engaging quizzes with our AI test question generator, making learning more interactive.',
    icon: PuzzlePieceIcon,
  },
  {
    name: 'Performance Tracking',
    description: 'Use AI-generated tests to track student progress and identify areas needing improvement automatically.',
    icon: ChartBarIcon,
  },
  {
    name: 'Multilingual Quiz Creation',
    description: 'Create quizzes in multiple languages with our free AI quiz generator, making education accessible globally.',
    icon: GlobeAltIcon,
  },
  {
    name: 'LMS Integration',
    description: 'Export quizzes in QTI format for seamless integration with major learning platforms including Blackboard Learn, Canvas, Google Classroom, Moodle, and Schoology.',
    icon: GlobeAltIcon,
  },
]

export default function YoutubeQuizGeneratorPage({ recentVideos, starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI YouTube Video Quiz Generator | No Login"
        description="Generate engaging quizzes & tests from any YouTube video using AI. Create interactive learning assessments with multiple choice questions and answers. Perfect for teachers, trainers, and educators."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/youtube-quiz.png',
              alt: 'AI-Powered YouTube Video Quiz Generator',
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
                  Free AI YouTube Video Quiz Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Create interactive quizzes from any YouTube video for free using our AI-powered question generator. 
                  Quickly generate multiple choice questions and answers to test knowledge and understanding. 
                  Perfect for educators, trainers, and anyone looking to create engaging assessments from video content.
                </p>
                <YoutubeQuizGenerator />
                <RecentVideos
                  heading="Recently Generated Quizzes"
                  slug="ai-youtube-quiz-generator"
                  recentVideos={recentVideos}
                />
                <StarRating
                  itemId="ai-youtube-quiz-generator"
                  name="AI YouTube Video Quiz Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto mb-24 max-w-2xl text-center">
            <p className="text-base font-semibold leading-7 text-cyan-600">
              Free AI Quiz Generator for Students, Teachers, and Educators
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              How Our YouTube AI Quiz Generator Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our free YouTube AI quiz generator streamlines the process of creating educational assessments and practice quizzes from video content. Follow these four steps to use our AI quiz generator and create engaging quizzes instantly for study or learning.
            </p>
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 1
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Input Video URL
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Enter any YouTube video URL into our AI quiz generator free tool to begin creating your test.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 2
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  AI Analysis
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Our quiz AI generator analyzes the video content to identify key concepts perfect for test questions.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 3
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Generate Practice Test
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Our AI test question generator creates multiple-choice questions and answers automatically.
                </p>
              </div>
              <div>
                <span className="flex items-center text-sm font-semibold leading-6 text-cyan-600">
                  <svg viewBox="0 0 4 4" className="mr-4 h-1 w-1 flex-none" aria-hidden="true">
                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                  </svg>
                  Step 4
                  <div className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0" aria-hidden="true"></div>
                </span>
                <p className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                  Export Quiz
                </p>
                <p className="mt-1 text-base leading-7 text-gray-600">
                  Download your AI-generated practice quiz in LearnDash or QTI format for seamless integration with Blackboard Learn, Canvas, Google Classroom, Moodle, Schoology, and other learning management systems.
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
                Use Cases for Our YouTube Quiz Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Quiz Generator can transform video content into engaging educational assessments across various learning environments.
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

        <RegisterCTA
          customTitle="Train an AI Chatbot from YouTube"
          description="Transform your favorite YouTube videos or playlists into an AI-powered chatbot. Easily create a knowledgeable assistant that can answer questions and provide insights based on video content, then embed it in your website or app."
          button="Create a Free YouTube Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>

        <RecentAIVideos
          heading="More Recently Generated Quizzes"
          slug="ai-youtube-quiz-generator"
          recentVideos={recentVideos}
        />
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const recentVideos = await getRecentYoutubeVideos('quiz')
  const starRatingData = await getRating('ai-youtube-quiz-generator')

  return {
    props: {
      recentVideos,
      starRatingData,
    },
    revalidate: 86400,
  }
}
