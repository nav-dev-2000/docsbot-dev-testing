import { useEffect } from 'react';
import { motion } from 'framer-motion'

export const LoadingDots = ({ timeout = 1200, onComplete }) => {
    useEffect(() => {
        if (!onComplete) return;

        const timer = setTimeout(() => {
            onComplete();
        }, timeout);

        return () => clearTimeout(timer);
    }, [onComplete, timeout]);

    return (
        <div className="flex items-center gap-1 h-full">
            {[0, 1, 2].map((index) => (
                <motion.span
                    key={index}
                    className="size-2 block rounded-full bg-gray-900"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0.4 }}
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
