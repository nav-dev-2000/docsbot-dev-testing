import { useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import {
    BeakerIcon,
    CodeBracketSquareIcon,
    GlobeAltIcon
} from "@heroicons/react/24/outline"
import { ChatInput } from "../../animation-elements"
import LoadingSpinner from "@/components/LoadingSpinner"

const Button = ({ className, isActive, onComplete }) => {
    return (
        <motion.div
            initial={{
                backgroundColor: "#FFFFFF",
                color: "#164e63"
            }}
            animate={{
                backgroundColor: isActive ? "#164e63" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#164e63",
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
            onAnimationComplete={() => {
                setTimeout(() => onComplete?.(), 800)
            }}
            className={clsx(
                'flex flex-row items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-xl',
                'text-cyan-900 text-sm/6 font-semibold whitespace-nowrap',
                className,
            )}
        >
            {isActive && (
                <>
                    <LoadingSpinner />
                    Researching...
                </>
            )}

            {!isActive && (
                <>
                    <BeakerIcon
                        className="size-6"
                    />
                    Deep Research
                </>
            )}
        </motion.div>
    )
}

const Tooltip = ({ text, className, isMouseOver = false, onComplete, children }) => {
    return (
        <div
            className={clsx(
                'flex items-center gap-3',
                className,
            )}
        >
            { children }
            
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                    width: isMouseOver ? "auto" : 0, 
                    opacity: isMouseOver ? 1 : 0 
                }}
                transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1]
                }}
                onAnimationComplete={() => {
                    setTimeout(() => onComplete?.(), 800)
                }}
            >
                <div className="bg-cyan-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center shadow-lg transform">
                     <div className="absolute top-1/2 right-full -translate-y-1/2 border-y-[6px] border-r-[6px] border-y-transparent border-r-cyan-900" />
                    { text }
                </div>
            </motion.div>
        </div>
    )
}

const IconButton = ({ icon: Icon, className, isMouseOver = false }) => {
    let iconColor = 'text-cyan-900'
    let bgColor = 'bg-white'

    if (isMouseOver) {
        iconColor = 'text-cyan-600'
    }

    return (
        <motion.div
            className={clsx(
                'size-12 flex items-center justify-center rounded-full relative z-10 shadow-xl',
                bgColor,
                className,
            )}
        >
            <Icon
                className={clsx(
                    'size-6',
                    iconColor,
                )}
            />
        </motion.div>
    )
}

const TooltipButton = ({ defaultIcon: Icon, tooltip, className, isMouseOver, onComplete }) => {
    return (
        <Tooltip
            text={tooltip}
            className={className}
            isMouseOver={isMouseOver}
            onComplete={() => onComplete?.()}
        >
            <IconButton
                icon={Icon}
                isMouseOver={isMouseOver}
            />
        </Tooltip>
    )
}

export const SceneOne = ({ onComplete }) => {
    const [showFirstButton, setShowFirstButton] = useState(false)
    const [showSecondButton, setShowSecondButton] = useState(false)
    const [isMouseOverButton, setIsMouseOverButton] = useState(false)
    const [isMouseOverResearch, setIsMouseOverResearch] = useState(false)

    return (
        <div className="size-full max-w-[540px] relative flex flex-col items-center justify-center mx-auto lg:px-6">
            <div className="w-full bg-white rounded-xl shadow-xl">
                <ChatInput
                    placeholder="Ask a complex research question"
                    value="Scan market trends against internal data plus web sources"
                    hasSubmit={false}
                    className="w-full !p-0 !sm:p-0"
                    isMultiline={true}
                    onComplete={() => setShowFirstButton(true)}
                />
            </div>

            <div
                className={clsx(
                    'w-full flex mt-2',
                    'flex-row items-center flex-wrap gap-2',
                    // 'sm:flex-row sm:items-center sm:space-between sm:mt-4 sm:gap-4',
                )}
            >
                <div
                    className={clsx(
                        'w-full min-w-[220px] flex flex-1 flex-row items-center gap-2',
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showFirstButton ? 1 : 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        onAnimationComplete={() => {
                            if (showFirstButton) {
                                setTimeout(() => setShowSecondButton(true), 600)
                            }
                        }}
                        className="opacity-0"
                    >
                        <TooltipButton
                            defaultIcon={GlobeAltIcon}
                            tooltip="Web Search"
                            isMouseOver={isMouseOverButton}
                            onComplete={() => {
                                if (isMouseOverButton) {
                                    setTimeout(() => setIsMouseOverResearch(true), 600)
                                }
                            }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showSecondButton ? 1 : 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        onAnimationComplete={() => {
                            if (showFirstButton && showSecondButton) {
                                setTimeout(() => setIsMouseOverButton(true), 600)
                            }
                        }}
                        className="opacity-0"
                    >
                        <IconButton
                            icon={CodeBracketSquareIcon}
                        />
                    </motion.div>
                </div>

                <Button
                    className="flex-0"
                    isActive={isMouseOverResearch}
                    onComplete={() => {
                        if (isMouseOverResearch) {
                            setTimeout(() => onComplete?.(), 800)
                        }
                    }}
                />
            </div>
        </div>
    )
}
