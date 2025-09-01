import { useEffect, useState } from 'react'
import { CreditCardIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Chart from 'chart.js/auto'
import { Pie, Line } from 'react-chartjs-2'
import classNames from '@/utils/classNames'
import LoadingSpinner from '@/components/LoadingSpinner'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalTopicManagement from '@/components/ModalTopicManagement'
import Link from 'next/link'
import LocalStringNum from '@/components/LocalStringNum'
import Tooltip from '@/components/Tooltip'
import Meter from '@/components/Meter'
import RobotIcon from './RobotIcon'
import Datepicker from 'react-tailwindcss-datepicker'

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const createLineGradient = (color) => (context) => {
  const chart = context.chart
  const { ctx, chartArea } = chart
  if (!chartArea) return null
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0, hexToRgba(color, 0.2))
  gradient.addColorStop(1, hexToRgba(color, 0))
  return gradient
}


export default function BotHistory({ team, bot, dateRange = null }) {
  // Set default date range to last 30 days
  const getDefaultDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    return { startDate, endDate }
  }

  const [selectedDateRange, setSelectedDateRange] = useState(getDefaultDateRange())

  // Format date range for display
  const formatDateRange = (dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) return 'Select date range'
    
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    
    const startFormatted = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
    })
    const endFormatted = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
    
    return `${startFormatted} - ${endFormatted}`
  }
  const [stats, setStats] = useState(null)
  const [lineData, setLineData] = useState(null)
  const [pieData, setPieData] = useState(null)
  const [escalatedPieData, setEscalatedPieData] = useState(null)
  const [answerPieData, setAnswerPieData] = useState(null)
  // Conversation chart data
  const [conversationPercentLineData, setConversationPercentLineData] =
    useState(null)
  const [conversationCountLineData, setConversationCountLineData] =
    useState(null)
  const [conversationResolvedPieData, setConversationResolvedPieData] =
    useState(null)
  const [conversationEscalatedPieData, setConversationEscalatedPieData] =
    useState(null)
  const [conversationSentimentPieData, setConversationSentimentPieData] =
    useState(null)
  const [conversationAnsweredPieData, setConversationAnsweredPieData] =
    useState(null)
  // Topics chart data
  const [topicsLineData, setTopicsLineData] = useState(null)
  const [topicsPieData, setTopicsPieData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // blur is only enabled when we've reached our plan limit
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return !checkPlanPermission(team, 'standard', 'analytics').allowed
  })
  // blur for pro plan features (question stats)
  const [proBlurEnabled, setProBlurEnabled] = useState(() => {
    return !checkPlanPermission(team, 'pro', 'analytics').allowed
  })
  // blur for business plan features (sentiment)
  const [businessBlurEnabled, setBusinessBlurEnabled] = useState(() => {
    return !checkPlanPermission(team, 'business', 'analytics').allowed
  })
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showTopicManagement, setShowTopicManagement] = useState(false)

  const updateData = async (rangeOrDelta) => {
    if (isProcessing) return
    setStats(null)

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    let apiUrl = `/api/teams/${team.id}/bots/${bot.id}/stats`
    if (
      rangeOrDelta &&
      typeof rangeOrDelta === 'object' &&
      rangeOrDelta.startDate &&
      rangeOrDelta.endDate
    ) {
      const start = new Date(rangeOrDelta.startDate)
      const end = new Date(rangeOrDelta.endDate)
      apiUrl += `?startDate=${encodeURIComponent(start.toISOString())}&endDate=${encodeURIComponent(end.toISOString())}`
    } else {
      const delta = typeof rangeOrDelta === 'number' ? rangeOrDelta : 30
      apiUrl += `?timeDelta=${delta}`
    }

    try {
      setIsProcessing(true)
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      })
      setIsProcessing(false)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
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
    updateData(selectedDateRange)
  }, [])

  // React to external dateRange changes (reports page datepicker)
  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      setSelectedDateRange(dateRange)
      updateData(dateRange)
    }
  }, [dateRange?.startDate, dateRange?.endDate])

  // React to internal dateRange changes
  useEffect(() => {
    if (selectedDateRange && selectedDateRange.startDate && selectedDateRange.endDate) {
      updateData(selectedDateRange)
    }
  }, [selectedDateRange?.startDate, selectedDateRange?.endDate])

  useEffect(() => {
    if (!stats) return

    setLineData({
      labels: stats.labels,
      datasets: [
        {
          label: 'All Questions',
          data: stats.countData,
          borderColor: '#76B7B2',
          backgroundColor: createLineGradient('#76B7B2'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Negative',
          data: stats.negativeData,
          borderColor: '#E15759',
          backgroundColor: createLineGradient('#E15759'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Positive',
          data: stats.positiveData,
          borderColor: '#59A14F',
          backgroundColor: createLineGradient('#59A14F'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Could Answer',
          data: stats.couldAnswerData,
          borderColor: '#9e74d5',
          backgroundColor: createLineGradient('#9e74d5'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Escalations',
          data: stats.escalatedData,
          borderColor: '#EDC948',
          backgroundColor: createLineGradient('#EDC948'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Total Messages',
          data: stats.messagesData,
          borderColor: '#9CA3AF',
          backgroundColor: createLineGradient('#9CA3AF'),
          tension: 0.3,
          fill: false,
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

    // Set up conversation chart data
    // Conversation percentage line chart (CSAT, answered rate, deflection rate, avg sentiment)
    const conversationDatasets = [
      {
        label: 'CSAT %',
        data: stats.csatData,
        borderColor: '#59A14F',
        backgroundColor: createLineGradient('#59A14F'),
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Answered %',
        data: stats.answeredRateData,
        borderColor: '#76B7B2',
        backgroundColor: createLineGradient('#76B7B2'),
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Deflection %',
        data: stats.conversationDeflectionData,
        borderColor: '#9e74d5',
        backgroundColor: createLineGradient('#9e74d5'),
        tension: 0.3,
        fill: true,
      },
    ]

    // Only add sentiment data if business plan is allowed
    if (checkPlanPermission(team, 'business', 'analytics').allowed) {
      conversationDatasets.push({
        label: 'Avg Sentiment',
        data: stats.avgSentimentData, // Use raw sentiment values (-1 to 1)
        borderColor: '#EDC948',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1', // Use second y-axis
        order: 99,
      })
    }

    setConversationPercentLineData({
      labels: stats.labels,
      datasets: conversationDatasets,
    })

    // Conversation count line chart
    setConversationCountLineData({
      labels: stats.labels,
      datasets: [
        {
          label: 'Total Conversations',
          data: stats.conversationData,
          borderColor: '#76B7B2',
          backgroundColor: createLineGradient('#76B7B2'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Resolved Confirmed',
          data: stats.resolvedConfirmedData,
          borderColor: '#59A14F',
          backgroundColor: createLineGradient('#59A14F'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Resolved Assumed',
          data: stats.resolvedAssumedData,
          borderColor: '#9e74d5',
          backgroundColor: createLineGradient('#9e74d5'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Unresolved',
          data: stats.unresolvedData,
          borderColor: '#E15759',
          backgroundColor: createLineGradient('#E15759'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Escalated Handled',
          data: stats.escalatedHandledData,
          borderColor: '#EDC948',
          backgroundColor: createLineGradient('#EDC948'),
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Escalated Triggered',
          data: stats.escalatedTriggeredData,
          borderColor: '#9CA3AF',
          backgroundColor: createLineGradient('#9CA3AF'),
          tension: 0.3,
          fill: true,
        },
      ],
    })

    // Conversation pie charts
    setConversationResolvedPieData({
      labels: stats.resolvedLabels,
      datasets: [
        {
          data: stats.resolvedCounts,
          backgroundColor: ['#59A14F', '#76B7B2', '#E15759'],
        },
      ],
    })

    setConversationEscalatedPieData({
      labels: stats.conversationEscalatedLabels,
      datasets: [
        {
          data: stats.conversationEscalatedCounts,
          backgroundColor: ['#E15759', '#EDC948'],
        },
      ],
    })

    setConversationSentimentPieData({
      labels: stats.sentimentLabels,
      datasets: [
        {
          data: stats.sentimentCounts,
          backgroundColor: ['#59A14F', '#E15759', '#9CA3AF'],
        },
      ],
    })

    setConversationAnsweredPieData({
      labels: stats.conversationAnsweredLabels,
      datasets: [
        {
          data: stats.conversationAnsweredCounts,
          backgroundColor: ['#76B7B2', '#E15759'],
        },
      ],
    })

    // Set up topics chart data
    if (stats.conversationTopicLabels && stats.conversationTopicLabels.length > 0) {
      // Topics line chart data
      const topicDatasets = stats.conversationTopicLabels.map((topic, index) => {
        const colors = [
          '#76B7B2', '#E15759', '#59A14F', '#9e74d5', '#EDC948', 
          '#9CA3AF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
        ]
        const topicData = stats.conversationTopicData[topic] || []
        return {
          label: topic,
          data: topicData,
          borderColor: colors[index % colors.length],
          backgroundColor: createLineGradient(colors[index % colors.length]),
          tension: 0.3,
        }
      })

      setTopicsLineData({
        labels: stats.labels,
        datasets: topicDatasets,
      })

      // Topics pie chart data
      setTopicsPieData({
        labels: stats.conversationTopicPieLabels,
        datasets: [
          {
            data: stats.conversationTopicCounts,
            backgroundColor: stats.conversationTopicLabels.map((topic, index) => {
              const colors = [
                '#76B7B2', '#E15759', '#59A14F', '#9e74d5', '#EDC948',
                '#9CA3AF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
              ]
              return colors[index % colors.length]
            }),
          },
        ],
      })
    }
  }, [stats])

  return (
    <div className="mx-0 mt-4 rounded-lg bg-white p-4 shadow-lg lg:p-8">
      <div className="mb-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Bot Analytics
            </h2>
            <div className="mt-2 inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
              <CalendarIcon className="mr-1.5 h-4 w-4" />
              {formatDateRange(selectedDateRange)}
            </div>
          </div>
          <div className="mt-4 w-64 sm:mt-0 sm:flex-none">
            <div className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </div>
            <Datepicker
              value={selectedDateRange}
              onChange={(val) => {
                setSelectedDateRange(val)
              }}
              primaryColor="cyan"
              placeholder="Select date range"
              useRange={true}
              showShortcuts={true}
              configs={{
                shortcuts: {
                  'Last 7 Days': {
                    text: 'Last 7 Days',
                    period: {
                      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    }
                  },
                  'Last 30 Days': {
                    text: 'Last 30 Days',
                    period: {
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    }
                  },
                  'Last Quarter': {
                    text: 'Last Quarter',
                    period: {
                      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    }
                  },
                  'Last Year': {
                    text: 'Last Year',
                    period: {
                      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    }
                  }
                }
              }}
              minDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
              maxDate={new Date()}
              classNames={{ container: 'z-10' }}
            />
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="flex h-48 items-center justify-center space-x-2 text-xl">
          <LoadingSpinner large={true} />
          <div>Loading...</div>
        </div>
      )}

      {stats && (
        <>
          {/* Conversation Analytics Panel */}
          {bot?.isAgent ? (
            <div className="mb-8">
              <h3 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
                Conversation Analytics
              </h3>
              <p className="mb-6 text-gray-500">
                Analytics about conversations and their outcomes, including
                resolution status, sentiment, and escalations. Only tracked when
                using agent mode.
              </p>

              {/* Conversation Metrics Table */}
              <dl className="mb-6 grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl text-center lg:grid-cols-3 xl:grid-cols-6">
                <Tooltip content="Total number of messages during the selected time period, counting towards your plan's message limit.">
                  <div className="flex cursor-help flex-col items-center justify-center bg-gray-50 p-8 hover:bg-gray-100">
                    <dd className="text-3xl font-semibold tracking-tight text-gray-900">
                      <LocalStringNum value={stats.totalMessages} />
                    </dd>
                    <dt className="text-sm font-semibold leading-6 text-gray-600">
                      Messages
                    </dt>
                  </div>
                </Tooltip>
                <Tooltip content="Total number of conversations in the selected time period">
                  <div className="flex cursor-help flex-col items-center justify-center bg-indigo-50 p-8 hover:bg-indigo-100">
                    <dd className="text-3xl font-semibold tracking-tight text-gray-900">
                      <LocalStringNum value={stats.totalConversations} />
                    </dd>
                    <dt className="text-sm font-semibold leading-6 text-gray-600">
                      Conversations
                    </dt>
                  </div>
                </Tooltip>
                <Tooltip content="Customer Satisfaction Score - percentage of conversations marked as resolved">
                  <div className="flex cursor-help flex-col justify-center bg-pink-50 p-8 hover:bg-pink-100">
                    <dt className="mb-4 text-sm font-semibold leading-6 text-gray-600">
                      CSAT
                    </dt>
                    <dd className="order-first">
                      {stats.totalCsat != null ? (
                        <div className="space-y-2">
                          <div className="text-center text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.totalCsat}%
                          </div>
                          <Meter
                            value={stats.totalCsat}
                            color="pink"
                            size="lg"
                            showValue={false}
                            isSentiment={true}
                            gradientType="satisfaction"
                          />
                        </div>
                      ) : (
                        <div className="h-12 text-3xl font-semibold tracking-tight text-gray-900">
                          N/A
                        </div>
                      )}
                    </dd>
                  </div>
                </Tooltip>
                <Tooltip content="Percentage of conversations where the agent could provide an answer">
                  <div className="flex cursor-help flex-col justify-center bg-green-50 p-8 hover:bg-green-100">
                    <dt className="mb-4 text-sm font-semibold leading-6 text-gray-600">
                      Answered Rate
                    </dt>
                    <dd className="order-first">
                      {stats.totalAnsweredRate != null ? (
                        <div className="space-y-2">
                          <div className="text-center text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.totalAnsweredRate}%
                          </div>
                          <Meter
                            value={stats.totalAnsweredRate}
                            color="green"
                            size="lg"
                            showValue={false}
                            showEmoji={false}
                          />
                        </div>
                      ) : (
                        <div className="h-12 text-3xl font-semibold tracking-tight text-gray-900">
                          N/A
                        </div>
                      )}
                    </dd>
                  </div>
                </Tooltip>
                <Tooltip content="Percentage of conversations not escalated to human support, based on handled/confirmed escalations">
                  <div className="flex cursor-help flex-col justify-center bg-purple-50 p-8 hover:bg-purple-100">
                    <dt className="mb-4 text-sm font-semibold leading-6 text-gray-600">
                      Deflection Rate
                    </dt>
                    <dd className="order-first">
                      {stats.totalConversationDeflectionRate != null ? (
                        <div className="space-y-2">
                          <div className="text-center text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.totalConversationDeflectionRate}%
                          </div>
                          <Meter
                            value={stats.totalConversationDeflectionRate}
                            color="purple"
                            size="lg"
                            showValue={false}
                            showEmoji={false}
                          />
                        </div>
                      ) : (
                        <div className="h-12 text-3xl font-semibold tracking-tight text-gray-900">
                          N/A
                        </div>
                      )}
                    </dd>
                  </div>
                </Tooltip>
                <Tooltip content="Average sentiment score from -1 (negative) to 1 (positive)">
                  <div className="flex cursor-help flex-col justify-center bg-yellow-50 p-8 hover:bg-yellow-100">
                    <dt className="mb-4 text-sm font-semibold leading-6 text-gray-600">
                      Avg Sentiment
                    </dt>
                    <dd className="order-first">
                      {businessBlurEnabled ? (
                        <div className="relative space-y-2">
                          <div className="blur-lg">
                            <div className="text-center text-2xl font-semibold tracking-tight text-gray-900">
                              85%
                            </div>
                            <Meter
                              value={85}
                              color="yellow"
                              size="lg"
                              showValue={false}
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-cyan-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                              onClick={(e) => setShowUpgrade(true)}
                            >
                              <CreditCardIcon
                                className="mr-1 h-3 w-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              Upgrade to Business
                            </button>
                          </div>
                        </div>
                      ) : stats.totalAvgSentiment != null ? (
                        <div className="space-y-2">
                          <div className="text-center text-2xl font-semibold tracking-tight text-gray-900">
                            {stats.totalAvgSentiment.toFixed(2)}
                          </div>
                          <Meter
                            value={(stats.totalAvgSentiment + 1) * 50}
                            color="yellow"
                            size="lg"
                            showValue={false}
                            showEmoji={false}
                            showFullGradient={true}
                            isSentiment={true}
                            gradientType="sentiment"
                          />
                        </div>
                      ) : (
                        <div className="text-3xl font-semibold tracking-tight text-gray-900">
                          N/A
                        </div>
                      )}
                    </dd>
                  </div>
                </Tooltip>
              </dl>

              <div className="relative">
                {blurEnabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="max-w-3xl rounded-lg bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
                      <h3 className="mb-4 text-3xl font-bold">
                        View advanced conversation statistics
                      </h3>
                      <p className="mb-8 text-center text-gray-700">
                        Upgrade to the Standard plan or higher to unlock conversation statistics. View{' '}
                        <Link href="/pricing" target="_blank" className="underline">
                          plan details
                        </Link>
                        .
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
                )}

                <div
                  className={classNames(
                    'space-y-6',
                    blurEnabled ? 'blur-lg' : '',
                  )}
                >
                  {/* Conversation Percentage Line Chart */}
                  <div className="w-full">
                    <h4 className="mb-4 text-lg font-semibold text-gray-900">
                      Conversation Metrics (%)
                    </h4>
                    {conversationPercentLineData && (
                      <div style={{ height: '320px', width: '100%' }}>
                        <Line
                          data={conversationPercentLineData}
                          options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            spanGaps: true,
                            plugins: {
                              legend: {
                                display: true,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  callback: function (value) {
                                    return value + '%'
                                  },
                                },
                              },
                              y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                min: -1,
                                max: 1,
                                ticks: {
                                  stepSize: 0.5,
                                },
                                grid: {
                                  drawOnChartArea: false,
                                },
                                title: {
                                  display: true,
                                  text: 'Sentiment Score',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Conversation Count Line Chart */}
                  <div className="mt-8 w-full">
                    <h4 className="mb-4 text-lg font-semibold text-gray-900">
                      Conversation Counts
                    </h4>
                    {conversationCountLineData && (
                      <div style={{ height: '320px', width: '100%' }}>
                        <Line
                          data={conversationCountLineData}
                          options={{
                            maintainAspectRatio: false,
                            responsive: true,
                            plugins: {
                              legend: {
                                display: true,
                              },
                            },
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Conversation Pie Charts */}
                  <div className="grid grid-cols-1 items-center space-x-4 align-middle md:grid-cols-2 xl:grid-cols-4">
                    <Tooltip content="Shows the breakdown of conversation outcomes: Confirmed (customer confirmed), Assumed (AI classified), and Unresolved (AI or user classified)">
                      <div className="m-auto mt-6 flex h-80 justify-center">
                        <div className="text-center">
                          <h5 className="text-md mb-2 font-semibold text-gray-900">
                            Resolution Status
                          </h5>
                          {conversationResolvedPieData && (
                            <Pie
                              data={conversationResolvedPieData}
                              options={{
                                maintainAspectRatio: true,
                                responsive: true,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content="Among all escalations, shows the breakdown of escalation outcomes: Triggered (AI detetected intent to escalate) vs Handled (user confirmed and escalated)">
                      <div className="m-auto mt-6 flex h-80 justify-center">
                        <div className="text-center">
                          <h5 className="text-md mb-2 font-semibold text-gray-900">
                            Escalation Status
                          </h5>
                          {conversationEscalatedPieData && (
                            <Pie
                              data={conversationEscalatedPieData}
                              options={{
                                maintainAspectRatio: true,
                                responsive: true,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content="Shows how often the AI agent determined it could provide an answer, wether to a question or just responding to user.">
                      <div className="m-auto mt-6 flex h-80 justify-center">
                        <div className="text-center">
                          <h5 className="text-md mb-2 font-semibold text-gray-900">
                            Answered Status
                          </h5>
                          {conversationAnsweredPieData && (
                            <Pie
                              data={conversationAnsweredPieData}
                              options={{
                                maintainAspectRatio: true,
                                responsive: true,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Tooltip>
                    <Tooltip content="Shows the emotional tone of conversations: Positive (satisfied customers), Negative (frustrated customers), and Neutral (no clear sentiment)">
                      <div className="m-auto mt-6 flex h-80 justify-center">
                        <div className="text-center">
                          <h5 className="text-md mb-2 font-semibold text-gray-900">
                            Sentiment Distribution
                          </h5>
                          {businessBlurEnabled ? (
                            <div className="relative space-y-2">
                              <div className="flex items-center justify-center blur-lg">
                                {conversationSentimentPieData && (
                                  <Pie
                                    data={conversationSentimentPieData}
                                    options={{
                                      maintainAspectRatio: true,
                                      responsive: true,
                                    }}
                                  />
                                )}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                  type="button"
                                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-cyan-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                  onClick={(e) => setShowUpgrade(true)}
                                >
                                  <CreditCardIcon
                                    className="mr-1 h-3 w-3 flex-shrink-0"
                                    aria-hidden="true"
                                  />
                                  Upgrade to Business
                                </button>
                              </div>
                            </div>
                          ) : (
                            conversationSentimentPieData && (
                              <Pie
                                data={conversationSentimentPieData}
                                options={{
                                  maintainAspectRatio: true,
                                  responsive: true,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Topics Analytics Section - Business Plan Only */}
              {bot?.isAgent && stats.conversationTopicLabels && stats.conversationTopicLabels.length > 0 && (
                <div className="mt-12">
                  <div className="relative">
                    {businessBlurEnabled && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center">
                        <div className="max-w-3xl rounded-lg bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
                          <h3 className="mb-4 text-3xl font-bold">
                            View conversation topics analytics
                          </h3>
                          <p className="mb-8 text-center text-gray-700">
                            Upgrade to the Business plan or higher to unlock conversation topics analytics. View{' '}
                            <Link href="/pricing" target="_blank" className="underline">
                              plan details
                            </Link>
                            .
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
                            Upgrade to Business
                          </button>
                          <ModalCheckout
                            team={team}
                            open={showUpgrade}
                            setOpen={setShowUpgrade}
                          />
                        </div>
                      </div>
                    )}

                    <div
                      className={classNames(
                        'space-y-6',
                        businessBlurEnabled ? 'blur-lg' : '',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-2xl font-bold tracking-tight text-gray-900">
                            Conversation Topics Analytics
                          </h4>
                          <p className="text-gray-500">
                            Track conversation topics over time and see the distribution of topics discussed with your customers.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowTopicManagement(true)}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        >
                          <TagIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                          Manage Topics
                        </button>
                      </div>

                      {/* Topics Charts - Side by Side on larger screens */}
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Topics Line Chart - 2/3 width on large screens */}
                        <div className="lg:col-span-2">
                          <h5 className="mb-4 text-lg font-semibold text-gray-900">
                            Conversation Topics
                          </h5>
                          {topicsLineData && (
                            <div style={{ height: '320px', width: '100%' }}>
                              <Line
                                data={topicsLineData}
                                options={{
                                  maintainAspectRatio: false,
                                  responsive: true,
                                  spanGaps: true,
                                  plugins: {
                                    legend: {
                                      display: true,
                                      position: 'top',
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        stepSize: 1,
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Topics Pie Chart - 1/3 width on large screens */}
                        <div className="lg:col-span-1">
                          <h5 className="mb-4 text-lg font-semibold text-gray-900">
                            Total Topics Distribution
                          </h5>
                          <div className="flex justify-center">
                            <div className="h-80 w-full max-w-80">
                              {topicsPieData && (
                                <Pie
                                  data={topicsPieData}
                                  options={{
                                    maintainAspectRatio: true,
                                    responsive: true,
                                    plugins: {
                                      legend: {
                                        display: true,
                                        position: 'bottom',
                                      },
                                    },
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <div className="rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-8 text-center shadow-lg">
                <h3 className="mb-4 text-2xl font-bold text-gray-900">
                  Enable Agent Mode for Advanced Conversation Analytics
                </h3>
                <p className="mb-6 text-gray-700">
                  Unlock powerful conversation analytics including CSAT scores,
                  deflection rates, sentiment analysis, and resolution tracking
                  by enabling Agent Mode in your widget settings.
                </p>
                <Link
                  href={`/app/bots/${bot?.id}/widget`}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  <RobotIcon
                    className="mr-2 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  Enable Agent Mode
                </Link>
              </div>
            </div>
          )}

          {/* Question Analytics Panel */}
          <div className="mb-8 mt-24">
            <h3 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
              Question Analytics
            </h3>
            <p className="mb-6 text-gray-500">
              Analytics about individual questions and their ratings. In Agent
              mode, this only includes questions that trigger a documentation
              lookup.
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-3 lg:grid-cols-3">
            <Tooltip content="All messages that count towards your plan limits, including tool calls">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Messages
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  <LocalStringNum value={stats.totalMessages} />
                </dd>
              </div>
            </Tooltip>
            <Tooltip content="Only counts lookup questions, not all messages">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  User questions
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  <LocalStringNum value={stats.totalCount} />
                </dd>
              </div>
            </Tooltip>
            <Tooltip content="Lookup Answers with no negative rating or support escalation">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Resolution rate
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {stats.resolutionRate != '0'
                    ? stats.resolutionRate + '%'
                    : 'N/A'}
                </dd>
              </div>
            </Tooltip>
            <Tooltip content="Lookup Questions the AI determined it could confidently answer">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Answer rate
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {stats.couldAnswerRate != '0'
                    ? stats.couldAnswerRate + '%'
                    : 'N/A'}
                </dd>
              </div>
            </Tooltip>
            <Tooltip content="Lookup Answers with no support escalation">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Deflection rate
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  {stats.deflectionRate != '0'
                    ? stats.deflectionRate + '%'
                    : 'N/A'}
                </dd>
              </div>
            </Tooltip>
            <Tooltip content="Assuming an average of 5mins/ticket">
              <div className="flex cursor-help flex-col bg-gray-400/5 p-8 hover:bg-gray-400/10">
                <dt className="text-sm font-semibold leading-6 text-gray-600">
                  Support staff time saved
                </dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                  <LocalStringNum value={stats.timeSaved} /> Mins
                </dd>
              </div>
            </Tooltip>
          </dl>

          <div className="relative">
            {proBlurEnabled && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="max-w-3xl rounded-lg bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
                  <h3 className="mb-4 text-3xl font-bold">
                    View advanced question statistics
                  </h3>
                  <p className="mb-8 text-center text-gray-700">
                    Upgrade to the Standard plan or higher to unlock advanced question statistics. View{' '}
                    <Link href="/pricing" target="_blank" className="underline">
                      plan details
                    </Link>
                    .
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
            )}

            <div
              className={classNames(
                'items-center space-x-4 align-middle',
                proBlurEnabled ? 'blur-lg' : '',
              )}
            >
              <div
                style={{ height: '384px', width: '100%', marginTop: '1.5rem' }}
              >
                {lineData && (
                  <Line
                    data={lineData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          display: true,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
            <div
              className={classNames(
                'grid items-center space-x-4 align-middle sm:grid-cols-1 lg:grid-cols-3',
                proBlurEnabled ? 'blur-lg' : '',
              )}
            >
              <Tooltip content="Shows the breakdown of user feedback on answers: Positive (thumbs up), Negative (thumbs down), and No Rating (no feedback given)">
                <div className="m-auto mt-6 flex h-80 justify-center">
                  <div className="text-center">
                    <h5 className="text-md mb-2 font-semibold text-gray-900">
                      Answer Ratings
                    </h5>
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
                </div>
              </Tooltip>
              <Tooltip content="Shows the breakdown of escalation outcomes: Escalated (user requested human support) vs Not Escalated (conversation stayed with AI)">
                <div className="m-auto mt-6 flex h-80 justify-center">
                  <div className="text-center">
                    <h5 className="text-md mb-2 font-semibold text-gray-900">
                      Escalation Status
                    </h5>
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
                </div>
              </Tooltip>
              <Tooltip content="Shows how often the AI determined it could provide a confident answer to user questions">
                <div className="m-auto mt-6 flex h-80 justify-center">
                  <div className="text-center">
                    <h5 className="text-md mb-2 font-semibold text-gray-900">
                      Answer Status
                    </h5>
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
              </Tooltip>
            </div>
          </div>
        </>
      )}

      {/* Topic Management Modal */}
      <ModalTopicManagement
        open={showTopicManagement}
        setOpen={setShowTopicManagement}
        team={team}
        bot={bot}
      />
    </div>
  )
}
