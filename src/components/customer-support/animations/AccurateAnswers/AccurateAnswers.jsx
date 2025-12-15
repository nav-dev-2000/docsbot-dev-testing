import { useEffect, useRef, useState } from "react"
import { CircularRevealTransition, BlurCrossfadeTransition } from "@/components/customer-support/transitions"
import { SceneOne } from "./SceneOne"
import { SceneTwo } from "./SceneTwo"
import { SceneThree } from "./SceneThree"

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
                    timeout={2100}
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
