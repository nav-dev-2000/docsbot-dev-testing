import clsx from "clsx"

const Title = ({ tagName = 'h1', className, children }) => {
    const Component = tagName

    return (
        <Component
            className={clsx(
                'text-2xl/8 font-semibold text-gray-800',
                className,
            )}
        >
            {children}
        </Component>
    )
}

export default Title
