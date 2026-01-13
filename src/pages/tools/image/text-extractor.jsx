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
  PencilSquareIcon,
  CameraIcon,
  EyeIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  MinusIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { Streamdown, defaultRemarkPlugins } from 'streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import { Disclosure } from '@headlessui/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ImageDropZone from '@/components/ImageDropZone'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const useCases = [
  {
    name: 'Digitize Printed Documents',
    description:
      'Convert scanned books, articles, and documents into editable and searchable text, saving time on manual transcription.',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Transcribe Handwritten Notes',
    description:
      'Transform handwritten notes, letters, and journals into digital text for easy archiving and searching.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Extract Text from Images',
    description:
      'Capture text from screenshots, photos, and graphics to repurpose content or gather information quickly.',
    icon: CameraIcon,
  },
  {
    name: 'Enhance Accessibility',
    description:
      'Create text alternatives for images, improving web accessibility for visually impaired users.',
    icon: EyeIcon,
  },
  {
    name: 'Translate Visual Content',
    description:
      'Extract text from foreign language signs, menus, or documents for easy translation.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Data Entry Automation',
    description:
      'Streamline data entry processes by automatically extracting text from forms, receipts, and business cards.',
    icon: ClipboardDocumentIcon,
  },
]

const faqs = [
  {
    question: 'How accurate is the image to text conversion?',
    answer:
      'Our AI-powered OCR technology offers high accuracy for most clear, well-lit images. However, factors like image quality, font complexity, and background noise can affect results. We recommend reviewing and editing the output for optimal accuracy.',
  },
  {
    question: 'What image formats are supported?',
    answer:
      'Our tool supports common image formats including JPEG, PNG, GIF, and WEBP. For best results, use high-resolution images with clear, contrasting text.',
  },
  {
    question: 'Can it handle handwritten text?',
    answer:
      'Yes, our AI can process handwritten text, though accuracy may vary depending on the clarity and style of handwriting. Printed text generally yields more accurate results.',
  },
  {
    question: 'Is there a limit on image size or number of images?',
    answer:
      "There's no strict limit on image size, but larger images may take longer to process. We automatically resize images to optimize performance. You can process multiple images, but there's a daily limit for free users.",
  },
  {
    question: 'How is my data handled?',
    answer:
      'We prioritize your privacy and security. Uploaded images are processed in real-time and are not stored on our servers. The extracted text is temporarily held for display and is deleted after your session ends.',
  },
  {
    question: 'Can I use the extracted text for commercial purposes?',
    answer:
      'Yes, you can use the extracted text for both personal and commercial purposes. However, ensure you have the necessary rights to use the original image content.',
  },
]

const ImageToTextGenerator = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [textCopied, setTextCopied] = useState(false)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  const extractText = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload an image.')
      setIsComputing(false)
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
        setExtractedText(data)

        // Track successful text extraction
        posthog?.capture('Free Tool', {
          tool: 'Image to Text Generator',
          action: 'Used',
          category: 'Image',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow.',
        )
        setShowSignupModal(true)
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Image to Text Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image to Text Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  useEffect(() => {
    setHasResults(!!extractedText)
  }, [extractedText, setHasResults])

  const copyText = () => {
    navigator.clipboard.writeText(extractedText)
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 1500)
  }

  const resetTool = () => {
    setImage(null)
    setExtractedText('')
    setErrorText(null)
    // Scroll to the image upload input
    window.scrollTo({ top: 200, behavior: 'smooth' })
  }

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={errorText} type="error" />
            {!extractedText && (
              <div className="mb-4">
                <ImageDropZone
                  image={image}
                  setImage={setImage}
                  maxSize={2048}
                  isComputing={isComputing}
                />
              </div>
            )}
            {!extractedText && (
              <>
                <button
                  onClick={extractText}
                  disabled={isComputing || !image}
                  className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> Extracting Text...
                    </>
                  ) : (
                    <>Extract Text</>
                  )}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Images are never saved
                </p>
              </>
            )}
            {extractedText && (
              <>
                <div className="mb-4">
                  <img
                    src={image}
                    alt="Preview"
                    className="mx-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-4 rounded-lg bg-gray-100 p-4 text-left">
                  <h3 className="text-md mb-2 font-medium">Extracted Text</h3>
                  <div className="prose mb-4 min-w-full text-gray-700">
                    <Streamdown
                      mode="static"
                      isAnimating={false}
                      remarkPlugins={streamdownRemarkPlugins}
                    >
                      {preprocessMath(extractedText)}
                    </Streamdown>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      onClick={copyText}
                      className={clsx(
                        'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                        textCopied ? 'text-cyan-600' : 'text-gray-700',
                      )}
                    >
                      <DocumentDuplicateIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      {textCopied ? 'Copied!' : 'Copy Text'}
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
            <CarbonAd className="flex justify-center mt-4" /> 
          </div>
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Image to Text Generator"
        toolCategory="Image"
      />
    </>
  )
}

export default function ImageToTextPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="Free AI Image to Text Extractor | No Login | Copy Formatted Results"
        description="Extract text from any image using our OCR AI tool with no-signup. Perfect for digitizing documents, transcribing handwritten notes, or extracting text from screenshots and photos to repurpose in other content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-to-text.png',
              alt: 'AI-Powered Image to Text Generator',
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
                  Free AI Image to Text Extractor
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Extract text from any image or picture using our AI-powered
                  tool. Perfect for digitizing documents, transcribing
                  handwritten notes, or extracting text from screenshots and
                  photos. No signup required.
                </p>
                <ImageToTextGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-image-text-extractor"
                  name="AI Image to Text Extractor - DocsBot"
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
                    Effortless Text Extraction
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our AI Image to Text Converter
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to extract text from your images
                    in seconds.
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
                          Select and upload the image containing the text you
                          want to extract. We support various image formats.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Extract Text
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Extract Text' button and let our AI analyze
                          your image and convert it to text.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Review and Copy
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Review the extracted text, make any necessary edits,
                          and copy it with a single click for your use.
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
                    Versatile Applications
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Use Cases for Our AI Image to Text Converter
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image to Text Converter can
                    streamline your workflow and enhance productivity across
                    various domains.
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
  const starRatingData = await getRating('ai-image-text-extractor')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
