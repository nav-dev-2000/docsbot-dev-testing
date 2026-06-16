import TaskItem from './TaskItem'
import { DocumentIcon } from '@heroicons/react/24/outline'

const TaskList = ({ data }) => {
    const items = Array.isArray(data) ? data : data ? [data] : []

    return (
        <ul className="flex flex-col gap-2">
            {items.map((item, index) => {
                const uniqueId = item.id || `research-task-${index}`

                return (
                    <TaskItem
                        key={uniqueId}
                        content={item.label}
                        icon={item.icon}
                        {...(item.enabled && { theme: 'active' })}
                        tooltip={item.tooltip || (item.enabled ? 'Enabled' : null)}
                    />
                )
            })}
        </ul>
    )
}

export default TaskList
