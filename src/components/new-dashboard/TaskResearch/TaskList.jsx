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
                        {...(item.enabled && { tooltip: 'Enabled' })}
                    />
                )
            })}
        </ul>
    )
}

export default TaskList
