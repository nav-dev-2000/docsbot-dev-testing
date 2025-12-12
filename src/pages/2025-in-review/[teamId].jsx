import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { auth } from '@/config/firebase-ui.config'
import { usePostHog } from 'posthog-js/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { routePaths } from '@/constants/routePaths.constants'

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

export default function TeamYearlyReport({ teamId, report, shareUrl, ogImageUrl }) {
  const [copied, setCopied] = useState(false)
  const [pendingShare, setPendingShare] = useState(null)
  const [isPublic, setIsPublic] = useState(Boolean(report?.is_public))
  const [shareError, setShareError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const posthog = usePostHog()
  const router = useRouter()
  const [user, authLoading] = useAuthState(auth)

  const mainImage = report?.design_image_url || report?.design_cropped_image_url
  const ogImage = ogImageUrl || report?.design_cropped_image_url || report?.design_image_url
  const canViewReportImage = isPublic || Boolean(user)
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
      platform: 'x',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${tweetText}`,
      Icon: IconX,
    },
    {
      label: 'Share on LinkedIn',
      platform: 'linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: IconLinkedIn,
    },
    {
      label: 'Share on Facebook',
      platform: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: IconFacebook,
    },
  ]

  const closeShareModal = () => {
    setPendingShare(null)
    setShareError('')
  }


  const publishReport = async () => {
    if (isPublic) return
    setIsPublishing(true)
    setShareError('')
    try {
      const response = await fetch(
        `/api/teams/${teamId}/yearly-reports/${YEAR_KEY}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_public: true }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to make report public')
      }

      setIsPublic(true)
    } catch (error) {
      setShareError(
        error?.message || 'Unable to make the report public right now.',
      )
      throw error
    } finally {
      setIsPublishing(false)
    }
  }

  const completeShare = async (share) => {
    if (user && !isPublic) {
      await publishReport()
    }

    if (share?.platform === 'copy') {
      try {
        await navigator?.clipboard?.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        setCopied(false)
      }
    } else if (share?.href) {
      window.open(share.href, '_blank', 'noopener,noreferrer')
    }

    if (share?.platform) {
      posthog?.capture('Yearly Report Shared', {
        team_id: teamId,
        year: YEAR_KEY,
        platform: share.platform,
      })
    }
  }

  const requestShare = async (share) => {
    setShareError('')
    if (!user && !isPublic) {
      router.push({
        pathname: routePaths.LOGIN,
        query: { redirect: `/${YEAR_KEY}-in-review/${teamId}` },
      })
      return
    }
    if (user && !isPublic) {
      setPendingShare(share)
      return
    }
    await completeShare(share)
  }

  const confirmShare = async () => {
    if (!pendingShare) return
    try {
      await completeShare(pendingShare)
      closeShareModal()
    } catch (error) {
      // Errors are handled via shareError state
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
            {canViewReportImage ? (
              mainImage ? (
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
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100 p-16 text-center text-gray-700">
                {ogImage && (
                  <img
                    src={ogImage}
                    alt={`DocsBot ${YEAR_KEY} report preview for team ${teamId}`}
                    className="mb-4 max-w-full rounded-lg"
                    loading="lazy"
                  />
                )}
                <p className="text-lg font-semibold text-gray-900">
                  Sign in to view your {YEAR_KEY} report image
                </p>
                <p className="max-w-xl text-sm">
                  This report is private until you choose to share it. Sign in to review the image before making it public.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push({
                      pathname: routePaths.LOGIN,
                      query: { redirect: `/${YEAR_KEY}-in-review/${teamId}` },
                    })
                  }
                  className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {user && (
            <div className="share-actions flex flex-wrap items-center justify-center gap-3 text-center">
              {shareActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => requestShare(action)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                  <action.Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => requestShare({ platform: 'copy' })}
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
          )}

          <div className="cta-year-in-review flex justify-center">
            <Link 
              href="https://docsbot.ai/article/docsbot-by-the-numbers-2025-recap-infographic"
              target="_blank"
              className="inline-flex items-center justify-center rounded-lg border border-cyan-200 bg-white px-5 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              See the 2025 recap for all DocsBot customers <ArrowRightIcon className="size-4 ml-1" />
            </Link>
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
              <Link
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
              </Link>
              <Link
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
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Transition.Root show={Boolean(pendingShare)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeShareModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/60 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900"
                  >
                    Make this report public?
                  </Dialog.Title>
                  <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <p>
                      Sharing this link will make your DocsBot {YEAR_KEY} report visible to anyone with the URL.
                    </p>
                    <p className="text-gray-600">
                      Confirm to publish and continue with
                      {pendingShare?.label ? ` ${pendingShare.label.toLowerCase()}` : ' this share action'}.
                    </p>
                    {shareError && (
                      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                        {shareError}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={closeShareModal}
                      disabled={isPublishing}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={confirmShare}
                      disabled={isPublishing}
                    >
                      {isPublishing ? 'Publishing…' : 'Make public & share'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
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
  const ogImageUrl =
    report?.design_cropped_image_url || report?.design_image_url || null

  const isPublic = Boolean(report?.is_public)
  let hasTeamAccess = false
  let isAuthenticated = false

  // Check if user is authenticated and has team access
  try {
    const { uid } = await getAuthorizedUser(context)
    isAuthenticated = true
    
    // Check permissions using team data we already fetched
    if (data?.roles?.[uid] || isSuperAdmin(uid)) {
      hasTeamAccess = true
    }
  } catch (error) {
    isAuthenticated = false
  }

  const allowFullReport = isPublic || hasTeamAccess
  const safeReport = allowFullReport ? report : { is_public: isPublic }

  return {
    props: {
      teamId,
      report: safeReport,
      shareUrl,
      ogImageUrl,
    },
  }
}
