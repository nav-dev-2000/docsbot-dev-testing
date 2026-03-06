import { useContext } from 'react'
import clsx from 'clsx'

import Note from '@new-dashboard/Note'
import Button from '@new-dashboard/Button'
import { WidgetContext } from './Widget'

import { RobotAnimationThinking } from '@/components/RobotAnimation'

const WidgetBody = ({
    emptyLabel,
    emptyLink,
    children,
    className,
    ...props
}) => {
    const { size } = useContext(WidgetContext)
    const isSmall = size === 'sm'

    const emptyContent = emptyLabel && (
        <div className="flex h-full min-h-0 flex-col items-center justify-between gap-6 py-2">
            <Note
                size="md"
                color="blue"
                className="flex flex-col md:flex-row w-full flex-none md:items-center md:justify-between gap-4"
            >
                <p>{emptyLabel}</p>

                {emptyLink && (
                    <Button
                        href={emptyLink}
                        theme="blue"
                        label="Configure Custom Instructions"
                        className="self-start"
                    />
                )}
            </Note>

            <RobotAnimationThinking
                className="h-auto md:h-full max-h-full w-[60%] md:w-auto flex-1"
                aria-hidden="true"
            />
        </div>
    )

    return (
        <div
            className={clsx(
                'relative min-h-0 flex-1 overflow-y-auto pb-8',
                isSmall ? 'p-4' : 'p-6',
                className,
            )}
            {...props}
        >
            {emptyLabel ? emptyContent : children}
        </div>
    )
}

export default WidgetBody
