import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import DocsBotLogo from '../DocsBotLogo'
import BotIcon from '../BotIcon'
import Tooltip from '@/components/Tooltip'

const Brand = ({ isOpen = true }) => {
    return (
        <Link href="/app" title="Dashboard">
            {isOpen ? (
                <DocsBotLogo className="h-5 w-auto text-white" />
            ) : (
                <BotIcon className="size-8 text-white" />
            )}
        </Link>
    )
}

const getSidebarSections = (navigation) => {
    if (!Array.isArray(navigation)) return []

    const hasSections = navigation.some((item) => Array.isArray(item?.items))
    if (hasSections) {
        return navigation.map((section, index) => ({
            id: section.id ?? `section-${index}`,
            title: section.title,
            items: section.items || [],
            collapsible: section.collapsible,
            defaultCollapsed: section.defaultCollapsed,
            variant: section.variant,
        }))
    }

    return [{ id: 'main', items: navigation }]
}

const SIDEBAR_STATE_KEY = 'docsbot-sidebar-open'

const SidebarDesktop = ({
    page,
    sections,
    collapsedSections,
    onToggleSection,
}) => {
    const [isOpen, setIsOpen] = useState(true)
    const [hasHydrated, setHasHydrated] = useState(false)
    const [animate, setAnimate] = useState(false)

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return
        const savedState = window.localStorage.getItem(SIDEBAR_STATE_KEY)
        if (savedState !== null) {
            setIsOpen(savedState === 'true')
        }
        setHasHydrated(true)
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!hasHydrated) return
        window.localStorage.setItem(SIDEBAR_STATE_KEY, String(isOpen))
    }, [hasHydrated, isOpen])

    const renderNavItem = (item) => {
        const handleItemClick = (event) => {
            if (!item.onClick) return
            event.preventDefault()
            item.onClick(event)
        }
        const isActive = item.isActive ?? item.name === page

        const itemLabel = item.tooltip || item.name
        const link = (
            <Link
                key={item.name}
                href={item.href || '/app'}
                shallow={item.shallow}
                onClick={handleItemClick}
                data-wizard={item.wizardId}
                className={clsx(
                    isActive
                        ? 'bg-cyan-800 text-white hover:text-white'
                        : 'text-cyan-100 hover:bg-cyan-600 hover:text-white',
                    'group flex items-center rounded-md py-2 text-sm font-medium transition',
                    isOpen ? 'px-2' : 'justify-center px-2',
                )}
            >
                {item.icon && (
                    <item.icon
                        className={clsx(
                            'size-5 flex-shrink-0 text-cyan-200',
                            isOpen ? 'mr-2' : 'mr-0',
                        )}
                        aria-hidden="true"
                    />
                )}

                {isOpen && item.name}
            </Link>
        )

        if (!isOpen && itemLabel) {
            return (
                <Tooltip key={item.name} content={itemLabel} placement="right">
                    {link}
                </Tooltip>
            )
        }

        return link
    }

    const renderBackItem = (section) => {
        const item = section.items?.[0]
        if (!item) return null

        const handleItemClick = (event) => {
            if (!item.onClick) return
            event.preventDefault()
            item.onClick(event)
        }

        const backLabel = item.name?.startsWith('←')
            ? item.name
            : `← ${item.name}`
        const collapsedLabel = item.tooltip || backLabel

        const link = (
            <Link
                key={item.name}
                href={item.href || '/app'}
                shallow={item.shallow}
                onClick={handleItemClick}
                className={clsx(
                    'group flex items-center rounded-md text-sm font-medium text-cyan-100/70 transition hover:text-white',
                    isOpen ? 'px-2 py-1.5' : 'justify-center px-2 py-1.5',
                )}
            >
                {!isOpen && item.icon && (
                    <item.icon
                        className="size-4 flex-shrink-0 text-cyan-100/60"
                        aria-hidden="true"
                    />
                )}
                {isOpen && backLabel}
            </Link>
        )

        if (!isOpen) {
            return (
                <Tooltip
                    key={item.name}
                    content={collapsedLabel}
                    placement="right"
                >
                    {link}
                </Tooltip>
            )
        }

        return link
    }

    return (
        <div
            className={clsx(
                'hidden h-full flex-none flex-col bg-cyan-700 md:flex print:!hidden',
                animate && 'transition-all duration-200',
                isOpen ? 'w-48' : 'w-16',
            )}
        >
            <div className="flex h-full flex-col bg-gradient-to-r from-cyan-700 to-cyan-800">
                <div className="flex-0 relative flex h-16 items-center bg-cyan-800 px-4">
                    <button
                        type="button"
                        className={clsx(
                            'transition',
                            'absolute -right-2 top-1/2 z-40 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-white text-cyan-800 shadow-md ring-1 ring-gray-100',
                            'hover:bg-cyan-50 focus:outline-none',
                        )}
                        onClick={() => {
                            setAnimate(true)
                            setIsOpen((open) => !open)
                        }}
                        aria-expanded={isOpen}
                        aria-label={
                            isOpen ? 'Collapse sidebar' : 'Expand sidebar'
                        }
                    >
                        <ChevronLeftIcon
                            className={clsx(
                                'size-3 rotate-0 transition-transform',
                                {
                                    'rotate-180': !isOpen,
                                },
                            )}
                        />
                    </button>

                    <Brand isOpen={isOpen} />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <nav className="px-2 py-3">
                        {sections.map((section, index) => {
                            const sectionId = section.id ?? `section-${index}`
                            const isCollapsed =
                                collapsedSections[sectionId] ?? false
                            const isCollapsible = section.collapsible
                            const hasHeader = section.title && isOpen
                            const showDivider = index > 0

                            if (section.variant === 'back') {
                                return (
                                    <div key={sectionId}>
                                        {showDivider && (
                                            <div className="my-3 h-px bg-cyan-200/10" />
                                        )}
                                        {renderBackItem(section)}
                                    </div>
                                )
                            }

                            return (
                                <div key={sectionId}>
                                    {showDivider && (
                                        <div className="my-3 h-px bg-cyan-200/10" />
                                    )}
                                    {hasHeader && (
                                        <div
                                            className={clsx(
                                                'mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-cyan-100/60',
                                                isCollapsible
                                                    ? 'select-none'
                                                    : 'cursor-default',
                                            )}
                                        >
                                            <span>{section.title}</span>
                                            {isCollapsible && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onToggleSection(
                                                            sectionId,
                                                        )
                                                    }
                                                    className="flex items-center text-cyan-100/60"
                                                    aria-expanded={!isCollapsed}
                                                    aria-label={`Toggle ${section.title}`}
                                                >
                                                    <ChevronDownIcon
                                                        className={clsx(
                                                            'size-4 transition-transform',
                                                            {
                                                                '-rotate-90':
                                                                    isCollapsed,
                                                            },
                                                        )}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!isCollapsed && (
                                        <div className="space-y-1">
                                            {section.items.map(renderNavItem)}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}

const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    dashboardNavigation,
    page,
}) => {
    const sections = useMemo(
        () => getSidebarSections(dashboardNavigation),
        [dashboardNavigation],
    )
    const [collapsedSections, setCollapsedSections] = useState({})

    useEffect(() => {
        setCollapsedSections((prev) => {
            const next = {}
            sections.forEach((section, index) => {
                const sectionId = section.id ?? `section-${index}`
                next[sectionId] =
                    prev[sectionId] ?? section.defaultCollapsed ?? false
            })
            return next
        })
    }, [sections])

    const toggleSection = (sectionId) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }))
    }

    return (
        <>
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-40 md:hidden print:hidden"
                    onClose={setSidebarOpen}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-800 bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-40 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-gradient-to-r from-cyan-700 to-cyan-800 pb-4 pt-5">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute right-0 top-0 -mr-12 pt-2">
                                        <button
                                            type="button"
                                            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                            onClick={() =>
                                                setSidebarOpen(false)
                                            }
                                        >
                                            <span className="sr-only">
                                                Close sidebar
                                            </span>
                                            <XMarkIcon
                                                className="h-6 w-6 text-white"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className="flex flex-shrink-0 items-center px-4">
                                    <Brand />
                                </div>
                                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                                    <nav className="px-2">
                                        {sections.map((section, index) => {
                                            const sectionId =
                                                section.id ?? `section-${index}`
                                            const isCollapsed =
                                                collapsedSections[sectionId] ??
                                                false
                                            const isCollapsible =
                                                section.collapsible
                                            const showDivider = index > 0

                                            if (section.variant === 'back') {
                                                const item = section.items?.[0]

                                                if (!item) return null

                                                const backLabel =
                                                    item.name?.startsWith('←')
                                                        ? item.name
                                                        : `← ${item.name}`

                                                return (
                                                    <div key={sectionId}>
                                                        {showDivider && (
                                                            <div className="my-3 h-px bg-cyan-200/10" />
                                                        )}
                                                        <Link
                                                            href={
                                                                item.href ||
                                                                '/app'
                                                            }
                                                            shallow={
                                                                item.shallow
                                                            }
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    !item.onClick
                                                                ) {
                                                                    return
                                                                }
                                                                event.preventDefault()
                                                                item.onClick(
                                                                    event,
                                                                )
                                                            }}
                                                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-cyan-100/70 transition hover:text-white"
                                                        >
                                                            {backLabel}
                                                        </Link>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div key={sectionId}>
                                                    {showDivider && (
                                                        <div className="my-3 h-px bg-cyan-200/10" />
                                                    )}
                                                    {section.title && (
                                                        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-cyan-100/60">
                                                            <span>
                                                                {section.title}
                                                            </span>
                                                            {isCollapsible && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleSection(
                                                                            sectionId,
                                                                        )
                                                                    }
                                                                    className="flex items-center text-cyan-100/60"
                                                                    aria-expanded={
                                                                        !isCollapsed
                                                                    }
                                                                    aria-label={`Toggle ${section.title}`}
                                                                >
                                                                    <ChevronDownIcon
                                                                        className={clsx(
                                                                            'size-4 transition-transform',
                                                                            {
                                                                                '-rotate-90':
                                                                                    isCollapsed,
                                                                            },
                                                                        )}
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!isCollapsed && (
                                                        <div className="space-y-1">
                                                            {section.items.map(
                                                                (item) => {
                                                                    const handleItemClick =
                                                                        (
                                                                            event,
                                                                        ) => {
                                                                            if (
                                                                                !item.onClick
                                                                            ) {
                                                                                return
                                                                            }
                                                                            event.preventDefault()
                                                                            item.onClick(
                                                                                event,
                                                                            )
                                                                        }
                                                                    const isActive =
                                                                        item.isActive ??
                                                                        item.name ===
                                                                            page

                                                                    return (
                                                                        <Link
                                                                            key={
                                                                                item.name
                                                                            }
                                                                            href={
                                                                                item.href ||
                                                                                '/app'
                                                                            }
                                                                            shallow={
                                                                                item.shallow
                                                                            }
                                                                            onClick={
                                                                                handleItemClick
                                                                            }
                                                                            data-wizard={
                                                                                item.wizardId
                                                                            }
                                                                            className={clsx(
                                                                                isActive
                                                                                    ? 'bg-cyan-800 text-white'
                                                                                    : 'text-cyan-100 hover:bg-cyan-600 hover:text-white',
                                                                                'group flex items-center rounded-md px-2 py-2 text-base font-medium',
                                                                            )}
                                                                        >
                                                                            {item.icon && (
                                                                                <item.icon
                                                                                    className="mr-4 h-6 w-6 flex-shrink-0 text-cyan-200"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                            {
                                                                                item.name
                                                                            }
                                                                        </Link>
                                                                    )
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                        <div className="w-14 flex-shrink-0" aria-hidden="true">
                            {/* Dummy element to force sidebar to shrink to fit close icon */}
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <SidebarDesktop
                page={page}
                sections={sections}
                collapsedSections={collapsedSections}
                onToggleSection={toggleSection}
            />
        </>
    )
}

export default Sidebar
