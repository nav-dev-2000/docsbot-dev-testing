import clsx from "clsx"

export const Subtitle = ({
    tag = 'p',
    children,
    className,
}) => {
    const DynamicTag = tag

    return (
        <DynamicTag
            className={clsx(
                'text-gray-900 text-3xl sm:text-4xl font-bold tracking-tight text-pretty',
                className,
            )}
        >
            {children}
        </DynamicTag>
    )
}
