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
import {
  MinusIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  EqualsIcon,
} from '@heroicons/react/24/outline'
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

// Add this helper function near the top of the file
const normalizeContextWindow = (contextWindow) => {
  if (!contextWindow || contextWindow === 'Unknown') return 0

  // Convert string to uppercase for consistent K/M matching
  const str = contextWindow.toString().toUpperCase()

  // Remove any commas
  const cleanStr = str.replace(/,/g, '')

  // Handle K (thousands)
  if (cleanStr.includes('K')) {
    return parseInt(cleanStr) * 1000
  }
  // Handle M (millions)
  if (cleanStr.includes('M')) {
    return parseInt(cleanStr) * 1000000
  }

  // Handle numeric strings
  return parseInt(cleanStr)
}

// Add this helper function near the top of the file
const normalizeKnowledgeCutoff = (date) => {
  if (!date || date === 'Unknown' || date === '') return null

  try {
    // Handle month year format (e.g., "January 2023")
    if (date.includes(' ')) {
      return new Date(date).getTime()
    }

    // Handle year only (e.g., "2023")
    if (/^\d{4}$/.test(date)) {
      return new Date(parseInt(date), 0, 1).getTime()
    }

    // Handle ISO date format
    return new Date(date).getTime()
  } catch (e) {
    return null
  }
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

// Update the ModelSelector component to have a more compact style
const ModelSelector = ({ models, selectedModel, onChange, className }) => {
  const groupedModels = groupModelsByProvider(models)

  return (
    <select
      value={selectedModel.slug}
      onChange={(e) => {
        const selected = models.find((m) => m.slug === e.target.value)
        onChange(selected)
      }}
      className={clsx(
        'sm:text-md block w-full rounded-md border-0 bg-gray-50 py-2 pl-3 pr-10 text-center text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-600 sm:leading-6',
        className,
      )}
    >
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

const ModelPage = ({ model1, model2 }) => {
  const router = useRouter()
  // Add state for scale type - must be before any conditional returns
  const [priceScale, setPriceScale] = useState('logarithmic')

  // Safety check - this shouldn't happen with proper getStaticProps, but adding as fallback
  if (!model1 || !model2) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Models not found</h1>
          <p className="mt-2 text-gray-600">The requested models could not be found.</p>
        </div>
      </div>
    )
  }

  const breadcrumbPages = [
    { name: 'Models', href: '/models', current: false },
    { name: 'Compare', href: null, current: false },
    {
      name: `${model1.model_name} vs ${model2.model_name}`,
      href: `/models/compare/${model1.slug}/${model2.slug}`,
      current: true,
    },
  ]

  const generateFAQs = () => {
    let faqs = [
      {
        question: `What are the key differences between ${model1.model_name} and ${model2.model_name}?`,
        answer: `${model2.model_name} is ${(() => {
          const date1 = new Date(model1.release_date)
          const date2 = new Date(model2.release_date)
          const diffMonths =
            (date2.getFullYear() - date1.getFullYear()) * 12 +
            (date2.getMonth() - date1.getMonth())
          return diffMonths > 0
            ? `${diffMonths} months newer`
            : `${Math.abs(diffMonths)} months older`
        })()} than ${model1.model_name}. ${(() => {
          const cutoff1 = normalizeKnowledgeCutoff(
            model1.knowledge_cut_off_date,
          )
          const cutoff2 = normalizeKnowledgeCutoff(
            model2.knowledge_cut_off_date,
          )
          if (cutoff1 && cutoff2 && cutoff1 !== cutoff2) {
            return `It has ${cutoff2 > cutoff1 ? 'more recent' : 'older'} training data (${model2.knowledge_cut_off_date} vs ${model1.knowledge_cut_off_date}).`
          }
          return ''
        })()}`,
      },
      {
        question: `When were ${model1.model_name} and ${model2.model_name} released?`,
        answer: `${model1.model_name} was released on ${new Date(model1.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, while ${model2.model_name} was released on ${new Date(model2.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. ${(() => {
          const date1 = new Date(model1.release_date)
          const date2 = new Date(model2.release_date)
          const diffMonths =
            (date2.getFullYear() - date1.getFullYear()) * 12 +
            (date2.getMonth() - date1.getMonth())
          return diffMonths === 0
            ? 'They were released in the same month.'
            : `This makes ${model2.model_name} ${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'} ${diffMonths > 0 ? 'newer' : 'older'} than ${model1.model_name}.`
        })()}`,
      },
      {
        question: `How does ${model1.model_name}'s context window compare to ${model2.model_name}'s?`,
        answer: `${(() => {
          if (model1.input_context_window === model2.input_context_window) {
            return `Both models have the same context window size of ${model1.input_context_window} tokens.`
          }
          const window1 = normalizeContextWindow(model1.input_context_window)
          const window2 = normalizeContextWindow(model2.input_context_window)
          return `${model2.model_name} has a ${window2 > window1 ? 'larger' : 'smaller'} context window (${model2.input_context_window} vs ${model1.input_context_window} tokens).`
        })()}`,
      },
    ]

    if (
      model1.input_cost_per_million_tokens &&
      model2.input_cost_per_million_tokens &&
      model1.output_cost_per_million_tokens &&
      model2.output_cost_per_million_tokens
    ) {
      faqs.push({
        question: `How do ${model1.model_name} and ${model2.model_name}'s prices compare?`,
        answer: `For input tokens, ${model2.model_name} ${
          model2.input_cost_per_million_tokens ===
          model1.input_cost_per_million_tokens
            ? 'costs the same as'
            : model2.input_cost_per_million_tokens >
                model1.input_cost_per_million_tokens
              ? 'costs more than'
              : 'costs less than'
        } ${model1.model_name} ($${model2.input_cost_per_million_tokens} vs $${model1.input_cost_per_million_tokens} per million tokens). For output tokens, ${model2.model_name} ${
          model2.output_cost_per_million_tokens ===
          model1.output_cost_per_million_tokens
            ? 'costs the same as'
            : model2.output_cost_per_million_tokens >
                model1.output_cost_per_million_tokens
              ? 'costs more than'
              : 'costs less than'
        } ${model1.model_name} ($${model2.output_cost_per_million_tokens} vs $${model1.output_cost_per_million_tokens} per million tokens).`,
      })
    }

    // Compare open source status
    if (model1.open_source !== null && model2.open_source !== null) {
      faqs.push({
        question: `Is ${model1.model_name} or ${model2.model_name} open source?`,
        answer: `${model1.model_name} is ${model1.open_source ? '' : 'not '}open source, while ${model2.model_name} is ${model2.open_source ? '' : 'not '}open source.`,
      })
    }

    // Compare maximum output tokens if both are known
    if (
      normalizeContextWindow(model1.maximum_output_tokens) &&
      normalizeContextWindow(model2.maximum_output_tokens) &&
      model1.maximum_output_tokens !== 'Unknown' &&
      model2.maximum_output_tokens !== 'Unknown'
    ) {
      faqs.push({
        question: `What is the maximum output length of ${model1.model_name} compared to ${model2.model_name}?`,
        answer: `${(() => {
          if (
            normalizeContextWindow(model2.maximum_output_tokens) ===
            normalizeContextWindow(model1.maximum_output_tokens)
          ) {
            return `Both models can generate the same number of tokens per request (${model1.maximum_output_tokens} tokens).`
          }
          return `${model2.model_name} can generate ${
            normalizeContextWindow(model2.maximum_output_tokens) >
            normalizeContextWindow(model1.maximum_output_tokens)
              ? 'more'
              : 'fewer'
          } tokens per request (${model2.maximum_output_tokens} vs ${model1.maximum_output_tokens} tokens).`
        })()}`,
      })
    }

    // Compare API providers
    if (
      model1.api_providers &&
      model2.api_providers &&
      model1.api_providers !== 'Unknown' &&
      model2.api_providers !== 'Unknown'
    ) {
      faqs.push({
        question: `Which providers offer ${model1.model_name} and ${model2.model_name}?`,
        answer: `${model1.model_name} is available through ${model1.api_providers}, while ${model2.model_name} is available through ${model2.api_providers}.`,
      })
    }

    // Compare benchmarks when available for both models
    if (model1.benchmarks && model2.benchmarks) {
      Object.entries(model1.benchmarks).forEach(([benchmark, data1]) => {
        const data2 = model2.benchmarks[benchmark]
        if (data1?.score && data2?.score) {
          const benchmarkTitle = getBenchmarkTitle(benchmark)
          const formattedScore1 = formatBenchmarkScore(benchmark, data1.score)
          const formattedScore2 = formatBenchmarkScore(benchmark, data2.score)
          faqs.push({
            question: `How do ${model1.model_name} and ${model2.model_name} compare on the ${benchmarkTitle} benchmark?`,
            answer: `${model2.model_name} ${
              data2.score > data1.score ? 'outperforms' : 'scores lower than'
            } ${model1.model_name} on ${benchmarkTitle} (${formattedScore2} vs ${formattedScore1}).`,
          })
        }
      })
    }

    return faqs
  }

  const faqs = generateFAQs()

  const providerInfo1 = getProviderInfo(model1.provider)
  const providerInfo2 = getProviderInfo(model2.provider)
  const IconComponent1 = providerInfo1.icon
  const IconComponent2 = providerInfo2.icon

  // Add this handler
  const handleModelChange = (newModel1, newModel2) => {
    if (newModel1 && newModel2 && newModel1.slug !== newModel2.slug) {
      router.push(`/models/compare/${newModel1.slug}/${newModel2.slug}`)
    }
  }

  return (
    <>
      <NextSeo
        title={`${model1.model_name} vs ${model2.model_name} - Detailed Performance & Feature Comparison`}
        description={`Discover how ${providerInfo1.displayName}'s ${model1.model_name} and ${providerInfo2.displayName}'s ${model2.model_name} stack up in performance, features, and applications. Read our detailed comparison to find out which AI model best suits your needs.`}
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
              Compare
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {model1.model_name} vs {model2.model_name}
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300">
              Get a detailed comparison of AI language models{' '}
              {providerInfo1.displayName}'s {model1.model_name} and{' '}
              {providerInfo2.displayName}'s {model2.model_name}, including model
              features, token pricing, API costs, performance benchmarks, and
              real-world capabilities to help you choose the right LLM for your
              needs.
            </p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <Breadcrumb pages={breadcrumbPages} />
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-white">
            <span className="text-lg font-medium">Compare</span>
            <div className="w-72">
              <ModelSelector
                models={LLMS.filter((m) => !m.redirect_to)}
                selectedModel={model1}
                onChange={(newModel) => handleModelChange(newModel, model2)}
              />
            </div>
            <span className="text-lg font-medium">to</span>
            <div className="w-72">
              <ModelSelector
                models={LLMS.filter((m) => !m.redirect_to)}
                selectedModel={model2}
                onChange={(newModel) => handleModelChange(model1, newModel)}
              />
            </div>
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Model 1 Description */}
              <div className="rounded-lg bg-gray-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <IconComponent1 className="h-6 w-6" />
                  <Link
                    href={`/models/${model1.slug}`}
                    className="text-xl font-semibold text-gray-900 hover:text-gray-800 hover:underline"
                  >
                    {model1.model_name}
                  </Link>
                </div>
                <p className="text-gray-600">{model1.description}</p>
              </div>

              {/* Model 2 Description */}
              <div className="rounded-lg bg-gray-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <IconComponent2 className="h-6 w-6" />
                  <Link
                    href={`/models/${model2.slug}`}
                    className="text-xl font-semibold text-gray-900 hover:text-gray-800 hover:underline"
                  >
                    {model2.model_name}
                  </Link>
                </div>
                <p className="text-gray-600">{model2.description}</p>
              </div>
            </div>
          </div>

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
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                          >
                            Feature
                          </th>
                          {[model1, model2].map((model) => (
                            <th
                              key={model.slug}
                              scope="col"
                              className="border-l border-gray-200 px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                            >
                              <div className="flex items-center justify-center gap-2 text-xl">
                                {model === model1 ? (
                                  <IconComponent1 className="h-6 w-6" />
                                ) : (
                                  <IconComponent2 className="h-6 w-6" />
                                )}
                                <span>{model.model_name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Input Context Window
                            </div>
                            <div className="text-sm text-gray-500">
                              The number of tokens supported by the input
                              context window.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center"
                            >
                              <div className="text-md font-semibold text-gray-900">
                                {model.input_context_window || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                tokens
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Maximum Output Tokens
                            </div>
                            <div className="text-sm text-gray-500">
                              The number of tokens that can be generated by the
                              model in a single request.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center"
                            >
                              <div className="text-md font-semibold text-gray-900">
                                {model.maximum_output_tokens || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                tokens
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Open Source
                            </div>
                            <div className="text-sm text-gray-500">
                              Whether the model's code is available for public
                              use.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="text-md border-l border-gray-200 px-3 py-4 text-center font-semibold text-gray-900"
                            >
                              {model.open_source ? 'Yes' : 'No'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="textlg font-medium text-gray-900">
                              Release Date
                            </div>
                            <div className="text-sm text-gray-500">
                              When the model was first released.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="text-md border-l border-gray-200 px-3 py-4 text-center font-semibold text-gray-900"
                            >
                              <div>
                                {new Date(
                                  model.release_date,
                                ).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(() => {
                                  const timeDiff =
                                    new Date() - new Date(model.release_date)
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
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Knowledge Cut-off Date
                            </div>
                            <div className="text-sm text-gray-500">
                              When the model's knowledge was last updated.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="text-md border-l border-gray-200 px-3 py-4 text-center font-semibold text-gray-900"
                            >
                              {model.knowledge_cut_off_date || 'Unknown'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              API Providers
                            </div>
                            <div className="text-sm text-gray-500">
                              The providers that offer this model. (This is not
                              an exhaustive list.)
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center text-sm font-medium text-gray-900"
                            >
                              {model.api_providers}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Supported Modalities
                            </div>
                            <div className="text-sm text-gray-500">
                              The types of inputs the model can process.
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center"
                            >
                              <div className="flex items-center justify-center gap-3">
                                <TooltipComponent
                                  content={
                                    model.modalities?.text
                                      ? 'Supports text processing'
                                      : 'Does not support text'
                                  }
                                >
                                  <DocumentTextIcon
                                    className={clsx(
                                      'h-6 w-6',
                                      model.modalities?.text
                                        ? 'text-cyan-600'
                                        : 'text-gray-300',
                                    )}
                                  />
                                </TooltipComponent>
                                <TooltipComponent
                                  content={
                                    model.modalities?.image
                                      ? 'Supports image understanding and analysis'
                                      : 'Does not support images'
                                  }
                                >
                                  <PhotoIcon
                                    className={clsx(
                                      'h-6 w-6',
                                      model.modalities?.image
                                        ? 'text-cyan-600'
                                        : 'text-gray-300',
                                    )}
                                  />
                                </TooltipComponent>
                                <TooltipComponent
                                  content={
                                    model.modalities?.voice
                                      ? 'Supports voice/audio processing'
                                      : 'Does not support voice/audio'
                                  }
                                >
                                  <SpeakerWaveIcon
                                    className={clsx(
                                      'h-6 w-6',
                                      model.modalities?.voice
                                        ? 'text-cyan-600'
                                        : 'text-gray-300',
                                    )}
                                  />
                                </TooltipComponent>
                                <TooltipComponent
                                  content={
                                    model.modalities?.video
                                      ? 'Supports video understanding and analysis'
                                      : 'Does not support video'
                                  }
                                >
                                  <VideoCameraIcon
                                    className={clsx(
                                      'h-6 w-6',
                                      model.modalities?.video
                                        ? 'text-cyan-600'
                                        : 'text-gray-300',
                                    )}
                                  />
                                </TooltipComponent>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Model Insights */}
              <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <InformationCircleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    {model2.model_name} is{' '}
                    {(() => {
                      const date1 = new Date(model1.release_date)
                      const date2 = new Date(model2.release_date)
                      const diffMonths =
                        (date2.getFullYear() - date1.getFullYear()) * 12 +
                        (date2.getMonth() - date1.getMonth())
                      return diffMonths > 0
                        ? `${diffMonths} months newer`
                        : `${Math.abs(diffMonths)} months older`
                    })()}{' '}
                    than {model1.model_name}.
                    {(() => {
                      const cutoff1 = normalizeKnowledgeCutoff(
                        model1.knowledge_cut_off_date,
                      )
                      const cutoff2 = normalizeKnowledgeCutoff(
                        model2.knowledge_cut_off_date,
                      )

                      if (cutoff1 && cutoff2 && cutoff1 !== cutoff2) {
                        return ` It has ${cutoff2 > cutoff1 ? 'more recent' : 'older'} training data (${model2.knowledge_cut_off_date} vs ${model1.knowledge_cut_off_date}).`
                      }
                      return ''
                    })()}
                    {model2.input_context_window !==
                      model1.input_context_window &&
                      ` ${model2.model_name} has a ${
                        normalizeContextWindow(model2.input_context_window) >
                        normalizeContextWindow(model1.input_context_window)
                          ? 'larger'
                          : 'smaller'
                      } context window (${model2.input_context_window} vs ${model1.input_context_window} tokens).`}
                    {(() => {
                      const m1 = model1.modalities || {}
                      const m2 = model2.modalities || {}
                      const differences = []
                      if (m1.text !== m2.text) differences.push('text')
                      if (m1.image !== m2.image) differences.push('image')
                      if (m1.voice !== m2.voice) differences.push('voice')
                      if (m1.video !== m2.video) differences.push('video')
                      if (differences.length > 0) {
                        return ` Unlike ${model1.model_name}, ${model2.model_name} ${m2[differences[0]] ? 'supports' : 'does not support'} ${differences.join(', ')} processing.`
                      }
                      return ''
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Table */}
            <div id="pricing" className="mt-24 px-4 sm:px-6 lg:px-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Pricing Comparison
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Compare costs for input and output tokens between{' '}
                    {model1.model_name} and {model2.model_name}.
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
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                          >
                            Price Type
                          </th>
                          {[model1, model2].map((model) => (
                            <th
                              key={model.slug}
                              scope="col"
                              className="border-l border-gray-200 px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                            >
                              <div className="flex items-center justify-center gap-2 text-xl">
                                {model === model1 ? (
                                  <IconComponent1 className="h-6 w-6" />
                                ) : (
                                  <IconComponent2 className="h-6 w-6" />
                                )}
                                <span>{model.model_name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Input
                            </div>
                            <div className="text-sm text-gray-500">
                              Cost for processing tokens in your prompts
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center"
                            >
                              {!model.input_cost_per_million_tokens ? (
                                <div className="text-lg font-medium text-gray-500">
                                  Unavailable
                                </div>
                              ) : (
                                <>
                                  <div className="text-lg font-bold text-gray-900">
                                    $
                                    {model.input_cost_per_million_tokens.toFixed(
                                      2,
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    per million tokens
                                  </div>
                                </>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-4 pr-3">
                            <div className="text-lg font-medium text-gray-900">
                              Output
                            </div>
                            <div className="text-sm text-gray-500">
                              Cost for tokens generated by the model
                            </div>
                          </td>
                          {[model1, model2].map((model) => (
                            <td
                              key={model.slug}
                              className="border-l border-gray-200 px-3 py-4 text-center"
                            >
                              {!model.output_cost_per_million_tokens ? (
                                <div className="text-lg font-medium text-gray-500">
                                  Unavailable
                                </div>
                              ) : (
                                <>
                                  <div className="text-lg font-bold text-gray-900">
                                    $
                                    {model.output_cost_per_million_tokens.toFixed(
                                      2,
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    per million tokens
                                  </div>
                                </>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* Pricing Insights */}
              {model1.input_cost_per_million_tokens &&
              model1.output_cost_per_million_tokens &&
              model2.input_cost_per_million_tokens &&
              model2.output_cost_per_million_tokens ? (
                <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  {model2.input_cost_per_million_tokens +
                    model2.output_cost_per_million_tokens ===
                  model1.input_cost_per_million_tokens +
                    model1.output_cost_per_million_tokens ? (
                    <EqualsIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                  ) : model2.input_cost_per_million_tokens +
                      model2.output_cost_per_million_tokens <
                    model1.input_cost_per_million_tokens +
                      model1.output_cost_per_million_tokens ? (
                    <ArrowTrendingDownIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                  ) : (
                    <ArrowTrendingUpIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-blue-900">
                      {model2.input_cost_per_million_tokens +
                        model2.output_cost_per_million_tokens ===
                      model1.input_cost_per_million_tokens +
                        model1.output_cost_per_million_tokens
                        ? `${model2.model_name} costs the same as ${model1.model_name} for input and output tokens.`
                        : model2.input_cost_per_million_tokens +
                              model2.output_cost_per_million_tokens <
                            model1.input_cost_per_million_tokens +
                              model1.output_cost_per_million_tokens
                          ? `${model2.model_name} is roughly ${(
                              (model1.input_cost_per_million_tokens +
                                model1.output_cost_per_million_tokens) /
                              (model2.input_cost_per_million_tokens +
                                model2.output_cost_per_million_tokens)
                            ).toFixed(1)}x cheaper compared to ${
                              model1.model_name
                            } for input and output tokens.`
                          : `${model2.model_name} is roughly ${(
                              (model2.input_cost_per_million_tokens +
                                model2.output_cost_per_million_tokens) /
                              (model1.input_cost_per_million_tokens +
                                model1.output_cost_per_million_tokens)
                            ).toFixed(1)}x more expensive compared to ${
                              model1.model_name
                            } for input and output tokens.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <InformationCircleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-600" />
                  <p className="font-medium text-yellow-900">
                    Price comparison unavailable.
                  </p>
                </div>
              )}
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
                      Benchmark Comparison
                    </p>
                    <p className="mt-6 text-lg/8 text-gray-300">
                      Compare performance metrics between {model1.model_name}{' '}
                      and {model2.model_name}. See how each model performs on
                      key benchmarks measuring reasoning, knowledge and
                      capabilities.
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
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0"
                          >
                            Benchmark
                          </th>
                          {[model1, model2].map((model) => (
                            <th
                              key={model.slug}
                              scope="col"
                              className="w-fit border-l border-gray-800 px-3 py-3.5 text-center text-sm font-semibold text-white"
                            >
                              <div className="flex items-center justify-center gap-2 text-xl lg:whitespace-nowrap">
                                {model === model1 ? (
                                  <IconComponent1 className="h-6 w-6" />
                                ) : (
                                  <IconComponent2 className="h-6 w-6" />
                                )}
                                <span>{model.model_name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                      {Object.keys(BENCHMARKS)
                        .filter(key => 
                          model1.benchmarks?.[key]?.score || 
                          model2.benchmarks?.[key]?.score
                        )
                        .map((key) => (
                          <tr key={key}>
                            <td className="py-4 pl-4 pr-3 sm:pl-0">
                              <div className="text-sm font-medium text-white">
                                {getBenchmarkTitle(key)}
                              </div>
                              <div className="text-sm text-gray-300">
                                {getBenchmarkDescription(key)}
                              </div>
                            </td>
                            {[model1, model2].map((model) => (
                              <td
                                key={model.slug}
                                className="border-l border-gray-800 px-3 py-4 text-center"
                              >
                                {model.benchmarks?.[key] ? (
                                  <div>
                                    <div className="text-xl font-bold text-cyan-400">
                                      {formatBenchmarkScore(key, model.benchmarks[key].score)}
                                    </div>
                                    <div className="mt-1 text-gray-300">
                                      {model.benchmarks[key].notes}
                                    </div>
                                    {model.benchmarks[key].source && (
                                      <a
                                        href={model.benchmarks[key].source}
                                        className="mt-1 inline-block text-cyan-500 hover:text-cyan-400 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Source
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">
                                    Not available
                                  </span>
                                )}
                              </td>
                            ))}
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-white">
              More Model Comparisons
            </h2>
            <ul className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:grid-cols-3">
              {LLMS.filter(
                (otherModel) =>
                  otherModel.slug !== model1.slug &&
                  !otherModel.redirect_to,
              ).map(
                (otherModel) => (
                  <li key={`${model1.slug}-${otherModel.slug}`}>
                    <Link
                      href={`/models/compare/${model1.slug}/${otherModel.slug}`}
                      className="text-cyan-400 hover:underline"
                    >
                      {model1.model_name} vs {otherModel.model_name}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
          {/* Model Selection */}
          <div className="mt-12 flex items-center justify-center gap-4 text-white">
            <span className="text-lg font-medium">Compare</span>
            <div className="w-72">
              <ModelSelector
                models={LLMS.filter((m) => !m.redirect_to)}
                selectedModel={model1}
                onChange={(newModel) => handleModelChange(newModel, model2)}
              />
            </div>
            <span className="text-lg font-medium">to</span>
            <div className="w-72">
              <ModelSelector
                models={LLMS.filter((m) => !m.redirect_to)}
                selectedModel={model2}
                onChange={(newModel) => handleModelChange(model1, newModel)}
              />
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
  let paths = LLMS.filter((m) => !m.redirect_to).flatMap((model1) =>
    LLMS.filter((model2) => model2.slug !== model1.slug).map((model2) => ({
      params: {
        model1: model1.slug,
        model2: model2.slug,
      },
    })),
  )
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const model1Slug = context.params.model1
  const model2Slug = context.params.model2
  
  const model1 = LLMS.find((e) => `${e.slug}` == model1Slug)
  const model2 = LLMS.find((e) => `${e.slug}` == model2Slug)
  
  // Return 404 if either model is not found
  if (!model1 || !model2) {
    return {
      notFound: true,
    }
  }
  
  // Handle redirects for deprecated/renamed models
  if (model1.redirect_to || model2.redirect_to) {
    return { notFound: true }
  }
  
  return {
    props: {
      model1,
      model2,
    },
  }
}
