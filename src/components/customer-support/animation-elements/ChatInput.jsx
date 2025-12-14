import { useState } from "react"
import { motion } from "framer-motion"
import { Typewriter } from "@/components/customer-support/animation-elements"
import { PaperAirplaneIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"

const Button = ({ isMouseOver = false, className, onComplete }) => {
    return (
        <motion.div
            animate={{
                color: isMouseOver ? "#FFFFFF" : "#90A1B9",
                backgroundColor: isMouseOver ? "#0891B2" : "#FFFFFF",
            }}
            transition={{
                duration: 0.35,
                ease: "easeInOut",
            }}
            className={clsx(
                'size-10 flex items-center justify-center rounded-lg',
                className,
            )}
            onAnimationComplete={() => {
                onComplete?.()
            }}
        >
            <PaperAirplaneIcon className="w-4" />
        </motion.div>
    )
}

const Input = ({
    value,
    placeholder,
    hasSubmit = true,
    isMultiline = false,
    className,
    onStart,
    onComplete
}) => {
    return (
        <div
            className={clsx(
                // '',
                'w-full p-4 border border-slate-300 rounded-xl text-slate-400 text-sm/4',
                {
                    ['whitespace-nowrap overflow-hidden']: !isMultiline,
                    ['relative']: hasSubmit,
                },
                className,
            )}
        >
            {value && (
                <Typewriter
                    placeholder={placeholder}
                    onStart={onStart}
                    onComplete={onComplete}
                >
                    {value}
                </Typewriter>
            )}

            {!value && placeholder}

            {hasSubmit && (
                <span className="w-14 h-full absolute top-0 right-0 rounded-tr-xl rounded-br-xl bg-white" />
            )}
        </div>
    )
}

export const ChatInput = ({
    value,
    placeholder = 'Send a message...',
    hasSubmit = true,
    isMultiline = false,
    className,
    onComplete
}) => {
    const [isTyping, setIsTyping] = useState(false)

    return (
        <div
            className={clsx(
                'p-3 sm:p-6',
                className,
            )}
        >
            <div className="relative">
                <Input
                    value={value}
                    placeholder={placeholder}
                    className={clsx(
                        {
                            ['pr-14']: hasSubmit,
                        }
                    )}
                    hasSubmit={hasSubmit}
                    isMultiline={isMultiline}
                    onStart={() => {
                        setIsTyping(true)
                    }}
                    onComplete={() => {
                        setTimeout(() => setIsTyping(false), 300)
                        setTimeout(() => onComplete?.(), 600)
                    }}
                />

                {hasSubmit && (
                    <Button
                        isMouseOver={isTyping}
                        className="absolute top-1/2 right-[0.35rem] -translate-y-1/2"
                    />
                )}
            </div>
        </div>
    )
}
