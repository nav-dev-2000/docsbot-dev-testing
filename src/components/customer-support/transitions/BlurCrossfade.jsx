import { motion, AnimatePresence } from "framer-motion";

/**
 * BlurCrossfadeTransition
 * Simple blur + fade reveal used when looping from the last scene back to the first.
 * API mirrors CircularRevealTransition for drop-in consistency.
 */
export const BlurCrossfadeTransition = ({
    from: From,
    to: To,
    start = false,
    duration = 0.6,
    ease = "easeOut",
    onComplete,
}) => {
    return (
        <div className="relative size-full overflow-hidden">
            <div className="absolute inset-0">
                <From />
            </div>

            <AnimatePresence>
                {start && (
                    <motion.div
                        className="absolute inset-0 z-10 will-change-[filter,opacity]"
                        initial={{ filter: "blur(20px)", opacity: 0 }}
                        animate={{ filter: "blur(0px)", opacity: 1 }}
                        exit={{ filter: "blur(20px)", opacity: 0 }}
                        transition={{ duration, ease }}
                        onAnimationComplete={() => onComplete?.()}
                        style={{ pointerEvents: "none" }}
                    >
                        <To />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
