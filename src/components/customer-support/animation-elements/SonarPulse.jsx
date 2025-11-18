import { motion } from "framer-motion"
import clsx from "clsx"

export const SonarPulse = ({
    duration = 2.5,
    sizeClass = 'size-32',
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
                <div className="absolute inset-4 rounded-full bg-cyan-500/10 blur-xl" />

                <motion.span
                    className="absolute inset-2 rounded-full border border-cyan-400/40"
                    {...ringCommon}
                />

                <motion.span
                    className="absolute inset-4 rounded-full border border-cyan-400/30"
                    {...ringCommon}
                    transition={{ ...ringCommon.transition, delay: duration / 3 }}
                />

                <motion.span
                    className="absolute inset-6 rounded-full border border-cyan-400/20"
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
