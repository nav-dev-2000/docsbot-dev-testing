import { useState, useContext } from 'react'
import clsx from 'clsx'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { WidgetContext } from './Widget'

const Logo = ({ src, title, isActive = false, ...props }) => {
    return (
        <div className="flex items-center" {...props}>
            <img
                src={src}
                alt={`${title} Logo`}
                className={clsx(
                    'w-auto max-w-[50%] h-auto',
                    {
                        ['max-h-6']: isActive,
                        ['max-h-9']: !isActive,
                    }
                )}
            />
        </div>
    )
}

const Title = ({ content, isActive = false }) => {
    return (
        <div
            className={clsx(
                'font-semibold transition',
                {
                    ['text-sm/4']: isActive,
                    ['text-lg/5']: !isActive,
                }
            )}
        >
            {content}
        </div>
    )
}

const Description = ({ content, isActive = false }) => {
    return (
        <div
            className={clsx(
                'mt-1.5 text-xs/5',
                {
                    ['hidden']: isActive,
                }
            )}
        >
            {content}
        </div>
    )
}

const Refresh = ({ isActive = false, onMouseDown, onMouseLeave, ...props }) => {
    const [isRotate, setIsRotate] = useState(false)

    const mainClass = clsx(
        'size-7 absolute z-10 top-1/2 right-0 -translate-y-1/2 flex items-center justify-center border-2 border-transparent rounded-lg transition',
        'hover:border-[var(--mybot-text)]',
        {
            ['invisible pointer-events-none opacity-0']: !isActive,
        }
    )

    return (
        <button
            className={mainClass}
            aria-hidden={!isActive}
            disabled={!isActive}
            onMouseDown={() => {
                setIsRotate(true)
                onMouseDown?.()
            }}
            onMouseLeave={() => {
                setIsRotate(false)
                onMouseLeave?.()
            }}
            { ...props }
        >
            <ArrowPathIcon
                className={clsx(
                    'size-4 transition-transform',
                    {
                        ['rotate-45']: isRotate,
                    }
                )}
            />
            <span className="sr-only">Refresh Conversation</span>
        </button>
    )
}

const WidgetHeader = ({
    title,
    subtitle,
    logo,
    alignment = 'center',
    className,
    onClick,
    ...props
}) => {
    const { size } = useContext(WidgetContext)
    const isActive = size === 'sm'
    
    const alignContent = alignment === 'left' ? 'flex-start' : 'center'
    const alignText = alignment === 'left' ? 'left' : 'center'

    return (
        <div
            className={clsx(
                'flex-none bg-[var(--mybot-color)] text-[var(--mybot-text)] transition',
                {
                    ['py-4 px-3']: isActive,
                    ['py-8 px-6']: !isActive,
                },
                className,
            )}
            {...props}
        >
            <div className="relative w-full">
                <Refresh isActive={isActive} onClick={onClick} />

                <div style={{ textAlign: alignText }}>
                    {logo && (
                        <Logo src={logo} title={title} style={{ justifyContent: alignContent }} />
                    )}

                    {!logo && (
                        <>
                            <Title content={title} isActive={isActive} />

                            {subtitle && (
                                <Description content={subtitle} isActive={isActive} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WidgetHeader
