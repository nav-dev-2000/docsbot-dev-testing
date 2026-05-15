import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
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
import TeamsSelector from './TeamsSelector'

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
    const [activeFlyout, setActiveFlyout] = useState(null)
    const [flyoutHeight, setFlyoutHeight] = useState(0)
    const flyoutRef = useRef(null)

    // useLayoutEffect is safe here: SidebarDesktop only mounts on the client (see ClientSidebarDesktop).
    useLayoutEffect(() => {
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

    useEffect(() => {
        if (!activeFlyout?.name || !flyoutRef.current) return
        const nextHeight = flyoutRef.current.offsetHeight
        if (nextHeight && nextHeight !== flyoutHeight) {
            setFlyoutHeight(nextHeight)
        }
    }, [activeFlyout?.name, flyoutHeight])

    const renderNavItem = (item) => {
        const isDisabled = Boolean(item.disabled)
        const handleItemClick = (event) => {
            if (isDisabled) {
                event.preventDefault()
                return
            }

            if (!item.onClick) return
            event.preventDefault()
            item.onClick(event)
        }

        const hasChildren = Array.isArray(item.children) && item.children.length
        const isChildActive = hasChildren
            ? item.children.some(
                  (child) => child.isActive ?? child.name === page,
              )
            : false
        const isActive = (item.isActive ?? item.name === page) || isChildActive
        const shouldShowInline = isOpen && hasChildren && isActive
        const shouldEnableFlyout =
            !isDisabled && hasChildren && (!isOpen || !shouldShowInline)
        const isFlyoutOpen =
            shouldEnableFlyout &&
            activeFlyout?.name === item.name &&
            (activeFlyout.isParentHovered || activeFlyout.isFlyoutHovered)
        const flyoutGap = 12
        const childCount = item.children?.length ?? 0
        const estimatedFlyoutHeight = flyoutHeight || childCount * 36 + 16

        const itemLabel = item.tooltip || item.name
        const link = (
            <Link
                href={item.href || '/app'}
                shallow={item.shallow}
                onClick={handleItemClick}
                data-wizard={item.wizardId}
                aria-haspopup={hasChildren ? 'menu' : undefined}
                aria-expanded={hasChildren ? isFlyoutOpen : undefined}
                className={clsx(
                    isActive
                        ? 'bg-cyan-800 text-white hover:text-white'
                        : 'text-cyan-100 hover:bg-cyan-600 hover:text-white',
                    'group flex items-center rounded-md py-2 text-sm font-medium transition',
                    isOpen ? 'px-2' : 'justify-center px-2',
                    isDisabled &&
                        'pointer-events-none opacity-40 hover:bg-transparent',
                )}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
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

        if (!isOpen && itemLabel && !hasChildren) {
            return (
                <Tooltip key={item.name} content={itemLabel} placement="right">
                    {link}
                </Tooltip>
            )
        }

        if (!hasChildren) {
            return (
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
        }

        if (!shouldEnableFlyout) {
            return (
                <div key={item.name} className="space-y-1">
                    {link}
                    {shouldShowInline && (
                        <div className="space-y-1 pl-5">
                            <div className="relative space-y-1 pl-3">
                                <span className="absolute bottom-4 left-0 top-0 -mt-1 w-2 rounded-b-lg border-l border-cyan-200/20" />
                                {item.children.map((child) => {
                                    const isChildSelected =
                                        child.isActive ?? child.name === page
                                    return (
                                        <div
                                            key={child.name}
                                            className="relative"
                                        >
                                            <span className="absolute -left-3 top-1/2 -mt-0.5 h-2 w-3 -translate-y-1/2 rounded-bl-lg border-b border-cyan-200/20" />
                                            <Link
                                                href={child.href || '/app'}
                                                shallow={child.shallow}
                                                onClick={(event) => {
                                                    if (child.onClick) {
                                                        child.onClick(event)
                                                    }
                                                }}
                                                className={clsx(
                                                    isChildSelected
                                                        ? 'text-white'
                                                        : 'text-cyan-100/60 hover:text-cyan-100/80',
                                                    'block rounded-md px-3 py-1 text-sm font-medium transition',
                                                )}
                                            >
                                                {child.name}
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div
                key={item.name}
                data-flyout-parent={item.name}
                className="relative"
                onMouseEnter={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    setActiveFlyout({
                        name: item.name,
                        top: rect.top,
                        left: rect.right + flyoutGap,
                        isParentHovered: true,
                        isFlyoutHovered: false,
                    })
                }}
                onMouseLeave={(event) => {
                    const isFlyoutTarget = event.relatedTarget?.closest?.(
                        `[data-flyout="${item.name}"]`,
                    )
                    const isBridgeTarget = event.relatedTarget?.closest?.(
                        `[data-flyout-bridge="${item.name}"]`,
                    )
                    if (isFlyoutTarget || isBridgeTarget) {
                        setActiveFlyout((prev) =>
                            prev?.name === item.name
                                ? {
                                      ...prev,
                                      isParentHovered: false,
                                      isFlyoutHovered: true,
                                  }
                                : prev,
                        )
                        return
                    }
                    setActiveFlyout((prev) => {
                        if (prev?.name !== item.name) return prev
                        const nextState = {
                            ...prev,
                            isParentHovered: false,
                        }
                        if (!nextState.isFlyoutHovered) {
                            return null
                        }
                        return nextState
                    })
                }}
            >
                {link}
                {isFlyoutOpen && childCount > 0 && (
                    <div
                        data-flyout-bridge={item.name}
                        onMouseEnter={() =>
                            setActiveFlyout((prev) =>
                                prev?.name === item.name
                                    ? { ...prev, isFlyoutHovered: true }
                                    : prev,
                            )
                        }
                        onMouseLeave={(event) =>
                            setActiveFlyout((prev) => {
                                if (prev?.name !== item.name) return prev
                                if (
                                    event.relatedTarget?.closest?.(
                                        `[data-flyout="${item.name}"]`,
                                    )
                                ) {
                                    return prev
                                }
                                if (
                                    event.relatedTarget?.closest?.(
                                        `[data-flyout-parent="${item.name}"]`,
                                    )
                                ) {
                                    return {
                                        ...prev,
                                        isFlyoutHovered: false,
                                        isParentHovered: true,
                                    }
                                }
                                const nextState = {
                                    ...prev,
                                    isFlyoutHovered: false,
                                }
                                if (!nextState.isParentHovered) {
                                    return null
                                }
                                return nextState
                            })
                        }
                        style={{
                            top: activeFlyout?.top,
                            left: activeFlyout?.left - flyoutGap,
                            width: flyoutGap,
                            height: estimatedFlyoutHeight,
                        }}
                        className="fixed z-40 bg-transparent"
                    />
                )}
                <div
                    ref={flyoutRef}
                    data-flyout={item.name}
                    onMouseEnter={() =>
                        setActiveFlyout((prev) =>
                            prev?.name === item.name
                                ? { ...prev, isFlyoutHovered: true }
                                : prev,
                        )
                    }
                    onMouseLeave={(event) =>
                        setActiveFlyout((prev) => {
                            if (prev?.name !== item.name) return prev
                            const isParentTarget =
                                event.relatedTarget?.closest?.(
                                    `[data-flyout-parent="${item.name}"]`,
                                )
                            const isBridgeTarget =
                                event.relatedTarget?.closest?.(
                                    `[data-flyout-bridge="${item.name}"]`,
                                )
                            if (isParentTarget || isBridgeTarget) {
                                return {
                                    ...prev,
                                    isFlyoutHovered: false,
                                    isParentHovered: true,
                                }
                            }
                            const nextState = {
                                ...prev,
                                isFlyoutHovered: false,
                            }
                            if (!nextState.isParentHovered) {
                                return null
                            }
                            return nextState
                        })
                    }
                    style={
                        isFlyoutOpen
                            ? {
                                  top: activeFlyout?.top,
                                  left: activeFlyout?.left,
                              }
                            : undefined
                    }
                    className={clsx(
                        'fixed z-50 w-48 overflow-hidden rounded-xl bg-cyan-800 py-1 shadow-lg',
                        isFlyoutOpen ? 'block' : 'hidden',
                    )}
                >
                    <div className="space-y-0">
                        {item.children.map((child) => {
                            const isChildSelected =
                                child.isActive ?? child.name === page
                            return (
                                <Link
                                    key={child.name}
                                    href={child.href || '/app'}
                                    shallow={child.shallow}
                                    onClick={(event) => {
                                        if (child.onClick) {
                                            child.onClick(event)
                                        }
                                    }}
                                    className={clsx(
                                        isChildSelected
                                            ? 'bg-cyan-700 text-white'
                                            : 'text-cyan-100 hover:bg-cyan-600 hover:text-white',
                                        'block px-3 py-2 text-sm font-medium transition',
                                    )}
                                >
                                    {child.name}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderBackItem = (section) => {
        const item = section.items?.[0]
        if (!item) return null

        const handleItemClick = (event) => {
            if (!item.onClick) return
            event.preventDefault()
            item.onClick(event)
        }

        const backLabel = item.name || 'Back'
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
                {item.icon && (
                    <item.icon
                        className={clsx(
                            'size-4 flex-shrink-0 text-cyan-100/60',
                            isOpen ? 'mr-2' : 'mr-0',
                        )}
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
                                                    ? 'cursor-pointer select-none hover:text-cyan-100'
                                                    : 'cursor-default',
                                            )}
                                            {...(isCollapsible && {
                                                role: 'button',
                                                tabIndex: 0,
                                                onClick: () =>
                                                    onToggleSection(sectionId),
                                                onKeyDown: (e) => {
                                                    if (
                                                        e.key === 'Enter' ||
                                                        e.key === ' '
                                                    ) {
                                                        e.preventDefault()
                                                        onToggleSection(
                                                            sectionId,
                                                        )
                                                    }
                                                },
                                                'aria-expanded': !isCollapsed,
                                                'aria-label': `Toggle ${section.title}`,
                                            })}
                                        >
                                            <span>{section.title}</span>
                                            {isCollapsible && (
                                                <ChevronDownIcon
                                                    className={clsx(
                                                        'size-4 flex-shrink-0 transition-transform',
                                                        {
                                                            '-rotate-90':
                                                                isCollapsed,
                                                        },
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {isCollapsible ? (
                                        <div
                                            className={clsx(
                                                'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                isCollapsed
                                                    ? 'grid-rows-[0fr]'
                                                    : 'grid-rows-[1fr]',
                                            )}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                <div className="space-y-1">
                                                    {section.items.map(
                                                        renderNavItem,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
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

/**
 * Client-only wrapper so SidebarDesktop can use useLayoutEffect (reads localStorage
 * before paint). Renders a same-layout placeholder until mounted to avoid SSR warning
 * and prevent flash of wrong open/closed state.
 */
const ClientSidebarDesktop = (props) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <div
                className="hidden h-full w-48 flex-none flex-col bg-cyan-700 md:flex print:!hidden"
                aria-hidden="true"
            />
        )
    }

    return <SidebarDesktop {...props} />
}

const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    dashboardNavigation,
    page,
    team,
}) => {
    const sections = useMemo(
        () => getSidebarSections(dashboardNavigation),
        [dashboardNavigation],
    )
    const [collapsedSections, setCollapsedSections] = useState({})
    const [mobileExpanded, setMobileExpanded] = useState({})

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
                    className="relative z-modal md:hidden print:hidden"
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

                    <div className="fixed inset-0 z-modal flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-gradient-to-r from-cyan-700 to-cyan-800 pb-4 pt-5 rounded-tr-xl rounded-br-xl">
                                <div className="flex flex-shrink-0 items-center justify-between px-4">
                                    <Brand />

                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <button
                                            type="button"
                                            className="flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
                                    </Transition.Child>
                                </div>

                                <div className="mt-4 px-4 pb-4 border-b border-cyan-200/10">
                                    <TeamsSelector team={team} slides={true} />
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
                                                    item.name || 'Back'

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
                                                            {item.icon && (
                                                                <item.icon
                                                                    className="size-4 flex-shrink-0 text-cyan-100/60"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
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
                                                        <div
                                                            className={clsx(
                                                                'mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-cyan-100/60',
                                                                isCollapsible &&
                                                                    'cursor-pointer hover:text-cyan-100',
                                                            )}
                                                            {...(isCollapsible && {
                                                                role: 'button',
                                                                tabIndex: 0,
                                                                onClick: () =>
                                                                    toggleSection(
                                                                        sectionId,
                                                                    ),
                                                                onKeyDown: (
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                            'Enter' ||
                                                                        e.key ===
                                                                            ' '
                                                                    ) {
                                                                        e.preventDefault()
                                                                        toggleSection(
                                                                            sectionId,
                                                                        )
                                                                    }
                                                                },
                                                                'aria-expanded':
                                                                    !isCollapsed,
                                                                'aria-label': `Toggle ${section.title}`,
                                                            })}
                                                        >
                                                            <span>
                                                                {section.title}
                                                            </span>
                                                            {isCollapsible && (
                                                                <ChevronDownIcon
                                                                    className={clsx(
                                                                        'size-4 flex-shrink-0 transition-transform',
                                                                        {
                                                                            '-rotate-90':
                                                                                isCollapsed,
                                                                        },
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {isCollapsible ? (
                                                        <div
                                                            className={clsx(
                                                                'grid transition-[grid-template-rows] duration-200 ease-in-out',
                                                                isCollapsed
                                                                    ? 'grid-rows-[0fr]'
                                                                    : 'grid-rows-[1fr]',
                                                            )}
                                                        >
                                                            <div className="min-h-0 overflow-hidden">
                                                                <div className="space-y-1">
                                                                    {section.items.map(
                                                                        (
                                                                            item,
                                                                        ) => {
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
                                                                                        item.disabled &&
                                                                                            'pointer-events-none opacity-40 hover:bg-transparent',
                                                                                        'group flex items-center rounded-md px-2 py-2 text-base font-medium',
                                                                                    )}
                                                                                    aria-disabled={
                                                                                        item.disabled
                                                                                            ? true
                                                                                            : undefined
                                                                                    }
                                                                                    tabIndex={
                                                                                        item.disabled
                                                                                            ? -1
                                                                                            : undefined
                                                                                    }
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
                                                            </div>
                                                        </div>
                                                    ) : (
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
                                                                    const hasChildren =
                                                                        Array.isArray(
                                                                            item.children,
                                                                        ) &&
                                                                        item
                                                                            .children
                                                                            .length
                                                                    const isChildActive =
                                                                        hasChildren
                                                                            ? item.children.some(
                                                                                  (
                                                                                      child,
                                                                                  ) =>
                                                                                      child.isActive ??
                                                                                      child.name ===
                                                                                          page,
                                                                              )
                                                                            : false
                                                                    const isActive =
                                                                        (item.isActive ??
                                                                            item.name ===
                                                                                page) ||
                                                                        isChildActive
                                                                    const itemKey = `${sectionId}-${item.name}`
                                                                    const expandedKey =
                                                                        Object.keys(
                                                                            mobileExpanded,
                                                                        ).find(
                                                                            (
                                                                                key,
                                                                            ) =>
                                                                                mobileExpanded[
                                                                                    key
                                                                                ],
                                                                        )
                                                                    const isExpanded =
                                                                        hasChildren &&
                                                                        (expandedKey
                                                                            ? expandedKey ===
                                                                              itemKey
                                                                            : isChildActive)

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                item.name
                                                                            }
                                                                            className={clsx(
                                                                                hasChildren &&
                                                                                    'space-y-1',
                                                                            )}
                                                                        >
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
                                                                                        hasChildren
                                                                                    ) {
                                                                                        event.preventDefault()
                                                                                        setMobileExpanded(
                                                                                            (
                                                                                                prev,
                                                                                            ) => {
                                                                                                if (
                                                                                                    prev[
                                                                                                        itemKey
                                                                                                    ]
                                                                                                ) {
                                                                                                    return {}
                                                                                                }
                                                                                                return {
                                                                                                    [itemKey]: true,
                                                                                                }
                                                                                            },
                                                                                        )
                                                                                        if (
                                                                                            item.onClick
                                                                                        ) {
                                                                                            item.onClick(
                                                                                                event,
                                                                                            )
                                                                                        }
                                                                                        return
                                                                                    }
                                                                                    handleItemClick(
                                                                                        event,
                                                                                    )
                                                                                }}
                                                                                data-wizard={
                                                                                    item.wizardId
                                                                                }
                                                                                aria-haspopup={
                                                                                    hasChildren
                                                                                        ? 'menu'
                                                                                        : undefined
                                                                                }
                                                                                aria-expanded={
                                                                                    hasChildren
                                                                                        ? isExpanded
                                                                                        : undefined
                                                                                }
                                                                                className={clsx(
                                                                                    isActive
                                                                                        ? 'bg-cyan-800 text-white'
                                                                                        : 'text-cyan-100 hover:bg-cyan-600 hover:text-white',
                                                                                    item.disabled &&
                                                                                        'pointer-events-none opacity-40 hover:bg-transparent',
                                                                                    'group flex items-center rounded-md px-2 py-2 text-base font-medium',
                                                                                )}
                                                                                aria-disabled={
                                                                                    item.disabled
                                                                                        ? true
                                                                                        : undefined
                                                                                }
                                                                                tabIndex={
                                                                                    item.disabled
                                                                                        ? -1
                                                                                        : undefined
                                                                                }
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
                                                                            {hasChildren &&
                                                                                isExpanded && (
                                                                                    <div className="space-y-1 pl-5">
                                                                                        <div className="relative space-y-1 pl-3">
                                                                                            <span className="absolute bottom-4 left-0 top-0 -mt-1 w-2 rounded-b-lg border-l border-cyan-200/20" />
                                                                                            {item.children.map(
                                                                                                (
                                                                                                    child,
                                                                                                ) => {
                                                                                                    const isChildSelected =
                                                                                                        child.isActive ??
                                                                                                        child.name ===
                                                                                                            page
                                                                                                    return (
                                                                                                        <div
                                                                                                            key={
                                                                                                                child.name
                                                                                                            }
                                                                                                            className="relative"
                                                                                                        >
                                                                                                            <span className="absolute -left-3 top-1/2 -mt-0.5 h-2 w-3 -translate-y-1/2 rounded-bl-lg border-b border-cyan-200/20" />
                                                                                                            <Link
                                                                                                                href={
                                                                                                                    child.href ||
                                                                                                                    '/app'
                                                                                                                }
                                                                                                                shallow={
                                                                                                                    child.shallow
                                                                                                                }
                                                                                                                onClick={(
                                                                                                                    event,
                                                                                                                ) => {
                                                                                                                    if (
                                                                                                                        child.onClick
                                                                                                                    ) {
                                                                                                                        child.onClick(
                                                                                                                            event,
                                                                                                                        )
                                                                                                                    }
                                                                                                                }}
                                                                                                                className={clsx(
                                                                                                                    isChildSelected
                                                                                                                        ? 'text-white'
                                                                                                                        : 'text-cyan-100/60 hover:text-cyan-100/80',
                                                                                                                    'block rounded-md px-3 py-1 text-sm font-medium transition',
                                                                                                                )}
                                                                                                            >
                                                                                                                {
                                                                                                                    child.name
                                                                                                                }
                                                                                                            </Link>
                                                                                                        </div>
                                                                                                    )
                                                                                                },
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                        </div>
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
                        <div className="w-10 flex-shrink-0" aria-hidden="true">
                            {/* Dummy element to force sidebar to shrink to fit close icon */}
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <ClientSidebarDesktop
                page={page}
                sections={sections}
                collapsedSections={collapsedSections}
                onToggleSection={toggleSection}
            />
        </>
    )
}

export default Sidebar
