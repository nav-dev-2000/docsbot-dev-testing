import clsx from 'clsx'
import Link from 'next/link'
import { forwardRef } from 'react'

const WorkspaceButton = forwardRef(
    (
        {
            label,
            icon,
            iconClassName,
            isSmall = false,
            isActive,
            isVertical = false,
            allowActiveClick = false,
            href,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const Icon = icon
        const Component = href ? Link : 'button'

        let buttonClasses = clsx(
            'h-full',
            'flex items-center gap-1 border-b-2 border-transparent font-medium',
            'transition-colors duration-300 ease-in-out',
            {
                ['bg-cyan-600 text-white']: isActive,
                ['text-gray-400 hover:text-cyan-600 hover:border-b-2 hover:border-cyan-600']:
                    !isActive,
                ['pointer-events-none']: isActive && !allowActiveClick,
                ['text-xs/5 px-2 py-2']: isSmall,
                ['text-xs/6 sm:text-sm/6 px-3 py-2']: !isSmall,
            },
            className,
        )

        if (isVertical) {
            buttonClasses = clsx(
                'w-full block transition',
                'px-4 py-2 border border-transparent rounded-lg',
                'text-sm/6 font-medium text-left',
                {
                    ['pointer-events-none border-gray-200 bg-white shadow text-gray-800']:
                        isActive,
                    ['text-gray-500 hover:bg-gray-200']: !isActive,
                },
                className,
            )
        }

        const iconClasses = clsx(
            'hidden md:block transition-all duration-300 ease-in-out',
            {
                ['size-4']: isSmall,
                ['size-5']: !isSmall,
            },
            iconClassName,
        )

        return (
            <Component
                ref={ref}
                href={href}
                className={buttonClasses}
                {...props}
            >
                {icon && <Icon className={iconClasses} />}
                {label}
                {children}
            </Component>
        )
    },
)

WorkspaceButton.displayName = 'WorkspaceButton'

export default WorkspaceButton
