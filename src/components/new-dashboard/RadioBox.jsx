import clsx from 'clsx'

import Link from 'next/link'
import Chip from '@new-dashboard/Chip'
import Note from '@new-dashboard/Note'

import { CheckCircleIcon } from '@heroicons/react/24/outline'

const STATUS_TAGS = {
    recommended: {
        key: 'recommended',
        content: 'Recommended',
        className: 'border-cyan-600 bg-cyan-600 text-white',
    },
    notRecommended: {
        key: 'notRecommended',
        content: 'Not Recommended',
        className: 'border-slate-200 bg-slate-200 text-slate-800',
    },
}

const CAPABILITY_TAGS = [
    {
        key: 'powerful',
        content: 'Most Powerful',
        className: 'border-purple-400 bg-purple-50 text-purple-700',
    },
    {
        key: 'generalPurpose',
        content: 'General-Purpose',
        className: 'border-blue-400 bg-blue-50 text-blue-700',
    },
    {
        key: 'adaptive',
        content: 'Adaptive Flagship',
        className: 'border-indigo-400 bg-indigo-50 text-indigo-700',
    },
    {
        key: 'best',
        content: 'Best Value',
        className: 'border-emerald-400 bg-emerald-50 text-emerald-700',
    },
    {
        key: 'fast',
        content: 'Fast',
        className: 'border-amber-400 bg-amber-50 text-amber-700',
    },
    {
        key: 'costEffective',
        content: 'Cost Effective',
        className: 'border-teal-400 bg-teal-50 text-teal-700',
    },
]

const LIFECYCLE_TAGS = [
    {
        key: 'legacy',
        content: 'Legacy',
        className: 'border-stone-400 bg-stone-50 text-stone-700',
    },
]

const RadioBox = ({
    id,
    name,
    value,
    checked,
    onChange,
    disabled,
    title,
    description,
    expirationDate,
    isSelected = false,
    status = null,
    capabilities = {},
    lifecycle = {},
    hasVerification = false,
}) => {
    const isChecked = checked !== undefined ? checked : isSelected
    const statusTag = status ? STATUS_TAGS[status] : null
    const capabilityTags = CAPABILITY_TAGS.filter(
        (tag) => capabilities[tag.key],
    )
    const lifecycleTags = LIFECYCLE_TAGS.filter((tag) => lifecycle[tag.key])
    const tags = [statusTag, ...capabilityTags, ...lifecycleTags].filter(
        Boolean,
    )
    const hasTags = tags.length > 0

    return (
        <div
            className={clsx(
                'relative flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4',
                'transition hover:border-cyan-600',
                {
                    ['border-gray-200']: !isChecked,
                    ['ring-2 ring-cyan-600 border-cyan-600']: isChecked,
                    ['cursor-not-allowed pointer-events-none opacity-60']: disabled,
                },
            )}
        >
            <label
                htmlFor={id}
                className={clsx(
                    'flex grow flex-col gap-2',
                    !disabled && 'cursor-pointer',
                )}
            >
                <input
                    type="radio"
                    id={id}
                    name={name}
                    value={value}
                    checked={isChecked}
                    onChange={onChange}
                    disabled={disabled}
                    className="peer sr-only"
                    aria-describedby={
                        description && id ? `${id}-description` : undefined
                    }
                />

                <div
                    className={clsx(
                        'absolute right-4 top-4',
                        'flex size-6 items-center justify-center rounded-full',
                        isChecked ? 'bg-cyan-600' : 'bg-white',
                    )}
                >
                    <CheckCircleIcon
                        className={clsx(
                            'size-6',
                            isChecked ? 'text-white' : 'text-gray-500',
                        )}
                    />
                </div>

                <p
                    className={clsx('pr-8 text-base font-semibold text-gray-800', {
                        ['flex max-w-full flex-wrap items-center gap-x-2 gap-y-1']:
                            hasTags,
                    })}
                >
                    {!hasTags && (title || 'Untitled')}
                    {hasTags && (
                        <>
                            <span className="flex-none">
                                {title || 'Untitled'}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag.key}
                                        content={tag.content}
                                        className={tag.className}
                                    />
                                ))}
                            </span>
                        </>
                    )}
                </p>

                {description && (
                    <p
                        id={id ? `${id}-description` : undefined}
                        className="text-sm/6 text-gray-500"
                    >
                        {description}
                    </p>
                )}
            </label>

            {expirationDate && (
                <Note className="border-red-400">
                    This model is retiring on <strong>{expirationDate}</strong>.
                </Note>
            )}

            {hasVerification && (
                <Note>
                    Requires{' '}
                    <Link
                        href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                        target="_blank"
                        className="font-semibold underline transition hover:text-cyan-800"
                    >
                        organization verification
                    </Link>
                    .
                </Note>
            )}
        </div>
    )
}

export default RadioBox
