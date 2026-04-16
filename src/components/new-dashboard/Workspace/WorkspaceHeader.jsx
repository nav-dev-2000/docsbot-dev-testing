import React, { Fragment } from 'react'
import { Title, Paragraph } from '@/components/Typography'
import Note from '@new-dashboard/Note'
import clsx from 'clsx'

const WorkspaceHeader = ({ title, description, note, className, children }) => {
    const hasChildren = React.Children.count(children) > 0 ? true : false
    const Component = hasChildren ? 'div' : Fragment

    return (
        <div
            className={clsx(
                'w-full flex flex-col gap-2',
                className,
            )}
            data-component="workspace-header"
        >
            <Component
                {...(hasChildren && {
                    className: 'flex items-center gap-4',
                })}
            >
                <Title
                    tagName="h2"
                    {...(hasChildren && {
                        className: 'flex-1',
                    })}
                >
                    {title}
                </Title>

                {hasChildren && (
                    <div className="flex flex-none items-center gap-2">
                        {children}
                    </div>
                )}
            </Component>

            {description && <Paragraph className="-mt-2">{description}</Paragraph>}

            {note && (
                <Note size="md" color="yellow">
                    {note}
                </Note>
            )}
        </div>
    )
}

export default WorkspaceHeader
