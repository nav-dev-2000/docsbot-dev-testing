'use client'

import { useState, useId } from 'react'
import clsx from 'clsx'

const TabsButton = ({ id, label, isActive = false, className, ...props }) => {
    const reactId = useId()
    const uniqueId =
        id || `${reactId}-${(label || '').toLowerCase().replace(/\s+/g, '-')}`

    return (
        <button
            id={`tab-${uniqueId}`}
            type="button"
            role="tab"
            className={clsx(
                'border-b-2 pb-4 text-sm font-medium',
                {
                    ['pointer-events-none border-cyan-600 text-cyan-600']:
                        isActive === true,
                    ['border-transparent text-gray-500 hover:text-cyan-600']:
                        isActive === false,
                },
                className,
            )}
            aria-selected={isActive}
            aria-controls={`tabpanel-${uniqueId}`}
            {...(isActive && { tabIndex: -1 })}
            {...props}
        >
            {label}
        </button>
    )
}

const TabContent = ({
    id,
    label,
    isActive = false,
    className,
    children,
    ...props
}) => {
    const reactId = useId()
    const uniqueId =
        id || `${reactId}-${(label || '').toLowerCase().replace(/\s+/g, '-')}`

    return (
        <div
            id={`tabpanel-${uniqueId}`}
            role="tabpanel"
            className={clsx(
                'h-full overflow-y-auto p-6',
                {
                    ['hidden']: isActive === false,
                },
                className,
            )}
            aria-labelledby={`tab-${uniqueId}`}
            {...props}
        >
            {children}
        </div>
    )
}

const AppearanceTabs = ({ title, titleId, data, className }) => {
    const reactId = useId()
    const uniqueId = titleId || `${reactId}-appearance-tabs-title`
    const [currentTab, setCurrentTab] = useState(0)

    return (
        <div className={clsx('flex h-full min-h-0 flex-col', className)}>
            {title && titleId && (
                <h3 id={uniqueId} className="sr-only">
                    {title}
                </h3>
            )}

            <div
                role="tablist"
                aria-labelledby="tablist-1"
                className="flex flex-shrink-0 items-center gap-6 border-b border-gray-200 px-6"
                {...(titleId && { 'aria-labelledby': titleId })}
            >
                {data?.map((tab, index) => {
                    return (
                        <TabsButton
                            key={`appearance-tab-button-${index}`}
                            id={tab.id}
                            label={tab.title}
                            isActive={index === currentTab}
                            onClick={() => setCurrentTab(index)}
                        />
                    )
                })}
            </div>

            <div className="min-h-0 flex-1">
                {data?.map((tab, index) => {
                    return (
                        <TabContent
                            key={`appearance-tab-content-${index}`}
                            id={tab.id}
                            label={tab.title}
                            isActive={index === currentTab}
                        >
                            {tab.content}
                        </TabContent>
                    )
                })}
            </div>
        </div>
    )
}

export default AppearanceTabs
