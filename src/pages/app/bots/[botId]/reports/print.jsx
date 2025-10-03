import { useEffect, useState } from 'react'
import Head from 'next/head'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getBot } from '@/lib/dbQueries'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TopicTab, QUESTION_REPORT_TABS } from '@/components/BotReport'

function formatMonthLabel(month) {
  if (!month) return null
  const [year, monthPart] = month.split('-')
  if (!year || !monthPart) return null
  const date = new Date(Number(year), Number(monthPart) - 1)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function ReportsPrint({ team, bot, month }) {
  const [report, setReport] = useState(null)
  const [resolvedMonth, setResolvedMonth] = useState(month || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}/reports?month=${month || ''}`)

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.message || 'Unable to load report')
        }

        const data = await response.json()
        setReport(data.report)

        if (Array.isArray(data.availableReports) && data.availableReports.length > 0) {
          if (month && data.availableReports.includes(month)) {
            setResolvedMonth(month)
          } else {
            setResolvedMonth(data.availableReports[0])
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load report')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [team.id, bot.id, month])

  useEffect(() => {
    if (!isLoading && report) {
      const timeout = setTimeout(() => {
        window.print()
      }, 600)

      return () => clearTimeout(timeout)
    }
  }, [isLoading, report])

  const monthLabel = formatMonthLabel(resolvedMonth)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>{`${bot.name} Question Topic Report`}</title>
      </Head>

      <main className="mx-auto max-w-5xl p-6 print:p-4">
        <header
          className="border-b border-gray-200 pb-6"
          style={{
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
            breakBefore: 'avoid',
            pageBreakBefore: 'avoid',
            breakAfter: 'avoid',
            pageBreakAfter: 'avoid',
            WebkitColumnBreakInside: 'avoid',
            WebkitRegionBreakInside: 'avoid',
          }}
        >
          <p className="text-sm uppercase tracking-wide text-gray-500">Question Topic Report</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            {bot.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {team?.name && <span>Team: {team.name}</span>}
            {monthLabel && <span>Period: {monthLabel}</span>}
          </div>
          <p className="mt-4 max-w-3xl text-base text-gray-600">
            Identify problem areas in your products and gaps in your documentation with automated NLP analysis of user
            questions. This printable report includes visualizations, topic summaries, and representative example questions.
          </p>
        </header>

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner large={true} className="mr-4" />
            Loading report...
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && !report && (
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
            Sorry, but there were not enough questions in the selected month to generate this report.
          </div>
        )}

        {!isLoading && !error && report && (
          <div className="mt-8 space-y-16 print:space-y-12">
            <section className="print:[page-break-inside:avoid]">
              <TopicTab tabReport={report.allQuestions} tab={QUESTION_REPORT_TABS[0]} forcePrintPageBreaks />
            </section>

            <section className="print:[page-break-inside:avoid]">
              <TopicTab tabReport={report.poorQuestions} tab={QUESTION_REPORT_TABS[1]} forcePrintPageBreaks />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params

  if (data?.props?.team) {
    data.props.bot = await getBot(data.props.team.id, botId)
    if (!data.props.bot) {
      return {
        notFound: true,
      }
    }

    data.props.month = context.query.month || null
  }

  return data
}

export default ReportsPrint
