import clsx from "clsx"

const Paragraph = ({ tagName = 'p', className, children }) => {
    const Component = tagName

    return (
        <Component
            className={clsx(
                'text-sm/6 text-gray-800',
                className,
            )}
        >
            {children}
        </Component>
    )
}

export default Paragraph
