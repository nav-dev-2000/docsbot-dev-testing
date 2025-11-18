import { Section, SectionContent } from './Commons'
import { AcademicCapIcon, ChartBarIcon, CloudArrowUpIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'

const features = [
    {
        name: 'Upload Your Docs & Sources',
        description: 'Add your help center, docs, PDFs, URLs, videos, and more.',
        icon: CloudArrowUpIcon,
    },
    {
        name: 'DocsBot Trains Itself Automatically',
        description: 'Our AI instantly understands and organizes your content—no training required.',
        icon: AcademicCapIcon,
    },
    {
        name: 'Embed Anywhere',
        description: 'Embed your AI agent anywhere—Slack, Zendesk, WordPress, or via API.',
        icon: RocketLaunchIcon,
    },
    {
        name: 'Refine & Grow Over Time',
        description: 'Get usage insights, feedback, and CSAT tracking out of the box.',
        icon: ChartBarIcon,
    },
]

export const HowItWorks = () => {
    return (
        <Section>
            <SectionContent
                title="How It Works"
                description="With DocsBot, Being Your Team's AI Hero is Easy"
            >
                <div className="mx-auto max-w-2xl lg:mt-10 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16">
                                <dt className="text-base/7 font-semibold text-gray-900">
                                    <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-cyan-600">
                                        <feature.icon aria-hidden="true" className="size-6 text-white" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base/7 text-gray-600">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </SectionContent>
        </Section>
    )
}
