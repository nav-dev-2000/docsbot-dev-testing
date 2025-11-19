import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

import { DocumentIcon } from "@heroicons/react/24/outline"

import { CircularRevealTransition, BlurCrossfadeTransition } from "@/components/customer-support/transitions"
import { ChatBubble, SonarPulse } from "@/components/customer-support/animation-elements"

const SceneOne = () => {
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

const SceneTwo = () => {
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

const SceneThree = () => {
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

export const AccurateAnswers = () => {
    // Phases: s1 -> reveal12 -> s2 -> reveal23 -> s3 -> blur31 -> (loop)
    const [phase, setPhase] = useState("s1");
    
    // Per-phase dwell (ms) — tweak to taste per scene
    const DWELL_MS = {
        s1: 2200,
        s2: 900,
        s3: 3800,
    };

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

    // Phase scheduler (only runs when active)
    useEffect(() => {
        if (!isActive) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        let id;
        if (phase === "s1" || phase === "s2" || phase === "s3") {
            const dwell = DWELL_MS[phase] ?? 2500;
            
            id = window.setTimeout(() => {
                if (phase === "s1") setPhase("reveal12");
                if (phase === "s2") setPhase("reveal23");
                if (phase === "s3") setPhase("blur31");
            }, dwell);

            timerRef.current = id;
        }

        return () => {
            if (id) clearTimeout(id);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [phase, isActive]);

    // Reset when inactive
    useEffect(() => {
        if (!isActive) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            setPhase("s1");
        }
    }, [isActive]);

    let content = null;
    if (!isActive) {
        content = (
            <div className="size-full bg-cyan-300" loading="lazy" decoding="async" />
        );
    } else if (phase === "s1") {
        content = <SceneOne />;
    } else if (phase === "reveal12") {
        content = (
            <CircularRevealTransition
                from={SceneOne}
                to={SceneTwo}
                start
                duration={0.9}
                ease="easeInOut"
                origin={{ xPercent: 50, yPercent: 50 }}
                onComplete={() => setPhase("s2")}
            />
        );
    } else if (phase === "s2") {
        content = <SceneTwo />;
    } else if (phase === "reveal23") {
        content = (
            <CircularRevealTransition
                from={SceneTwo}
                to={SceneThree}
                start
                duration={0.9}
                ease="easeInOut"
                origin={{ xPercent: 50, yPercent: 50 }}
                onComplete={() => setPhase("s3")}
            />
        );
    } else if (phase === "s3") {
        content = <SceneThree />;
    } else if (phase === "blur31") {
        content = (
            <BlurCrossfadeTransition
                from={SceneThree}
                to={SceneOne}
                start
                duration={0.6}
                ease="easeOut"
                onComplete={() => setPhase("s1")}
            />
        );
    } else {
        content = <SceneOne />;
    }

    return (
        <div ref={rootRef} className="relative size-full">
            <h4 className="sr-only">Demo animation showing chat conversations with accurate answers</h4>
            {content}
        </div>
    );
};
