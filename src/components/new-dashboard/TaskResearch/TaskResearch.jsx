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
    SparklesIcon,
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

const parseUsageNumber = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

const formatUsageNumber = (value, options = {}) => {
    const number = parseUsageNumber(value)
    if (number === null) return null

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
        ...options,
    }).format(number)
}

const formatAiCredits = (value) => {
    const number = parseUsageNumber(value)
    if (number === null) return null

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: number > 0 && number < 10 ? 1 : 0,
        maximumFractionDigits: number > 0 && number < 10 ? 1 : 0,
    }).format(number)
}

const buildUsageTooltip = (data) => {
    const tokenUsage = data?.tokenUsage || {}
    const details = [
        tokenUsage.totalTokens ?? tokenUsage.total_tokens
            ? `${formatUsageNumber(tokenUsage.totalTokens ?? tokenUsage.total_tokens)} tokens`
            : null,
        data?.webSearchCallCount
            ? `${formatUsageNumber(data.webSearchCallCount)} web search call${
                  data.webSearchCallCount === 1 ? '' : 's'
              }`
            : null,
        data?.codeInterpreterCallCount
            ? `${formatUsageNumber(data.codeInterpreterCallCount)} code interpreter call${
                  data.codeInterpreterCallCount === 1 ? '' : 's'
              }`
            : null,
    ].filter(Boolean)

    return details.length > 0 ? details.join('<br/>') : 'AI credits used'
}

const getListData = (data) => {
    const items = [
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

    const credits = parseUsageNumber(data?.aiCredits)
    if (credits !== null && credits > 0) {
        items.push({
            label: `${formatAiCredits(credits)} AI Credits`,
            icon: SparklesIcon,
            enabled: true,
            tooltip: buildUsageTooltip(data),
        })
    }

    return items
}

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
