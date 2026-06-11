import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowTopRightOnSquareIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import * as cookie from 'cookie'
import { canUserViewTeamYearlyReport } from '@/utils/function.utils'

const YEAR_KEY = '2025'
const DISMISS_KEY = `yearly-report-${YEAR_KEY}`
// Before re-enabling next December, only render this for users with full team access.
// Bot-scoped users can be limited to one bot, while yearly reports contain team-wide data.
const YEARLY_REPORT_NOTICE_ENABLED = false

const getPreferences = () => {
  if (typeof window === 'undefined') return {}
  try {
    const cookies = cookie.parse(document.cookie || '')
    const prefsValue = cookies['docsbot-prefs']
    if (!prefsValue) return {}

    const decoded = decodeURIComponent(prefsValue)
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to parse preferences cookie:', error)
    return {}
  }
}

const setPreference = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    const prefs = getPreferences()
    prefs[key] = value
    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    document.cookie = cookie.serialize('docsbot-prefs', JSON.stringify(prefs), {
      expires,
      path: '/',
      sameSite: 'lax',
    })
  } catch (error) {
    console.error('Failed to set preference:', error)
  }
}

const isNoticeDismissed = (dismissKey) => {
  if (!dismissKey) return false
  const prefs = getPreferences()
  return prefs[`dismissed-${dismissKey}`] === true
}

function YearlyReportNoticeContent({ team }) {
  const [showNotice, setShowNotice] = useState(true)
  const report = team?.yearlyReports?.[YEAR_KEY]

  useEffect(() => {
    if (isNoticeDismissed(DISMISS_KEY)) {
      setShowNotice(false)
    }
  }, [])

  if (!report || !showNotice) {
    return null
  }

  const fullReportUrl = `/${YEAR_KEY}-in-review/${team.id}`
  const croppedImage = report.design_cropped_image_url || report.design_image_url

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 shadow-lg">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:p-8">
          <button
            type="button"
            onClick={() => {
              setShowNotice(false)
              setPreference(`dismissed-${DISMISS_KEY}`, true)
            }}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-cyan-700 shadow-sm ring-1 ring-cyan-100 transition hover:-translate-y-0.5 hover:bg-white z-10"
            aria-label="Dismiss year in review notice"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm ring-1 ring-cyan-100">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
              DocsBot Year in Review {YEAR_KEY}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Your year in DocsBot is ready</h3>
            <p className="max-w-2xl text-sm text-gray-700">
              Celebrate your team&apos;s 2025 highlights. View your personalized year-in-review report and share the full story
              with your teammates and customers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={fullReportUrl}
                className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                View full report
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {croppedImage && (
            <Link
              href={fullReportUrl}
              className="relative isolate w-full max-w-sm overflow-hidden rounded-t-xl lg:rounded-xl lg:rounded-b-none transition hover:-translate-y-0.5 hover:scale-[0.99]"
            >
              <img
                src={croppedImage}
                alt={`DocsBot ${YEAR_KEY} report preview`}
                className="block h-full w-full object-cover"
                loading="lazy"
              />
              <span className="sr-only">View the full {YEAR_KEY} report</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function YearlyReportNotice({ team, user }) {
  if (!YEARLY_REPORT_NOTICE_ENABLED || !canUserViewTeamYearlyReport(team, user?.uid)) {
    return null
  }

  return <YearlyReportNoticeContent team={team} />
}
