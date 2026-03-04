import { Fragment } from 'react'
import clsx from 'clsx'

const WorkspaceContent = ({ data, activeId, hasPattern: propHasPattern }) => {
    if (!data) return null

    const activeItem = data.find(
        (item, index) => (item.id || index) === activeId,
    )
    const showPattern = propHasPattern ?? activeItem?.hasPattern

    const isChat = activeId === 'chat'

    return (
        <div
            className={clsx(
                "min-h-0 flex flex-1 flex-col overflow-y-auto",
                isChat ? 'bg-white' : 'bg-gray-50',
                {
                    ["bg-[url('/images/grid-bots.png')] bg-repeat"]: showPattern && !isChat,
                },
            )}
            {...(showPattern && {
                style: {
                    backgroundSize: '64px',
                }
            })}
            data-component="workspace-content"
        >
            {data.map((item, index) => {
                const uniqueId = item.id || index
                const isActive = activeId === uniqueId

                return (
                    isActive && (
                        <Fragment key={`workspace-content-${uniqueId}`}>
                            {item.content}
                        </Fragment>
                    )
                )
            })}
        </div>
    )
}

export default WorkspaceContent
