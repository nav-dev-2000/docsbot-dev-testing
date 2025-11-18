import { motion } from "framer-motion"
import clsx from "clsx"

export const ChatBotActions = ({
    borderColor = 'gray-200',
    shadowSize = 'lg',
    shadowColor = 'gray-900/40',
    className,
}) => {
    const bubbleCss = 'flex items-center px-4 py-2 border rounded-lg'

    return (
        <div
            className={clsx(
                'pointer-events-none relative flex flex-none justify-start gap-2 pl-16 pr-[20%] text-sm',
                className,
            )}
            aria-hidden={true}
        >
            <motion.div
                initial={{
                    backgroundColor: "#ffffff",
                    color: "#000000"
                }}
                animate={{
                    backgroundColor: "#0891b2",
                    color: "#ffffff"
                }}
                transition={{
                    delay: 0.5,
                    duration: 0.5,
                    ease: "easeInOut",
                    repeat: false,
                }}
                className={clsx(
                    bubbleCss,
                    `border-${borderColor} shadow-${shadowSize}`,
                )}
            >
                Yes, please
            </motion.div>

            <div className={clsx(
                'bg-white',
                bubbleCss,
                `border-${borderColor} shadow-${shadowSize} shadow-${shadowColor}`,
            )}>
                No, thank you
            </div>
        </div>
    )
}
