import { useState, useEffect } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import {
    DocumentTextIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import TipsButton from '@new-dashboard/TipsButton'
import { sourceTypes } from '@/constants/sourceTypes.constants'

const STATUS_LABELS = {
    ready: 'Ready',
    failed: 'Need Review',
    queued: 'Queued',
    indexing: 'Indexing',
    processing: 'Processing',
    pending: 'Pending',
}

const STATUS_COLORS = {
    ready: 'text-green-700',
    failed: 'text-red-700',
    queued: 'text-gray-600',
    indexing: 'text-blue-700',
    processing: 'text-indigo-700',
    pending: 'text-yellow-700',
}

const MAX_FAILED_ERROR_LENGTH = 80

const formatFailedSourceError = (errorText) => {
    const normalized = (errorText || 'Unknown error')
        .replace(/\s+/g, ' ')
        .trim()

    if (normalized.length <= MAX_FAILED_ERROR_LENGTH) return normalized

    return `${normalized.slice(0, MAX_FAILED_ERROR_LENGTH - 1)}…`
}

const getFailedSourceTitle = (source) => {
    const title = source?.title?.trim()
    if (title) return title

    const url = source?.url?.trim()
    if (url) return url

    return 'Untitled source'
}

const getFailedSourceTypeLabel = (source) => {
    const sourceType = sourceTypes.find((type) => type.id === source?.type)
    return sourceType?.title || source?.type || 'Source'
}

const SourcesTooltip = ({ counts, total, failed, ready, manageHref }) => {
    const detailRows = [
        { key: 'ready', count: ready },
        { key: 'failed', count: failed },
        { key: 'queued', count: counts.queued ?? 0 },
        { key: 'indexing', count: counts.indexing ?? 0 },
        { key: 'processing', count: counts.processing ?? 0 },
        { key: 'pending', count: counts.pending ?? 0 },
    ].filter((row) => row.count > 0 || row.key === 'ready')

    return (
        <TipsButton
            icon={DocumentTextIcon}
            label={`${total} Sources`}
            color="white"
            position="right"
            title="Sources By Status"
            action={{
                label: 'Manage sources →',
                href: manageHref,
            }}
        >
            <div className="space-y-2 text-sm">
                {detailRows.map(({ key, count }) => (
                    <div
                        key={key}
                        className={clsx(
                            'flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1.5',
                            STATUS_COLORS[key] || 'text-gray-700',
                        )}
                    >
                        <span className="font-medium text-gray-700">
                            {STATUS_LABELS[key]}
                        </span>
                        <span
                            className={clsx(
                                'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums shadow-sm',
                                {
                                    ['bg-green-100 text-green-800']: key === 'ready',
                                    ['bg-amber-100 text-amber-800']: key === 'failed',
                                    ['bg-white text-gray-800']: key !== 'ready' && key !== 'failed',
                                },
                            )}
                        >
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </TipsButton>
    )
}

const WarningTooltip = ({
    failed,
    manageHref,
    failedSources,
    failedSourcesLoading,
}) => {
    const limitedSources = failedSources.slice(0, 3)

    return (
        <TipsButton
            color="amber"
            position="right"
            icon={ExclamationCircleIcon}
            label={`${failed} Need Review`}
            action={{
                label: 'View all sources neding review →',
                href: manageHref,
            }}
        >
            <p
                className={clsx('mb-3 text-sm font-semibold text-gray-800', {
                    ['align-center flex justify-between gap-3']:
                        limitedSources.length > 3,
                })}
            >
                <span>Sources Need Review</span>
                {limitedSources.length > 3 && (
                    <span>
                        {limitedSources.length} / {failed}
                    </span>
                )}
            </p>

            <div className="space-y-3">
                {failedSourcesLoading && (
                    <div className="rounded-md border border-blue-100 bg-blue-50/40 px-3 py-2">
                        <p className="text-sm font-medium text-gray-700">
                            Loading failed sources…
                        </p>
                        <p className="text-xs text-gray-500">
                            Hang tight while we fetch the latest status.
                        </p>
                    </div>
                )}

                {!failedSourcesLoading && limitedSources.length === 0 && (
                    <div className="rounded-md border border-red-100 bg-red-50/40 px-3 py-2">
                        <p className="text-sm font-medium text-gray-700">
                            We couldn’t load the failed list.
                        </p>
                        <p className="text-xs text-gray-500">
                            Open Manage sources to review full details.
                        </p>
                    </div>
                )}

                {!failedSourcesLoading && limitedSources.length > 0 && (
                    <div className="space-y-2">
                        {limitedSources.map((source) => (
                            <div
                                key={source.id}
                                className="rounded-md border border-gray-200 bg-gray-100 px-3 py-3"
                            >
                                <div className="space-y-2">
                                    <span className="rounded-full bg-gray-300/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-900">
                                        {getFailedSourceTypeLabel(source)}
                                    </span>
                                    <p className="text-sm leading-tight text-gray-900">
                                        {getFailedSourceTitle(source)}
                                    </p>
                                </div>

                                <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">
                                    {formatFailedSourceError(source.error)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </TipsButton>
    )
}

function PageChatSources({ teamId, botId }) {
    const [counts, setCounts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [failedSources, setFailedSources] = useState([])
    const [failedSourcesLoading, setFailedSourcesLoading] = useState(false)

    useEffect(() => {
        if (!teamId || !botId) return
        let cancelled = false
        setLoading(true)
        setError(null)
        fetch(`/api/teams/${teamId}/bots/${botId}/sources/counts`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load')
                return res.json()
            })
            .then((data) => {
                if (!cancelled) setCounts(data)
            })
            .catch((e) => {
                if (!cancelled) setError(e.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [teamId, botId])

    const manageHref = `/app/bots/${botId}/configure/sources`
    const total = counts?.total ?? 0
    const failed = counts?.failed ?? 0
    const ready = counts?.ready ?? 0

    useEffect(() => {
        if (!teamId || !botId || !counts || failed === 0) {
            setFailedSources([])
            setFailedSourcesLoading(false)
            return
        }

        let cancelled = false

        const loadFailedSources = async () => {
            setFailedSourcesLoading(true)
            try {
                const pageSize = 100
                let page = 0
                let collected = []
                let hasMorePages = true

                while (hasMorePages && collected.length < 3) {
                    const response = await fetch(
                        `/api/teams/${teamId}/bots/${botId}/sources?page=${page}&limit=${pageSize}`,
                    )
                    if (!response.ok) {
                        throw new Error('Failed to load sources')
                    }
                    const data = await response.json()
                    const failedBatch = (data.sources || []).filter(
                        (source) => source.status === 'failed',
                    )
                    collected = [...collected, ...failedBatch]
                    hasMorePages = Boolean(data.pagination?.hasMorePages)
                    if (!data.sources?.length) {
                        hasMorePages = false
                    }
                    page += 1
                }

                if (!cancelled) {
                    setFailedSources(collected)
                }
            } catch (error) {
                if (!cancelled) {
                    setFailedSources([])
                }
            } finally {
                if (!cancelled) {
                    setFailedSourcesLoading(false)
                }
            }
        }

        loadFailedSources()

        return () => {
            cancelled = true
        }
    }, [teamId, botId, counts, failed])

    if (loading) {
        return (
            <div
                className={clsx(
                    'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500',
                )}
            >
                <LoadingSpinner small />
                <span>Sources…</span>
            </div>
        )
    }

    if (error || !counts) {
        return (
            <Link
                href={manageHref}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
                <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Manage sources</span>
            </Link>
        )
    }

    return (
        <>
            <SourcesTooltip
                counts={counts}
                total={total}
                failed={failed}
                ready={ready}
                manageHref={manageHref}
            />

            {failed > 0 && (
                <WarningTooltip
                    failed={failed}
                    manageHref={manageHref}
                    failedSources={failedSources}
                    failedSourcesLoading={failedSourcesLoading}
                />
            )}
        </>
    )
}

export default PageChatSources
