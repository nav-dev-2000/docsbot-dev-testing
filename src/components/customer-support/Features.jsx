'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'

import { Section, SectionContent } from '@/components/elements'
import { Banner } from './call-to-action'

const Feature = ({ feature, isActive, className, ...props }) => {
    return (
        <div
            className={clsx(
                'lg:px-6 lg:py-8 lg:rounded-2xl',
                {
                    ['lg:bg-gray-100']: isActive,
                    ['opacity-75 hover:opacity-100']: !isActive,
                },
                className,
            )}
            {...props}
        >
            <div className={clsx(
                'flex items-center gap-2',
                'sm:flex-col sm:items-start sm:gap-4',
            )}>
                <div
                    className={clsx(
                        'w-9 flex-none rounded-lg',
                        {
                            ['bg-cyan-600']: isActive,
                            ['bg-gray-400']: !isActive,
                        },
                    )}
                >
                    <svg aria-hidden="true" className="h-9 w-9" fill="none">
                        <feature.icon />
                    </svg>
                </div>

                <h3
                    className={clsx(
                        'flex-1 text-lg/6 sm:text-lg/8 font-semibold',
                        isActive ? 'text-cyan-600' : 'text-gray-900/80',
                    )}
                >
                    {feature.name}
                </h3>
            </div>

            <p className="mt-2 text-base/6 text-gray-900">
                {feature.summary}
            </p>
        </div>
    );
}

const FeaturesMobile = ({ features }) => {
    return (
        <div
            className="w-full flex flex-col gap-8 mx-auto lg:hidden"
            aria-hidden="true"
        >
            {features.map((feature) => (
                <div
                    key={feature.summary}
                    className={clsx(
                        'flex flex-col gap-4',
                        'sm:p-6 sm:border sm:border-gray-200 sm:rounded-2xl',
                    )}
                >
                    <Feature
                        feature={feature}
                        isActive
                    />

                    {feature.animation && (
                        <div className="w-full h-[calc(52.75rem/2)] sm:rounded-xl sm:overflow-hidden">
                            <feature.animation />
                        </div>
                    )}

                    {!feature.animation && (
                        <Image
                            src={feature.image}
                            alt={`Animation displaying ${feature.name}`}
                            sizes="52.75rem"
                            className="w-full rounded-xl"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

const FeaturesDesktop = ({ features }) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    return (
        <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className="hidden lg:mt-10 lg:block"
        >
            <>
                <TabList className="grid grid-cols-3 gap-x-8">
                    {features.map((feature, featureIndex) => (
                        <Feature
                            key={feature.summary}
                            feature={{
                                ...feature,
                                name: (
                                    <Tab className="outline-none">
                                        <span className="absolute inset-0" />
                                        {feature.name}
                                    </Tab>
                                ),
                            }}
                            isActive={featureIndex === selectedIndex}
                            className="relative"
                        />
                    ))}
                </TabList>

                <TabPanels className="relative mt-4 overflow-hidden rounded-2xl bg-gray-100 px-14 py-16 xl:px-16">
                    <div className="-mx-5 flex">
                        {features.map((feature, featureIndex) => (
                            <TabPanel
                                static
                                key={feature.summary}
                                onClick={() => setSelectedIndex(featureIndex)}
                                className={clsx(
                                    "px-5 transition duration-500 ease-in-out cursor-pointer data-selected:not-data-focus:outline-hidden",
                                    featureIndex !== selectedIndex && "opacity-60",
                                )}
                                style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
                                aria-hidden={featureIndex !== selectedIndex}
                            >
                                <div className={clsx(
                                    "w-[calc(.25rem*211)] overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-slate-900/5 ring-slate-500/10",
                                    "transition-all duration-300 ease-in-out",
                                    "hover:ring-2 hover:ring-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.015]"
                                )}>
                                    {feature.animation && (
                                        <div className="w-[52.75rem] h-[calc(52.75rem/2)]">
                                            <feature.animation />
                                        </div>
                                    )}

                                    {!feature.animation && (
                                        <Image
                                            className="w-full"
                                            src={feature.image}
                                            alt={`Animation representing ${feature.name}`}
                                            sizes="52.75rem"
                                        />
                                    )}
                                </div>
                            </TabPanel>
                        ))}
                    </div>
                </TabPanels>
            </>
        </TabGroup>
    );
}

export const Features = ({ title, description, data, banner }) => {
    return (
        <Section>
            <SectionContent
                title={title}
                description={description}
            >
                { data && (
                    <>
                        <FeaturesMobile features={data} />
                        <FeaturesDesktop features={data} />
                    </>
                )}
                
                { banner && (
                    <Banner
                        { ...banner }
                        className="sm:mt-4 md:mt-8 lg:mt-16"
                    />
                )}
            </SectionContent>
        </Section>
    );
}