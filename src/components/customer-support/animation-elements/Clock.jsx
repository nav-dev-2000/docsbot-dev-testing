import { ClockIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

import { motion } from "framer-motion"

const Reel = ({ digit, delay = 0, animateDigits = true, onComplete }) => {
    const loops = animateDigits ? 3 : 0 // Number of full loops 0-9 before settling
    const numbers = []

    // Add loops
    for (let i = 0; i < loops; i++) {
        for (let j = 0; j <= 9; j++) {
            numbers.push(j)
        }
    }

    // Add final sequence up to the target digit
    for (let i = 0; i <= digit; i++) {
        numbers.push(i)
    }

    const finalIndex = numbers.length - 1

    return (
        <div className="relative h-[1.5em] w-[0.6em] overflow-hidden inline-block align-bottom">
            <motion.div
                initial={{ y: 0 }}
                animate={{ y: `-${finalIndex * 1.5}em` }}
                transition={{
                    duration: animateDigits ? 2.5 : 0,
                    ease: [0.2, 0.65, 0.3, 0.9],
                    delay: delay,
                }}
                className="absolute left-0 top-0 w-full flex flex-col items-center"
                onAnimationComplete={onComplete}
            >
                {numbers.map((num, i) => (
                    <div key={i} className="h-[1.5em] flex items-center justify-center">
                        {num}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

export const Clock = ({ time = "00:00", className, clockClassName, iconClassName, bgColor = 'bg-gray-900', textColor = 'text-white', animateDigits = true, onComplete, showClockContent = true, children, ...props }) => {
    const lastDigitIndex = time.split("").findLastIndex(char => /\d/.test(char))

    return (
        <motion.div
            className={clsx(
                'flex flex-none items-center justify-center gap-4 px-8 py-2 rounded-full text-xl/6',
                bgColor,
                textColor,
                className,
            )}
            {...props}
        >
            <motion.div
                className="flex items-center gap-4"
                animate={{ opacity: showClockContent ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <ClockIcon
                    className={clsx(
                        'size-6 -ml-1',
                        iconClassName,
                    )}
                />

                <div className="flex items-center">
                    {time.split("").map((char, index) => {
                        if (/\d/.test(char)) {
                            return (
                                <Reel
                                    key={index}
                                    digit={parseInt(char, 10)}
                                    delay={index * 0.1}
                                    animateDigits={animateDigits}
                                    onComplete={index === lastDigitIndex ? onComplete : undefined}
                                />
                            )
                        }

                        return (
                            <span key={index} className="h-[1.5em] flex items-center">
                                {char}
                            </span>
                        )
                    })}
                </div>
            </motion.div>

            {children}
        </motion.div>
    )
}
