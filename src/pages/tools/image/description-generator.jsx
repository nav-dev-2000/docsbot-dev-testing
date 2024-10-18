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
  ChatBubbleLeftRightIcon,
  EyeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  TagIcon,
  ArrowUpOnSquareStackIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { Disclosure } from '@headlessui/react'
import { RatingSchema, StarRating } from '@/components/StarRating'

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scaleFactor = Math.min(512 / img.width, 512 / img.height)
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

const ImageDescriptionGenerator = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [imageDescription, setImageDescription] = useState('')
  const [descriptionCopied, setDescriptionCopied] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const posthog = usePostHog()

  useEffect(() => {
    setHasResults(!!imageDescription)
  }, [imageDescription, setHasResults])

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0]
    if (file) {
      const resizedImage = await resizeImage(file)
      setImage(resizedImage)
    }
  }, [])

  const generateDescription = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload an image.')
      setIsComputing(false)

      // Track no image error
      posthog?.capture('Free Tool', {
        tool: 'Image Description Generator',
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
        type: 'description',
        image: image.split(',')[1], // Remove the data URL prefix
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setImageDescription(data)

        // Track successful description generation
        posthog?.capture('Free Tool', {
          tool: 'Image Description Generator',
          action: 'Used',
          category: 'Image',
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )

        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'Image Description Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'Image',
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')

        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Image Description Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image Description Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
  }

  const copyDescription = () => {
    const fullText = `${imageDescription}`
    navigator.clipboard.writeText(fullText)
    setDescriptionCopied(true)
    setTimeout(() => setDescriptionCopied(false), 1500)

    // Track description copy
    posthog?.capture('Free Tool', {
      tool: 'Image Description Generator',
      action: 'Copy Description',
      category: 'Image',
    })
  }

  const resetTool = () => {
    setImage(null)
    setImageDescription('')
    setErrorText(null)
    // Scroll to the image upload input
    const imageUploadElement = document.getElementById('image-upload')
    if (imageUploadElement) {
      imageUploadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Track tool reset
    posthog?.capture('Free Tool', {
      tool: 'Image Description Generator',
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
    if (imageDescription) {
      getMarkdownHtml(imageDescription)
    }
  }, [imageDescription])

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          {!imageDescription && (
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
                className="mx-auto h-auto max-w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          {!imageDescription && (
            <>
              <button
                onClick={generateDescription}
                disabled={isComputing || !image}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> Generating Description...
                  </>
                ) : (
                  <>Generate Description</>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Images are never saved
              </p>
            </>
          )}
          {imageDescription && (
            <div className="mt-4 rounded-lg bg-gray-100 p-4 text-justify">
              <h3 className="text-md mb-2 font-medium">Description</h3>
              <div
                className="prose mb-4 min-w-full text-gray-700"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
              <div className="flex gap-2">
                <button
                  onClick={copyDescription}
                  className={clsx(
                    'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                    descriptionCopied ? 'text-cyan-600' : 'text-gray-700',
                  )}
                >
                  <DocumentDuplicateIcon
                    className="mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  {descriptionCopied ? 'Copied!' : 'Copy Description'}
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
  )
}

const useCases = [
  {
    name: 'Enhance Web Accessibility',
    description:
      'Generate detailed image descriptions to improve website accessibility for visually impaired users, ensuring compliance with WCAG guidelines.',
    icon: EyeIcon,
  },
  {
    name: 'Optimize SEO for Images',
    description:
      'Create SEO-friendly alt text and descriptions for images, improving search engine rankings and image discoverability.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Improve Content Marketing',
    description:
      'Generate engaging image descriptions for blog posts, articles, and social media content to enhance user engagement and understanding.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Enhance E-commerce Product Listings',
    description:
      'Create detailed product image descriptions to improve online shopping experiences and increase conversions.',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Facilitate Image Tagging and Organization',
    description:
      'Use AI-generated descriptions to efficiently tag and organize large image libraries or databases.',
    icon: TagIcon,
  },
  {
    name: 'Enhance Social Media Posts',
    description:
      'Create compelling image descriptions for social media platforms like LinkedIn, Instagram, and X/Twitter to increase engagement and reach a wider audience.',
    icon: ArrowUpOnSquareStackIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Image Description Generator?',
    answer:
      'An AI Image Description Generator is a tool that uses artificial intelligence to automatically create detailed descriptions of images. It analyzes the content, objects, and context within an image to produce a textual description.',
  },
  {
    question: 'How accurate are the generated descriptions?',
    answer:
      'The accuracy of generated descriptions can be quite high, especially for common objects and scenes. However, complex or unusual images may require human review and adjustment for optimal accuracy.',
  },
  {
    question: 'Can I use this tool for commercial purposes?',
    answer:
      'Yes, you can use the generated descriptions for commercial purposes. However, we recommend reviewing and potentially editing the descriptions to ensure they align with your specific needs and context.',
  },
  {
    question: 'Are there any limitations on image size or type?',
    answer:
      'Our tool supports most common image formats (JPEG, PNG, GIF, WEBP) and automatically resizes images to optimize processing. There may be limitations on very large file sizes.',
  },
  {
    question: 'How can I improve the quality of generated descriptions?',
    answer:
      'To get better results, use clear, high-quality images with well-defined subjects. You can also use the generated description as a starting point and refine it manually to add specific details or context relevant to your needs.',
  },
  {
    question: 'Are there any usage limits for this tool?',
    answer:
      'You can generate a limited number of descriptions per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit.',
  },
]

export default function ImageDescriptionPage() {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="Free AI Image Description Generator | No Login | Copy Results"
        description="Generate detailed descriptions for any image using our AI-powered tool. Perfect for AI prompt generation, improving accessibility, alt text, creating image captions, or understanding image content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-description.png',
              alt: 'AI-Powered Image Description Generator',
            },
          ],
        }}
      />
      <RatingSchema
        name="AI Image Description Generator - DocsBot"
        base={4501}
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
                  Free AI Image Description Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Describe any image using our AI-powered description generator tool. Perfect for
                  creating prompts for AI image generation, improving
                  accessibility, creating image captions, or understanding image
                  content. Great for social media, e-commerce, education, and more!
                </p>
                <ImageDescriptionGenerator setHasResults={setHasResults} />
                <StarRating
                  base={4501}
                  className="mx-auto mt-12 flex justify-center text-white"
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
                    Effortless Description Creation
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our AI Image Description Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to create detailed descriptions
                    for your images in seconds.
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
                          Select and upload the image you want to describe. Our
                          tool supports various image formats.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Generate Description
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Generate Description' button and let our AI
                          analyze your image.
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
                          Review the generated description and copy it with a
                          click for any use case.
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
                    Use Cases for Our AI Image Description Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image Description Generator can
                    enhance your content and improve accessibility across
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
