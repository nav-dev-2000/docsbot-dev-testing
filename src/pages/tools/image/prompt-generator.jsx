import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Link from 'next/link'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import {
  DocumentDuplicateIcon,
  EyeIcon,
  MinusIcon,
  PlusIcon,
  TagIcon,
  ArrowUpOnSquareStackIcon,
  PaintBrushIcon,
  CameraIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { Disclosure } from '@headlessui/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import ImageDropZone from '@/components/ImageDropZone'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const ImagePromptGenerator = ({ setHasResults }) => {
  const [instructions, setInstructions] = useState('') // Renamed from description
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [promptCopied, setPromptCopied] = useState(false)
  const [image, setImage] = useState(null)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    setHasResults(!!prompt)
  }, [prompt, setHasResults])

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])

  const removeImage = () => {
    setImage(null)
  }

  const generatePrompt = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      // Check if both image and instructions are missing
      setErrorText('Please upload an image or enter instructions.')
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
        type: 'prompt',
        image: image ? image.split(',')[1] : null,
        instructions,
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setPrompt(data)

        // Track successful prompt generation
        posthog?.capture('Free Tool', {
          tool: 'AI Image to Prompt Generator',
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
          tool: 'AI Image to Prompt Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'AI Image to Prompt Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 1500)
  }

  const resetTool = () => {
    setInstructions('')
    setPrompt('')
    setErrorText(null)
    setImage(null)
  }

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={errorText} type="error" />
            {!prompt && (
              <>
                <ImageDropZone
                  image={image}
                  setImage={setImage}
                  maxSize={512}
                  isComputing={isComputing}
                />
                <div className="my-4 xl:flex xl:items-end xl:space-x-4">
                  <div className="flex-1">
                    <label htmlFor="instructions-input" className="sr-only">
                      Optional Instructions
                    </label>
                    <input
                      id="instructions-input"
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      disabled={isComputing}
                      placeholder="Optional instructions"
                      className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <button
                    onClick={generatePrompt}
                    disabled={isComputing || !image}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 xl:mt-0 xl:w-auto"
                  >
                    {isComputing ? (
                      <>
                        <LoadingSpinner /> Generating Prompt...
                      </>
                    ) : (
                      <>Generate Prompt</>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Images are never saved
                </p>
              </>
            )}
            {prompt && (
              <div className="rounded-lg bg-gray-100 p-4 text-justify">
                <h3 className="text-md mb-2 font-medium">Generated Prompt</h3>
                <div className="prose mb-4 min-w-full text-gray-700">
                  {prompt}
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                  <button
                    onClick={copyPrompt}
                    className={clsx(
                      'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                      promptCopied ? 'text-cyan-600' : 'text-gray-700',
                    )}
                  >
                    <DocumentDuplicateIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    {promptCopied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  <Link
                    href="https://www.basedlabs.ai/generate?via=docsbot"
                    target="_blank"
                    rel="noopener nofollow sponsored"
                    className="inline-flex flex-1 items-center justify-center rounded-md bg-animation px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    <ArrowUpOnSquareStackIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Generate This Image
                  </Link>
                  <button
                    onClick={resetTool}
                    className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowPathIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Try Another
                  </button>
                </div>
              </div>
            )}
            <CarbonAd className="flex justify-center mt-4" /> 
          </div>
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Image to Prompt Generator"
        toolCategory="Image"
      />
    </>
  )
}

const useCases = [
  {
    name: 'Enhance AI Image Generation',
    description:
      'Create effective prompts to improve the quality and relevance of AI-generated images, reducing wasted credits on failed attempts.',
    icon: EyeIcon,
  },
  {
    name: 'Generate Art Pieces',
    description:
      'Create detailed prompts for AI to generate unique and stunning art pieces, perfect for digital galleries or personal collections.',
    icon: PaintBrushIcon,
  },
  {
    name: 'Design Advertisements',
    description:
      'Generate precise prompts for creating eye-catching advertisements that capture attention and convey your message effectively.',
    icon: TagIcon,
  },
  {
    name: 'Enhance Social Media Visuals',
    description:
      'Craft engaging prompts for AI to generate visuals for social media platforms like LinkedIn, Instagram, and X/Twitter, boosting engagement and reach.',
    icon: ArrowUpOnSquareStackIcon,
  },
  {
    name: 'Create Blog Post Images',
    description:
      'Generate relevant and attractive images for blog posts, enhancing the visual appeal and complementing the written content.',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Develop Concept Art',
    description:
      'Use AI-generated prompts to create concept art for various projects, including video games, movies, and creative storytelling.',
    icon: CameraIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Image to Prompt Generator?',
    answer:
      'An AI Image to Prompt Generator is a tool that uses artificial intelligence to automatically create detailed prompts for image generation. It analyzes an existing image and your optional instructions to produce a textual prompt, compatible with AI models like FLUX, Stable Diffusion, DALL-E, and MidJourney.',
  },
  {
    question: 'How accurate are the generated prompts?',
    answer:
      'The accuracy of generated prompts from your image and instructions can be quite high, especially for common themes and styles. However, consider it a starting point and refine it as needed with your own creativity.',
  },
  {
    question: 'Can I use this tool for commercial purposes?',
    answer:
      'Yes, you can use the generated prompts for commercial purposes. However, we recommend reviewing and potentially editing the prompts to ensure they align with your specific needs and context.',
  },
  {
    question: 'Are there any limitations on prompt length or type?',
    answer:
      'Our tool supports various prompt formats and lengths. There may be limitations on very complex or lengthy prompts.',
  },
  {
    question: 'How can I improve the quality of generated prompts?',
    answer:
      'To get better results, provide clear, concise extra instructions with well-defined themes. You can also use the generated prompt as a starting point and refine it manually to add specific details or context relevant to your needs.',
  },
  {
    question: 'Are there any usage limits for this tool?',
    answer:
      'You can generate a limited number of AI image prompts per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit.',
  },
]

export default function ImagePromptPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="Free AI Image to Prompt Generator | Create Prompt from Image | No Login"
        description="Use our AI Image to Prompt Generator to create effective prompts for AI models like FLUX, Stable Diffusion, DALL-E, and MidJourney. Generate detailed prompts from any image to enhance your creative workflows and content marketing."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-prompt.png',
              alt: 'AI-Powered Image to Prompt Generator',
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
                  Free AI Image to Prompt Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Create effective prompts from existing images for AI image
                  generation using our prompt from image generator tool. Use it
                  with FLUX, Stable Diffusion, DALL-E, MidJourney, and other AI
                  image generation models.
                </p>
                <ImagePromptGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-image-to-prompt-generator"
                  name="AI Image to Prompt Generator - DocsBot"
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
                    Effortless AI Image Prompt Creation
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Create an AI Image Prompt from an Image
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to create detailed prompts from
                    your images in seconds. Our AI Image to Prompt Generator is
                    compatible with popular models like FLUX, Stable Diffusion,
                    DALL-E, and MidJourney.
                  </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                  <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:max-w-none lg:grid-cols-4">
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          1
                        </span>
                        Select an Image
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Upload an image that you want to generate a prompt
                          for. Supports most image formats and sizes.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Enter Optional Instructions
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Provide any additional instructions to customize the
                          prompt generation process.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Generate
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Generate Prompt' button and let our AI
                          create a detailed prompt for your image generation
                          needs.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          4
                        </span>
                        Review, Copy, Customize
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Review the generated prompt and copy it with a click
                          for any use case. Customize as needed to fit your
                          vision.
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
                    Many Applications
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Use Cases for Our AI Image to Prompt Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image Prompt Generator can
                    enhance your content and improve creative workflows across
                    various domains. Use it to generate prompts for AI models
                    such as FLUX, Stable Diffusion, DALL-E, and MidJourney.
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
  const starRatingData = await getRating('ai-image-prompt-generator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}
