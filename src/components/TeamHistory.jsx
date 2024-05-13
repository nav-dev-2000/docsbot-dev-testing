import { Listbox, Transition } from '@headlessui/react'
import { useEffect, Fragment, useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { Pie, Line } from 'react-chartjs-2'
import classNames from '@/utils/classNames'
import Chart from 'chart.js/auto'
import { stripePlan, getStats } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import Link from 'next/link'
import LocalStringNum from '@/components/LocalStringNum'

const intervals = [
  { value: 7, title: 'Week' },
  { value: 30, title: 'Month' },
  { value: 90, title: 'Quarter' },
]

const defaultSelected = 30

export default function TeamHistory({ team }) {
  const [selected, setSelected] = useState(
    intervals.filter((interval) => interval.value === defaultSelected)[0]
  )
  const [stats, setStats] = useState(null)
  const [lineData, setLineData] = useState(null)
  const [pieData, setPieData] = useState(null)
  const [escalatedPieData, setEscalatedPieData] = useState(null)
  const [answerPieData, setAnswerPieData] = useState(null)
  // blur is only enabled when we've reached our plan limit
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return stripePlan(team).bots < 10
  })
  const [showUpgrade, setShowUpgrade] = useState(false)

  const updateData = async (timeDelta) => {
    setStats(getStats(team, timeDelta))
  }

  useEffect(() => {
    if (!stats) return

    setLineData({
      labels: stats.labels,
      datasets: [
        {
          label: 'All Questions',
          data: stats.countData,
          borderColor: '#76B7B2',
          backgroundColor: 'rgba(118, 183, 178, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Negative',
          data: stats.negativeData,
          borderColor: '#E15759',
          backgroundColor: 'rgba(225, 87, 89, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Positive',
          data: stats.positiveData,
          borderColor: '#59A14F',
          backgroundColor: 'rgba(0, 204, 102, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Could Answer',
          data: stats.couldAnswerData,
          borderColor: '#9e74d5',
          backgroundColor: 'rgba(158, 116, 213, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Escalations',
          data: stats.escalatedData,
          borderColor: '#EDC948',
          backgroundColor: 'rgba(237, 201, 72, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    })

    setPieData({
      labels: stats.percentageLabels,
      datasets: [
        {
          data: stats.counts,
          backgroundColor: ['#76B7B2', '#E15759', '#59A14F'],
        },
      ],
    })

    setEscalatedPieData({
      labels: stats.escalatedLabels,
      datasets: [
        {
          data: stats.escalatedCounts,
          backgroundColor: ['#EDC948', '#76B7B2'],
        },
      ],
    })

    if (stats.couldAnswerRate) {
      setAnswerPieData({
        labels: stats.answerLabels,
        datasets: [
          {
            data: stats.answerCounts,
            backgroundColor: ['#59A14F', '#E15759'],
          },
        ],
      })
    }
  }, [stats])

  useEffect(() => {
    updateData(selected.value)
  }, [])

  return (
    <div className="mx-0 mt-8 rounded-lg bg-white p-4 shadow-lg lg:p-8">
      <div className="mb-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Team Statistics
            </h2>
            <p className="mt-4 text-gray-500">
              Statistics about the questions you or users have asked all team bots.
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

      {stats && (
        <>
          <dl className="mt-6 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
              <dt className="text-sm font-semibold leading-6 text-gray-600">User questions</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                <LocalStringNum value={stats.totalCount} />
              </dd>
            </div>
            <div
              className="flex flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10"
              title="Answers with no negative rating or support escalation"
            >
              <dt className="text-sm font-semibold leading-6 text-gray-600">Resolution rate</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                {stats.resolutionRate != '0' ? stats.resolutionRate + '%' : 'N/A'}
              </dd>
            </div>
            <div
              className="flex flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10"
              title="Questions the AI determined it could confidently answer"
            >
              <dt className="text-sm font-semibold leading-6 text-gray-600">Answer rate</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                {stats.couldAnswerRate != '0' ? stats.couldAnswerRate + '%' : 'N/A'}
              </dd>
            </div>
            <div
              className="flex flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10"
              title="Answers with no support escalation"
            >
              <dt className="text-sm font-semibold leading-6 text-gray-600">Deflection rate</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                {stats.deflectionRate != '0' ? stats.deflectionRate + '%' : 'N/A'}
              </dd>
            </div>
            <div
              className="flex flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10"
              title="Assuming an average of 5mins/ticket"
            >
              <dt className="text-sm font-semibold leading-6 text-gray-600">
                Support staff time saved
              </dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                <LocalStringNum value={stats.timeSaved} /> Mins
              </dd>
            </div>
          </dl>

          {blurEnabled && (
            <div className="relative z-10 -mb-72 mt-32 w-full">
              <div className="flex justify-center py-4 text-center">
                <div className="max-w-3xl">
                  <h3 className="text-3xl font-bold">View advanced team statistics</h3>
                  <p className="mb-8 text-center text-gray-700">
                    Upgrade to the Pro plan or higher to unlock advance question statistics. View{' '}
                    <Link href="/#pricing" target="_blank" className="underline">
                      plan details
                    </Link>
                    .
                  </p>
                  <button
                    type="button"
                    className="text-md inline-flex w-64 cursor-pointer items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 "
                    onClick={(e) => setShowUpgrade(true)}
                  >
                    <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    Upgrade Plan
                  </button>
                  <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
                </div>
              </div>
            </div>
          )}

          <div
            className={classNames(
              'items-center space-x-4 align-middle',
              blurEnabled ? 'blur-lg' : ''
            )}
          >
            <div className="mt-6 h-96 w-full">
              {lineData && (
                <Line data={lineData} options={{ maintainAspectRatio: false, responsive: true }} />
              )}
            </div>
          </div>
          <div
            className={classNames(
              'grid items-center space-x-4 align-middle sm:grid-cols-1 lg:grid-cols-3',
              blurEnabled ? 'blur-lg' : ''
            )}
          >
            <div className="m-auto mt-6 flex h-80 justify-center">
              {pieData && (
                <Pie
                  data={pieData}
                  options={{
                    maintainAspectRatio: true,
                    responsive: true,
                  }}
                />
              )}
            </div>
            <div className="m-auto mt-6 flex h-80 justify-center">
              {escalatedPieData && (
                <Pie
                  data={escalatedPieData}
                  options={{
                    maintainAspectRatio: true,
                    responsive: true,
                  }}
                />
              )}
            </div>
            <div className="m-auto mt-6 flex h-80 justify-center">
              {answerPieData && (
                <Pie
                  data={answerPieData}
                  options={{
                    maintainAspectRatio: true,
                    responsive: true,
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
