import { useCallback, useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

import TaskUser from './TaskUser'
import TaskList from './TaskList'
import TaskActions from './TaskActions'
import { auth } from '@/config/firebase-ui.config'
import { canUserEditBot } from '@/utils/function.utils'
import {
    CodeBracketSquareIcon,
    DocumentIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline'

const getUserFromMetadata = (metadata) => {
    if (!metadata) return null

    const name = metadata?.name || metadata?.email || 'User'
    const email = metadata?.email || null

    return {
        name,
        email,
        avatar: null,
        profile: email ? `mailto:${email}` : '#',
    }
}

const getListData = (data) => [
    {
        label: 'Document Search',
        icon: DocumentIcon,
        enabled: true,
    },
    {
        label: 'Web Search',
        icon: GlobeAltIcon,
        enabled: Boolean(data?.webSearch),
    },
    {
        label: 'Code Interpreter',
        icon: CodeBracketSquareIcon,
        enabled: Boolean(data?.codeInterpreter),
    },
]

const TaskResearch = ({ user, data, team, bot, onDelete, onError }) => {
    const [currentUser] = useAuthState(auth)
    const [canModify, setCanModify] = useState(false)
    const [deletingJobId, setDeletingJobId] = useState(null)

    const taskItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
          ? data.tasks
          : getListData(data)

    const hasUserMetadata = Boolean(
        data?.metadata?.name || data?.metadata?.email,
    )

    const resolvedUser =
        user || (hasUserMetadata ? getUserFromMetadata(data?.metadata) : null)

    const jobId = data?.jobId
    const canDelete = canModify && Boolean(jobId)
    const isDeleting = deletingJobId === jobId

    useEffect(() => {
        if (!team || !currentUser) {
            setCanModify(false)
            return
        }

        setCanModify(canUserEditBot(team, currentUser.uid))
    }, [team, currentUser])

    const deleteJob = useCallback(async () => {
        if (!canDelete || !team?.id || !bot?.id || isDeleting) return

        setDeletingJobId(jobId)

        try {
            const response = await fetch(
                `/api/teams/${team.id}/bots/${bot.id}/research/${jobId}`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                },
            )

            if (response.ok) {
                onDelete?.(jobId)
            } else {
                let message = 'Failed to delete deep research task'

                try {
                    const responseData = await response.json()
                    message =
                        responseData.error || responseData.message || message
                } catch (_error) {
                    // ignore parsing errors
                }

                onError?.(message)
            }
        } catch (error) {
            console.warn('Error deleting deep research task:', error)
            onError?.('Failed to delete deep research task')
        } finally {
            setDeletingJobId(null)
        }
    }, [bot?.id, canDelete, isDeleting, jobId, onDelete, onError, team?.id])

    return (
        <div className="flex flex-col gap-3">
            {resolvedUser && (
                <>
                    <TaskUser data={resolvedUser} />
                    <hr className="border-gray-200" />
                </>
            )}
            <TaskList data={taskItems} />
            <hr className="border-gray-200" />
            <TaskActions
                canModify={canDelete}
                isDeleting={isDeleting}
                onDelete={deleteJob}
                botId={bot?.id}
                jobId={jobId}
            />
        </div>
    )
}

export default TaskResearch
