import { Fragment, useState, useRef } from "react"
import { TabItem } from "./TabItem"
import { TabPanel } from "./TabPanel"

export const Tabs = ({ data, ariaLabel, ...props }) => {
    const [activeTab, setActiveTab] = useState(0)
    const tabRefs = useRef([])

    const handleKeyDown = (e, index) => {
        let newIndex = index

        switch (e.key) {
            case 'ArrowRight':
                newIndex = (index + 1) % data.length
                break
            case 'ArrowLeft':
                newIndex = (index - 1 + data.length) % data.length
                break
            case 'Home':
                newIndex = 0
                break
            case 'End':
                newIndex = data.length - 1
                break
            default:
                return
        }

        e.preventDefault()
        setActiveTab(newIndex)
        tabRefs.current[newIndex]?.focus()
    }

    return (
        <Fragment>
            <div
                role="tablist"
                className="flex flex-col md:flex-row md:flex-wrap md:items-center lg:justify-center gap-3 mb-8"
                aria-label={ariaLabel}
            >
                {data.map((item, index) => {
                    return (
                        <TabItem
                            key={`use-case-tab-${index}`}
                            id={`use-case-tab-${index}`}
                            label={item.title}
                            isActive={index === activeTab}
                            ref={(el) => (tabRefs.current[index] = el)}
                            onClick={() => setActiveTab(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    )
                })}
            </div>

            {data.map((item, index) => {
                return (
                    <TabPanel
                        key={`use-case-panel-${index}`}
                        id={`use-case-tab-${index}`}
                        isActive={index === activeTab}
                    >
                        <div className="lg:ml-auto lg:pr-4 lg:pt-4">
                            <div className="lg:max-w-lg">
                                {item.title && (
                                    <h3 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
                                        {item.title}
                                    </h3>
                                )}
                                {item.subtitle && (
                                    <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                                        {item.subtitle}
                                    </p>
                                )}
                                {item.description && (
                                    <p className="mt-6 text-lg/8 text-gray-600">
                                        {item.description}
                                    </p>
                                )}
                                {item.highlights && (
                                    <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                                        {item.highlights.map((subItem, subIndex) => {
                                            return (
                                                <div key={`use-case-highlight-${index}-item-${subIndex}`} className="relative pl-9">
                                                    <dt className="inline font-semibold text-gray-900">
                                                        <subItem.icon
                                                            aria-hidden="true"
                                                            className="absolute left-1 top-1 size-5 text-cyan-600"
                                                        />
                                                        {subItem.title}
                                                    </dt>{' '}
                                                    <dd className="inline">{subItem.content}</dd>
                                                </div>
                                            )
                                        })}
                                    </dl>
                                )}
                            </div>
                        </div>

                        <item.animation isRight={true} />
                    </TabPanel>
                )
            })}
        </Fragment>
    )
}
