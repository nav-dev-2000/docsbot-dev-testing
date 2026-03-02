import { createContext, useContext } from 'react'
import clsx from 'clsx'

export const WidgetContext = createContext({ size: 'lg', containerWidth: 0 })

const Widget = ({ children, className, size = 'lg', containerWidth = 0, ...props }) => {
    return (
        <WidgetContext.Provider value={{ size, containerWidth }}>
            <div
                className={clsx(
                    'min-h-0 overflow-hidden flex flex-col rounded-xl bg-white shadow-xl',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </WidgetContext.Provider>
    )
}

export default Widget
