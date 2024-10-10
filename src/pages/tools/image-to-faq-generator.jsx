import { NextSeo } from 'next-seo'
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

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scaleFactor = Math.min(1024 / img.width, 1024 / img.height)
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg'))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const ImageToFAQGenerator = () => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [faqs, setFaqs] = useState('')
  const [descriptionCopied, setDescriptionCopied] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [textCopied, setTextCopied] = useState(false)
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const posthog = usePostHog()

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0]
    if (file) {
      const resizedImage = await resizeImage(file)
      setImage(resizedImage)
    }
  }, [])

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

        // Track successful FAQ generation
        posthog?.capture('Free Tool', {
          tool: 'Image to FAQ Generator',
          action: 'Used',
          category: 'Image',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )

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
                <label
                  htmlFor="image-upload"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Upload Image
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isComputing}
                  className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-600 file:ring-2 file:ring-inset file:ring-cyan-600 hover:file:bg-cyan-50 hover:file:text-cyan-700 focus:outline-none"
                />
              </div>
            )}
            {image && (
              <div className="mb-4">
                <img
                  src={image}
                  alt="Preview"
                  className="mx-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
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
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-justify">
                <h3 className="text-md mb-2 font-medium">FAQs</h3>
                <div
                  className="prose mb-4 min-w-full text-gray-700"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <div className="flex gap-2">
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
                    Try Another Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {!faqs && (
        <div className="text-justify text-gray-300">
          <p className="mt-6 text-lg leading-8">
            Our AI-powered Image to FAQ Generator is a versatile tool with
            numerous applications across various fields. Here are some key use
            cases:
          </p>
          <ul className="mb-4 ml-8 mt-2 list-inside list-disc">
            <li>
              <strong>Education:</strong> Teachers can create quick quizzes from
              educational images, diagrams, or infographics.
            </li>
            <li>
              <strong>E-learning:</strong> Course creators can generate
              interactive Q&amp;As from visual content to enhance learner
              engagement.
            </li>
            <li>
              <strong>Content Marketing:</strong> Marketers can create FAQs from
              product images or infographics for better audience understanding.
            </li>
            <li>
              <strong>Social Media:</strong> Community managers can generate
              engaging quizzes from trending images or memes.
            </li>
            <li>
              <strong>Data Visualization:</strong> Analysts can create Q&amp;As
              to explain complex charts or graphs.
            </li>
            <li>
              <strong>Art and Photography:</strong> Artists can generate
              discussion points or questions about their visual works.
            </li>
            <li>
              <strong>Medical Education:</strong> Healthcare professionals can
              create Q&amp;As from medical imaging for training purposes.
            </li>
            <li>
              <strong>Travel and Tourism:</strong> Travel bloggers can generate
              FAQs about destination images to inform their audience.
            </li>
            <li>
              <strong>Product Development:</strong> Product developers can
              create FAQs from product images to understand user needs and
              improve product features.
            </li>
          </ul>
          <p className="mt-4 text-lg leading-8">
            This tool leverages advanced AI and computer vision technologies to
            analyze images and generate relevant, insightful questions and
            answers. It's perfect for visual learning, content creation,
            audience engagement, and knowledge testing across various domains.
          </p>
          <p className="mt-4 text-lg leading-8">
            Whether you're an educator, content creator, marketer, or just
            curious about exploring images in a new way, our Image to FAQ
            Generator offers a unique approach to understanding and interacting
            with visual content. Try it now and transform your images into
            engaging, educational FAQs!
          </p>
        </div>
      )}
    </>
  )
}

export default function ImageToFAQPage() {
  return (
    <>
      <NextSeo
        title="Free AI Image to FAQ Generator | No Login | Copy Results"
        description="Generate FAQs for any image using our AI-powered tool. Perfect for creating quizes and test to understand image content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-faq.png',
              alt: 'AI-Powered Image to FAQ Generator',
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
                  AI-Powered Image to FAQ Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate FAQs for any image using our AI-powered tool. Perfect
                  for students, educators, and anyone who wants to create
                  quizzes and tests to learn and understand image content.
                </p>
                <ImageToFAQGenerator />
              </div>
            </div>
          </div>
        </div>
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
