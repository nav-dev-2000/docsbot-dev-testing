import { Button, Highlights, Section, SectionContent, SplitSection } from "@/components/elements"
import {
  BotAutomation,
  SupportLead,
  DataConnection,
  DeepResearch
} from '@/components/customer-support/animations'
import {
  UserGroupIcon,
  HeartIcon,
  CloudArrowUpIcon,
  ArrowDownOnSquareStackIcon,
  LockClosedIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid'

const data = [
    {
        theme: 'light',
        title: 'Customer Support Bots',
        subtitle: 'Set Your Customer Support Apart',
        description: 'Move your customer support from reactive to proactive with AI-powered bots that deliver instant, accurate responses 24/7. Ensure consistent quality while reducing resolution times and support costs.',
        highlights: [
            {
                icon: ArrowDownOnSquareStackIcon,
                title: 'Eliminate Repetitive Work',
                content: 'Let AI handle routine questions so your team can focus on complex, high-value issues that require human expertise.',
            },
            {
                icon: UserGroupIcon,
                title: 'Improve Efficiency',
                content: 'Resolve more inquiries on first contact with accurate AI responses and seamless human handoffs.',
            },
            {
                icon: HeartIcon,
                title: 'Increase Agent Satisfaction',
                content: "Remove tedious tasks and empower your team to do meaningful problem-solving every day.",
            },
        ],
        buttonPrimary: {
            label: "Enhance Your Support Quality",
            href: "/register",
        },
        buttonSecondary: {
            label: "Learn More →",
            href: "/customer-support",
        },
        animation: BotAutomation,
        background: 'bg-gradient-to-r from-cyan-400 to-cyan-900',
        className: 'lg:pt-18 pb-0 md:pb-16',
    },
    {
        theme: 'medium',
        title: 'Pre-Sales Chat',
        subtitle: 'Turn Visitors Into Qualified Leads',
        description: 'Capture more leads by engaging every visitor instantly with AI sales agents trained on your knowledge base and sales playbook.',
        highlights: [
            {
                icon: ArrowDownOnSquareStackIcon,
                title: '10× More Leads',
                content: 'Respond to inquiries within seconds. Our helpdesk data shows fast answers dramatically increase lead capture rates.',
            },
            {
                icon: UserGroupIcon,
                title: 'Always Accurate',
                content: 'Deliver consistent, on-brand responses with chatbots trained on your product details, documentation, messaging, pricing, and offers.',
            },
            {
                icon: HeartIcon,
                title: 'Scale Your Sales Team',
                content: 'Handle multiple conversations at once while giving every visitor a high-quality presales experience that builds trust and drives conversions.',
            },
        ],
        buttonPrimary: {
            label: "Get Instant Answers",
            href: "/register",
        },
        animation: SupportLead,
        background: 'bg-gradient-to-r from-cyan-700 to-cyan-900',
        className: 'pb-0 md:pb-16',
    },
    {
        theme: 'light',
        title: 'Internal Knowledge Access',
        subtitle: 'Your Business Knowledge On Demand',
        description: 'Transform how your team finds information with AI-powered knowledge retrieval. Eliminate hours spent searching through documents, systems, and databases with bots that deliver answers instantly.',
        highlights: [
            {
                icon: CloudArrowUpIcon,
                title: 'Knowledge Retrieval',
                content: 'Surface relevant information instantly from your internal documentation without digging through multiple tools or data sources.',
            },
            {
                icon: LockClosedIcon,
                title: 'Secure Access',
                content: 'Protect sensitive information with enterprise-grade security while giving authorized team members seamless access.',
            },
            {
                icon: AcademicCapIcon,
                title: 'Continuous Learning',
                content: 'Your bot automatically stays current as documentation evolves, ensuring teams always have the latest, most accurate knowledge.',
            },
        ],
        buttonPrimary: {
            label: "Boost Productivity",
            href: "/register",
        },
        buttonSecondary: {
            label: "Learn More →",
            href: "/internal-knowledge",
        },
        animation: DataConnection,
        background: 'bg-gradient-to-tr from-teal-200 to-cyan-300',
    },
    {
        theme: 'medium',
        title: 'Research Assistant',
        subtitle: 'Verified, Source-Aware Insights',
        subtitleClassName: '!text-wrap',
        description: 'Transform your research process with AI-powered document analysis, structured reporting, and our new Deep Research agent. Combine your DocsBot knowledge base with live web search and Code Interpreter to surface cited insights in minutes.',
        highlights: [
            {
                icon: MagnifyingGlassIcon,
                title: 'Instant Reference Discovery',
                content: 'Quickly surface relevant citations, data points, and research materials from your document library saving hours manually searching and cross-referencing.',
            },
            {
                icon: DocumentChartBarIcon,
                title: 'Comprehensive Analysis',
                content: 'Get detailed insights and identify patterns, relationships, and findings across sources.',
            },
            {
                icon: ArrowPathIcon,
                title: 'Content Repurposing',
                content: 'Turn existing content into new formats and insights. Extract key data to create summaries, presentations, reports, or training materials.',
            },
        ],
        buttonPrimary: {
            label: "Accelerate Your Research",
            href: "/register",
        },
        buttonSecondary: {
            label: "Learn More →",
            href: "/article/deep-research-is-now-available-on-docsbot",
        },
        animation: DeepResearch,
        background: 'bg-gradient-to-r from-teal-300 to-cyan-700',
        className: 'pb-0 md:pb-16',
    },
]

export const UseCases = ({ title, subtitle, description, ...props }) => {
    const theme = "light"

    return (
        <Section
            theme={theme}
            className="!gap-0 !lg:gap-0 pb-0 lg:pb-0"
            { ...props }
        >
            <SectionContent
                theme={theme}
            >
                <div className="max-w-4xl mx-auto text-center">
                    { title && (
                        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                            {title}
                        </h2>
                    )}
                    { subtitle && (
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            {subtitle}
                        </p>
                    )}
                    { description && (
                        <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
                            {description}
                        </p>
                    )}
                </div>
            </SectionContent>

            {data.map((section, index) => {
                return (
                    <SplitSection
                        key={`use-case-${index}`}
                        theme={section.theme}
                        title={section.title}
                        subtitle={section.subtitle}
                        subtitleClassName={section.subtitleClassName}
                        description={section.description}
                        cover={section.animation}
                        coverBackground={section.background}
                        isReversed={index % 2 !== 0 ? true : false}
                        className={section.className}
                    >
                        <Highlights data={section.highlights} />

                        {(section.buttonPrimary || section.buttonSecondary) && (
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mt-8">
                                {section.buttonPrimary && (
                                    <Button
                                        theme="opalite"
                                        variant="primary"
                                        {...section.buttonPrimary}
                                    />
                                )}

                                {section.buttonSecondary && (
                                    <Button
                                        theme="dark"
                                        variant="secondary"
                                        {...section.buttonSecondary}
                                    />
                                )}
                            </div>
                        )}
                    </SplitSection>
                )
            })}
        </Section>
    )
}
