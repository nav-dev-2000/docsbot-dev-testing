import clsx from 'clsx'

import { Switch } from '@headlessui/react'
import IconButton from '@new-dashboard/Button.jsx'
import { CheckIcon, ClipboardIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Fragment, useState, useId } from 'react'

const AppearanceToggle = ({
    label,
    description,
    enabled,
    setEnabled,
    disabled,
    isNew,
    planLabel,
    className,
}) => {
    return (
        <Switch.Group
            as="div"
            className={clsx(
                'w-full rounded-lg bg-gray-100 px-4 pb-3 pt-2',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                {label && (
                    <Switch.Label
                        as="span"
                        className="flex-1 text-sm font-medium text-gray-800"
                        passive
                    >
                        {label}
                        {planLabel ? (
                            <span className="ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                {planLabel}
                            </span>
                        ) : isNew ? (
                            <span className="bg-animate ml-2 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                New!
                            </span>
                        ) : null}
                    </Switch.Label>
                )}

                <Switch
                    checked={enabled}
                    onChange={setEnabled}
                    disabled={disabled}
                    className={clsx(
                        'cursor-pointer',
                        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full',
                        'transition-colors duration-200 ease-in-out',
                        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                        {
                            ['bg-cyan-500']: enabled,
                            ['bg-gray-300']: !enabled,
                        },
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={clsx(
                            'pointer-events-none transition duration-200 ease-in-out',
                            'block size-4 rounded-full bg-white shadow',
                            'absolute top-1/2 -translate-y-1/2 transform',
                            {
                                ['right-0.5']: enabled,
                                ['left-0.5']: !enabled,
                            },
                        )}
                    />
                </Switch>
            </div>

            {description && (
                <Switch.Description
                    as="span"
                    className="mt-2 block text-xs text-gray-500"
                >
                    {description}
                </Switch.Description>
            )}
        </Switch.Group>
    )
}

const AppearanceBlock = ({
    title,
    titleTag,
    titleProps,
    description,
    planLabel,
    isNew = false,
    isLast = false,
    className,
    children,
}) => {
    const TitleTag = titleTag ? titleTag : 'div'
    const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(titleTag)

    return (
        <div
            className={clsx(
                {
                    ['mb-5 border-b border-gray-200 pb-5']: isLast === false,
                },
                className,
            )}
        >
            {(title || description) && (
                <div className="mb-4">
                    {title && (
                        <TitleTag
                            {...titleProps}
                            className={clsx(
                                'font-bold text-gray-800',
                                {
                                    'text-base': isHeading,
                                    'text-sm/6': !isHeading,
                                },
                                titleProps?.className,
                            )}
                        >
                            {title}

                            {planLabel ? (
                                <span className="relative -top-0.5 ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                    {planLabel}
                                </span>
                            ) : isNew ? (
                                <span className="bg-animate relative -top-0.5 ml-2 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    New!
                                </span>
                            ) : null}
                        </TitleTag>
                    )}

                    {description && (
                        <span className="mt-0.5 block text-xs text-gray-500">
                            {description}
                        </span>
                    )}
                </div>
            )}
            {children}
        </div>
    )
}

const AppearanceAccordion = ({
    title,
    titleTag,
    titleProps,
    description,
    planLabel,
    isNew = false,
    isLast = false,
    defaultOpen = false,
    open,
    onOpenChange,
    className,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const isControlled = typeof open === 'boolean'
    const currentOpen = isControlled ? open : isOpen

    const handleOpenChange = (nextOpen) => {
        if (!isControlled) {
            setIsOpen(nextOpen)
        }
        onOpenChange?.(nextOpen)
    }
    const contentId = useId()
    const TitleTag = titleTag ? titleTag : 'div'

    return (
        <div
            className={clsx(
                'w-full rounded-lg bg-gray-100 px-4 py-3',
                {
                    ['mb-5']: isLast === false,
                },
                className,
            )}
        >
            <button
                type="button"
                onClick={() => handleOpenChange(!currentOpen)}
                aria-expanded={currentOpen}
                aria-controls={contentId}
                className={clsx(
                    'group flex w-full items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-opacity-75 focus-visible:rounded-md',
                    currentOpen && 'mb-4',
                )}
            >
                <div>
                    {title && (
                        <TitleTag
                            {...titleProps}
                            className={clsx(
                                'font-medium text-gray-800 text-sm/6 transition-colors group-hover:text-cyan-600',
                                titleProps?.className,
                            )}
                        >
                            {title}

                            {planLabel ? (
                                <span className="relative -top-0.5 ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                    {planLabel}
                                </span>
                            ) : isNew ? (
                                <span className="bg-animate relative -top-0.5 ml-2 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    New!
                                </span>
                            ) : null}
                        </TitleTag>
                    )}

                    {description && (
                        <span className="mt-0.5 block text-xs text-gray-500">
                            {description}
                        </span>
                    )}
                </div>

                <div className="ml-4 shrink-0">
                    <ChevronDownIcon
                        className={clsx(
                            'size-5 text-gray-400 transition-transform duration-200 group-hover:text-cyan-600',
                            {
                                'rotate-180': currentOpen,
                            }
                        )}
                        aria-hidden="true"
                    />
                </div>
            </button>
            <div
                id={contentId}
                className={clsx({ hidden: !currentOpen })}
            >
                {children}
            </div>
        </div>
    )
}

const AppearanceInput = ({ id, isMultiLine = false, className, ...props }) => {
    const Component = isMultiLine ? 'textarea' : 'input'

    return (
        <Component
            id={id}
            className={clsx(
                'block w-full overflow-hidden rounded-md border-gray-300 px-4 py-2 text-sm text-gray-800 transition',
                'hover:border-cyan-500',
                'focus:border-cyan-500 focus:shadow-md focus:shadow-cyan-500/20 focus:ring-0',
                'read-only:bg-gray-100',
                'disabled:pointer-events-none disabled:opacity-50',
                {
                    'min-h-[88px]': isMultiLine,
                },
                className,
            )}
            {...props}
        />
    )
}

const AppearanceSelect = ({ data, className, ...props }) => {
    return (
        <select
            className={clsx(
                'cursor-pointer',
                'w-full block',
                'border border-gray-300 rounded-lg bg-white text-gray-800 text-sm/6 font-medium transition',
                'hover:border-cyan-500',
                'focus:border-cyan-500 focus:shadow-md focus:shadow-cyan-500/20 focus:ring-0',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            )}
            {...props}
        >
            {data.map((option, index) => {
                const isObject = typeof option === 'object' && option !== null;
                const value = isObject ? option.id || option.value : option;
                const label = isObject ? option.label || option.name : option;

                return (
                    <option key={`${value}-${index}`} value={value}>
                        {label}
                    </option>
                )
            })}
        </select>
    )
}

const AppearanceCode = ({
    buttonProps,
    isCopied = false,
    className,
    children,
}) => {
    const Component = buttonProps?.onClick ? 'div' : Fragment

    const componentProps = buttonProps?.onClick
        ? {
              className: clsx('relative', className),
          }
        : {}

    return (
        <Component {...componentProps}>
            <pre
                className={clsx(
                    'block min-h-[60px] w-full overflow-scroll rounded-md bg-gray-700 px-4 py-2',
                    'whitespace-prewrap font-mono text-sm text-white',
                )}
                disabled
            >
                {children}
            </pre>

            {buttonProps?.onClick && (
                <IconButton
                    label={
                        isCopied ? 'Copied!' : buttonProps?.label || 'Copy Code'
                    }
                    icon={isCopied ? CheckIcon : ClipboardIcon}
                    className={clsx(
                        'absolute right-2 top-2',
                        'bg-white/60 backdrop-blur-md border-white/30',
                        'hover:bg-white/80',
                        buttonProps?.className,
                    )}
                    {...buttonProps}
                />
            )}
        </Component>
    )
}

export { AppearanceToggle, AppearanceBlock, AppearanceAccordion, AppearanceInput, AppearanceSelect, AppearanceCode }
