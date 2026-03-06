import { useState } from 'react'
import clsx from 'clsx'

import Link from 'next/link'
import { LightBulbIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

const TipsButton = ({
    icon,
    title,
    label,
    errorLabel,
    action,
    color = 'yellow',
    position = 'center',
    className,
    children,
}) => {
    const [ariaHidden, setAriaHidden] = useState(false)

    let buttonColor, errorLabelColor

    switch (color) {
        case 'yellow':
            buttonColor =
                'border-yellow-100 bg-yellow-100 text-yellow-800 group-hover:border-yellow-500'
            errorLabelColor = 'bg-red-50 border border-red-300 text-red-600'
            break

        case 'blue':
        case 'cyan':
            buttonColor =
                'border-cyan-100 bg-cyan-100 text-cyan-800 group-hover:border-cyan-500'
            errorLabelColor = 'bg-red-100 text-red-600'
            break

        case 'red':
            buttonColor =
                'border-red-100 bg-red-100 text-red-800 group-hover:border-red-500'
            errorLabelColor = 'bg-white text-red-600'
            break

        default:
            buttonColor =
                'border-silver-100 bg-white text-silver-800 group-hover:border-cyan-300 group-hover:bg-cyan-50'
            errorLabelColor = 'bg-red-100 text-red-600'
            break
    }

    const IconComponent = icon || LightBulbIcon
    const hasLabel = Boolean(label)
    const hasErrorLabel = hasLabel && Boolean(errorLabel)

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
                        ['pr-0']: hasLabel && hasErrorLabel,
                    },
                    buttonColor,
                )}
            >
                <IconComponent className="size-4" />
                {hasLabel && (
                    <span className="text-xs font-semibold">{label}</span>
                )}
                {(hasLabel && hasErrorLabel) && (
                    <span
                        className={clsx(
                            'relative flex h-9 items-center overflow-hidden mr-[1px] pl-2 pr-3 text-xs font-semibold rounded-r-full',
                            errorLabelColor,
                        )}
                    >
                        <ExclamationCircleIcon className="mr-1 size-3.5" />
                        {errorLabel}
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
                    <div className="mt-3 text-xs/none font-semibold">
                        <Link
                            href={action.href}
                            target={action.target || '_self'}
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
