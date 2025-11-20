'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import clsx from 'clsx'

const getOffset = (dir, distance = 24) => {
    switch (dir) {
        case 'up': return { y: distance }
        case 'down': return { y: -distance }
        case 'left': return { x: distance }
        case 'right': return { x: -distance }
    }
}

const useIsDesktop = (breakpoint = 1024) => {
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)

        const update = (event) => {
            setIsDesktop(event.matches)
        }

        // Set initial value
        setIsDesktop(mq.matches)

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', update)
        }

        return () => {
            if (typeof mq.removeEventListener === 'function') {
                mq.removeEventListener('change', update)
            }
        }
    }, [breakpoint])

    return isDesktop
}

export const SectionReveal = ({
    as: As = 'div',
    className,
    children,
    delay = 0,
    duration = 0.6,
    direction = 'up',
    once = true,
    amount = 0.2,
}) => {
    const prefersReducedMotion = useReducedMotion()
    const offset = getOffset(direction) ?? { x: 0, y: 0 }
    const isDesktop = useIsDesktop(1024)

    const variants = prefersReducedMotion || !isDesktop
        ? {
            hidden: { opacity: 1, x: 0, y: 0 },
            show: { opacity: 1, x: 0, y: 0 },
        }
        : {
            hidden: { opacity: 0, ...offset },
            show: {
                opacity: 1,
                x: 0,
                y: 0,
                transition: { duration, delay },
            },
        }

    const MotionAs = motion.create(As)

    return (
        <MotionAs
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            variants={variants}
            className={clsx('will-change-transform', className)}
        >
            {children}
        </MotionAs>
    )
}
