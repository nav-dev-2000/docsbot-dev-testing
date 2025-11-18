import { memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { ChatBotActions, ChatBubble, SonarPulse } from "@/components/customer-support/animation-elements";
import { CircularRevealTransition, BlurCrossfadeTransition } from "@/components/customer-support/transitions";
import circuit from "@/images/app-demo/circuit-pattern.png";
import ZendeskLogo from "@/components/ZendeskLogo";
import RobotIconSolid from "@/components/RobotIconSolid";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";

const SceneOne = memo(() => {
    const prefersReducedMotion = useReducedMotion();
    const bubbleProps = {
        shadowSize: 'md',
        shadowColor: 'gray-900/60',
    }

    // Animation timings
    const GAP_0 = 0.5;   // seconds wait before first appears
    const DUR_1 = 0.6;   // seconds for first bubble
    const GAP_1 = 0.8;   // seconds wait after first finishes
    const DUR_2 = 0.6;   // seconds for second bubble
    const GAP_2 = 0.4;   // seconds wait after second finishes
    const DUR_3 = 0.6;   // seconds for actions

    // Computed delays so each starts AFTER the previous animation finishes + requested gap
    const delay2 = DUR_1 + GAP_1;                 // start of bubble 2
    const delay3 = DUR_1 + GAP_1 + DUR_2 + GAP_2; // start of actions

    const [showActions, setShowActions] = useState(false)

    useEffect(() => {
        const id = setTimeout(() => setShowActions(true), delay3 * 1000)
        return () => clearTimeout(id)
    }, [])

    return (
        <div className="size-full bg-gradient-to-r from-teal-200 to-cyan-600">
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        duration: prefersReducedMotion ? 0 : DUR_1,
                        ease: "easeOut",
                        delay: prefersReducedMotion ? 0 : GAP_0,
                    }}
                    className="w-full"
                >
                    <ChatBubble
                        content="Hello, can I speak with a human?"
                        { ...bubbleProps }
                    />
                </motion.div>

                <div className="w-full flex flex-col gap-2 pr-8 sm:pr-[20%]">
                    <motion.div
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            duration: prefersReducedMotion ? 0 : DUR_2,
                            ease: "easeOut",
                            delay: prefersReducedMotion ? 0 : delay2
                        }}
                    >
                        <ChatBubble
                            isBot
                            content="Of course! I can help you open a support ticket."
                            { ...bubbleProps }
                            className="!pr-0"
                        />
                    </motion.div>

                    { showActions && (
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                duration: prefersReducedMotion ? 0 : DUR_3,
                                ease: "easeOut"
                            }}
                        >
                            <ChatBotActions
                                borderColor="transparent"
                                { ...bubbleProps }
                                className="flex-col sm:flex-row !pl-10 sm:!pl-16 !pr-0"
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
});
SceneOne.displayName = 'SceneOne';

const SceneTwo = memo(() => {
    const prefersReducedMotion = useReducedMotion();
    const boxCss = 'flex items-center justify-center rounded-lg shadow-md'

    const ConnectionDot = ({ delay = 0 }) => (
        <motion.div
            className="size-2 rounded-full bg-white"
            initial={{ opacity: 0.1 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.1, 0.9, 0.1] }}
            transition={{ duration: 1.2, ease: "easeInOut", repeat: prefersReducedMotion ? 0 : Infinity, delay }}
        />
    );
    
    const ConnectionBot = () => {
        return (
            <div className="flex items-center gap-4">
                <div className={clsx(boxCss, 'bg-white', `size-16`)}>
                    <RobotIconSolid className={clsx(`size-8`)} color="#0891B2" />
                </div>

                <div className="flex items-center gap-2">
                    <ConnectionDot delay={0.0} />
                    <ConnectionDot delay={0.15} />
                    <ConnectionDot delay={0.30} />
                    <ConnectionDot delay={0.45} />
                    <ConnectionDot delay={0.60} />
                </div>

                <motion.div
                    className={clsx(boxCss, 'bg-[#D1F470]', `size-16`)}
                    animate={{ scale: [0.9, 1.05, 1.05, 0.9] }}
                    transition={{
                        duration: prefersReducedMotion ? 0 : 0.8,
                        ease: "easeInOut",
                        repeat: prefersReducedMotion ? 0 : Infinity
                    }}
                >
                    <ZendeskLogo className={clsx(`size-8`)} color="#203625" />
                </motion.div>
            </div>
        )
    }

    return (
        <div
            className="pointer-events-none size-full relative bg-cyan-600"
            aria-hidden={true}
        >
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] relative mx-auto">
                <div className="size-full flex flex-col items-center justify-center gap-8">
                    <SonarPulse sizeClass="size-96">
                        <ConnectionBot />
                    </SonarPulse>
                </div>
            </div>
        </div>
    );
});
SceneTwo.displayName = 'SceneTwo';

const SceneThree = memo(() => {
    const prefersReducedMotion = useReducedMotion();

    const FormField = ({ label, content, isTextarea = false }) => {
        return (
            <div className="flex flex-col gap-1">
                <div className="text-slate-500 text-sm/6 font-medium">
                    {label}
                </div>

                <div
                    className={clsx(
                        'overflow-hidden max-h-[125px] relative px-4 border border-slate-200 rounded-md bg-white text-slate-800',
                        {
                            ['py-4 text-sm/5']: isTextarea,
                            ['text-sm/9 whitespace-nowrap']: !isTextarea,
                        },
                    )}
                >
                    {content}
                    <div className="w-4 h-full absolute top-0 right-0 bg-white" />

                    {isTextarea && (
                        <div className="w-full absolute bottom-0 left-0 flex items-center justify-end gap-2 px-4 py-2 bg-white text-slate-500">
                            <PhotoIcon className="size-6" />
                            <FaceSmileIcon className="size-6" />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const TicketForm = ({ className }) => {
        return (
            <div className={clsx(
                'overflow-hidden w-full rounded-lg bg-white shadow-lg',
                className,
            )}>
                {/** Header */}
                <div className="px-8 py-4 bg-cyan-600 text-white text-sm/6 text-center">
                    <div className="mb-4">
                        Send a message
                    </div>

                    <div className="mb-1 text-lg/6 font-bold">
                        How can we help?
                    </div>

                    <div className="text-white/80">
                        We usually respond in a few hours
                    </div>
                </div>

                {/** Body */}
                <div className="flex flex-col gap-4 p-6 bg-slate-100">
                    <FormField
                        label="Subject"
                        content="Request to speak with a human support representative"
                    />

                    <FormField
                        label="How can we help?"
                        content="Please connect me with a human support representative. I would like to continue this conversation with a live agent. Relevant entity: support team."
                        isTextarea
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="pointer-events-none size-full bg-gradient-to-tr from-slate-100 to-slate-300">
            <div className="overflow-hidden size-full max-w-[90%] sm:max-w-[80%] lg:max-w-[50%] max-h-[100%] relative mx-auto">
                <motion.div
                    className="w-full absolute top-[20%] left-0"
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        duration: prefersReducedMotion ? 0 : 1,
                        ease: "easeOut",
                        delay: prefersReducedMotion ? 0 : 0.4,
                    }}
                >
                    <TicketForm />
                </motion.div>
            </div>
        </div>
    );
});
SceneThree.displayName = 'SceneThree';

export const SmartEscalation = () => {
    // Phases: s1 -> reveal12 -> s2 -> reveal23 -> s3 -> blur31 -> (loop)
    const [phase, setPhase] = useState("s1");
    
    // Per-phase dwell (ms)
    const DWELL_MS = {
      s1: 4400,
      s2: 900,
      s3: 3800,
    };

    const rootRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const lastActiveRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        
        const panel = node.closest('[role="tabpanel"]');
        // Initialize from current aria-hidden
        const computeActive = () => (panel ? panel.getAttribute("aria-hidden") !== "true" : true);
        const initial = computeActive();

        lastActiveRef.current = initial;
        setIsActive(initial);

        if (!panel) return;

        // Observe aria-hidden changes
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

    useEffect(() => {
        // Do not schedule timers if tab panel is inactive
        if (!isActive) return;

        // Clear any previous timer
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

    useEffect(() => {
        if (!isActive) {
            // Stop and reset to initial state when inactive
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
            <div
                className="size-full bg-teal-200"
                loading="lazy"
                decoding="async"
            />
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
            {content}
        </div>
    );
};
