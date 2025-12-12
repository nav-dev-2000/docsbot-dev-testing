import { useMemo, useState } from 'react'
import { NextSeo } from 'next-seo'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { usePostHog } from 'posthog-js/react'
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

const YEAR_KEY = '2025'

const IconX = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M4.5 3h3.2l4.36 5.67L16.98 3h2.52l-5.58 6.88L19.5 21h-3.2l-4.7-6.1L6.54 21H4.02l6.2-7.56z"
    />
  </svg>
)

const IconLinkedIn = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5s-1.98-.9-1.98-2S1.9 1.5 3 1.5s1.98.9 1.98 2Zm.02 4.5H1V21h4V8ZM8 8h3.8v1.78h.06c.53-1 1.82-2.06 3.74-2.06 4 0 4.74 2.63 4.74 6.06V21h-4v-6.1c0-1.45-.03-3.3-2.01-3.3-2.02 0-2.33 1.57-2.33 3.2V21H8Z"
    />
  </svg>
)

const IconFacebook = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M13.5 21h-3v-8H8v-3h2.5V7.75C10.5 5.14 12.07 3 15.57 3c1.42 0 2.12.1 2.43.15v2.85H16.6c-1.5 0-1.6.56-1.6 1.55V10H18l-.38 3h-2.62z"
    />
  </svg>
)

const serializeReport = (report) => {
  if (!report) return null
  return {
    ...report,
    generated_at:
      report.generated_at && typeof report.generated_at.toDate === 'function'
        ? report.generated_at.toDate().toJSON()
        : report.generated_at,
  }
}

export default function TeamYearlyReport({ teamId, report, shareUrl }) {
  const [copied, setCopied] = useState(false)
  const posthog = usePostHog()

  const mainImage = report?.design_image_url || report?.design_cropped_image_url
  const ogImage = report?.design_cropped_image_url || report?.design_image_url
  const generatedAtLabel = useMemo(() => {
    if (!report?.generated_at) return null
    const date = new Date(report.generated_at)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [report])

  const encodedUrl = encodeURIComponent(shareUrl)
  const tweetText = encodeURIComponent('Our DocsBot year in review is ready! Check out our 2025 highlights:')
  const shareActions = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${tweetText}`,
      Icon: IconX,
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: IconLinkedIn,
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: IconFacebook,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator?.clipboard?.writeText(shareUrl)
      setCopied(true)
      posthog?.capture('Yearly Report Shared', {
        team_id: teamId,
        year: YEAR_KEY,
        platform: 'copy',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setCopied(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      posthog?.capture('Yearly Report Shared', {
        team_id: teamId,
        year: YEAR_KEY,
        platform: 'print',
      })
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <NextSeo
        title={`DocsBot ${YEAR_KEY} Year in Review`}
        description="See your team's DocsBot year-end design and share it with your community."
        openGraph={{
          title: `DocsBot ${YEAR_KEY} Year in Review`,
          description: 'Celebrate your year with DocsBot.',
          url: shareUrl,
          images: ogImage
            ? [
                {
                  url: ogImage,
                  width: 1200,
                  height: 630,
                  alt: `DocsBot ${YEAR_KEY} Year in Review`,
                },
              ]
            : [],
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="space-y-6">
          <div className="report-image-wrapper overflow-hidden rounded-3xl">
            {mainImage ? (
              <img
                src={mainImage}
                alt={`DocsBot ${YEAR_KEY} report for team ${teamId}`}
                className="block h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center p-16 text-center text-gray-600">
                No report image available for this team.
              </div>
            )}
          </div>

          <div className="share-actions flex flex-wrap items-center justify-center gap-3 text-center">
            {shareActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  const platform = action.label.replace('Share on ', '').toLowerCase()
                  posthog?.capture('Yearly Report Shared', {
                    team_id: teamId,
                    year: YEAR_KEY,
                    platform: platform,
                  })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <action.Icon className="h-4 w-4" aria-hidden="true" />
                {action.label}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              {copied ? (
                <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ClipboardDocumentListIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              <PrinterIcon className="h-4 w-4" aria-hidden="true" />
              Print or save as PDF
            </button>
          </div>

          <div className="cta-year-in-review flex justify-center">
            <a
              href="https://docsbot.ai/article/docsbot-by-the-numbers-2025-recap-infographic"
              target="_blank"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-200 bg-white px-5 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              See the 2025 recap for all DocsBot customers <ArrowRightIcon className="size-4 ml-1" />
            </a>
          </div>

          <div className="cta-share flex flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-50 via-white to-indigo-50 px-6 py-6 text-center ring-1 ring-cyan-100">
            <img src="/branding/docsbot-logo.svg" alt="DocsBot logo" className="h-10 w-auto" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">Build your own DocsBot</p>
              <p className="text-sm text-gray-700">
                Spin up a chatbot for support, internal knowledge access, or research in minutes.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/register"
                onClick={() => {
                  posthog?.capture('Yearly Report CTA Clicked', {
                    team_id: teamId,
                    year: YEAR_KEY,
                    cta_type: 'get_started',
                  })
                }}
                className="bg-animation inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                Get started free
              </a>
              <a
                href="/"
                onClick={() => {
                  posthog?.capture('Yearly Report CTA Clicked', {
                    team_id: teamId,
                    year: YEAR_KEY,
                    cta_type: 'more_info',
                  })
                }}
                className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-white px-5 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                More information <ArrowRightIcon className="size-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </main>
      <style jsx global>{`
        @media print {
          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .report-image-wrapper {
            position: relative;
            width: 100vw;
            height: 100vh;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: hidden !important;
            page-break-after: avoid;
            page-break-before: avoid;
            break-inside: avoid;
          }
          .report-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            page-break-inside: avoid;
          }
          main {
            padding: 0 !important;
          }
          .share-actions,
          .generated-at,
          .cta-share,
          .cta-recap,
          .cta-year-in-review {
            display: none !important;
          }
          main > .space-y-6 {
            margin: 0 !important;
          }
          main > .space-y-6 > *:not(.report-image-wrapper) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export const getServerSideProps = async (context) => {
  configureFirebaseApp()
  const firestore = getFirestore()
  const { teamId } = context.params

  const teamRef = await firestore.collection('teams').doc(teamId).get()

  if (!teamRef.exists) {
    return { notFound: true }
  }

  const data = teamRef.data()
  const report = serializeReport(data?.yearlyReports?.[YEAR_KEY])

  if (!report) {
    return { notFound: true }
  }

  const protocol = context.req.headers['x-forwarded-proto'] || 'https'
  const host = context.req.headers.host
  const shareUrl = `${protocol}://${host}/${YEAR_KEY}-in-review/${teamId}`

  return {
    props: {
      teamId,
      report,
      shareUrl,
    },
  }
}
