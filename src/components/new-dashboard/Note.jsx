import clsx from "clsx"

const Note = ({ size = 'sm', color = 'yellow', className, children }) => {
    let cssSize, cssColor, cssFontSize

    switch (size) {
        case 'sm':
            cssSize = 'py-2 pl-3 pr-4'
            cssFontSize = 'text-xs'
            break

        case 'lg':
            cssSize = 'py-5 pl-4 pr-5'
            cssFontSize = 'text-md'
            break

        default:
            cssSize = 'py-4 pl-4 pr-5'
            cssFontSize = 'text-sm'
            break
    }

    switch (color) {
        case 'yellow':
            cssColor = 'border-yellow-400'
            break

        case 'red':
            cssColor = 'border-red-400'
            break

        default:
            cssColor = 'border-cyan-600'
            break
    }

    return (
        <div
            className={clsx(
                cssSize,
                cssFontSize,
                cssColor,
                'border-l-4 bg-gray-200/50 leading-none text-gray-800',
                className,
            )}
        >
            {children}
        </div>
    )
}

export default Note
