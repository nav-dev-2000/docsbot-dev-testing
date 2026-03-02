import { useContext } from 'react'
import clsx from 'clsx'
import { WidgetContext } from './Widget'

const WidgetBody = ({ children, className, ...props }) => {
    const { size } = useContext(WidgetContext)
    const isSmall = size === 'sm'

    return (
        <div
            className={clsx(
                'flex-1 overflow-y-scroll relative pb-8',
                isSmall ? 'p-4' : 'p-6',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export default WidgetBody
