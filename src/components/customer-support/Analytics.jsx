'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'

import { Section, SectionContent } from "@/components/customer-support/elements"
import { Banner } from './call-to-action'

export const Analytics = ({ title, description, data, banner }) => {
    let [tabOrientation, setTabOrientation] = useState('horizontal')

    useEffect(() => {
        let lgMediaQuery = window.matchMedia('(min-width: 1024px)');
    
        function onMediaQueryChange({ matches }) {
            setTabOrientation(matches ? 'vertical' : 'horizontal');
        }
    
        onMediaQueryChange(lgMediaQuery);
        lgMediaQuery.addEventListener('change', onMediaQueryChange);
    
        return () => {
            lgMediaQuery.removeEventListener('change', onMediaQueryChange);
        }
    }, []);

    return (
        <Section>
            <SectionContent
                theme="light"
                title={ title }
                description={ description }
                className="relative"
            >
                <TabGroup
                    className="grid grid-cols-1 items-center gap-y-2 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
                    vertical={tabOrientation === 'vertical'}
                >
                    {({ selectedIndex }) => (
                        <>
                            <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                                <TabList className="relative z-10 flex gap-x-4 lg:gap-x-0 lg:gap-y-1 sm:mx-auto lg:mx-0 px-4 sm:px-0 lg:block whitespace-nowrap lg:whitespace-normal">
                                    {data.map((feature, featureIndex) => (
                                        <div
                                            key={feature.title}
                                            className={clsx(
                                                'group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6',
                                                selectedIndex === featureIndex
                                                ? 'bg-gray-100'
                                                : '',
                                            )}
                                        >
                                            <h3>
                                                <Tab
                                                    className={clsx(
                                                        'text-base/8 lg:text-lg/8 font-semibold data-selected:not-data-focus:outline-hidden',
                                                        selectedIndex === featureIndex
                                                        ? 'text-cyan-600'
                                                        : 'text-cyan-600/60 lg:text-gray-900 lg:group-hover:text-cyan-600',
                                                    )}
                                                >
                                                    <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                                                    {feature.title}
                                                </Tab>
                                            </h3>
                                            <p
                                                className={clsx(
                                                'mt-2 hidden text-base/6 lg:block',
                                                selectedIndex === featureIndex
                                                    ? 'text-gray-900'
                                                    : 'text-gray-900/60 group-hover:text-gray-900',
                                                )}
                                            >
                                                {feature.description}
                                            </p>
                                        </div>
                                    ))}
                                </TabList>
                            </div>

                            <TabPanels className="lg:col-span-7">
                                {data.map((feature) => (
                                    <TabPanel key={feature.title} unmount={false}>
                                        <div className="relative sm:px-6 lg:hidden">
                                            <div className="absolute -inset-x-4 -top-26 -bottom-17 bg-gray-900/10 ring-1 ring-gray-900/10 ring-inset sm:inset-x-0 sm:rounded-t-xl" />

                                            <p className="relative mx-auto max-w-2xl text-base text-gray-900 sm:text-center">
                                                {feature.description}
                                            </p>
                                        </div>

                                        <div className="mt-10 w-[calc(.25rem*180)] overflow-hidden rounded-2xl bg-slate-50 shadow-xl shadow-cyan-900/20 sm:w-auto lg:mt-0 lg:w-[calc(.25rem*276)]">
                                            <Image
                                                className="w-full"
                                                src={feature.image}
                                                alt={feature.title}
                                                priority
                                                sizes="(min-width: 1024px) 67.8125rem, (min-width: 640px) 100vw, 45rem"
                                            />
                                        </div>
                                    </TabPanel>
                                ))}
                            </TabPanels>
                        </>
                    )}
                </TabGroup>

                { banner && (
                    <Banner
                        { ...banner }
                        className="mt-16"
                    />
                )}
            </SectionContent>
        </Section>
    );
}