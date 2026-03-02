import React, { forwardRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

const Button = forwardRef(
    (
        {
            type = 'button',
            label,
            icon,
            iconPosition = 'lead',
            href,
            onClick,
            theme,
            size = 'sm',
            className,
            ...props
        },
        ref,
    ) => {
        let themeClass
        const sizeClass =
            size === 'md'
                ? 'px-4 py-2 text-sm font-semibold'
                : 'px-3 py-2 text-xs font-medium'

        const Element = href ? Link : 'button'
        const propsElement = href
            ? { type, href, ...props }
            : { type, onClick, ...props }

        const IconElement = icon

        switch (theme) {
            case 'blue':
                themeClass = 'border-cyan-600 text-cyan-600 shadow-cyan-500/30 hover:shadow-cyan-500/30'
                break

            case 'blueSolid':
                themeClass = '!border-cyan-600 !bg-cyan-600 !text-white shadow-cyan-500/30 hover:!bg-cyan-700 hover:!border-cyan-700 hover:shadow-cyan-500/30'
                break

            case 'red':
                themeClass = 'border-red-600 text-red-600 shadow-red-500/30 hover:shadow-red-500/30'
                break

            default:
                themeClass = 'border-gray-300 text-gray-800'
                break
        }

        return (
            <Element
                ref={ref}
                type={type}
                href={href}
                className={clsx(
                    'cursor-pointer',
                    'flex items-center gap-2 border rounded-md bg-white shadow-sm transition',
                    'hover:shadow-md',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    sizeClass,
                    themeClass,
                    className,
                )}
                {...propsElement}
            >
                {(IconElement && iconPosition === 'lead') && <IconElement className="size-4" />}
                {label}
                {(IconElement && iconPosition === 'trail') && <IconElement className="size-4" />}
            </Element>
        )
    },
)

Button.displayName = 'Button'

export default Button
