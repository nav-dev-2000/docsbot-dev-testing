import clsx from "clsx"

export const Content = ({
    tag = 'p',
    children,
    className,
}) => {
    const DynamicTag = tag

    return (
        <DynamicTag
            className={clsx(
                'text-lg/8 text-gray-600',
                className,
            )}
        >
            {children}
        </DynamicTag>
    )
}
