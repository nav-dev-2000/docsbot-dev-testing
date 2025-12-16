import { useEffect, useState, isValidElement } from 'react'
import { motion } from 'framer-motion'
import { ChatBubble, ChatHeader, LoadingDots, Typewriter, ChatBotActions, ChatInput } from '@/components/customer-support/animation-elements'
import clsx from 'clsx'

// Helper to extract text content from JSX
const extractTextFromJSX = (node) => {
    if (typeof node === 'string') {
        return node
    }
    if (typeof node === 'number') {
        return String(node)
    }
    if (isValidElement(node)) {
        if (node.props.children != null) {
            if (Array.isArray(node.props.children)) {
                return node.props.children.map(extractTextFromJSX).join('')
            }
            return extractTextFromJSX(node.props.children)
        }
        return ''
    }
    if (Array.isArray(node)) {
        return node.map(extractTextFromJSX).join('')
    }
    return ''
}

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
    const isJSX = isValidElement(content) || (Array.isArray(content) && content.some(item => isValidElement(item)))
    const textForTyping = isJSX ? extractTextFromJSX(content) : content

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
                            {textForTyping}
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
                "Hi, where can I find a breakdown of the cost?"
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
                        content="Hi, where can I find a breakdown of the cost?"
                        onComplete={() => setIsBotFirstMsg(true)}
                        {...bubbleProps}
                    />
                )}

                {isBotFirstMsg && (
                    <ChatMultiline
                        data={[
                            "Let me get you our pricing details...",
                            <>We have a few different plans to choose from, you can find the details and a pricing comparison on our <a href="/pricing" className="text-blue-600 underline hover:text-blue-800">pricing page</a>.</>,
                        ]}
                        onComplete={() => {
                            setInputValue(
                                'This looks great! I would like to learn more about the business plans.'
                            )
                        }}
                        {...bubbleProps}
                    />
                )}

                {isUserSecondMsg && (
                    <ChatUserLine
                        content="This looks great! I would like to learn more about the business plans."
                        onComplete={() => setIsBotSecondMsg(true)}
                        {...bubbleProps}
                    />
                )}

                {isBotSecondMsg && (
                    <ChatMultiline
                        data={[
                           "Would you like to schedule a call to review options with a member of our sales team?",
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
