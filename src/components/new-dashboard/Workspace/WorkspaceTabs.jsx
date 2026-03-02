import TopBar from '@new-dashboard/TopBar'
import WorkspaceButton from './WorkspaceButton'
import { useRouter } from 'next/router'

const WorkspaceTabs = ({ data, activeId, setActiveId, isVertical = false }) => {
    const router = useRouter()
    const activeItem = data?.find(
        (item, index) => (item.id || index) === activeId,
    )
    const activeOptions = Array.isArray(activeItem?.options)
        ? activeItem.options
        : []
    const shouldShowOptions = !isVertical && activeOptions.length > 0

    if (isVertical) {
        return (
            <div className="min-h-0 w-full max-w-[180px] flex-none space-y-2">
                {data.map((item, index) => {
                    const uniqueId = item.id || index
                    const isActive = activeId === uniqueId

                    const handleTabClick = (e) => {
                        // If the href is just a query param change on the same page, handle it with setActiveId
                        const currentPath = router.asPath.split('?')[0]
                        const targetPath = item.href
                            ? item.href.split('?')[0]
                            : null
                        const isSamePage =
                            targetPath === currentPath ||
                            (item.href && item.href.startsWith('?'))

                        if (!item.href || item.href === '#' || isSamePage) {
                            if (setActiveId) {
                                e.preventDefault()
                                setActiveId(uniqueId)
                            }
                        }
                    }

                    return (
                        <WorkspaceButton
                            key={`workspace-${uniqueId}`}
                            label={item.title}
                            icon={item.icon}
                            isActive={isActive}
                            href={item.href}
                            isVertical={isVertical}
                            onClick={handleTabClick}
                        />
                    )
                })}
            </div>
        )
    }

    if (!shouldShowOptions) {
        return null
    }

    return (
        <TopBar.Box
            hasBorder
            className="z-10 !h-10 overflow-x-auto border-b border-gray-200 px-4 transition-all duration-300 ease-in-out md:!h-14"
        >
            {activeOptions.map((option) => {
                const {
                    name,
                    onClick,
                    href,
                    className: optionClassName,
                    isActive,
                    shallow,
                    wizardId,
                    ...rest
                } = option

                const handleOptionClick = (event) => {
                    if (!onClick) return
                    event.preventDefault()
                    onClick(event)
                }

                return (
                    <WorkspaceButton
                        key={`workspace-option-${name}`}
                        label={name}
                        isActive={isActive}
                        href={href}
                        shallow={shallow}
                        onClick={handleOptionClick}
                        className={optionClassName}
                        data-wizard={option.wizardId}
                        {...rest}
                    />
                )
            })}
        </TopBar.Box>
    )
}

export default WorkspaceTabs
