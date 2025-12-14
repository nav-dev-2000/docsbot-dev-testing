import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ChatBubble, LoadingDots, Typewriter, Clock, ChatBotActions } from '@/components/customer-support/animation-elements'

const ChatScene = ({ botInitialMsg, userQuestion, botReply, hasActions = false, onComplete }) => {
    const [isUserMsg, setIsUserMsg] = useState(false)
    const [isBotReply, setIsBotReply] = useState(false)
    const [isThinking, setIsThinking] = useState(true)
    const [isBotRequest, setIsBotRequest] = useState(false)

    const bubbleProps = {
        shadowSize: 'md',
        shadowColor: 'gray-900/60',
        contentClass: 'text-pretty lg:!max-w-full',
    }

    const slideIn = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
    }

    useEffect(() => {
        const timer = setTimeout(() => setIsUserMsg(true), 400)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        console.log(`isBotReply: ${isBotReply}`)
        console.log(`isBotRequest: ${isBotRequest}`)
    }, [isBotReply, isBotRequest])

    return (
        <motion.div className="flex flex-col gap-6">
            {botInitialMsg && (
                <ChatBubble
                    isBot={true}
                    content={botInitialMsg}
                    {...bubbleProps}
                />
            )}

            <motion.div
                initial="hidden"
                animate={isUserMsg ? "visible" : "hidden"}
                variants={slideIn}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onAnimationComplete={() => setIsBotReply(true)}
            >
                <ChatBubble
                    isBot={false}
                    content={userQuestion}
                    {...bubbleProps}
                />
            </motion.div>

            {isBotReply && (
                <ChatBubble
                    isBot={true}
                    content={
                        <>
                            {isThinking && (
                                <LoadingDots
                                    timeout={600}
                                    onComplete={() => setIsThinking(false)}
                                />
                            )}

                            {!isThinking && !isBotRequest && (
                                <Typewriter
                                    onComplete={() => {
                                        if (!hasActions) {
                                            setTimeout(() => onComplete?.(), 600)
                                        } else {
                                            setTimeout(() => setIsBotRequest(true), 600)
                                        }
                                    }}
                                >
                                    {botReply}
                                </Typewriter>
                            )}

                            {(!isThinking && isBotRequest) && botReply}
                        </>
                    }
                    {...bubbleProps}
                />
            )}

            {hasActions && isBotRequest && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="-mt-2"
                    >
                        <ChatBubble
                            isBot={true}
                            avatar={null}
                            content="Was this answer helpful?"
                            className="min-h-[48px] pl-[40px] sm:pl-[64px]"
                            {...bubbleProps}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
                        className="-mt-2"
                    >
                        <ChatBotActions
                            content={{
                                yes: 'Yes',
                                no: 'No',
                            }}
                            className="pl-[40px] sm:pl-[64px]"
                            onComplete={() => {
                                if (onComplete) {
                                    setTimeout(() => onComplete(), 600)
                                }
                            }}
                        />
                    </motion.div>
                </>
            )}
        </motion.div>
    )
}

const BgScene = ({ start = false, className, onComplete }) => {
    const [expand, setExpand] = useState(false)

    return (
        <motion.div
            className={clsx(
                'w-full h-full absolute -z-10 top-0 left-0 rounded-2xl',
                className,
            )}
            initial={{
                scale: 0,
            }}
            animate={
                expand
                    ? { width: '80rem', scale: 1 }
                    : start
                        ? { scale: 1 }
                        : {}
            }
            transition={{
                duration: 0.4,
                ease: "linear",
                delay: expand ? 0 : 0.3,
            }}
            onAnimationComplete={() => {
                if (!expand) {
                    setExpand(true)
                }

                if (onComplete) {
                    setTimeout(() => onComplete(), 600)
                }
            }}
        />
    )
}

const FullScene = ({ time, chat, background, text, hasActions = false, onComplete }) => {
    const [step, setStep] = useState('chat')
    const [showBg, setShowBg] = useState(false)

    return (
        <div className="relative size-full flex flex-col">
            <div className="h-full flex flex-col items-center justify-center">
                {step !== 'chat' && (
                    <Clock
                        time={time}
                        onComplete={() => setShowBg(true)}
                        bgColor={background}
                        textColor={text}
                    />
                )}

                {step === 'chat' && (
                    <div className="w-full max-w-[540px] mx-auto py-6">
                        <ChatScene
                            {...chat}
                            hasActions={hasActions}
                            onComplete={onComplete}
                        />
                    </div>
                )}
            </div>

            <BgScene
                start={showBg}
                onComplete={() => setStep('chat')}
                className={background}
            />
        </div>
    )
}

export const SceneOne = ({ onComplete }) => {
    return (
        <FullScene
            time="22:00"
            chat={{
                userQuestion: "How do I reset my password?",
                botReply: "Click 'Forgot Password' on the login page and enter your email. You'll receive a reset link within a few minutes!",
            }}
            background="bg-gray-900"
            text="text-white"
            hasActions={true}
            onComplete={onComplete}
        />
    )
}
