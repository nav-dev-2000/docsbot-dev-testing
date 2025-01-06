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
  MegaphoneIcon,
  ShoppingCartIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  EyeSlashIcon,
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

// Custom SVG components for social media icons
const LinkedInIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14.285 10.172L23.222 0h-2.117L14.357 8.83 7.147 0H0l9.37 13.354L0 24.02h2.117l8.192-9.327 6.544 9.327h7.147M2.881 1.563h3.252L21.119 22.54h-3.252" />
  </svg>
)

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
  </svg>
)

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const socialMediaFeatures = [
  {
    name: 'LinkedIn',
    description:
      'Generate professional captions that highlight your expertise, share industry insights, or showcase your company culture. Perfect for B2B marketing and personal branding.',
    icon: LinkedInIcon,
  },
  {
    name: 'X/Twitter',
    description:
      'Create concise, engaging captions that fit within character limits. Ideal for news updates, quick insights, or witty remarks that encourage retweets and discussions.',
    icon: TwitterIcon,
  },
  {
    name: 'Instagram',
    description:
      'Craft visually descriptive captions that complement your images, tell a story, and encourage engagement. Great for lifestyle brands, influencers, and visual storytelling.',
    icon: InstagramIcon,
  },
  {
    name: 'Facebook',
    description:
      'Generate longer-form captions that provide context, spark conversations, and drive engagement. Suitable for community building, event promotion, and detailed updates.',
    icon: FacebookIcon,
  },
]

const ImageCaptionGenerator = ({ setHasResults }) => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [imageCaption, setImageCaption] = useState('')
  const [captionCopied, setCaptionCopied] = useState(false)
  const [selectedVibe, setSelectedVibe] = useState('fun')
  const [showSignupModal, setShowSignupModal] = useState(false)
  const posthog = usePostHog()
  
  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  useEffect(() => {
    if (imageCaption) {
      setHasResults(true)
    } else {
      setHasResults(false)
    }
  }, [imageCaption])

  const generateCaption = async () => {
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
        type: 'caption',
        image: image.split(',')[1],
        vibe: selectedVibe,
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setImageCaption(data)

        // Track successful caption generation
        posthog?.capture('Free Tool', {
          tool: 'Image Caption Generator',
          action: 'Used',
          vibe: selectedVibe,
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
          tool: 'Image Caption Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image',
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)

      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image Caption Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image',
      })
    }

    setIsComputing(false)
  }

  const copyCaption = () => {
    navigator.clipboard.writeText(imageCaption)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 1500)
  }

  const resetTool = () => {
    setImage(null)
    setImageCaption('')
    setErrorText(null)
    // Scroll to the image upload input
    window.scrollTo({ top: 200, behavior: 'smooth' })
  }

  const vibeOptions = [
    { label: '🎉 Fun', value: 'fun' },
    { label: '😂 Joke', value: 'joke' },
    { label: '😆 Funny', value: 'funny' },
    { label: '😊 Happy', value: 'happy' },
    { label: '🧐 Serious', value: 'serious' },
    { label: '😢 Sad', value: 'sad' },
    { label: '😠 Angry', value: 'angry' },
    { label: '🤩 Ecstatic', value: 'ecstatic' },
    { label: '🤔 Curious', value: 'curious' },
    { label: '📚 Informative', value: 'informative' },
    { label: '🥰 Cute', value: 'cute' },
    { label: '😎 Cool', value: 'cool' },
    { label: '🔥 Controversial', value: 'controversial' },
  ]

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          {!imageCaption && (
            <>
              <div className="mb-4">
                <ImageDropZone
                  image={image}
                  setImage={setImage}
                  maxSize={512}
                  isComputing={isComputing}
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select a Vibe/Tone
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {vibeOptions.map((vibe) => (
                    <label
                      key={vibe.value}
                      className="inline-flex items-center"
                    >
                      <input
                        type="radio"
                        name="vibe"
                        value={vibe.value}
                        checked={selectedVibe === vibe.value}
                        onChange={(e) => setSelectedVibe(e.target.value)}
                        className="hidden"
                      />
                      <span
                        className={`cursor-pointer rounded-full px-3 py-1 text-sm ${
                          selectedVibe === vibe.value
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {vibe.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          {!imageCaption && (
            <>
              <button
                onClick={generateCaption}
                disabled={isComputing || !image}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> Generating Caption...
                  </>
                ) : (
                  <>Generate Caption</>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Images are never saved
              </p>
            </>
          )}
          {imageCaption && (
            <>
              <div className="mb-4">
                <img
                  src={image}
                  alt="Preview"
                  className="mx-auto max-h-[60vh] max-w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="mt-4 rounded-lg bg-gray-100 p-4 text-justify">
                <p className="mb-4 text-gray-700">{imageCaption}</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <button
                    onClick={copyCaption}
                    className={clsx(
                      'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                      captionCopied ? 'text-cyan-600' : 'text-gray-700',
                    )}
                  >
                    <DocumentDuplicateIcon
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    {captionCopied ? 'Copied!' : 'Copy Caption'}
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

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Image Caption Generator"
        toolCategory="Image"
      />
    </div>
  )
}

const useCases = [
  {
    name: 'Create Engaging Social Media Captions',
    description:
      'Use AI to generate creative and engaging captions for your images, perfect for boosting social media engagement and reach.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Generate Captions for Content Marketing',
    description:
      'Automatically create compelling image captions for blog posts and landing pages, enhancing your content marketing with optimized text.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Craft Personalized Image Captions for E-commerce',
    description:
      'Generate product-specific captions that help convert visitors into buyers, using AI to create engaging descriptions for your product photos.',
    icon: ShoppingCartIcon,
  },
  {
    name: 'Optimize Captions for Instagram and Pinterest',
    description:
      'Automatically generate engaging captions for Instagram or Pinterest, increasing visibility and social media traffic.',
    icon: HashtagIcon,
  },
  {
    name: 'SEO-Friendly Captions for Blog Images',
    description:
      'Use AI to create SEO-optimized captions for images in your blog posts, helping to improve search engine rankings.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Generate Accessible Image Descriptions',
    description:
      'Create detailed, descriptive captions for images to improve web accessibility, helping visually impaired users better understand your content.',
    icon: EyeSlashIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Image Caption Generator?',
    answer:
      'An AI Image Caption Generator is a tool that uses artificial intelligence to automatically create descriptive and engaging captions for images. It analyzes the content of the image and generates relevant text to accompany it.',
  },
  {
    question: 'How accurate are the generated captions?',
    answer:
      'The accuracy of generated captions can vary depending on the complexity of the image and the AI model used. Our tool uses advanced AI technology to provide high-quality captions, but we recommend reviewing and adjusting them as needed for your specific context.',
  },
  {
    question: 'Can I use this tool for commercial purposes?',
    answer:
      'Yes, you can use the generated captions for commercial purposes. However, we recommend reviewing and potentially editing the captions to ensure they align with your brand voice and specific needs.',
  },
  {
    question: 'Are there any limitations on image size or type?',
    answer:
      'Our tool supports most common image formats (JPEG, PNG, GIF, WEBP) and automatically resizes images to optimize processing.',
  },
  {
    question: 'How can I improve the quality of generated captions?',
    answer:
      'To get better results, use high-quality images with clear subjects and try selecting different vibes or tones. You can also use the generated caption as a starting point and refine it manually to better fit your needs.',
  },
  {
    question: 'Are there any usage limits for this tool?',
    answer:
      'You can generate a limited number of captions per day without creating an account. For increased usage, you can sign up for a free account to get a higher daily limit. This allows you to use the tool more extensively while still enjoying it at no cost.',
  },
]

export default function ImageCaptionPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <NextSeo
        title="100% Free AI Image Caption Generator | No Login"
        description="Generate creative captions for any image using our free AI tool. No signup needed. Perfect for Instagram, ALT text, and social media posts. Multiple tones available."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-caption.png',
              alt: 'Free AI-Powered Image Caption Generator',
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
                  100% Free AI Image Caption Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate creative captions for any image using our AI-powered
                  tool. No login required. Perfect for Instagram, ALT text, and
                  social media posts. Choose from multiple tones to craft the
                  perfect caption.
                </p>
                <ImageCaptionGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-image-caption-generator"
                  name="AI Image Caption Generator - DocsBot"
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
                    Effortless Caption Creation
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our Free AI Image Caption Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to create engaging captions for
                    your images in seconds, no login required.
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
                          Select and upload the image you want to caption. Our
                          tool supports various image formats.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Choose a Vibe
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Select the desired tone or vibe for your caption from
                          our list of options.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Generate and Customize
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click 'Generate Caption' and review the result. Adjust
                          or refine as needed for your perfect caption.
                        </p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                  <h2 className="text-pretty text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Create Captions for Top Social Platforms
                  </h2>
                  <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
                    {socialMediaFeatures.map((feature) => (
                      <div key={feature.name}>
                        <dt className="text-base font-semibold leading-7 text-gray-900">
                          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                            <feature.icon
                              className="h-6 w-6 text-white"
                              aria-hidden="true"
                            />
                          </div>
                          {feature.name}
                        </dt>
                        <dd className="mt-1 text-base leading-7 text-gray-600">
                          {feature.description}
                        </dd>
                      </div>
                    ))}
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
                    Use Cases for Our Free AI Image Caption Generator
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our AI-powered Image Caption Generator can
                    enhance your content creation across various domains,
                    including Instagram, ALT text, and more.
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
          description="Take your AI experience further! Train a custom chatbot with your content, chat with images, and explore advanced AI-powered tools for personalized interactions with your data."
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
  const starRatingData = await getRating('ai-image-caption-generator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}
