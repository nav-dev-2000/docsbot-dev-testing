import { useState, useEffect } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'

const STATUS_LABELS = {
    ready: 'Ready',
    failed: 'Failed',
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

function SourcesStatusBox({ teamId, botId }) {
    const [counts, setCounts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
        return () => { cancelled = true }
    }, [teamId, botId])

    const manageHref = `/app/bots/${botId}/configure/sources`

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

    const total = counts.total ?? 0
    const failed = counts.failed ?? 0
    const ready = counts.ready ?? 0

    const detailRows = [
        { key: 'ready', count: ready },
        { key: 'failed', count: failed },
        { key: 'queued', count: counts.queued ?? 0 },
        { key: 'indexing', count: counts.indexing ?? 0 },
        { key: 'processing', count: counts.processing ?? 0 },
        { key: 'pending', count: counts.pending ?? 0 },
    ].filter((row) => row.count > 0 || row.key === 'ready')

    return (
        <div className="group relative inline-block">
            <Link
                href={manageHref}
                shallow
                className={clsx(
                    'inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm',
                    'transition hover:border-cyan-200 hover:bg-cyan-50/50 hover:shadow',
                )}
            >
                <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="font-medium text-gray-800">
                    {total} {total === 1 ? 'source' : 'sources'}
                </span>
                {failed > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        <ExclamationCircleIcon className="h-3.5 w-3.5" />
                        {failed} failed
                    </span>
                )}
            </Link>

            <div
                className={clsx(
                    'absolute left-0 top-[100%] z-[100] mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg',
                    'origin-top-left transition scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100',
                )}
                aria-hidden="true"
            >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sources by status
                </p>
                <div className="space-y-1.5 text-sm">
                    {detailRows.map(({ key, count }) => (
                        <div
                            key={key}
                            className={clsx(
                                'flex items-center justify-between gap-3',
                                STATUS_COLORS[key] || 'text-gray-700',
                            )}
                        >
                            <span>{STATUS_LABELS[key]}</span>
                            <span className="font-semibold tabular-nums">{count}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 border-t border-gray-100 pt-2">
                    <Link
                        href={manageHref}
                        shallow
                        className="text-xs font-semibold text-cyan-600 hover:text-cyan-800"
                    >
                        Manage sources →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SourcesStatusBox
