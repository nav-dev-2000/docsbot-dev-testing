import Image from 'next/image'
import clsx from 'clsx'
import botJuggling from '@/images/app-demo/docsbot-mascot-juggling.svg'

const WorkspaceLoader = ({
    message = 'Loading...',
    className,
    variant = 'default',
}) => {
    const researchMainSkeleton = (
        <div className="w-full">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200/80" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200/80" />
                </div>
                <div className="mt-4 h-24 w-full animate-pulse rounded bg-gray-100" />
                <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={`research-chip-${index}`}
                            className="h-6 w-20 animate-pulse rounded-full bg-gray-100"
                        />
                    ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="h-9 w-32 animate-pulse rounded bg-gray-200/80" />
                    <div className="h-9 w-28 animate-pulse rounded bg-gray-200/80" />
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={`research-line-${index}`}
                        className="h-4 w-full animate-pulse rounded bg-gray-100"
                    />
                ))}
            </div>
        </div>
    )

    const researchSidebarSkeleton = (
        <ul role="list" className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, index) => (
                <li
                    key={`research-sidebar-${index}`}
                    className="flex items-center gap-3 px-4 py-4"
                >
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 animate-pulse rounded bg-gray-200/80" />
                        <div className="h-2 w-24 animate-pulse rounded bg-gray-100" />
                    </div>
                </li>
            ))}
        </ul>
    )

    const conversationsMainSkeleton = (
        <div className="w-full space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={`conversation-bubble-${index}`}
                    className={clsx(
                        'flex',
                        index % 2 === 0 ? 'justify-start' : 'justify-end',
                    )}
                >
                    <div
                        className={clsx(
                            'h-16 w-3/4 animate-pulse rounded-2xl border',
                            index % 2 === 0 ? 'bg-white' : 'bg-cyan-50',
                        )}
                    />
                </div>
            ))}
            <div className="flex items-center justify-between border-t pt-4">
                <div className="h-9 w-28 animate-pulse rounded bg-gray-200/80" />
                <div className="h-9 w-28 animate-pulse rounded bg-gray-200/80" />
            </div>
        </div>
    )

    const conversationsSidebarSkeleton = (
        <ul role="list" className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, index) => (
                <li
                    key={`conversation-sidebar-${index}`}
                    className="flex items-center gap-3 px-4 py-4"
                >
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded bg-gray-200/80" />
                        <div className="h-2 w-24 animate-pulse rounded bg-gray-100" />
                    </div>
                </li>
            ))}
        </ul>
    )

    const skillsListSkeleton = (
        <div
            className="w-full"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={`skills-skeleton-card-${index}`}
                        className="flex min-h-[160px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="h-5 w-2/3 max-w-[12rem] animate-pulse rounded bg-gray-200/80" />
                                    <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-gray-100" />
                                </div>
                                <div className="mt-2 space-y-1.5">
                                    <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                                    <div className="h-3 w-11/12 animate-pulse rounded bg-gray-100" />
                                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                                </div>
                                <div className="mt-4 flex gap-1">
                                    <div className="h-5 w-5 animate-pulse rounded bg-gray-100" />
                                    <div className="h-5 w-5 animate-pulse rounded bg-gray-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200/50" />
                    <div className="mt-3 h-4 w-32 max-w-full animate-pulse rounded bg-gray-200/60" />
                    <div className="mt-1.5 h-3 w-44 max-w-full animate-pulse rounded bg-gray-100" />
                </div>
            </div>
            <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                {message}
            </div>
        </div>
    )

    if (variant === 'sources') {
        return (
            <div className={clsx('w-full', className)}>
                <div className="flex items-center justify-between">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200/80" />
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200/80" />
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <li
                            key={`source-skeleton-${index}`}
                            className="col-span-1 flex h-20 overflow-hidden rounded-md shadow-sm"
                        >
                            <div className="w-16 flex-shrink-0 animate-pulse bg-gradient-to-r from-teal-600/40 to-cyan-700/40" />
                            <div className="flex w-full flex-col gap-2 rounded-r-md border border-gray-200 bg-white px-3 py-2">
                                <div className="h-3 w-24 animate-pulse rounded bg-gray-200/80" />
                                <div className="h-2 w-32 animate-pulse rounded bg-gray-100" />
                                <div className="h-2 w-40 animate-pulse rounded bg-gray-100" />
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-6 flex items-center justify-center">
                    <div className="h-8 w-40 animate-pulse rounded bg-gray-200/80" />
                </div>
                <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                    {message}
                </div>
            </div>
        )
    }

    if (variant === 'research') {
        return (
            <div className={clsx('flex w-full flex-1', className)}>
                <div className="flex-1 px-4 py-6">
                    <div className="mx-auto w-full max-w-4xl">
                        {researchMainSkeleton}
                        <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                            {message}
                        </div>
                    </div>
                </div>
                <div className="hidden h-full w-80 border-l border-gray-200 bg-white lg:block xl:w-96">
                    {researchSidebarSkeleton}
                </div>
            </div>
        )
    }

    if (variant === 'research-main') {
        return (
            <div className={clsx('w-full', className)}>
                {researchMainSkeleton}
                <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                    {message}
                </div>
            </div>
        )
    }

    if (variant === 'research-sidebar') {
        return (
            <div className={clsx('w-full', className)}>
                {researchSidebarSkeleton}
            </div>
        )
    }

    if (variant === 'conversations') {
        return (
            <div className={clsx('flex w-full flex-1', className)}>
                <div className="flex-1 px-4 py-6">
                    <div className="mx-auto w-full max-w-4xl">
                        {conversationsMainSkeleton}
                        <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                            {message}
                        </div>
                    </div>
                </div>
                <div className="hidden h-full w-80 border-l border-gray-200 bg-white lg:block xl:w-96">
                    {conversationsSidebarSkeleton}
                </div>
            </div>
        )
    }

    if (variant === 'conversations-main') {
        return (
            <div className={clsx('w-full', className)}>
                {conversationsMainSkeleton}
                <div className="mt-6 flex items-center justify-center text-sm font-medium text-gray-500">
                    {message}
                </div>
            </div>
        )
    }

    if (variant === 'conversations-sidebar') {
        return (
            <div className={clsx('w-full', className)}>
                {conversationsSidebarSkeleton}
            </div>
        )
    }

    if (variant === 'skills') {
        return <div className={clsx('w-full', className)}>{skillsListSkeleton}</div>
    }

    return (
        <div
            className={clsx(
                'flex w-full flex-1 flex-col items-center justify-center gap-4 py-16 text-center',
                className,
            )}
        >
            <Image
                src={botJuggling}
                alt=""
                className="h-32 w-32"
                priority={false}
            />
            <p className="text-sm font-medium text-gray-600">{message}</p>
        </div>
    )
}

export default WorkspaceLoader
