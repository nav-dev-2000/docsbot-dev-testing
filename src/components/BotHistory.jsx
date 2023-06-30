import { Listbox, Transition } from '@headlessui/react'
import { useEffect, Fragment, useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import Chart from 'chart.js/auto'
import classNames from '@/utils/classNames'
import LoadingSpinner from '@/components/LoadingSpinner'
import { stripePlan } from '@/utils/helpers'
import Checkout from '@/components/Checkout'
import Link from 'next/link'

const intervals = [
  { value: 7, title: 'Week' },
  { value: 30, title: 'Month' },
  { value: 90, title: 'Quarter' },
]

const defaultSelected = 30

export default function BotHistory({ team, botId }) {
  const [selected, setSelected] = useState(
    intervals.filter((interval) => interval.value === defaultSelected)[0]
  )
  const [labels, setLabels] = useState(null)
  const [countData, setCountData] = useState(null)
  const [negativeData, setNegativeData] = useState(null)
  const [positiveData, setPositiveData] = useState(null)
  const [escalatedData, setEscalatedData] = useState(null)
  const [percentageData, setPercentageData] = useState(null)
  const [percentageLabels, setPercentageLabels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // blur is only enabled when we've reached our plan limit
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return stripePlan(team).bots < 10
  })

  const updateData = async (timeDelta) => {
    if (isProcessing) return
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    const apiUrl = `/api/teams/${team.id}/bots/${botId}/stats?timeDelta=${timeDelta}`
    try {
      setIsProcessing(true)
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      })
      setIsProcessing(false)
      if (response.ok) {
        const {
          countData,
          positiveData,
          negativeData,
          escalatedData,
          labels,
          percentageData,
          percentageLabels,
        } = await response.json()
        setLabels(labels)
        setCountData(countData)
        setNegativeData(negativeData)
        setPositiveData(positiveData)
        setEscalatedData(escalatedData)
        setPercentageData(percentageData)
        setPercentageLabels(percentageLabels)
      } else {
        try {
          const data = await response.json()
          if (data.error) {
            console.warn(data.error || 'Something went wrong, please try again.')
          }
        } catch (e) {
          console.warn(e)
        }
      }
    } catch (e) {
      console.warn(e)
    }
  }

  useEffect(() => {
    if (!countData || !labels) return
    let lineChart = new Chart(document.getElementById('line-chart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Questions',
            data: countData,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Positive',
            data: positiveData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Negative',
            data: negativeData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Escalations',
            data: escalatedData,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      },
    })

    let pieChart = new Chart(document.getElementById('pie-chart'), {
      type: 'pie',
      data: {
        labels: percentageLabels,
        datasets: [
          {
            data: percentageData,
            backgroundColor: ['#36A2EB', '#10B981', '#EF4444', '#F59E0B'],
          },
        ],
      },
    })

    // cleanup
    return () => {
      lineChart.destroy()
      pieChart.destroy()
    }
  }, [
    labels,
    countData,
    positiveData,
    negativeData,
    escalatedData,
    percentageData,
    percentageLabels,
  ])

  useEffect(() => {
    updateData(selected.value)
  }, [])

  return (
    <div className="mx-0 mt-4 rounded-lg bg-white p-4 shadow-lg lg:p-8">
      <div className="mb-12">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold leading-6 text-gray-900">Bot Statistics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Statistics about the questions you or users have asked your bot.
            </p>
          </div>
          <div className="mt-4 w-28 sm:mt-0 sm:flex-none">
            <Listbox
              value={selected}
              onChange={(val) => {
                setSelected(val)
                updateData(val.value)
              }}
            >
              {({ open }) => (
                <>
                  <Listbox.Label className="block text-sm font-medium text-gray-700">
                    Timeframe
                  </Listbox.Label>
                  <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 sm:text-sm sm:leading-6">
                      <span className="block truncate">{selected.title}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </span>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {intervals.map((interval) => (
                          <Listbox.Option
                            key={interval.value}
                            className={({ active }) =>
                              classNames(
                                active ? 'bg-cyan-600 text-white' : 'text-gray-900',
                                'relative cursor-default select-none py-1 pl-3 pr-9'
                              )
                            }
                            value={interval}
                          >
                            {({ selected, active }) => (
                              <>
                                <div className="flex">
                                  <span
                                    className={classNames(
                                      selected ? 'font-semibold' : 'font-normal',
                                      'block truncate text-gray-900'
                                    )}
                                  >
                                    {interval.title}
                                  </span>
                                </div>

                                {selected ? (
                                  <span
                                    className={classNames(
                                      active ? 'text-white' : 'text-cyan-600',
                                      'absolute inset-y-0 right-0 flex items-center pr-4'
                                    )}
                                  >
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </>
              )}
            </Listbox>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="flex h-24 items-center justify-center">
          <LoadingSpinner large={true} className="mr-4" />
          Loading...
        </div>
      )}

      {blurEnabled && (
        <div className="z-10 mt-32 -mb-72 w-full relative">
          <div className="py-4">
            <Checkout team={team}>
              <h3 className="text-3xl font-bold">View advanced bot statistics</h3>
              <p className="mb-8 text-center text-gray-700">
                Upgrade to the Pro plan or higher to unlock advance question statistics. View{' '}
                <Link href="/#pricing" target="_blank" className="underline">
                  plan details
                </Link>
                .
              </p>
            </Checkout>
          </div>
        </div>
      )}
      <div className={classNames('align-middle md:flex', blurEnabled ? 'blur-lg' : '')}>
        <div className="flex-auto">
          <canvas id="line-chart"></canvas>
        </div>
        <div className="flex-none">
          <canvas id="pie-chart"></canvas>
        </div>
      </div>
    </div>
  )
}
