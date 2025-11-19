import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

type NavItemBasics = {
    href: string
    name: string
    active?: boolean
}

interface NavItemProps extends NavItemBasics {
    children?: NavItemBasics[]
}

export const NavItem: React.FC<NavItemProps> = ({ href, name, active = false, children }) => {
    const hasChildren = !!children && children.length > 0

    const [isOpen, setIsOpen] = useState(false)
    const closeTimeoutRef = useRef<number | null>(null)

    const openMenu = () => {
        if (closeTimeoutRef.current !== null) {
            window.clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setIsOpen(true)
    }

    const scheduleClose = () => {
        if (closeTimeoutRef.current !== null) {
            window.clearTimeout(closeTimeoutRef.current)
        }
        closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false)
            closeTimeoutRef.current = null
        }, 80)
    }

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current !== null) {
                window.clearTimeout(closeTimeoutRef.current)
            }
        }
    }, [])

    const cssParent = clsx(
        'text-base font-medium text-white border-b-2 border-solid border-transparent hover:border-teal-500 transition-colors',
        {
            ['border-teal-500']: active,
        },
    )

    if (!hasChildren) {
        return (
            <Link href={href} className={cssParent}>
                {name}
            </Link>
        )
    }

    return (
        <div className="relative">
            <Link
                href={href}
                className={clsx(cssParent, 'inline-flex items-center')}
                aria-haspopup="true"
                aria-expanded={isOpen}
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
                onFocus={openMenu}
                onBlur={scheduleClose}
            >
                {name}
            </Link>

            <div
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
                onFocus={openMenu}
                onBlur={scheduleClose}
                className={clsx(
                    'absolute left-0 top-full z-10 mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition transform ease-out duration-150',
                    isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-1 pointer-events-none'
                )}
                role="menu"
                aria-label={name}
            >
                {children?.map((child) => (
                    <Link
                        key={child.name}
                        href={child.href}
                        role="menuitem"
                        tabIndex={-1}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        {child.name}
                    </Link>
                ))}
            </div>
        </div>
    )
}
