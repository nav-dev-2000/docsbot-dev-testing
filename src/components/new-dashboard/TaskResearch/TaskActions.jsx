import { useState } from 'react'

import Tooltip from '@/components/Tooltip'
import IconButton from '@new-dashboard/IconButton'
import TaskDialog from './TaskDialog'

import { CheckIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline'

const TaskActions = ({ botId, jobId, canModify, isDeleting, onDelete }) => {
    const [copied, setCopied] = useState(false)
    const [isDeleteOpen, setDeleteOpen] = useState(false)

    const deleteTooltip = isDeleting ? 'Deleting...' : 'Delete Research Task'

    const shareTooltip = copied ? 'Copied!' : 'Copy Task Link'
    const shareIcon = copied ? CheckIcon : ShareIcon
    const isShareDisabled = copied || !botId || !jobId

    const handleCopyTaskLink = () => {
        if (!botId || !jobId) return

        const taskUrl = `${window.location.origin}/app/bots/${botId}/research?jobId=${jobId}`
        navigator.clipboard.writeText(taskUrl)

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDeleteClick = () => {
        if (isDeleting) return
        setDeleteOpen(true)
    }

    const handleConfirmDelete = () => {
        if (isDeleting) return
        setDeleteOpen(false)
        onDelete?.()
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip content={shareTooltip}>
                <IconButton
                    label="Share Research Task"
                    icon={shareIcon}
                    onClick={handleCopyTaskLink}
                    disabled={isShareDisabled}
                />
            </Tooltip>

            {canModify && (
                <Tooltip content={deleteTooltip}>
                    <IconButton
                        label="Delete Research Task"
                        theme="red"
                        icon={TrashIcon}
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="hover:text-red-600"
                    />
                </Tooltip>
            )}

            <TaskDialog
                isOpen={isDeleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                isConfirming={isDeleting}
            />
        </div>
    )
}

export default TaskActions
