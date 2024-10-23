import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { BuildingLibraryIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { Disclosure } from '@headlessui/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid'
import { 
  NewspaperIcon, 
  ChatBubbleBottomCenterTextIcon, 
  BookOpenIcon, 
  EyeIcon, 
  ViewfinderCircleIcon 
} from '@heroicons/react/24/outline'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'

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

const ImageToMarkdownConverter = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [extractedMarkdown, setExtractedMarkdown] = useState('')
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const posthog = usePostHog()

  useEffect(() => {
    setHasResults(!!extractedMarkdown)
  }, [extractedMarkdown, setHasResults])

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
    </>
  )
}

const useCases = [
  {
    name: 'Enhance AI Training Data',
    description: 'Convert image-based content into markdown format to create rich, structured datasets for training language models and chatbots.',
    icon: BuildingLibraryIcon,
  },
  {
    name: 'Streamline Content Publishing',
    description: 'Transform screenshots and image-based content into markdown for quick integration into blogs, wikis, and documentation systems.',
    icon: NewspaperIcon,
  },
  {
    name: 'Improve LLM Context',
    description: 'Extract markdown from images to provide better context for large language models, enhancing their understanding and responses.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Automate Knowledge Base Creation',
    description: 'Convert image-heavy documents into searchable, markdown-formatted knowledge bases for AI-powered chatbots and virtual assistants.',
    icon: BookOpenIcon,
  },
  {
    name: 'Enhance Content Accessibility',
    description: 'Transform visual content into markdown, making it more accessible for screen readers and improving SEO for AI-driven content discovery.',
    icon: EyeIcon,
  },
  {
    name: 'Facilitate Multi-Modal AI',
    description: 'Bridge the gap between visual and textual data by converting images to markdown, enabling more sophisticated multi-modal AI applications.',
    icon: ViewfinderCircleIcon,
  },
]

const faqs = [
  {
    question: 'How can this tool benefit AI and LLM developers?',
    answer: 'Our Image to Markdown Extractor is invaluable for AI and LLM developers. It allows you to convert visual information into structured markdown, which can be used to enhance training datasets, improve context understanding for language models, and create more comprehensive knowledge bases for chatbots and virtual assistants.',
  },
  {
    question: 'Can I use the extracted markdown for training custom AI models?',
    answer: 'Absolutely! The markdown extracted from images can be an excellent source of structured data for training custom AI models, including language models and chatbots. It helps in creating diverse and rich datasets that combine visual and textual information.',
  },
  {
    question: 'How does this tool support content publishers and marketers?',
    answer: 'Content publishers and marketers can use this tool to quickly convert image-based content, infographics, or screenshots into markdown format. This streamlines the process of repurposing visual content for blogs, social media, and other digital platforms, saving time and maintaining consistency in content structure.',
  },
  {
    question: 'Is the extracted markdown suitable for SEO optimization?',
    answer: 'Yes, the markdown extracted from images can significantly boost SEO efforts. It allows search engines to index the content within images, improving discoverability. Additionally, you can easily modify the extracted markdown to include relevant keywords and meta-information, enhancing your content\'s SEO performance.',
  },
  {
    question: 'How can this tool enhance chatbot development?',
    answer: 'For chatbot developers, this tool offers a way to convert visual information into text-based data that chatbots can process. This is particularly useful for creating comprehensive knowledge bases, handling image-based queries, and improving the chatbot\'s ability to understand and respond to diverse types of input.',
  },
  {
    question: 'Can the extracted markdown be used in multi-modal AI applications?',
    answer: 'Definitely! The markdown extracted from images serves as a bridge between visual and textual data, making it ideal for multi-modal AI applications. It allows you to create datasets and models that can process and understand information across different modalities, leading to more sophisticated and versatile AI systems.',
  },
]

export default function ImageToMarkdownPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="Free AI Image to Markdown Extractor | Enhance LLM Training & Content Publishing"
        description="Convert images to markdown with our AI-powered tool. Perfect for LLM training, chatbot development, and streamlined content publishing. No signup required."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-markdown.png',
              alt: 'AI-Powered Image to Markdown Generator',
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
                <ImageToMarkdownConverter setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-image-markdown-extractor"
                  name="AI Image to Markdown Extractor - DocsBot"
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
                    Streamlined Markdown Extraction
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our AI Image to Markdown Converter
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to transform your images into structured markdown in seconds.
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
                          Select and upload the image containing the content you want to convert to markdown. We support various image formats.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Extract Markdown
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Extract Markdown' button and let our AI analyze your image and convert it to structured markdown.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Review and Utilize
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Review the extracted markdown, make any necessary edits, and copy it for use in your AI training, content publishing, or chatbot development projects.
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
                    AI-Powered Applications
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Use Cases for Our AI Image to Markdown Converter
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image to Markdown Converter can revolutionize your AI development, content publishing, and chatbot creation workflows.
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
  const starRatingData = await getRating('ai-image-markdown-extractor')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
