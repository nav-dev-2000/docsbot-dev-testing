import clsx from 'clsx'

const BoxBody = ({ className, children, ...props }) => {
    return (
        <div {...props} className={clsx('flex flex-col gap-6', className)}>
            {children}
        </div>
    )
}

export default BoxBody
