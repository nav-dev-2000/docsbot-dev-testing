import clsx from "clsx"

export const TabPanel = ({ id, isActive, children, ...props }) => {
    return (
        <div
            role="tabpanel"
            tabIndex={0}
            className={clsx(
                'mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2',
                {
                    ['hidden']: !isActive,
                },
            )}
            aria-labelledby={id}
            {...(!isActive && { hidden: true })}
            {...props}
        >
            {children}
        </div>
    )
}
