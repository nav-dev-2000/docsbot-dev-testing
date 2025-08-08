import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import classNames from '@/utils/classNames'
import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import RadioCardSmall from '@/components/RadioCardSmall'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { Listbox, Transition } from '@headlessui/react'
import {
  CheckIcon,
  ChevronUpDownIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'
import Chart from 'chart.js/auto'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import { LLM_PRICING } from '@/constants/llmPricing.constants'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const radioOptions = [
  { name: 'Tokens', multiplier: 1 },
  { name: 'Words', multiplier: 1.3333333333 },
  { name: 'Characters', multiplier: 0.25 },
]

const providers = [
  'All Providers',
  'OpenAI',
  'Anthropic',
  'Meta',
  'Amazon',
  'Google',
  'Cohere',
  'Mistral AI',
  'DeepSeek',
]
const modelTypes = [
  'All Types',
  'Chat/Completion Models',
  'Audio Models',
  'Fine-tuning models',
  'Embedding models',
]

export async function getStaticProps() {
  const starRatingData = await getRating('gpt-openai-api-pricing-calculator')

  return {
    props: {
      starRatingData,
    },
    revalidate: 86400,
  }
}

export default function Calculate({ starRatingData }) {
  const [inputTokens, setInputTokens] = useState(1000)
  const [outputTokens, setOutputTokens] = useState(500)
  const [apiCalls, setAPICalls] = useState(1000)
  const [type, setType] = useState(radioOptions[0])
  const posthog = usePostHog()
  const [selectedProvider, setSelectedProvider] = useState(providers[0])
  const [selectedModelType, setSelectedModelType] = useState(modelTypes[0])

  // Add this ref
  const chartRefs = useRef({})

  // Add this function
  const setChartRef = useCallback((element, modelType) => {
    if (element) {
      chartRefs.current[modelType] = element
    }
  }, [])

  const getCost = (model) => {
    return (
      (model.input_token_cost_per_million || 0) *
        ((inputTokens * type.multiplier) / 1000000) +
      (model.output_token_cost_per_million || 0) *
        ((outputTokens * type.multiplier) / 1000000)
    )
  }

  useEffect(() => {
    // Track calculator usage without specific values
    posthog?.capture('Free Tool', {
      tool: 'LLM API Pricing Calculator',
      action: 'Calculate',
      type: type.name,
      category: 'Calculator',
    })
  }, [inputTokens, outputTokens, apiCalls, type, posthog])

  const handleInputChange = (setter) => (e) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      setter(value)
    }
  }

  const handleTypeChange = (newType) => {
    setType(newType)
    posthog?.capture('Free Tool', {
      tool: 'LLM API Pricing Calculator',
      action: 'Change Type',
      newType: newType.name,
      category: 'Calculator',
    })
  }

  const filteredPricing = useMemo(() => {
    return Object.fromEntries(
      Object.entries(LLM_PRICING)
        .filter(([key, models]) => {
          if (selectedModelType !== 'All Types' && key !== selectedModelType)
            return false

          if (selectedProvider === 'All Providers') return true

          return models.some((model) => model.provider === selectedProvider)
        })
        .map(([key, models]) => [
          key,
          models.filter(
            (model) =>
              selectedProvider === 'All Providers' ||
              model.provider === selectedProvider,
          ),
        ]),
    )
  }, [selectedProvider, selectedModelType])

  const resetFilters = () => {
    setSelectedProvider(providers[0])
    setSelectedModelType(modelTypes[0])
  }

  const hasResults = Object.values(filteredPricing).some(
    (category) => category.length > 0,
  )

  // Modify the chartData function to return data for each model type
  const chartDataByType = useMemo(() => {
    const dataByType = {}

    Object.entries(filteredPricing).forEach(([category, models]) => {
      const data = models.map((model) => {
        const totalCost = getCost(model) * apiCalls
        return {
          label: `${model.provider} - ${model.model_name} ${model.context ? `(${model.context})` : ''}`,
          value: totalCost,
        }
      })

      // Sort the data from least to most expensive
      data.sort((a, b) => a.value - b.value)

      dataByType[category] = {
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: 'Total Cost',
            data: data.map((item) => item.value),
            backgroundColor: 'rgba(8, 145, 178, 0.6)',
            borderColor: 'rgba(8, 145, 178, 1)',
            borderWidth: 1,
          },
        ],
      }
    })

    return dataByType
  }, [filteredPricing, apiCalls, getCost])

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Total Cost by Model',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.x.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Total Cost ($, log scale)',
        },
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`,
        },
      },
      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 10,
          },
        },
      },
    },
  }

  // Add this function to calculate chart height
  const getChartHeight = (models) => {
    const baseHeight = 200 // Base height for the chart
    const itemHeight = 30 // Height per item
    const maxHeight = 800 // Maximum height for the chart

    const calculatedHeight = baseHeight + models.length * itemHeight
    return Math.min(calculatedHeight, maxHeight) + 'px'
  }

  return (
    <>
      <NextSeo
        title={`Free OpenAI & every-LLM API Pricing Calculator | Updated ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`}
        description="Calculate and compare the cost of using OpenAI, Azure, Anthropic, Llama 3.3, Google Gemini, Mistral, and Cohere APIs with our powerful FREE pricing calculator. Inlcudes latest pricing for chat, vision, audio, fine-tuned, and embedding models."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/llm-api-calculator.png',
              alt: 'LLM API Pricing Calculator',
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
          <div className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  OpenAI & all LLM API Pricing Calculator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Calculate and compare the cost of using OpenAI, Azure,
                  Anthropic Claude, Llama, Google Gemini, Mistral, Cohere, and
                  Grok LLM APIs for your AI project with our simple and powerful
                  free calculator. Latest numbers as of{' '}
                  <span className="font-bold">
                    {new Date().toLocaleString('default', { month: 'short' })}{' '}
                    {new Date().getFullYear()}
                  </span>
                  .
                </p>
                <div className="mx-auto mt-10 max-w-xl text-left">
                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-9">
                    <div className="sm:col-span-3">
                      <label
                        htmlFor="input-tokens"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Input {type.name}
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="input-tokens"
                          id="input-tokens"
                          autoComplete="off"
                          min={1}
                          step={100}
                          value={inputTokens}
                          onChange={handleInputChange(setInputTokens)}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-center text-xl font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="output-tokens"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        Output {type.name}
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          id="output-tokens"
                          autoComplete="off"
                          min={1}
                          step={100}
                          value={outputTokens}
                          onChange={handleInputChange(setOutputTokens)}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-center text-xl font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="api-calls"
                        className="block text-sm font-medium leading-6 text-white"
                      >
                        API Calls
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          id="api-calls"
                          autoComplete="off"
                          min={1}
                          step={10}
                          value={apiCalls}
                          onChange={handleInputChange(setAPICalls)}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-center text-xl font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="text-white sm:col-span-9">
                      <RadioCardSmall
                        options={radioOptions}
                        title="Calculate by"
                        value={type}
                        setValue={handleTypeChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="-mx-6 mt-16 max-w-7xl bg-white p-4 px-2 shadow-2xl ring-1 ring-white/10 sm:mx-6 sm:mt-24 sm:rounded-lg sm:p-6 lg:p-8">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">
                      Pricing Calculations
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                      The following pricing calculations are based on the input
                      tokens, output tokens, and API calls you have entered
                      above.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flow-root">
                  <div className="gap-x-4 sm:flex sm:items-center">
                    <div className="w-full sm:max-w-56">
                      <Listbox
                        value={selectedModelType}
                        onChange={setSelectedModelType}
                      >
                        <Listbox.Label className="block text-xs font-medium leading-6">
                          Model Type
                        </Listbox.Label>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm sm:leading-6">
                            <span className="block truncate">
                              {selectedModelType}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {modelTypes.map((type) => (
                                <Listbox.Option
                                  key={type}
                                  className={({ active }) =>
                                    classNames(
                                      active
                                        ? 'bg-cyan-600 text-white'
                                        : 'text-gray-900',
                                      'relative cursor-default select-none py-2 pl-3 pr-9',
                                    )
                                  }
                                  value={type}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span
                                        className={classNames(
                                          selected
                                            ? 'font-semibold'
                                            : 'font-normal',
                                          'block truncate',
                                        )}
                                      >
                                        {type}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={classNames(
                                            active
                                              ? 'text-white'
                                              : 'text-cyan-600',
                                            'absolute inset-y-0 right-0 flex items-center pr-4',
                                          )}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    <div className="w-full sm:max-w-48">
                      <Listbox
                        value={selectedProvider}
                        onChange={setSelectedProvider}
                      >
                        <Listbox.Label className="block text-xs font-medium leading-6">
                          Provider
                        </Listbox.Label>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:text-sm sm:leading-6">
                            <span className="block truncate">
                              {selectedProvider}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {providers.map((provider) => (
                                <Listbox.Option
                                  key={provider}
                                  className={({ active }) =>
                                    classNames(
                                      active
                                        ? 'bg-cyan-600 text-white'
                                        : 'text-gray-900',
                                      'relative cursor-default select-none py-2 pl-3 pr-9',
                                    )
                                  }
                                  value={provider}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span
                                        className={classNames(
                                          selected
                                            ? 'font-semibold'
                                            : 'font-normal',
                                          'block truncate',
                                        )}
                                      >
                                        {provider}
                                      </span>
                                      {selected ? (
                                        <span
                                          className={classNames(
                                            active
                                              ? 'text-white'
                                              : 'text-cyan-600',
                                            'absolute inset-y-0 right-0 flex items-center pr-4',
                                          )}
                                        >
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  {hasResults ? (
                    <>
                      {Object.entries(filteredPricing).map(
                        ([category, models]) => (
                          <div key={category} className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {category}
                            </h3>

                            {/* Chart for this category */}
                            <div
                              style={{
                                height: getChartHeight(models),
                                width: '100%',
                              }}
                              ref={(el) => setChartRef(el, category)}
                            >
                              <Bar
                                data={chartDataByType[category]}
                                options={{
                                  ...chartOptions,
                                  responsive: true,
                                  maintainAspectRatio: false,
                                }}
                              />
                            </div>

                            {/* Table for this category */}
                            <div className="mt-6 flow-root">
                              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                  <table className="min-w-full">
                                    <thead className="bg-white">
                                      <tr>
                                        <th
                                          scope="col"
                                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3"
                                        >
                                          Provider
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                          Model
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                          Context
                                        </th>
                                        <th
                                          scope="col"
                                          className="hidden px-3 py-3.5 pl-6 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                                        >
                                          Input/1M
                                        </th>
                                        <th
                                          scope="col"
                                          className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                                        >
                                          Output/1M
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                                        >
                                          Per Call
                                        </th>
                                        <th
                                          scope="col"
                                          className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                                        >
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                      {models.map((model, modelIdx) => (
                                        <tr
                                          key={
                                            model.provider +
                                            model.model_name +
                                            model.context
                                          }
                                          className={classNames(
                                            modelIdx === 0
                                              ? 'border-gray-300'
                                              : 'border-gray-200',
                                            'border-t',
                                          )}
                                        >
                                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                                            {model.provider}
                                            {model.api_provider && (
                                              <div className="text-xs text-gray-500">
                                                via {model.api_provider}
                                              </div>
                                            )}
                                          </td>
                                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3">
                                            {model.page_slug ? (
                                              <a
                                                href={`/models/${model.page_slug}`}
                                                className="hover:underline"
                                              >
                                                {model.model_name}
                                              </a>
                                            ) : (
                                              model.model_name
                                            )}
                                            {model.model_slug && (
                                              <div className="text-xs text-gray-500">
                                                {model.model_slug}
                                              </div>
                                            )}
                                          </td>
                                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {model.context}
                                          </td>
                                          <td className="hidden whitespace-nowrap border-l border-gray-200 px-3 py-4 pl-6 text-sm text-gray-500 sm:table-cell">
                                            $
                                            {model.input_token_cost_per_million}
                                          </td>
                                          <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                                            {model.output_token_cost_per_million && (
                                              <>
                                                $
                                                {
                                                  model.output_token_cost_per_million
                                                }
                                              </>
                                            )}
                                          </td>
                                          <td className="relative whitespace-nowrap border-l border-gray-200 py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                                            ${getCost(model).toFixed(4)}
                                          </td>
                                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                                            $
                                            {(
                                              getCost(model) * apiCalls
                                            ).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </>
                  ) : (
                    <div className="mt-6 text-center">
                      <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        No results found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No models match your current filter selection.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                        >
                          Reset filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-50rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80ccff] to-[#35bda4] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <StarRating
            itemId="gpt-openai-api-pricing-calculator"
            name="OpenAI & all LLM API Pricing Calculator - DocsBot"
            className="mx-auto mb-12 flex justify-center text-white"
            starRatingData={starRatingData}
          />

          <div className="prose relative mx-auto max-w-5xl px-4 pb-32 text-white sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI LLM Model Pricing: A Comprehensive Overview
            </h2>
            <p>
              The landscape of large language models (LLMs) is evolving rapidly,
              with providers like OpenAI, Anthropic, Google, Meta, and xAI
              pushing boundaries in reasoning ability, multimodal input/output,
              and context capacity. Understanding how these models are priced,
              what factors affect cost, and the strategic direction of each
              provider is essential for developers, enterprises, and researchers
              seeking to deploy AI effectively.
            </p>

            <h3 className="text-white">
              Tokens: The Fundamental Unit of Pricing
            </h3>
            <p>
              All commercial LLMs bill based on tokens, which are small chunks
              of text the model processes. A token might be as short as one
              character or as long as a short word, depending on the language
              and content. As a rule of thumb, 1,000 tokens equates to around
              750 words in English. APIs usually price input (prompt) and output
              (completion) tokens separately, with the output rate often higher.
            </p>
            <p>
              Token counts can spike with verbose instructions, long documents,
              or outputs that include detailed explanations. Non-English
              scripts, code, or emoji can change tokenization, sometimes
              increasing cost. Managing token usage is therefore a direct lever
              on AI spend.
            </p>

            <h3 className="text-white">Context Length</h3>
            <p>
              Context length determines how much information a model can
              consider in one request. This includes both the prompt and the
              generated response. Longer contexts enable more advanced use
              cases: multi-document analysis, sustained conversation without
              loss of memory, and processing large datasets in a single call.
              However, larger contexts also consume more tokens, raising cost.
            </p>
            <ul>
              <li>
                <strong className="text-white">Complexity</strong>: With more
                available context, the model can link concepts across multiple
                documents, summarize lengthy reports, and answer complex,
                multi-part questions.
              </li>
              <li>
                <strong className="text-white">Continuity</strong>: In
                conversational AI, a longer context preserves the thread of
                discussion over many turns, producing more relevant and coherent
                answers.
              </li>
              <li>
                <strong className="text-white">Cost</strong>: A larger context
                window does not just enable richer conversations—it multiplies
                the number of tokens processed per request, directly impacting
                spend.
              </li>
            </ul>

            <h3 className="text-white">
              Flagship Providers and Their Latest Models
            </h3>
            <div className="not-prose mt-6 space-y-10">
              <div>
                <h4 className="text-lg font-semibold text-white">OpenAI</h4>
                <ul className="list-disc pl-6">
                  <li>
                    <strong className="text-white">GPT-5</strong>: OpenAI’s most
                    advanced general-purpose model, delivering frontier-level
                    reasoning, lower hallucination rates, and refined
                    instruction-following. It supports multimodal inputs (text,
                    images) and extended contexts beyond 128k tokens, enabling
                    deep analysis and creative generation for demanding business
                    and research needs.
                  </li>
                  <li>
                    <strong className="text-white">o3</strong>: Designed for
                    deliberate, step-by-step reasoning. It shines in tasks
                    requiring planning, multi-hop logic, and integrated tool use
                    like code execution or document retrieval.
                  </li>
                  <li>
                    <strong className="text-white">o4-mini</strong>: An
                    efficient variant balancing cost and capability, optimized
                    for high-volume workloads where speed and scale matter more
                    than maximum accuracy.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Google</h4>
                <ul className="list-disc pl-6">
                  <li>
                    <strong className="text-white">Gemini 2.5 Pro</strong>: A
                    multimodal powerhouse supporting text, image, audio, and
                    video understanding with a massive 1M-token context. It
                    excels in data-heavy analysis, multilingual processing, and
                    enterprise-scale knowledge work.
                  </li>
                  <li>
                    <strong className="text-white">Gemini 2.5 Flash</strong>:
                    Optimized for responsiveness and cost-efficiency, making it
                    ideal for real-time customer interactions and iterative
                    workflows.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Meta</h4>
                <ul className="list-disc pl-6">
                  <li>
                    <strong className="text-white">Llama 3.1</strong>:
                    Open-weight models with parameter sizes up to hundreds of
                    billions, fine-tuneable for domain-specific applications.
                    Performance approaches proprietary models for many tasks at
                    a fraction of the deployment cost.
                  </li>
                  <li>
                    <strong className="text-white">Llama 4</strong>: Introduces
                    mixture-of-experts routing for efficiency and scalability.
                    Some variants push context lengths into the multi-million
                    token range for specialized research use.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Anthropic</h4>
                <ul className="list-disc pl-6">
                  <li>
                    <strong className="text-white">Claude 4 Sonnet</strong>: A
                    balanced model offering high performance at moderate cost,
                    with a 200k-token context. Particularly strong in
                    summarization, customer support, and content transformation.
                  </li>
                  <li>
                    <strong className="text-white">Claude 4 Opus</strong>:
                    Premium-tier reasoning with exceptional code generation and
                    complex analysis capabilities, used for high-stakes
                    problem-solving.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">xAI</h4>
                <ul className="list-disc pl-6">
                  <li>
                    <strong className="text-white">Grok 4</strong>: Built for
                    real-time, knowledge-rich interaction. Integrates live
                    search, code execution, and supports voice/image I/O.
                    Designed to function as a connected, always-updating
                    assistant.
                  </li>
                </ul>
              </div>
            </div>

            <h3 className="text-white">Language Models and Pricing</h3>
            <p>
              Pricing varies by model family and is generally quoted per million
              tokens, with higher rates for outputs. Large-context models may
              appear more expensive but can reduce overall calls by processing
              more data per request. The right model choice balances speed,
              accuracy, and budget.
            </p>
            <p>
              For high-volume, low-complexity workloads, smaller or optimized
              models (like o4-mini or Gemini Flash) deliver significant cost
              savings. For research, engineering, and analytics, top-tier
              reasoning models justify their higher price with accuracy and
              reduced human oversight.
            </p>

            <h3 className="text-white">Fine-tuning Models</h3>
            <p>
              Fine-tuning lets you adapt a base model to your unique tone, data,
              and tasks. The process involves training the model on your
              examples, reducing prompt length and improving response
              reliability. While training incurs an upfront cost in tokens,
              long-term usage can be cheaper due to shorter and more efficient
              prompts.
            </p>
            <p>
              Providers offer supervised fine-tuning and, increasingly,
              parameter-efficient techniques like LoRA for faster and cheaper
              adaptation without retraining the full model.
            </p>

            <h3 className="text-white">Embedding Models</h3>
            <p>
              Embeddings convert text into numerical vectors that capture
              semantic meaning. They are the foundation of search, clustering,
              recommendation, and retrieval-augmented generation (RAG)
              pipelines. By comparing vector similarity, applications can find
              relevant context before passing it to an LLM.
            </p>
            <ul>
              <li>
                Improve relevance and reduce LLM cost by narrowing input to only
                relevant passages.
              </li>
              <li>
                Enable personalization by matching user profiles to similar past
                cases.
              </li>
              <li>Store once and query many times for efficiency.</li>
            </ul>

            <h3 className="text-white">Pricing Strategies</h3>
            <ul>
              <li>
                Match model complexity to the use case—don’t overpay for unused
                capabilities.
              </li>
              <li>
                Use retrieval to shorten prompts and avoid sending full
                documents.
              </li>
              <li>Cache responses for repeated queries to save cost.</li>
              <li>
                Experiment with smaller models for prototype phases before
                scaling to flagship models.
              </li>
            </ul>
          </div>

          <RegisterCTA />

          {/* Add FreeToolsGrid section with white background */}
          <div className="bg-white py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <FreeToolsGrid />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
