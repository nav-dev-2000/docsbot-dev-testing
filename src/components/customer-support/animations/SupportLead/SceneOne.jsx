import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChatBubble, ChatHeader, LoadingDots, Typewriter, ChatBotActions, ChatInput } from '@/components/customer-support/animation-elements'
import clsx from 'clsx'

const ChatUserLine = ({ content, onComplete, ...bubbleProps }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.4,
                ease: "easeOut"
            }}
            onAnimationComplete={() => onComplete?.()}
        >
            <ChatBubble
                isBot={false}
                avatar={null}
                content={content}
                {...bubbleProps}
            />
        </motion.div>
    )
}

const ChatBotLine = ({ content, isFirstMsg, onComplete, ...bubbleProps }) => {
    const [isThinking, setIsThinking] = useState(true)
    const [isTyping, setIsTyping] = useState(false)

    return (
        <ChatBubble
            isBot={true}
            {...(!isFirstMsg && { avatar: null })}
            content={
                <>
                    {isThinking && (
                        <LoadingDots
                            timeout={1000}
                            onComplete={() => {
                                setIsTyping(true)
                                setIsThinking(false)
                            }}
                        />
                    )}

                    {(!isThinking && isTyping) && (
                        <Typewriter
                            onComplete={() => {
                                setIsTyping(false)

                                if (onComplete) {
                                    setTimeout(() => onComplete(), 600)
                                }
                            }}
                        >
                            {content}
                        </Typewriter>
                    )}

                    {!isThinking && !isTyping && (
                        <>{content}</>
                    )}
                </>
            }
            {...(!isFirstMsg && { className: 'pl-8' })}
            {...bubbleProps}
        />
    )
}

const ChatMultiline = ({
    data,
    initialMsg = false,
    hasActions = false,
    onComplete,
    ...bubbleProps
}) => {
    const [activeLineIndex, setActiveLineIndex] = useState(0)
    const [isActionsVisible, setIsActionsVisible] = useState(false)

    return (
        <div className="flex flex-col gap-2">
            {data?.map((item, index) => {
                const isFirstMsg = index === 0
                const isLastMsg = index === data.length - 1

                if (index > activeLineIndex) return null

                return (
                    <ChatBotLine
                        key={index}
                        content={item}
                        isFirstMsg={isFirstMsg}
                        onComplete={() => {
                            if (index < data.length - 1) {
                                setActiveLineIndex(prev => prev + 1)
                            }

                            if (isLastMsg) {
                                if (hasActions) {
                                    setIsActionsVisible(true)
                                } else {
                                    onComplete?.()
                                }
                            }
                        }}
                        {...bubbleProps}
                    />
                )
            })}

            {(hasActions && isActionsVisible) && (
                <ChatBotActions
                    onComplete={onComplete}
                    isInsideChat={true}
                    className="flex-col sm:flex-row pl-8 !pr-8"
                    bubbleClassName="w-full sm:w-auto"
                />
            )}
        </div>
    )
}

export const SceneOne = ({ onComplete }) => {
    const [inputValue, setInputValue] = useState('')
    const [isUserFirstMsg, setIsUserFirstMsg] = useState(false)
    const [isBotFirstMsg, setIsBotFirstMsg] = useState(false)
    const [isUserSecondMsg, setIsUserSecondMsg] = useState(false)
    const [isBotSecondMsg, setIsBotSecondMsg] = useState(false)

    const bubbleProps = {
        shadowSize: 'none',
        isInsideChat: true,
    }

    useEffect(() => {
        setTimeout(() => {
            setInputValue(
                "Hi, my product images aren't loading on my storefront"
            )
        }, 500)
    }, [])

    return (
        <>
            <ChatHeader
                className="flex-none"
                isActive={isUserFirstMsg}
            />

            <div
                className={clsx(
                    'overflow-y-auto flex flex-1 flex-col gap-4 p-3 sm:p-6',
                    {
                        ['justify-end']: isUserFirstMsg,
                    },
                )}
            >
                <ChatBubble
                    isBot={true}
                    content="Hello, how can I help you today? If I can't answer your question I'll help you open a support ticket."
                    {...bubbleProps}
                />

                {isUserFirstMsg && (
                    <ChatUserLine
                        content="Hi, your product looks like the right fit, where can I find a breakdown of the cost?"
                        onComplete={() => setIsBotFirstMsg(true)}
                        {...bubbleProps}
                    />
                )}

                {isBotFirstMsg && (
                    <ChatMultiline
                        data={[
                            "Let me get you the our pricing details...",
                           'We have a few different plans to choose from, you can find the details and a pricing comparison on our pricing page.',
                        ]}
                        onComplete={() => {
                            setInputValue(
                                'Can you tell me more about the business plans?'
                            )
                        }}
                        {...bubbleProps}
                    />
                )}

                {isUserSecondMsg && (
                    <ChatUserLine
                        content="Can you tell me more about the business plans?"
                        onComplete={() => setIsBotSecondMsg(true)}
                        {...bubbleProps}
                    />
                )}

                {isBotSecondMsg && (
                    <ChatMultiline
                        data={[
                           "To better assist you I will help connect you with a member of our sales team to review your setup and best options for your business.",
                           "Would you like to schedule a call with a member of our sales team?",
                        ]}
                        hasActions={true}
                        onComplete={() => onComplete?.()}
                        {...bubbleProps}
                    />
                )}
            </div>

            <ChatInput
                value={inputValue}
                placeholder="Type your question here…"
                className="pt-0 sm:pt-0"
                onComplete={() => {
                    if (!isUserFirstMsg) {
                        setIsUserFirstMsg(true)
                        setInputValue('')
                    } else {
                        setIsUserSecondMsg(true)
                        setInputValue('')
                    }
                }}
            />
        </>
    )
}
