import clsx from 'clsx'

const SegmentedButton = ({
    type = 'button',
    isActive = false,
    disabled = false,
    className,
    children,
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={disabled}
            aria-pressed={isActive}
            className={clsx(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                {
                    ['pointer-events-none bg-white text-gray-600 shadow-md']:
                        isActive,
                    ['bg-gray-300 text-gray-600']: !isActive,
                    ['cursor-not-allowed text-gray-400']: disabled,
                },
                className,
            )}
            {...props}
        >
            {children}
        </button>
    )
}

export default SegmentedButton
