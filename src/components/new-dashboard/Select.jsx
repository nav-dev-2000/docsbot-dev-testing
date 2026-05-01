'use client'

import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import clsx from 'clsx'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'

/** Above `z-modal` (1_000_000) so options render over dashboard modals when portaled */
const LISTBOX_OPTIONS_ZINDEX_CLASS = 'z-[1000010]'

/**
 * Headless UI listbox styled as a select. Options are `{ value, label }` rows; compares options by primitive `value`.
 */
export default function Select({
    label,
    labelClassName,
    options = [],
    value,
    onChange,
    disabled = false,
    invalid = false,
    className,
    buttonClassName,
    listboxClassName,
    id,
    placeholder = 'Select…',
    'aria-label': ariaLabel,
    'aria-invalid': ariaInvalid,
}) {
    const hasMatchingOption = options.some((o) => Object.is(o.value, value))
    const normalizedValue = hasMatchingOption ? value : null
    const selectedLabel =
        options.find((o) => Object.is(o.value, value))?.label ?? placeholder
    const isDisabled = disabled || options.length === 0
    const showInvalid = Boolean(invalid || ariaInvalid)

    return (
        <div className={className}>
            {label ? (
                <Label
                    htmlFor={id}
                    className={clsx('block text-sm font-medium text-gray-900', labelClassName)}
                >
                    {label}
                </Label>
            ) : null}
            <div className={clsx(label ? 'mt-2' : undefined, 'relative')}>
                <Listbox
                    value={normalizedValue}
                    onChange={(nextValue) => {
                        onChange?.(nextValue)
                    }}
                    disabled={isDisabled}
                    className={listboxClassName}
                >
                    <ListboxButton
                        id={id}
                        aria-label={ariaLabel}
                        aria-invalid={showInvalid || undefined}
                        title={selectedLabel !== placeholder ? selectedLabel : undefined}
                        className={clsx(
                            'grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-2 pl-3 pr-2 text-left text-sm text-gray-900 outline outline-1 -outline-offset-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
                            showInvalid
                                ? 'outline-red-500 hover:outline-red-500 focus-visible:outline-red-600'
                                : 'outline-gray-300 hover:outline-cyan-500',
                            buttonClassName,
                        )}
                    >
                        <span className="col-start-1 row-start-1 truncate pr-6">{selectedLabel}</span>
                        <ChevronUpDownIcon
                            aria-hidden="true"
                            className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                        />
                    </ListboxButton>

                    <ListboxOptions
                        anchor={{ to: 'bottom start', gap: '4px', padding: '8px' }}
                        modal={false}
                        transition
                        className={clsx(
                            'mt-0 max-h-60 min-w-[var(--button-width)] w-max overflow-auto rounded-lg bg-white py-1 text-base shadow-lg outline outline-1 outline-black/5 data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm',
                            'max-w-[min(42rem,calc(100vw-1.25rem))]',
                            LISTBOX_OPTIONS_ZINDEX_CLASS,
                        )}
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={String(option.value)}
                                value={option.value}
                                className="group relative cursor-default select-none py-2 pl-8 pr-4 text-left text-gray-900 data-[focus]:bg-cyan-600 data-[focus]:text-white data-[focus]:outline-none"
                            >
                                <span className="block break-words font-normal group-data-[selected]:font-semibold">
                                    {option.label}
                                </span>

                                <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-cyan-600 group-[:not([data-selected])]:hidden group-data-[focus]:text-white">
                                    <CheckIcon aria-hidden="true" className="size-5" />
                                </span>
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Listbox>
            </div>
        </div>
    )
}
