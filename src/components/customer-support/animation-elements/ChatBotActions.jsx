import { motion } from "framer-motion"
import clsx from "clsx"

export const ChatBotActions = ({
    content,
    borderColor = 'gray-200',
    shadowSize = 'lg',
    isInsideChat = false,
    className,
    bubbleClassName,
    onComplete,
}) => {
    const bubbleCss = 'flex items-center px-4 py-2 rounded-lg border'

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
                    borderColor: "#e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#000000"
                }}
                animate={{
                    borderColor: "#0891b2",
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
                    {
                        [`border-${borderColor} shadow-${shadowSize}`]: !isInsideChat,
                    },
                )}
                onAnimationComplete={() => {
                    setTimeout(() => onComplete?.(), 500)
                }}
            >
                {content?.yes || 'Yes, please'}
            </motion.div>

            <div className={clsx(
                bubbleCss,
                {
                    ['border-slate-200']: isInsideChat,
                    [`border-${borderColor} bg-white shadow-${shadowSize}`]: !isInsideChat,
                },
                bubbleClassName,
            )}>
                {content?.no || 'No, thank you'}
            </div>
        </div>
    )
}
