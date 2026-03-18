import React, { forwardRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const IconButton = forwardRef(
    (
        {
            type = 'button',
            label,
            icon,
            faIcon,
            href,
            onClick,
            size = 'md',
            theme,
            className,
            iconClassName,
            ...props
        },
        ref,
    ) => {
        let sizeClass, themeClass, iconClass, faIconSize

        const Element = href ? Link : 'button'
        const propsElement = href
            ? { type, href, ...props }
            : { type, onClick, ...props }

        const IconElement = icon

        switch (theme) {
            case 'blue':
                themeClass = 'border-cyan-600 text-cyan-600 shadow-cyan-500/30'
                break

            case 'blueSolid':
                themeClass = '!border-cyan-600 !bg-cyan-600 !text-white shadow-cyan-500/30 hover:!bg-cyan-700 hover:!border-cyan-700'
                break

            case 'red':
                themeClass = 'border-red-600 text-red-600 shadow-red-500/30'
                break

            default:
                themeClass = 'border-gray-300 text-gray-800'
                break
        }

        switch (size) {
            case 'sm':
                sizeClass = 'w-[34px] h-[34px]'
                iconClass = 'size-4'
                faIconSize = 'sm'
                break

            default:
                sizeClass = 'h-[40px] w-[42px]'
                iconClass = 'size-5'
                faIconSize = 'md'
                break
        }

        return (
            <Element
                ref={ref}
                type={type}
                href={href}
                className={clsx(
                    sizeClass,
                    'flex cursor-pointer items-center justify-center rounded-lg border bg-white shadow',
                    themeClass,
                    'disabled:pointer-events-none disabled:opacity-50',
                    className,
                )}
                {...propsElement}
            >
                {icon && (
                    <IconElement
                        className={clsx(iconClass, '!mx-0', iconClassName)}
                    />
                )}
                {faIcon && <FontAwesomeIcon icon={faIcon} size={faIconSize} />}
                {label && <span className="sr-only">{label}</span>}
            </Element>
        )
    },
)

IconButton.displayName = 'IconButton'

export default IconButton
