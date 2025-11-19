'use client'

import { useEffect, useState, useRef } from 'react'
import clsx from 'clsx'
import { Button } from '@/components/customer-support/elements'
import Image from 'next/image';
import humanHero from '@/images/app-demo/docsbot-hero-human.webp'
import humanAvatar from '@/images/app-demo/docsbot-avatar-human.webp'
import RobotIconSolid from '../RobotIconSolid'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQPageJsonLd } from 'next-seo'

const HeroGrid = () => {
    return (
        <svg
            aria-hidden="true"
            className="hidden lg:block absolute inset-0 -z-10 size-full stroke-gray-700 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
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

const Title = ({ content, className }) => {
    const clone = content?.toString().trim().split(/\s+/);
    const clonedWord = clone?.[0] || '';
    const restOfTitle = clone?.slice(1).join(' ') || '';

    return (
        <h1 className={clsx('relative text-pretty text-5xl font-semibold tracking-tight text-neutral-50 sm:text-7xl', className)}>
            <span
                className="relative text-transparent [-webkit-text-stroke:1px_#14b8a6] before:content-[attr(data-text)] before:absolute before:top-1 before:left-1 before:inset-0 before:text-neutral-50 before:[-webkit-text-stroke:0]"
                data-text={ clonedWord }
            >
                { clonedWord }
            </span>{" "}
            { restOfTitle }
        </h1>
    );
}

const Subtitle = ({ content, className }) => {
    return (
        <div className={clsx( 'text-base/7 font-semibold text-teal-500', className )}>
            { content }
        </div>
    );
}

const Description = ({ content, className }) => {
    return (
        <p className={clsx( 'text-pretty text-lg text-gray-500 sm:text-xl/8', className )}>
            { content }
        </p>
    );
}

const heroFaqs = [
    {
        question: 'How can DocsBot improve my customer support?',
        answer:
            'DocsBot resolves as much as 86% of repeat questions automatically, giving customers instant answers and reducing ticket load.'
    },
    {
        question: 'What can DocsBot do for my support team?',
        answer:
            'It acts as an always-on teammate that pulls from your docs, knowledge bases, and product content to deliver accurate responses and free your team for higher-value work.'
    },
    {
        question: 'How does DocsBot make customer success better?',
        answer:
            'It provides fast, consistent answers across all channels, improving satisfaction and helping customers stay productive without waiting for human assistance.'
    },
    {
        question: 'Why should I use DocsBot for support automation?',
        answer:
            'It expands support capacity without hiring, handles routine questions around the clock, and integrates directly into your existing workflows.'
    },
    {
        question: "What's the benefit of using AI in customer support?",
        answer:
            'It gives hours back to your team by handling common questions instantly while ensuring your human agents can focus on complex issues that require expertise.'
    },
    {
        question: 'Can DocsBot reduce my support costs?',
        answer:
            'It cuts operational costs by automating high-volume inquiries and reducing the need for additional support staff as your customer base grows.'
    },
    {
        question: 'Does DocsBot work with my existing tools?',
        answer:
            'It connects with help desks, chat widgets, and internal systems so you can deploy AI assistance without changing platforms.'
    },
    {
        question: "How accurate is DocsBot's AI?",
        answer:
            'Accuracy comes from using your own documentation, guides, and product knowledge, ensuring answers match your voice, policies, and product behavior.'
    },
]

const HeroContentLeft = ({ title, subtitle, description, primaryButton, secondaryButton }) => {
    return (
        <div className="mx-auto max-w-2xl lg:mx-0 lg:shrink-0 lg:pt-8">
            <Subtitle
                content={ subtitle }
                className="mt-24 sm:mt-32 lg:mt-16"
            />

            <Title
                content={ title }
                className="mt-2 lg:mt-10"
            />

            <Description
                content={ description }
                className="mt-8"
            />
            
            {( primaryButton || secondaryButton ) && (
                <div className="flex flex-col lg:flex-row items-center gap-y-4 lg:gap-y-0 lg:gap-x-6 mt-8 lg:mt-10">
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

const HeroContentRight = ({ image }) => {
    const faqs = heroFaqs

    const [phrasesRand, setPhrasesRand] = useState(() => [faqs[0].question, faqs[0].answer])
    const [bubbleKeys, setBubbleKeys] = useState([0, 1])
    const keyCounterRef = useRef(0)
    const FIRST_DELAY = 1200; // ms before showing first bubble
    const ANSWER_DELAY = 900; // ms after question before answer
    const EXIT_DURATION_MS = 350; // matches motion transition duration
    const RELOAD_GAP_MS = 250;    // extra time between exit and next intro
    const RELOAD_STAGGER_MS = 300; // delay between question intro and answer intro
    const [showQuestion, setShowQuestion] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)

    const bubbleVariants = {
      initial: { y: 24, opacity: 0 },        // slide in + fade in
      animate: { y: 0, opacity: 1 },         // settled
      exit: { y: 24, opacity: 0 },           // slide down + fade out
    }

    useEffect(() => {
        const pickRandomFaq = () => {
            const idx = Math.floor(Math.random() * faqs.length)
            const selectedFaq = faqs[idx]
            return [selectedFaq.question, selectedFaq.answer]
        }

        const runCycle = () => {
            // 1) trigger exits (question first, then answer a beat later)
            setShowQuestion(false)
            const answerExitTimeout = setTimeout(() => setShowAnswer(false), 120)

            // 2) after exit finishes + a small gap, change phrases and re-intro with stagger
            const introTimeout = setTimeout(() => {
                const next = pickRandomFaq()
                // Increment counter and update keys first to ensure AnimatePresence detects the change
                keyCounterRef.current += 1
                setBubbleKeys([keyCounterRef.current, keyCounterRef.current + 1])
                // Update the phrases - this will be used when the component remounts with the new key
                setPhrasesRand(next)

                // question enters first
                setShowQuestion(true)
                // answer follows after a small stagger
                const answerEnterTimeout = setTimeout(() => setShowAnswer(true), RELOAD_STAGGER_MS)

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
    }, []);

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
            className="relative mt-8"
            aria-hidden={true}
        >
            <div className="w-full sm:max-w-[80%] md:max-w-[60%] lg:max-w-full absolute lg:static bottom-0 lg:bottom-auto left-1/2 lg:left-0 transform -translate-x-1/2 lg:transform-none flex flex-col gap-4 pb-4 lg:pb-0">
                <AnimatePresence initial={false} mode="wait">
                    {showQuestion && (
                        <motion.div
                            key={bubbleKeys[0]}
                            variants={bubbleVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="lg:absolute lg:top-[10%] lg:left-[10%] flex flex-row-reverse gap-4 pl-[20%] lg:pl-0 text-sm lg:text-md"
                        >
                            <div className="overflow-hidden size-12 flex-none rounded-full shadow-lg shadow-gray-900">
                                <Image
                                    alt="User avatar"
                                    src={humanAvatar}
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

            <div className="flex justify-center -mx-4 lg:mx-0">
                <Image
                    alt="App screenshot"
                    src={image}
                    width={2432}
                    height={1442}
                    className="w-[70rem] max-w-xl flex-none lg:max-w-none"
                />
            </div>
        </div>
    );
}

export const Hero = ({ title, subtitle, description, primaryButton, secondaryButton, heroImage = humanHero }) => {
    return (
        <>
            <FAQPageJsonLd
                mainEntity={heroFaqs.map((faq) => ({
                    questionName: faq.question,
                    acceptedAnswerText: faq.answer,
                }))}
            />
            <div className="relative isolate overflow-hidden bg-gray-900 -mt-24">
                <HeroGrid />

                <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 lg:flex lg:px-8 lg:pt-40 lg:pb-0">
                    <HeroContentLeft
                        title={ title }
                        subtitle={ subtitle }
                        description={ description }
                        primaryButton={ primaryButton }
                        secondaryButton={ secondaryButton }
                    />

                    <HeroContentRight
                        image={ heroImage }
                    />
                </div>
            </div>
        </>
    );
}
