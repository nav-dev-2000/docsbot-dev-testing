import clsx from "clsx"

const BoxContainer = ({ canToggle, className, id, children }) => {
    return (
        <div
            id={id}
            className={clsx(
                {
                    ['flex flex-col']: canToggle,
                    ['p-6 border border-gray-200 rounded-lg bg-white']: !canToggle,
                },
                className,
            )}
        >
            {children}
        </div>
    )
}

export default BoxContainer
