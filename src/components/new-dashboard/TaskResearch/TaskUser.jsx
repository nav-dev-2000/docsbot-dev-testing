import { useState } from 'react'

import UserAvatar from '@/components/UserAvatar'
import Tooltip from '@/components/Tooltip'

const TaskUser = ({ data }) => {
    const name = data?.name || data?.email || 'User'
    const email = data?.email || null
    const [emailCopied, setEmailCopied] = useState(false)

    const copyUserEmail = () => {
        if (!email) return

        navigator.clipboard.writeText(email)
        setEmailCopied(true)

        setTimeout(() => {
            setEmailCopied(false)
        }, 2000)
    }

    const nameButton = (
        <button
            type="button"
            className="text-gray-800 hover:text-cyan-600 disabled:cursor-not-allowed disabled:text-gray-400"
            onClick={copyUserEmail}
            disabled={emailCopied}
        >
            {name}
        </button>
    )

    return (
        <div className="relative truncate pl-6 text-xs font-medium text-gray-500">
            <UserAvatar
                alias={name}
                email={email}
                className="absolute left-0 top-1/2 block size-4 -translate-y-1/2 rounded-full"
                aria-hidden="true"
            />
            Researched by&nbsp;
            {email ? (
                <Tooltip content={`<small>Click to copy email</small>`}>
                    {nameButton}
                </Tooltip>
            ) : (
                <span className="text-gray-800">{name}</span>
            )}
        </div>
    )
}

export default TaskUser
