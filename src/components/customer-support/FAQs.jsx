import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Section, SectionContent } from "@/components/customer-support/elements";
import { Banner } from "./call-to-action";
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'

export const Faq = ({ title, description, data, banner }) => {
    return (
        <Section>
            <SectionContent
                title={title}
                description={description}
            >
                <div className="lg:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {data?.map((faq) => (
                        <Disclosure key={faq.question} className="group" as="div">
                            <div>
                                <DisclosureButton className="px-8 py-6 group-data-[open]:rounded-t-lg group-[:not([data-open])]:rounded-lg flex w-full items-start justify-between text-left text-gray-900 bg-gray-100">
                                    <span className="text-base/7 font-semibold">{faq.question}</span>
                                    <span className="ml-6 flex h-7 items-center">
                                        <PlusSmallIcon aria-hidden="true" className="size-6 group-data-[open]:hidden" />
                                        <MinusSmallIcon aria-hidden="true" className="size-6 group-[:not([data-open])]:hidden" />
                                    </span>
                                </DisclosureButton>
                            </div>

                            <DisclosurePanel as="div" className="px-8 pb-6 rounded-b-lg bg-gray-100 text-gray-600">
                                <p className="text-base/7">{faq.answer}</p>
                            </DisclosurePanel>
                        </Disclosure>
                    ))}
                </div>

                { banner && (
                    <Banner
                        { ...banner }
                        className="mt-16"
                    />
                )}
            </SectionContent>
        </Section>
    )
}
