import clsx from "clsx"
import { Section, SectionContent } from "@/components/customer-support/elements"
import { ChevronRightIcon } from "@heroicons/react/20/solid"

const Block = ({ title, content, icon, className }) => {
    const BlockIcon = icon;

    return (
        <div
            className={clsx(
                'h-full p-6 pb-12 rounded-xl bg-gray-100',
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

const BlockWrapper = ({ title, description, icon, blockClassName, hasArrow }) => {
    return (
        <div className="relative flex flex-col">
            <Block
                title={title}
                content={description}
                icon={icon}
                className={blockClassName}
            />

            {hasArrow && (
                <ChevronRightIcon
                    className="absolute size-10 top-1/2 left-full -translate-y-1/2 animate-bounce text-gray-900"
                />
            )}
        </div>
    )
}

export const Overview = ({title, description, data}) => {
    const lastItem = data.length - 1

    return (
        <Section>
            <SectionContent
                title={title}
                description={description}
            >
                <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8"
                >
                    {data.map((item, index) => {
                        return (
                            <BlockWrapper
                                key={`overview-feature-${index}`}
                                title={item.title}
                                description={item.description}
                                icon={item.icon}
                                hasArrow={lastItem !== index ? true : false}
                            />
                        );
                    })}
                </div>
            </SectionContent>
        </Section>
    )
}
