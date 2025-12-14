import clsx from "clsx"

export const Title = ({
    tag = 'h2',
    children,
    className,
}) => {
    const DynamicTag = tag

    return (
        <DynamicTag
            className={clsx(
                'text-cyan-600 text-md/5 font-mono font-semibold uppercase tracking-widest',
                className,
            )}
        >
            {children}
        </DynamicTag>
    )
}
