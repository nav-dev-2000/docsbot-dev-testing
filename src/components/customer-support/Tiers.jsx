import { Fragment } from "react"
import clsx from "clsx"

import { Section, SectionContent, Button, Arrow } from "@/components/elements"
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/16/solid'

const defaultData = [
  {
    id: 'tier-one',
    name: 'Tier 1 Support',
    title: 'Fully Automated. Always Improving.',
    description: "DocsBot's AI support bots automate the repetitive tickets that slow your team down. But they're not static—they learn from your human support agents, continuously improving based on how your team handles complex cases.",
    featured: false,
    highlights: [
      'Deflect up to 80% of FAQs and common tickets automatically.',
      'Deliver instant, on-brand answers across channels and in any language.',
      'Seamless human handoff when needed—no dead ends.',
      'Learns from human interactions and evolving documentation.',
    ],
  },
  {
    id: 'tier-two',
    name: 'Tier 2 Support',
    title: 'Make Your People More Efficient.',
    description: 'DocsBot becomes a real-time assistant for your Tier 2 team—surfacing accurate, contextual suggestions to help agents respond faster and with full confidence.',
    featured: true,
    highlights: [
      'Suggests replies based on docs, past tickets, and customer intent.',
      'Lives inside the tools your team already uses: Zendesk, Slack, HelpScout, Freshdesk.',
      'Reduces time spent searching, so agents focus on resolving.',
      'Captures feedback and trends to improve Tier 1 automation.',
    ],
  },
]

export const Tiers = ({ title, description, data = defaultData }) => {
    const theme = 'dark';

    return (
        <Section theme={ theme }>
            <SectionContent
                theme={ theme }
                title={ title }
                description={ description }
            >
                { data && (
                    <div className="relative mx-auto grid max-w-xl grid-cols-1 gap-y-8 md:mx-0 lg:mt-16 lg:max-w-none lg:grid-cols-2">
                        { data?.map(( tier, index ) => (
                            <Fragment key={ tier.id }>
                                <div
                                    data-featured={ tier.featured ? 'true' : undefined}
                                    className={clsx(
                                        tier.featured
                                            ? 'z-10 bg-white shadow-xl outline outline-1 outline-gray-900/10'
                                            : 'bg-white/10 outline outline-1 -outline-offset-1 outline-white/40 lg:bg-transparent lg:pb-14 lg:outline-0',
                                        'group/tier relative rounded-2xl',
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            'p-6 lg:pt-12 xl:p-10 xl:pt-14',
                                            {
                                                ['xl:pb-8']: index % 2 === 1
                                            },
                                        )}
                                    >
                                        <h3
                                            id={`tier-${ tier.id }`}
                                            className="font-bold text-cyan-600"
                                        >
                                            { tier.name }
                                        </h3>

                                        <p
                                            className={clsx(
                                                'mt-2 text-2xl/7 font-bold',
                                                {
                                                    ['text-gray-900']: tier.featured,
                                                    ['text-neutral-50']: !tier.featured,
                                                },
                                            )}
                                        >
                                            { tier.title }
                                        </p>

                                        <p
                                            className={clsx(
                                                'mt-8 opacity-80',
                                                {
                                                    ['text-gray-900']: tier.featured,
                                                    ['text-neutral-50']: !tier.featured,
                                                },
                                            )}
                                        >
                                            { tier.description }
                                        </p>

                                        <div className="mt-8 flow-root">
                                            <ul
                                                role="list"
                                                className={clsx(
                                                    'divide-y border-t',
                                                    {
                                                        ['divide-gray-900/10 border-gray-900/10 text-gray-900']: tier.featured,
                                                        ['divide-white/10 border-white/10 text-neutral-50']: !tier.featured,
                                                    },
                                                )}
                                            >
                                                { tier.highlights.map(( mainFeature ) => (
                                                    <li key={ mainFeature } className="flex gap-x-3 py-4">
                                                        <CheckIcon
                                                            aria-hidden="true"
                                                            className="h-4 w-4 flex-none text-cyan-600"
                                                        />
                                                        { mainFeature }
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {index % 2 === 1 && (
                                        <div className="flex justify-center px-6 xl:px-10 pb-8 xl:pb-14">
                                            <Button
                                                href="/register"
                                                label="Become an AI Hero"
                                                theme="opalite"
                                                variant="primary"
                                                className="flex-1"
                                            />
                                        </div>
                                    )}
                                </div>

                                {(index < data.length - 1) && (
                                    <div className="lg:hidden flex flex-col items-center">
                                        <div className="text-white text-base/8 font-medium tracking-wider">
                                            Escalating To
                                        </div>

                                        <ChevronDownIcon
                                            className="size-12 -mt-2 text-white animate-bounce"
                                        />
                                    </div>
                                )}
                            </Fragment>
                        ))}

                        <div
                            className="hidden lg:block absolute z-10 -top-16 left-1/2 -translate-x-1/2 text-white"
                            aria-hidden="true"
                        >
                            <div className="relative">
                                <div className="w-[140%] absolute left-1/2 -translate-x-1/2 -translate-y-2 text-cyan-600 font-semibold text-center">
                                    Escalating To
                                </div>

                                <Arrow
                                    fill="#0891B2"
                                    className="size-20 -rotate-180 scale-x-[-1]"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </SectionContent>
        </Section>
    );
}
