import { ChatBubble, ChatHeader } from "../animation-elements"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

const Conversation = () => {
    const bubbleBot = {
        isBot: true,
        isInsideChat: true,
        shadowSize: 'none',
    }

    const bubbleUser = {
        isBot: false,
        isInsideChat: true,
        avatar: null,
        shadowSize: 'none',
    }

    // Timing (seconds)
    const BUBBLE_DELAY = 1.5;  // delay between each animated bubble start
    const RESTART_DELAY = 2.5; // wait after the final bubble before loop restarts
    const POP_IN = 0.50;       // pop/zoom-in duration for each bubble
    const GLOBAL_START_DELAY = 1.0; // delay before second bubble starts its pop-in

    const bubbles = [
        "Hello there, it's nice to meet you! What brings you here today?",
        "¿Podemos hablar en español?",
        "Claro, podemos hablar en español. ¿En qué puedo ayudarte hoy?",
        "Which other languages do you speak?",
        "I can communicate in 100+ languages including English, Spanish, French, German, Italian, Portuguese, and more. Let me know if you'd like to continue in any specific language!",
    ];

    const animatedCount = bubbles.length - 1; // first bubble is static

    // Total timeline = final bubble starts at (animatedCount-1)*BUBBLE_DELAY, plus its POP_IN, plus the restart wait
    const totalDuration = (animatedCount - 1) * BUBBLE_DELAY + POP_IN + RESTART_DELAY;

    // Build per-bubble keyframe times in 0..1 for a clean, ordered timeline.
    const getTimes = (idx) => {
        const start = GLOBAL_START_DELAY + idx * BUBBLE_DELAY;
        const popEnd = start + POP_IN;
        const resetAt = totalDuration - 0.001;

        return [
            0,
            start / totalDuration,
            popEnd / totalDuration,
            resetAt / totalDuration,
            1,
        ];
    };

    return (
        <div className="flex flex-1 flex-col gap-2 p-6">
            <ChatBubble content={bubbles[0]} {...bubbleBot} />
        
            {bubbles.slice(1).map((text, idx) => {
                const times = getTimes(idx);

                return (
                    <motion.div
                        key={idx + 1}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: [0, 0, 1, 1, 0],            // off -> on at start -> stay on -> reset at loop end
                            y:       [10, 10, 0, 0, 0],          // slide up once, then hold position
                        }}
                        transition={{
                            duration: totalDuration,
                            ease: "linear", // stable timeline
                            times,
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                    >
                        <ChatBubble
                            content={text}
                            {...(((idx + 1) % 2 === 0) ? bubbleBot : bubbleUser)}
                        />
                    </motion.div>
                );
            })}
        </div>
    )
}

const Chat = () => {
    return (
        <div className="overflow-hidden flex flex-col rounded-t-lg bg-white shadow-lg">
            <ChatHeader
                className="flex-none"
                isActive={true}
            />

            <Conversation />
        </div>
    )
}

export const MultilingualChat = () => {
    const rootRef = useRef(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;

        const panel = node.closest('[role="tabpanel"]');
        const computeActive = () => (panel ? panel.getAttribute("aria-hidden") !== "true" : true);

        setIsActive(computeActive());
        if (!panel) return;
        
        const mo = new MutationObserver(() => {
            setIsActive(computeActive());
        });

        mo.observe(panel, { attributes: true, attributeFilter: ["aria-hidden"] });
        return () => mo.disconnect();
    }, []);

    return (
      <div ref={rootRef} className="relative size-full bg-gradient-to-tr from-slate-100 to-slate-300">
        <h4 className="sr-only">Demo animation showing chat conversations in multiple languages</h4>
        {isActive && (
            <div className="overflow-hidden size-full max-w-[90%] sm:max-w-[80%] lg:max-w-[50%] max-h-[100%] relative mx-auto pt-5">
                <Chat />
            </div>
        )}
      </div>
    )
}
