import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import {
  DocumentDuplicateIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  GlobeAltIcon,
  EyeIcon,
  ArrowUpOnSquareStackIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Disclosure } from '@headlessui/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ImageDropZone from '@/components/ImageDropZone'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const ImageToFAQGenerator = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [faqs, setFaqs] = useState('')
  const [descriptionCopied, setDescriptionCopied] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [textCopied, setTextCopied] = useState(false)
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const posthog = usePostHog()

  const generateFAQs = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload an image.')
      setIsComputing(false)

      // Track no image error
      posthog?.capture('Free Tool', {
        tool: 'Image to FAQ Generator',
        action: 'Error',
        error: 'No Image Uploaded',
        category: 'Image',
      })
      return
    }

    const endpoint = `/api/tools/image-prompter`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'faq',
        image: image.split(',')[1], // Remove the data URL prefix
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setFaqs(data)
        setHasResults(true)

        // Track successful FAQ generation
        posthog?.capture('Free Tool', {
          tool: 'Image to FAQ Generator',
          action: 'Used',
          category: 'Image',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow.',
        )
        setShowSignupModal(true)

        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'Image to FAQ Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'Image',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Image to FAQ Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image to FAQ Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
  }

  const copyFAQsAsText = () => {
    navigator.clipboard.writeText(
      faqs
        .replace(/\*\*/g, '')
        .replace(/###\s/g, '')
        .replace(/\*([^*]+)\*/g, '$1'),
    )
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 1500)

    // Track FAQ copy as text
    posthog?.capture('Free Tool', {
      tool: 'Image to FAQ Generator',
      action: 'Copy FAQs as Text',
      category: 'Image',
    })
  }

  const copyFAQsAsMarkdown = () => {
    navigator.clipboard.writeText(faqs)
    setMarkdownCopied(true)
    setTimeout(() => setMarkdownCopied(false), 1500)

    // Track FAQ copy as markdown
    posthog?.capture('Free Tool', {
      tool: 'Image to FAQ Generator',
      action: 'Copy FAQs as Markdown',
      category: 'Image',
    })
  }

  const resetTool = () => {
    setImage(null)
    setFaqs('')
    setErrorText(null)
    setHasResults(false)
    window.scrollTo({ top: 200, behavior: 'smooth' })

    // Track tool reset
    posthog?.capture('Free Tool', {
      tool: 'Image to FAQ Generator',
      action: 'Reset Tool',
      category: 'Image',
    })
  }

  const getMarkdownHtml = (text) => {
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(text)
      .then((file) => {
        setHtmlContent(String(file))
      })
      .catch((error) => {
        console.warn('Error processing markdown:', error)
      })
  }

  useEffect(() => {
    if (faqs) {
      getMarkdownHtml(faqs)
    }
  }, [faqs])

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={errorText} type="error" />
            {!faqs && (
              <div className="mb-4">
                <ImageDropZone
                  image={image}
                  setImage={setImage}
                  maxSize={1024}
                  isComputing={isComputing}
                />
              </div>
            )}
            {!faqs && (
              <>
                <button
                  onClick={generateFAQs}
                  disabled={isComputing || !image}
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> Generating FAQs...
                    </>
                  ) : (
                    <>Generate FAQs</>
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Images are never saved
                </p>
              </>
            )}
            {faqs && (
              <>
                <div className="mb-4">
                  <img
                    src={image}
                    alt="Preview"
                    className="mx-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-4 rounded-lg bg-gray-100 p-4 text-justify">
                  <h3 className="text-md mb-2 font-medium">FAQs</h3>
                  <div
                    className="prose mb-4 min-w-full text-gray-700"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                    <button
                      onClick={copyFAQsAsText}
                      className={clsx(
                        'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                        textCopied ? 'text-cyan-600' : 'text-gray-700',
                      )}
                    >
                      <DocumentDuplicateIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      {textCopied ? 'Copied!' : 'Copy as Text'}
                    </button>
                    <button
                      onClick={copyFAQsAsMarkdown}
                      className={clsx(
                        'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                        markdownCopied ? 'text-cyan-600' : 'text-gray-700',
                      )}
                    >
                      <CodeBracketIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      {markdownCopied ? 'Copied!' : 'Copy as Markdown'}
                    </button>
                    <button
                      onClick={resetTool}
                      className="inline-flex flex-1 items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                    >
                      <ArrowPathIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      Try Another Image
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Image to FAQ Generator"
        toolCategory="Image"
      />
    </>
  )
}

const useCases = [
  {
    name: 'Enhance Interactive Learning',
    description:
      'Create engaging quizzes and assessments from educational images, diagrams, and infographics to boost student engagement and retention.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Streamline Content Creation',
    description:
      'Quickly generate FAQs from visual content for textbooks, online courses, and educational websites, saving time for educators and instructional designers.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Improve E-learning Experiences',
    description:
      'Integrate image-based FAQs into Learning Management Systems like Canvas, Blackboard, and Moodle to create more interactive and comprehensive online courses.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Support Visual Learners',
    description:
      'Create supplementary Q&As for visual learners, helping them better understand and remember complex concepts presented in images and diagrams.',
    icon: EyeIcon,
  },
  {
    name: 'Facilitate Flipped Classrooms',
    description:
      'Generate pre-class questions from lecture slides or textbook images, encouraging students to engage with material before in-person discussions.',
    icon: ArrowUpOnSquareStackIcon,
  },
  {
    name: 'Enhance Educational Content Marketing',
    description:
      'Create engaging social media content and blog posts by generating FAQs from infographics and educational images, attracting potential students and learners.',
    icon: MagnifyingGlassIcon,
  },
]

const faqs = [
  {
    question: 'How can the Image to FAQ Generator benefit educators?',
    answer:
      'Educators can use this tool to quickly create engaging quizzes, assessments, and discussion prompts from educational images, diagrams, and infographics. This saves time in content creation and helps diversify learning materials.',
  },
  {
    question:
      'Can this tool be integrated with Learning Management Systems (LMS)?',
    answer:
      'While direct integration is not available, the generated FAQs can be easily copied and pasted into popular LMS platforms like Canvas, Blackboard, Moodle, and D2L Brightspace to enhance online courses and assessments.',
  },
  {
    question: 'How accurate are the generated FAQs?',
    answer:
      "The AI-generated FAQs are generally quite accurate for common educational content. However, for specialized or complex topics, it's recommended that educators review and potentially refine the questions and answers to ensure they align with specific learning objectives.",
  },
  {
    question: 'Can students use this tool for self-study?',
    answer:
      'Absolutely! Students can upload images from their textbooks or lecture slides to generate practice questions, helping them review key concepts and prepare for exams more effectively.',
  },
  {
    question: 'Are there any limitations on image types or sizes?',
    answer:
      'Our tool supports common image formats (JPEG, PNG, GIF, WEBP) and automatically resizes images for optimal processing. Very large files may have size limitations, but most educational images should work well.',
  },
  {
    question:
      'How can content creators use this tool for educational marketing?',
    answer:
      'Content creators can generate FAQs from infographics or promotional images to create engaging social media posts, blog articles, or email content. This helps attract potential students and showcase the value of educational programs or courses.',
  },
]

export default function ImageToFAQPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="Free AI Image to FAQ Generator | No Login | Copy Results"
        description="Generate FAQs for any image using our AI-powered tool. Perfect for creating quizzes and tests to understand image content, enhance learning experiences, and streamline educational content creation."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-faq.png',
              alt: 'AI-Powered Image to FAQ Generator',
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
                  Free AI Image to FAQ Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate Frequently Asked Questions (FAQs) for any image using
                  our AI-powered tool. Perfect for students, educators, and
                  anyone who wants to create quizzes and tests to learn and
                  understand image content. Enhance your e-learning materials
                  and LMS content effortlessly with quizzes generated for
                  images.
                </p>
                <ImageToFAQGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-image-faq-generator"
                  name="AI Image to FAQ Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        {!hasResults && (
          <>
            <div className="bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                  <h2 className="text-base font-semibold leading-7 text-cyan-600">
                    Effortless FAQ Creation
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our AI Image to FAQ Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to create engaging FAQs from your
                    educational images in seconds.
                  </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                  <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          1
                        </span>
                        Upload Your Image
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Select and upload the educational image, diagram, or
                          infographic you want to create FAQs for. Our tool
                          supports various image formats.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Generate FAQs
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Generate FAQs' button and let our AI
                          analyze your image to create relevant questions and
                          answers.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Review, Copy, Customize
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Review the generated FAQs, copy them with a click, and
                          customize as needed for your learning materials or LMS
                          content.
                        </p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                  <h2 className="text-base font-semibold leading-7 text-cyan-400">
                    Educational Applications
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Use Cases for Our AI Image to FAQ Generator in Education
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image to FAQ Generator can
                    enhance learning experiences and streamline content creation
                    across various educational domains.
                  </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                  <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                    {useCases.map((useCase) => (
                      <div key={useCase.name} className="relative pl-16">
                        <dt className="text-base font-semibold leading-7 text-white">
                          <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                            <useCase.icon
                              className="h-6 w-6 text-white"
                              aria-hidden="true"
                            />
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
                              <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                                <span className="text-base font-semibold leading-7">
                                  {faq.question}
                                </span>
                                <span className="ml-6 flex h-7 items-center">
                                  {open ? (
                                    <MinusIcon
                                      className="h-6 w-6"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <PlusIcon
                                      className="h-6 w-6"
                                      aria-hidden="true"
                                    />
                                  )}
                                </span>
                              </Disclosure.Button>
                            </dt>
                            <Disclosure.Panel as="dd" className="mt-2 pr-12">
                              <p className="text-base leading-7 text-gray-600">
                                {faq.answer}
                              </p>
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </>
        )}
        <RegisterCTA
          customTitle="Train a Custom AI Chatbot"
          description="Train a custom chatbot with your content, chat with images, and explore advanced AI-powered tools for personalized interactions with your data."
          button="Get Started for Free"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Image" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-image-faq-generator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}
