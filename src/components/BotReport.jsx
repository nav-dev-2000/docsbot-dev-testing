import { Listbox, Transition, Tab } from '@headlessui/react'
import { useEffect, Fragment, useState } from 'react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { CreditCardIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import classNames from '@/utils/classNames'
import LoadingSpinner from '@/components/LoadingSpinner'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import { Doughnut, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)
import LocalStringNum from '@/components/LocalStringNum'
import Image from 'next/image'
import reportSample from '@/images/report-sample.png'

const colors = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
]

export const QUESTION_REPORT_TABS = [
  {
    name: 'All Questions',
    description:
      "This is an AI generated report of all questions asked by users in the selected month. This report is useful for identifying the most common questions asked by users and improving the user experience for these parts of your product or business. We've used topic clustering to group similar questions together and identify the main topics.",
    subDescription:
      "For each main topic, we've identified the most common sub-topics and provided an example question from each.",
  },
  {
    name: 'Problem Questions',
    description:
      "This is an AI generated report of questions asked by users in the selected month that were rated as innacurate or led to an escalation to human support. This report is useful for identifying gaps in your documentation and training that are leading to unknown or inaccurate answers and escalations to human support. We've used topic clustering to group similar questions together and identify the main topics.",
    subDescription:
      "For each main topic, we've identified the most common sub-topics and provided an example question from each.",
  },
]

export function MainTopic({ topic, index, forcePageBreaks = false }) {
  if (!topic) return null

  const percentageLabels = topic.subThemes.map((theme) => theme.subTheme)
  const percentageData = topic.subThemes.map((theme) =>
    Math.round(theme.proportion * topic.count),
  )

  const isPrintMode = forcePageBreaks

  const data = {
    labels: percentageLabels,
    datasets: [
      {
        data: percentageData,
        backgroundColor: colors,
      },
    ],
  }

  const options = {
    responsive: !isPrintMode,
    maintainAspectRatio: isPrintMode ? true : false,
    plugins: {
      legend: {
        display: false,
      },
    },
    animation: isPrintMode ? false : undefined,
  }

  return (
    <div
      className="border-t border-gray-200 py-16 hover:bg-gray-50 sm:py-24 print:border-none print:py-10"
      style={{
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        breakAfter: 'auto',
        pageBreakAfter: 'auto',
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 print:max-w-none print:px-0">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:max-w-none">
          <p className="text-base font-semibold leading-7 text-cyan-600">
            <LocalStringNum value={topic.count} /> Questions
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {topic.mainTheme.title}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {topic.mainTheme.description}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3 print:gap-x-6 print:gap-y-8 print:[grid-template-columns:minmax(0,12rem)_1fr]">
          <div className="print:flex print:flex-col print:items-start">
            <div className="h-64 w-full text-left print:h-44 print:w-auto print:max-w-[11rem] print:self-start print:p-0">
              <Doughnut
                data={data}
                options={options}
                width={isPrintMode ? 176 : undefined}
                height={isPrintMode ? 176 : undefined}
              />
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-2 print:gap-x-4 print:gap-y-6 print:[grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
            {topic.subThemes.map((theme, index) => (
              <div key={index}>
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div
                    className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg font-bold text-white"
                    style={{
                      backgroundColor: colors[index % colors.length],
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                      colorAdjust: 'exact',
                    }}
                  >
                    {(theme.proportion * 100).toFixed(0)}%
                  </div>
                  {theme.subTheme}
                </dt>
                <dd className="mt-1 break-words text-base italic leading-7 text-gray-600">
                  {theme.exampleQuestion}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

export function TopicTab({ tabReport, tab, forcePrintPageBreaks = false }) {
  if (!tabReport)
    return (
      <div className="flex h-24 items-center justify-center">
        Sorry, but there were not enough questions in the selected month to
        generate this report.
      </div>
    )

  const isPrintMode = forcePrintPageBreaks

  const percentageLabels = tabReport.topics.map(
    (topic) => topic.mainTheme.title,
  )
  const percentageData = tabReport.topics.map((topic) => topic.count)

  const data = {
    labels: percentageLabels,
    datasets: [
      {
        data: percentageData,
        backgroundColor: colors,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: isPrintMode ? false : undefined,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        align: 'top',
      },
    },
  }

  return (
    <>
      <div
        className="mx-auto py-12 print:px-0"
        style={{
          breakBefore: forcePrintPageBreaks ? 'avoid' : 'auto',
          pageBreakBefore: forcePrintPageBreaks ? 'avoid' : 'auto',
        }}
      >
        <div className="">
          <div className="flex flex-col justify-between gap-y-4 sm:flex-row sm:items-start sm:gap-y-0">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {tab.name}
            </h2>
            <p className="mt-2 font-medium text-cyan-600 print:text-right">
              {tabReport.topics.length} Topics from{' '}
              <LocalStringNum value={tabReport.questions} /> Questions
            </p>
          </div>
          <p className="mt-4 text-gray-500">{tab.description}</p>
        </div>

        <div className="mt-6 print:[page-break-inside:avoid]">
          <div
            className="border-b border-gray-200 pb-6"
            style={{ pageBreakInside: 'avoid' }}
          >
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 print:grid-cols-3">
              <div className="space-y-2 lg:col-span-1 print:col-span-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Main Topic Themes
                </h3>
                <p className="text-md text-gray-500">
                  Distribution of user questions by theme.
                </p>
              </div>
              <div className="lg:col-span-2 print:col-span-2">
                <div className="relative h-64 w-full overflow-hidden p-4 print:overflow-visible print:p-0">
                  <Pie data={data} options={options} />
                </div>
              </div>
            </div>
          </div>
          <div
            className="grid grid-cols-1 min-w-0 lg:grid-cols-2 print:grid-cols-2 gap-x-4"
            style={{ pageBreakInside: 'avoid' }}
          >
            {tabReport.images['2d'] && (
              <div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    2D Cluster Visualization
                  </h3>
                  <p className="text-md mt-2 text-gray-500">
                    A 2D visualization of detected main topic clusters from the
                    questions.
                  </p>
                </div>
                <div className="relative aspect-square w-full min-w-0 overflow-hidden bg-white print:aspect-auto print:h-56 print:bg-transparent">
                  <img
                    src={tabReport.images['2d']}
                    alt="2D Question topic clusters"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
            {tabReport.images['3d'] && (
              <div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    3D Cluster Visualization
                  </h3>
                  <p className="text-md mt-2 text-gray-500">
                    A 3D visualization of detected main topic clusters from the
                    questions.
                  </p>
                </div>
                <div className="relative aspect-square w-full min-w-0 overflow-hidden print:aspect-auto print:h-56">
                  <img
                    src={tabReport.images['3d']}
                    alt="3D Question topic clusters"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-gray-900">
          Main Topics
        </h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          {tab.subDescription}
        </p>
      </div>
      {tabReport.topics.map((topic, index) => (
        <MainTopic
          key={topic.mainTheme.description + index}
          topic={topic}
          index={index}
          forcePageBreaks={forcePrintPageBreaks}
        />
      ))}
    </>
  )
}

export default function BotReport({ team, bot }) {
  const today = new Date()
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1)
  const year = previousMonth.getFullYear()
  const month = String(previousMonth.getMonth() + 1).padStart(2, '0')
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    previousMonth,
  )
  const defaultSelected = {
    value: `${year}-${month}`,
    title: `${monthName} ${year}`,
  }

  const [availMonths, setAvailMonths] = useState([defaultSelected])
  const [selected, setSelected] = useState(
    availMonths.filter((month) => month.value === defaultSelected.value)[0],
  )
  const [report, setReport] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // blur is only enabled when we've reached our plan limit
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return !checkPlanPermission(team, 'business', 'analytics').allowed
  })
  const [showUpgrade, setShowUpgrade] = useState(false)

  const updateData = async (month) => {
    if (isProcessing) return
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    const apiUrl = `/api/teams/${team.id}/bots/${bot.id}/reports?month=${month}`
    try {
      setIsProcessing(true)
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      })
      setIsProcessing(false)
      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
        setAvailMonths(
          data.availableReports.map((dateString) => {
            const [year, month] = dateString.split('-')
            const monthName = new Date(`${year}-${month}-10`).toLocaleString(
              'default',
              {
                month: 'long',
              },
            )
            return { value: `${year}-${month}`, title: `${monthName} ${year}` }
          }),
        )
        //console.log(data.availableReports)
      } else {
        try {
          const data = await response.json()
          if (data.error) {
            console.warn(
              data.error || 'Something went wrong, please try again.',
            )
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
    updateData(selected.value)
  }, [])

  return (
    <div className="mx-0 mt-4 rounded-lg bg-white p-4 shadow-lg lg:p-8">
      <div className="mb-12">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Question Topic Report
            </h2>
            <p className="mt-4 text-gray-500">
              Identify problem areas in your products and gaps in your
              documentation with automated NLP analysis of user questions.
            </p>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:mt-0 sm:flex-row sm:items-start sm:justify-end">
            <div className="w-full sm:order-2 sm:w-48">
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
                      Period
                    </Listbox.Label>
                    <div className="relative mt-1">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 sm:text-sm sm:leading-6">
                        <span className="block truncate">{selected.title}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
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
                          {availMonths.map((month) => (
                            <Listbox.Option
                              key={month.value}
                              className={({ active }) =>
                                classNames(
                                  active
                                    ? 'bg-cyan-600 text-white'
                                    : 'text-gray-900',
                                  'relative cursor-default select-none py-1 pl-3 pr-9',
                                )
                              }
                              value={month}
                            >
                              {({ selected, active }) => (
                                <>
                                  <div className="flex">
                                    <span
                                      className={classNames(
                                        selected
                                          ? 'font-semibold'
                                          : 'font-normal',
                                        'block truncate text-gray-900',
                                      )}
                                    >
                                      {month.title}
                                    </span>
                                  </div>

                                  {selected ? (
                                    <span
                                      className={classNames(
                                        active ? 'text-white' : 'text-cyan-600',
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
                  </>
                )}
              </Listbox>
            </div>
            <button
              type="button"
              onClick={() => {
                if (blurEnabled) return
                const url = `/app/bots/${bot.id}/reports/print?month=${selected?.value}`
                const newWindow = window.open(
                  url,
                  '_blank',
                  'noopener,noreferrer',
                )
                if (newWindow) {
                  newWindow.focus()
                }
              }}
              disabled={blurEnabled || !report}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1 sm:self-end whitespace-nowrap"
            >
              <ArrowDownTrayIcon
                className="mr-2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              Print / Download
            </button>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="flex h-24 items-center justify-center">
          <LoadingSpinner large={true} className="mr-4" />
          Loading...
        </div>
      )}

      {blurEnabled && report && (
        <div className="items-center justify-between space-y-4 rounded-lg border border-cyan-600 bg-gray-50 p-4 text-center shadow-sm lg:flex lg:space-x-2 lg:space-y-0 lg:text-left">
          <h3 className="text-2xl font-bold">
            Access future advanced AI reports
          </h3>
          <p className="mb-2 text-gray-700">
            Upgrade to the Business plan or higher to unlock monthly advanced AI
            question topic reports. This report is a one-time sample from a
            previous month.
          </p>

          <button
            type="button"
            className="text-md inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-cyan-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            onClick={(e) => setShowUpgrade(true)}
          >
            <CreditCardIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            Upgrade Plan
          </button>
          <ModalCheckout
            team={team}
            open={showUpgrade}
            setOpen={setShowUpgrade}
          />
        </div>
      )}
      {blurEnabled && !report ? (
        <div className="">
          <div className="relative z-10 -mb-72 mt-32 w-full">
            <div className="flex justify-center py-4 text-center">
              <div className="max-w-3xl">
                <h3 className="text-3xl font-bold">
                  Access advanced AI reports
                </h3>
                <p className="mb-2 text-center text-gray-700">
                  Upgrade to the Business plan or higher to unlock monthly
                  advanced AI question topic reports.
                </p>
                <p className="mb-2 text-center text-gray-700">
                  These reports are useful for identifying the most common
                  questions asked by users so you can improve the user
                  experience for these parts of your product or business. We
                  also generate a report for questions rated as innacurate or
                  that led to an escalation to human support to help you improve
                  your documentation and bot training.
                </p>
                <p className="mb-8 text-center text-gray-700">
                  We use topic clustering to group similar questions together
                  and identify the main topics as well as the most common
                  sub-topics with an example question from each.
                </p>
                <button
                  type="button"
                  className="text-md inline-flex w-64 cursor-pointer items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={(e) => setShowUpgrade(true)}
                >
                  <CreditCardIcon
                    className="mr-1.5 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  Upgrade Plan
                </button>
                <ModalCheckout
                  team={team}
                  open={showUpgrade}
                  setOpen={setShowUpgrade}
                />
              </div>
            </div>
          </div>
          <Image
            src={reportSample}
            alt="Sample Report"
            width={2454 / 2}
            height={9225 / 2}
            className="blur-md"
          />
        </div>
      ) : (
        report && (
          <Tab.Group as="div" className="mt-4">
            <div className="-mx-4 flex overflow-x-auto sm:mx-0">
              <div className="flex-auto border-b border-gray-200 px-4 sm:px-0">
                <Tab.List className="-mb-px flex space-x-10">
                  {QUESTION_REPORT_TABS.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        classNames(
                          selected
                            ? 'border-cyan-500 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'text-md whitespace-nowrap border-b-2 py-6 font-medium',
                        )
                      }
                    >
                      {tab.name}
                    </Tab>
                  ))}
                </Tab.List>
              </div>
            </div>

            <Tab.Panels as={Fragment}>
              <Tab.Panel key={QUESTION_REPORT_TABS[0].name} className="">
                <TopicTab
                  tabReport={report.allQuestions}
                  tab={QUESTION_REPORT_TABS[0]}
                />
              </Tab.Panel>
              <Tab.Panel key={QUESTION_REPORT_TABS[1].name} className="">
                <TopicTab
                  tabReport={report.poorQuestions}
                  tab={QUESTION_REPORT_TABS[1]}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        )
      )}
    </div>
  )
}
