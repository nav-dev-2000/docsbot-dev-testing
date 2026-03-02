import { ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const AccordionsHead = ({
    tag = 'h3',
    id,
    title,
    status,
    statusIcon,
    statusClassName,
    isOpen = false,
    isLast = false,
    onClick,
}) => {
    const Element = tag
    const StatusIcon = statusIcon

    return (
        <Element>
            <button
                id={`accordion-tab-${id}`}
                type="button"
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${id}`}
                onClick={onClick}
                className={clsx(
                    'relative block w-full px-6 py-4 transition-colors duration-200',
                    {
                        ['bg-gray-50']: isOpen,
                        ['bg-white']: !isOpen,
                        ['border-b border-gray-200']: !isOpen && !isLast,
                    },
                )}
            >
                <span className="flex flex-1 flex-col gap-1 pr-7 text-left font-medium">
                    {status && (
                        <span
                            className={clsx(
                                'block truncate text-xs text-gray-500',
                                {
                                    ['relative pl-6']: statusIcon,
                                },
                                statusClassName,
                            )}
                        >
                            {statusIcon && (
                                <StatusIcon className="absolute left-0 top-1/2 size-4 -translate-y-1/2" />
                            )}
                            {status}
                        </span>
                    )}
                    <span className="block truncate text-sm text-gray-800">
                        {title}
                    </span>
                </span>

                <ChevronDownIcon
                    className={clsx(
                        'absolute right-6 top-1/2 size-4 -translate-y-1/2 transition-transform duration-200',
                        {
                            ['rotate-180']: isOpen,
                        },
                    )}
                />
            </button>
        </Element>
    )
}

export default AccordionsHead
