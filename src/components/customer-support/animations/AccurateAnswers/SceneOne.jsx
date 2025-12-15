import { useState } from "react"
import { motion } from "framer-motion"

import { ChatBubble } from "@/components/customer-support/animation-elements"

export const SceneOne = ({ onComplete }) => {
    const bubbleProps = {
        shadowSize: 'md',
        shadowColor: 'gray-900/60',
    }

    const slideIn = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
    }

    const [showSecond, setShowSecond] = useState(false)

    return (
        <div className="size-full bg-gradient-to-r from-cyan-600 to-cyan-300">
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={slideIn}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
                    onAnimationComplete={() => setShowSecond(true)}
                    className="w-full"
                >
                    <ChatBubble
                        isBot={true}
                        content="Hello, how can I help you today?"
                        { ...bubbleProps }
                    />
                </motion.div>

                {showSecond && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={slideIn}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                        className="w-full"
                        onAnimationComplete={() => {
                            if (onComplete) {
                                setTimeout(() => onComplete(), 400)
                            }
                        }}
                    >
                        <ChatBubble
                            isBot={false}
                            content="Can I customize DocsBot's tone and responses?"
                            { ...bubbleProps }
                            className="ml-10 sm:ml-16"
                        />
                    </motion.div>
                )}
            </div>
        </div>
    )
}
