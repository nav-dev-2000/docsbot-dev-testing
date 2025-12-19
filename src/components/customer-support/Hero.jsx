'use client'

import { useEffect, useState, useRef } from 'react'
import clsx from 'clsx'
import { Button } from '@/components/elements'
import Image from 'next/image';
import humanHero from '@/images/app-demo/docsbot-hero-human.webp'
import humanAvatar from '@/images/app-demo/docsbot-avatar-human.webp'
import RobotIconSolid from '../RobotIconSolid'
import { motion, AnimatePresence } from 'framer-motion'
const HeroGrid = () => {
    return (
        <svg
            aria-hidden="true"
            className="hidden lg:block absolute inset-0 -z-10 size-full stroke-gray-700 [mask-image:linear-gradient(to_bottom,white_80%,transparent)]"
        >
            <defs>
            <pattern
                x="50%"
                y={-1}
                id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
            >
                <path d="M.5 200V.5H200" fill="none" />
            </pattern>
            </defs>
            <rect fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)" width="100%" height="100%" strokeWidth={0} />
        </svg>
    );
}

export const HighlightWord = ({ word }) => (
    <span
        className="relative text-transparent [-webkit-text-stroke:1px_#14b8a6] before:content-[attr(data-text)] before:absolute before:top-1 before:left-1 before:inset-0 before:text-neutral-50 before:[-webkit-text-stroke:0]"
        data-text={word}
    >
        {word}
    </span>
)

const Title = ({ content, className }) => {
    if (typeof content !== 'string') {
        return (
            <h1
                className={clsx(
                    'relative text-neutral-50 text-6xl md:text-7xl font-semibold tracking-tight text-pretty',
                    className
                )}
            >
                { content }
            </h1>
        )
    }

    const clone = content?.toString().trim().split(/\s+/);
    const clonedWord = clone?.[0] || '';
    const restOfTitle = clone?.slice(1).join(' ') || '';

    return (
        <h1
            className={clsx(
                'relative text-neutral-50 text-6xl md:text-7xl font-semibold tracking-tight text-pretty',
                className
            )}
        >
            <HighlightWord word={clonedWord} />{" "}
            { restOfTitle }
        </h1>
    );
}

const Subtitle = ({ content, className }) => {
    return (
        <p
            className={clsx(
                'inline-flex px-3 py-1 rounded-full',
                'bg-teal-500/10 ring-1 ring-inset ring-teal-500/20',
                'text-teal-200 text-sm/6 font-semibold',
                className
            )}
        >
            { content }
        </p>
    );
}

const Description = ({ content, className }) => {
    return (
        <p className={clsx( 'text-pretty text-lg text-white/70 sm:text-xl/8', className )}>
            { content }
        </p>
    );
}

const HeroContentLeft = ({ title, subtitle, description, primaryButton, secondaryButton }) => {
    return (
        <div className="mx-auto lg:max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-8 text-center lg:text-left">
            <Subtitle
                content={ subtitle }
                className="mt-24 sm:mt-32 lg:mt-16"
            />

            <Title
                content={ title }
                className="mt-2 lg:mt-6"
            />

            <Description
                content={ description }
                className="mt-8"
            />
            
            {( primaryButton || secondaryButton ) && (
                <div
                    className={clsx(
                        'flex flex-col gap-4 mt-8',
                        'md:flex-row md:items-center md:justify-center lg:justify-normal md:gap-6 md:mt-10',
                    )}
                >
                    { primaryButton && (
                        <Button
                            {...primaryButton}
                            theme="opalite"
                            variant="primary"
                        />
                    )}
                    { secondaryButton && (
                        <Button
                            {...secondaryButton}
                            theme="light"
                            variant="secondary"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

const HeroContentRight = ({ image, heroFaqs = [], className, imageContainerClassName, imageClassName, avatar }) => {
    const faqs = heroFaqs

    const [phrasesRand, setPhrasesRand] = useState(() => {
        if (faqs.length > 0) {
            return [faqs[0].question, faqs[0].answer]
        }
        return ['', '']
    })
    const [bubbleKeys, setBubbleKeys] = useState([0, 1])
    const keyCounterRef = useRef(0)
    const currentIndexRef = useRef(0)
    const FIRST_DELAY = 1200; // ms before showing first bubble
    const ANSWER_DELAY = 900; // ms after question before answer
    const EXIT_DURATION_MS = 350; // matches motion transition duration
    const RELOAD_GAP_MS = 750;    // extra time between exit and next intro
    const [showQuestion, setShowQuestion] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)

    const bubbleVariants = {
      initial: { y: 24, opacity: 0 },        // slide in + fade in
      animate: { y: 0, opacity: 1 },         // settled
      exit: { y: 24, opacity: 0 },           // slide down + fade out
    }

    const questionBubbleVariants = {
      initial: { y: 24, opacity: 0 },        // slide in + fade in
      animate: { y: 0, opacity: 1 },         // settled
      exit: { y: 0, opacity: 0 },            // fade out only, no movement
    }

    useEffect(() => {
        if (faqs.length === 0) return;
        
        const pickNextFaq = () => {
            const nextIndex = (currentIndexRef.current + 1) % faqs.length
            currentIndexRef.current = nextIndex
            const selectedFaq = faqs[nextIndex]
            return [selectedFaq.question, selectedFaq.answer]
        }

        const runCycle = () => {
            // 1) trigger exits (question first, then answer a beat later)
            setShowQuestion(false)
            const answerExitTimeout = setTimeout(() => setShowAnswer(false), 120)

            // 2) after exit finishes + a small gap, change phrases and re-intro with stagger
            const introTimeout = setTimeout(() => {
                const next = pickNextFaq()
                // Increment counter and update keys first to ensure AnimatePresence detects the change
                keyCounterRef.current += 1
                setBubbleKeys([keyCounterRef.current, keyCounterRef.current + 1])
                // Update the phrases - this will be used when the component remounts with the new key
                setPhrasesRand(next)

                // question enters first
                setShowQuestion(true)
                // answer follows after ANSWER_DELAY
                const answerEnterTimeout = setTimeout(() => setShowAnswer(true), ANSWER_DELAY)

                // store nested timeout ids on the closure for cleanup
                timeouts.push(answerEnterTimeout)
            }, EXIT_DURATION_MS + RELOAD_GAP_MS)

            timeouts.push(answerExitTimeout, introTimeout)
        }

        // keep references to clear on unmount
        const timeouts = []
        const interval = setInterval(runCycle, 6000) // change every 8 seconds

        return () => {
            clearInterval(interval)
            timeouts.forEach(clearTimeout)
        }
    }, [faqs]);

    useEffect(() => {
        const t1 = setTimeout(() => setShowQuestion(true), FIRST_DELAY);
        const t2 = setTimeout(() => setShowAnswer(true), FIRST_DELAY + ANSWER_DELAY);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        }
    }, []);

    return (
        <div
            className={clsx("relative mt-8", className)}
            aria-hidden={true}
        >
            <div className="w-full sm:max-w-[80%] md:max-w-[60%] lg:max-w-full absolute lg:static bottom-0 lg:bottom-auto left-1/2 lg:left-0 transform -translate-x-1/2 lg:transform-none flex flex-col gap-4 pb-4 lg:pb-0">
                <AnimatePresence initial={false} mode="wait">
                    {showQuestion && (
                        <motion.div
                            key={bubbleKeys[0]}
                            variants={questionBubbleVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="lg:absolute lg:top-[10%] lg:left-[10%] flex flex-row-reverse gap-4 pl-[20%] lg:pl-0 text-sm lg:text-md"
                        >
                            <div className="overflow-hidden size-12 flex-none rounded-full shadow-lg shadow-gray-900">
                                <Image
                                    alt="User avatar"
                                    src={avatar || humanAvatar}
                                    width={48}
                                    height={48}
                                    className="size-12 object-cover"
                                />
                            </div>
                            <div
                                className="lg:max-w-[272px] px-3 py-2 rounded-lg rounded-tr-sm bg-white shadow-xl shadow-gray-900/40 text-gray-900"
                            >
                                {phrasesRand[0]}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false} mode="wait">
                    {showAnswer && (
                        <motion.div
                            key={bubbleKeys[1]}
                            variants={bubbleVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="lg:absolute lg:top-[25%] lg:left-0 flex gap-4 pr-[20%] lg:pr-0 text-sm lg:text-md"
                        >
                            <div className="size-12 flex flex-none items-center justify-center rounded-full bg-cyan-600 shadow-lg shadow-gray-900">
                                <RobotIconSolid
                                    color="#FFFFFF"
                                    className="size-7"
                                />
                            </div>
                            <div className="lg:max-w-[272px] px-3 py-2 rounded-lg rounded-tl-sm bg-white shadow-xl shadow-gray-900/40 text-slate-900">
                                {phrasesRand[1]}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={clsx("flex justify-center -mx-4 lg:mx-0", imageContainerClassName)}>
                <Image
                    alt="App screenshot"
                    src={image}
                    width={2432}
                    height={1442}
                    className={clsx("w-[70rem] max-w-xl flex-none lg:max-w-none", imageClassName)}
                />
            </div>
        </div>
    );
}

export const Hero = ({ title, subtitle, description, primaryButton, secondaryButton, heroImage = humanHero, heroFaqs = [], rightContentClassName, imageContainerClassName, imageClassName, avatar }) => {
    return (
        <div className="relative isolate overflow-hidden bg-gray-900 -mt-24 border-none">
            <HeroGrid />

            <div className="mx-auto max-w-7xl px-6 pb-8 pt-10 lg:flex lg:px-8 lg:pt-40 lg:pb-0">
                <HeroContentLeft
                    title={ title }
                    subtitle={ subtitle }
                    description={ description }
                    primaryButton={ primaryButton }
                    secondaryButton={ secondaryButton }
                />

                <HeroContentRight
                    image={ heroImage }
                    heroFaqs={ heroFaqs }
                    className={ rightContentClassName }
                    imageContainerClassName={ imageContainerClassName }
                    imageClassName={ imageClassName }
                    avatar={avatar}
                />
            </div>
        </div>
    );
}
