import { useState } from 'react'
import clsx from 'clsx'

import Link from 'next/link'
import { LightBulbIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

const TipsButton = ({
    icon,
    title,
    label,
    warning,
    action,
    color = 'yellow',
    position = 'center',
    className,
    children,
}) => {
    const [ariaHidden, setAriaHidden] = useState(false)

    let buttonColor, warningColor

    switch (color) {
        case 'yellow':
            buttonColor =
                'border-yellow-100 bg-yellow-100 text-yellow-800 group-hover:border-yellow-500'
            warningColor = 'bg-amber-300 text-amber-800'
            break

        case 'amber':
            buttonColor =
                'border-transparent bg-amber-400 text-amber-900 group-hover:border-amber-800'
            break

        case 'blue':
        case 'cyan':
            buttonColor =
                'border-cyan-100 bg-cyan-100 text-cyan-800 group-hover:border-cyan-500'
            warningColor = 'bg-amber-50 text-amber-700'
            break

        case 'red':
            buttonColor =
                'border-red-100 bg-red-100 text-red-800 group-hover:border-red-500'
            warningColor = 'bg-amber-50 text-amber-600'
            break

        default:
            buttonColor =
                'border-silver-100 bg-white text-silver-800 group-hover:border-cyan-300 group-hover:bg-cyan-50'
            warningColor = 'bg-amber-100 text-amber-600'
            break
    }

    const IconComponent = icon || LightBulbIcon
    const hasLabel = Boolean(label)
    const hasWarning = hasLabel && Boolean(warning)
    const actionTarget = action?.target || '_self'

    return (
        <div
            className={clsx('group relative block', className)}
            onMouseOver={() => setAriaHidden(true)}
            onMouseOut={() => setAriaHidden(false)}
        >
            <button
                role="button"
                className={clsx(
                    'flex items-center justify-center rounded-full border shadow transition',
                    {
                        ['h-10 gap-2 px-3']: hasLabel,
                        ['size-10']: !hasLabel,
                        ['pr-0']: hasLabel && hasWarning,
                    },
                    buttonColor,
                )}
            >
                <IconComponent className="size-4" />
                {hasLabel && (
                    <span className="text-xs font-semibold">{label}</span>
                )}
                {(hasLabel && hasWarning) && (
                    <span
                        className={clsx(
                            'relative flex h-9 items-center overflow-hidden mr-[1px] pl-2 pr-3 text-xs font-semibold rounded-r-full',
                            warningColor,
                        )}
                    >
                        <ExclamationCircleIcon className="mr-1 size-3.5" />
                        {warning}
                    </span>
                )}
            </button>

            <div
                className={clsx(
                    'absolute top-[100%] z-[100] mt-1 w-72 rounded-lg border border-gray-100 bg-white p-3 shadow-md',
                    'scale-0 transition group-hover:scale-100',
                    {
                        ['left-0']: position === 'left',
                        ['right-0']: position === 'right',
                        ['left-1/2 -translate-x-1/2']:
                            position !== 'left' && position !== 'right',
                    },
                )}
                aria-hidden={ariaHidden}
            >
                {title && (
                    <p className="mb-3 text-sm font-semibold text-gray-800">
                        {title}
                    </p>
                )}

                <div className="text-xs/none text-gray-500">{children}</div>

                {action?.label && action?.href && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs/none font-semibold">
                        <Link
                            href={action.href}
                            target={actionTarget}
                            {...(actionTarget === '_self' ? { shallow: true } : {})}
                            {...action.props}
                            className={clsx(
                                'text-cyan-600 transition hover:text-cyan-800',
                                action.className,
                            )}
                        >
                            {action.label}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TipsButton
