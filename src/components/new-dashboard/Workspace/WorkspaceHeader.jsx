import React, { Fragment } from 'react'
import { Title, Paragraph } from '@/components/Typography'
import Note from '@new-dashboard/Note'

const WorkspaceHeader = ({ title, description, note, children }) => {
    const hasChildren = React.Children.count(children) > 0 ? true : false
    const Component = hasChildren ? 'div' : Fragment

    return (
        <div className="w-full flex flex-col gap-2" data-component="workspace-header">
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

            {description && <Paragraph>{description}</Paragraph>}

            {note && (
                <Note size="md" color="yellow">
                    {note}
                </Note>
            )}
        </div>
    )
}

export default WorkspaceHeader
