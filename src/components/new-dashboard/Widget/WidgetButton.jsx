import clsx from 'clsx'

const WidgetButton = ({
    label,
    onClick,
    disabled = false,
    type = 'button',
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                'rounded-md border border-[var(--mybot-color)] bg-white p-2 text-sm text-slate-800 shadow-md shadow-[var(--mybot-shadow)]',
                'transition-transform hover:scale-105 hover:shadow-lg hover:shadow-[var(--mybot-shadow)]',
                'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
            )}
        >
            {label}
        </button>
    )
}

export default WidgetButton
