import clsx from "clsx"
import { Section, SectionContent } from "@/components/elements"
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid"

const Block = ({ title, content, icon, className }) => {
    const BlockIcon = icon;

    return (
        <div
            className={clsx(
                'flex flex-col gap-6 p-6 rounded-xl bg-gray-100',
                'md:h-full md:pb-12',
                className,
            )}
        >
            <div
                className={clsx(
                    'flex flex-row items-center gap-4',
                    'md:flex-col md:items-start lg:gap-8',
                )}
            >
                { icon && (
                    <div className="size-9 flex items-center justify-center rounded-lg bg-cyan-600">
                        <BlockIcon className="size-6 text-white" />
                    </div>
                )}

                { title && (
                    <h3 className="text-gray-900 text-lg font-semibold">
                        { title }
                    </h3>
                )}
            </div>

            { content && (
                <p className="text-gray-900/60 text-pretty">{ content }</p>
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
                <>
                    <ChevronDownIcon
                        className="size-10 md:hidden mx-auto text-gray-900 animate-bounce"
                    />
                    <ChevronRightIcon
                        className="size-10 absolute top-1/2 left-full -translate-y-1/2 hidden md:block text-gray-900 animate-bounce"
                    />
                </>
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
                <div className="grid grid-cols-1 md:grid-cols-3 md:gap-12 md:mt-6">
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
