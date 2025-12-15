import { useState } from "react"
import { motion } from "framer-motion"

import { ChatBubble } from "@/components/customer-support/animation-elements"

export const SceneThree = ({ onComplete }) => {
    const bubbleProps = {
        shadowSize: 'md',
        shadowColor: 'gray-900/60',
        contentClass: 'lg:!max-w-full',
    }
    const slideIn = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
    }
    const [showSecond, setShowSecond] = useState(false)

    return (
        <div className="size-full bg-gradient-to-r from-cyan-600 to-cyan-300">
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
                {/** User Question */}
                <ChatBubble
                    isBot={false}
                    content="Can I customize DocsBot's tone and responses?"
                    { ...bubbleProps }
                />

                {/** Bot Response */}
                <div className="w-full flex flex-col gap-2">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={slideIn}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 1.0 }}
                        onAnimationComplete={() => setShowSecond(true)}
                    >
                        <ChatBubble
                            isBot={true}
                            content="Yes—you have full control over tone, style, and behavior using your bot's custom instructions in settings."
                            { ...bubbleProps }
                        />
                    </motion.div>

                    {showSecond && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={slideIn}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                            onAnimationComplete={() => {
                                if (!onComplete) return
                                setTimeout(() => onComplete(), 400)
                            }}
                        >
                            <ChatBubble
                                isBot={true}
                                avatar={null}
                                content="Would you like guidance crafting custom instructions for your specific use case?"
                                { ...bubbleProps }
                                className="ml-10 sm:ml-16"
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
