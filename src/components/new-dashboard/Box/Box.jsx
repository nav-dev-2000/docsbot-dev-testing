import { useEffect, useId, useState } from 'react'

import clsx from 'clsx'

import BoxContainer from './Box.Container'
import BoxHeader from './Box.Header'
import BoxBody from './Box.Body'

const toggleMaxWidths = {
    sm: 640,
    md: 768,
    lg: 1024,
}

const Box = ({
    icon,
    title,
    tag,
    description,
    className,
    headerClassName,
    bodyClassName,
    children,
    canToggle = 'none',
    id,
    scrollId,
    titleHref,
}) => {
    const reactId = useId()
    const baseId = id || `box-${reactId}`
    const headerId = `${baseId}-header`
    const contentId = `${baseId}-content`
    const [isToggleEnabled, setIsToggleEnabled] = useState(canToggle === 'all')
    const [isOpen, setIsOpen] = useState(true)

    const DescWrapper = 'string' === typeof description ? 'p' : 'div'
    const descContent = (
        <DescWrapper className="space-y-2 text-sm/6 text-gray-800">
            {description}
        </DescWrapper>
    )

    useEffect(() => {
        if (canToggle === 'none') {
            setIsToggleEnabled(false)
            return
        }

        if (canToggle === 'all') {
            setIsToggleEnabled(true)
            return
        }

        if (typeof window === 'undefined') {
            return
        }

        const maxWidth = toggleMaxWidths[canToggle]

        if (!maxWidth) {
            setIsToggleEnabled(false)
            return
        }

        const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`)
        const updateToggleState = () => {
            setIsToggleEnabled(mediaQuery.matches)
        }

        updateToggleState()

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateToggleState)
            return () =>
                mediaQuery.removeEventListener('change', updateToggleState)
        }

        mediaQuery.addListener(updateToggleState)
        return () => mediaQuery.removeListener(updateToggleState)
    }, [canToggle])

    useEffect(() => {
        if (isToggleEnabled) {
            setIsOpen(true)
        }
    }, [isToggleEnabled])

    return (
        <BoxContainer
            canToggle={isToggleEnabled}
            className={className}
            id={scrollId}
        >
            <BoxHeader
                icon={icon}
                title={title}
                titleHref={titleHref}
                tag={tag}
                className={headerClassName}
                canToggle={isToggleEnabled}
                isOpen={isOpen}
                onToggle={() => setIsOpen((open) => !open)}
                buttonId={headerId}
                controlsId={contentId}
            />

            {isToggleEnabled ? (
                <BoxBody
                    className={clsx(
                        'flex-1 pt-4 pb-6 px-6 border border-t-0 border-gray-200 rounded-b-lg bg-white',
                        {
                            ['hidden']: !isOpen,
                        },
                        bodyClassName,
                    )}
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                >
                    {description && descContent}
                    {children}
                </BoxBody>
            ) : (
                <BoxBody className={bodyClassName}>
                    {description && descContent}
                    {children}
                </BoxBody>
            )}
        </BoxContainer>
    )
}

export default Box
