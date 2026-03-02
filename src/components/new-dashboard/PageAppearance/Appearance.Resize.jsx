import React, { useMemo, useState, useEffect, useRef } from 'react'
import useMeasure from 'react-use-measure'
import clsx from 'clsx'

const ResizeIndicator = ({ width, size }) => {
    return (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-gray-800 px-3 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            {Math.round(width)}px — {size.toUpperCase()}
        </div>
    )
}

const ResizeHandle = ({ isResizing, onMouseDown, onDoubleClick }) => {
    return (
        <div
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            className={clsx(
                'absolute -right-1 top-1/2 hidden h-12 w-1.5 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-gray-300 transition-all hover:bg-gray-400 group-hover:block md:flex',
                { 'w-2 bg-blue-500 ring-4 ring-blue-100': isResizing },
            )}
        >
            <div className="flex flex-col gap-1">
                <div className="h-1 w-0.5 rounded-full bg-white/50" />
                <div className="h-1 w-0.5 rounded-full bg-white/50" />
                <div className="h-1 w-0.5 rounded-full bg-white/50" />
            </div>
        </div>
    )
}

const AppearanceResize = ({
    helperText = 'Drag the handle on the right to test responsiveness',
    children,
    ...props
}) => {
    const [ref, { width }] = useMeasure()
    const [parentRef, { width: parentWidth }] = useMeasure()
    const [containerWidth, setContainerWidth] = useState(440)
    const [isResizing, setIsResizing] = useState(false)

    const startX = useRef(0)
    const startWidth = useRef(0)

    // Determine size based on measured width
    const size = useMemo(() => {
        if (width < 450) return 'sm'
        if (width < 640) return 'md'
        return 'lg'
    }, [width])

    const startResizing = (e) => {
        e.preventDefault()
        setIsResizing(true)
        startX.current = e.clientX
        startWidth.current = width
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', stopResizing)
    }

    const stopResizing = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', stopResizing)
    }

    const handleMouseMove = (e) => {
        const deltaX = e.clientX - startX.current
        // Since it's centered, we multiply by 2 to expand/shrink from both sides
        const newWidth = startWidth.current + deltaX * 2

        // Constraints: minimum 320px, maximum 720px
        setContainerWidth(Math.max(320, Math.min(newWidth, 720)))
    }

    const handleDoubleClick = () => {
        setContainerWidth(440)
    }

    return (
        <div
            ref={parentRef}
            className="group relative flex h-full w-full flex-col items-center justify-center p-4"
        >
            <div
                ref={ref}
                className="relative h-full w-full max-w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-2 transition-colors group-hover:border-gray-300 md:p-3"
                style={{
                    maxWidth:
                        typeof window !== 'undefined' &&
                        window.innerWidth >= 768
                            ? `${containerWidth}px`
                            : '100%',
                }}
            >
                <ResizeIndicator width={width} size={size} />

                {typeof children === 'function'
                    ? children({ size, width })
                    : React.Children.map(children, (child) =>
                          React.isValidElement(child)
                              ? React.cloneElement(child, {
                                    size,
                                    width,
                                    containerWidth: width,
                                    ...props,
                                })
                              : child,
                      )}

                <ResizeHandle
                    isResizing={isResizing}
                    onMouseDown={startResizing}
                    onDoubleClick={handleDoubleClick}
                />
            </div>

            {helperText && (
                <p className="mt-4 hidden text-xs text-gray-400 md:block">
                    {helperText}
                </p>
            )}
        </div>
    )
}

export default AppearanceResize
