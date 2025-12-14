import Image from "next/image"
import { Description, Section, SectionContent, Title } from "@/components/elements"
import demo from '@/images/app-demo/docsbot-personalize-widget.webp'
import demoMobile from '@/images/app-demo/docsbot-personalize-widget-mobile.webp'

export const Design = ({ title, description }) => {
    const theme = 'medium'

    return (
        <Section theme={theme}>
            <SectionContent theme={theme}>
                <div className="flex flex-col lg:flex-row-reverse lg:items-center lg:gap-16">
                    <div className="basis-1/2 grow-0 shrink-0 flex flex-col gap-y-6">
                        {title && (
                            <Title
                                theme={theme}
                                content={title}
                                className="lg:!text-left"
                            />
                        )}

                        {description && (
                            <Description
                                theme={theme}
                                content={description}
                                className="lg:!text-left"
                            />
                        )}
                    </div>

                    <div className="basis-1/2 grow-0 shrink-0 mt-8 md:mt-12 lg:mt-0">
                        <div
                            className="overflow-hidden md:w-[60rem] h-full"
                        >
                            <Image
                                src={demoMobile}
                                alt="Bot widget personalization settings (mobile)"
                                className="md:hidden"
                                aria-hidden="true"
                            />

                            <Image
                                src={demo}
                                alt="Bot widget personalization settings"
                                className="hidden md:block -translate-x-44 md:-translate-x-40 lg:translate-x-0"
                            />
                        </div>
                    </div>
                </div>
            </SectionContent>
        </Section>
    )
}
