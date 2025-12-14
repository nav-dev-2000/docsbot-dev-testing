import { useEffect, useState, useRef } from "react"
import { motion, animate } from "framer-motion"
import clsx from "clsx"

export const Typewriter = ({
    className,
    children,
    speed = 0.04,
    onStart,
    onComplete,
    placeholder = "",
    startDelay = 0,
    restartAfter, // in ms; if provided, replays the whole typing
    restartDelay = startDelay, // show placeholder briefly before each restart
}) => {
    const [displayed, setDisplayed] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [hasTyped, setHasTyped] = useState(false)
    const didReallyTypeRef = useRef(false)
    const fullText = typeof children === "string" ? children : String(children)

    const onStartRef = useRef(onStart)
    const onCompleteRef = useRef(onComplete)

    useEffect(() => {
        onStartRef.current = onStart
        onCompleteRef.current = onComplete
    }, [onStart, onComplete])

    useEffect(() => {
        let controls
        let startTimeout
        let restartTimeout
        let restartKickoffTimeout

        const runTyping = () => {
            setIsTyping(true)
            setDisplayed("") // clear any placeholder once we actually start

            if (!hasTyped) {
                setHasTyped(true)
                didReallyTypeRef.current = true
                onStartRef.current?.(true)
            }

            let currentIndex = 0
            const total = fullText.length

            controls = animate(0, total, {
                type: "tween",
                duration: total * speed,
                ease: "linear",
                onUpdate: (latest) => {
                    const nextIndex = Math.floor(latest)
                    if (nextIndex !== currentIndex) {
                        currentIndex = nextIndex
                        setDisplayed(fullText.slice(0, currentIndex))
                    }
                },
                onComplete: () => {
                    setDisplayed(fullText)
                    setIsTyping(false)
                    if (didReallyTypeRef.current) {
                        onCompleteRef.current?.()
                    }

                    // schedule restart if requested
                    if (typeof restartAfter === "number" && restartAfter > 0) {
                        // after restartAfter, show placeholder (if any), then wait restartDelay, then type again
                        restartTimeout = setTimeout(() => {
                            if (placeholder) {
                                setDisplayed(placeholder)
                            } else {
                                setDisplayed("") // optional: clear between cycles if no placeholder
                            }
                            setHasTyped(false)
                            didReallyTypeRef.current = false
                            onStartRef.current?.(false)
                            if (restartDelay > 0) {
                                restartKickoffTimeout = setTimeout(() => {
                                    runTyping()
                                }, restartDelay)
                            } else {
                                runTyping()
                            }
                        }, restartAfter)
                    }
                },
            })
        }

        // initial delay before starting actual typing
        startTimeout = setTimeout(() => {
            runTyping()
        }, startDelay)

        // show placeholder while we wait to start
        if (startDelay > 0 && placeholder) {
            setDisplayed(placeholder)
        } else if (!fullText) {
            setDisplayed("")
        }

        return () => {
            controls?.stop?.()
            clearTimeout(startTimeout)
            clearTimeout(restartTimeout)
            clearTimeout(restartKickoffTimeout)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullText, speed, placeholder, startDelay, restartAfter, restartDelay])

    return (
        <span
            className={clsx(
                hasTyped ? "text-gray-900" : "text-gray-400",
                className
            )}
        >
            {displayed}

            {isTyping || displayed === fullText && (
                <motion.span
                    aria-hidden="true"
                    className="inline-block w-0.5 h-4 ml-1 align-middle bg-current"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
            )}
        </span>
    )
}
