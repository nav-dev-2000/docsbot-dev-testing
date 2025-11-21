import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

import { DocumentIcon } from "@heroicons/react/24/outline"

import { CircularRevealTransition, BlurCrossfadeTransition } from "@/components/customer-support/transitions"
import { ChatBubble, SonarPulse } from "@/components/customer-support/animation-elements"

const SceneOne = ({ onComplete }) => {
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

const SceneTwo = ({ onComplete, timeout = 2500 }) => {
    const boxCss = 'flex items-center justify-center rounded-lg shadow-md'
    const boxSize = 16
    const iconSize = boxSize / 2

    const BoxIcon = ({ icon, iconClass, className, ...props }) => {
        const Icon = icon;

        return (
            <div
                className={clsx(boxCss, 'p-4 bg-white', className)}
                {...props}
            >
                <Icon
                    className={clsx(
                        'text-cyan-600',
                        `size-${iconSize}`,
                        iconClass,
                    )}
                />
            </div>
        )
    }

    useEffect(() => {
        if (!onComplete) return

        const timer = setTimeout(() => onComplete(), timeout)

        return () => clearTimeout(timer)
    }, [onComplete, timeout])

    return (
        <div className="size-full relative bg-cyan-600">
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
                <div className="flex items-center gap-8">
                    <SonarPulse sizeClass="size-96">
                        <BoxIcon icon={DocumentIcon} />
                    </SonarPulse>
                </div>
            </div>
        </div>
    )
}

const SceneThree = ({ onComplete }) => {
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

const MaskOne = () => {
    return (
        <div className="size-full bg-gradient-to-r from-cyan-600 to-cyan-300" />
    )
}

const MaskTwo = () => {
    return (
        <div className="size-full relative bg-cyan-600" />
    )
}

export const AccurateAnswers = () => {
    const [phase, setPhase] = useState("s1");

    const rootRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const lastActiveRef = useRef(null);
    const timerRef = useRef(null);

    // Detect when the surrounding tabpanel becomes active/inactive
    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        
        const panel = node.closest('[role="tabpanel"]');
        const computeActive = () =>
        panel ? panel.getAttribute("aria-hidden") !== "true" : true;
        const initial = computeActive();

        lastActiveRef.current = initial;
        setIsActive(initial);

        if (!panel) return;

        const mo = new MutationObserver(() => {
            const next = computeActive();

            if (next !== lastActiveRef.current) {
                lastActiveRef.current = next;
                setIsActive(next);
            }
        });
        
        mo.observe(panel, { attributes: true, attributeFilter: ["aria-hidden"] });

        return () => mo.disconnect();
    }, []);

    // Reset when inactive
    useEffect(() => {
        if (!isActive) {
            setPhase("s1");
        }
    }, [isActive]);

    let content = null;
    if (!isActive) {
        content = (
            <div className="size-full bg-cyan-300" loading="lazy" decoding="async" />
        );
    } else {
        if (phase === "s1") {
            content = (
                <SceneOne
                    onComplete={() => setPhase("t1")}
                />
            );
        } else if (phase === "t1") {
            content = (
                <CircularRevealTransition
                    from={SceneOne}
                    to={MaskTwo}
                    start
                    duration={0.5}
                    ease="easeInOut"
                    origin={{ xPercent: 50, yPercent: 50 }}
                    onComplete={() => setPhase("s2")}
                />
            );
        } else if (phase === "s2") {
            content = (
                <SceneTwo
                    onComplete={() => setPhase("t2")}
                    timeout={1200}
                />
            );
        } else if (phase === "t2") {
            content = (
                <CircularRevealTransition
                    from={SceneTwo}
                    to={MaskOne}
                    start
                    duration={0.5}
                    ease="easeInOut"
                    origin={{ xPercent: 50, yPercent: 50 }}
                    onComplete={() => setPhase("s3")}
                />
            );
        } else if (phase === "s3") {
            content = (
                <SceneThree
                    onComplete={() => setPhase("t3")}
                />
            );
        } else if (phase === "t3") {
            content = (
                <BlurCrossfadeTransition
                    from={MaskOne}
                    to={MaskTwo}
                    start
                    duration={0.5}
                    ease="easeOut"
                    onComplete={() => setPhase("s1")}
                />
            );
        }
    }

    return (
        <div ref={rootRef} className="relative size-full">
            <h4 className="sr-only">Demo animation showing chat conversations with accurate answers</h4>
            {content}
        </div>
    );
};
