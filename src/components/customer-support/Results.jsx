import { motion, useReducedMotion } from "framer-motion"
import clsx from "clsx"

import { Section, SectionContent } from "@/components/customer-support/elements";

const isHexColor = ( str ) => {
    return /^#([0-9A-F]{3}){1,2}$/i.test( str );
}

const Box = ({ title, description, note, background, foreground, className }) => {
    const shouldReduceMotion = useReducedMotion();
    
    const cssBox = {
        size: 'lg:flex-1',
        shape: 'flex flex-col-reverse justify-between rounded-lg sm:flex-row-reverse sm:items-end lg:flex-col lg:items-start',
        spacing: 'gap-x-16 gap-y-6 p-4',
        fill: 'bg-gray-50',
        text: 'text-gray-900',
    }

    if ( !title && !description && !note ) {
        return null;
    }

    if ( isHexColor( background ) ) {
        cssBox.fill = `bg-[${background}]`;
    } else if ( background ) {
        cssBox.fill = `bg-${background}`;
    }

    if ( isHexColor( foreground ) ) {
        cssBox.text = `text-[${foreground}]`;
    } else if ( foreground ) {
        cssBox.text = `text-${foreground}`;
    }

    const boxVariants = {
        offscreen: {
            y: 64,
            opacity: 0,
            scale: 0.96,
            filter: 'blur(8px)',
            transition: {
                type: 'tween',
                duration: 0.25,
                ease: [0.33, 1, 0.68, 1],
            },
        },
        onscreen: {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                type: 'spring',
                bounce: 0.28,
                duration: 0.7,
            },
        },
    }

    if ( shouldReduceMotion ) {
        return (
            <div
                className={clsx(
                    'overflow-hidden',
                    cssBox.size,
                    cssBox.shape,
                    cssBox.spacing,
                    cssBox.fill,
                    className
                )}
            >
                { note && (
                    <p className={clsx('text-3xl font-bold tracking-tight', cssBox.text)}>{ note }</p>
                )}
                {( title || description ) && (
                    <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                        { title && (
                            <p className={clsx('text-lg font-semibold tracking-tight', cssBox.text)}>{ title }</p>
                        )}
                        { description && (
                            <p className={clsx('mt-2 text-base/7 opacity-80', cssBox.text)}>{ description }</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <motion.div
            className={clsx(
                'overflow-hidden',
                cssBox.size,
                cssBox.shape,
                cssBox.spacing,
                cssBox.fill,
                className
            )}
            variants={boxVariants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{
                once: true,
                amount: 0.5,
            }}
        >
            { note && (
                <p className={clsx('text-3xl font-bold tracking-tight lg:text-4xl', cssBox.text)}>{ note }</p>
            )}
            {( title || description ) && (
                <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
                    { title && (
                        <p className={clsx('text-lg font-semibold tracking-tight', cssBox.text)}>{ title }</p>
                    )}
                    { description && (
                        <p className={clsx('mt-2 text-base/7 opacity-80', cssBox.text)}>{ description }</p>
                    )}
                </div>
            )}
        </motion.div>
    );
}

export const Results = ({ title, description, data }) => {
    return (
        <Section>
            <SectionContent
                title={ title }
                description={ description }
            >
                { data?.length > 0 && (
                    <div
                        className={clsx(
                            'lg:max-w-none',
                            'flex flex-col lg:flex-row lg:items-end gap-8',
                            'lg:mt-12',
                        )}
                    >
                        { data?.map(( item, index ) => {
                            return (
                                <Box
                                    key={ `results-data-${index}` }
                                    title={ item.title }
                                    description={ item.description }
                                    note={ item.note }
                                    { ...( item.background && { background: item.background }) }
                                    { ...( item.foreground && { foreground: item.foreground }) }
                                    { ...( item.className && { className: item.className }) }
                                />
                            );
                        }) }
                    </div>
                )}

                { !data && (
                    <div className="p-4 mt-16 rounded-md bg-rose-500">
                        <p className="text-neutral-50 text-sm font-bold">This component requires <code>data</code> to display.</p>
                    </div>
                )}
            </SectionContent>
        </Section>
    )
}
