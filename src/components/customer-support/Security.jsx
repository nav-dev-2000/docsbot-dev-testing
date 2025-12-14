import clsx from "clsx";
import Image from "next/image";
import { Section, SectionContent } from "@/components/elements";

import gdprImage from '@/images/gdpr.webp'
import soc2Image from '@/images/soc-2.webp'

const ExternalLink = ({ label, href, children, ...props }) => {
    return (
        <a
            href={ href }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ label }
            { ...props }
        >
            { children }
        </a>
    );
}

const Block = ({ title, content, icon, className }) => {
    const BlockIcon = icon;

    return (
        <div
            className={clsx(
                'p-6 pb-12 border border-gray-200 rounded-sm bg-white',
                className,
            )}
        >
            { icon && (
                <div className="size-9 flex items-center justify-center mb-8 rounded-lg bg-cyan-600">
                    <BlockIcon className="size-6 text-white" />
                </div>
            )}

            { title && (
                <h3 className="mb-2 text-gray-900 text-lg font-semibold">{ title }</h3>
            )}

            { content && (
                <p className="text-gray-900/60">{ content }</p>
            )}
        </div>
    );
}

export const Security = ({ title, description, data }) => {
    const theme = 'medium';

    return (
        <Section theme={ theme }>
            <SectionContent
                theme={ theme }
                title={ title }
                description={ description }
            >
                <div className="flex items-center justify-center">
                    <ExternalLink
                        href="https://trust.docsbot.ai"
                    >
                        <Image
                            alt="SOC 2 Type II certification badge"
                            className="h-24 w-auto sm:h-28"
                            priority
                            src={soc2Image}
                        />
                    </ExternalLink>

                    <ExternalLink
                        href="https://docsbot.ai/legal/gdpr"
                    >
                        <Image
                            alt="GDPR compliance badge"
                            className="h-24 w-auto sm:h-28"
                            priority
                            src={gdprImage}
                        />
                    </ExternalLink>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mt-8">
                    { data.map(( feat, index ) => {
                        const lastItem = (data.length - 1);

                        return (
                            <Block
                                key={`security-feature-${index}`}
                                title={feat.title}
                                content={feat.description}
                                icon={feat.icon}
                                className={clsx({
                                    ['rounded-t-xl md:rounded-t-none md:rounded-tl-xl lg:rounded-l-xl']: index === 0,
                                    ['md:rounded-tr-xl lg:rounded-tr-none']: index === 1,
                                    ['md:rounded-bl-xl lg:rounded-bl-none']: index === 2,
                                    ['rounded-b-xl md:rounded-b-none md:rounded-br-xl lg:rounded-r-xl']: index === lastItem,
                                })}
                            />
                        );
                    })}
                </div>
            </SectionContent>
        </Section>
    );
}