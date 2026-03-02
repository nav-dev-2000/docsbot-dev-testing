import { useState } from "react"
import clsx from "clsx"

import Link from 'next/link'
import { LightBulbIcon } from "@heroicons/react/24/outline"

const TipsButton = ({
    icon,
    title,
    action,
    color = 'yellow',
    position = 'center',
    className,
    children
}) => {
    const [ariaHidden, setAriaHidden] = useState(false)

    let buttonColor = 'border-yellow-100 bg-yellow-100 text-yellow-800 group-hover:border-yellow-500'

    switch (color) {
        case 'yellow':
            buttonColor = 'border-yellow-100 bg-yellow-100 text-yellow-800 group-hover:border-yellow-500'
            break

        case 'blue':
        case 'cyan':
            buttonColor = 'border-cyan-100 bg-cyan-100 text-cyan-800 group-hover:border-cyan-500'
            break

        default:
            buttonColor = 'border-silver-100 bg-silver-100 text-silver-800 group-hover:border-silver-500'
            break
    }

    const IconComponent = icon || LightBulbIcon

    return (
        <div
            className={clsx(
                'group relative block',
                className,
            )}
            onMouseOver={() => setAriaHidden(true)}
            onMouseOut={() => setAriaHidden(false)}
        >
            <button
                role="button"
                className={clsx(
                    'size-10 flex items-center justify-center border rounded-full shadow transition',
                    buttonColor,
                )}
            >
                <IconComponent className="size-4" />
            </button>

            <div
                className={clsx(
                    'w-72 absolute z-[100] top-[100%] mt-1 p-3 border border-gray-100 rounded-lg bg-white shadow-md',
                    'transition scale-0 group-hover:scale-100',
                    {
                        ['left-0']: position === 'left',
                        ['right-0']: position === 'right',
                        ['left-1/2 -translate-x-1/2']: position !== 'left' && position !== 'right'
                    }
                )}
                aria-hidden={ariaHidden}
            >
                {title && (
                    <p className="mb-3 text-gray-800 text-sm font-semibold">{title}</p>
                )}

                <div className="text-gray-500 text-xs/none">
                    {children}
                </div>

                {(action?.label && action?.href) && (
                    <div className="mt-3 text-xs/none font-semibold">
                        <Link
                            href={action.href}
                            target={action.target || '_self'}
                            {...action.props}
                            className={clsx(
                                'text-cyan-600 hover:text-cyan-800 transition',
                                action.className
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
