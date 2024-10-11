import { NextSeo } from 'next-seo'
import { useState, useCallback, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { CodeBracketSquareIcon } from '@heroicons/react/24/outline'
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

const ImageToMarkdownConverter = () => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [extractedMarkdown, setExtractedMarkdown] = useState('')
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const posthog = usePostHog()

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0]
      if (file) {
        const resizedImage = await resizeImage(file)
        setImage(resizedImage)

        // Track image upload
        posthog?.capture('Free Tool', {
          tool: 'Image to Markdown Converter',
          action: 'Upload Image',
          category: 'Image',
        })
      }
    },
    [posthog],
  )

  const extractMarkdown = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload an image.')
      setIsComputing(false)

      // Track no image error
      posthog?.capture('Free Tool', {
        tool: 'Image to Markdown Converter',
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
        type: 'text',
        image: image.split(',')[1], // Remove the data URL prefix
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setExtractedMarkdown(data)

        // Track successful markdown extraction
        posthog?.capture('Free Tool', {
          tool: 'Image to Markdown Converter',
          action: 'Used',
          category: 'Image',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )

        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'Image to Markdown Converter',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'Image',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Image to Markdown Converter',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image to Markdown Converter',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
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
    if (extractedMarkdown) {
      getMarkdownHtml(extractedMarkdown)
    }
  }, [extractedMarkdown])

  const copyMarkdown = () => {
    navigator.clipboard.writeText(extractedMarkdown)
    setMarkdownCopied(true)
    setTimeout(() => setMarkdownCopied(false), 1500)

    // Track markdown copy
    posthog?.capture('Free Tool', {
      tool: 'Image to Markdown Converter',
      action: 'Copy Markdown',
      category: 'Image',
    })
  }

  const resetTool = () => {
    setImage(null)
    setExtractedMarkdown('')
    setErrorText(null)

    // Track tool reset
    posthog?.capture('Free Tool', {
      tool: 'Image to Markdown Converter',
      action: 'Reset Tool',
      category: 'Image',
    })
  }

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={errorText} type="error" />
            {!extractedMarkdown && (
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
                  className="mx-auto h-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
                />
              </div>
            )}
            {!extractedMarkdown && (
              <>
                <button
                  onClick={extractMarkdown}
                  disabled={isComputing || !image}
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> Extracting Markdown...
                    </>
                  ) : (
                    <>Extract Markdown</>
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Images are never saved
                </p>
              </>
            )}
            {extractedMarkdown && (
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-left">
                <h3 className="text-md mb-2 font-medium">Extracted Markdown</h3>
                <div
                  className="prose mb-4 min-w-full text-gray-700"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={copyMarkdown}
                    className={clsx(
                      'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                      markdownCopied ? 'text-cyan-600' : 'text-gray-700',
                    )}
                  >
                    <CodeBracketSquareIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    {markdownCopied ? 'Copied!' : 'Copy Markdown'}
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
      {!extractedMarkdown && (
        <div className="text-justify text-gray-300">
          <p className="mt-6 text-lg leading-8">
            Extract markdown from any image using our advanced{' '}
            <strong>AI-powered OCR tool</strong>. Perfect for:
          </p>
          <ul className="mb-4 ml-8 mt-2 list-inside list-disc">
            <li>
              <em>Digitizing</em> printed documents and books
            </li>
            <li>
              <em>Transcribing</em> handwritten notes and letters
            </li>
            <li>
              <em>Converting</em> scanned documents to editable markdown
            </li>
            <li>
              <em>Translating</em> foreign language in images to markdown
            </li>
            <li>
              <em>Archiving</em> and indexing image-based content preserving formatting
            </li>
          </ul>
          <h3 className="mt-6 text-lg font-medium">Key features:</h3>
          <ul className="mb-4 ml-8 mt-2 list-inside list-disc">
            <li>
              Supports <em>multiple languages</em> and various image formats
            </li>
            <li>
              <em>No signup required</em> - start extracting markdown from
              images instantly
            </li>
            <li>
              Ideal for{' '}
              <em>
                students, researchers, professionals, AI developers, ChatGPT users, and content
                creators
              </em>
            </li>
            <li>
              Convert images to <em>searchable, editable, and translatable</em>{' '}
              markdown that preserves formatting
            </li>
          </ul>
          <p className="mt-6 text-lg leading-8">
            <strong>Boost productivity</strong>, <strong>save time</strong>, and{' '}
            <strong>unlock the potential</strong> of your visual content with
            our <em>free image to markdown converter</em>. Transform{' '}
            <strong>screenshots, photos, memes, and more</strong> into usable
            markdown effortlessly.
          </p>
        </div>
      )}
    </>
  )
}

export default function ImageToMarkdownPage() {
  return (
    <>
      <NextSeo
        title="Free AI Image to Markdown Extractor | No Login | Copy Formatted Results"
        description="Extract markdown from any image using our OCR AI tool with no-signup. Perfect for digitizing documents, transcribing handwritten notes, or extracting markdown from screenshots and photos to repurpose in other content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-markdown.png',
              alt: 'AI-Powered Image to Markdown Generator',
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
                  Free AI Image to Markdown Extractor/Converter
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Extract and convert any image into markdown using our
                  AI-powered tool. Perfect for digitizing documents,
                  transcribing handwritten notes, or extracting markdown from
                  screenshots and photos while preserving the formatting. Use as
                  context for LLMs or as a prompt for AI models. Use for RAG
                  over images.
                </p>
                <ImageToMarkdownConverter />
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
