import { Fragment, useId, useState } from 'react'
import clsx from 'clsx'

import AccordionsBody from './AccordionsBody'
import AccordionsHead from './AccordionsHead'
import AccordionsSkeleton from './AccordionsSkeleton'

const Accordions = ({
    data,
    isBoxed = true,
    className,
    isLoading = false,
    skeletonItems = 3,
    openId: controlledOpenId,
    onToggle,
}) => {
    const uniqueId = useId()
    const groupId = `accordion-group-${uniqueId}`
    const [internalOpenId, setInternalOpenId] = useState(null)

    const isControlled = controlledOpenId !== undefined
    const openId = isControlled ? controlledOpenId : internalOpenId

    if (isLoading) {
        return (
            <AccordionsSkeleton
                items={skeletonItems}
                isBoxed={isBoxed}
                className={className}
            />
        )
    }

    const dataLength = data?.length || null

    const handleToggle = (id) => {
        if (isControlled) {
            onToggle && onToggle(openId === id ? null : id)
        } else {
            setInternalOpenId((prev) => (prev === id ? null : id))
        }
    }

    return (
        <div
            id={groupId}
            className={clsx(
                'border-gray-200',
                {
                    ['border']: isBoxed,
                    ['border-y']: !isBoxed,
                },
                className,
            )}
        >
            {data?.map((item, index) => {
                const itemId = item.id || `${uniqueId}-${index}`
                const isOpen = openId === itemId
                const isLast = index + 1 === dataLength

                return (
                    <Fragment key={`accordion-group-${index}`}>
                        <AccordionsHead
                            id={itemId}
                            title={item.title}
                            status={item.status}
                            statusIcon={item.statusIcon}
                            statusClassName={item.statusClassName}
                            isOpen={isOpen}
                            isLast={isLast}
                            onClick={() => {
                                handleToggle(itemId)
                                if (item.onClick) item.onClick()
                            }}
                        />
                        <AccordionsBody
                            id={itemId}
                            isOpen={isOpen}
                            isLast={isLast}
                        >
                            {item.content}
                        </AccordionsBody>
                    </Fragment>
                )
            })}
        </div>
    )
}

export default Accordions
