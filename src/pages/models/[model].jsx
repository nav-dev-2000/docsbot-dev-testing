import { useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { FAQPageJsonLd, NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import clsx from 'clsx'
import Breadcrumb from '@/components/Breadcrumb'
import { LLMS } from '@/constants/llms.constants'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js'
import { LLM_PRICING } from '@/constants/llmPricing.constants'
import { Disclosure } from '@headlessui/react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { getProviderInfo, getBenchmarkDescription, getBenchmarkTitle, formatBenchmarkScore, BENCHMARKS } from '@/lib/llms'
import { useRouter } from 'next/router'
import {
  DocumentTextIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import TooltipComponent from '@/components/Tooltip'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

// Add this component near the top of the file
const ModelSelector = ({ models, selectedModel, onChange, className }) => {
  const groupedModels = groupModelsByProvider(models)

  return (
    <select
      value={selectedModel?.slug || ''}
      onChange={(e) => {
        const selected = models.find((m) => m.slug === e.target.value)
        onChange(selected)
      }}
      className={clsx(
        'sm:text-md block w-full rounded-md border-0 bg-gray-50 py-2 pl-3 pr-10 text-center text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-600 sm:leading-6',
        className,
      )}
    >
      <option value="" disabled>
        Choose model
      </option>
      {Object.entries(groupedModels).map(([provider, providerModels]) => (
        <optgroup key={provider} label={getProviderInfo(provider).displayName}>
          {providerModels
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
            .map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.model_name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}

// Add this helper function
const groupModelsByProvider = (models) => {
  return models.reduce((acc, model) => {
    const provider = model.provider
    if (!acc[provider]) {
      acc[provider] = []
    }
    acc[provider].push(model)
    return acc
  }, {})
}

const ModelPage = ({
  model_name,
  slug,
  provider,
  description,
  input_context_window,
  maximum_output_tokens,
  open_source,
  release_date,
  knowledge_cut_off_date,
  api_providers,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  modalities,
  benchmarks,
}) => {
  const breadcrumbPages = [
    { name: 'Models', href: '/models', current: false },
    { name: model_name, href: `/models/${slug}`, current: true },
  ]

  const generateFAQs = () => {
    let faqs = [
      {
        question: `What is ${model_name}?`,
        answer: description,
      },
      {
        question: `Who created ${model_name}?`,
        answer: `${model_name} was created by ${providerInfo.displayName}, and launched on ${new Date(release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      },
      {
        question: `How do I use ${model_name}?`,
        answer: `${model_name} can be accessed ${api_providers ? `through ${api_providers}` : 'through its provider'}. To use the model, you'll need to:
1. ${api_providers ? `Sign up for an account with ${api_providers}` : `Sign up for an account with ${providerInfo.displayName}`}
2. Get your API key
3. Make API calls to the model endpoint with your text input
4. The model will return generated text based on your input.`,
      },
      {
        question: `What is the context window for ${model_name}?`,
        answer: `${model_name} has a context window of ${input_context_window} tokens. This generally includes the combination of input and output tokens.`,
      },
    ]

    if (open_source !== null) {
      faqs.push({
        question: `Is ${providerInfo.displayName}'s ${model_name} open source?`,
        answer: `${open_source ? 'Yes' : 'No'}, ${model_name} ${open_source ? 'is' : 'is not'} open source, meaning its code and weights ${open_source ? 'are' : 'are not'} publicly available with a permissive license.`,
      })
    }

    if (maximum_output_tokens && maximum_output_tokens !== 'Unknown') {
      faqs.push({
        question: `What is the maximum output length for ${provider} ${model_name}?`,
        answer: `${model_name} can generate up to ${maximum_output_tokens} tokens per request.`,
      })
    }

    if (release_date) {
      faqs.push({
        question: `When was ${model_name} released?`,
        answer: `${model_name} was released on ${new Date(release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      })
    }

    if (knowledge_cut_off_date && knowledge_cut_off_date !== 'Unknown') {
      faqs.push({
        question: `What is the knowledge cutoff date for ${provider} ${model_name}?`,
        answer: `${model_name}'s knowledge is cut off at ${knowledge_cut_off_date}.`,
      })
    }

    if (api_providers && api_providers !== 'Unknown') {
      faqs.push({
        question: `Where can I access ${model_name} via API?`,
        answer: `${model_name} is available through the following providers: ${api_providers}.`,
      })
    }

    if (input_cost_per_million_tokens || output_cost_per_million_tokens) {
      faqs.push({
        question: `How much does ${model_name} cost to use?`,
        answer: `${model_name} costs $${input_cost_per_million_tokens} per million input tokens and $${output_cost_per_million_tokens} per million output tokens.`,
      })
    }

    if (modalities) {
      faqs.push({
        question: `Can ${model_name} process text input?`,
        answer: modalities.text
          ? `Yes, ${model_name} can process and generate text, making it suitable for tasks like writing, summarization, analysis, and chat conversations.`
          : `No, ${model_name} does not support text input or generation.`,
      })

      faqs.push({
        question: `Does ${model_name} work with images?`,
        answer: modalities.image
          ? `Yes, ${model_name} can process and understand images, allowing it to analyze visual content and discuss what it sees.`
          : `No, ${model_name} does not support image processing or analysis.`,
      })

      faqs.push({
        question: `Does ${model_name} support voice input?`,
        answer: modalities.voice
          ? `Yes, ${model_name} can process voice/audio input, enabling speech-related applications like describing, summarizing, transcribing, and question answering.`
          : `No, ${model_name} does not support voice or audio processing.`,
      })

      faqs.push({
        question: `Can ${model_name} handle video content?`,
        answer: modalities.video
          ? `Yes, ${model_name} can process video content, allowing it to analyze and understand video inputs.`
          : `No, ${model_name} does not support video processing or analysis.`,
      })
    }

    // Add benchmark scores when available
    if (benchmarks) {
      Object.entries(benchmarks).forEach(([benchmark, data]) => {
        if (data && data.score) {
          const benchmarkTitle = getBenchmarkTitle(benchmark)
          const formattedScore = formatBenchmarkScore(benchmark, data.score)
          faqs.push({
            question: `What are ${provider} ${model_name}'s results on the ${benchmarkTitle} benchmark?`,
            answer: `${model_name} achieved a score of ${formattedScore}${data.notes ? ` (${data.notes})` : ''} on the ${benchmarkTitle} benchmark${data.source ? `. Source: ${data.source}` : ''}.`,
          })
        }
      })
    }

    return faqs
  }

  const providerInfo = getProviderInfo(provider)
  const IconComponent = providerInfo.icon

  const faqs = generateFAQs()

  // Add state for scale type
  const [priceScale, setPriceScale] = useState('logarithmic')

  // Add router and state for comparison
  const router = useRouter()
  const [compareModel, setCompareModel] = useState(null)

  // Add handler for model comparison
  const handleCompare = (model) => {
    if (model && model.slug !== slug) {
      router.push(`/models/compare/${slug}/${model.slug}`)
    }
  }

  return (
    <>
      <NextSeo
        title={`${providerInfo.displayName}'s ${model_name} - AI Model Details`}
        description={description}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/llm-models.png',
              alt: 'AI Model Details',
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
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2830&h=500&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ffdb] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-2xl font-semibold leading-7 text-teal-500">
              {providerInfo.displayName}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {model_name}
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300">
              {description}
            </p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <Breadcrumb pages={breadcrumbPages} />
          </div>

          {/* Section links */}
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <Link href="#overview">
                Overview <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#pricing">
                Pricing <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#price-comparison">
                Price Comparison <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#benchmarks">
                Benchmarks <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#faq">
                FAQ <span aria-hidden="true">&darr;</span>
              </Link>
            </div>
          </div>
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>

        <div className="bg-white py-12">
          <div className="mx-auto mt-12 max-w-7xl px-6 lg:px-8">
            {/* Overview Table */}
            <div id="overview" className="px-4 sm:px-6 lg:px-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Model Overview
                  </h2>
                </div>
              </div>
              <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Provider
                            </div>
                            <div className="text-sm text-gray-500">
                              The entity that provides this model.
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <IconComponent className="h-6 w-6" />
                              <span className="text-xl font-semibold text-gray-900">
                                {providerInfo.displayName}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Input Context Window
                            </div>
                            <div className="text-sm text-gray-500">
                              The number of tokens supported by the input
                              context window.
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="text-md font-semibold text-gray-900">
                              {input_context_window || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">tokens</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Maximum Output Tokens
                            </div>
                            <div className="text-sm text-gray-500">
                              The number of tokens that can be generated by the
                              model in a single request.
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="text-md font-semibold text-gray-900">
                              {maximum_output_tokens || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">tokens</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Open Source
                            </div>
                            <div className="text-sm text-gray-500">
                              Whether the model's code is available for public
                              use.
                            </div>
                          </td>
                          <td className="text-md px-3 py-4 text-center font-semibold text-gray-900">
                            {open_source ? 'Yes' : 'No'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="textlg font-medium text-gray-900">
                              Release Date
                            </div>
                            <div className="text-sm text-gray-500">
                              When the model was first released.
                            </div>
                          </td>
                          <td className="text-md px-3 py-4 text-center font-semibold text-gray-900">
                            <div>
                              {new Date(release_date).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                },
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(() => {
                                const timeDiff =
                                  new Date() - new Date(release_date)
                                const days = Math.floor(
                                  timeDiff / (1000 * 60 * 60 * 24),
                                )
                                const months = Math.floor(days / 30)
                                const years = Math.floor(months / 12)

                                if (years > 0)
                                  return `${years} year${years === 1 ? '' : 's'} ago`
                                if (months > 0)
                                  return `${months} month${months === 1 ? '' : 's'} ago`
                                return `${days} day${days === 1 ? '' : 's'} ago`
                              })()}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Knowledge Cut-off Date
                            </div>
                            <div className="text-sm text-gray-500">
                              When the model's knowledge was last updated.
                            </div>
                          </td>
                          <td className="text-md px-3 py-4 text-center font-semibold text-gray-900">
                            {knowledge_cut_off_date || 'Unknown'}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              API Providers
                            </div>
                            <div className="text-sm text-gray-500">
                              The providers that offer this model. (This is not
                              an exhaustive list.)
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center text-sm font-medium text-gray-900">
                            {api_providers}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Modalities
                            </div>
                            <div className="text-sm text-gray-500">
                              Types of data this model can process
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex justify-center gap-3">
                              <TooltipComponent
                                content={
                                  modalities.text
                                    ? 'Supports text input and generation'
                                    : 'Does not support text'
                                }
                              >
                                <DocumentTextIcon
                                  className={clsx(
                                    'h-6 w-6',
                                    modalities.text
                                      ? 'text-cyan-600'
                                      : 'text-gray-300',
                                  )}
                                />
                              </TooltipComponent>
                              <TooltipComponent
                                content={
                                  modalities.image
                                    ? 'Supports image understanding and analysis'
                                    : 'Does not support images'
                                }
                              >
                                <PhotoIcon
                                  className={clsx(
                                    'h-6 w-6',
                                    modalities.image
                                      ? 'text-cyan-600'
                                      : 'text-gray-300',
                                  )}
                                />
                              </TooltipComponent>
                              <TooltipComponent
                                content={
                                  modalities.voice
                                    ? 'Supports voice/audio processing'
                                    : 'Does not support voice/audio'
                                }
                              >
                                <SpeakerWaveIcon
                                  className={clsx(
                                    'h-6 w-6',
                                    modalities.voice
                                      ? 'text-cyan-600'
                                      : 'text-gray-300',
                                  )}
                                />
                              </TooltipComponent>
                              <TooltipComponent
                                content={
                                  modalities.video
                                    ? 'Supports video understanding and analysis'
                                    : 'Does not support video'
                                }
                              >
                                <VideoCameraIcon
                                  className={clsx(
                                    'h-6 w-6',
                                    modalities.video
                                      ? 'text-cyan-600'
                                      : 'text-gray-300',
                                  )}
                                />
                              </TooltipComponent>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Table */}
            <div id="pricing" className="mt-24 px-4 sm:px-6 lg:px-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Pricing for {model_name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Costs for input and output tokens.
                  </p>
                </div>
              </div>
              <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="border-r border-gray-200 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                          >
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Input
                            </div>
                            <div className="text-sm text-gray-500">
                              Cost for processing tokens in your prompts
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            {!input_cost_per_million_tokens ? (
                              <div className="text-lg font-medium text-gray-500">
                                Unavailable
                              </div>
                            ) : (
                              <>
                                <div className="text-lg font-bold text-gray-900">
                                  ${input_cost_per_million_tokens.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per million tokens
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border-r border-gray-200 py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Output
                            </div>
                            <div className="text-sm text-gray-500">
                              Cost for tokens generated by the model
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            {!output_cost_per_million_tokens ? (
                              <div className="text-lg font-medium text-gray-500">
                                Unavailable
                              </div>
                            ) : (
                              <>
                                <div className="text-lg font-bold text-gray-900">
                                  ${output_cost_per_million_tokens.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per million tokens
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RegisterCTA />

          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {/* Price Comparison */}
            <div id="price-comparison" className="mt-12 px-4 sm:px-6 lg:px-8">
              <div className="justify-between sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Price Comparison
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Cost comparison with other models (per million tokens).
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Scale:</span>
                    <select
                      value={priceScale}
                      onChange={(e) => setPriceScale(e.target.value)}
                      className="rounded-md border-gray-300 py-1.5 text-sm"
                    >
                      <option value="logarithmic">Logarithmic</option>
                      <option value="linear">Linear</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Input Tokens Graph */}
              <div className="mt-8 h-[400px]">
                <h3 className="mb-4 text-xl font-semibold">
                  Input Token Costs
                </h3>
                <Bar
                  data={{
                    labels: LLM_PRICING['Chat/Completion Models']
                      .filter(
                        (model) =>
                          ![
                            'gpt-4o-realtime-preview',
                            'gpt-4o-audio-preview',
                          ].includes(model.model_slug),
                      )
                      .map(
                        (model) => `${model.provider} - ${model.model_name}`,
                      ),
                    datasets: [
                      {
                        label: 'Input Cost',
                        data: LLM_PRICING['Chat/Completion Models']
                          .filter(
                            (model) =>
                              ![
                                'gpt-4o-realtime-preview',
                                'gpt-4o-audio-preview',
                              ].includes(model.model_slug),
                          )
                          .map((model) => model.input_token_cost_per_million),
                        backgroundColor: [
                          'rgba(78, 121, 167, 0.7)',
                          'rgba(160, 203, 232, 0.7)',
                          'rgba(242, 142, 43, 0.7)',
                          'rgba(255, 190, 125, 0.7)',
                          'rgba(89, 161, 79, 0.7)',
                          'rgba(140, 209, 125, 0.7)',
                          'rgba(182, 153, 45, 0.7)',
                          'rgba(241, 206, 99, 0.7)',
                          'rgba(73, 152, 148, 0.7)',
                          'rgba(134, 188, 182, 0.7)',
                          'rgba(225, 87, 89, 0.7)',
                          'rgba(255, 157, 154, 0.7)',
                          'rgba(121, 112, 110, 0.7)',
                          'rgba(186, 176, 172, 0.7)',
                          'rgba(211, 114, 149, 0.7)',
                          'rgba(250, 191, 210, 0.7)',
                          'rgba(176, 122, 161, 0.7)',
                          'rgba(212, 166, 200, 0.7)',
                          'rgba(157, 118, 96, 0.7)',
                          'rgba(215, 181, 166, 0.7)',
                        ],
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `$${context.parsed.y.toFixed(2)} per million tokens`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          font: { size: 11 },
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        type: priceScale,
                        title: {
                          display: true,
                          text: '($) per Million Tokens',
                        },
                        ticks: {
                          callback: (value) => `$${value}`,
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Output Tokens Graph */}
              <div className="mt-12 h-[400px]">
                <h3 className="mb-4 text-xl font-semibold">
                  Output Token Costs
                </h3>
                <Bar
                  data={{
                    labels: LLM_PRICING['Chat/Completion Models']
                      .filter(
                        (model) =>
                          ![
                            'gpt-4o-realtime-preview',
                            'gpt-4o-audio-preview',
                          ].includes(model.model_slug),
                      )
                      .map(
                        (model) => `${model.provider} - ${model.model_name}`,
                      ),
                    datasets: [
                      {
                        label: 'Output Cost',
                        data: LLM_PRICING['Chat/Completion Models']
                          .filter(
                            (model) =>
                              ![
                                'gpt-4o-realtime-preview',
                                'gpt-4o-audio-preview',
                              ].includes(model.model_slug),
                          )
                          .map((model) => model.output_token_cost_per_million),
                        backgroundColor: [
                          'rgba(78, 121, 167, 1)',
                          'rgba(160, 203, 232, 1)',
                          'rgba(242, 142, 43, 1)',
                          'rgba(255, 190, 125, 1)',
                          'rgba(89, 161, 79, 1)',
                          'rgba(140, 209, 125, 1)',
                          'rgba(182, 153, 45, 1)',
                          'rgba(241, 206, 99, 1)',
                          'rgba(73, 152, 148, 1)',
                          'rgba(134, 188, 182, 1)',
                          'rgba(225, 87, 89, 1)',
                          'rgba(255, 157, 154, 1)',
                          'rgba(121, 112, 110, 1)',
                          'rgba(186, 176, 172, 1)',
                          'rgba(211, 114, 149, 1)',
                          'rgba(250, 191, 210, 1)',
                          'rgba(176, 122, 161, 1)',
                          'rgba(212, 166, 200, 1)',
                          'rgba(157, 118, 96, 1)',
                          'rgba(215, 181, 166, 1)',
                        ],
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `$${context.parsed.y.toFixed(2)} per million tokens`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          font: { size: 11 },
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        type: priceScale,
                        title: {
                          display: true,
                          text: '($) per Million Tokens',
                        },
                        ticks: {
                          callback: (value) => `$${value}`,
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Calculator Button */}
              <div className="mt-16 text-center">
                <Link
                  href="/tools/gpt-openai-api-pricing-calculator"
                  className="inline-flex items-center rounded-md bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                >
                  Calculate and Compare Model Prices
                </Link>
              </div>
            </div>

            {/* Benchmarks Table */}
            <div id="benchmarks" className="mt-24 rounded-xl bg-gray-900 py-12">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h2 className="text-base/7 font-semibold text-cyan-500">
                      Model Performance
                    </h2>
                    <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      Benchmarks
                    </p>
                    <p className="mt-6 text-lg/8 text-gray-300">
                      Performance metrics across various standardized tests and
                      evaluations.
                    </p>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="w-full">
                    <table className="w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="border-r border-gray-800 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0"
                          >
                            Benchmark
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-center text-sm font-semibold text-white"
                          >
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {Object.keys(BENCHMARKS || {}).filter(key => benchmarks?.[key]).map((key) => (
                          <tr key={key}>
                            <td className="border-r border-gray-800 py-4 pl-4 pr-3 sm:pl-0">
                              <div className="text-sm font-medium text-white">
                                {getBenchmarkTitle(key)}
                              </div>
                              <div className="text-sm text-gray-300">
                                {getBenchmarkDescription(key)}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <div>
                                <div className="text-xl font-bold text-cyan-400">
                                  {formatBenchmarkScore(key, benchmarks[key].score)}
                                </div>
                                <div className="mt-1 text-gray-300">
                                  {benchmarks[key].notes}
                                </div>
                                {benchmarks[key].source && (
                                  <a
                                    href={benchmarks[key].source}
                                    className="mt-1 inline-block text-cyan-500 hover:text-cyan-400 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Source
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div id="faq" className="mt-24 px-4 sm:px-6 lg:px-8">
              <div className="mx-auto divide-y divide-gray-900/10">
                <h2 className="text-3xl font-bold leading-10 tracking-tight text-gray-900">
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
        </div>

        <div className="bg-gray-900 py-12">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-white">
                More models from {providerInfo.displayName}
              </h2>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-4 text-justify sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {LLMS.filter(
                (item) =>
                  item.provider === provider &&
                  item.slug !== slug &&
                  !item.redirect_to,
              ).map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/models/${item.slug}`}
                    className="text-cyan-400 hover:underline"
                  >
                    {item.model_name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <Link
                href="/models"
                className="text-xl font-semibold text-cyan-400 hover:underline"
              >
                &larr; All AI Models
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="text-lg text-white">
                Compare {model_name} with:
              </span>
              <div className="w-72">
                <ModelSelector
                  models={LLMS.filter(
                    (m) => m.slug !== slug && !m.redirect_to,
                  )}
                  selectedModel={compareModel}
                  onChange={handleCompare}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="AI" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default ModelPage

export async function getStaticPaths() {
  let paths = LLMS.map((item) => {
    return { params: { model: `${item.slug}` } }
  })
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const model = context.params.model
  const modelData = LLMS.find((e) => `${e.slug}` == model)
  
  // If model doesn't exist at all
  if (!modelData) {
    return { notFound: true }
  }

  // Handle redirects for deprecated/renamed models
  const redirectTarget = modelData.redirect_to
  if (redirectTarget && redirectTarget !== modelData.slug) {
    return { notFound: true }
  }
  
  // Check if model exists and has valid provider info
  if (!getProviderInfo(modelData.provider)) {
    return {
      notFound: true,
    }
  }
  
  return {
    props: { ...modelData },
  }
}
