import clsx from 'clsx'

const SegmentedContainer = ({ className, children, ...props }) => {
    return (
        <div
            className={clsx(
                'inline-flex items-center rounded-md bg-gray-300 p-0.5',
                className,
            )}
            role="group"
            {...props}
        >
            {children}
        </div>
    )
}

export default SegmentedContainer
