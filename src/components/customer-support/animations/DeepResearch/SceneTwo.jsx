import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { BeakerIcon } from "@heroicons/react/24/outline"
import {
    ArrowPathIcon,
    CheckCircleIcon
} from "@heroicons/react/24/outline"

const Block = ({ title, isCompleted, ...props }) => {
    return (
        <motion.div
            className={clsx(
                'relative flex flex-row gap-4 px-4 py-4 bg-white',
                'border-b',
                'last:border-b-0 overflow-hidden',
            )}
            {...props}
        >
            <BeakerIcon
                className="size-6"
            />

            <div className="flex flex-col gap-1 text-gray-600 text-base/6">
                <div className="text-gray-900 font-semibold">
                    {title}
                </div>
                <div className="text-sm">
                    {isCompleted ? "Completed" : "Researching..."}
                </div>
            </div>

            {isCompleted && (
                <CheckCircleIcon
                    className="size-4 absolute top-4 right-4 text-green-500"
                />
            )}

            {!isCompleted && (
                <ArrowPathIcon
                    className="size-4 absolute top-4 right-4 text-yellow-600 animate-spin"
                />
            )}
        </motion.div>
    )
}

export const SceneTwo = ({ data, onComplete }) => {
    return (
        <div className="w-full max-w-[540px] flex flex-col justify-center mx-auto lg:px-6">
             <AnimatePresence
                className="shadow-xl"
             >
                {data?.map((item, index) => (
                    <Block
                        key={index}
                        title={item.title}
                        isCompleted={item.isCompleted}
                        initial={index === 0 ? { opacity: 0, height: 0 } : { opacity: 0, y: 10 }}
                        animate={index === 0 ? { opacity: 1, height: "auto" } : { opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: index === 0 ? 1 : index * 0.1
                        }}
                        exit={index === 0 ? { opacity: 0, height: 0 } : { opacity: 0 }}
                        onAnimationComplete={() => {
                            if (index === 0 && onComplete) {
                                setTimeout(() => onComplete?.(), 2200)
                            }
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
