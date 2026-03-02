import { useState } from 'react'
import WorkspaceTabs from './WorkspaceTabs.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import clsx from 'clsx'

const Workspace = ({
    data,
    activeId: propActiveId,
    setActiveId: propSetActiveId,
    hasPattern = false,
    isVertical = false,
}) => {
    const [internalActiveId, setInternalActiveId] = useState(
        data && data[0]?.id,
    )

    const activeId = propActiveId || internalActiveId
    const setActiveId = propSetActiveId || setInternalActiveId

    return (
        <div
            className={clsx(
                'relative flex flex-1',
                {
                    ['h-full min-h-0 gap-4 p-4']: isVertical,
                    ['min-h-0 flex-col']: !isVertical,
                },
            )}
            data-component="workspace"
        >
            <WorkspaceTabs
                data={data}
                activeId={activeId}
                setActiveId={setActiveId}
                isVertical={isVertical}
            />
            <WorkspaceContent
                data={data}
                activeId={activeId}
                hasPattern={hasPattern}
            />
        </div>
    )
}

export default Workspace
