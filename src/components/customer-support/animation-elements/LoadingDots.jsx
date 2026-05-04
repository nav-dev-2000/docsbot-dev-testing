import { useEffect } from 'react';
import clsx from 'clsx'
import { motion } from 'framer-motion'

export const LoadingDots = ({ timeout = 1200, onComplete, className }) => {
    useEffect(() => {
        if (!onComplete) return;

        const timer = setTimeout(() => {
            onComplete();
        }, timeout);

        return () => clearTimeout(timer);
    }, [onComplete, timeout]);

    return (
        <div className={clsx('flex h-full items-center gap-1 text-gray-900', className)}>
            {[0, 1, 2].map((index) => (
                <motion.span
                    key={index}
                    className="block size-2 rounded-full bg-current"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0.65 }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: index * 0.2,
                    }}
                />
            ))}
        </div>
    )
}
