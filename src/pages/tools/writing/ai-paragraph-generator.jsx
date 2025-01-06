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
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import CarbonAd from '@/components/CarbonAd'

const loadingText = [
  'Generating your paragraph...',
  'Crafting engaging content...',
  'Applying writing style...',
  'Polishing the text...',
  'Finalizing your paragraph...',
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
    name: 'Standard',
    emoji: '📝',
    description: 'Clear and straightforward writing for general use',
  },
  {
    name: 'Formal',
    emoji: '👔',
    description: 'Professional language suitable for business and academia',
  },
  {
    name: 'Academic',
    emoji: '🎓',
    description: 'Scholarly writing with technical terminology',
  },
  {
    name: 'Creative',
    emoji: '🎨',
    description: 'Imaginative and expressive writing style',
  },
  {
    name: 'Persuasive',
    emoji: '🎯',
    description: 'Convincing arguments and compelling language',
  },
  {
    name: 'Conversational',
    emoji: '💭',
    description: 'Natural, friendly tone like speaking',
  },
  {
    name: 'Professional',
    emoji: '💼',
    description: 'Polished business writing',
  },
  {
    name: 'Descriptive',
    emoji: '🌟',
    description: 'Vivid details and sensory language',
  },
  {
    name: 'Narrative',
    emoji: '📚',
    description: 'Storytelling with flow and engagement',
  },
  {
    name: 'Technical',
    emoji: '⚙️',
    description: 'Precise, detailed technical writing',
  },
  {
    name: 'Journalistic',
    emoji: '📰',
    description: 'Clear, factual news-style writing',
  },
  {
    name: 'Casual',
    emoji: '😊',
    description: 'Relaxed, informal writing style',
  },
  { name: 'Social', emoji: '🤳', description: 'Engaging social media content' },
  {
    name: 'Marketing',
    emoji: '📢',
    description: 'Promotional and engaging copy',
  },
  {
    name: 'Educational',
    emoji: '📖',
    description: 'Clear explanatory content',
  },
]

const AIParagraphComponent = () => {
  // Rename state variables and functions
  const [topic, setTopic] = useState('')
  const [paragraphCount, setParagraphCount] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [generatedParagraphs, setGeneratedParagraphs] = useState([])
  const [selectedStyle, setSelectedStyle] = useState(tones[0])
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  const generateParagraphs = async (topicInput, style) => {
    setIsGenerating(true)
    setErrorText('')

    if (!topicInput.trim()) {
      setErrorText('Please enter a topic or keywords to generate paragraphs.')
      setIsGenerating(false)
      posthog?.capture('Free Tool', {
        tool: 'AI Paragraph Generator',
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
          type: 'paragraph',
          input: topicInput,
          tone: style.name + ' - ' + style.description,
          paragraphCount: paragraphCount,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText('Daily usage limit exceeded, please try again tomorrow.')
          setShowSignupModal(true)

          posthog?.capture('Free Tool', {
            tool: 'AI Paragraph Generator',
            action: 'Error',
            error: 'Usage Limit Exceeded',
            category: 'Writing',
          })
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'AI Paragraph Generator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Writing',
          })
        }
      } else {
        const data = await response.json()
        setGeneratedParagraphs((prevResults) => [
          {
            text: data,
            style: style,
            stats: {
              characters: data.length,
              words: data.trim().split(/\s+/).length,
              paragraphs: data.split('\n\n').length,
            },
          },
          ...prevResults,       
        ])
        posthog?.capture('Free Tool', {
          tool: 'AI Paragraph Generator',
          action: 'Used',
          category: 'Writing',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'AI Paragraph Generator',
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

          <label
            htmlFor="topic"
            className="block w-full text-left text-sm font-medium text-gray-700"
          >
            Topic or Keywords
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic or keywords to generate paragraphs about..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
          />

          <div className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {/* Writing Style Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Writing Style
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

            {/* Number of Paragraphs */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Number of Paragraphs
              </label>
              <select
                value={paragraphCount}
                onChange={(e) => setParagraphCount(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'paragraph' : 'paragraphs'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            onClick={() => generateParagraphs(topic, selectedStyle)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner /> <LoadingText />
              </>
            ) : (
              <>Generate Paragraphs</>
            )}
          </button>

          <CarbonAd className="flex justify-center mt-4" /> 
          
          {generatedParagraphs.map((result, index) => (
            <GeneratedResult key={index} result={result} />
          ))}

          {generatedParagraphs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTopic('')
                setGeneratedParagraphs([])
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
        toolName="AI Paragraph Generator"
        toolCategory="Writing"
      />
    </div>
  )
}

const GeneratedResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(result.text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const processMarkdown = (text) => {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
      .toString()
  }

  const processedContent = processMarkdown(result.text)

  return (
    <div className="relative mt-6">
      <div className="mb-1 ml-1 flex items-baseline justify-between">
        <div className="text-sm text-gray-600">
          {result.stats.characters} characters · {result.stats.words} words ·{' '}
          {result.stats.paragraphs} paragraphs · {result.style.emoji}{' '}
          {result.style.name} style
        </div>
        <button
          onClick={copyToClipboard}
          type="button"
          className="rounded-md bg-gray-100 p-1 transition-colors hover:bg-gray-200"
          title="Copy to clipboard"
        >
          <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
        </button>
        {copySuccess && (
          <span className="absolute right-10 top-2 text-sm text-cyan-600">
            Copied!
          </span>
        )}
      </div>
      <div className="prose prose-sm min-h-16 max-w-none rounded-md bg-gray-50 p-4 text-left">
        <div
          dangerouslySetInnerHTML={{
            __html: processedContent,
          }}
        />
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Academic Writing Enhancement',
    description:
      'Generate well-structured paragraphs for essays, research papers, and academic assignments with proper scholarly tone and terminology.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Content Creation',
    description:
      'Create engaging blog posts, articles, and web content with AI-generated paragraphs that maintain consistent style and tone.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Marketing Copy',
    description:
      'Generate persuasive paragraphs for product descriptions, landing pages, and marketing materials that drive conversions.',
    icon: MegaphoneIcon,
  },
  {
    name: 'Social Media Content',
    description:
      'Create engaging social media posts and captions with the perfect tone and length for each platform.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Business Communication',
    description:
      'Generate professional paragraphs for business proposals, reports, and corporate communications.',
    icon: ClipboardDocumentIcon,
  },
  {
    name: 'Creative Writing',
    description:
      'Spark creativity with AI-generated paragraphs for stories, narratives, and creative projects in various styles.',
    icon: LightBulbIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Paragraph Generator?',
    answer:
      'An AI Paragraph Generator is a powerful tool that uses artificial intelligence to create unique, coherent paragraphs on any topic. Simply input your topic and desired writing style, and the AI will generate well-structured paragraphs that maintain consistent tone and flow.',
  },
  {
    question: 'How does the AI Paragraph Generator work?',
    answer:
      'Our AI Paragraph Generator uses advanced machine learning models to understand your topic and generate relevant, engaging content. It considers your chosen writing style, paragraph count, and topic to create unique paragraphs that sound natural and human-like.',
  },
  {
    question: 'Is the AI Paragraph Generator free to use?',
    answer:
      'Yes, our AI Paragraph Generator is free to use with a daily limit. You can generate multiple paragraphs in various styles without creating an account. For increased usage and additional features, consider signing up for a free account.',
  },
  {
    question: 'What writing styles are available?',
    answer:
      'We offer 15 different writing styles including Standard, Formal, Academic, Creative, Persuasive, Conversational, Professional, Descriptive, Narrative, Technical, Journalistic, Casual, Social, Marketing, and Educational. Each style has its own unique characteristics to suit your specific needs.',
  },
  {
    question: 'How many paragraphs can I generate at once?',
    answer:
      'You can generate up to 5 paragraphs at once. Each paragraph will maintain consistency in style and tone while providing unique content related to your chosen topic.',
  },
  {
    question: 'Is the generated content unique?',
    answer:
      'Yes, each paragraph generated is unique and created specifically for your topic. The AI creates original content every time, helping you avoid duplicate content issues.',
  },
  {
    question: 'Can I use the generated paragraphs for commercial purposes?',
    answer:
      'Yes, all generated paragraphs are free to use for any purpose, including commercial use. You own the rights to the content generated using our tool.',
  },
  {
    question: 'How can I ensure the best results?',
    answer:
      'For optimal results, provide clear topics or keywords, select the most appropriate writing style for your needs, and specify the desired number of paragraphs. Review and edit the generated content to ensure it perfectly matches your requirements.',
  },
  {
    question: 'What makes this AI generator paragraph tool different?',
    answer: 'Our AI generator paragraph tool stands out by offering 15 distinct writing styles, instant generation without signup, and the ability to create multiple paragraphs at once. It uses advanced AI to ensure each generated paragraph is unique, coherent, and perfectly matches your chosen style and topic.',
  },
  {
    question: 'Why choose our free AI paragraph generator?',
    answer: 'Our AI paragraph generator is completely free to use, requires no login, and offers 15 different writing styles. Unlike other tools, we provide instant results with no hidden fees or complicated signup process.',
  },
  {
    question: 'How does our AI generator paragraph tool work?',
    answer: 'Our paragraph AI generator uses advanced machine learning to analyze your topic and create relevant, engaging content. Simply enter your topic, choose a writing style, and let our AI create perfect paragraphs instantly.',
  },
]

export default function AIParagraphGeneratorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI Paragraph Generator | No Login | 15 Writing Styles"
        description="Generate unique paragraphs instantly with our free AI paragraph generator. No signup needed. Create content for blogs, essays & articles with 15 writing styles."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/paragraph-generator.png',
              alt: 'Free AI Paragraph Generator Tool',
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
                AI Paragraph Generator
                <span className="block text-2xl mt-2 font-normal">Free Online Tool - No Login Required</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Generate unique, engaging paragraphs instantly with our free AI paragraph generator. 
                  Choose from 15 writing styles to create perfect content for blogs, essays, articles and more - 
                  no signup required.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "100% Free",
                      description: "Use our AI paragraph generator without any cost or signup"
                    },
                    {
                      title: "Instant Results", 
                      description: "Generate AI paragraphs in seconds with our advanced technology"
                    },
                    {
                      title: "Multiple Styles",
                      description: "Create paragraphs in 15 different writing styles and tones"
                    }
                  ].map((benefit) => (
                    <div key={benefit.title} className="rounded-lg bg-white/10 p-4">
                      <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{benefit.description}</p>
                    </div>
                  ))}
                </div>
                <AIParagraphComponent />
                <StarRating
                  itemId="ai-paragraph-generator"
                  name="AI Paragraph Generator - DocsBot"
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
                How to Use Our AI Paragraph Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Create engaging, well-structured paragraphs in just a few clicks
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
                    Enter Your Topic
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Type in your topic or keywords to guide the AI paragraph
                      generation.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Choose Your Style
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select from 15 different writing styles to match your
                      needs.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Set Paragraph Count
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Choose how many paragraphs you want to generate (1-5).
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      4
                    </span>
                    Generate & Use
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click generate and use your new paragraphs instantly.
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
                Our AI paragraph generator combines powerful features to help
                you create high-quality, engaging content quickly and easily.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Intelligent Topic Analysis',
                    description:
                      'Simply input your topic or keywords, and our AI analyzes the context to generate relevant, coherent paragraphs that match your intent perfectly.',
                    icon: LightBulbIcon,
                  },
                  {
                    name: 'Customizable Length',
                    description:
                      'Generate between 1-5 paragraphs at once while maintaining consistency and natural flow throughout the content.',
                    icon: DocumentDuplicateIcon,
                  },
                  {
                    name: '15 Writing Styles',
                    description:
                      'Choose from multiple writing tones including academic, creative, professional, and conversational to match your specific needs.',
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
                      'Every generated paragraph is checked for grammar, coherence, and originality to ensure high-quality output.',
                    icon: CheckBadgeIcon,
                  },
                  {
                    name: 'Instant Generation',
                    description:
                      'Get your paragraphs instantly with no sign-up required. Free users can generate multiple paragraphs within minutes.',
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
                Use Cases for Our AI Paragraph Generator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Paragraph Generator can improve your
                writing and boost productivity across various domains.
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

        {/* New section: Tips for Writing Better Paragraphs */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <div>
                <h2 className="text-base font-semibold leading-7 text-cyan-600">
                  Writing Excellence
                </h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  How to Perfect AI-Generated Paragraphs
                </p>
                <p className="mt-6 text-base leading-7 text-gray-600">
                  Follow these tips to enhance and polish your AI-generated
                  paragraphs:
                </p>
              </div>
              <dl className="col-span-2 grid grid-cols-1 gap-x-8 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:gap-y-16">
                {[
                  {
                    name: 'Start with a clear topic',
                    description:
                      'Provide specific, focused topics to generate more relevant paragraphs.',
                  },
                  {
                    name: 'Choose the right style',
                    description:
                      'Select the most appropriate writing style from our 15 options.',
                  },
                  {
                    name: 'Review for coherence',
                    description:
                      'Ensure ideas flow logically and smoothly between sentences.',
                  },
                  {
                    name: 'Add transitions',
                    description:
                      'Insert connecting phrases to improve paragraph flow.',
                  },
                  {
                    name: 'Customize content',
                    description:
                      'Modify the generated text to match your specific needs.',
                  },
                  {
                    name: 'Fact-check information',
                    description:
                      'Verify any facts or statistics in the generated content.',
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
  const starRatingData = await getRating('ai-paraphraser')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
