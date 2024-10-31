import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import classNames from '@/utils/classNames'
import { Fragment, useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
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
  'Google',
  'Cohere',
  'Mistral AI',
  'DataBricks',
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
      const data = models.map(model => {
        const totalCost = getCost(model) * apiCalls
        return {
          label: `${model.provider} - ${model.model_name} ${model.context ? `(${model.context})` : ''}`,
          value: totalCost
        }
      })

      // Sort the data from least to most expensive
      data.sort((a, b) => a.value - b.value)

      dataByType[category] = {
        labels: data.map(item => item.label),
        datasets: [
          {
            label: 'Total Cost',
            data: data.map(item => item.value),
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
    const baseHeight = 200; // Base height for the chart
    const itemHeight = 30; // Height per item
    const maxHeight = 800; // Maximum height for the chart
    
    const calculatedHeight = baseHeight + (models.length * itemHeight);
    return Math.min(calculatedHeight, maxHeight) + 'px';
  };

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
                  Anthropic Claude, Llama 3, Google Gemini, Mistral, and Cohere
                  LLM APIs for your AI project with our simple and powerful free
                  calculator. Latest numbers as of{' '}
                  <span className="font-bold">October 2024</span>.
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
                      {Object.entries(filteredPricing).map(([category, models]) => (
                        <div key={category} className="mt-6">
                          <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                          
                          {/* Chart for this category */}
                          <div 
                            style={{ height: getChartHeight(models), width: '100%' }} 
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
                                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                                        Provider
                                      </th>
                                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Model
                                      </th>
                                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Context
                                      </th>
                                      <th scope="col" className="hidden px-3 py-3.5 pl-6 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                                        Input/1M
                                      </th>
                                      <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                                        Output/1M
                                      </th>
                                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                        Per Call
                                      </th>
                                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                        Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white">
                                    {models.map((model, modelIdx) => (
                                      <tr
                                        key={model.provider + model.model_name + model.context}
                                        className={classNames(
                                          modelIdx === 0 ? 'border-gray-300' : 'border-gray-200',
                                          'border-t'
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
                                            <a href={`/models/${model.page_slug}`} className="hover:underline">
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
                                          ${model.input_token_cost_per_million}
                                        </td>
                                        <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                                          {model.output_token_cost_per_million && (
                                            <>${model.output_token_cost_per_million}</>
                                          )}
                                        </td>
                                        <td className="relative whitespace-nowrap border-l border-gray-200 py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                                          ${getCost(model).toFixed(4)}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                                          ${(getCost(model) * apiCalls).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
              OpenAI, Anthropic, Google, Cohere, Mistral, and Meta offer a
              diverse range of models, each tailored to specific tasks and
              capabilities. Understanding the pricing structure is crucial for
              businesses and developers looking to integrate these models into
              their applications. Here&#39;s a detailed look at how they
              structure their pricing.
            </p>
            <h3
              className="text-white"
              id="1-tokens-the-fundamental-unit-of-pricing-"
            >
              Tokens: The Fundamental Unit of Pricing
            </h3>
            <p>
              LLM pricing usually revolves around the concept of
              &quot;tokens.&quot; A token can be thought of as a piece of a
              word. To give you a perspective, 1,000 tokens equate to
              approximately 750 words. For instance, the sentence &quot;This
              paragraph is 5 tokens&quot; itself is 5 tokens long.
            </p>
            <p>
              A useful guideline to remember when working with tokens is that,
              for typical English text, one token usually equates to
              approximately four characters. This means that a token represents
              about three-quarters of a word. Non-English languages like
              Japanese can change this calculation significantly.
            </p>

            <h3
              className="text-white"
              id="1-tokens-the-fundamental-unit-of-pricing-"
            >
              Context Length
            </h3>
            <p>
              With Large Language Models (LLMs), especially those developed by
              OpenAI, the term "context length" is common. It's an important
              concept to grasp, as it directly impacts the model's performance,
              capabilities, and, consequently, the cost. Here's a deep dive into
              what context length means and why it matters.
            </p>
            <h4 className="text-white">What is Context Length?</h4>
            <p>
              Context length refers to the amount of information or the number
              of tokens a model can consider or "remember" from a given input at
              one time. It's essentially the model's "working memory" when
              processing a request. For instance, if a model has a context
              length of 8,000 (8K) tokens, it can consider up to 8,000 tokens
              from the input and output in a single pass.
            </p>
            <h4 className="text-white">Why Does Context Length Matter?</h4>
            <ul>
              <li>
                <strong className="text-white">Complexity of Tasks</strong>:
                Longer context lengths allow the model to handle more complex
                tasks that require understanding and processing larger chunks of
                information. For instance, summarizing a long article or
                answering questions about a detailed technical document might
                require a model with a longer context length.
              </li>
              <li>
                <strong className="text-white">
                  Continuity in Conversations
                </strong>
                : In chatbot applications, a longer context ensures that the
                model remembers more of the previous conversation, leading to
                more coherent and contextually relevant responses.
              </li>
              <li>
                <strong className="text-white">Cost Implications</strong>:
                Models with longer context lengths typically come at a higher
                price point due to the increased computational resources they
                consume.
              </li>
            </ul>
            <h3
              className="text-white"
              id="2-language-models-power-and-flexibility-"
            >
              Language Models: Chat, Text Generation, and Reasoning
            </h3>
            <p>
              OpenAI and others offer multiple language models, each with
              distinct capabilities and price points. The pricing for these
              models is typically per 1 Million tokens.
            </p>
            <ul>
              <li>
                <p>
                  <strong className="text-white">OpenAI GPT-4o</strong>:{' '}
                  <Link
                    className="text-teal-400"
                    href="https://openai.com/index/hello-gpt-4o/"
                    target="_blank"
                  >
                    GPT-4o
                  </Link>{' '}
                  (Omni) is OpenAI's most advanced multimodal model that's 2x
                  faster and 50% cheaper than GPT-4 Turbo with stronger vision
                  capabilities. The model has 128K context and an October 2023
                  knowledge cutoff. It will soon support audio inputs and text,
                  image, and audio outputs. There is also a mini version with
                  the same context limit, tokenizer, and knowledge cutoff, but
                  60% cheaper.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">
                    OpenAI GPT-4o Realtime and Audio
                  </strong>
                  : These new models, available in public beta to all paid
                  developers, power the Realtime API and Chat Completions API
                  respectively. Both support text and voice capabilities. For
                  text, they're priced at $5 per 1M input tokens and $20 per 1M
                  output tokens. Audio input is priced at $100 per 1M tokens
                  (approximately $0.06 per minute), and audio output at $200 per
                  1M tokens (approximately $0.24 per minute). Realtime API is
                  for streaming audio into and out of the model. Chat
                  Completions API is for combined text and voice conversations.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">
                    OpenAI's o1-preview and o1-mini models
                  </strong>{' '}
                  represent a significant advancement in AI reasoning,
                  particularly in complex domains like science, coding, and
                  math. The o1-preview model excels in thoughtful reasoning,
                  employing an internal chain-of-thought processing approach
                  that mirrors human cognition, leading to more accurate and
                  insightful answers. Meanwhile, the o1-mini model offers a
                  cost-effective solution for developers, focusing on STEM
                  domains with high reasoning power at a lower cost. These
                  models are designed to tackle challenging problems, setting a
                  new standard in AI capabilities. For more details, visit the{' '}
                  <a
                    href="https://docsbot.ai/article/a-new-era-of-ai-reasoning-openais-o1-preview-and-o1-mini-models"
                    target="_blank"
                    className="text-teal-400"
                  >
                    full article
                  </a>
                  .
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">OpenAI GPT-4</strong>: Known
                  for its broad general knowledge and domain expertise, GPT-4 is
                  adept at following intricate instructions in natural language
                  and solving challenging problems with precision. It's also
                  slower and more expensive than other models. The recently
                  released GPT-4 Turbo (gpt-4-turbo) is 3x more affordable and
                  supports an amazing 128K context limit! Also available via
                  Microsoft's Azure OpenAI Service.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">OpenAI GPT-3.5 Turbo</strong>:
                  This model is optimized for dialogue, making it ideal for
                  chatbot applications and conversational interfaces. It is also
                  the fastest and most cost-effective model for generating text.
                  Also available via Microsoft's Azure OpenAI Service.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">Anthropic's Claude 3</strong>:
                  Claude 3 includes three state-of-the-art models in ascending
                  order of capability: Claude 3 Haiku, Claude 3.5 Sonnet, and
                  Claude 3 Opus. Each successive model offers increasingly
                  powerful performance, allowing users to select the optimal
                  balance of intelligence, speed, and cost for their specific
                  application. Opus is comparable to GPT-4 in performance, while
                  Haiku is the most cost-effective model, while still beating
                  GPT-3.5 Turbo in many benchmarks. 3.5 Sonnet is a newer
                  release with low pricing, high speed, and performance
                  comparable to GPT-4o. Claude 3 has a huge 200K context window
                  and is available via Anthropic's API and claud.ai.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">Llama 3.1</strong>: Llama 3.1
                  is the latest open-source large language model (LLM) developed
                  by Meta, the parent company of Facebook. It stands as Meta's
                  answer to OpenAI's GPT-4 series and Google's AI models such as
                  Gemini. However, it distinguishes itself by being freely
                  accessible for both research and commercial endeavors.
                  Generally similar to GPT-3.5 Turbo in performace, Llama 3 is a
                  powerful model that can be used for a variety of tasks,
                  including text generation, summarization, and question
                  answering. It is also approaching the level of GPT-4 on many
                  benchmarks for substantially less cost. One downside it Llama
                  3.1 is primarily an English only model.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">Gemini</strong>: Gemini is the
                  newest family of multimodal large language models developed by
                  Google, serving as the successor to PaLM 2. Comprising Gemini
                  Ultra, Gemini Pro, and Gemini Flash in 1.0 and 1.5 versions,
                  it was announced on December 6, 2023. Gemini Ultra is
                  positioned as the first contender to OpenAI's GPT-4, while
                  Gemini Pro is closer in performance to GPT-3.5. Gemini Pro 1.5
                  and Gemini Flash 1.5 are the latest publically available
                  versions, with an industry-leading 1M context window
                  multimodal support for video, audio, images, and text. Gemini
                  models are available via Google's Vertex AI Platform.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">PaLM 2</strong>: PaLM 2 is an
                  older language model from Google boasting enhanced
                  multilingual, reasoning, and coding capabilities. Trained on
                  multilingual text from over 100 languages, it excels in
                  understanding and translating intricate text forms like idioms
                  and poems. Its dataset, rich with scientific papers and web
                  content, empowers it with superior logic, reasoning, and
                  mathematical skills. Additionally, its proficiency in coding
                  is evident from its training on vast source code datasets,
                  making it adept in languages from Python to Fortran.
                </p>
              </li>
              <li>
                <p>
                  <strong className="text-white">Mistral</strong>: Mistral AI is
                  a new exciting startup that has released a number of small
                  open source models that are very fast and cheap to use.
                  Mistral 7B and Mixtral 8x7B (Mixtral) are two of their most
                  popular open models. Mixtral beats Llama 2 and compares in
                  performance to GPT-3.5 Turbo and is 2.5x cheaper to use.
                  Mistral Large is a private model with benchmarks approaching
                  GPT-4 level for reasoning tasks in English, Spanish, French,
                  German, and Italian.
                </p>
              </li>
            </ul>
            <h3
              className="text-white"
              id="3-fine-tuning-models-customization-at-its-best-"
            >
              Fine-tuning Models
            </h3>
            <p>
              OpenAI allows users to create custom models by fine-tuning base
              models with their training data. Once a model is fine-tuned, users
              are billed only for the tokens they use in requests to that
              specific model. This offers a level of customization that can be
              tailored to specific business needs. It can save costs by
              eliminating the need to include common system prompts or few-shot
              examples in every request if it will be used over and over again.
            </p>
            <h3
              className="text-white"
              id="4-embedding-models-advanced-functionalities-"
            >
              Embedding Models: Semantic Search and Clustering
            </h3>
            <p>
              Embedding models are designed to build advanced functionalities
              like search, clustering, topic modeling, and classification. They
              are essential for applications that require nuanced understanding
              and categorization of data like{' '}
              <Link
                className="text-teal-400"
                href="/article/you-shouldnt-build-your-own-ai-support-bot"
              >
                AI support chatbots using Retreival Augmented Generation (RAG)
              </Link>
              .
            </p>
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
