import clsx from "clsx"

export const TabItem = ({ id, label, isActive, ...props }) => {
    return (
        <button
            role="tab"
            id={id}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={clsx(
                'px-4 py-2 rounded-full border transition-all duration-200',
                {
                    ['pointer-events-none border-cyan-600 bg-cyan-600 shadow-lg text-white']: isActive,
                    ['border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 shadow-sm text-gray-700']: !isActive,
                }
            )}
            { ...props }
        >
            {label}
        </button>
    )
}
