import clsx from 'clsx'

const Header = ({ title, action, className, ...props }) => {
    return (
        <div
            className={clsx(
                'flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-6 py-6',
                className,
            )}
            {...props}
        >
            {title && (
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                    {title}
                </h3>
            )}

            {action}
        </div>
    )
}

const Body = ({ className, children, ...props }) => {
    return (
        <div
            className={clsx(
                'min-h-0 flex-1 overflow-y-auto',
                className,
            )}
            {...props}
        >
                {children}
        </div>
    )
}

const WorkspaceSidebar = ({
    title,
    action,
    className,
    headerClassName,
    bodyClassName,
    headerProps,
    bodyProps,
    children,
}) => {
    return (
        <div
            className={clsx(
                'w-full max-w-[420px]',
                'flex flex-col rounded-lg bg-white shadow',
                className,
            )}
        >
            {(title || action) && (
                <Header
                    title={title}
                    action={action}
                    className={headerClassName}
                    {...headerProps}
                />
            )}

            <Body
                className={bodyClassName}
                {...bodyProps}
            >
                {children}
            </Body>
        </div>
    )
}

export default WorkspaceSidebar
