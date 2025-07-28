import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import {
  PencilSquareIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  LightBulbIcon,
  CheckIcon,
  UserIcon,
  BoltIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Generating your slogans...',
  'Crafting catchy phrases...',
  'Finding the perfect hook...',
  'Creating memorable taglines...',
  'Finalizing your slogans...',
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

const tones = [
  {
    name: 'Professional',
    emoji: '💼',
    description: 'Clean, trustworthy slogans for business and corporate brands',
  },
  {
    name: 'Playful',
    emoji: '🎉',
    description: 'Fun, energetic slogans that bring joy and excitement',
  },
  {
    name: 'Bold',
    emoji: '🔥',
    description: 'Strong, confident slogans that make a powerful statement',
  },
  {
    name: 'Luxury',
    emoji: '✨',
    description: 'Sophisticated, premium slogans for high-end brands',
  },
  {
    name: 'Friendly',
    emoji: '😊',
    description: 'Warm, approachable slogans that feel personal',
  },
  {
    name: 'Creative',
    emoji: '🎨',
    description: 'Imaginative, artistic slogans that stand out',
  },
  {
    name: 'Inspiring',
    emoji: '🚀',
    description: 'Motivational slogans that encourage and uplift',
  },
  {
    name: 'Witty',
    emoji: '😄',
    description: 'Clever, humorous slogans with wordplay',
  },
  {
    name: 'Modern',
    emoji: '📱',
    description: 'Contemporary slogans for tech and trendy brands',
  },
  {
    name: 'Authentic',
    emoji: '🌱',
    description: 'Genuine, honest slogans that build trust',
  },
  {
    name: 'Energetic',
    emoji: '⚡',
    description: 'Dynamic slogans full of action and movement',
  },
  {
    name: 'Minimalist',
    emoji: '○',
    description: 'Simple, clean slogans that say more with less',
  },
]

const AISloganComponent = () => {
  const [brandName, setBrandName] = useState('')
  const [industry, setIndustry] = useState('')
  const [keywords, setKeywords] = useState('')
  const [sloganCount, setSloganCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [generatedSlogans, setGeneratedSlogans] = useState([])
  const [selectedStyle, setSelectedStyle] = useState(tones[0])
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  const generateSlogans = async (brandInput, industryInput, keywordsInput, style) => {
    setIsGenerating(true)
    setErrorText('')

    if (!brandInput.trim() || !industryInput.trim()) {
      setErrorText('Please enter both brand name and industry to generate slogans.')
      setIsGenerating(false)
      posthog?.capture('Free Tool', {
        tool: 'AI Slogan Generator',
        action: 'Error',
        error: 'Empty Input',
        category: 'Writing',
      })
      return
    }

    const endpoint = `/api/tools/text-prompter`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'slogan',
          brandName: brandInput,
          industry: industryInput,
          keywords: keywordsInput,
          tone: style.name + ' - ' + style.description,
          sloganCount: sloganCount,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText('Daily usage limit exceeded, please try again tomorrow.')
          setShowSignupModal(true)
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'AI Slogan Generator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        // Parse slogans from response (assuming they come as a list or newline-separated)
        const slogans = data.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
        
        setGeneratedSlogans((prevResults) => [
          {
            slogans: slogans,
            style: style,
            brandName: brandInput,
            industry: industryInput,
            keywords: keywordsInput,
            stats: {
              count: slogans.length,
              averageLength: Math.round(slogans.reduce((acc, slogan) => acc + slogan.length, 0) / slogans.length),
            },
          },
          ...prevResults,       
        ])
        posthog?.capture('Free Tool', {
          tool: 'AI Slogan Generator',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Slogan Generator',
        action: 'Error',
        error: e.message,
        category: 'Writing',
      })
    }

    setIsGenerating(false)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-4">
          <Alert title={errorText} type="error" />

          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div>
              <label
                htmlFor="brandName"
                className="block w-full text-left text-sm font-medium text-gray-700"
              >
                Brand Name *
              </label>
              <input
                id="brandName"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter your brand name..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="block w-full text-left text-sm font-medium text-gray-700"
              >
                Industry or Niche *
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. skincare, AI tools, coffee shop..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="keywords"
              className="block w-full text-left text-sm font-medium text-gray-700"
            >
              Keywords or Values (Optional)
            </label>
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. eco-friendly, affordable, fast, powerful, premium..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {/* Tone Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tone
              </label>
              <select
                value={selectedStyle.name}
                onChange={(e) =>
                  setSelectedStyle(tones.find((t) => t.name === e.target.value))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              >
                {tones.map((tone) => (
                  <option key={tone.name} value={tone.name}>
                    {tone.emoji} {tone.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {selectedStyle.description}
              </p>
            </div>

            {/* Number of Slogans */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Slogans
              </label>
              <select
                value={sloganCount}
                onChange={(e) => setSloganCount(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              >
                {[3, 5, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} slogans
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            onClick={() => generateSlogans(brandName, industry, keywords, selectedStyle)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner /> <LoadingText />
              </>
            ) : (
              <>Generate Slogans</>
            )}
          </button>

          <CarbonAd className="flex justify-center mt-4" /> 
          
          {generatedSlogans.map((result, index) => (
            <GeneratedResult key={index} result={result} />
          ))}

          {generatedSlogans.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBrandName('')
                setIndustry('')
                setKeywords('')
                setGeneratedSlogans([])
              }}
              className="mt-8 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      <ToolsSignupModal
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="AI Slogan Generator"
        toolCategory="Writing"
      />
    </div>
  )
}

const GeneratedResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(null)

  const copyToClipboard = (slogan, index) => {
    navigator.clipboard.writeText(slogan).then(() => {
      setCopySuccess(index)
      setTimeout(() => setCopySuccess(null), 2000)
    })
  }

  return (
    <div className="relative mt-6">
      <div className="mb-3 ml-1 flex items-baseline justify-between">
        <div className="text-sm text-gray-600">
          {result.stats.count} slogans • {result.style.emoji} {result.style.name} tone • 
          Avg. {result.stats.averageLength} characters
        </div>
        <div className="text-xs text-gray-500">
          {result.brandName} • {result.industry}
        </div>
      </div>
      
      <div className="space-y-2">
        {result.slogans.map((slogan, index) => (
          <div key={index} className="group relative flex items-center justify-between rounded-md bg-gray-50 p-3 hover:bg-gray-100">
            <div className="flex-1 text-left">
              <p className="text-gray-900 font-medium">{slogan}</p>
            </div>
            <button
              onClick={() => copyToClipboard(slogan, index)}
              type="button"
              className="ml-3 rounded-md bg-gray-100 p-1 opacity-0 transition-all hover:bg-gray-200 group-hover:opacity-100"
              title="Copy to clipboard"
            >
              <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
            </button>
            {copySuccess === index && (
              <span className="absolute right-12 text-sm text-cyan-600">
                Copied!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Brand Identity',
    description:
      'Generate slogans that resonate with your brand personality and values, helping to establish a strong, memorable presence in your industry.',
    icon: SparklesIcon,
  },
  {
    name: 'Product Marketing',
    description:
      'Create compelling slogans for your products that highlight key features, benefits, and unique selling points.',
    icon: BuildingStorefrontIcon,
  },
  {
    name: 'Service Differentiation',
    description:
      'Generate slogans that set your service apart from competitors, emphasizing your expertise and value proposition.',
    icon: TagIcon,
  },
  {
    name: 'Startup Launch',
    description:
      'Help launch your new business with a memorable, attention-grabbing slogan that communicates your vision and mission.',
    icon: LightBulbIcon,
  },
  {
    name: 'Content Marketing',
    description:
      'Generate slogans for blog posts, articles, and social media content to make your content more engaging and shareable.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Social Media',
    description:
      'Create catchy, shareable slogans for your social media channels that capture attention and encourage engagement.',
    icon: MegaphoneIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Slogan Generator?',
    answer:
      'An AI Slogan Generator is a powerful tool that uses artificial intelligence to create unique, memorable slogans for your brand. Simply input your brand name, industry, and desired tone, and the AI will generate well-crafted slogans that resonate with your target audience.',
  },
  {
    question: 'How does the AI Slogan Generator work?',
    answer:
      'Our AI Slogan Generator uses advanced machine learning models to understand your brand and industry context, as well as your desired tone and keyword preferences. It considers the number of slogans you want to generate and generates relevant, engaging content that aligns with your brand identity.',
  },
  {
    question: 'Is the AI Slogan Generator free to use?',
    answer:
      'Yes, our AI Slogan Generator is free to use with a daily limit. You can generate multiple slogans in various tones without creating an account. For increased usage and additional features, consider signing up for a free account.',
  },
  {
    question: 'What writing styles are available?',
    answer:
      'We offer 12 different writing styles including Professional, Playful, Bold, Luxury, Friendly, Creative, Inspiring, Witty, Modern, Authentic, Energetic, and Minimalist. Each style has its own unique characteristics to suit your specific needs.',
  },
  {
    question: 'How many slogans can I generate at once?',
    answer:
      'You can generate up to 10 slogans at once. Each slogan will maintain consistency in style and tone while providing unique content related to your chosen brand and industry.',
  },
  {
    question: 'Is the generated content unique?',
    answer:
      'Yes, each slogan generated is unique and created specifically for your brand. The AI creates original content every time, helping you avoid duplicate content issues.',
  },
  {
    question: 'Can I use the generated slogans for commercial purposes?',
    answer:
      'Yes, all generated slogans are free to use for any purpose, including commercial use. You own the rights to the content generated using our tool.',
  },
  {
    question: 'How can I ensure the best results?',
    answer:
      'For optimal results, provide clear brand name, industry, and select the most appropriate tone for your needs. Consider adding relevant keywords or values to help the AI generate more contextually relevant slogans.',
  },
  {
    question: 'What makes this AI generator slogan tool different?',
    answer: 'Our AI generator slogan tool stands out by offering 12 distinct writing styles, instant generation without signup, and the ability to create multiple slogans at once. It uses advanced AI to ensure each generated slogan is unique, coherent, and perfectly matches your chosen style and brand.',
  },
  {
    question: 'Why choose our free AI slogan generator?',
    answer: 'Our AI slogan generator is completely free to use, requires no login, and offers 12 different writing styles. Unlike other tools, we provide instant results with no hidden fees or complicated signup process.',
  },
  {
    question: 'How does our AI generator slogan tool work?',
    answer: 'Our slogan AI generator uses advanced machine learning to analyze your brand and industry context, as well as your desired tone and keyword preferences. Simply enter your brand name, industry, and let our AI create perfect slogans instantly.',
  },
]

export default function AISloganGeneratorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Slogan Generator | No Login | Create Catchy Taglines"
        description="Generate unique, memorable slogans instantly with our free AI slogan generator. No signup needed. Create catchy taglines for brands, products & services with 12 tones."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/slogan-generator.png',
              alt: 'Free AI Slogan Generator Tool',
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
                AI Slogan Generator
                <span className="block text-2xl mt-2 font-normal text-cyan-400">Free Online Tool - No Login Required</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate unique, catchy slogans instantly with our free AI slogan generator. 
                  Choose from 12 different tones to create perfect taglines for brands, products, services and more - 
                  no signup required.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "100% Free",
                      description: "Use our AI slogan generator without any cost or signup"
                    },
                    {
                      title: "Instant Results", 
                      description: "Generate AI slogans in seconds with our advanced technology"
                    },
                    {
                      title: "Multiple Styles",
                      description: "Create slogans in 12 different writing styles and tones"
                    }
                  ].map((benefit) => (
                    <div key={benefit.title} className="rounded-lg bg-white/10 p-4">
                      <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{benefit.description}</p>
                    </div>
                  ))}
                </div>
                <AISloganComponent />
                <StarRating
                  itemId="ai-slogan-generator"
                  name="AI Slogan Generator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Create Content with Custom Trained Chatbots"
          description="Leverage your own custom trained chatbots to generate content in any style or tone, grounded in your documentation and content. Use internally or deploy to your website."
          button="Create your Free Chatbot"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Simple & Powerful
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our AI Slogan Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create engaging, memorable slogans in just a few clicks
                with our intuitive interface.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:max-w-none xl:grid-cols-4">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Enter Your Brand Name
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Type in your brand name to help the AI understand your
                      business.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Add Your Industry
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Specify your industry or niche to help generate relevant
                      slogans.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Choose Your Tone
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select from 12 different tones to match your brand
                      personality.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      4
                    </span>
                    Generate & Copy
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click generate to create multiple slogans and copy your
                      favorites.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Powerful Features
              </h2>
              <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Advanced AI Writing Capabilities
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Our AI slogan generator combines powerful features to help
                you create high-quality, engaging content quickly and easily.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Intelligent Brand Analysis',
                    description:
                      'Simply input your brand name and industry, and our AI analyzes the context to generate relevant, coherent slogans that match your brand identity.',
                    icon: LightBulbIcon,
                  },
                  {
                    name: 'Customizable Length',
                    description:
                      'Generate between 3-10 slogans at once while maintaining consistency and natural flow throughout the content.',
                    icon: DocumentDuplicateIcon,
                  },
                  {
                    name: '12 Writing Styles',
                    description:
                      'Choose from multiple writing tones including Professional, Playful, Bold, Luxury, Friendly, Creative, Inspiring, Witty, Modern, Authentic, Energetic, and Minimalist to match your specific needs.',
                    icon: PencilSquareIcon,
                  },
                  {
                    name: 'Natural Language Output',
                    description:
                      'Our advanced AI produces human-like content that reads naturally and engages your audience effectively.',
                    icon: ChatBubbleBottomCenterTextIcon,
                  },
                  {
                    name: 'Quality Assurance',
                    description:
                      'Every generated slogan is checked for grammar, coherence, and originality to ensure high-quality output.',
                    icon: CheckBadgeIcon,
                  },
                  {
                    name: 'Instant Generation',
                    description:
                      'Get your slogans instantly with no sign-up required. Free users can generate multiple slogans within minutes.',
                    icon: BoltIcon,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold text-white">
                      <feature.icon
                        className="h-5 w-5 flex-none text-cyan-400"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
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
        {/* Use Cases Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Many Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our AI Slogan Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Slogan Generator can enhance your
                branding and boost marketing effectiveness across various industries.
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

        {/* New section: Tips for Writing Better Slogans */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div>
                <h2 className="text-base font-semibold leading-7 text-cyan-600">
                  Branding Excellence
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  How to Perfect AI-Generated Slogans
                </p>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Follow these tips to enhance and polish your AI-generated
                  slogans:
                </p>
              </div>
              <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
                {[
                  {
                    name: 'Be specific about your brand',
                    description:
                      'Provide clear brand name and industry details to generate more relevant slogans.',
                  },
                  {
                    name: 'Choose the right tone',
                    description:
                      'Select the most appropriate tone from our 12 options to match your brand personality.',
                  },
                  {
                    name: 'Test for memorability',
                    description:
                      'Ensure slogans are catchy, easy to remember, and roll off the tongue naturally.',
                  },
                  {
                    name: 'Check for uniqueness',
                    description:
                      'Research to make sure your chosen slogan isn\'t already in use by competitors.',
                  },
                  {
                    name: 'Customize for your audience',
                    description:
                      'Modify the generated slogans to better resonate with your target market.',
                  },
                  {
                    name: 'Keep it concise',
                    description:
                      'The best slogans are short, punchy, and communicate your value proposition clearly.',
                  },
                ].map((step, index) => (
                  <div key={step.name} className="relative pl-9">
                    <dt className="font-semibold text-gray-900">
                      <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-xs font-medium text-white">
                        {index + 1}
                      </span>
                      {step.name}
                    </dt>
                    <dd className="mt-2">{step.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-slogan-generator')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
