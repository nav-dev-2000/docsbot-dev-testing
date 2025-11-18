'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import clsx from 'clsx'

const getOffset = (dir, distance = 24) => {
    switch (dir) {
        case 'up': return { y: distance }
        case 'down': return { y: -distance }
        case 'left': return { x: distance }
        case 'right': return { x: -distance }
    }
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

    const variants = prefersReducedMotion
        ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
        : {
            hidden: { opacity: 0, ...offset },
            show: { opacity: 1, x: 0, y: 0, transition: { duration, delay } },
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
