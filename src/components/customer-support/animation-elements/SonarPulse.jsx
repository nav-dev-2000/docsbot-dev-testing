import { motion } from "framer-motion"
import clsx from "clsx"

export const SonarPulse = ({
    duration = 2.5,
    sizeClass = 'size-32',
    ringColor = [
        'border-cyan-400/40',
        'border-cyan-400/30',
        'border-cyan-400/20',
    ],
    ringShadow = 'bg-cyan-500/10',
    className,
    children,
}) => {
    const ringCommon = {
        initial: {
            opacity: 0,
            scale: 0.4
        },
        animate: {
            opacity: [0, 0.7, 0],
            scale: [0.4, 1, 1.15],
        },
        transition: {
            duration,
            repeat: Infinity,
            ease: "easeOut",
        },
    };

    return (
        <div
            className={clsx(
                'relative inline-flex items-center justify-center',
                sizeClass,
                className,
            )}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                <div className={clsx(
                    'absolute inset-4 rounded-full blur-xl',
                    ringShadow,
                )}
                />

                <motion.span
                    className={clsx(
                        'absolute inset-2 rounded-full border',
                        ringColor[0],
                    )}
                    {...ringCommon}
                />

                <motion.span
                    className={clsx(
                        'absolute inset-4 rounded-full border',
                        ringColor[1],
                    )}
                    {...ringCommon}
                    transition={{ ...ringCommon.transition, delay: duration / 3 }}
                />

                <motion.span
                    className={clsx(
                        'absolute inset-6 rounded-full border',
                        ringColor[2],
                    )}
                    {...ringCommon}
                    transition={{ ...ringCommon.transition, delay: (2 * duration) / 3 }}
                />
            </div>

            <div className="relative z-10 flex items-center justify-center">
                {children}
            </div>
        </div>
    )
}
