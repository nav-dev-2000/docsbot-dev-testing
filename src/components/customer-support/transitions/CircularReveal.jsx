import { motion, AnimatePresence } from "framer-motion";

/**
 * CircularRevealTransition
 * Reusable transition component to reveal the "to" scene over the "from" scene
 * with a growing circular mask (zoom-in) effect.
 *
 * Props:
 * - from: React component (not element) for the base scene.
 * - to: React component (not element) for the revealed scene.
 * - start: boolean to start the reveal.
 * - duration: seconds for the reveal animation (default 0.9).
 * - ease: a framer-motion easing (default "easeInOut").
 * - onComplete: callback once reveal finishes.
 * - origin: { xPercent: number, yPercent: number } mask origin (default center 50/50).
 */
export const CircularRevealTransition = ({
    from: From,
    to: To,
    start = false,
    duration = 0.9,
    ease = "easeInOut",
    onComplete,
    origin = { xPercent: 50, yPercent: 50 },
}) => {
    // Large circle size to fully cover container; 150% is a safe overshoot.
    const closed = `circle(0% at ${origin.xPercent}% ${origin.yPercent}%)`;
    const open = `circle(150% at ${origin.xPercent}% ${origin.yPercent}%)`;

    return (
        <div className="relative size-full overflow-hidden">
            {/* Base scene */}
            <div className="absolute inset-0">
                <From />
            </div>

            {/* Revealed scene */}
            <AnimatePresence>
                {start && (
                    <motion.div
                        className="absolute inset-0 z-10 will-change-[clip-path]"
                        initial={{ clipPath: closed }}
                        animate={{ clipPath: open }}
                        exit={{ clipPath: closed }}
                        transition={{ duration, ease }}
                        onUpdate={() => {
                            // Prevent pointer events during transition to avoid accidental interaction
                            // Tailwind can't toggle conditionally here; rely on inline style.
                        }}
                        onAnimationComplete={() => {
                            onComplete?.();
                        }}
                        style={{
                            pointerEvents: "none", // disabled while animating
                        }}
                    >
                        <To />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
