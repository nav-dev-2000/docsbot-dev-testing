export default function RadioField({
    id,
    name,
    value,
    checked,
    onChange,
    disabled,
    label,
    description,
    layout = 'stacked',
    ariaDescribedBy,
    descriptionId,
    wrapperClassName = '',
    contentClassName = '',
    inputClassName = 'h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500',
    labelClassName = 'font-medium text-gray-900',
    descriptionClassName = 'text-gray-500',
    inputProps = {},
}) {
    const contentClasses = [
        'pl-7 text-sm',
        layout === 'inline' ? 'flex flex-wrap items-center gap-2' : '',
        contentClassName,
    ]
        .filter(Boolean)
        .join(' ')
    const resolvedDescriptionId = descriptionId || ariaDescribedBy
    const describedBy = ariaDescribedBy || descriptionId

    return (
        <div
            className={['relative flex items-start', wrapperClassName]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="absolute flex h-5 items-center">
                <input
                    id={id}
                    name={name}
                    value={value}
                    type="radio"
                    className={inputClassName}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    aria-describedby={describedBy}
                    {...inputProps}
                />
            </div>
            <div className={contentClasses}>
                <label htmlFor={id} className={labelClassName}>
                    {label}
                </label>
                {description && (
                    <p
                        id={resolvedDescriptionId}
                        className={descriptionClassName}
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>
    )
}
