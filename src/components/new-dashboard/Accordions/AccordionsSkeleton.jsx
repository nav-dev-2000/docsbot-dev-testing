import clsx from 'clsx'

const AccordionsSkeleton = ({ items = 3, isBoxed = true, className }) => {
    const rows = Array.from({ length: items })

    return (
        <div
            className={clsx(
                'border-gray-200',
                {
                    ['border']: isBoxed,
                    ['border-y']: !isBoxed,
                },
                className,
            )}
        >
            {rows.map((_, index) => {
                const isLast = index + 1 === rows.length

                return (
                    <div key={`accordion-skeleton-${index}`}>
                        <div
                            className={clsx('relative bg-white px-6 py-4', {
                                ['border-b border-gray-200']: !isLast,
                            })}
                        >
                            <div className="flex flex-1 flex-col gap-2 pr-7">
                                <div className="h-2 w-24 animate-pulse rounded-full bg-gray-200" />
                                <div className="h-3 w-4/5 animate-pulse rounded-full bg-gray-200" />
                            </div>
                            <div className="absolute right-6 top-1/2 size-4 -translate-y-1/2 animate-pulse rounded-full bg-gray-200" />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default AccordionsSkeleton
