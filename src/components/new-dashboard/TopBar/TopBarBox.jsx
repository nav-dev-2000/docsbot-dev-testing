import clsx from 'clsx'

const TopBarBox = ({ hasBorder = false, className, children, ...props }) => {
    return (
        <div
            className={clsx(
                'flex h-14 flex-none items-center bg-white print:!hidden text-nowrap',
                {
                    ['border-b border-gray-200']: hasBorder,
                    ['shadow']: !hasBorder,
                },
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export default TopBarBox
