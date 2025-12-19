import clsx from 'clsx'
import Image from 'next/image'
import { Section, SectionContent } from '@/components/elements'
import { AskAIModels } from './call-to-action'
import { StarIcon } from '@heroicons/react/16/solid'

import aoyagi from '@/images/avatars/aoyagi.jpg'
import arturo from '@/images/avatars/testimony1.jpeg'
import avery from '@/images/avatars/testimony7.png'
import cromwell from '@/images/avatars/testimony4.jpeg'
import benic from '@/images/avatars/testimony5.jpeg'
import wingarc from '@/images/avatars/wingarc.png'
import gareth from '@/images/avatars/avatar-default.jpg'
import tejeda from '@/images/avatars/testimony8.jpeg'
import gobinda from '@/images/avatars/testimony2.jpeg'
import davids from '@/images/avatars/davids.jpeg'
import bowe from '@/images/avatars/testimony8.jpeg'
import steveburge from '@/images/avatars/steve-burge.jpg'
import zachkatz from '@/images/avatars/zach-katz.jpg'

const data = [
    [
        {
            body: 'DocsBot has perfectly understood our needs in AI bot operations and is adding new features at an incredible speed. We are truly grateful for this wonderful partnership!',
            author: {
                name: 'Yukitoshi Aoyagi',
                role: 'GM, Customer Success @ WingArc1st Inc.',
                imageUrl: aoyagi,
            },
        },
        {
            body: "Really excited to see what this can do for WordPress support. The chat responses are already saving us time, I'm looking forward to getting it integrated with Help Scout as well. Very promising, worth a watch!",
            author: {
                name: 'Jack Arturo',
                role: 'Founder and CEO of Very Good Plugins',
                imageUrl: arturo,
            },
        },
        {
            body: "DocsBot has become an essential part of my courses, assisting students with assignments, exams, and projects, while reinforcing key concepts from our lecture discussions. By adopting this technology, I've been able to offer a richer, more engaging learning experience that empowers students to take control of their own education.",
            author: {
                name: 'Brian D. Avery',
                role: 'Instructional Associate Professor',
                imageUrl: avery,
            },
        },
        {
            body: 'While there seem to be a ton of these types of "bots" getting launched all the time, few of them are so well designed from a UI and a usability perspective. The ability to train the bot on your own content library in really intuitive ways sets DocsBot apart. Love it!',
            author: {
                name: 'Matt Cromwell',
                role: 'Customer Experience at StellarWP',
                imageUrl: cromwell,
            },
        },
        {
            body: "We've been testing DocsBot and the results are really quite impressive. The answer isn't in our docs, but DocsBot did great!",
            author: {
                name: 'Steve Burge',
                role: 'PublishPress',
                imageUrl: steveburge,
            },
        },
    ],
    [
        {
            body: 'This is a product that will save time for a lot of startups and indie hackers that are usually short of staff.',
            author: {
                name: 'Igor Benić',
                role: 'Soloprenuer/Web Developer',
                imageUrl: benic,
            },
        },
        {
            body: '企業のビジネスにとって、運用ループを構築することは非常に重要です。AIボットにおいても同様であり、そこには回答を提供するだけでなく、顧客の質問を素早くキャッチして、質問の細部にまで目を通すことが含まれます。DocsBotは、AIボット運用における私たちのニーズを完璧に把握し、信じられないほどの速さで新機能を追加しています。この素晴らしいパートナーシップに心から感謝します！',
            author: {
                name: 'Yukitoshi Aoyagi',
                role: 'Customer Success 部長 @ ウイングアーク1st株式会社',
                imageUrl: wingarc,
            },
        },
        {
            body: 'DocsBot is amazing! I want to thank you for your great work on this product. I have tried a few others, and nothing compares.',
            author: {
                name: 'Gareth P.',
                role: 'IT & Marketing Manager',
                imageUrl: gareth,
            },
        },
        {
            body: "I absolutely love DocsBot, and I'm a huge proponent. In my experience, it's about 60 percent in terms of giving a REALLY good answer. That's not to say it isn't incredible, because it is, and DocsBot still saves us a ton of time. It's great.",
            author: {
                name: 'Zach Katz',
                role: 'Founder of Gravity Kit',
                imageUrl: zachkatz,
            },
        },
    ],
    [
        {
            body: "We were invested in building our own RAG, but the ease of use of your service made me stop our efforts, even though we're all technical people here! Good job.",
            author: {
                name: 'Geovanny Tejeda',
                role: 'CTO @ BotPro',
                imageUrl: tejeda,
            },
        },
        {
            body: "I have tested it in the beta phase; it's an amazing tool to create your own ai bot that will give answers based on your training materials; I mean; you can train this bot to answer your common queries.",
            author: {
                name: 'Gobinda Tarafdar',
                role: 'Senior Digital Strategist - Product Co-Ordinator',
                imageUrl: gobinda,
            },
        },
        {
            body: "I think this is a very natural application for AI. It was already the case that you could pretty much find answers to questions by searching the FAQ. This is an even better way of doing that. I believe that this will be a big area for AI, saving on frontline customer support... and I think the AI will do a really good job eliminating level one, it'll start to eating into level two.",
            author: {
                name: 'David Sacks',
                role: 'All-In Podcast, VC Craft Ventures',
                imageUrl: davids,
            },
        },
        {
            body: "Huge fan of this.. We're using it for our product Dollie, to index our knowledge base and our site to provide first line of support for our customers and help them get started faster with our product using the embedded widget.",
            author: {
                name: 'Bowe Frankema',
                role: 'Founder Dollie',
                imageUrl: bowe,
            },
        },
    ],
]

const BoxStar = () => {
    return (
        <StarIcon
            className="w-4 md:w-6 h-4 md:h-6 text-amber-400"
        />
    );
}

const Box = ({ author, role, avatar, content, className }) => {
    return (
        <div
            className={clsx(
                'w-full max-w-[320px] md:max-w-[460px] lg:max-w-[600px]',
                'flex flex-col gap-4 md:gap-8',
                'p-4 md:p-6 lg:p-8',
                'rounded-lg bg-neutral-100 text-gray-900',
                className,
            )}
        >
            <div
                className="flex items-center gap-1 md:gap-2"
                aria-hidden="true"
            >
                <BoxStar />
                <BoxStar />
                <BoxStar />
                <BoxStar />
                <BoxStar />
            </div>

            <blockquote className="text-sm/6 md:text-base/6 text-gray-900">
                <p className="text-pretty tracking-wide">{ content }</p>
            </blockquote>

            <figcaption className="flex flex-col gap-2 text-base/6 lg:text-lg/6 font-semibold">
                { avatar && (
                    <Image
                        src={ avatar }
                        alt={`${author} avatar image`}
                        className="size-10 hidden md:block rounded-full bg-gray-50"
                        aria-hidden={true}
                    />
                )}

                <span className="block">
                    { author }
                    <span className="block text-sm font-400">
                        { role }
                    </span>
                </span>
            </figcaption>
        </div>
    );
}

export const Testimonials = ({ title, description, aiPrompt }) => {
    // Different animation durations for each row (in seconds)
    // Lower duration = faster scroll
    const animationDurations = [120, 150, 135]; // Row 0: fastest, Row 1: slowest, Row 2: medium-fast

    return (
        <Section className="!pb-0">
            <SectionContent
                title={ title }
                description={ description }
            >
                <style jsx>{`
                    @keyframes scroll-right {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }
                    @keyframes scroll-left {
                        0% {
                            transform: translateX(-50%);
                        }
                        100% {
                            transform: translateX(0);
                        }
                    }
                    .scroll-row-0 {
                        animation: scroll-right ${animationDurations[0]}s linear infinite;
                    }
                    .scroll-row-1 {
                        animation: scroll-left ${animationDurations[1]}s linear infinite;
                    }
                    .scroll-row-2 {
                        animation: scroll-right ${animationDurations[2]}s linear infinite;
                    }
                `}</style>

                <div className="-mx-6 md:-mx-[40rem] flex flex-col gap-y-4 lg:gap-y-8">
                    { data?.map( ( row, index ) => {
                        // Duplicate the row items for seamless loop
                        const duplicatedRow = [...row, ...row];

                        return (
                            <div
                                key={`testimonial-row-${index}`}
                                className="overflow-hidden"
                            >
                                <div
                                    className={clsx(
                                        'w-fit flex justify-start gap-4 lg:gap-8',
                                        `scroll-row-${index}`,
                                        {
                                            ['-translate-x-1/2']: index === 1,
                                        },
                                    )}
                                >
                                    {duplicatedRow?.map( ( item, subIndex ) => {
                                        return (
                                            <Box
                                                key={`testimonial-row-${index}-col-${subIndex}`}
                                                author={ item.author.name }
                                                role={ item.author.role }
                                                avatar={ item.author.imageUrl }
                                                content={ item.body }
                                                className="flex-shrink-0"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <AskAIModels
                    className="my-16"
                    aiPrompt={aiPrompt}
                />
            </SectionContent>
        </Section>
    );
}
