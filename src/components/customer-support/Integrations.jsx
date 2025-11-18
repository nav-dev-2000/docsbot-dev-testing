import { useRef, useEffect, useState, useMemo } from "react"
import { motion, useAnimation } from "framer-motion"
import { sourceTypes } from "@/constants/sourceTypes.constants"
import clsx from "clsx"

import { Section, SectionContent, Title, Description, Button } from "@/components/customer-support/elements"
import RobotIconSolid from "@/components/RobotIconSolid"

const RAW_INTEGRATIONS = sourceTypes
    .map((type) => ({
        id: type?.title.toLowerCase().replace(/ /g, '-'),
        name: type.title,
        Icon: type.icon,
    }))

const integrations = RAW_INTEGRATIONS.length % 2 === 0
    ? RAW_INTEGRATIONS.slice( 0, RAW_INTEGRATIONS.length - 1 )
    : RAW_INTEGRATIONS

const ConnectionDots = ({ pulseKey }) => {
    const DOTS = 4; // how many dots we render
    const baseClasses = "size-1 lg:size-2 rounded-full bg-white";

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: DOTS }).map((_, i) => (
                <motion.span
                    key={i + "-" + pulseKey}
                    className={baseClasses}
                    initial={{ opacity: 0.4 }}
                    animate={{
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                        repeat: 1,
                        repeatType: "reverse",
                        delay: i * 0.07, // stagger so it looks like signal traveling
                    }}
                />
            ))}
        </div>
    );
};

const Box = ({ content, icon, featured = false, className }) => {
    return (
        <div
            className={clsx(
                'flex items-center py-4 rounded-lg text-base',
                {
                    ['px-6 bg-white text-gray-900 font-bold']: featured,
                    ['px-4 ring-inset ring-white bg-white/10 text-white opacity-60 blur-[1.5px]']: !featured,
                },
                className,
            )}
        >
            { icon }
            { content }
        </div>
    );
}

const MotionBox = ({ content, icon, featured = false, className }) => {
    return (
        <motion.div
            layout
            initial={ false }
            animate={{
                opacity: 1,
                scale: featured ? 1 : 0.96,
                filter: featured ? "brightness(1)" : "brightness(0.9)",
                boxShadow: featured
                    ? "0px 24px 40px -8px rgba(0,0,0,0.6)"
                    : "0px 0px 0px rgba(0,0,0,0)",
                transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                },
            }}
        >
            <Box
                content={ content }
                icon={ icon }
                featured={ featured }
                className={ className }
            />
        </motion.div>
    );
}

export const Integrations = ({ title, description, primaryButton, secondaryButton }) => {
    const theme = "dark";
    const shadowBase = "w-full h-[70px] absolute left-0 z-10";

    // viewport config
    const VISIBLE_WINDOW_SIZE = integrations?.length
    const MIDDLE_SLOT = Math.floor(VISIBLE_WINDOW_SIZE / 2)
    const ROW_HEIGHT = 64 // px total per row (card height + gap). adjust if off.

    // which integration is logically selected
    const [featuredIndex, setFeaturedIndex] = useState(() =>
        Math.floor(integrations.length / 2)
    )

    const [pulseKey, setPulseKey] = useState(0)

    // animation controller for the slide
    const controls = useAnimation()

    // refs to manage timer & avoid overlapping animations
    const tickingRef = useRef(false)
    const intervalRef = useRef(null)

    // helper to wrap indexes around list length
    const wrap = (i) => {
        const len = integrations.length;
        return ((i % len) + len) % len;
    };

    // Build the visible "window" of rows where the featured item
    // is always in the middle slot.
    const windowItems = useMemo(() => {
        const items = [];

        for ( let offset = 0; offset < VISIBLE_WINDOW_SIZE; offset++ ) {
            const sourceIndex = wrap( featuredIndex - MIDDLE_SLOT + offset );

            items.push({
                ...integrations[sourceIndex],
                _sourceIndex: sourceIndex,
            });
        }

        return items;
    }, [featuredIndex]);

    useEffect(() => {
        const ROTATE_MS = 1500;      // how long each item stays "connected"
        const SLIDE_DURATION = 0.2;  // speed of the scroll animation

        function step() {
            if (tickingRef.current) return;
            tickingRef.current = true;

            controls
                .start({
                    y: -ROW_HEIGHT,
                    transition: {
                        type: "tween",
                        ease: "easeInOut",
                        duration: SLIDE_DURATION,
                    },
                })
                .then(() => {
                    setFeaturedIndex((prev) => {
                        const next = prev + 1;
                        return next >= integrations.length ? 0 : next;
                    });

                    controls.set({ y: 0 });
                    setPulseKey((k) => k + 1);
                    tickingRef.current = false;
                });
        }

        intervalRef.current = setInterval(step, ROTATE_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [controls, ROW_HEIGHT]);

    return (
        <Section theme={ theme }>
            <SectionContent
                theme={ theme }
                className="lg:flex-row lg:items-center !gap-12"
            >
                <div className="md:max-w-3xl lg:max-w-none flex flex-col gap-8 md:mx-auto">
                    <div className="flex flex-col gap-4">
                        <Title
                            theme={ theme }
                            content={ title }
                            className="md:text-center lg:!text-left"
                        />

                        <Description
                            theme={ theme }
                            content={ description }
                            className="lg:pr-8 md:text-center lg:!text-left "
                        />
                    </div>

                    {( primaryButton || secondaryButton ) && (
                        <div className="flex flex-col md:flex-row md:items-center md:justify-center lg:justify-start gap-4">
                            { primaryButton && (
                                <Button
                                    theme="opalite"
                                    variant="primary"
                                    { ...primaryButton }
                                />
                            )}

                            { secondaryButton && (
                                <Button
                                    theme="light"
                                    variant="secondary"
                                    { ...secondaryButton }
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="w-full max-w-2xl mx-auto">
                    <div className="w-full lg:w-[540px] flex items-center gap-2">
                        <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-white">
                            <RobotIconSolid
                                color="#0a91b3"
                                className="w-[24px] text-cyan-100"
                            />
                        </div>

                        <ConnectionDots pulseKey={pulseKey} />

                        <div className="max-h-[364px] lg:max-h-[32rem] overflow-hidden lg:overflow-initial relative flex flex-col grow justify-center gap-y-4">
                            <div
                                className={clsx(
                                    shadowBase,
                                    'top-0',
                                    'bg-gradient-to-b from-gray-900/100 to-gray-900/0',
                                )}
                                aria-hidden="true"
                            />

                            {/* <AnimatePresence inital={ false }> */}
                                {windowItems?.map( ( item, index ) => {
                                    const isFeatured = MIDDLE_SLOT === index;
                                    const Icon = item.Icon

                                    return (
                                        <MotionBox
                                            key={`${ item.id }-${ index }`}
                                            content={ item.name }
                                            icon={<Icon className="size-4 mr-4" />}
                                            featured={ isFeatured }
                                            className={ isFeatured ? "mx-0" : "mx-4 lg:mx-8" }
                                        />
                                    );
                                })}
                            {/* </AnimatePresence> */}

                            <div
                                className={clsx(
                                    shadowBase,
                                    'bottom-0',
                                    'bg-gradient-to-b from-gray-900/0 to-gray-900/100',
                                )}
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </div>
            </SectionContent>
        </Section>
    );
}